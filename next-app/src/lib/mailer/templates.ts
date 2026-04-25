/**
 * Email Templates
 * Mirrors: app/views/user_mailer/*.html.erb
 *
 * Uses simple HTML templates - can be converted to React Email later
 */

interface EmailTemplate {
  subject: string;
  html: string;
  text: string;
}

interface BaseTemplateParams {
  appName: string;
  locale: string;
}

// i18n translations (simplified - would normally use next-intl)
const translations: Record<string, Record<string, string>> = {
  en: {
    'email_confirmation.subject': 'Confirm your email',
    'email_confirmation.body': 'Click the link below to confirm your email address:',
    'email_confirmation.expires': 'This link expires in {hours} hours.',
    'reset_password.subject': '{appName} - Reset your password',
    'reset_password.body': 'Click the link below to reset your password:',
    'password_changed.subject': 'Password changed',
    'password_changed.body': 'Your password was changed. If you did not make this change, click the link below:',
    'new_device.subject': 'New sign-in to your {appName} account',
    'new_device.body': 'We noticed a new sign-in to your account.',
    'account_reset_request.subject': '{appName} - Delete account request',
    'account_reset_granted.subject': '{appName} - Your account can now be deleted',
    'account_reset_complete.subject': 'Your account has been deleted',
    'account_reset_cancel.subject': '{appName} - Account deletion cancelled',
    'personal_key_regenerated.subject': 'Personal key regenerated',
    'personal_key_sign_in.subject': 'Personal key used to sign in',
    'added_email.subject': 'Email added to your account',
    'deleted_email.subject': 'Email removed from your account',
    'phone_added.subject': 'Phone number added to your account',
    'verify_by_mail.subject': 'Verification letter requested',
    'signup_reuse.subject': 'You already have an account',
    'disavow_link': 'If you did not make this change, secure your account',
    'button.confirm': 'Confirm email',
    'button.reset': 'Reset password',
    'button.secure': 'Secure your account',
  },
  es: {
    'email_confirmation.subject': 'Confirma tu correo electrónico',
    'email_confirmation.body': 'Haz clic en el enlace a continuación para confirmar tu dirección de correo electrónico:',
    'email_confirmation.expires': 'Este enlace vence en {hours} horas.',
    'reset_password.subject': '{appName} - Restablecer tu contraseña',
    'reset_password.body': 'Haz clic en el enlace a continuación para restablecer tu contraseña:',
    'password_changed.subject': 'Contraseña cambiada',
    'password_changed.body': 'Tu contraseña fue cambiada. Si no realizaste este cambio, haz clic en el enlace a continuación:',
  },
  fr: {
    'email_confirmation.subject': 'Confirmez votre e-mail',
    'email_confirmation.body': 'Cliquez sur le lien ci-dessous pour confirmer votre adresse e-mail:',
  },
};

function t(key: string, locale: string, params: Record<string, string | number> = {}): string {
  const localeTranslations = translations[locale] || translations['en'];
  let text = localeTranslations[key] || translations['en'][key] || key;
  
  for (const [param, value] of Object.entries(params)) {
    text = text.replace(`{${param}}`, String(value));
  }
  
  return text;
}

