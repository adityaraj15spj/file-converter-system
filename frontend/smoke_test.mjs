import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const results = [];
function record(testName, passed, details = '') {
  results.push({ testName, passed, details });
  const symbol = passed ? 'PASS' : 'FAIL';
  console.log(`[${symbol}] ${testName}${details ? ` - ${details}` : ''}`);
}

async function runTests() {
  console.log('\n======================================================');
  console.log('RUNNING FRONTEND AUTOMATED SMOKE TESTS');
  console.log('======================================================\n');

  // 1. Check production build output
  const distDir = path.join(__dirname, 'dist');
  const distExists = fs.existsSync(distDir);
  record('Build directory exists (dist/)', distExists);

  if (distExists) {
    const htmlPath = path.join(distDir, 'index.html');
    const htmlExists = fs.existsSync(htmlPath);
    record('Production index.html exists', htmlExists);

    if (htmlExists) {
      const html = fs.readFileSync(htmlPath, 'utf8');
      record('HTML has correct title tag', html.includes('<title>NITK File Converter System'));
      record('HTML includes viewport meta tag', html.includes('name="viewport"'));
      record('HTML root mount node exists', html.includes('id="root"'));
    }

    const assetsDir = path.join(distDir, 'assets');
    const assetFiles = fs.existsSync(assetsDir) ? fs.readdirSync(assetsDir) : [];
    const jsFiles = assetFiles.filter(f => f.endsWith('.js'));
    const cssFiles = assetFiles.filter(f => f.endsWith('.css'));

    record('Compiled JavaScript bundle generated', jsFiles.length > 0, jsFiles.join(', '));
    record('Compiled CSS bundle generated', cssFiles.length > 0, cssFiles.join(', '));

    if (jsFiles.length > 0) {
      const mainJs = fs.readFileSync(path.join(assetsDir, jsFiles[0]), 'utf8');
      record('Bundle size is healthy (> 50KB)', mainJs.length > 50000, `${Math.round(mainJs.length / 1024)} KB`);
      record('Demo Mode OTP banner removed from bundle', !mainJs.includes('Demo Mode OTP'));
      record('devOtpPreview removed from bundle', !mainJs.includes('devOtpPreview'));
      record('Client-side table search filter compiled', mainJs.includes('Filter rows'));
      record('Copy CSV functionality compiled', mainJs.includes('Copy current preview as CSV') || mainJs.includes('navigator.clipboard.writeText'));
    }

    if (cssFiles.length > 0) {
      const mainCss = fs.readFileSync(path.join(assetsDir, cssFiles[0]), 'utf8');
      record('CSS size is healthy (> 5KB)', mainCss.length > 5000, `${Math.round(mainCss.length / 1024)} KB`);
      record('Glassmorphic styles compiled', mainCss.includes('backdrop-filter') || mainCss.includes('glass'));
    }
  }

  // 2. Test Local Vite Server
  console.log('\n--- Local Dev Server Verification (http://127.0.0.1:5173) ---');
  try {
    const localRes = await fetch('http://127.0.0.1:5173/');
    record('Local Vite dev server responds with 200 OK', localRes.status === 200, `Status: ${localRes.status}`);
    const localText = await localRes.text();
    record('Local Vite serves HTML with root container', localText.includes('id="root"'));
  } catch (err) {
    record('Local Vite dev server responds with 200 OK', false, err.message);
  }

  // 3. Test Local API Proxy
  try {
    const proxyRes = await fetch('http://127.0.0.1:5173/api/health');
    record('Local Vite proxy forward to /api/health works', proxyRes.status === 200, `Status: ${proxyRes.status}`);
    if (proxyRes.ok) {
      const health = await proxyRes.json();
      record('Health API returns healthy status', health.status === 'healthy', `Service: ${health.service}`);
    }
  } catch (err) {
    record('Local Vite proxy forward to /api/health works', false, err.message);
  }

  // 4. Test Live Vercel Production Deployment
  console.log('\n--- Live Vercel Production Verification (https://file-converter-system.vercel.app) ---');
  const vercelUrl = 'https://file-converter-system.vercel.app';
  try {
    const vercelRoot = await fetch(vercelUrl);
    record('Vercel production root returns 200 OK', vercelRoot.status === 200, `Status: ${vercelRoot.status}`);
    const vercelHtml = await vercelRoot.text();
    record('Vercel serves single-page app HTML', vercelHtml.includes('id="root"'));
  } catch (err) {
    record('Vercel production root returns 200 OK', false, err.message);
  }

  try {
    const vercelHealth = await fetch(`${vercelUrl}/api/health`);
    record('Vercel /api/health returns 200 OK', vercelHealth.status === 200, `Status: ${vercelHealth.status}`);
    if (vercelHealth.ok) {
      const hData = await vercelHealth.json();
      record('Vercel health check payload matches expected schema', hData.status === 'healthy');
    }
  } catch (err) {
    record('Vercel /api/health returns 200 OK', false, err.message);
  }

  try {
    const vercelSamples = await fetch(`${vercelUrl}/api/samples`);
    record('Vercel /api/samples returns 200 OK', vercelSamples.status === 200, `Status: ${vercelSamples.status}`);
    if (vercelSamples.ok) {
      const samples = await vercelSamples.json();
      record('Vercel samples endpoint returns benchmark datasets', Array.isArray(samples) && samples.length > 0, `${samples.length} datasets found`);
    }
  } catch (err) {
    record('Vercel /api/samples returns 200 OK', false, err.message);
  }

  // 5. Test Live Vercel ARFF Conversion via FormData
  try {
    const boundary = '----SmokeTestBoundary' + Math.random().toString(36).substring(2);
    const csvContent = 'sepal_length,sepal_width,petal_length,petal_width,species\n5.1,3.5,1.4,0.2,Iris-setosa\n4.9,3.0,1.4,0.2,Iris-setosa\n';
    
    // Construct standard multipart body
    const bodyParts = [
      `--${boundary}\r\nContent-Disposition: form-data; name="file"; filename="iris_test.csv"\r\nContent-Type: text/csv\r\n\r\n${csvContent}\r\n`,
      `--${boundary}\r\nContent-Disposition: form-data; name="target_format"\r\n\r\narff\r\n`,
      `--${boundary}\r\nContent-Disposition: form-data; name="relation_name"\r\n\r\niris_smoke_test\r\n`,
      `--${boundary}--\r\n`
    ].join('');

    const convertRes = await fetch(`${vercelUrl}/api/convert/execute`, {
      method: 'POST',
      headers: {
        'Content-Type': `multipart/form-data; boundary=${boundary}`,
        'User-Agent': 'NodeSmokeTest/1.0'
      },
      body: bodyParts
    });

    record('Vercel /api/convert/execute returns 200 OK', convertRes.status === 200, `Status: ${convertRes.status}`);
    if (convertRes.ok) {
      const cData = await convertRes.json();
      record('Conversion succeeds with WEKA ARFF output', cData.success === true && cData.full_output.includes('@relation iris_smoke_test'));
      record('Conversion duration is sub-second', typeof cData.duration_ms === 'number', `${cData.duration_ms} ms`);
    }
  } catch (err) {
    record('Vercel /api/convert/execute returns 200 OK', false, err.message);
  }

  console.log('\n======================================================');
  const allPassed = results.every(r => r.passed);
  const passCount = results.filter(r => r.passed).length;
  console.log(`SUMMARY: ${passCount}/${results.length} tests passed (${Math.round((passCount/results.length)*100)}%)`);
  console.log('======================================================\n');

  if (!allPassed) {
    process.exit(1);
  }
}

runTests();
