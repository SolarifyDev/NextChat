export const TrackGrowingIO = (
  eventName: string,
  data?: Record<string, any>,
) => {
  try {
    if (window.gio) {
      window.gio("track", eventName, data || {});
    }
  } catch {}
};