function baseLayout(content: string, appName: string): string {
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${appName}</title>
  <style>
    body { font-family: 'Public Sans', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #1b1b1b; margin: 0; padding: 0; }
    .container { max-width: 600px; margin: 0 auto; padding: 24px; }
    .header { background: #112e51; color: white; padding: 16px 24px; }
    .header img { height: 40px; }
    .content { padding: 24px; background: #ffffff; }
    .button { display: inline-block; background: #0071bc; color: white !important; padding: 12px 24px; text-decoration: none; border-radius: 4px; margin: 16px 0; }
    .footer { padding: 24px; color: #5b616b; font-size: 14px; border-top: 1px solid #d6d7d9; }
    a { color: #0071bc; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <strong>${appName}</strong>
    </div>
    <div class="content">
      ${content}
    </div>
    <div class="footer">
      <p>This is an automated message from ${appName}. Please do not reply to this email.</p>
    </div>
  </div>
</body>
</html>`;
}

export function emailConfirmationTemplate(params: BaseTemplateParams & {
  confirmUrl: string;
  expirationHours: number;
}): EmailTemplate {
  const subject = t('email_confirmation.subject', params.locale);
  const body = t('email_confirmation.body', params.locale);
  const expires = t('email_confirmation.expires', params.locale, { hours: params.expirationHours });
  const buttonText = t('button.confirm', params.locale);

  const content = `
    <h1>${subject}</h1>
    <p>${body}</p>
    <p><a href="${params.confirmUrl}" class="button">${buttonText}</a></p>
    <p>${expires}</p>
    <p>Or copy and paste this URL into your browser:</p>
    <p style="word-break: break-all;"><a href="${params.confirmUrl}">${params.confirmUrl}</a></p>
  `;

  return {
    subject,
    html: baseLayout(content, params.appName),
    text: `${subject}\n\n${body}\n\n${params.confirmUrl}\n\n${expires}`,
  };
}

export function resetPasswordTemplate(params: BaseTemplateParams & {
  resetUrl: string;
}): EmailTemplate {
  const subject = t('reset_password.subject', params.locale, { appName: params.appName });
  const body = t('reset_password.body', params.locale);
  const buttonText = t('button.reset', params.locale);

  const content = `
    <h1>${subject}</h1>
    <p>${body}</p>
    <p><a href="${params.resetUrl}" class="button">${buttonText}</a></p>
    <p>Or copy and paste this URL into your browser:</p>
    <p style="word-break: break-all;"><a href="${params.resetUrl}">${params.resetUrl}</a></p>
  `;

  return {
    subject,
    html: baseLayout(content, params.appName),
    text: `${subject}\n\n${body}\n\n${params.resetUrl}`,
  };
}

export function passwordChangedTemplate(params: BaseTemplateParams & {
  disavowUrl: string;
}): EmailTemplate {
  const subject = t('password_changed.subject', params.locale);
  const body = t('password_changed.body', params.locale);
  const disavowText = t('disavow_link', params.locale);

  const content = `
    <h1>${subject}</h1>
    <p>${body}</p>
    <p><a href="${params.disavowUrl}">${disavowText}</a></p>
  `;

  return {
    subject,
    html: baseLayout(content, params.appName),
    text: `${subject}\n\n${body}\n\n${disavowText}: ${params.disavowUrl}`,
  };
}

export function newDeviceSignInTemplate(params: BaseTemplateParams & {
  events: Array<{ eventType: string; occurredAt: Date; ip: string; userAgent: string }>;
  disavowUrl: string;
  before2fa: boolean;
}): EmailTemplate {
  const subject = t('new_device.subject', params.locale, { appName: params.appName });
  const body = t('new_device.body', params.locale);
  const disavowText = t('disavow_link', params.locale);

  const eventList = params.events.map(e => 
    `<li>${e.occurredAt.toISOString()} from ${e.ip}</li>`
  ).join('');

  const content = `
    <h1>${subject}</h1>
    <p>${body}</p>
    <ul>${eventList}</ul>
    <p><a href="${params.disavowUrl}">${disavowText}</a></p>
  `;

  return {
    subject,
    html: baseLayout(content, params.appName),
    text: `${subject}\n\n${body}\n\n${disavowText}: ${params.disavowUrl}`,
  };
}

export function accountResetRequestTemplate(params: BaseTemplateParams & {
  cancelUrl: string;
  deletionPeriodHours: number;
}): EmailTemplate {
  const subject = t('account_reset_request.subject', params.locale, { appName: params.appName });

  const content = `
    <h1>${subject}</h1>
    <p>You requested to delete your ${params.appName} account.</p>
    <p>If you did not make this request, click the link below to cancel:</p>
    <p><a href="${params.cancelUrl}">Cancel account deletion</a></p>
    <p>If you do want to delete your account, you will receive another email in ${params.deletionPeriodHours} hours with the link to complete the deletion.</p>
  `;

  return {
    subject,
    html: baseLayout(content, params.appName),
    text: `${subject}\n\nYou requested to delete your account.\n\nCancel: ${params.cancelUrl}`,
  };
}

export function accountResetGrantedTemplate(params: BaseTemplateParams & {
  deleteUrl: string;
  tokenValidHours: number;
}): EmailTemplate {
  const subject = t('account_reset_granted.subject', params.locale, { appName: params.appName });

  const content = `
    <h1>${subject}</h1>
    <p>Your account is ready to be deleted.</p>
    <p>Click the link below to complete the deletion:</p>
    <p><a href="${params.deleteUrl}" class="button">Delete my account</a></p>
    <p>This link is valid for ${params.tokenValidHours} hours.</p>
  `;

  return {
    subject,
    html: baseLayout(content, params.appName),
    text: `${subject}\n\nDelete account: ${params.deleteUrl}`,
  };
}

export function accountResetCompleteTemplate(params: BaseTemplateParams): EmailTemplate {
  const subject = t('account_reset_complete.subject', params.locale);

  const content = `
    <h1>${subject}</h1>
    <p>Your ${params.appName} account has been deleted.</p>
    <p>If you did not delete your account, please contact support immediately.</p>
  `;

  return {
    subject,
    html: baseLayout(content, params.appName),
    text: `${subject}\n\nYour account has been deleted.`,
  };
}

export function accountResetCancelTemplate(params: BaseTemplateParams): EmailTemplate {
  const subject = t('account_reset_cancel.subject', params.locale, { appName: params.appName });

  const content = `
    <h1>${subject}</h1>
    <p>Your request to delete your ${params.appName} account has been cancelled.</p>
    <p>Your account is safe and you can continue using it normally.</p>
  `;

  return {
    subject,
    html: baseLayout(content, params.appName),
    text: `${subject}\n\nYour account deletion has been cancelled.`,
  };
}

export function personalKeyRegeneratedTemplate(params: BaseTemplateParams): EmailTemplate {
  const subject = t('personal_key_regenerated.subject', params.locale);

  const content = `
    <h1>${subject}</h1>
    <p>Your personal key has been regenerated.</p>
    <p>Make sure to save your new personal key in a safe place. You will need it to access your account if you lose access to your authentication methods.</p>
  `;

  return {
    subject,
    html: baseLayout(content, params.appName),
    text: `${subject}\n\nYour personal key has been regenerated.`,
  };
}

export function personalKeySignInTemplate(params: BaseTemplateParams & {
  disavowUrl: string;
}): EmailTemplate {
  const subject = t('personal_key_sign_in.subject', params.locale);
  const disavowText = t('disavow_link', params.locale);

  const content = `
    <h1>${subject}</h1>
    <p>Your personal key was used to sign in to your account.</p>
    <p>If you did not sign in using your personal key:</p>
    <p><a href="${params.disavowUrl}">${disavowText}</a></p>
  `;

  return {
    subject,
    html: baseLayout(content, params.appName),
    text: `${subject}\n\n${disavowText}: ${params.disavowUrl}`,
  };
}

export function addedEmailTemplate(params: BaseTemplateParams & {
  disavowUrl: string;
  addedEmail: string;
}): EmailTemplate {
  const subject = t('added_email.subject', params.locale);
  const disavowText = t('disavow_link', params.locale);

  const content = `
    <h1>${subject}</h1>
    <p>The email address <strong>${params.addedEmail}</strong> was added to your ${params.appName} account.</p>
    <p>If you did not add this email:</p>
    <p><a href="${params.disavowUrl}">${disavowText}</a></p>
  `;

  return {
    subject,
    html: baseLayout(content, params.appName),
    text: `${subject}\n\nEmail added: ${params.addedEmail}\n\n${disavowText}: ${params.disavowUrl}`,
  };
}

export function deletedEmailTemplate(params: BaseTemplateParams & {
  disavowUrl: string;
  deletedEmail: string;
}): EmailTemplate {
  const subject = t('deleted_email.subject', params.locale);
  const disavowText = t('disavow_link', params.locale);

  const content = `
    <h1>${subject}</h1>
    <p>The email address <strong>${params.deletedEmail}</strong> was removed from your ${params.appName} account.</p>
    <p>If you did not remove this email:</p>
    <p><a href="${params.disavowUrl}">${disavowText}</a></p>
  `;

  return {
    subject,
    html: baseLayout(content, params.appName),
    text: `${subject}\n\nEmail removed: ${params.deletedEmail}\n\n${disavowText}: ${params.disavowUrl}`,
  };
}

export function phoneAddedTemplate(params: BaseTemplateParams & {
  disavowUrl: string;
}): EmailTemplate {
  const subject = t('phone_added.subject', params.locale);
  const disavowText = t('disavow_link', params.locale);

  const content = `
    <h1>${subject}</h1>
    <p>A phone number was added to your ${params.appName} account.</p>
    <p>If you did not add a phone number:</p>
    <p><a href="${params.disavowUrl}">${disavowText}</a></p>
  `;

  return {
    subject,
    html: baseLayout(content, params.appName),
    text: `${subject}\n\n${disavowText}: ${params.disavowUrl}`,
  };
}

export function verifyByMailLetterRequestedTemplate(params: BaseTemplateParams): EmailTemplate {
  const subject = t('verify_by_mail.subject', params.locale);

  const content = `
    <h1>${subject}</h1>
    <p>You requested a verification letter to be sent to your address.</p>
    <p>The letter should arrive within 5-10 business days.</p>
    <p>Once you receive the letter, sign in to ${params.appName} and enter the verification code.</p>
  `;

  return {
    subject,
    html: baseLayout(content, params.appName),
    text: `${subject}\n\nYour verification letter is on its way.`,
  };
}

export function signupEmailReuseTemplate(params: BaseTemplateParams & {
  signInUrl: string;
}): EmailTemplate {
  const subject = t('signup_reuse.subject', params.locale);

  const content = `
    <h1>${subject}</h1>
    <p>Someone tried to create a new ${params.appName} account with this email address, but an account already exists.</p>
    <p>If this was you, you can sign in to your existing account:</p>
    <p><a href="${params.signInUrl}" class="button">Sign in</a></p>
    <p>If you forgot your password, you can reset it from the sign-in page.</p>
  `;

  return {
    subject,
    html: baseLayout(content, params.appName),
    text: `${subject}\n\nSign in: ${params.signInUrl}`,
  };
}
