// A minimal connect-style middleware stack, so the Vite dev-server plugins run unchanged in the production server
// (server.mjs) and in tests. use(prefix, fn) mounts fn under a path prefix (stripped from req.url, as connect does);
// use(fn) mounts it for every request, in registration order with the rest.

export function createStack() {
  const stack = [];
  return {
    middlewares: { use: (prefix, fn) => (typeof prefix === 'function' ? stack.push(['', prefix]) : stack.push([prefix, fn])) },
    /** Run the matching layers for `url`, then `last(req, res)` when none answers. */
    handle(req, res, url, last) {
      const layers = stack.filter(([prefix]) => prefix === '' || url === prefix || url.startsWith(`${prefix}/`) || url.startsWith(`${prefix}?`));
      let i = 0;
      const next = (err) => {
        if (err) { res.statusCode = 500; res.end('Server error'); console.error(err); return undefined; }
        const layer = layers[i++];
        if (!layer) { req.url = url; return last(req, res); }
        const [prefix, fn] = layer;
        req.url = url.slice(prefix.length) || '/'; // strip mount path like connect does
        try { return fn(req, res, next); } catch (e) { res.statusCode = 500; res.end('Server error'); console.error(e); return undefined; }
      };
      return next();
    },
  };
}
