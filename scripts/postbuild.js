import fs from 'fs';
import path from 'path';

const outputPublic = path.resolve('.output', 'public');
const dist = path.resolve('dist');

if (fs.existsSync(outputPublic)) {
  console.log('Copying .output/public to dist for Netlify compatibility...');
  fs.mkdirSync(dist, { recursive: true });
  fs.cpSync(outputPublic, dist, { recursive: true });
  console.log('Successfully copied build files to dist/');
} else {
  console.log('Output directory .output/public not found, keeping standard dist output.');
}
