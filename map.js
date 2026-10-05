(function () {
  'use strict';

  const PRAGUE_VIEW = [50.0755, 14.4378];

  function escapeHtml(value) {
    return String(value ?? '').replace(/[&<>'"]/g, (character) => ({
      '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;'
    })[character]);
  }

  function slug(value) {
    return String(value || '').trim().toLowerCase().normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9]+/g, '-');
  }

  function newTabAttributes(url) {
    return /^https?:\/\//i.test(url) ? ' target="_blank" rel="noopener noreferrer"' : '';
  }

  function verifiedCoordinates(record, kind) {
    if (record.coordinatesVerified !== true) return null;
    if (!Array.isArray(record.coordinates) || record.coordinates.length !== 2) return null;
    const coordinates = record.coordinates.map(Number);
    if (!coordinates.every(Number.isFinite)) return null;
    if (Math.abs(coordinates[0]) > 90 || Math.abs(coordinates[1]) > 180) return null;
    if (kind === 'place' && String(record.status || '').toLowerCase() !== 'active') return null;
    return coordinates;
  }

  function entryFrom(record, kind) {
    const coordinates = verifiedCoordinates(record, kind);
    return {
      id: `${kind}-${record.id}`,
      kind,
      name: record.name || record.title,
      description: record.shortDescription || record.description || '',
      city: record.city || '',
      country: record.country || '',
      topicIds: record.topicIds || [],
      status: record.status || 'Not published',
      url: kind === 'provider' ? (record.profileUrl || record.detailUrl) : record.detailUrl,
      contactUrl: record.contactUrl,
      coordinates,
      typeLabel: kind === 'place' ? (record.type || 'Place') : (record.type === 'organisation' ? 'Organisation' : 'Practitioner'),
      precision: coordinates ? 'Verified public map position' : 'List only—no verified public map point'
    };
  }

  function initialise() {
    const data = window.LumeyaData;
    const status = document.getElementById('map-status');
    const mapElement = document.getElementById('discovery-map');
    const listElement = document.getElementById('map-list-panel');
    if (!data || !status || !mapElement || !listElement) {
      if (status) status.textContent = 'Map data is temporarily unavailable.';
      if (listElement) listElement.innerHTML = '<div class="state-card state-card--unavailable"><strong>Location data is unavailable</strong><span>Try again later, or browse service and provider pages.</span></div>';
      document.getElementById('map-layout')?.classList.add('map-layout--list-only');
      return;
    }

    const entries = [
      ...(data.providers || data.practitioners).map((record) => entryFrom(record, 'provider')),
      ...data.places.map((record) => entryFrom(record, 'place'))
    ];
    const hasVerifiedMapPoint = entries.some((entry) => entry.coordinates);
    const topicMap = new Map((data.topics || []).map((topic) => [topic.id, topic.label]));
    const citySelect = document.getElementById('map-city-filter');
    const topicSelect = document.getElementById('map-topic-filter');
    const typeSelect = document.getElementById('map-type-filter');
    const search = document.getElementById('map-search');
    const reset = document.getElementById('map-reset-filters');
    const mapButton = document.getElementById('show-map-view');
    const listButton = document.getElementById('show-list-view');
    const mapPanel = document.getElementById('map-panel');
    const mapLayout = document.getElementById('map-layout');
    const mapUnavailable = document.getElementById('map-no-points');
    const mapElementUnavailable = document.getElementById('map-no-filter-points');
    const params = new URLSearchParams(window.location.search);
    if (search) search.value = params.get('q') || params.get('search') || '';

    if (!data) {
      status.textContent = 'Location data is temporarily unavailable.';
      return;
    }

    Array.from(new Set(entries.map((entry) => entry.city).filter(Boolean))).sort().forEach((city) => {
      citySelect.insertAdjacentHTML('beforeend', `<option value="${escapeHtml(slug(city))}">${escapeHtml(city)}</option>`);
    });
    (data.topics || []).forEach((topic) => {
      topicSelect.insertAdjacentHTML('beforeend', `<option value="${escapeHtml(topic.id)}">${escapeHtml(topic.label)}</option>`);
    });

    let map = null;
    let markerLayer = null;
    const markerById = new Map();
    if (window.L && hasVerifiedMapPoint) {
      map = window.L.map(mapElement, { scrollWheelZoom: false }).setView(PRAGUE_VIEW, 11);
      window.L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
        maxZoom: 19,
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
      }).addTo(map);
      markerLayer = window.L.layerGroup().addTo(map);
    }

    function matches(entry) {
      const city = citySelect.value;
      const topic = topicSelect.value;
      const type = typeSelect.value;
      const query = slug(search && search.value);
      const haystack = slug([entry.name, entry.description, entry.city, entry.country, entry.typeLabel,
        entry.topicIds.map((id) => topicMap.get(id) || id).join(' ')].join(' '));
      return (!query || haystack.includes(query))
        && (city === 'all' || slug(entry.city) === city)
        && (topic === 'all' || entry.topicIds.includes(topic))
        && (type === 'all' || (type === 'provider' ? entry.kind === 'provider' : entry.kind === type));
    }

    function card(entry) {
      const topics = entry.topicIds.map((id) => topicMap.get(id)).filter(Boolean).slice(0, 3);
      const links = [
        entry.url ? `<a href="${escapeHtml(entry.url)}">View ${escapeHtml(entry.typeLabel.toLowerCase())}</a>` : '',
        entry.contactUrl ? `<a href="${escapeHtml(entry.contactUrl)}"${newTabAttributes(entry.contactUrl)}>Contact</a>` : ''
      ].filter(Boolean).join('');
      return `<article class="entity-card" data-map-entry="${escapeHtml(entry.id)}">
        <div class="entity-card__topline"><span class="status-pill">${escapeHtml(entry.typeLabel)}</span><span class="entity-tag">${escapeHtml(entry.precision)}</span></div>
        <h2>${escapeHtml(entry.name)}</h2>
        <p>${escapeHtml(entry.description)}</p>
        <dl class="entity-card__facts"><div class="entity-card__fact"><dt>Location</dt><dd>${escapeHtml([entry.city, entry.country].filter(Boolean).join(', ') || 'Not published')}</dd></div><div class="entity-card__fact"><dt>Status</dt><dd>${escapeHtml(entry.status || 'Not published')}</dd></div></dl>
        <div class="tag-list">${topics.map((label) => `<span class="entity-tag">${escapeHtml(label)}</span>`).join('')}</div>
        <div class="entity-card__links">${links}</div>
      </article>`;
    }

    if (!hasVerifiedMapPoint) {
      if (mapUnavailable) {
        mapUnavailable.hidden = false;
        mapUnavailable.textContent = 'No verified public map positions are published yet. All location details remain in the list.';
      }
      if (mapButton) mapButton.disabled = true;
    } else if (!window.L) {
      if (mapUnavailable) {
        mapUnavailable.hidden = false;
        mapUnavailable.textContent = 'The map view is temporarily unavailable. The location list remains available.';
      }
      if (mapButton) mapButton.disabled = true;
    } else if (mapButton) {
      mapButton.disabled = false;
    }

    function render() {
      const visible = entries.filter(matches);
      listElement.innerHTML = visible.length ? visible.map(card).join('') : '<div class="state-card"><strong>No locations match these filters</strong><span>Clear the filters or try another city, topic or listing type.</span><button class="button" type="button" data-map-reset>Clear filters</button></div>';
      markerById.clear();

      if (map && markerLayer) {
        markerLayer.clearLayers();
        const bounds = [];
        visible.filter((entry) => entry.coordinates).forEach((entry) => {
          const icon = window.L.divIcon({
            className: '',
            html: `<span class="map-marker map-marker--${entry.kind}" aria-hidden="true">${entry.kind === 'place' ? '⌂' : 'P'}</span>`,
            iconSize: [36, 36],
            iconAnchor: [18, 18]
          });
          const marker = window.L.marker(entry.coordinates, { icon, title: entry.name }).bindPopup(
            `<strong>${escapeHtml(entry.name)}</strong><br>${escapeHtml(entry.typeLabel)} · ${escapeHtml(entry.precision)}<br>${entry.url ? `<a href="${escapeHtml(entry.url)}">Open details</a>` : ''}`
          );
          marker.addTo(markerLayer);
          markerById.set(entry.id, marker);
          bounds.push(entry.coordinates);
        });
        if (bounds.length > 1) map.fitBounds(bounds, { padding: [40, 40], maxZoom: 12 });
        else if (bounds.length === 1) map.setView(bounds[0], 12);
      }

      const mapped = visible.filter((entry) => entry.coordinates).length;
      status.textContent = !visible.length
        ? 'No providers or places match the current filters.'
        : mapped
          ? `${visible.length} result${visible.length === 1 ? '' : 's'} · ${mapped} verified public map position${mapped === 1 ? '' : 's'}. Listings without verified coordinates remain list-only.`
          : 'These results have no verified public map points. Their available locations remain in the list.';
      if (mapElementUnavailable) {
        mapElementUnavailable.hidden = mapped > 0;
        if (!mapped) mapElementUnavailable.textContent = visible.length
          ? 'No verified public map positions match these filters. Switch to List to review these records.'
          : 'No providers or places match these filters. Clear filters to browse all published locations.';
      }
      if (mapElement) mapElement.hidden = mapped === 0;

      listElement.querySelectorAll('[data-map-entry]').forEach((element) => {
        element.addEventListener('click', (event) => {
          if (event.target.closest('a')) return;
          const marker = markerById.get(element.dataset.mapEntry);
          if (marker && map) {
            document.getElementById('show-map-view').click();
            map.setView(marker.getLatLng(), 13);
            marker.openPopup();
          }
        });
      });
      listElement.querySelector('[data-map-reset]')?.addEventListener('click', resetFilters);
    }

    function resetFilters() {
      citySelect.value = 'all';
      topicSelect.value = 'all';
      typeSelect.value = 'all';
      if (search) search.value = '';
      render();
      if (search) search.focus();
    }

    [citySelect, topicSelect, typeSelect].forEach((control) => control.addEventListener('change', render));
    if (search) search.addEventListener('input', render);
    if (reset) reset.addEventListener('click', resetFilters);

    function setView(view) {
      const showMap = view === 'map';
      if (showMap && (!hasVerifiedMapPoint || !map)) return;
      if (mapLayout) mapLayout.classList.toggle('map-layout--list-only', !showMap);
      mapPanel.hidden = !showMap;
      listElement.hidden = showMap;
      mapButton.setAttribute('aria-pressed', String(showMap));
      listButton.setAttribute('aria-pressed', String(!showMap));
      if (showMap && map) window.setTimeout(() => map.invalidateSize(), 0);
    }
    mapButton.addEventListener('click', () => setView('map'));
    listButton.addEventListener('click', () => setView('list'));

    render();
    setView(window.matchMedia('(max-width: 640px)').matches || !hasVerifiedMapPoint ? 'list' : 'map');
  }

  document.addEventListener('DOMContentLoaded', initialise);
})();
