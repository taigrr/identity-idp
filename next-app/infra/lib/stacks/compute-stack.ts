import * as cdk from 'aws-cdk-lib';
import * as ec2 from 'aws-cdk-lib/aws-ec2';
import * as ecs from 'aws-cdk-lib/aws-ecs';
import * as ecr from 'aws-cdk-lib/aws-ecr';
import * as iam from 'aws-cdk-lib/aws-iam';
import * as kms from 'aws-cdk-lib/aws-kms';
import * as logs from 'aws-cdk-lib/aws-logs';
import * as secretsmanager from 'aws-cdk-lib/aws-secretsmanager';
import * as rds from 'aws-cdk-lib/aws-rds';
import * as elasticache from 'aws-cdk-lib/aws-elasticache';
import * as elbv2 from 'aws-cdk-lib/aws-elasticloadbalancingv2';
import * as acm from 'aws-cdk-lib/aws-certificatemanager';
import { Construct } from 'constructs';

export interface ComputeStackProps extends cdk.StackProps {
  envName: string;
  vpc: ec2.Vpc;
  appSecurityGroup: ec2.SecurityGroup;
  database: rds.DatabaseInstance;
  databaseSecret: secretsmanager.Secret;
  redisCluster: elasticache.CfnReplicationGroup;
  piiEncryptionKey: kms.Key;
}

/**
 * Compute Stack - ECS Fargate for Next.js application
 *
 * FedRAMP controls addressed:
 * - AC-2: Account Management (IAM roles)
 * - AC-6: Least Privilege (task roles)
 * - AU-2: Audit Events (CloudWatch Logs)
 * - SC-7: Boundary Protection (private subnets)
 * - SC-8: Transmission Confidentiality (HTTPS only)
 */
export class ComputeStack extends cdk.Stack {
  public readonly cluster: ecs.Cluster;
  public readonly service: ecs.FargateService;
  public readonly alb: elbv2.ApplicationLoadBalancer;
  public readonly albArn: string;

