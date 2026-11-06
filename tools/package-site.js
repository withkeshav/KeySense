/* Copy a reviewed allowlist into a new release folder. Never copy a checkout. */
'use strict';
const fs = require('fs');
const path = require('path');
const root = path.resolve(__dirname, '..');
const files = require('./site-files.json');
// A new page asset must be deliberately added to the public manifest.
const html = fs.readFileSync(path.join(root, 'index.html'), 'utf8');
for (const match of html.matchAll(/(?:src|href)="\.\/([^"?#]+)(?:[^"]*)"/g)) {
  if (!files.includes(match[1])) throw new Error('Page references an unlisted release file: ' + match[1]);
}
const args = process.argv.slice(2);
const hosted = args.includes('--hosted');
const destinations = args.filter(arg => arg !== '--hosted');
if (destinations.length > 1 || destinations.some(arg => arg.startsWith('--'))) {
  throw new Error('Usage: node tools/package-site.js [output] [--hosted]');
}
// The public site ID is not a credential. Default/download packages stay offline.
let releaseHtml = html;
if (hosted) {
  if (html.includes('stats.withkeshav.com')) throw new Error('Analytics already present; refusing to add another copy.');
  const scriptPolicy = "script-src 'self'";
  const connectPolicy = "connect-src 'none'";
  if (!html.includes(scriptPolicy + ';') || !html.includes(connectPolicy + ';') || !html.includes('</head>')) {
    throw new Error('Review the document head and CSP before enabling hosted analytics.');
  }
  releaseHtml = html
    .replace(scriptPolicy + ';', scriptPolicy + ' https://stats.withkeshav.com;')
    .replace(connectPolicy + ';', 'connect-src https://stats.withkeshav.com;')
    .replace(/  <!-- A meta CSP[\s\S]*?-->/, '  <!-- Hosted CSP: allow InsightFlare scripts and collection. Local packages block connections. -->')
    .replace('</head>', '  <script defer src="https://stats.withkeshav.com/script.js?siteId=ae9805a9-791b-44f0-b518-19288926c8a8"></script>\n</head>');
}
const output = path.resolve(destinations[0] || path.join(root, 'dist'));
if (fs.existsSync(output)) throw new Error('Output already exists. Choose a new release directory.');
if (root === output || root.startsWith(output + path.sep)) throw new Error('Output cannot contain the checkout.');
for (const name of files) {
  if (!/^[a-zA-Z0-9_./-]+$/.test(name) || name.split('/').some(p => !p || p.startsWith('.'))) {
    throw new Error('Unsafe release path: ' + name);
  }
  let source = root;
  for (const component of name.split('/')) {
    source = path.join(source, component);
    if (fs.lstatSync(source).isSymbolicLink()) throw new Error('Release inputs cannot be symlinks: ' + name);
  }
  if (!fs.statSync(source).isFile()) throw new Error('Missing release file: ' + name);
}
// Validate everything before creating output; never delete or overwrite a prior release.
fs.mkdirSync(output, {recursive: true});
for (const name of files) {
  const target = path.join(output, name);
  fs.mkdirSync(path.dirname(target), {recursive: true});
  fs.copyFileSync(path.join(root, name), target, fs.constants.COPYFILE_EXCL);
}
if (hosted) fs.writeFileSync(path.join(output, 'index.html'), releaseHtml);
console.log('Packaged ' + files.length + ' approved public files.');
