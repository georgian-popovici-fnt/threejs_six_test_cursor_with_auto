#!/usr/bin/env node

/**
 * Setup Script for web-ifc WASM Files
 * Downloads WASM files from unpkg CDN to local public directory
 * Run: node scripts/setup-wasm.js
 */

const https = require('https');
const fs = require('fs');
const path = require('path');

const WASM_VERSION = '0.0.59';
const WASM_BASE_URL = `https://unpkg.com/web-ifc@${WASM_VERSION}/`;
const OUTPUT_DIR = path.join(__dirname, '..', 'public', 'wasm', 'web-ifc');

const WASM_FILES = [
  'web-ifc.wasm',
  'web-ifc-mt.wasm'
];

// ANSI color codes
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  cyan: '\x1b[36m',
  red: '\x1b[31m'
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function downloadFile(url, outputPath) {
  return new Promise((resolve, reject) => {
    log(`Downloading: ${url}`, 'cyan');
    
    const file = fs.createWriteStream(outputPath);
    
    https.get(url, (response) => {
      if (response.statusCode !== 200) {
        reject(new Error(`Failed to download: ${response.statusCode}`));
        return;
      }
      
      const totalSize = parseInt(response.headers['content-length'], 10);
      let downloadedSize = 0;
      
      response.on('data', (chunk) => {
        downloadedSize += chunk.length;
        const percent = ((downloadedSize / totalSize) * 100).toFixed(1);
        process.stdout.write(`\r  Progress: ${percent}%`);
      });
      
      response.pipe(file);
      
      file.on('finish', () => {
        file.close();
        console.log(''); // New line after progress
        log(`✓ Downloaded: ${path.basename(outputPath)}`, 'green');
        resolve();
      });
    }).on('error', (err) => {
      fs.unlink(outputPath, () => {}); // Clean up partial file
      reject(err);
    });
  });
}

async function main() {
  log('\n========================================', 'cyan');
  log('  web-ifc WASM Setup', 'cyan');
  log('========================================\n', 'cyan');
  
  // Create output directory if it doesn't exist
  if (!fs.existsSync(OUTPUT_DIR)) {
    log(`Creating directory: ${OUTPUT_DIR}`, 'yellow');
    fs.mkdirSync(OUTPUT_DIR, { recursive: true });
  }
  
  log(`\nDownloading web-ifc v${WASM_VERSION} WASM files...\n`, 'yellow');
  
  // Download each WASM file
  for (const filename of WASM_FILES) {
    const url = WASM_BASE_URL + filename;
    const outputPath = path.join(OUTPUT_DIR, filename);
    
    try {
      await downloadFile(url, outputPath);
      
      // Verify file was created
      const stats = fs.statSync(outputPath);
      const sizeInMB = (stats.size / 1024 / 1024).toFixed(2);
      log(`  Size: ${sizeInMB} MB\n`, 'green');
    } catch (error) {
      log(`✗ Failed to download ${filename}: ${error.message}`, 'red');
      process.exit(1);
    }
  }
  
  log('========================================', 'green');
  log('  ✓ Setup Complete!', 'green');
  log('========================================\n', 'green');
  
  log('WASM files have been downloaded to:', 'cyan');
  log(`  ${OUTPUT_DIR}\n`, 'cyan');
  
  log('Next steps:', 'yellow');
  log('  1. Update src/app/shared/constants/viewer.config.ts', 'yellow');
  log('  2. Set wasm.useLocal to true', 'yellow');
  log('  3. Set wasm.path to "/wasm/web-ifc/"\n', 'yellow');
  
  log('Example configuration:', 'cyan');
  log(`
  wasm: {
    path: '/wasm/web-ifc/',
    useLocal: true,
  }
  `.trim() + '\n', 'cyan');
}

// Run the script
main().catch((error) => {
  log(`\n✗ Error: ${error.message}`, 'red');
  process.exit(1);
});

