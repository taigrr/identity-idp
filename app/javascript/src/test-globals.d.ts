import type { expect as _expect } from 'chai';
import type { JSDOM } from 'jsdom';
import type { SinonStub } from 'sinon';

declare global {
  const expect: typeof _expect;
  const jsdom: JSDOM;

  interface AcuantCameraUIInterface {
    start: SinonStub;
    end: SinonStub;
  }

  interface AcuantPassiveLivenessInterface {
    start: SinonStub;
    end: SinonStub;
  }
}

export {};
