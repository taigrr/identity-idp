/**
 * Pinpoint SMS Sender
 * Mirrors: lib/telephony/pinpoint/sms_sender.rb
 */

import {
  PinpointClient,
  SendMessagesCommand,
  PhoneNumberValidateCommand,
  type MessageResponse,
} from '@aws-sdk/client-pinpoint';
import { getTelephonyConfig, type PinpointSmsConfig } from './config';
import {
  ConfigurationError,
  OptOutError,
  PermanentFailureError,
  createErrorFromDeliveryStatus,
} from './errors';
import type { TelephonyResponse, SendMessageParams, PhoneNumberInfo } from './types';

// Client pool per region
const clientPool = new Map<string, PinpointClient>();

function getClient(config: PinpointSmsConfig): PinpointClient {
  const key = `${config.region}:${config.applicationId}`;
  
  if (!clientPool.has(key)) {
    const client = new PinpointClient({
      region: config.region,
      credentials: config.accessKeyId && config.secretAccessKey
        ? {
            accessKeyId: config.accessKeyId,
            secretAccessKey: config.secretAccessKey,
          }
        : undefined,
      maxAttempts: 1,
    });
    clientPool.set(key, client);
  }
  
  return clientPool.get(key)!;
}

/**
 * Build sender configuration based on country
 */
function buildSenderConfig(
  countryCode: string,
  smsConfig: PinpointSmsConfig,
  senderId?: string
): Record<string, string | undefined> {
  const config: Record<string, string | undefined> = {};
  
  if (senderId) {
    config.SenderId = senderId;
  } else if (smsConfig.shortCode) {
    config.OriginationNumber = smsConfig.shortCode;
  } else if (smsConfig.longCodePool && smsConfig.longCodePool.length > 0) {
    // Round-robin selection from pool
    const index = Math.floor(Math.random() * smsConfig.longCodePool.length);
    config.OriginationNumber = smsConfig.longCodePool[index];
  }
  
  return config;
}

/**
 * Build response from Pinpoint result
 */
function buildResponse(
  result: MessageResponse,
  phoneNumber: string,
  startTime: number
): TelephonyResponse {
  const endpointResult = result.Result?.[phoneNumber];
  const durationMs = Date.now() - startTime;
  
  if (!endpointResult) {
    return {
      success: false,
      error: { code: 'NO_RESULT', message: 'No result from Pinpoint', retryable: false },
      extra: { durationMs },
    };
  }
  
  const deliveryStatus = endpointResult.DeliveryStatus;
  const statusCode = endpointResult.StatusCode;
  const statusMessage = endpointResult.StatusMessage;
  const messageId = endpointResult.MessageId;
  
  if (deliveryStatus === 'SUCCESSFUL') {
    return {
      success: true,
      extra: {
        messageId,
        deliveryStatus,
        statusCode,
        statusMessage,
        durationMs,
      },
    };
  }
  
  const error = createErrorFromDeliveryStatus(deliveryStatus || 'UNKNOWN_FAILURE', statusMessage);
  
  return {
    success: false,
    error: error
      ? { code: error.code, message: error.message, retryable: error.retryable }
      : { code: 'UNKNOWN', message: statusMessage || 'Unknown error', retryable: false },
    extra: {
      messageId,
      deliveryStatus,
      statusCode,
      statusMessage,
      durationMs,
    },
  };
}

export class SmsSender {
  /**
   * Send SMS message via Pinpoint
   */
  async deliver(params: SendMessageParams): Promise<TelephonyResponse> {
    const config = getTelephonyConfig();
    
    if (config.pinpoint.smsConfigs.length === 0) {
      return {
        success: false,
        error: new ConfigurationError('No SMS configs available'),
      };
    }
    
    const senderId = config.countrySenderIds[params.countryCode];
    let lastResponse: TelephonyResponse | null = null;
    
    // Try each SMS config (failover between regions)
    for (const smsConfig of config.pinpoint.smsConfigs) {
      const startTime = Date.now();
      
      try {
        const client = getClient(smsConfig);
        const senderConfig = buildSenderConfig(params.countryCode, smsConfig, senderId);
        
        const command = new SendMessagesCommand({
          ApplicationId: smsConfig.applicationId,
          MessageRequest: {
            Addresses: {
              [params.to]: {
                ChannelType: 'SMS',
              },
            },
            MessageConfiguration: {
              SMSMessage: {
                Body: params.message,
                MessageType: 'TRANSACTIONAL',
                ...senderConfig,
              },
            },
          },
        });
        
        const result = await client.send(command);
        lastResponse = buildResponse(result.MessageResponse!, params.to, startTime);
        
        // Return immediately on success or permanent failures
        if (lastResponse.success) {
          return lastResponse;
        }
        
        const errorCode = lastResponse.error?.code;
        if (errorCode === 'OPT_OUT' || errorCode === 'PERMANENT_FAILURE') {
          return lastResponse;
        }
        
        // Log failover attempt
        console.warn(`Pinpoint SMS failover from ${smsConfig.region}:`, lastResponse.error);
        
      } catch (error) {
        const durationMs = Date.now() - startTime;
        console.error(`Pinpoint SMS error in ${smsConfig.region}:`, error);
        
        lastResponse = {
          success: false,
          error: {
            code: 'SERVICE_ERROR',
            message: error instanceof Error ? error.message : 'Unknown error',
            retryable: true,
          },
          extra: { durationMs },
        };
      }
    }
    
    return lastResponse || {
      success: false,
      error: new ConfigurationError('All SMS configs failed'),
    };
  }
  
  /**
   * Get phone number information
   */
  async phoneInfo(phoneNumber: string): Promise<PhoneNumberInfo> {
    const config = getTelephonyConfig();
    
    if (config.pinpoint.smsConfigs.length === 0) {
      return { type: 'unknown', error: 'No SMS configs available' };
    }
    
    const smsConfig = config.pinpoint.smsConfigs[0];
    
    try {
      const client = getClient(smsConfig);
      const command = new PhoneNumberValidateCommand({
        NumberValidateRequest: {
          PhoneNumber: phoneNumber,
        },
      });
      
      const result = await client.send(command);
      const info = result.NumberValidateResponse;
      
      if (!info) {
        return { type: 'unknown' };
      }
      
      const phoneType = info.PhoneType?.toLowerCase();
      let type: PhoneNumberInfo['type'] = 'unknown';
      
      if (phoneType === 'mobile') type = 'mobile';
      else if (phoneType === 'landline') type = 'landline';
      else if (phoneType === 'voip') type = 'voip';
      
      return {
        type,
        carrier: info.Carrier,
        countryCode: info.CountryCodeIso2,
      };
      
    } catch (error) {
      return {
        type: 'unknown',
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }
}

// Singleton instance
let smsSenderInstance: SmsSender | null = null;

export function getSmsSender(): SmsSender {
  if (!smsSenderInstance) {
    smsSenderInstance = new SmsSender();
  }
  return smsSenderInstance;
}
