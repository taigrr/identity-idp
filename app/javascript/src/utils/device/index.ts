export function isIPad(): boolean {
  const { userAgent, maxTouchPoints } = navigator;
  return /ipad/i.test(userAgent) || (/macintosh/i.test(userAgent) && maxTouchPoints === 5);
}

export function isLikelyMobile(): boolean {
  return isIPad() || /iphone|android/i.test(navigator.userAgent);
}

export function hasMediaAccess(): boolean {
  return !!navigator.mediaDevices;
}

export function isCameraCapableMobile(): boolean {
  return isLikelyMobile() && hasMediaAccess();
}
