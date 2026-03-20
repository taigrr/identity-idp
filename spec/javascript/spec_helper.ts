import { webcrypto } from 'crypto';
import React from 'react';
import chai from 'chai';
import dirtyChai from 'dirty-chai';
import sinonChai from 'sinon-chai';
import chaiAsPromised from 'chai-as-promised';
import { createDOM, useCleanDOM } from './support/dom';
import { chaiConsoleSpy, useConsoleLogSpy } from './support/console';
import { sinonChaiAsPromised } from './support/sinon';
import { createObjectURLAsDataURL, type LoginGovTestFile } from './support/file';

declare const global: typeof globalThis & {
  React: typeof React;
  expect: typeof chai.expect;
  jsdom: ReturnType<typeof createDOM>;
  window: Window & typeof globalThis;
  navigator: Navigator;
  fetch: typeof fetch;
  Event: typeof Event;
  CustomEvent: typeof CustomEvent;
  MessageChannel?: typeof MessageChannel;
};

(global as typeof global & { React: typeof React }).React = React;

chai.use(sinonChai);
chai.use(chaiAsPromised);
chai.use(chaiConsoleSpy);
chai.use(sinonChaiAsPromised);
chai.use(dirtyChai);
global.expect = chai.expect;

const dom = createDOM();
global.jsdom = dom;
global.window = dom.window as unknown as Window & typeof globalThis;
Object.assign(global.navigator, dom.window.navigator);
const windowGlobals = Object.fromEntries(
  Object.getOwnPropertyNames(window)
    .filter((key) => !(key in global))
    .map((key) => [key, (window as unknown as Record<string, unknown>)[key]]),
);
Object.assign(global, windowGlobals);
global.window.fetch = fetch;
global.fetch = global.window.fetch;
global.Event = global.window.Event;
global.CustomEvent = global.window.CustomEvent;
Object.defineProperty(global.window, 'crypto', { value: webcrypto });
global.window.URL.createObjectURL = createObjectURLAsDataURL as (obj: Blob | MediaSource) => string;
global.window.URL.revokeObjectURL = () => {};
Object.defineProperty(global.window.Image.prototype, 'src', {
  set(this: HTMLImageElement) {
    this.onload?.(new Event('load'));
  },
});
global.navigator.sendBeacon = () => true;

useCleanDOM(dom);
useConsoleLogSpy();

global.MessageChannel = undefined as unknown as typeof MessageChannel;
