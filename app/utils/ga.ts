import { MessageEnum } from "../enum";

export function trackEvent(
  action: string,
  params: Record<string, any>,
  debug = false,
) {
  const eventParams: Record<string, any> = { ...params };

  if (debug) eventParams.debug_mode = true;

  window.gtag("event", action, eventParams);
}

export const postMessageToReactNative = (
  data: Record<string, unknown>,
  msg: string,
) => {
  const message = {
    data,
    msg,
    type: MessageEnum.GA,
  };

  window.ReactNativeWebView.postMessage(JSON.stringify(message));
};
