/**
 * AWS SES Client
 * Mirrors Rails ActionMailer with SES delivery
 */

import { SESClient, SendEmailCommand, type SendEmailCommandInput } from '@aws-sdk/client-ses';
import { getConfig } from '../config';

export interface EmailParams {
  to: string;
  subject: string;
  html: string;
  text?: string;
  replyTo?: string;
}

export interface SendResult {
  success: boolean;
  messageId?: string;
  error?: string;
}

let sesClient: SESClient | null = null;

function getClient(): SESClient {
  if (!sesClient) {
    const config = getConfig();
    sesClient = new SESClient({
      region: process.env.AWS_REGION || 'us-west-2',
      credentials: process.env.AWS_ACCESS_KEY_ID && process.env.AWS_SECRET_ACCESS_KEY
        ? {
            accessKeyId: process.env.AWS_ACCESS_KEY_ID,
            secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
          }
        : undefined,
    });
  }
  return sesClient;
}

/**
 * Get email sender address with display name
 */
function getFromAddress(): string {
  const email = process.env.EMAIL_FROM || 'no-reply@login.gov';
  const displayName = process.env.EMAIL_FROM_DISPLAY_NAME || 'Login.gov';
  return `${displayName} <${email}>`;
}

/**
 * Send email via AWS SES
 */
export async function sendEmail(params: EmailParams): Promise<SendResult> {
  const client = getClient();
  const fromAddress = getFromAddress();

  const input: SendEmailCommandInput = {
    Source: fromAddress,
    Destination: {
      ToAddresses: [params.to],
    },
    Message: {
      Subject: {
        Data: params.subject,
        Charset: 'UTF-8',
      },
      Body: {
        Html: {
          Data: params.html,
          Charset: 'UTF-8',
        },
        ...(params.text && {
          Text: {
            Data: params.text,
            Charset: 'UTF-8',
          },
        }),
      },
    },
    ReplyToAddresses: params.replyTo ? [params.replyTo] : [fromAddress],
  };

  try {
    const command = new SendEmailCommand(input);
    const response = await client.send(command);

    return {
      success: true,
      messageId: response.MessageId,
    };
  } catch (error) {
    console.error('SES email send error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Reset client (for testing)
 */
export function resetSesClient(): void {
  sesClient = null;
}
