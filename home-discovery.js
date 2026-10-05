(function (root) {
  'use strict';

  function normalize(value) {
    return String(value || '').toLowerCase().normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9]+/g, ' ').trim();
  }

  function categoryFor(topic, data) {
    var record = data.getById('topics', topic);
    return record && record.categoryId;
  }

  function categoryHasServices(category, data) {
    return data.services.some(function (service) {
      return (service.topicIds || []).some(function (id) { return categoryFor(id, data) === category.id; });
    });
  }

  function renderCategories(data) {
    var host = document.getElementById('home-categories');
    if (!host) return;
    host.innerHTML = (data.categories || []).map(function (category) {
      var available = categoryHasServices(category, data);
      return '<article class="category-card">' +
        '<h3>' + category.label.replace(/[&<>"']/g, function (c) { return ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#039;' })[c]; }) + '</h3>' +
        '<p>' + category.description.replace(/[&<>"']/g, function (c) { return ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#039;' })[c]; }) + '</p>' +
        '<span class="category-card__status">' + (available ? 'Published service entries are listed' : 'No published services in this category yet') + '</span>' +
        '<a class="button category-card__action" href="services.html?category=' + encodeURIComponent(category.id) + '">Explore category</a>' +
      '</article>';
    }).join('');
  }

  function renderSearchChoices(data) {
    var list = document.getElementById('discovery-search-options');
    if (!list) return;
    var choices = []
      .concat((data.categories || []).map(function (item) { return item.label; }))
      .concat(data.topics.map(function (item) { return item.label; }))
      .concat(data.services.map(function (item) { return item.title; }))
      .concat((data.providers || data.practitioners).map(function (item) { return item.name; }))
      .concat(data.places.map(function (item) { return item.name; }))
      .concat(data.eventFormats.map(function (item) { return item.title; }));
    list.innerHTML = Array.from(new Set(choices)).map(function (label) {
      var option = document.createElement('option');
      option.value = label;
      return option.outerHTML;
    }).join('');
  }

  function connectSearch(data) {
    var form = document.getElementById('home-discovery-search');
    var input = document.getElementById('home-discovery-query');
    if (!form || !input) return;
    form.addEventListener('submit', function (event) {
      event.preventDefault();
      var query = input.value.trim();
      if (!query) {
        input.focus();
        return;
      }
      var needle = normalize(query);
      var candidates = [
        { records: data.services, path: 'services.html', name: function (item) { return item.title; }, text: function (item) { return [item.title, item.description].join(' '); } },
        { records: data.providers || data.practitioners, path: 'masters.html', name: function (item) { return item.name; }, text: function (item) { return [item.name, item.shortDescription, item.approach].join(' '); } },
        { records: data.places, path: 'map.html', name: function (item) { return item.name; }, text: function (item) { return [item.name, item.description, item.city, item.country].join(' '); } },
        { records: data.eventFormats, path: 'events.html', name: function (item) { return item.title; }, text: function (item) { return [item.title, item.description, item.organizer].join(' '); } },
      ];
      var match = null;
      for (var index = 0; index < candidates.length && !match; index += 1) {
        var candidate = candidates[index];
        match = candidate.records.find(function (item) { return normalize(candidate.name(item)) === needle; }) ||
          candidate.records.find(function (item) { return normalize(candidate.text(item)).indexOf(needle) !== -1; });
        if (match) {
          root.location.href = candidate.path + '?q=' + encodeURIComponent(query);
          return;
        }
      }
      var category = (data.categories || []).find(function (item) { return normalize(item.label) === needle; });
      if (category) {
        root.location.href = 'services.html?category=' + encodeURIComponent(category.id);
        return;
      }
      var topic = data.topics.find(function (item) { return normalize(item.label) === needle || normalize(item.id.replace(/-/g, ' ')) === needle; });
      if (topic) {
        root.location.href = 'services.html?category=' + encodeURIComponent(topic.categoryId);
        return;
      }
      root.location.href = 'services.html?q=' + encodeURIComponent(query);
    });
  }

  function boot() {
    var data = root.LumeyaData;
    if (!data) {
      var state = document.getElementById('home-catalog-state');
      if (state) state.hidden = false;
      return;
    }
    renderCategories(data);
    renderSearchChoices(data);
    connectSearch(data);
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot);
  else boot();
  document.addEventListener('lumeya:data-ready', boot);
})(window);
