# web-ifc WASM Files

This directory should contain the web-ifc WebAssembly files required for IFC file parsing.

## Why Local WASM Files?

Local WASM files are recommended for production because they:
- Load faster (no external network requests)
- Work offline
- Provide consistent performance
- Remove dependency on external CDN availability

## How to Obtain WASM Files

### Option 1: Download from npm Package

1. Install web-ifc temporarily:
   ```bash
   npm install web-ifc
   ```

2. Copy WASM files from node_modules:
   ```bash
   cp node_modules/web-ifc/*.wasm public/wasm/web-ifc/
   ```

3. Uninstall if not needed:
   ```bash
   npm uninstall web-ifc
   ```

### Option 2: Download from GitHub Releases

1. Visit [web-ifc releases](https://github.com/IFCjs/web-ifc/releases)
2. Download the latest release
3. Extract WASM files to this directory

### Option 3: Download from unpkg CDN

Visit these URLs and save the files:
- `https://unpkg.com/web-ifc@0.0.59/web-ifc.wasm`
- `https://unpkg.com/web-ifc@0.0.59/web-ifc-mt.wasm`

## Required Files

After setup, this directory should contain:

```
web-ifc/
├── web-ifc.wasm          # Main WASM file (single-threaded)
├── web-ifc-mt.wasm       # Multi-threaded version
└── README.md             # This file
```

## File Sizes (Approximate)

- `web-ifc.wasm`: ~3-4 MB
- `web-ifc-mt.wasm`: ~3-4 MB

## Verification

To verify the files are correctly placed:

1. Start the development server: `npm start`
2. Open browser DevTools (F12)
3. Go to Network tab
4. Import an IFC file
5. Check that WASM files load from `/wasm/web-ifc/` (not from a CDN)

## Configuration

The WASM path is configured in `src/app/shared/constants/viewer.config.ts`:

```typescript
wasm: {
  path: '/wasm/web-ifc/',
  useLocal: true,
}
```

## Using CDN Instead (Development)

For quick development without downloading WASM files, you can use a CDN:

```typescript
wasm: {
  path: 'https://unpkg.com/web-ifc@0.0.59/',
  useLocal: false,
}
```

This is already configured in the `DEV_VIEWER_CONFIG` constant.

## Troubleshooting

### WASM Files Not Loading

**Symptoms:**
- Error: "Failed to fetch web-ifc.wasm"
- IFC files fail to load

**Solutions:**
1. Verify files exist in this directory
2. Check file permissions (should be readable)
3. Clear browser cache
4. Restart development server

### CORS Errors (CDN only)

If using CDN and experiencing CORS errors:
1. Switch to local WASM files
2. Use a different CDN (jsDelivr instead of unpkg)
3. Configure proper CORS headers on your server

## Version Compatibility

Make sure the web-ifc version matches the version expected by @thatopen/components:

- Check `package.json` for @thatopen/components version
- Use compatible web-ifc WASM files (usually specified in docs)
- Current recommended version: **0.0.59**

## License

web-ifc is licensed under the Mozilla Public License 2.0.
See [web-ifc repository](https://github.com/IFCjs/web-ifc) for details.

