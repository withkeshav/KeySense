"""Check the release boundary and vendor verifier without network or real secrets."""
import importlib.util
import json
import os
from pathlib import Path
import shutil
import subprocess
import tempfile
import threading
import urllib.request
import urllib.error

ROOT = Path(__file__).resolve().parent.parent
FILES = json.loads((ROOT / 'tools/site-files.json').read_text())

def run(*args, cwd=ROOT, env=None):
    return subprocess.run(args, cwd=cwd, env=env, capture_output=True, text=True)

with tempfile.TemporaryDirectory(prefix='keysense-release-') as temp:
    temp = Path(temp)
    source = temp / 'checkout'
    for name in FILES + ['tools/package-site.js', 'tools/site-files.json']:
        target = source / name
        target.parent.mkdir(parents=True, exist_ok=True)
        shutil.copy(ROOT / name, target)
    (source / '.env').write_text('TEST_ONLY=not-a-real-secret')
    (source / 'private').mkdir(exist_ok=True)
    (source / 'private/note.txt').write_text('private test sentinel')
    output = temp / 'release'
    result = run('node', str(source / 'tools/package-site.js'), str(output))
    assert result.returncode == 0, result.stderr
    actual = sorted(str(p.relative_to(output)) for p in output.rglob('*') if p.is_file())
    assert actual == sorted(FILES), actual
    assert run('node', str(source / 'tools/package-site.js'), str(output)).returncode != 0
    page = source / 'index.html'
    original_page = page.read_text()
    page.write_text(original_page + '<script src="./src/unreviewed.js"></script>')
    assert run('node', str(source / 'tools/package-site.js'), str(temp / 'unlisted')).returncode != 0
    assert not (temp / 'unlisted').exists()
    page.write_text(original_page)
    # Analytics is opt-in, once in the public head, with a narrow CSP exception.
    assert 'analytics.example.test' not in (output / 'index.html').read_text()
    hosted = temp / 'hosted'
    assert run('node', str(source / 'tools/package-site.js'), str(hosted), '--hosted').returncode != 0
    assert not hosted.exists()
    config_file = source / 'private/hosted-analytics.json'
    config = {
        'scriptUrl': 'https://analytics.example.test/script.js?siteId=public-test-site',
        'scriptOrigins': ['https://analytics.example.test', 'https://beacon.example.test'],
        'connectOrigins': ["'self'", 'https://analytics.example.test', 'https://metrics.example.test'],
    }
    config_file.write_text(json.dumps(config))
    result = run('node', str(source / 'tools/package-site.js'), str(hosted), '--hosted')
    assert result.returncode == 0, result.stderr
    assert sorted(str(p.relative_to(hosted)) for p in hosted.rglob('*') if p.is_file()) == sorted(FILES)
    hosted_html = (hosted / 'index.html').read_text()
    tracker = '<script defer src="https://analytics.example.test/script.js?siteId=public-test-site"></script>'
    assert 'id="analyticsNotice"' not in original_page
    assert hosted_html.count('id="analyticsNotice"') == 1
    assert hosted_html.count(tracker) == 1
    assert tracker in hosted_html.split('</head>')[0]
    assert "script-src 'self' https://analytics.example.test https://beacon.example.test;" in hosted_html
    assert "connect-src 'self' https://analytics.example.test https://metrics.example.test;" in hosted_html
    import re
    assert re.findall(r'<script[^>]+src="(\./[^"]+)"', hosted_html) == re.findall(r'<script[^>]+src="(\./[^"]+)"', original_page)
    assert page.read_text() == original_page
    page.write_text(original_page.replace('</head>', tracker + '</head>'))
    assert run('node', str(source / 'tools/package-site.js'), str(temp / 'duplicate'), '--hosted').returncode != 0
    assert not (temp / 'duplicate').exists()
    page.write_text(original_page)
    config_file.write_text(json.dumps(config | {'connectOrigins': ['https://example.test; script-src *']}))
    assert run('node', str(source / 'tools/package-site.js'), str(temp / 'unsafe'), '--hosted').returncode != 0
    assert not (temp / 'unsafe').exists()
    config_file.write_text(json.dumps(config))
    print('PASS hosted analytics uses local-only settings, rejects missing/unsafe config, and never packages it')
    victim = source / 'src/styles.css'
    victim.unlink()
    victim.symlink_to(source / 'private/note.txt')
    assert run('node', str(source / 'tools/package-site.js'), str(temp / 'bad-release')).returncode != 0
    assert not (temp / 'bad-release').exists()
    print('PASS release includes only approved files; rejects overwrite and symlinks')

    # Mock downloads from pristine copies, then alter local and remote bytes separately.
    fixture = temp / 'vendors'
    (fixture / 'tools').mkdir(parents=True)
    (fixture / 'src/vendor').mkdir(parents=True)
    (fixture / 'upstream').mkdir()
    (fixture / 'bin').mkdir()
    shutil.copy(ROOT / 'tools/verify-vendor.sh', fixture / 'tools')
    for name in ['ethers-5.8.0.umd.min.js', 'qrcode-1.5.1.min.js', 'tweetnacl-1.0.3-nacl-fast.min.js']:
        shutil.copy(ROOT / 'src/vendor' / name, fixture / 'src/vendor')
        shutil.copy(ROOT / 'src/vendor' / name, fixture / 'upstream')
    mock = fixture / 'bin/curl'
    mock.write_text('''#!/usr/bin/env python3
import sys, os, pathlib
if os.environ.get('FAIL_FETCH'): sys.exit(22)
u=sys.argv[-1]
n='ethers-5.8.0.umd.min.js' if 'ethers' in u else 'qrcode-1.5.1.min.js' if 'qrcode' in u else 'tweetnacl-1.0.3-nacl-fast.min.js'
sys.stdout.buffer.write((pathlib.Path(os.environ['FIXTURE'])/n).read_bytes())
''')
    mock.chmod(0o755)
    env = dict(os.environ, PATH=str(fixture / 'bin') + os.pathsep + os.environ['PATH'], FIXTURE=str(fixture / 'upstream'))
    def verify(expected, message, extra=None):
        r = run('bash', str(fixture / 'tools/verify-vendor.sh'), env=env | (extra or {}))
        assert r.returncode == expected and message in r.stdout, (r.stdout, r.stderr)
    verify(0, 'All copied vendor')
    local = fixture / 'src/vendor/ethers-5.8.0.umd.min.js'
    original = local.read_bytes()
    local.write_bytes(original + b'\n')
    verify(1, 'LOCAL MISMATCH')
    local.unlink()
    verify(1, 'MISSING')
    local.write_bytes(original)
    remote = fixture / 'upstream/ethers-5.8.0.umd.min.js'
    remote.write_bytes(original + b'\n')
    verify(1, 'UPSTREAM MISMATCH')
    remote.write_bytes(original)
    verify(1, 'DOWNLOAD FAILED', {'FAIL_FETCH': '1'})
    print('PASS vendor verifier rejects missing, altered and unavailable inputs')

