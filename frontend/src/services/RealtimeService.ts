/**
 * Opens the Server-Sent Event stream for live updates. Cookies (auth +
 * session) are sent automatically because the stream is same-origin as the
 * API.
 */
export function useRealtimeService() {
  /**
   * The camp's single live-updates stream. Carries all camp resources; the
   * server filters each event against the subscriber's permissions.
   */
  function openCampStream(campId: string): EventSource {
    return new EventSource(`${window.origin}/api/v1/camps/${campId}/events`, {
      withCredentials: true,
    });
  }

  return {
    openCampStream,
  };
}
