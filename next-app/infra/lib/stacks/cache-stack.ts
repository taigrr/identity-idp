import * as cdk from 'aws-cdk-lib';
import * as ec2 from 'aws-cdk-lib/aws-ec2';
import * as elasticache from 'aws-cdk-lib/aws-elasticache';
import * as kms from 'aws-cdk-lib/aws-kms';
import { Construct } from 'constructs';

export interface CacheStackProps extends cdk.StackProps {
  envName: string;
  vpc: ec2.Vpc;
  cacheSecurityGroup: ec2.SecurityGroup;
  kmsKey: kms.Key;
}

/**
 * Cache Stack - ElastiCache Redis for sessions
 *
 * FedRAMP controls addressed:
 * - SC-28: Protection of Information at Rest (encryption at rest)
 * - SC-8: Transmission Confidentiality (encryption in transit)
 * - SC-5: Denial of Service Protection (Multi-AZ)
 */
export class CacheStack extends cdk.Stack {
  public readonly redisCluster: elasticache.CfnReplicationGroup;
  public readonly redisEndpoint: string;

  constructor(scope: Construct, id: string, props: CacheStackProps) {
    super(scope, id, props);

    const { envName, vpc, cacheSecurityGroup, kmsKey } = props;

    // Subnet group for ElastiCache
    const subnetGroup = new elasticache.CfnSubnetGroup(this, 'SubnetGroup', {
      subnetGroupName: `login-gov-idp-${envName}-redis`,
      description: 'Subnet group for Login.gov IDP Redis',
      subnetIds: vpc.isolatedSubnets.map(subnet => subnet.subnetId),
    });

    // Parameter group with optimized settings
    const parameterGroup = new elasticache.CfnParameterGroup(this, 'ParameterGroup', {
      cacheParameterGroupFamily: 'redis7',
      description: `Login.gov IDP ${envName} Redis parameters`,
      properties: {
        // Session management settings
        'maxmemory-policy': 'volatile-lru',
        'timeout': '0',
        'tcp-keepalive': '300',
        
        // Persistence (for session durability)
        'appendonly': 'yes',
        'appendfsync': 'everysec',
      },
    });

    // Node type based on environment
    const nodeType = envName === 'prod' ? 'cache.r6g.large' : 'cache.t4g.micro';
    const numNodeGroups = envName === 'prod' ? 3 : 1;
    const replicasPerNodeGroup = envName === 'prod' ? 2 : 0;

    // Redis replication group (cluster mode)
    this.redisCluster = new elasticache.CfnReplicationGroup(this, 'RedisCluster', {
      replicationGroupId: `login-gov-idp-${envName}`,
      replicationGroupDescription: 'Login.gov IDP Redis cluster for sessions',
      
      // Engine configuration
      engine: 'redis',
      engineVersion: '7.1',
      cacheNodeType: nodeType,
      
      // Cluster configuration
      numNodeGroups,
      replicasPerNodeGroup,
      automaticFailoverEnabled: envName === 'prod',
      multiAzEnabled: envName === 'prod',
      
      // Network configuration
      cacheSubnetGroupName: subnetGroup.ref,
      securityGroupIds: [cacheSecurityGroup.securityGroupId],
      port: 6379,
      
      // Parameter group
      cacheParameterGroupName: parameterGroup.ref,
      
      // Encryption at rest (SC-28)
      atRestEncryptionEnabled: true,
      kmsKeyId: kmsKey.keyId,
      
      // Encryption in transit (SC-8)
      transitEncryptionEnabled: true,
      transitEncryptionMode: 'required',
      
      // Auth token for additional security
      // Note: In production, generate and store this in Secrets Manager
      // authToken: authTokenSecret.secretValue.unsafeUnwrap(),
      
      // Maintenance and backup
      preferredMaintenanceWindow: 'sun:05:00-sun:06:00',
      snapshotRetentionLimit: envName === 'prod' ? 7 : 1,
      snapshotWindow: '04:00-05:00',
      
      // Auto minor version upgrade
      autoMinorVersionUpgrade: true,
      
      // Tags
      tags: [
        { key: 'Name', value: `login-gov-idp-${envName}-redis` },
        { key: 'Environment', value: envName },
      ],
    });

    this.redisCluster.addDependency(subnetGroup);
    this.redisCluster.addDependency(parameterGroup);

    // Store the endpoint
    this.redisEndpoint = this.redisCluster.attrConfigurationEndPointAddress;

    // Outputs
    new cdk.CfnOutput(this, 'RedisEndpoint', {
      value: this.redisCluster.attrConfigurationEndPointAddress,
      description: 'Redis cluster endpoint',
      exportName: `${envName}-RedisEndpoint`,
    });

    new cdk.CfnOutput(this, 'RedisPort', {
      value: this.redisCluster.attrConfigurationEndPointPort,
      description: 'Redis cluster port',
      exportName: `${envName}-RedisPort`,
    });
  }
}
