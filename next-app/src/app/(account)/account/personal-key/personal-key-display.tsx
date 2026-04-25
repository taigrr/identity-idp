'use client';

/**
 * Personal Key Display Component
 */

import { useState } from 'react';
import { acknowledgePersonalKey } from './actions';

interface PersonalKeyDisplayProps {
  personalKey: string;
  generatedAt: Date | null;
}

export function PersonalKeyDisplay({ personalKey, generatedAt }: PersonalKeyDisplayProps) {
  const [copied, setCopied] = useState(false);
  const [acknowledged, setAcknowledged] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const formattedKey = personalKey.match(/.{1,4}/g)?.join('-') || personalKey;

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(personalKey);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  const handleDownload = () => {
    const content = `Login.gov Personal Key
Generated: ${generatedAt?.toLocaleDateString() || 'Unknown'}

Your personal key: ${formattedKey}

IMPORTANT: Keep this key in a safe place. You will need it if you lose
access to your other authentication methods.
`;
    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'login-gov-personal-key.txt';
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleContinue = async () => {
    setIsSubmitting(true);
    await acknowledgePersonalKey();
  };

  return (
    <div>
      <div className="bg-gray-100 rounded-lg p-6 mb-6 print:bg-white print:border print:border-black">
        <p className="text-sm text-gray-600 mb-2">Your personal key:</p>
        <p className="text-2xl font-mono font-bold tracking-wider text-center">
          {formattedKey}
        </p>
        {generatedAt && (
          <p className="text-xs text-gray-500 mt-2 text-center">
            Generated on {generatedAt.toLocaleDateString()}
          </p>
        )}
      </div>

      <div className="flex gap-2 mb-6 print:hidden">
        <button
          onClick={handleCopy}
          className="flex-1 py-2 px-4 border border-gray-300 rounded hover:bg-gray-50"
        >
          {copied ? 'Copied!' : 'Copy'}
        </button>
        <button
          onClick={handlePrint}
          className="flex-1 py-2 px-4 border border-gray-300 rounded hover:bg-gray-50"
        >
          Print
        </button>
        <button
          onClick={handleDownload}
          className="flex-1 py-2 px-4 border border-gray-300 rounded hover:bg-gray-50"
        >
          Download
        </button>
      </div>

      <div className="print:hidden">
        <label className="flex items-start mb-6 cursor-pointer">
          <input
            type="checkbox"
            checked={acknowledged}
            onChange={(e) => setAcknowledged(e.target.checked)}
            className="mt-1 mr-3"
          />
          <span className="text-gray-700">
            I have saved my personal key in a secure location.
          </span>
        </label>

        <button
          onClick={handleContinue}
          disabled={!acknowledged || isSubmitting}
          className="w-full py-3 px-4 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
        >
          {isSubmitting ? 'Continuing...' : 'Continue'}
        </button>
      </div>
    </div>
  );
}
