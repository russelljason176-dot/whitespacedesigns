/* WSD currency: prices are written in rand in the HTML (what Google and South African
   visitors see). This script swaps them for USD / EUR where the visitor is overseas.
   One rate table for the whole site: edit RATES below, nowhere else.
   Markup:  <span class="pt" data-zar="7500">R7,500</span>
   Optional: data-pfx="From " · data-sfx="/month" · data-fmt="k" (234000 -> R234k)   */
(function () {
  'use strict';

  // Fallback rates (2026-10-02 market: R16.73 per USD, R18.78 per EUR). Live rates from the
  // ECB feed (api.frankfurter.dev) replace these on every visit, cached for 12 hours.
  var RATES = { ZAR: 1, USD: 1 / 16.73, EUR: 1 / 18.78 };
  var FX_URL = 'https://api.frankfurter.dev/v1/latest?base=ZAR&symbols=USD,EUR';
  var FX_TTL = 12 * 60 * 60 * 1000;
  var SYMBOLS = { ZAR: 'R', USD: '$', EUR: '€' };
  var ZAR_COUNTRIES = ['ZA', 'NA', 'LS', 'SZ'];          // South Africa + Common Monetary Area
  var EUR_COUNTRIES = ['AT', 'BE', 'BG', 'HR', 'CY', 'EE', 'FI', 'FR', 'DE', 'GR', 'IE', 'IT',
                       'LV', 'LT', 'LU', 'MT', 'NL', 'PT', 'SK', 'SI', 'ES'];
  var EUR_ZONES = /^Europe\/(Amsterdam|Andorra|Athens|Berlin|Bratislava|Brussels|Dublin|Helsinki|Lisbon|Ljubljana|Luxembourg|Madrid|Malta|Monaco|Nicosia|Paris|Riga|Rome|San_Marino|Sofia|Tallinn|Vatican|Vienna|Vilnius|Zagreb)$/;
  var STORE = 'wsd-cur';

  function store(get, key, val) {
    try { return get ? localStorage.getItem(key) : localStorage.setItem(key, val); } catch (e) { return null; }
  }

  function fromCountry(cc) {
    if (!cc) return null;
    cc = String(cc).toUpperCase();
    if (ZAR_COUNTRIES.indexOf(cc) > -1) return 'ZAR';
    if (EUR_COUNTRIES.indexOf(cc) > -1) return 'EUR';
    return 'USD';
  }

  function fromTimeZone() {
    var tz = '';
    try { tz = Intl.DateTimeFormat().resolvedOptions().timeZone || ''; } catch (e) {}
    if (!tz || tz === 'Africa/Johannesburg') return 'ZAR';
    if (EUR_ZONES.test(tz)) return 'EUR';
    return 'USD';
  }

  function round(n) {
    if (n < 100) return Math.round(n);
    if (n < 1000) return Math.round(n / 5) * 5;
    return Math.round(n / 10) * 10;
  }

  function render(cur) {
    var sym = SYMBOLS[cur], rate = RATES[cur];
    var els = document.querySelectorAll('[data-zar]');
    for (var i = 0; i < els.length; i++) {
      var el = els[i];
      if (el.getAttribute('data-orig') === null) el.setAttribute('data-orig', el.textContent);
      if (cur === 'ZAR') { el.textContent = el.getAttribute('data-orig'); continue; }
      var zar = parseFloat(el.getAttribute('data-zar'));
      if (isNaN(zar)) continue;
      var v = zar * rate, out;
      if (el.getAttribute('data-fmt') === 'k') out = sym + Math.round(v / 1000) + 'k';
      else out = sym + round(v).toLocaleString('en-US');
      el.textContent = (el.getAttribute('data-pfx') || '') + out + (el.getAttribute('data-sfx') || '');
    }
    var btns = document.querySelectorAll('.cur-btn');
    for (var j = 0; j < btns.length; j++) {
      btns[j].classList.toggle('active', btns[j].getAttribute('data-cur') === cur);
    }
    document.documentElement.setAttribute('data-currency', cur);
  }

  var current = 'ZAR';
  function apply(cur, source) {
    if (!RATES[cur]) return;
    current = cur;
    render(cur);
    try {
      document.dispatchEvent(new CustomEvent('wsd:currency', { detail: { cur: cur, source: source } }));
    } catch (e) {}
  }

  // Live market rates: use the cached copy if fresh, otherwise fetch. Bad data is ignored.
  function useRates(r) {
    if (!r || !(r.USD > 0.03 && r.USD < 0.12) || !(r.EUR > 0.03 && r.EUR < 0.12)) return false;
    RATES.USD = r.USD; RATES.EUR = r.EUR;
    if (current !== 'ZAR') render(current);
    return true;
  }
  function loadRates() {
    try {
      var c = JSON.parse(store(true, 'wsd-fx') || 'null');
      if (c && Date.now() - c.t < FX_TTL && useRates(c)) return;
    } catch (e) {}
    if (!window.fetch) return;
    fetch(FX_URL)
      .then(function (r) { return r.ok ? r.json() : null; })
      .then(function (d) {
        if (d && d.rates && useRates(d.rates)) {
          store(false, 'wsd-fx', JSON.stringify({ t: Date.now(), USD: d.rates.USD, EUR: d.rates.EUR }));
        }
      })
      .catch(function () {});
  }

  function init() {
    loadRates();
    var saved = store(true, STORE);
    var btns = document.querySelectorAll('.cur-btn');
    for (var i = 0; i < btns.length; i++) {
      btns[i].addEventListener('click', function (e) {
        var c = e.currentTarget.getAttribute('data-cur');
        store(false, STORE, c);
        apply(c, 'click');
      });
    }
    if (saved && RATES[saved]) { apply(saved, 'saved'); return; }

    // Instant guess from the browser time zone, then the Cloudflare country lookup
    // (/geo Worker) overrides it when it answers. Without the Worker, the guess stands.
    var guess = fromTimeZone();
    if (guess !== 'ZAR') apply(guess, 'timezone');
    if (!window.fetch) return;
    var done = false;
    var timer = setTimeout(function () { done = true; }, 2500);
    fetch('/geo', { cache: 'no-store' })
      .then(function (r) { return r.ok ? r.json() : null; })
      .then(function (d) {
        clearTimeout(timer);
        if (done || !d || !d.country) return;
        if (store(true, STORE)) return;                // visitor picked one meanwhile
        var c = fromCountry(d.country);
        if (c && c !== current) apply(c, 'country');
      })
      .catch(function () {});
  }

  window.WSDCurrency = { set: function (c) { store(false, STORE, c); apply(c, 'click'); }, rates: RATES };
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})();
