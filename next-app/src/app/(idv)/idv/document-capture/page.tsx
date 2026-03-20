/**
 * IDV Document Capture Page
 * Mirrors: app/controllers/idv/document_capture_controller.rb
 */

'use client';

import { useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { saveDocumentCapturePii, type IdvPii } from '../actions';

type CaptureState = 'front' | 'back' | 'selfie' | 'review';

export default function DocumentCapturePage() {
  const router = useRouter();
  const [state, setState] = useState<CaptureState>('front');
  const [frontImage, setFrontImage] = useState<string | null>(null);
  const [backImage, setBackImage] = useState<string | null>(null);
  const [selfieImage, setSelfieImage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  function handleFileSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      setError('Please select an image file');
      return;
    }

    // Validate file size (max 10MB)
    if (file.size > 10 * 1024 * 1024) {
      setError('Image must be less than 10MB');
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const dataUrl = event.target?.result as string;
      
      switch (state) {
        case 'front':
          setFrontImage(dataUrl);
          setState('back');
          break;
        case 'back':
          setBackImage(dataUrl);
          setState('selfie');
          break;
        case 'selfie':
          setSelfieImage(dataUrl);
          setState('review');
          break;
      }
      setError(null);
    };
    reader.readAsDataURL(file);

    // Reset input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  }

  async function handleSubmit() {
    if (!frontImage || !backImage || !selfieImage) {
      setError('Please capture all required images');
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      // In a real implementation, images would be sent to a document
      // verification service. For now, we'll mock the extracted PII.
      const mockPii: IdvPii = {
        firstName: 'John',
        lastName: 'Doe',
        dateOfBirth: '1980-01-15',
        address1: '123 Main St',
        city: 'Washington',
        state: 'DC',
        zipcode: '20001',
        stateIdType: 'drivers_license',
        stateIdJurisdiction: 'DC',
      };

      const result = await saveDocumentCapturePii(mockPii);
      
      if (result.success) {
        router.push('/idv/ssn');
      } else {
        setError('Failed to process documents');
      }
    } catch {
      setError('An error occurred while processing your documents');
    } finally {
      setIsSubmitting(false);
    }
  }

  function retake(type: 'front' | 'back' | 'selfie') {
    switch (type) {
      case 'front':
        setFrontImage(null);
        setState('front');
        break;
      case 'back':
        setBackImage(null);
        setState('back');
        break;
      case 'selfie':
        setSelfieImage(null);
        setState('selfie');
        break;
    }
  }

  return (
    <div className="document-capture">
      <h1>Take photos of your ID</h1>

      {error && (
        <div className="usa-alert usa-alert--error margin-bottom-2">
          <div className="usa-alert__body">
            <p className="usa-alert__text">{error}</p>
          </div>
        </div>
      )}

      {state === 'front' && (
        <CaptureStep
          title="Front of your ID"
          description="Take a clear photo of the front of your driver's license or state ID."
          tips={[
            'Make sure all text is readable',
            'Avoid glare and shadows',
            'Ensure the entire ID is in frame',
          ]}
          onCapture={() => fileInputRef.current?.click()}
        />
      )}

      {state === 'back' && (
        <CaptureStep
          title="Back of your ID"
          description="Take a clear photo of the back of your driver's license or state ID."
          tips={[
            'Include the barcode',
            'Make sure all text is readable',
            'Ensure the entire ID is in frame',
          ]}
          onCapture={() => fileInputRef.current?.click()}
        />
      )}

      {state === 'selfie' && (
        <CaptureStep
          title="Take a selfie"
          description="Take a photo of your face to match against your ID."
          tips={[
            'Face the camera directly',
            'Remove glasses and hats',
            'Ensure good lighting',
          ]}
          onCapture={() => fileInputRef.current?.click()}
        />
      )}

      {state === 'review' && (
        <div className="review-images">
          <h2>Review your photos</h2>
          <p className="margin-bottom-3">
            Make sure all photos are clear and readable before submitting.
          </p>

          <div className="image-review-grid">
            <ImagePreview
              title="Front of ID"
              image={frontImage}
              onRetake={() => retake('front')}
            />
            <ImagePreview
              title="Back of ID"
              image={backImage}
              onRetake={() => retake('back')}
            />
            <ImagePreview
              title="Selfie"
              image={selfieImage}
              onRetake={() => retake('selfie')}
            />
          </div>

          <div className="margin-top-4">
            <button
              type="button"
              className="usa-button"
              onClick={handleSubmit}
              disabled={isSubmitting}
            >
              {isSubmitting ? 'Processing...' : 'Submit photos'}
            </button>
          </div>
        </div>
      )}

      <input
        type="file"
        ref={fileInputRef}
        accept="image/*"
        capture="environment"
        onChange={handleFileSelect}
        className="display-none"
      />

      <div className="margin-top-4">
        <Link href="/idv/agreement" className="usa-link">
          &larr; Back
        </Link>
      </div>
    </div>
  );
}

function CaptureStep({
  title,
  description,
  tips,
  onCapture,
}: {
  title: string;
  description: string;
  tips: string[];
  onCapture: () => void;
}) {
  return (
    <div className="capture-step">
      <h2>{title}</h2>
      <p className="margin-bottom-3">{description}</p>

      <div className="usa-alert usa-alert--info margin-bottom-3">
        <div className="usa-alert__body">
          <h3 className="usa-alert__heading">Tips for a good photo</h3>
          <ul className="margin-top-1">
            {tips.map((tip, i) => (
              <li key={i}>{tip}</li>
            ))}
          </ul>
        </div>
      </div>

      <button type="button" className="usa-button usa-button--big" onClick={onCapture}>
        Take photo
      </button>
    </div>
  );
}

function ImagePreview({
  title,
  image,
  onRetake,
}: {
  title: string;
  image: string | null;
  onRetake: () => void;
}) {
  return (
    <div className="image-preview margin-bottom-3">
      <h3>{title}</h3>
      {image && (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={image}
          alt={title}
          className="width-full maxw-mobile border-1px border-base-lighter"
        />
      )}
      <button
        type="button"
        className="usa-button usa-button--outline margin-top-1"
        onClick={onRetake}
      >
        Retake
      </button>
    </div>
  );
}
