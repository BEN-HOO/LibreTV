// Fixed upstream: preserves the DNSPod hostname without exposing an open proxy.
const UPSTREAM_ORIGIN = 'https://libretv-next.mbinhe.workers.dev';

export default {
  async fetch(request) {
    const incoming = new URL(request.url);
    const target = new URL(incoming.pathname + incoming.search, UPSTREAM_ORIGIN);
    const headers = new Headers(request.headers);
    headers.delete('host');
    headers.set('x-forwarded-proto', 'https');
    const ip = request.headers.get('cf-connecting-ip');
    if (ip) headers.set('x-forwarded-for', ip);

    try {
      const upstream = await fetch(new Request(target, request), {
        headers,
        redirect: 'manual',
      });
      const response = new Response(upstream.body, upstream);
      const location = response.headers.get('location');
      if (location) {
        const redirect = new URL(location, UPSTREAM_ORIGIN);
        if (redirect.origin === UPSTREAM_ORIGIN) {
          response.headers.set('location', incoming.origin + redirect.pathname + redirect.search + redirect.hash);
        }
      }
      return response;
    } catch {
      return new Response('Website temporarily unavailable. Please try again.', {
        status: 502,
        headers: { 'content-type': 'text/plain; charset=utf-8', 'cache-control': 'no-store' },
      });
    }
  },
};
