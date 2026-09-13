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

  /**
   * The public program page's stream — anonymous, so no cookies are sent.
   * Gated only on the event being publicly visible at all (not on the
   * program-public `enabled` flag), so a viewer on the "not published yet"
   * state still learns live when a manager turns the link on.
   */
  function openPublicProgramStream(eventId: string): EventSource {
    return new EventSource(
      `${window.origin}/api/v1/events/${eventId}/program-public/stream`,
    );
  }

  return {
    openEventStream,
    openPublicProgramStream,
  };
}
