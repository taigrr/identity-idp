import { useContext } from 'react';

import useAsync, { type SuspenseResource } from '../hooks/use-async';
import UploadContext from '../context/upload';
import type { UploadSuccessResponse } from '../context/upload';

import SubmissionComplete from './submission-complete';

type PromiseLikeRecord<T extends Record<string, unknown>> = {
  [K in keyof T]: T[K] | Promise<T[K]>;
};

export async function resolveObjectValues<T extends Record<string, unknown>>(
  object: PromiseLikeRecord<T>,
): Promise<T> {
  const resolved: Record<string, unknown> = {};

  for (const [key, value] of Object.entries(object)) {
    resolved[key] = await value;
  }

  return resolved as T;
}

interface SubmissionProps {
  payload: Record<string, string | Promise<string>>;
}

function Submission({ payload }: SubmissionProps) {
  const { upload } = useContext(UploadContext);

  const uploadResolved = async (
    rawPayload: Record<string, string | Promise<string>>,
  ): Promise<UploadSuccessResponse> => {
    const resolvedPayload = await resolveObjectValues(rawPayload);
    return upload(resolvedPayload);
  };

  const resource: SuspenseResource<UploadSuccessResponse> = useAsync(uploadResolved, payload);

  return <SubmissionComplete resource={resource} />;
}

export default Submission;
