(function () {
  'use strict';

  const track = document.getElementById('home-events-track');

  const DEFAULT_LANG = 'en';
  const MAX_EVENTS = 5;
  const LOOKAHEAD_MONTHS = 6;
  const EVENTS_UNAVAILABLE_TEXT = 'Events temporarily unavailable';

  const emptyLabel = 'No upcoming events';

  function getLang() {
    return DEFAULT_LANG;
  }

  function getLocale(lang) {
    return 'en-US';
  }

  function escapeHtml(value) {
    return String(value || '').replace(/[&<>"']/g, char => ({
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      '"': '&quot;',
      "'": '&#39;'
    }[char]));
  }

  function renderEmpty() {
    const lang = getLang();
    track.innerHTML = `
      <div class="state-card state-card--success home-events-status" role="status">
        <strong>${emptyLabel}</strong>
        <span>${new Date().toLocaleDateString(getLocale(lang), { month: 'long', year: 'numeric' })}</span>
      </div>
    `;
  }

  function renderUnavailable(error) {
    const unconfigured = error?.message === 'public_event_source_unconfigured';
    track.innerHTML = `
      <div class="state-card state-card--unavailable home-events-status" role="status">
        <strong>${unconfigured ? 'Event schedule is not configured' : EVENTS_UNAVAILABLE_TEXT}</strong>
        <span>${unconfigured ? 'No connected public schedule is available here.' : 'The schedule could not be read. This does not mean there are no events.'}</span>
        <button class="button" type="button" data-retry-home-events>Try again</button>
      </div>
    `;
    track.querySelector('[data-retry-home-events]').addEventListener('click', loadHomeEvents);
  }

  function eventVisibleForRole(event) {
    return event.type === 'public' && event.status === 'confirmed';
  }

  function renderEvents(events) {
    if (!events.length) {
      renderEmpty();
      return;
    }

    const lang = getLang();
    const locale = getLocale(lang);
    const formatter = new Intl.DateTimeFormat(locale, {
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    });

    track.innerHTML = events.slice(0, MAX_EVENTS).map(event => {
      const title = escapeHtml(event.title);
      const date = formatter.format(new Date(event.start_time));
      return `
        <a class="event-card glass-card home-event-card" href="calendar.html" aria-label="${title}">
          <h3>${title}</h3>
          <p>${date}</p>
        </a>
      `;
    }).join('');
  }

  async function fetchUpcomingEvents() {
    const sb = window.supabaseClient;
    if (!sb) {
      throw new Error('public_event_source_unconfigured');
    }

    const now = new Date();
    const lookahead = new Date(now);
    lookahead.setMonth(lookahead.getMonth() + LOOKAHEAD_MONTHS);

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 10000);
    try {
      const { data, error } = await sb
        .from('events')
        .select('*')
        .eq('type', 'public')
        .eq('status', 'confirmed')
        .gte('start_time', now.toISOString())
        .lte('start_time', lookahead.toISOString())
        .order('start_time', { ascending: true })
        .limit(200)
        .abortSignal(controller.signal);

      if (error) throw error;

      if (!Array.isArray(data)) throw new Error('public_event_response_invalid');
      const upcoming = data
        .filter(eventVisibleForRole)
        // Show confirmed stored dates. Do not imply further dates from an old
        // recurrence rule when the public schedule has no stored future event.
        .filter(event => new Date(event.start_time) >= now)
        .sort((a, b) => new Date(a.start_time) - new Date(b.start_time));

      return upcoming;
    } finally { clearTimeout(timeout); }
  }

  function publicEventRecord(event) {
    return {
      id: event.id,
      title: event.title,
      description: event.description || '',
      start_time: event.start_time,
      end_time: event.end_time,
      location: event.location || event.address || [event.city, event.country].filter(Boolean).join(', ') || '',
      organizer: event.organizer || event.organizer_name || '',
      status: event.status || '',
      url: event.public_url || event.url || ''
    };
  }

  window.LumeyaEventsProvider = {
    load: () => fetchUpcomingEvents().then(events => events.map(publicEventRecord))
  };

  async function loadHomeEvents() {
    try {
      const events = await fetchUpcomingEvents();
      if (track) renderEvents(events);
    } catch (err) {
      if (track) renderUnavailable(err);
    }
  }

  if (track) {
    document.addEventListener('ma3-auth-changed', loadHomeEvents);
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', loadHomeEvents, { once: true });
    } else {
      loadHomeEvents();
    }
  }
})();
