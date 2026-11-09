const catalogueOrigin = 'https://mjplay-catalogue.jmssika1997.workers.dev';

export default {
  async fetch(request, env) {
    const { pathname, search } = new URL(request.url);
    if (!pathname.startsWith('/api/')) return env.ASSETS.fetch(request);
    if (request.method !== 'GET') {
      return Response.json({ error: 'Method not allowed' }, { status: 405 });
    }
    if (pathname === '/api/config' || pathname.startsWith('/api/catalogue/')) {
      const target = new URL(catalogueOrigin);
      target.pathname = pathname;
      target.search = search;
      return env.CATALOGUE.fetch(new Request(target.href, { redirect: 'error' }));
    }
    return Response.json({ error: 'Unavailable on this staging site' }, { status: 503 });
  },
};
