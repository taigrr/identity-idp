/**
 * Browser parsing utilities - mirrors BrowserCache
 * @see app/services/analytics.rb
 */

export interface ParsedBrowser {
  name: string;
  fullVersion: string;
  platform: {
    name: string;
    version: string;
  };
  device: {
    name: string;
    mobile: boolean;
  };
  bot: boolean;
}

const BOT_PATTERNS = [
  /bot/i,
  /spider/i,
  /crawl/i,
  /slurp/i,
  /googlebot/i,
  /bingbot/i,
  /yandex/i,
  /baidu/i,
];

export function parseBrowser(userAgent: string | undefined): ParsedBrowser {
  if (!userAgent) {
    return getUnknownBrowser();
  }

  const isBot = BOT_PATTERNS.some((pattern) => pattern.test(userAgent));
  const browser = extractBrowserInfo(userAgent);
  const platform = extractPlatformInfo(userAgent);
  const device = extractDeviceInfo(userAgent);

  return {
    ...browser,
    platform,
    device,
    bot: isBot,
  };
}

function getUnknownBrowser(): ParsedBrowser {
  return {
    name: 'Unknown',
    fullVersion: '',
    platform: { name: 'Unknown', version: '' },
    device: { name: 'Unknown', mobile: false },
    bot: false,
  };
}

function extractBrowserInfo(ua: string): Pick<ParsedBrowser, 'name' | 'fullVersion'> {
  const browsers = [
    { name: 'Edge', pattern: /Edg(?:e|A|iOS)?\/(\d+(?:\.\d+)*)/ },
    { name: 'Chrome', pattern: /Chrome\/(\d+(?:\.\d+)*)/ },
    { name: 'Firefox', pattern: /Firefox\/(\d+(?:\.\d+)*)/ },
    { name: 'Safari', pattern: /Version\/(\d+(?:\.\d+)*).*Safari/ },
    { name: 'Opera', pattern: /(?:Opera|OPR)\/(\d+(?:\.\d+)*)/ },
    { name: 'IE', pattern: /(?:MSIE |rv:)(\d+(?:\.\d+)*)/ },
  ];

  for (const { name, pattern } of browsers) {
    const match = ua.match(pattern);
    if (match) {
      return { name, fullVersion: match[1] || '' };
    }
  }

  return { name: 'Unknown', fullVersion: '' };
}

function extractPlatformInfo(ua: string): ParsedBrowser['platform'] {
  const platforms = [
    { name: 'Windows', pattern: /Windows NT (\d+(?:\.\d+)*)/ },
    { name: 'macOS', pattern: /Mac OS X (\d+[._]\d+(?:[._]\d+)*)/ },
    { name: 'iOS', pattern: /(?:iPhone|iPad).*OS (\d+[._]\d+(?:[._]\d+)*)/ },
    { name: 'Android', pattern: /Android (\d+(?:\.\d+)*)/ },
    { name: 'Linux', pattern: /Linux/ },
    { name: 'Chrome OS', pattern: /CrOS/ },
  ];

  for (const { name, pattern } of platforms) {
    const match = ua.match(pattern);
    if (match) {
      const version = match[1]?.replace(/_/g, '.') || '';
      return { name, version };
    }
  }

  return { name: 'Unknown', version: '' };
}

function extractDeviceInfo(ua: string): ParsedBrowser['device'] {
  const isMobile = /(?:Mobile|Android|iPhone|iPad|iPod|webOS|BlackBerry|Opera Mini|IEMobile)/i.test(
    ua
  );

  let name = 'Desktop';
  if (/iPhone/i.test(ua)) name = 'iPhone';
  else if (/iPad/i.test(ua)) name = 'iPad';
  else if (/Android/i.test(ua) && isMobile) name = 'Android Phone';
  else if (/Android/i.test(ua)) name = 'Android Tablet';

  return { name, mobile: isMobile };
}
