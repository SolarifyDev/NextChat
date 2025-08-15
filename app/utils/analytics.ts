export const TrackGrowingIO = (
  eventName: string,
  data?: Record<string, any>,
) => {
  try {
    if (window.gio) {
      const params = {
        currentTime: Date.now().toString(),
        ...data,
      };

      window.gio("track", eventName, params || {});
    }
  } catch {}
};
