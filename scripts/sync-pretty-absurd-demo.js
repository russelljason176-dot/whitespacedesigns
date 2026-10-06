#!/usr/bin/env node
// Mirrors the REAL Pretty Absurd client site (sibling repo `pretty-absurd`) into
// demos/web-design/pretty-absurd/ so the demo is always the current site.
// Run after every Pretty Absurd push:   node scripts/sync-pretty-absurd-demo.js [path-to-pretty-absurd-repo]
// The copy is made safe: noindex, relative links, and checkout/forms are SIMULATED (no Yoco session, no Formspree post).
const fs = require('fs'), path = require('path'), { execSync } = require('child_process');

const src = path.resolve(process.argv[2] || path.join(__dirname, '..', '..', 'pretty-absurd'));
const dest = path.resolve(__dirname, '..', 'demos', 'web-design', 'pretty-absurd');
if (!fs.existsSync(path.join(src, '.git'))) { console.error('Not a git repo:', src); process.exit(1); }

const skip = (f) => /^(\.|CNAME|robots\.txt|sitemap\.xml|404\.html|tools\/|cloudflare-worker\/|node_modules\/|README)/.test(f);
const files = execSync('git ls-files', { cwd: src, encoding: 'utf8' }).split('\n').filter((f) => f && !skip(f));

// mirror: clean destination first so removed files do not linger
fs.rmSync(dest, { recursive: true, force: true });
for (const f of files) {
  const to = path.join(dest, f);
  fs.mkdirSync(path.dirname(to), { recursive: true });
  fs.copyFileSync(path.join(src, f), to);
}

const shim = `<script>/* DEMO: simulate checkout + forms so the copy can never take a payment or send an email */
(function(){var f=window.fetch;window.fetch=function(u,o){var s=String(u&&u.url||u);
if(/workers\\.dev|formspree\\.io/.test(s)){var b=/promo\\/check/.test(s)?{valid:false}:/workers\\.dev/.test(s)?{redirectUrl:'order-confirmation.html'}:{ok:true};
return Promise.resolve(new Response(JSON.stringify(b),{status:200,headers:{'Content-Type':'application/json'}}));}
return f.apply(this,arguments);};})();</script>
<style>.wsd-demo-bar{position:fixed;left:0;right:0;bottom:0;z-index:99999;background:#1a1a1a;color:#fff;font:500 11px/1.4 system-ui,sans-serif;letter-spacing:.04em;text-align:center;padding:7px 12px}.wsd-demo-bar a{color:#fff;text-decoration:underline}</style>`;
const bar = `<div class="wsd-demo-bar">Portfolio demo of the live Pretty Absurd site by White Space Designs &middot; checkout and forms are simulated &middot; <a href="https://prettyabsurd.co.za" rel="noopener">Visit the real site</a></div>`;

let patched = 0;
for (const f of files.filter((x) => x.endsWith('.html'))) {
  const p = path.join(dest, f); let s = fs.readFileSync(p, 'utf8');
  s = s.replace(/href="\/"/g, 'href="index.html"').replace(/href="\/favicon\.ico"/g, 'href="favicon.ico"');
  s = s.replace(/<head([^>]*)>/i, '<head$1>\n<meta name="robots" content="noindex, nofollow">\n' + shim);
  s = s.replace(/<\/body>/i, bar + '\n</body>');
  fs.writeFileSync(p, s); patched++;
}
console.log(`Synced ${files.length} files (${patched} pages patched) from ${src} (${execSync('git rev-parse --short HEAD', { cwd: src, encoding: 'utf8' }).trim()}) to ${dest}`);
