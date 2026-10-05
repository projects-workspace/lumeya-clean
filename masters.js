(function (root) {
  'use strict';

  var initialized = false;

  function escapeHtml(value) {
    return String(value == null ? '' : value)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }

  function normalize(value) {
    return String(value || '')
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9]+/g, '-');
  }

  function safeUrl(value) {
    var url = String(value || '').trim();
    if (!url || url.startsWith('//') || /^javascript:/i.test(url) || /^data:/i.test(url)) return '';
    if (/^(https?:\/\/|mailto:|tel:|\/|\.\.?\/|#)/i.test(url)) return url;
    return /^[a-z0-9][a-z0-9._/-]*(?:[?#].*)?$/i.test(url) ? url : '';
  }

  function newTabAttributes(url) {
    return /^https?:\/\//i.test(url) ? ' target="_blank" rel="noopener noreferrer"' : '';
  }

  function initials(name) {
    return String(name || '')
      .split(/\s+/)
      .filter(Boolean)
      .slice(0, 2)
      .map(function (part) { return part.charAt(0).toUpperCase(); })
      .join('') || 'L';
  }

  function fact(label, value) {
    return '<div class="entity-card__fact"><dt>' + escapeHtml(label) + '</dt><dd>' + escapeHtml(value || 'Not published') + '</dd></div>';
  }

  function linkedFact(label, records, labelField, urlField) {
    if (!records.length) return '';
    var links = records.map(function (record) {
      var url = safeUrl(record[urlField]);
      return url
        ? '<a href="' + escapeHtml(url) + '">' + escapeHtml(record[labelField]) + '</a>'
        : '<span>' + escapeHtml(record[labelField]) + '</span>';
    });
    return '<div class="entity-card__fact"><dt>' + escapeHtml(label) + '</dt><dd>' + links.join(', ') + '</dd></div>';
  }

  function visual(practitioner) {
    var image = safeUrl(practitioner.image);
    if (image) {
      return '<div class="entity-card__visual"><img src="' + escapeHtml(image) + '" alt="' + escapeHtml(practitioner.imageAlt || practitioner.name) + '"></div>';
    }
    return '<div class="entity-card__visual practitioner-mark" aria-hidden="true">' + escapeHtml(initials(practitioner.name)) + '</div>';
  }

  function renderCard(practitioner, data) {
    var topics = data.related(practitioner, 'topics', 'topicIds');
    var services = data.related(practitioner, 'services', 'serviceIds');
    var places = data.related(practitioner, 'places', 'placeIds');
    var formats = data.related(practitioner, 'eventFormats', 'eventFormatIds');
    var profileUrl = safeUrl(practitioner.profileUrl);
    profileUrl = profileUrl || safeUrl(practitioner.detailUrl);
    var contactUrl = safeUrl(practitioner.contactUrl);
    var titleId = 'practitioner-' + escapeHtml(practitioner.id) + '-title';
    var typeLabel = practitioner.type === 'organisation' ? 'Organisation' : 'Practitioner';
    var fields = Array.isArray(practitioner.fields) ? practitioner.fields : [];
    var languages = Array.isArray(practitioner.languages) ? practitioner.languages : [];
    var actions = [];

    if (profileUrl) {
      actions.push('<a class="entity-card__action" href="' + escapeHtml(profileUrl) + '" aria-label="View ' + escapeHtml(practitioner.name) + ' profile">View profile</a>');
    }
    if (contactUrl) {
      actions.push('<a class="button button--primary" href="' + escapeHtml(contactUrl) + '"' + newTabAttributes(contactUrl) + ' aria-label="' + escapeHtml(practitioner.contactLabel + ' about ' + practitioner.name) + '">' + escapeHtml(practitioner.contactLabel) + '</a>');
    }

    return '<article class="entity-card" id="provider-' + escapeHtml(practitioner.id) + '" data-practitioner-id="' + escapeHtml(practitioner.id) + '" aria-labelledby="' + titleId + '">' +
      visual(practitioner) +
      '<div class="entity-card__topline"><span class="status-pill">' + typeLabel + '</span><span class="entity-tag">' + escapeHtml(practitioner.city || practitioner.location) + '</span></div>' +
      '<h2 id="' + titleId + '">' + escapeHtml(practitioner.name) + '</h2>' +
      '<p>' + escapeHtml(practitioner.shortDescription) + '</p>' +
      '<div class="tag-list" aria-label="Fields">' + fields.map(function (field) { return '<span class="entity-tag">' + escapeHtml(field) + '</span>'; }).join('') + '</div>' +
      '<dl class="entity-card__facts">' +
        fact('Approach', practitioner.approach) +
        fact('Location', practitioner.location) +
        fact('Languages', languages.length ? languages.join(', ') : 'Not published') +
        fact('Online', practitioner.onlineAvailability) +
        fact('Experience', practitioner.experience) +
        (practitioner.image ? fact('Photo', 'Provider supplied') : '') +
        linkedFact('Services', services, 'title', 'detailUrl') +
        linkedFact('Places', places, 'name', 'detailUrl') +
        linkedFact('Formats', formats, 'title', 'detailUrl') +
      '</dl>' +
      '<div class="entity-card__links">' + actions.join('') + '</div>' +
      '<a class="entity-card__action" href="join.html?correct=providers&amp;id=' + encodeURIComponent(practitioner.id) + '#join-form">Suggest a correction</a>' +
    '</article>';
  }

  function populateTopics(select, data) {
    if (!select || select.options.length > 1) return;
    var used = {};
    (data.providers || data.practitioners).forEach(function (record) {
      (record.topicIds || []).forEach(function (id) { used[id] = true; });
    });
    data.topics.forEach(function (topic) {
      if (!used[topic.id]) return;
      var option = document.createElement('option');
      option.value = topic.id;
      option.textContent = topic.label;
      select.appendChild(option);
    });
  }

  function boot() {
    if (initialized) return;
    var grid = document.getElementById('masters-grid');
    if (!grid) return;
    if (!root.LumeyaData) {
      var unavailable = document.getElementById('masters-data-unavailable');
      if (unavailable) unavailable.hidden = false;
      return;
    }
    initialized = true;

    var data = root.LumeyaData;
    var providers = data.providers || data.practitioners || [];
    var search = document.querySelector('#masters-search, #practitioners-search, [data-discovery-search="practitioners"]');
    var cityFilter = document.querySelector('#masters-city-filter, [data-practitioner-filter="city"]');
    var topicFilter = document.querySelector('#masters-topic-filter, [data-practitioner-filter="topic"]');
    var empty = document.getElementById('masters-empty');
    var reset = document.querySelector('#masters-reset-filters, #reset-master-filters');
    var count = document.querySelector('#masters-results-count, [data-results-count="practitioners"]');
    var emptyTitle = empty && empty.querySelector('strong');
    var emptyDescription = empty && empty.querySelector('[data-empty-description]');
    var params = new URLSearchParams(root.location.search);
    if (search && !search.value) search.value = params.get('q') || params.get('search') || '';

    if (cityFilter) {
      var knownCities = new Set(Array.from(cityFilter.options).map(function (option) { return option.value; }));
      Array.from(new Set(providers.map(function (record) { return record.city; }).filter(Boolean))).sort().forEach(function (city) {
        var value = normalize(city);
        if (knownCities.has(value)) return;
        var option = document.createElement('option');
        option.value = value;
        option.textContent = city;
        cityFilter.appendChild(option);
      });
    }

    populateTopics(topicFilter, data);

    function haystack(practitioner) {
      var topicLabels = data.related(practitioner, 'topics', 'topicIds').map(function (topic) { return topic.label; });
      var serviceTitles = data.related(practitioner, 'services', 'serviceIds').map(function (service) { return service.title; });
      return normalize([
        practitioner.name,
        practitioner.shortDescription,
        practitioner.approach,
        (practitioner.fields || []).join(' '),
        practitioner.location,
        (practitioner.languages || []).join(' '),
        topicLabels.join(' '),
        serviceTitles.join(' ')
      ].join(' '));
    }

    function render() {
      var query = normalize(search && search.value);
      var city = normalize(cityFilter && cityFilter.value);
      var topic = topicFilter ? topicFilter.value : 'all';
      var visible = providers.filter(function (practitioner) {
        return (!query || haystack(practitioner).indexOf(query) !== -1) &&
          (!city || city === 'all' || normalize(practitioner.city) === city) &&
          (!topic || topic === 'all' || (practitioner.topicIds || []).indexOf(topic) !== -1);
      });

      grid.innerHTML = visible.map(function (practitioner) { return renderCard(practitioner, data); }).join('');
      if (empty) {
        empty.hidden = visible.length !== 0;
        if (!visible.length && emptyTitle && emptyDescription) {
          if (!providers.length) {
            emptyTitle.textContent = 'No published practitioners or providers yet';
            emptyDescription.textContent = 'Browse services and places, or invite a provider to introduce their work.';
          } else {
            emptyTitle.textContent = 'No providers match these filters';
            emptyDescription.textContent = 'Clear the filters or try a broader search across published provider information.';
          }
        }
      }
      if (count) count.textContent = visible.length + (visible.length === 1 ? ' provider' : ' providers');
    }

    [search, cityFilter, topicFilter].forEach(function (control) {
      if (!control) return;
      control.addEventListener(control.tagName === 'INPUT' ? 'input' : 'change', render);
    });

    if (reset) {
      reset.addEventListener('click', function () {
        if (search) search.value = '';
        if (cityFilter) cityFilter.value = 'all';
        if (topicFilter) topicFilter.value = 'all';
        render();
        if (search) search.focus();
      });
    }

    render();
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot);
  else boot();
  document.addEventListener('lumeya:data-ready', boot);
})(window);
