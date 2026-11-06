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
// Deployment settings stay local. Default/download packages never read them.
let releaseHtml = html;
if (hosted) {
  const configPath = path.join(root, 'private/hosted-analytics.json');
  if (!fs.existsSync(configPath)) throw new Error('Hosted packaging requires private/hosted-analytics.json. See RELEASE.md.');
  const config = JSON.parse(fs.readFileSync(configPath, 'utf8'));
  function origins(values, allowSelf) {
    if (!Array.isArray(values) || !values.length) throw new Error('Analytics origins must be a nonempty array.');
    return [...new Set(values.map(value => {
      if (allowSelf && value === "'self'") return value;
      if (typeof value !== 'string' || !/^https:\/\/[a-zA-Z0-9.-]+(?::[0-9]+)?$/.test(value) || new URL(value).origin !== value) {
        throw new Error('Analytics origins must be exact HTTPS origins.');
      }
      return value;
    }))].join(' ');
  }
  const scriptOrigins = origins(config.scriptOrigins, false);
  const connectOrigins = origins(config.connectOrigins, true);
  const scriptUrl = new URL(config.scriptUrl);
  if (scriptUrl.protocol !== 'https:' || scriptUrl.username || scriptUrl.password || scriptUrl.hash || !config.scriptOrigins.includes(scriptUrl.origin)) {
    throw new Error('Tracker URL must use an allowed HTTPS script origin.');
  }
  const escapedUrl = scriptUrl.href.replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;');
  if (/<script\b[^>]*\bsrc=["']https?:/i.test(html)) throw new Error('Remote script already present; refusing duplicate analytics injection.');
  const scriptPolicy = "script-src 'self'";
  const connectPolicy = "connect-src 'none'";
  if (!html.includes(scriptPolicy + ';') || !html.includes(connectPolicy + ';') || !html.includes('</head>')) {
    throw new Error('Review the document head and CSP before enabling hosted analytics.');
  }
  releaseHtml = html
    .replace(scriptPolicy + ';', scriptPolicy + ' ' + scriptOrigins + ';')
    .replace(connectPolicy + ';', 'connect-src ' + connectOrigins + ';')
    .replace(/  <!-- A meta CSP[\s\S]*?-->/, '  <!-- Hosted CSP: allow configured analytics scripts and collection. Local packages block connections. -->')
    .replace('</footer>', '<p class="hint" id="analyticsNotice">This hosted site measures visits and page use, including URLs, device details, time on page and tab visibility. It stores a visitor ID. Do not put wallet secrets in URLs. <a href="./PRIVACY.md">Read what analytics collects</a>.</p>\n</footer>')
    .replace('</head>', '  <script defer src="' + escapedUrl + '"></script>\n</head>');
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
