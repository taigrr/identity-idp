import * as cdk from 'aws-cdk-lib';
import * as ec2 from 'aws-cdk-lib/aws-ec2';
import * as logs from 'aws-cdk-lib/aws-logs';
import { Construct } from 'constructs';

export interface NetworkStackProps extends cdk.StackProps {
  envName: string;
}

/**
 * Network Stack - VPC and security groups for FedRAMP compliance
 *
 * FedRAMP controls addressed:
 * - SC-7: Boundary Protection (VPC isolation, security groups)
 * - AC-4: Information Flow Enforcement (NACLs, security groups)
 * - SC-8: Transmission Confidentiality (private subnets)
 */
export class NetworkStack extends cdk.Stack {
  public readonly vpc: ec2.Vpc;
  public readonly databaseSecurityGroup: ec2.SecurityGroup;
  public readonly cacheSecurityGroup: ec2.SecurityGroup;
  public readonly appSecurityGroup: ec2.SecurityGroup;
  public readonly albSecurityGroup: ec2.SecurityGroup;

  constructor(scope: Construct, id: string, props: NetworkStackProps) {
    super(scope, id, props);

    const { envName } = props;

    // VPC with public, private, and isolated subnets across 3 AZs
    this.vpc = new ec2.Vpc(this, 'Vpc', {
      vpcName: `login-gov-idp-${envName}`,
      maxAzs: 3,
      ipAddresses: ec2.IpAddresses.cidr('10.0.0.0/16'),
      
      subnetConfiguration: [
        {
          name: 'Public',
          subnetType: ec2.SubnetType.PUBLIC,
          cidrMask: 24,
          mapPublicIpOnLaunch: false,
        },
        {
          name: 'Private',
          subnetType: ec2.SubnetType.PRIVATE_WITH_EGRESS,
          cidrMask: 24,
        },
        {
          name: 'Isolated',
          subnetType: ec2.SubnetType.PRIVATE_ISOLATED,
          cidrMask: 24,
        },
      ],

      // NAT Gateways for private subnet egress
      natGateways: envName === 'prod' ? 3 : 1,

      // Enable DNS hostnames for RDS
      enableDnsHostnames: true,
      enableDnsSupport: true,

      // Flow logs for FedRAMP AU-2 (Audit Events)
      flowLogs: {
        cloudwatch: {
          destination: ec2.FlowLogDestination.toCloudWatchLogs(
            new logs.LogGroup(this, 'VpcFlowLogs', {
              logGroupName: `/aws/vpc/login-gov-idp-${envName}/flow-logs`,
              retention: logs.RetentionDays.ONE_YEAR,
              removalPolicy: cdk.RemovalPolicy.RETAIN,
            })
          ),
          trafficType: ec2.FlowLogTrafficType.ALL,
        },
      },
    });

    // ALB Security Group - allows HTTPS from anywhere
    this.albSecurityGroup = new ec2.SecurityGroup(this, 'AlbSecurityGroup', {
      vpc: this.vpc,
      securityGroupName: `login-gov-idp-${envName}-alb`,
      description: 'Security group for Application Load Balancer',
      allowAllOutbound: false,
    });

    this.albSecurityGroup.addIngressRule(
      ec2.Peer.anyIpv4(),
      ec2.Port.tcp(443),
      'Allow HTTPS from anywhere'
    );

    // App Security Group - allows traffic from ALB only
    this.appSecurityGroup = new ec2.SecurityGroup(this, 'AppSecurityGroup', {
      vpc: this.vpc,
      securityGroupName: `login-gov-idp-${envName}-app`,
      description: 'Security group for application containers',
      allowAllOutbound: true,
    });

    this.appSecurityGroup.addIngressRule(
      this.albSecurityGroup,
      ec2.Port.tcp(3000),
      'Allow traffic from ALB'
    );

    // Database Security Group - allows traffic from app only
    this.databaseSecurityGroup = new ec2.SecurityGroup(this, 'DatabaseSecurityGroup', {
      vpc: this.vpc,
      securityGroupName: `login-gov-idp-${envName}-database`,
      description: 'Security group for RDS PostgreSQL',
      allowAllOutbound: false,
    });

    this.databaseSecurityGroup.addIngressRule(
      this.appSecurityGroup,
      ec2.Port.tcp(5432),
      'Allow PostgreSQL from app'
    );

    // Cache Security Group - allows traffic from app only
    this.cacheSecurityGroup = new ec2.SecurityGroup(this, 'CacheSecurityGroup', {
      vpc: this.vpc,
      securityGroupName: `login-gov-idp-${envName}-cache`,
      description: 'Security group for ElastiCache Redis',
      allowAllOutbound: false,
    });

    this.cacheSecurityGroup.addIngressRule(
      this.appSecurityGroup,
      ec2.Port.tcp(6379),
      'Allow Redis from app'
    );

    // VPC Endpoints for AWS services (keeps traffic off public internet)
    // Required for FedRAMP SC-7 boundary protection

    // S3 Gateway Endpoint (free)
    this.vpc.addGatewayEndpoint('S3Endpoint', {
      service: ec2.GatewayVpcEndpointAwsService.S3,
    });

    // Interface endpoints for private AWS API access
    const interfaceEndpoints = [
      { name: 'ecr-api', service: ec2.InterfaceVpcEndpointAwsService.ECR },
      { name: 'ecr-dkr', service: ec2.InterfaceVpcEndpointAwsService.ECR_DOCKER },
      { name: 'logs', service: ec2.InterfaceVpcEndpointAwsService.CLOUDWATCH_LOGS },
      { name: 'kms', service: ec2.InterfaceVpcEndpointAwsService.KMS },
      { name: 'secretsmanager', service: ec2.InterfaceVpcEndpointAwsService.SECRETS_MANAGER },
      { name: 'ssm', service: ec2.InterfaceVpcEndpointAwsService.SSM },
    ];

    for (const endpoint of interfaceEndpoints) {
      this.vpc.addInterfaceEndpoint(`${endpoint.name}Endpoint`, {
        service: endpoint.service,
        privateDnsEnabled: true,
        subnets: { subnetType: ec2.SubnetType.PRIVATE_WITH_EGRESS },
      });
    }

    // Outputs
    new cdk.CfnOutput(this, 'VpcId', {
      value: this.vpc.vpcId,
      description: 'VPC ID',
      exportName: `${envName}-VpcId`,
    });

    new cdk.CfnOutput(this, 'PrivateSubnetIds', {
      value: this.vpc.privateSubnets.map(s => s.subnetId).join(','),
      description: 'Private subnet IDs',
      exportName: `${envName}-PrivateSubnetIds`,
    });

    new cdk.CfnOutput(this, 'IsolatedSubnetIds', {
      value: this.vpc.isolatedSubnets.map(s => s.subnetId).join(','),
      description: 'Isolated subnet IDs (for databases)',
      exportName: `${envName}-IsolatedSubnetIds`,
    });
  }
}
