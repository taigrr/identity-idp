import { join, basename, extname } from 'path';
import { promises as fs } from 'fs';

const MIME_TYPES_BY_EXTENSION: Record<string, string> = {
  '.jpg': 'image/jpeg',
};

export interface LoginGovTestFile extends File {
  rawBuffer: Buffer;
}

export function getFixture(fixturePath: string): Promise<Buffer>;
export function getFixture(fixturePath: string, encoding: BufferEncoding): Promise<string>;
export function getFixture(fixturePath: string, encoding?: BufferEncoding): Promise<Buffer | string> {
  const path = join(__dirname, '../../fixtures', fixturePath);
  return fs.readFile(path, encoding);
}

export async function getFixtureFile(fixturePath: string): Promise<LoginGovTestFile> {
  const rawBuffer = await getFixture(fixturePath);
  const type = MIME_TYPES_BY_EXTENSION[extname(fixturePath)];
  const file = new window.File([new Uint8Array(rawBuffer)], basename(fixturePath), { type });
  return Object.assign(file, { rawBuffer }) as LoginGovTestFile;
}

export function createObjectURLAsDataURL(file: LoginGovTestFile): string {
  return `data:${file.type};base64,${file.rawBuffer.toString('base64')}`;
}
