import * as cdk from 'aws-cdk-lib';
import * as ec2 from 'aws-cdk-lib/aws-ec2';
import * as rds from 'aws-cdk-lib/aws-rds';
import * as kms from 'aws-cdk-lib/aws-kms';
import * as secretsmanager from 'aws-cdk-lib/aws-secretsmanager';
import * as logs from 'aws-cdk-lib/aws-logs';
import { Construct } from 'constructs';

export interface DatabaseStackProps extends cdk.StackProps {
  envName: string;
  vpc: ec2.Vpc;
  databaseSecurityGroup: ec2.SecurityGroup;
  kmsKey: kms.Key;
}

/**
 * Database Stack - RDS PostgreSQL for FedRAMP compliance
 *
 * FedRAMP controls addressed:
 * - SC-28: Protection of Information at Rest (KMS encryption)
 * - SC-8: Transmission Confidentiality (SSL/TLS required)
 * - AU-2: Audit Events (PostgreSQL logging)
 * - CP-9: Information System Backup (automated backups)
 * - SC-5: Denial of Service Protection (Multi-AZ)
 */
export class DatabaseStack extends cdk.Stack {
  public readonly database: rds.DatabaseInstance;
  public readonly databaseSecret: secretsmanager.Secret;

  constructor(scope: Construct, id: string, props: DatabaseStackProps) {
    super(scope, id, props);

    const { envName, vpc, databaseSecurityGroup, kmsKey } = props;

    // Database credentials stored in Secrets Manager
    this.databaseSecret = new secretsmanager.Secret(this, 'DatabaseSecret', {
      secretName: `login-gov-idp-${envName}/database/credentials`,
      description: 'RDS PostgreSQL credentials for Login.gov IDP',
      generateSecretString: {
        secretStringTemplate: JSON.stringify({ username: 'idp_admin' }),
        generateStringKey: 'password',
        excludePunctuation: true,
        includeSpace: false,
        passwordLength: 32,
      },
    });

    // Parameter group with FedRAMP-compliant settings
    const parameterGroup = new rds.ParameterGroup(this, 'ParameterGroup', {
      engine: rds.DatabaseInstanceEngine.postgres({
        version: rds.PostgresEngineVersion.VER_16_4,
      }),
      description: `Login.gov IDP ${envName} PostgreSQL parameters`,
      parameters: {
        // Enforce SSL connections
        'rds.force_ssl': '1',
        
        // Logging for audit compliance (AU-2)
        'log_connections': '1',
        'log_disconnections': '1',
        'log_statement': 'ddl',
        'log_min_duration_statement': '1000', // Log queries > 1s
        
        // Connection settings
        'max_connections': envName === 'prod' ? '500' : '100',
        
        // Performance settings
        'shared_buffers': '{DBInstanceClassMemory/4}',
        'effective_cache_size': '{DBInstanceClassMemory*3/4}',
        'maintenance_work_mem': '{DBInstanceClassMemory/16}',
        'work_mem': '{DBInstanceClassMemory/64}',
        
        // WAL settings for durability
        'synchronous_commit': 'on',
        'wal_level': 'replica',
        
        // Enable pg_stat_statements (used by app)
        'shared_preload_libraries': 'pg_stat_statements',
        'pg_stat_statements.track': 'all',
      },
    });

    // Instance size based on environment
    const instanceType = envName === 'prod'
      ? ec2.InstanceType.of(ec2.InstanceClass.R6G, ec2.InstanceSize.XLARGE)
      : ec2.InstanceType.of(ec2.InstanceClass.T4G, ec2.InstanceSize.MEDIUM);

    // RDS PostgreSQL instance
    this.database = new rds.DatabaseInstance(this, 'Database', {
      engine: rds.DatabaseInstanceEngine.postgres({
        version: rds.PostgresEngineVersion.VER_16_4,
      }),
      instanceIdentifier: `login-gov-idp-${envName}`,
      databaseName: 'identity_idp',
      
      // Credentials from Secrets Manager
      credentials: rds.Credentials.fromSecret(this.databaseSecret),
      
      // Instance configuration
      instanceType,
      parameterGroup,
      
      // Storage configuration
      allocatedStorage: envName === 'prod' ? 500 : 50,
      maxAllocatedStorage: envName === 'prod' ? 2000 : 200,
      storageType: rds.StorageType.GP3,
      storageThroughput: envName === 'prod' ? 500 : 125,
      iops: envName === 'prod' ? 12000 : 3000,
      
      // Encryption (SC-28)
      storageEncrypted: true,
      storageEncryptionKey: kmsKey,
      
      // Network configuration
      vpc,
      vpcSubnets: { subnetType: ec2.SubnetType.PRIVATE_ISOLATED },
      securityGroups: [databaseSecurityGroup],
      publiclyAccessible: false,
      
      // High availability (SC-5, CP-9)
      multiAz: envName === 'prod',
      
      // Backup configuration (CP-9)
      backupRetention: cdk.Duration.days(envName === 'prod' ? 35 : 7),
      preferredBackupWindow: '03:00-04:00',
      preferredMaintenanceWindow: 'sun:04:00-sun:05:00',
      deleteAutomatedBackups: envName !== 'prod',
      
      // Deletion protection
      deletionProtection: envName === 'prod',
      removalPolicy: envName === 'prod' ? cdk.RemovalPolicy.RETAIN : cdk.RemovalPolicy.DESTROY,
      
      // Monitoring
      enablePerformanceInsights: true,
      performanceInsightRetention: rds.PerformanceInsightRetention.MONTHS_1,
      monitoringInterval: cdk.Duration.seconds(60),
      cloudwatchLogsExports: ['postgresql', 'upgrade'],
      cloudwatchLogsRetention: logs.RetentionDays.ONE_YEAR,
      
      // Auto minor version upgrades (security patches)
      autoMinorVersionUpgrade: true,
      
      // Enhanced monitoring
      enablePerformanceInsights: true,
    });

    // Read replica for prod (optional, for read scaling)
    if (envName === 'prod') {
      const readReplica = new rds.DatabaseInstanceReadReplica(this, 'ReadReplica', {
        sourceDatabaseInstance: this.database,
        instanceIdentifier: `login-gov-idp-${envName}-replica`,
        instanceType: ec2.InstanceType.of(ec2.InstanceClass.R6G, ec2.InstanceSize.LARGE),
        vpc,
        vpcSubnets: { subnetType: ec2.SubnetType.PRIVATE_ISOLATED },
        securityGroups: [databaseSecurityGroup],
        storageEncrypted: true,
        storageEncryptionKey: kmsKey,
        publiclyAccessible: false,
      });
    }

    // Outputs
    new cdk.CfnOutput(this, 'DatabaseEndpoint', {
      value: this.database.dbInstanceEndpointAddress,
      description: 'Database endpoint',
      exportName: `${envName}-DatabaseEndpoint`,
    });

    new cdk.CfnOutput(this, 'DatabasePort', {
      value: this.database.dbInstanceEndpointPort,
      description: 'Database port',
      exportName: `${envName}-DatabasePort`,
    });

    new cdk.CfnOutput(this, 'DatabaseSecretArn', {
      value: this.databaseSecret.secretArn,
      description: 'Database credentials secret ARN',
      exportName: `${envName}-DatabaseSecretArn`,
    });
  }
}
