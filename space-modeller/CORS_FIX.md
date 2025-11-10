# CORS Fix for ThatOpen Components Worker

## Problem

When loading IFC files using `@thatopen/components`, the `FragmentsManager` attempts to load a Web Worker from a remote CDN:

```
https://thatopen.github.io/engine_fragment/resources/worker.mjs
```

This causes a CORS (Cross-Origin Resource Sharing) security error when running the application on `localhost:4200`:

```
ERROR SecurityError: Failed to construct 'Worker': Script at 
'https://thatopen.github.io/engine_fragment/resources/worker.mjs' 
cannot be accessed from origin 'http://localhost:4200'.
```

## Solution: Development Proxy

We've configured an Angular development proxy to handle CORS issues during development. This allows the worker script to be served from the same origin as the application.

### Configuration Files

#### 1. `proxy.conf.json`

Created a proxy configuration file that redirects requests to the remote CDN:

```json
{
  "/engine_fragment": {
    "target": "https://thatopen.github.io",
    "secure": true,
    "changeOrigin": true,
    "logLevel": "debug"
  }
}
```

#### 2. `angular.json`

Updated the `serve` configuration to use the proxy:

```json
"serve": {
  "builder": "@angular-devkit/build-angular:dev-server",
  "options": {
    "proxyConfig": "proxy.conf.json"
  },
  ...
}
```

## How It Works

1. When the application runs in development mode (`ng serve`), the Angular CLI starts a proxy server
2. Any requests to `/engine_fragment/*` are proxied to `https://thatopen.github.io/engine_fragment/*`
3. The browser sees these requests as coming from the same origin (`localhost:4200`)
4. CORS restrictions are bypassed because the proxy handles the cross-origin communication

## Testing the Fix

1. Stop any running development server
2. Restart the development server:
   ```bash
   npm start
   # or
   ng serve
   ```
3. Load an IFC file in the viewer
4. The worker should load successfully without CORS errors

## Production Considerations

For production builds, you have two options:

### Option 1: Use Local Worker (Recommended)

1. Copy the worker file to the `public/workers/` directory:
   ```bash
   # Already done - worker.mjs is in public/workers/
   ```

2. Update `viewer.config.ts` for production:
   ```typescript
   export const PROD_VIEWER_CONFIG: ViewerConfig = {
     ...DEFAULT_VIEWER_CONFIG,
     fragmentsWorkerUrl: '/workers/worker.mjs',
   };
   ```

3. Use this config in production environment

### Option 2: Configure CORS on Server

If deploying with a reverse proxy (nginx, Apache, etc.), configure it to:
- Serve the worker file from the same origin, or
- Add appropriate CORS headers to allow worker loading

## Notes

- The proxy configuration only works in development mode (`ng serve`)
- For production builds, you must implement one of the production solutions above
- The worker file in `public/workers/worker.mjs` is available as a fallback
- The `fragmentsWorkerUrl` in `viewer.config.ts` is currently not used in initialization but kept for future reference

## Related Files

- `proxy.conf.json` - Proxy configuration
- `angular.json` - Angular CLI configuration with proxy reference
- `public/workers/worker.mjs` - Local copy of worker (for production use)
- `src/app/shared/constants/viewer.config.ts` - Viewer configuration
- `src/app/core/services/fragments.service.ts` - FragmentsManager initialization

## References

- [Angular Proxy Configuration](https://angular.io/guide/build#proxying-to-a-backend-server)
- [Web Workers and CORS](https://developer.mozilla.org/en-US/docs/Web/API/Web_Workers_API/Using_web_workers#same-origin_policy)
- [ThatOpen Components Documentation](https://docs.thatopen.com/)