spec = importlib.util.spec_from_file_location('preview', ROOT / 'tools/devserver.py')
preview = importlib.util.module_from_spec(spec)
spec.loader.exec_module(preview)
class Quiet(preview.NoCacheHandler):
    def log_message(self, *args): pass
server = preview.ThreadingHTTPServer(('127.0.0.1', 0), Quiet)
threading.Thread(target=server.serve_forever, daemon=True).start()
try:
    for name in ['/index.html', '/src/main.js', '/test/self-test.html']:
        with urllib.request.urlopen('http://127.0.0.1:' + str(server.server_port) + name) as r:
            assert r.status == 200 and r.headers['X-Frame-Options'] == 'DENY'
            r.read()
    for name in ['/.git/HEAD', '/.env', '/AGENTS.md', '/private/note.txt', '/tools/site-files.json', '/src/', '/%2eenv', '/../.git/HEAD']:
        try:
            urllib.request.urlopen('http://127.0.0.1:' + str(server.server_port) + name)
            raise AssertionError('Private path served: ' + name)
        except urllib.error.HTTPError as e:
            assert e.code == 404
finally:
    server.shutdown()
    server.server_close()
print('PASS preview blocks private paths and directory listings')

for name in ['artifacts/private/note.txt', 'private/hosted-analytics.json', 'private/session.json', '.codex/state.json', '.env', '.env.production', 'wallet.keystore', 'test-results/report.json', 'dist/index.html']:
    assert run('git', 'check-ignore', '-q', name).returncode == 0, name
for name in ['.env.example', 'test/vectors.js', 'docs/learn-research/PLAN.md', 'package-lock.json']:
    assert run('git', 'check-ignore', '-q', name).returncode == 1, name
print('PASS ignore rules protect private files without hiding public fixtures or lockfiles')
