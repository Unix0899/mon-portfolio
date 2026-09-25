/*
 * Language switcher (EN / FR / NL).
 * English lives in the HTML; FR and NL come from window.I18N_DICT (one file per page).
 *  - data-i18n="key"             → innerHTML is translated
 *  - data-i18n-attr="attr:key;…" → attributes are translated (e.g. meta description)
 */
(function () {
  var LANGS = ['en', 'fr', 'nl'];
  var dict = window.I18N_DICT || {};
  var root = document.documentElement;
  var defaults = {};
  var attrDefaults = [];

  document.querySelectorAll('[data-i18n]').forEach(function (el) {
    defaults[el.getAttribute('data-i18n')] = el.innerHTML;
  });
  document.querySelectorAll('[data-i18n-attr]').forEach(function (el) {
    el.getAttribute('data-i18n-attr').split(';').forEach(function (pair) {
      var p = pair.split(':');
      var attr = p[0].trim(), key = p[1].trim();
      defaults[key] = el.getAttribute(attr);
      attrDefaults.push({ el: el, attr: attr, key: key });
    });
  });

  function t(key, lang) {
    lang = lang || current;
    var d = dict[lang];
    if (d && d[key] != null) return d[key];
    if (dict.en && dict.en[key] != null && defaults[key] == null) return dict.en[key];
    return defaults[key] != null ? defaults[key] : key;
  }

  function apply(lang) {
    current = lang;
    document.querySelectorAll('[data-i18n]').forEach(function (el) {
      el.innerHTML = t(el.getAttribute('data-i18n'), lang);
    });
    attrDefaults.forEach(function (a) { a.el.setAttribute(a.attr, t(a.key, lang)); });
    root.lang = lang;
    root.setAttribute('data-lang', lang);
    document.querySelectorAll('[data-lang-btn]').forEach(function (b) {
      b.setAttribute('aria-pressed', String(b.getAttribute('data-lang-btn') === lang));
    });
    root.classList.remove('i18n-pending');
    document.dispatchEvent(new CustomEvent('langchange', { detail: lang }));
  }

  function save(lang) {
    try { localStorage.setItem('lang', lang); } catch (e) {}
    try {
      var url = new URL(location.href);
      url.searchParams.set('lang', lang);
      history.replaceState(null, '', url);
    } catch (e) {}
  }

  var current = root.getAttribute('data-lang');
  if (LANGS.indexOf(current) < 0) current = 'en';

  document.querySelectorAll('[data-lang-btn]').forEach(function (b) {
    b.addEventListener('click', function () {
      var lang = b.getAttribute('data-lang-btn');
      if (lang === current) return;
      apply(lang);
      save(lang);
    });
  });

  window.i18n = { t: function (key) { return t(key); }, lang: function () { return current; } };
  apply(current);
})();
