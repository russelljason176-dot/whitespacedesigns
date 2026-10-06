/* Seren demo store: catalogue, articles, cart (localStorage). No network calls, no real orders. */
(function () {
  'use strict';

  var PRODUCTS = {
    'SRN-001': { name: 'Rooibos Renewal Serum', cat: 'Serum', price: 695, img: 'prod-srn-001', badge: 'Best Seller', size: '30 ml',
      desc: 'High-potency antioxidant serum targeting fine lines and uneven tone. Fermented rooibos extract at 12% concentration.',
      how: 'Morning and evening on clean skin, 3 to 4 drops pressed into face and neck. Follow with moisturiser.',
      ingredients: 'Fermented rooibos extract (12%), aloe vera juice, glycerin, hyaluronic acid, marula oil, vitamin E' },
    'SRN-002': { name: 'Baobab Deep Moisture Cream', cat: 'Moisturiser', price: 545, img: 'prod-srn-002', size: '50 ml',
      desc: 'Rich whipped cream with cold-pressed baobab oil. Repairs the barrier and holds moisture through Highveld winters.',
      how: 'Morning and evening after serum. Warm a pea-sized amount between fingers and press in.',
      ingredients: 'Cold-pressed baobab oil, shea butter, aloe vera, glycerin, squalane, vitamin E' },
    'SRN-003': { name: 'Marula Glow Face Oil', cat: 'Face Oil', price: 595, img: 'prod-srn-003', size: '30 ml',
      desc: 'Cold-pressed marula. The oil your skin recognises, working harder. Absorbs in 60 seconds. No grease.',
      how: 'Evening as the last step, 3 drops warmed between palms. Can be added to moisturiser in the morning.',
      ingredients: 'Cold-pressed marula oil, rosehip seed oil, vitamin E' },
    'SRN-004': { name: 'Buchu Clarifying Cleanser', cat: 'Cleanser', price: 445, img: 'prod-srn-004', size: '150 ml',
      desc: 'Low-foam gel cleanser with indigenous Buchu extract. Clears without stripping. pH-balanced at 5.5.',
      how: 'Massage onto damp skin for 60 seconds, rinse with lukewarm water. Morning and evening.',
      ingredients: 'Buchu leaf extract, aloe vera juice, mild plant-derived surfactants, glycerin, panthenol' },
    'SRN-005': { name: 'Rooibos Eye Repair Serum', cat: 'Serum', price: 495, img: 'prod-srn-005', size: '15 ml',
      desc: 'Concentrated formula for the periorbital zone. Targets puffiness, dark circles, and the first creases.',
      how: 'Morning and evening, a rice-grain amount tapped along the orbital bone with a ring finger.',
      ingredients: 'Rooibos extract, caffeine, hyaluronic acid, aloe vera, vitamin E' },
    'SRN-006': { name: 'Baobab Night Recovery Balm', cat: 'Moisturiser', price: 625, img: 'prod-srn-006', badge: 'New', size: '50 ml',
      desc: "Overnight occlusive balm. Works with your skin's repair cycle. Wake up with smoother, plumper skin.",
      how: 'Last step of your evening routine. Warm a small amount and press over face and neck.',
      ingredients: 'Baobab oil, shea butter, beeswax, marula oil, squalane, vitamin E' },
    'SRN-007': { name: 'Cape Aloe Soothing Gel', cat: 'Cleanser', price: 395, img: 'prod-srn-007', size: '150 ml',
      desc: 'Cooling micellar gel for sensitive and reactive skin. Removes makeup and sunscreen in one pass, zero irritation.',
      how: 'Massage onto dry or damp skin, then rinse or wipe away. Suitable for eyes and lips.',
      ingredients: 'Cape aloe juice, micellar surfactants, glycerin, chamomile extract, panthenol' },
    'SRN-008': { name: 'Marula Radiance Booster', cat: 'Face Oil', price: 545, img: 'prod-srn-008', size: '30 ml',
      desc: 'Lightweight radiance booster blended with vitamin C precursors. Mix with your moisturiser or use alone.',
      how: 'Morning, 2 to 3 drops alone or mixed into moisturiser. Always follow with sunscreen.',
      ingredients: 'Marula oil, ascorbyl glucoside (vitamin C precursor), jojoba oil, vitamin E' }
  };

  var ARTICLES = {
    'rooibos-science': { title: 'Why Rooibos at 12% Changes Everything: Why Nobody Else Uses It', cat: 'Ingredients', author: 'Naledi Khumalo', date: 'June 2026 · 8 min read', img: 'journal-1',
      body: ["Most skincare brands list rooibos as a marketing ingredient: a fraction of a percent, enough to put it on the label. We put it in at 12%, because that is the concentration where aspalathin, rooibos's signature antioxidant, actually does its work.",
        'Getting there was not simple. Rooibos extract is unstable, and early batches lost potency within weeks. Fermenting the leaf before extraction gave a more stable, skin-friendly extract, and it took 43 formula iterations in the Cape Town lab to get the texture right at that concentration.',
        'What it means for your skin: an antioxidant serum that works at a level worth paying for, rather than a label claim. Start with the Rooibos Renewal Serum, morning and evening, and give it six to eight weeks.'],
      products: ['SRN-001', 'SRN-005'] },
    'baobab-barrier': { title: 'The Skin Barrier Explained: Why Baobab Repairs It Better Than Most Ceramides', cat: 'Science', author: 'Naledi Khumalo', date: 'May 2026 · 6 min', img: 'journal-2',
      body: ["Your skin barrier is a brick wall. The skin cells are the bricks, and ceramides and fatty acids are the mortar. When the mortar crumbles, moisture escapes and irritants get in.",
        "Baobab oil is rich in the same kinds of fatty acids your barrier is built from, so it slots into those gaps instead of sitting on top. That is why it feels nourishing without feeling heavy.",
        'If your skin feels tight, flaky or reactive, simplify first, then add a barrier-focused moisturiser. Our Baobab Deep Moisture Cream is built for exactly that.'],
      products: ['SRN-002', 'SRN-006'] },
    'morning-ritual': { title: 'The Four-Minute Morning Routine We Actually Stick To', cat: 'Rituals', author: 'Amara van der Berg', date: 'May 2026 · 4 min', img: 'journal-3',
      body: ['Not ten steps. Not five. Four minutes. Cleanse, serum, moisturise, and sunscreen if you are heading outside.',
        'We simplified because a routine you skip is worse than a short one you keep. Fewer products also means fewer chances for ingredients to compete with each other.',
        'Our version: Buchu Clarifying Cleanser, Rooibos Renewal Serum, Baobab Deep Moisture Cream. That is the whole routine.'],
      products: ['SRN-004', 'SRN-001', 'SRN-002'] },
    'cederberg': { title: 'Three Days in the Cederberg: How We Found Our Rooibos Supplier', cat: 'Behind the Brand', author: 'Sipho Dlamini', date: 'April 2026 · 7 min', img: 'sourcing-split',
      body: ['The trip started as sourcing research and became something bigger. Three days of driving gravel roads, meeting cooperatives and walking the fields where the plant actually grows.',
        'Traceability stops being an abstract promise when you are standing in the field. Every batch of leaf we use can be traced to the cooperative and the harvest it came from.',
        'We came home with a supplier, and a clearer idea of what we would not compromise on.'],
      products: ['SRN-001'] },
    'marula-myth': { title: 'The Marula Myth: What the Elephant Story Gets Wrong About This Oil', cat: 'Ingredients', author: 'Naledi Khumalo', date: 'April 2026 · 5 min', img: 'ing-marula',
      body: ["You have heard the elephant story: animals getting tipsy on fermented marula fruit. It is a great story, and it has nothing to do with why the oil works on skin.",
        'What matters is the chemistry. Marula oil is high in oleic acid and rich in antioxidants, which is why it absorbs quickly and leaves skin soft without a greasy film.',
        'Cold-pressing keeps those antioxidants intact, which is why we use it across both of our face oils.'],
      products: ['SRN-003', 'SRN-008'] },
    'double-cleanse': { title: "Double Cleansing Isn't Overwashing, With the Right Products", cat: 'Rituals', author: 'Amara van der Berg', date: 'March 2026 · 5 min', img: 'ritual-cleanse',
      body: ['The double cleanse debate is mostly people using the wrong first cleanser. A harsh, foaming first step strips the barrier, and a second one makes it worse.',
        'With a gentle first cleanse to lift sunscreen and makeup, then a pH-balanced second cleanse, the barrier is left alone and your skin is genuinely clean.',
        'Start with Cape Aloe Soothing Gel, then follow with Buchu Clarifying Cleanser in the evening.'],
      products: ['SRN-007', 'SRN-004'] },
    'less-is-more': { title: 'The Overloaded Routine Problem: Why More Products Make Your Skin Worse', cat: 'Science', author: 'Naledi Khumalo', date: 'March 2026 · 9 min', img: 'hero-flatlay',
      body: ["When you apply twelve different actives in sequence, they do not stack. They compete, and the result is often irritation rather than results.",
        'That is the interaction problem that drove us to eight products only. Every formula is designed to work with the others, not against them.',
        'If your routine has grown out of control, strip it back to a cleanser, a serum and a moisturiser for four weeks, then add one thing at a time.'],
      products: ['SRN-004', 'SRN-001', 'SRN-002'] }
  };

  var KEY = 'seren-cart-v1';
  function load() { try { var c = JSON.parse(localStorage.getItem(KEY) || '{}'); return c && typeof c === 'object' ? c : {}; } catch (e) { return {}; } }
  function save(c) { try { localStorage.setItem(KEY, JSON.stringify(c)); } catch (e) {} }
  function clean(c) { Object.keys(c).forEach(function (k) { if (!PRODUCTS[k] || !(c[k] > 0)) delete c[k]; else c[k] = Math.min(10, Math.floor(c[k])); }); return c; }
  function count() { var c = clean(load()), n = 0; Object.keys(c).forEach(function (k) { n += c[k]; }); return n; }
  function money(n) { return 'R' + n.toLocaleString('en-ZA'); }

  function badge() {
    var n = count(), el = document.getElementById('cart-count');
    if (el) el.textContent = n;
    var a = document.querySelector('.nav-cart');
    if (a) a.setAttribute('aria-label', 'Cart (' + n + (n === 1 ? ' item)' : ' items)'));
  }

  function toast(msg) {
    var t = document.getElementById('seren-toast');
    if (!t) { t = document.createElement('div'); t.id = 'seren-toast'; t.setAttribute('role', 'status'); t.setAttribute('aria-live', 'polite'); document.body.appendChild(t); }
    t.textContent = msg; t.className = 'show';
    clearTimeout(toast._t); toast._t = setTimeout(function () { t.className = ''; }, 2200);
  }

  function add(ref, qty) {
    if (!PRODUCTS[ref]) return;
    var c = clean(load()); c[ref] = Math.min(10, (c[ref] || 0) + (qty || 1)); save(c); badge();
    toast(PRODUCTS[ref].name + ' added to cart');
  }
  function setQty(ref, q) { var c = clean(load()); if (q <= 0) delete c[ref]; else c[ref] = Math.min(10, q); save(c); badge(); }

  function refFromButton(btn) {
    if (btn.dataset.ref) return btn.dataset.ref;
    var root = btn.closest('.product-card, article, .pdp') || btn.parentElement;
    var a = root && (root.matches && root.matches('a[href*="ref="]') ? root : root.querySelector('a[href*="ref="]'));
    if (a) { var m = /ref=(SRN-\d+)/.exec(a.getAttribute('href')); if (m) return m[1]; }
    var name = (btn.dataset.name || '').toLowerCase();
    return Object.keys(PRODUCTS).filter(function (k) { return PRODUCTS[k].name.toLowerCase() === name; })[0];
  }

  document.addEventListener('click', function (e) {
    var btn = e.target.closest && e.target.closest('.btn-add');
    if (!btn) return;
    var ref = refFromButton(btn);
    e.preventDefault(); e.stopPropagation();
    if (ref) add(ref, parseInt(btn.dataset.qty, 10) || 1);
  }, true);

  window.Seren = { PRODUCTS: PRODUCTS, ARTICLES: ARTICLES, cart: { get: function () { return clean(load()); }, add: add, setQty: setQty, count: count }, money: money, toast: toast, badge: badge };
  document.addEventListener('DOMContentLoaded', badge);
  window.addEventListener('storage', badge);
})();
