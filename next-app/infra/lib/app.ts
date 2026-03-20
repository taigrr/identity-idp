#!/usr/bin/env node
import 'source-map-support/register';
import * as cdk from 'aws-cdk-lib';
import { NetworkStack } from './stacks/network-stack';
import { KmsStack } from './stacks/kms-stack';
import { DatabaseStack } from './stacks/database-stack';
import { CacheStack } from './stacks/cache-stack';
import { ComputeStack } from './stacks/compute-stack';
import { CdnStack } from './stacks/cdn-stack';

const app = new cdk.App();

// Environment configuration
const env = {
  account: process.env.CDK_DEFAULT_ACCOUNT,
  region: process.env.CDK_DEFAULT_REGION || 'us-west-2',
};

// Secondary region for multi-region KMS (disaster recovery)
const secondaryEnv = {
  account: process.env.CDK_DEFAULT_ACCOUNT,
  region: 'us-east-1',
};

// Environment name (dev, staging, prod)
const envName = app.node.tryGetContext('env') || 'dev';

// Common tags for FedRAMP compliance
const commonTags = {
  Environment: envName,
  Project: 'login-gov-idp',
  ManagedBy: 'cdk',
  FedRAMPBoundary: 'true',
  DataClassification: 'sensitive',
};

// Apply tags to all resources
Object.entries(commonTags).forEach(([key, value]) => {
  cdk.Tags.of(app).add(key, value);
});

// 1. Network Stack - VPC, subnets, security groups
const networkStack = new NetworkStack(app, `LoginGov-Network-${envName}`, {
  env,
  envName,
  description: 'Login.gov IDP - Network infrastructure (VPC, subnets, security groups)',
});

// 2. KMS Stack - Multi-region encryption keys
const kmsStack = new KmsStack(app, `LoginGov-KMS-${envName}`, {
  env,
  envName,
  description: 'Login.gov IDP - KMS keys for PII encryption',
});

// Secondary region KMS replica
const kmsStackSecondary = new KmsStack(app, `LoginGov-KMS-Secondary-${envName}`, {
  env: secondaryEnv,
  envName,
  isReplica: true,
  primaryKeyArn: kmsStack.piiEncryptionKey.keyArn,
  description: 'Login.gov IDP - KMS keys replica for disaster recovery',
});

// 3. Database Stack - RDS PostgreSQL
const databaseStack = new DatabaseStack(app, `LoginGov-Database-${envName}`, {
  env,
  envName,
  vpc: networkStack.vpc,
  databaseSecurityGroup: networkStack.databaseSecurityGroup,
  kmsKey: kmsStack.databaseEncryptionKey,
  description: 'Login.gov IDP - RDS PostgreSQL database',
});
databaseStack.addDependency(networkStack);
databaseStack.addDependency(kmsStack);

// 4. Cache Stack - ElastiCache Redis
const cacheStack = new CacheStack(app, `LoginGov-Cache-${envName}`, {
  env,
  envName,
  vpc: networkStack.vpc,
  cacheSecurityGroup: networkStack.cacheSecurityGroup,
  kmsKey: kmsStack.cacheEncryptionKey,
  description: 'Login.gov IDP - ElastiCache Redis for sessions',
});
cacheStack.addDependency(networkStack);
cacheStack.addDependency(kmsStack);

// 5. Compute Stack - ECS Fargate
const computeStack = new ComputeStack(app, `LoginGov-Compute-${envName}`, {
  env,
  envName,
  vpc: networkStack.vpc,
  appSecurityGroup: networkStack.appSecurityGroup,
  database: databaseStack.database,
  databaseSecret: databaseStack.databaseSecret,
  redisCluster: cacheStack.redisCluster,
  piiEncryptionKey: kmsStack.piiEncryptionKey,
  description: 'Login.gov IDP - ECS Fargate compute',
});
computeStack.addDependency(databaseStack);
computeStack.addDependency(cacheStack);

// 6. CDN Stack - CloudFront
const cdnStack = new CdnStack(app, `LoginGov-CDN-${envName}`, {
  env,
  envName,
  albArn: computeStack.albArn,
  description: 'Login.gov IDP - CloudFront CDN',
});
cdnStack.addDependency(computeStack);

app.synth();