  constructor(scope: Construct, id: string, props: ComputeStackProps) {
    super(scope, id, props);

    const { envName, vpc, appSecurityGroup, database, databaseSecret, redisCluster, piiEncryptionKey } = props;

    // ECR Repository for the application
    const repository = new ecr.Repository(this, 'Repository', {
      repositoryName: `login-gov-idp-${envName}`,
      imageScanOnPush: true,
      imageTagMutability: ecr.TagMutability.IMMUTABLE,
      encryption: ecr.RepositoryEncryption.KMS,
      encryptionKey: piiEncryptionKey,
      lifecycleRules: [
        {
          rulePriority: 1,
          description: 'Keep last 30 images',
          maxImageCount: 30,
        },
      ],
      removalPolicy: envName === 'prod' ? cdk.RemovalPolicy.RETAIN : cdk.RemovalPolicy.DESTROY,
    });

    // ECS Cluster
    this.cluster = new ecs.Cluster(this, 'Cluster', {
      clusterName: `login-gov-idp-${envName}`,
      vpc,
      containerInsights: true,
      enableFargateCapacityProviders: true,
    });

    // Task execution role (for pulling images, writing logs)
    const executionRole = new iam.Role(this, 'ExecutionRole', {
      roleName: `login-gov-idp-${envName}-execution`,
      assumedBy: new iam.ServicePrincipal('ecs-tasks.amazonaws.com'),
      managedPolicies: [
        iam.ManagedPolicy.fromAwsManagedPolicyName('service-role/AmazonECSTaskExecutionRolePolicy'),
      ],
    });

    // Grant access to secrets
    databaseSecret.grantRead(executionRole);

    // Task role (for application permissions)
    const taskRole = new iam.Role(this, 'TaskRole', {
      roleName: `login-gov-idp-${envName}-task`,
      assumedBy: new iam.ServicePrincipal('ecs-tasks.amazonaws.com'),
    });

    // Grant KMS permissions for PII encryption/decryption
    piiEncryptionKey.grantEncryptDecrypt(taskRole);

    // Grant S3 permissions for document storage (if needed)
    taskRole.addToPolicy(new iam.PolicyStatement({
      effect: iam.Effect.ALLOW,
      actions: [
        's3:GetObject',
        's3:PutObject',
        's3:DeleteObject',
      ],
      resources: [`arn:aws:s3:::login-gov-idp-${envName}-documents/*`],
    }));

    // Grant SES permissions for sending emails
    taskRole.addToPolicy(new iam.PolicyStatement({
      effect: iam.Effect.ALLOW,
      actions: [
        'ses:SendEmail',
        'ses:SendRawEmail',
      ],
      resources: ['*'],
      conditions: {
        StringEquals: {
          'ses:FromAddress': `noreply@${envName === 'prod' ? 'login.gov' : 'identitysandbox.gov'}`,
        },
      },
    }));

    // Grant SNS/Pinpoint permissions for SMS
    taskRole.addToPolicy(new iam.PolicyStatement({
      effect: iam.Effect.ALLOW,
      actions: [
        'sms-voice:SendTextMessage',
        'sms-voice:SendVoiceMessage',
      ],
      resources: ['*'],
    }));

    // CloudWatch Logs group
    const logGroup = new logs.LogGroup(this, 'LogGroup', {
      logGroupName: `/ecs/login-gov-idp-${envName}`,
      retention: logs.RetentionDays.ONE_YEAR,
      removalPolicy: cdk.RemovalPolicy.RETAIN,
    });

    // Task definition
    const taskDefinition = new ecs.FargateTaskDefinition(this, 'TaskDefinition', {
      family: `login-gov-idp-${envName}`,
      cpu: envName === 'prod' ? 2048 : 512,
      memoryLimitMiB: envName === 'prod' ? 4096 : 1024,
      executionRole,
      taskRole,
      runtimePlatform: {
        cpuArchitecture: ecs.CpuArchitecture.ARM64,
        operatingSystemFamily: ecs.OperatingSystemFamily.LINUX,
      },
    });

    // Main application container
    const container = taskDefinition.addContainer('app', {
      containerName: 'login-gov-idp',
      image: ecs.ContainerImage.fromEcrRepository(repository, 'latest'),
      essential: true,
      
      // Environment variables
      environment: {
        NODE_ENV: envName === 'prod' ? 'production' : 'development',
        PORT: '3000',
        
        // Database connection (host from secret, will be injected)
        DATABASE_HOST: database.dbInstanceEndpointAddress,
        DATABASE_PORT: database.dbInstanceEndpointPort,
        DATABASE_NAME: 'identity_idp',
        
        // Redis connection
        REDIS_HOST: redisCluster.attrConfigurationEndPointAddress,
        REDIS_PORT: redisCluster.attrConfigurationEndPointPort,
        REDIS_TLS: 'true',
        
        // KMS key for PII encryption
        KMS_KEY_ID: piiEncryptionKey.keyId,
        
        // AWS region
        AWS_REGION: this.region,
      },
      
      // Secrets (from Secrets Manager)
      secrets: {
        DATABASE_USERNAME: ecs.Secret.fromSecretsManager(databaseSecret, 'username'),
        DATABASE_PASSWORD: ecs.Secret.fromSecretsManager(databaseSecret, 'password'),
      },
      
      // Logging
      logging: ecs.LogDrivers.awsLogs({
        logGroup,
        streamPrefix: 'app',
      }),
      
      // Health check
      healthCheck: {
        command: ['CMD-SHELL', 'curl -f http://localhost:3000/api/health || exit 1'],
        interval: cdk.Duration.seconds(30),
        timeout: cdk.Duration.seconds(5),
        retries: 3,
        startPeriod: cdk.Duration.seconds(60),
      },
      
      // Port mapping
      portMappings: [
        {
          containerPort: 3000,
          protocol: ecs.Protocol.TCP,
        },
      ],
    });

    // Application Load Balancer
    this.alb = new elbv2.ApplicationLoadBalancer(this, 'ALB', {
      loadBalancerName: `login-gov-idp-${envName}`,
      vpc,
      internetFacing: true,
      securityGroup: appSecurityGroup,
      
      // Enable access logs for audit compliance
      // Note: Requires S3 bucket for logs
    });

    this.albArn = this.alb.loadBalancerArn;

    // HTTPS listener (requires certificate)
    // For now, create HTTP listener; certificate should be imported
    const listener = this.alb.addListener('HttpsListener', {
      port: 443,
      protocol: elbv2.ApplicationProtocol.HTTPS,
      certificates: [
        // Import existing certificate or create new one
        // elbv2.ListenerCertificate.fromArn(certificateArn),
      ],
      sslPolicy: elbv2.SslPolicy.TLS13_RES,
    });

    // Target group
    const targetGroup = new elbv2.ApplicationTargetGroup(this, 'TargetGroup', {
      targetGroupName: `login-gov-idp-${envName}`,
      vpc,
      port: 3000,
      protocol: elbv2.ApplicationProtocol.HTTP,
      targetType: elbv2.TargetType.IP,
      healthCheck: {
        path: '/api/health',
        interval: cdk.Duration.seconds(30),
        timeout: cdk.Duration.seconds(5),
        healthyThresholdCount: 2,
        unhealthyThresholdCount: 3,
        healthyHttpCodes: '200',
      },
      deregistrationDelay: cdk.Duration.seconds(30),
    });

    listener.addTargetGroups('DefaultTargetGroup', {
      targetGroups: [targetGroup],
    });

    // HTTP to HTTPS redirect
    this.alb.addListener('HttpListener', {
      port: 80,
      defaultAction: elbv2.ListenerAction.redirect({
        port: '443',
        protocol: elbv2.ApplicationProtocol.HTTPS,
        permanent: true,
      }),
    });

    // Fargate service
    this.service = new ecs.FargateService(this, 'Service', {
      serviceName: `login-gov-idp-${envName}`,
      cluster: this.cluster,
      taskDefinition,
      
      // Scaling configuration
      desiredCount: envName === 'prod' ? 3 : 1,
      minHealthyPercent: 100,
      maxHealthyPercent: 200,
      
      // Network configuration
      vpcSubnets: { subnetType: ec2.SubnetType.PRIVATE_WITH_EGRESS },
      securityGroups: [appSecurityGroup],
      assignPublicIp: false,
      
      // Deployment configuration
      circuitBreaker: { rollback: true },
      enableECSManagedTags: true,
      propagateTags: ecs.PropagatedTagSource.SERVICE,
      
      // Capacity provider strategy (use Fargate Spot for cost savings in non-prod)
      capacityProviderStrategies: envName === 'prod'
        ? [{ capacityProvider: 'FARGATE', weight: 1 }]
        : [
            { capacityProvider: 'FARGATE_SPOT', weight: 2 },
            { capacityProvider: 'FARGATE', weight: 1 },
          ],
    });

    // Register with target group
    this.service.attachToApplicationTargetGroup(targetGroup);

    // Auto-scaling
    const scaling = this.service.autoScaleTaskCount({
      minCapacity: envName === 'prod' ? 3 : 1,
      maxCapacity: envName === 'prod' ? 20 : 4,
    });

    scaling.scaleOnCpuUtilization('CpuScaling', {
      targetUtilizationPercent: 70,
      scaleInCooldown: cdk.Duration.seconds(60),
      scaleOutCooldown: cdk.Duration.seconds(60),
    });

    scaling.scaleOnMemoryUtilization('MemoryScaling', {
      targetUtilizationPercent: 80,
      scaleInCooldown: cdk.Duration.seconds(60),
      scaleOutCooldown: cdk.Duration.seconds(60),
    });

    // Outputs
    new cdk.CfnOutput(this, 'ClusterArn', {
      value: this.cluster.clusterArn,
      description: 'ECS Cluster ARN',
      exportName: `${envName}-ClusterArn`,
    });

    new cdk.CfnOutput(this, 'ServiceArn', {
      value: this.service.serviceArn,
      description: 'ECS Service ARN',
      exportName: `${envName}-ServiceArn`,
    });

    new cdk.CfnOutput(this, 'AlbDnsName', {
      value: this.alb.loadBalancerDnsName,
      description: 'ALB DNS Name',
      exportName: `${envName}-AlbDnsName`,
    });

    new cdk.CfnOutput(this, 'RepositoryUri', {
      value: repository.repositoryUri,
      description: 'ECR Repository URI',
      exportName: `${envName}-RepositoryUri`,
    });
  }
}
