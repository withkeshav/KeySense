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
const output = path.resolve(process.argv[2] || path.join(root, 'dist'));
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
console.log('Packaged ' + files.length + ' approved public files.');
