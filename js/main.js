/* Krow — site etkileşimleri (vanilla JS, bağımlılık yok; Lottie için js/vendor/lottie_light.min.js) */
(function () {
  'use strict';
  var doc = document.documentElement;
  doc.classList.remove('no-js');
  doc.classList.add('js');

  var $ = function (s, c) { return (c || document).querySelector(s); };
  var $$ = function (s, c) { return Array.prototype.slice.call((c || document).querySelectorAll(s)); };
  var reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ---------- Mega menüler (masaüstü) ---------- */
  var overlay = $('[data-mega-overlay]');
  var megaButtons = $$('[data-mega]');
  function closeMega() {
    megaButtons.forEach(function (b) {
      b.setAttribute('aria-expanded', 'false');
      var p = document.getElementById(b.getAttribute('aria-controls'));
      if (p) p.hidden = true;
    });
    if (overlay) overlay.hidden = true;
  }
  megaButtons.forEach(function (btn) {
    btn.addEventListener('click', function (e) {
      e.stopPropagation();
      var open = btn.getAttribute('aria-expanded') === 'true';
      closeMega();
      if (!open) {
        btn.setAttribute('aria-expanded', 'true');
        document.getElementById(btn.getAttribute('aria-controls')).hidden = false;
        if (overlay) overlay.hidden = false;
      }
    });
  });
  document.addEventListener('click', function (e) {
    if (!e.target.closest('.mega') ) closeMega();
  });
  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape') { closeMega(); closeMobile(); }
  });

  /* ---------- Mobil / tablet menü ---------- */
  var toggle = $('.menu-toggle');
  var mobileMenu = $('#mobile-menu');
  function closeMobile() {
    if (!toggle || !mobileMenu) return;
    toggle.setAttribute('aria-expanded', 'false');
    toggle.setAttribute('aria-label', toggle.dataset.labelOpen);
    mobileMenu.hidden = true;
    document.body.classList.remove('menu-open');
  }
  if (toggle && mobileMenu) {
    toggle.addEventListener('click', function () {
      var open = toggle.getAttribute('aria-expanded') === 'true';
      if (open) return closeMobile();
      toggle.setAttribute('aria-expanded', 'true');
      toggle.setAttribute('aria-label', toggle.dataset.labelClose);
      mobileMenu.hidden = false;
      document.body.classList.add('menu-open');
    });
    window.matchMedia('(min-width: 1200px)').addEventListener('change', function (m) { if (m.matches) closeMobile(); });
  }

  /* ---------- Dil seçici: diğer dildeki aynı sayfaya git ---------- */
  $$('.js-lang-select').forEach(function (sel) {
    sel.addEventListener('change', function () {
      var url = sel.dataset[sel.value];
      if (url) window.location.href = url;
    });
  });

  /* ---------- Sonsuz döngülü kaydırıcı (mobil/tablet) ---------- */
  function Carousel(root) {
    var track = $('.carousel__track', root);
    var items = Array.prototype.slice.call(track.children);
    var n = items.length;
    if (n < 2) return;
    // baş ve sona kopyalar ekle
    items.forEach(function (it) { var c = it.cloneNode(true); c.setAttribute('aria-hidden', 'true'); track.appendChild(c); });
    items.slice().reverse().forEach(function (it) { var c = it.cloneNode(true); c.setAttribute('aria-hidden', 'true'); track.insertBefore(c, track.firstChild); });
    var index = n, timer = null, delay = +root.dataset.autoplay || 3000;
    function stepW() { var a = track.children[0], b = track.children[1]; return b.getBoundingClientRect().left - a.getBoundingClientRect().left; }
    function go(i, animate) {
      index = i;
      track.style.transition = animate ? 'transform .6s cubic-bezier(.44,0,.56,1)' : 'none';
      track.style.transform = 'translateX(' + (-index * stepW()) + 'px)';
    }
    track.addEventListener('transitionend', function () {
      if (index >= 2 * n) go(index - n, false);
      if (index < n) go(index + n, false);
    });
    // yalnızca ekranda görünürken otomatik oynat
    var inView = false;
    if ('IntersectionObserver' in window) {
      new IntersectionObserver(function (en) { inView = en[0].isIntersecting; }, { threshold: 0.3 }).observe(root);
    } else { inView = true; }
    function visible() { return inView && root.offsetParent !== null; }
    function play() { stop(); if (!reduceMotion) timer = setInterval(function () { if (visible() && !document.hidden) go(index + 1, true); }, delay); }
    function stop() { clearInterval(timer); }
    // kaydırma (swipe)
    var x0 = null;
    root.addEventListener('pointerdown', function (e) { x0 = e.clientX; stop(); });
    root.addEventListener('pointerup', function (e) {
      if (x0 === null) return;
      var dx = e.clientX - x0; x0 = null;
      if (Math.abs(dx) > 40) go(index + (dx < 0 ? 1 : -1), true);
      play();
    });
    window.addEventListener('resize', function () { go(index, false); });
    go(index, false);
    play();
  }
  $$('[data-carousel]').forEach(function (c) { new Carousel(c); });

  /* ---------- Görünür olunca çalıştır ---------- */
  function onVisible(el, cb, opts) {
    if (!('IntersectionObserver' in window)) return cb(el);
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) { if (en.isIntersecting) { io.unobserve(en.target); cb(en.target); } });
    }, opts || { threshold: 0.15 });
    io.observe(el);
  }

  // Kaydırma ile beliren bloklar
  $$('[data-reveal]').forEach(function (el) { onVisible(el, function () { el.classList.add('is-visible'); }, { threshold: 0.1, rootMargin: '0px 0px -40px 0px' }); });

  // Sayaçlar (450+, 10,000,000+, 100,000+)
  function fmt(n) { return Math.round(n).toLocaleString('en-US'); }
  $$('.js-count').forEach(function (el) {
    var to = +el.dataset.to;
    if (reduceMotion) return;
    el.textContent = '0';
    // kaydırıcı kopyalarında da çalışsın diye bölüm görünür olunca başlat
    onVisible(el.closest('section') || el, function () {
      var t0 = null, dur = 2000;
      function step(t) {
        if (!t0) t0 = t;
        var k = Math.min(1, (t - t0) / dur);
        var e = 1 - Math.pow(1 - k, 3);
        el.textContent = fmt(to * e);
        if (k < 1) requestAnimationFrame(step);
      }
      requestAnimationFrame(step);
    }, { threshold: 0.2 });
  });

  // Lottie animasyonları
  $$('.js-lottie').forEach(function (el) {
    onVisible(el, function () {
      if (!window.lottie) return;
      window.lottie.loadAnimation({ container: el, renderer: 'svg', loop: true, autoplay: !reduceMotion, path: el.dataset.src,
        rendererSettings: { preserveAspectRatio: 'xMidYMid meet' } });
    }, { rootMargin: '200px' });
  });

  /* ---------- Yorum kaydırıcısı ---------- */
  $$('[data-slider]').forEach(function (root) {
    var lists = $$('.reviews__list', root);
    var i = 0;
    function show(d) {
      lists.forEach(function (list) {
        var slides = $$('[data-slide]', list);
        var k = ((i + d) % slides.length + slides.length) % slides.length;
        slides.forEach(function (s, j) { s.classList.toggle('is-active', j === k); s.setAttribute('aria-hidden', j === k ? 'false' : 'true'); });
      });
      i = i + d;
    }
    $('[data-prev]', root).addEventListener('click', function () { show(-1); });
    $('[data-next]', root).addEventListener('click', function () { show(1); });
    show(0);
  });

  /* ---------- Yapışkan adımlar (masaüstü) ---------- */
  var steps = $('[data-steps]');
  if (steps) {
    var texts = $$('.step-text', steps), panels = $$('.step-panel', steps), bars = $$('.steps__bar-fill', steps);
    var digit = $('.steps__digit-col', steps), count = texts.length, current = -1, ticking = false;
    function update() {
      ticking = false;
      if (steps.offsetParent === null) return;
      var r = steps.getBoundingClientRect();
      var total = r.height - window.innerHeight;
      var p = total > 0 ? Math.min(1, Math.max(0, -r.top / total)) : 0;
      var f = p * count;
      bars.forEach(function (b, j) { b.style.setProperty('--p', Math.min(1, Math.max(0, f - j)).toFixed(3)); });
      var a = Math.min(count - 1, Math.floor(f));
      if (a !== current) {
        current = a;
        texts.forEach(function (t, j) { t.classList.toggle('is-active', j === a); });
        panels.forEach(function (t, j) { t.classList.toggle('is-active', j === a); });
        digit.style.setProperty('--i', a);
      }
    }
    window.addEventListener('scroll', function () { if (!ticking) { ticking = true; requestAnimationFrame(update); } }, { passive: true });
    window.addEventListener('resize', update);
    update();
  }

  /* ---------- Bülten formu ---------- */
  $$('.js-subscribe').forEach(function (form) {
    var input = $('input[type=email]', form), btn = $('button', form);
    function check() { btn.disabled = !input.value || !input.checkValidity(); }
    input.addEventListener('input', check);
    check();
    form.addEventListener('submit', function (e) {
      // TODO: Bülten uç noktası belirlenince (ör. kendi API'miz / Mailchimp / Brevo) gerçek POST yapılacak.
      if (form.getAttribute('action') === '#' || !form.getAttribute('action')) {
        e.preventDefault();
        var msg = document.createElement('p');
        msg.className = 'subscribe__msg';
        msg.setAttribute('role', 'status');
        msg.textContent = form.dataset.ok;
        form.replaceWith(msg);
      }
    });
  });
})();
