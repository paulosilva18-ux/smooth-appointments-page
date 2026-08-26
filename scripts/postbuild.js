import fs from 'fs';
import path from 'path';

const outputPublic = path.resolve('.output', 'public');
const dist = path.resolve('dist');

if (fs.existsSync(outputPublic)) {
  console.log('Copying .output/public to dist for Netlify compatibility...');
  fs.mkdirSync(dist, { recursive: true });
  fs.cpSync(outputPublic, dist, { recursive: true });
}

// 1. Write _redirects rule for Netlify SPA routing
const redirectsFile = path.join(dist, '_redirects');
fs.writeFileSync(redirectsFile, '/*    /index.html   200\n');
console.log('Created dist/_redirects for Netlify SPA routing.');

// 2. Create physical route files (admin.html, 404.html, etc.) to guarantee 0% chance of 404
const mainHtmlPath = path.join(dist, 'index.html');
if (fs.existsSync(mainHtmlPath)) {
  const indexHtml = fs.readFileSync(mainHtmlPath, 'utf-8');

  // 404.html for Netlify fallback
  fs.writeFileSync(path.join(dist, '404.html'), indexHtml);

  // Admin route fallback files
  const routeDirs = ['admin', 'fabricio-admin', 'victor-admin', 'admin/fabricio', 'admin/victor'];
  routeDirs.forEach((route) => {
    const routeDir = path.join(dist, route);
    fs.mkdirSync(routeDir, { recursive: true });
    fs.writeFileSync(path.join(routeDir, 'index.html'), indexHtml);
  });

  fs.writeFileSync(path.join(dist, 'admin.html'), indexHtml);
  console.log('Created physical route fallbacks (404.html, admin/index.html, etc.).');
}
