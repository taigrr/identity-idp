import sinon from 'sinon';
import { JSDOM, ResourceLoader, type FetchOptions } from 'jsdom';
import mqPolyfill from 'mq-polyfill';
import * as clipboard from 'clipboard-polyfill';

const matchMediaPolyfill = (mqPolyfill as { default?: typeof mqPolyfill }).default || mqPolyfill;

const TEST_URL = 'http://example.test';

export function createDOM(): JSDOM {
  const dom = new JSDOM('<!doctype html><html lang="en"><head><title>JSDOM</title></head></html>', {
    url: TEST_URL,
    pretendToBeVisual: true,
    resources: new (class extends ResourceLoader {
      fetch(url: string, options: FetchOptions): Promise<Buffer> | null {
        if (url.startsWith('data:') && options.element instanceof window.HTMLImageElement) {
          const [header, content] = url.split(',');
          const isBase64 = header.endsWith(';base64');
          return Promise.resolve(Buffer.from(content, isBase64 ? 'base64' : 'utf-8'));
        }

        return url === 'about:blank'
          ? Promise.resolve(Buffer.from(''))
          : Promise.reject(new Error('Failed to load'));
      }
    })(),
  });

  Object.defineProperty(dom.window.HTMLElement.prototype, 'offsetParent', {
    get() {
      return this.parentNode;
    },
  });

  matchMediaPolyfill(dom.window);

  dom.window.resizeTo = function (width: number, height: number) {
    Object.assign(this, {
      innerWidth: width,
      innerHeight: height,
      outerWidth: width,
      outerHeight: height,
    }).dispatchEvent(new this.Event('resize'));
  };

  dom.window.navigator.clipboard = clipboard as unknown as Clipboard;

  dom.window.Element.prototype.scrollIntoView = () => {};

  sinon
    .stub(dom.window, 'scrollTo')
    .callsFake((scrollX, scrollY) =>
      Object.assign(dom.window, { scrollX, scrollY }),
    );

  new dom.window.MutationObserver((mutations) => {
    mutations.forEach((mutation) => {
      mutation.addedNodes.forEach((node) => {
        if (node instanceof dom.window.HTMLScriptElement) {
          if (node.src === 'about:blank') {
            if (typeof node.onload === 'function') {
              (node.onload as () => void)();
            }
          } else if (typeof node.onerror === 'function') {
            (node.onerror as () => void)();
          }
        }
      });
    });
  }).observe(dom.window.document.body, { childList: true, subtree: true });

  return dom;
}

export function useCleanDOM(dom: JSDOM): void {
  beforeEach(() => {
    for (const element of [document.head, document.body]) {
      while (element.firstChild) {
        element.firstChild.remove();
      }
    }
    document.documentElement.lang = 'en';
    dom.reconfigure({ url: TEST_URL });
    dom.cookieJar.removeAllCookiesSync();
  });
}
