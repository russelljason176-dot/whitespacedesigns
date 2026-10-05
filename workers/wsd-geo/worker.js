// WSD geo worker: tells the page which country the visitor is in, so the site can show
// rands (South Africa), euros (eurozone) or dollars (everywhere else).
// Cloudflare already knows the country; a static GitHub Pages page can't read it, so this
// returns it as JSON at https://whitespacedesigns.co.za/geo
export default {
  async fetch(request) {
    const country = (request.cf && request.cf.country) || null;
    return new Response(JSON.stringify({ country }), {
      headers: {
        'content-type': 'application/json',
        'cache-control': 'no-store',
      },
    });
  },
};
