import * as cdk from 'aws-cdk-lib';
import * as kms from 'aws-cdk-lib/aws-kms';
import * as iam from 'aws-cdk-lib/aws-iam';
import { Construct } from 'constructs';

export interface KmsStackProps extends cdk.StackProps {
  envName: string;
  isReplica?: boolean;
  primaryKeyArn?: string;
}

/**
 * KMS Stack - Encryption keys for FedRAMP compliance
 *
 * FedRAMP controls addressed:
 * - SC-12: Cryptographic Key Establishment and Management
 * - SC-13: Cryptographic Protection
 * - SC-28: Protection of Information at Rest
 *
 * Key hierarchy:
 * - PII Encryption Key: For encrypting sensitive PII (emails, phones, SSNs)
 * - Database Encryption Key: For RDS storage encryption
 * - Cache Encryption Key: For ElastiCache encryption
 * - Secrets Encryption Key: For Secrets Manager
 */
export class KmsStack extends cdk.Stack {
  public readonly piiEncryptionKey: kms.Key;
  public readonly databaseEncryptionKey: kms.Key;
  public readonly cacheEncryptionKey: kms.Key;
  public readonly secretsEncryptionKey: kms.Key;

  constructor(scope: Construct, id: string, props: KmsStackProps) {
    super(scope, id, props);

    const { envName, isReplica = false } = props;

    // Key policy allowing account root and specific services
    const keyPolicy = new iam.PolicyDocument({
      statements: [
        // Allow account root full access (required)
        new iam.PolicyStatement({
          sid: 'AllowRootAccess',
          effect: iam.Effect.ALLOW,
          principals: [new iam.AccountRootPrincipal()],
          actions: ['kms:*'],
          resources: ['*'],
        }),
        // Allow CloudWatch Logs to use the key
        new iam.PolicyStatement({
          sid: 'AllowCloudWatchLogs',
          effect: iam.Effect.ALLOW,
          principals: [
            new iam.ServicePrincipal(`logs.${this.region}.amazonaws.com`),
          ],
          actions: [
            'kms:Encrypt',
            'kms:Decrypt',
            'kms:GenerateDataKey*',
            'kms:DescribeKey',
          ],
          resources: ['*'],
          conditions: {
            ArnLike: {
              'kms:EncryptionContext:aws:logs:arn': `arn:aws:logs:${this.region}:${this.account}:*`,
            },
          },
        }),
      ],
    });

    // PII Encryption Key - for application-level encryption of sensitive data
    // This is the key used by the app to encrypt emails, phones, SSNs, etc.
    this.piiEncryptionKey = new kms.Key(this, 'PiiEncryptionKey', {
      alias: `login-gov-idp-${envName}-pii`,
      description: 'Encrypts PII data (emails, phones, SSNs) in Login.gov IDP',
      enableKeyRotation: true,
      rotationPeriod: cdk.Duration.days(365),
      pendingWindow: cdk.Duration.days(30),
      removalPolicy: envName === 'prod' ? cdk.RemovalPolicy.RETAIN : cdk.RemovalPolicy.DESTROY,
      policy: keyPolicy,
      
      // Multi-region for disaster recovery
      // In prod, we create a multi-region key that can be replicated
      // Note: CDK doesn't fully support MRK yet, so we use standard keys
      // and handle replication separately
    });

    // Database Encryption Key - for RDS storage encryption
    this.databaseEncryptionKey = new kms.Key(this, 'DatabaseEncryptionKey', {
      alias: `login-gov-idp-${envName}-database`,
      description: 'Encrypts RDS PostgreSQL storage for Login.gov IDP',
      enableKeyRotation: true,
      rotationPeriod: cdk.Duration.days(365),
      pendingWindow: cdk.Duration.days(30),
      removalPolicy: envName === 'prod' ? cdk.RemovalPolicy.RETAIN : cdk.RemovalPolicy.DESTROY,
    });

    // Allow RDS to use the database key
    this.databaseEncryptionKey.addToResourcePolicy(
      new iam.PolicyStatement({
        sid: 'AllowRDS',
        effect: iam.Effect.ALLOW,
        principals: [new iam.ServicePrincipal('rds.amazonaws.com')],
        actions: [
          'kms:Encrypt',
          'kms:Decrypt',
          'kms:GenerateDataKey*',
          'kms:DescribeKey',
          'kms:CreateGrant',
        ],
        resources: ['*'],
      })
    );

    // Cache Encryption Key - for ElastiCache encryption
    this.cacheEncryptionKey = new kms.Key(this, 'CacheEncryptionKey', {
      alias: `login-gov-idp-${envName}-cache`,
      description: 'Encrypts ElastiCache Redis for Login.gov IDP',
      enableKeyRotation: true,
      rotationPeriod: cdk.Duration.days(365),
      pendingWindow: cdk.Duration.days(30),
      removalPolicy: envName === 'prod' ? cdk.RemovalPolicy.RETAIN : cdk.RemovalPolicy.DESTROY,
    });

    // Allow ElastiCache to use the cache key
    this.cacheEncryptionKey.addToResourcePolicy(
      new iam.PolicyStatement({
        sid: 'AllowElastiCache',
        effect: iam.Effect.ALLOW,
        principals: [new iam.ServicePrincipal('elasticache.amazonaws.com')],
        actions: [
          'kms:Encrypt',
          'kms:Decrypt',
          'kms:GenerateDataKey*',
          'kms:DescribeKey',
          'kms:CreateGrant',
        ],
        resources: ['*'],
      })
    );

    // Secrets Encryption Key - for Secrets Manager
    this.secretsEncryptionKey = new kms.Key(this, 'SecretsEncryptionKey', {
      alias: `login-gov-idp-${envName}-secrets`,
      description: 'Encrypts secrets in Secrets Manager for Login.gov IDP',
      enableKeyRotation: true,
      rotationPeriod: cdk.Duration.days(365),
      pendingWindow: cdk.Duration.days(30),
      removalPolicy: envName === 'prod' ? cdk.RemovalPolicy.RETAIN : cdk.RemovalPolicy.DESTROY,
    });

    // Outputs
    new cdk.CfnOutput(this, 'PiiKeyArn', {
      value: this.piiEncryptionKey.keyArn,
      description: 'PII Encryption Key ARN',
      exportName: `${envName}-PiiKeyArn`,
    });

    new cdk.CfnOutput(this, 'DatabaseKeyArn', {
      value: this.databaseEncryptionKey.keyArn,
      description: 'Database Encryption Key ARN',
      exportName: `${envName}-DatabaseKeyArn`,
    });

    new cdk.CfnOutput(this, 'CacheKeyArn', {
      value: this.cacheEncryptionKey.keyArn,
      description: 'Cache Encryption Key ARN',
      exportName: `${envName}-CacheKeyArn`,
    });

    new cdk.CfnOutput(this, 'SecretsKeyArn', {
      value: this.secretsEncryptionKey.keyArn,
      description: 'Secrets Encryption Key ARN',
      exportName: `${envName}-SecretsKeyArn`,
    });
  }
}
