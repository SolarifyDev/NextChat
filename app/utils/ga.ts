import ReactGA from "react-ga4";

export function trackEvent(
  action: string,
  params: Record<string, any>,
  debug = false,
) {
  const eventParams: Record<string, any> = {
    ...params,
  };

  if (debug) eventParams.debug_mode = true;

  // window.gtag("event", action, eventParams);

  ReactGA.event(action, eventParams);
}
