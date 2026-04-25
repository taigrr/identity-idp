import { redirect } from 'next/navigation';
import { getSmsOptInData } from './actions';
import { SmsOptInForm } from './sms-opt-in-form';

/**
 * SMS Opt-In Page
 * Mirrors: app/controllers/two_factor_authentication/sms_opt_in_controller.rb
 * Route: /two-factor/sms-opt-in/[optOutUuid]
 *
 * Shown when a user's phone number has opted out of SMS (e.g., replied STOP)
 * and they need to opt back in to receive verification codes.
 */

interface SmsOptInPageProps {
  params: Promise<{ optOutUuid: string }>;
}

export default async function SmsOptInPage({ params }: SmsOptInPageProps) {
  const { optOutUuid } = await params;
  const data = await getSmsOptInData(optOutUuid);

  if (!data.phoneInfo) {
    redirect('/two-factor');
  }

  return (
    <div className="max-w-md mx-auto p-6">
      <h1 className="text-2xl font-bold mb-2">Opt in to text messages</h1>

      <p className="text-gray-600 mb-6">
        Your phone number <strong>{data.phoneInfo.formattedPhone}</strong> has been opted out of
        receiving text messages from Login.gov.
      </p>

      <div className="bg-blue-50 border border-blue-200 rounded p-4 mb-6">
        <h2 className="font-medium text-blue-900 mb-2">Why am I seeing this?</h2>
        <p className="text-blue-800 text-sm">
          This usually happens when someone replies &quot;STOP&quot; to a text message from Login.gov.
          To continue receiving security codes by text, you need to opt back in.
        </p>
      </div>

      <SmsOptInForm
        optOutUuid={optOutUuid}
        formattedPhone={data.phoneInfo.formattedPhone}
        cancelUrl={data.cancelUrl || '/two-factor'}
        hasOtherMethods={data.hasOtherMethods ?? true}
      />
    </div>
  );
}
