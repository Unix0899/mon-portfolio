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
