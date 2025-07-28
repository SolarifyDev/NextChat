export function trackEvent(
  action: string,
  params: Record<string, any>,
  debug = false,
) {
  if (typeof window === "undefined" || typeof window.gtag !== "function") {
    console.warn("gtag is not available");
    return;
  }

  const eventParams: Record<string, any> = {
    ...params,
  };

  if (debug) eventParams.debug_mode = true;

  window.gtag("event", action, eventParams);
}
