#!/usr/bin/env node

import { createReadStream } from 'node:fs';
import { stat } from 'node:fs/promises';
import { createServer } from 'node:http';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const DEFAULT_HOST = '127.0.0.1';
const DEFAULT_PORT = 4173;
const PROJECT_PREFIX = 'project-mama-ena';

function readArg(name, fallback = '') {
  const index = process.argv.indexOf(`--${name}`);
  if (index < 0 || index + 1 >= process.argv.length) return fallback;
  return process.argv[index + 1] || fallback;
}

function normalizeRoot(value) {
  return path.resolve(process.cwd(), value || '.');
}

function getMimeType(filePath) {
  const ext = path.extname(filePath).toLowerCase();
  if (ext === '.html') return 'text/html; charset=utf-8';
  if (ext === '.js' || ext === '.mjs') return 'text/javascript; charset=utf-8';
  if (ext === '.css') return 'text/css; charset=utf-8';
  if (ext === '.json' || ext === '.map') return 'application/json; charset=utf-8';
  if (ext === '.txt') return 'text/plain; charset=utf-8';
  if (ext === '.svg') return 'image/svg+xml';
  if (ext === '.png') return 'image/png';
  if (ext === '.jpg' || ext === '.jpeg') return 'image/jpeg';
  if (ext === '.webp') return 'image/webp';
  if (ext === '.gif') return 'image/gif';
  if (ext === '.ico') return 'image/x-icon';
  if (ext === '.woff') return 'font/woff';
  if (ext === '.woff2') return 'font/woff2';
  if (ext === '.ttf') return 'font/ttf';
  if (ext === '.wasm') return 'application/wasm';
  return 'application/octet-stream';
}

function writeCorsHeaders(res, extra = {}) {
  res.writeHead(extra.status || 200, {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET,HEAD,OPTIONS',
    'Access-Control-Allow-Headers': '*',
    'Cross-Origin-Resource-Policy': 'cross-origin',
    ...extra.headers
  });
}

function stripProjectPrefix(decodedPath) {
  if (decodedPath === `/${PROJECT_PREFIX}`) return '/';
  if (decodedPath.startsWith(`/${PROJECT_PREFIX}/`)) {
    return decodedPath.slice(PROJECT_PREFIX.length + 1) || '/';
  }
  return decodedPath;
}

function isInside(baseDir, filePath) {
  return filePath === baseDir || filePath.startsWith(baseDir + path.sep);
}

function makeCandidate(baseDir, relativePath) {
  const filePath = path.resolve(baseDir, relativePath);
  if (!isInside(baseDir, filePath)) return null;
  return filePath;
}

function addCandidate(candidates, baseDir, relativePath) {
  const filePath = makeCandidate(baseDir, relativePath);
  if (filePath && !candidates.includes(filePath)) candidates.push(filePath);
}

function buildCandidates(rootDir, requestPath) {
  const distDir = path.join(rootDir, 'dist');
  const normalizedPath = stripProjectPrefix(requestPath).replace(/^\/+/, '') || 'index.html';
  const candidates = [];

  if (normalizedPath.startsWith('apps/st-bridge/')) {
    addCandidate(candidates, rootDir, normalizedPath);
    addCandidate(candidates, distDir, normalizedPath);
  }

  if (normalizedPath === 'index.html'
    || normalizedPath.startsWith('apps/')
    || normalizedPath.startsWith('containers/')
    || normalizedPath.startsWith('assets/')) {
    addCandidate(candidates, distDir, normalizedPath);
  }

  if (normalizedPath.startsWith('mama-assets/standing/')) {
    addCandidate(candidates, distDir, normalizedPath);
    addCandidate(
      candidates,
      rootDir,
      normalizedPath.replace(/^mama-assets\/standing\//, 'src/assets/png/standing/')
    );
  }

  if (normalizedPath.startsWith('mama-assets/audio/')) {
    addCandidate(candidates, distDir, normalizedPath);
    addCandidate(
      candidates,
      rootDir,
      normalizedPath.replace(/^mama-assets\/audio\//, 'src/assets/mp3/bgm/')
    );
  }

  addCandidate(candidates, rootDir, normalizedPath);
  addCandidate(candidates, distDir, normalizedPath);
  return candidates;
}

async function resolveFilePath(rootDir, requestUrl) {
  const url = new URL(requestUrl || '/', 'http://127.0.0.1');
  const decodedPath = decodeURIComponent(url.pathname || '/');

  for (const candidate of buildCandidates(rootDir, decodedPath)) {
    const candidateStat = await stat(candidate).catch(() => null);
    if (candidateStat?.isDirectory()) {
      const indexPath = path.join(candidate, 'index.html');
      const indexStat = await stat(indexPath).catch(() => null);
      if (indexStat?.isFile()) return indexPath;
    }
    if (candidateStat?.isFile()) return candidate;
  }
  return null;
}

async function serveFile(req, res, rootDir) {
  if (req.method === 'OPTIONS') {
    writeCorsHeaders(res, { status: 204 });
    res.end();
    return;
  }

  if (req.method !== 'GET' && req.method !== 'HEAD') {
    writeCorsHeaders(res, { status: 405, headers: { 'Content-Type': 'text/plain; charset=utf-8' } });
    res.end('Method Not Allowed');
    return;
  }

  const filePath = await resolveFilePath(rootDir, req.url);
  if (!filePath) {
    writeCorsHeaders(res, { status: 404, headers: { 'Content-Type': 'text/plain; charset=utf-8' } });
    res.end('Not Found');
    return;
  }

  const fileStat = await stat(filePath).catch(() => null);
  if (!fileStat?.isFile()) {
    writeCorsHeaders(res, { status: 404, headers: { 'Content-Type': 'text/plain; charset=utf-8' } });
    res.end('Not Found');
    return;
  }

  writeCorsHeaders(res, {
    headers: {
      'Content-Type': getMimeType(filePath),
      'Content-Length': String(fileStat.size),
      'Cache-Control': 'no-store'
    }
  });
  if (req.method === 'HEAD') {
    res.end();
    return;
  }
  createReadStream(filePath).pipe(res);
}

const rootDir = normalizeRoot(readArg('root', '.'));
const host = readArg('host', DEFAULT_HOST);
const port = Number(readArg('port', String(DEFAULT_PORT))) || DEFAULT_PORT;

const server = createServer((req, res) => {
  serveFile(req, res, rootDir).catch((error) => {
    console.error('[MAMA local server] request failed:', error);
    writeCorsHeaders(res, { status: 500, headers: { 'Content-Type': 'text/plain; charset=utf-8' } });
    res.end('Internal Server Error');
  });
});

server.listen(port, host, () => {
  const scriptPath = path.relative(process.cwd(), fileURLToPath(import.meta.url));
  console.log(`[MAMA local server] ${scriptPath}`);
  console.log(`[MAMA local server] serving ${rootDir}`);
  console.log(`[MAMA local server] http://${host}:${port}`);
  console.log(`[MAMA local server] http://${host}:${port}/${PROJECT_PREFIX}/`);
});
