/**
 * Opens the Server-Sent Event stream for live updates. Cookies (auth +
 * session) are sent automatically because the stream is same-origin as the
 * API.
 */
export function useRealtimeService() {
  /**
   * The event's single live-updates stream. Carries all event resources; the
   * server filters each event against the subscriber's permissions.
   */
  function openEventStream(eventId: string): EventSource {
    return new EventSource(`${window.origin}/api/v1/events/${eventId}/stream`, {
      withCredentials: true,
    });
  }

  return {
    openEventStream,
  };
}
