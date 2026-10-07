/* Small UI helpers shared by all pages. Everything degrades gracefully without JS. */
(function () {
  var root = document.documentElement;

  // Local preview: show which proof file is expected in empty evidence slots
  if (/^(localhost|127\.0\.0\.1|)$/.test(location.hostname)) root.classList.add('dev');

  // Highlight the nav link of the section currently on screen
  var navLinks = document.querySelectorAll('header nav a[href^="#"]');
  if (navLinks.length && 'IntersectionObserver' in window) {
    var byId = {};
    navLinks.forEach(function (a) { byId[a.getAttribute('href').slice(1)] = a; });
    var spy = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (!e.isIntersecting) return;
        navLinks.forEach(function (a) { a.classList.remove('active'); });
        var link = byId[e.target.id];
        if (link) link.classList.add('active');
      });
    }, { rootMargin: '-45% 0px -50% 0px' });
    Object.keys(byId).forEach(function (id) {
      var s = document.getElementById(id);
      if (s) spy.observe(s);
    });
  }

  // Reveal on scroll for elements marked .reveal (CSS in common.css); no-op without IntersectionObserver
  var revealEls = document.querySelectorAll('.reveal');
  if (revealEls.length) {
    if ('IntersectionObserver' in window) {
      var rev = new IntersectionObserver(function (entries) {
        entries.forEach(function (e) {
          if (!e.isIntersecting) return;
          e.target.classList.add('in');
          rev.unobserve(e.target);
        });
      }, { rootMargin: '0px 0px -8% 0px', threshold: 0.08 });
      revealEls.forEach(function (el) { rev.observe(el); });
    } else {
      revealEls.forEach(function (el) { el.classList.add('in'); });
    }
  }

  // Reading progress bar (case study pages)
  var bar = document.querySelector('.progress');
  if (bar) {
    var update = function () {
      var h = document.documentElement.scrollHeight - window.innerHeight;
      bar.style.transform = 'scaleX(' + (h > 0 ? Math.min(window.scrollY / h, 1) : 0) + ')';
    };
    window.addEventListener('scroll', update, { passive: true });
    window.addEventListener('resize', update);
    update();
  }

  // ---- Home gateway: animated transition between the two project families
  var reduced = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var overlay = document.querySelector('.path-overlay');
  var LABELS = { data: ['01', 'Data · Business · Analytics'], mkt: ['02', 'Marketing · Communication'] };
  var busy = false;
  document.querySelectorAll('[data-path]').forEach(function (a) {
    a.addEventListener('click', function (e) {
      var href = a.getAttribute('href') || '';
      var isHash = href.charAt(0) === '#';
      var target = isHash ? document.getElementById(href.slice(1)) : null;
      if (!overlay || reduced || busy || (isHash && !target)) return; // plain navigation
      if (e.metaKey || e.ctrlKey || e.shiftKey || e.button === 1) return;
      e.preventDefault();
      busy = true;
      var kind = a.getAttribute('data-path');
      var r = a.getBoundingClientRect();
      overlay.style.setProperty('--x', (e.clientX || r.left + r.width / 2) + 'px');
      overlay.style.setProperty('--y', (e.clientY || r.top + r.height / 2) + 'px');
      overlay.querySelector('.po-no').textContent = LABELS[kind][0];
      overlay.querySelector('.po-label').textContent = LABELS[kind][1];
      overlay.className = 'path-overlay ' + kind;
      // next frame: expand
      requestAnimationFrame(function () { requestAnimationFrame(function () { overlay.classList.add('in'); }); });
      setTimeout(function () {
        if (!isHash) { location.href = href; return; } // next page plays its own entrance
        root.style.scrollBehavior = 'auto';
        target.scrollIntoView({ block: 'start' });
        root.style.scrollBehavior = '';
        try { history.replaceState(null, '', href); } catch (err) {}
        document.querySelectorAll('.fam-section.is-active').forEach(function (s) { s.classList.remove('is-active'); });
        target.classList.add('is-active');
        overlay.classList.add('out');
        setTimeout(function () { overlay.className = 'path-overlay'; busy = false; }, 450);
      }, 720);
    });
  });

  // Parallax on the marketing panel mockups (pointer only)
  var mkt = document.querySelector('.path-mkt');
  if (mkt && !reduced && window.matchMedia('(pointer: fine)').matches) {
    mkt.addEventListener('mousemove', function (e) {
      var r = mkt.getBoundingClientRect();
      mkt.style.setProperty('--px', ((e.clientX - r.left) / r.width - .5).toFixed(3));
      mkt.style.setProperty('--py', ((e.clientY - r.top) / r.height - .5).toFixed(3));
    });
    mkt.addEventListener('mouseleave', function () { mkt.style.setProperty('--px', 0); mkt.style.setProperty('--py', 0); });
  }

  // Floating family switcher: visible once the gateway has been scrolled past
  var famSwitch = document.querySelector('.fam-switch');
  var gateway = document.getElementById('paths') || document.querySelector('.hero-v2, .mkp-hero');
  if (famSwitch && gateway && 'IntersectionObserver' in window) {
    var contact = document.getElementById('contact');
    var pastGateway = false, atContact = false;
    var refresh = function () { famSwitch.classList.toggle('show', pastGateway && !atContact); };
    new IntersectionObserver(function (entries) {
      entries.forEach(function (en) { pastGateway = !en.isIntersecting && en.boundingClientRect.bottom < 0; });
      refresh();
    }, { threshold: 0 }).observe(gateway);
    if (contact) new IntersectionObserver(function (entries) {
      entries.forEach(function (en) { atContact = en.isIntersecting; }); refresh();
    }, { threshold: 0.4 }).observe(contact);
    var famLinks = famSwitch.querySelectorAll('a');
    var proj = document.getElementById('projects');
    if (proj && document.getElementById('marketing')) new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (!en.isIntersecting) return;
        famLinks.forEach(function (l) { l.classList.toggle('active', l.getAttribute('href') === '#' + en.target.id); });
      });
    }, { rootMargin: '-40% 0px -50% 0px' }).observe(proj);
    var mk = document.getElementById('marketing');
    if (mk && proj) new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (!en.isIntersecting) return;
        famLinks.forEach(function (l) { l.classList.toggle('active', l.getAttribute('href') === '#marketing'); });
      });
    }, { rootMargin: '-40% 0px -50% 0px' }).observe(mk);
  }

  // Count-up on key figures ([data-count]) when they enter the viewport
  var counters = document.querySelectorAll('[data-count]');
  if (counters.length && 'IntersectionObserver' in window && !reduced) {
    var runCount = function (el) {
      var raw = el.getAttribute('data-count');
      var m = raw.match(/^([^0-9]*)([0-9][0-9,\.]*)(.*)$/);
      if (!m) return;
      var prefix = m[1], suffix = m[3], numStr = m[2].replace(/,/g, '');
      var decimals = (numStr.split('.')[1] || '').length, end = parseFloat(numStr);
      var start = null, dur = 1100;
      var fmt = function (v) {
        var s = v.toFixed(decimals);
        if (end >= 1000) s = s.replace(/\B(?=(\d{3})+(?!\d))/g, ',');
        return prefix + s + suffix;
      };
      var step = function (ts) {
        if (start === null) start = ts;
        var p = Math.min((ts - start) / dur, 1), eased = 1 - Math.pow(1 - p, 3);
        el.textContent = fmt(end * eased);
        if (p < 1) requestAnimationFrame(step); else el.textContent = raw;
      };
      requestAnimationFrame(step);
    };
    var co = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (!en.isIntersecting) return;
        co.unobserve(en.target); runCount(en.target);
      });
    }, { threshold: 0.6 });
    counters.forEach(function (c) { co.observe(c); });
  }

  // Code evidence: load a real extract from the proof folder, or show the "in preparation" state
  document.querySelectorAll('[data-proof-code]').forEach(function (pre) {
    var fig = pre.closest('figure');
    var missing = function () { if (fig) fig.classList.add('missing'); };
    if (!window.fetch) return missing();
    fetch(pre.getAttribute('data-proof-code'))
      .then(function (r) { if (!r.ok) throw 0; return r.text(); })
      .then(function (t) { if (!t.trim()) throw 0; pre.textContent = t.replace(/\s+$/, ''); })
      .catch(missing);
  });
})();

  // Galleries: show the first N items, the rest behind a button (keeps the page readable)
  document.querySelectorAll('[data-collapse]').forEach(function (box) {
    var n = parseInt(box.getAttribute('data-collapse'), 10) || 4;
    var items = Array.prototype.slice.call(box.children);
    if (items.length <= n) return;
    var extra = items.slice(n); extra.forEach(function (el) { el.classList.add('is-extra'); });
    var btn = document.createElement('button'); btn.type = 'button'; btn.className = 'collapse-btn';
    var more = (box.getAttribute('data-more') || 'Show all') + ' (' + items.length + ')', less = box.getAttribute('data-less') || 'Show less';
    btn.textContent = more; btn.setAttribute('aria-expanded', 'false');
    btn.addEventListener('click', function () {
      var open = box.classList.toggle('is-open');
      extra.forEach(function (el) { el.classList.toggle('is-extra', !open); if (open) el.classList.add('in'); });
      btn.textContent = open ? less : more; btn.setAttribute('aria-expanded', String(open));
      if (!open) box.scrollIntoView({ block: 'start', behavior: 'smooth' });
    });
    box.parentNode.insertBefore(btn, box.nextSibling);
  });
