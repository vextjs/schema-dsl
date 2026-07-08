#!/usr/bin/env node

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const scriptDir = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(scriptDir, '..');
const docsRoot = path.join(repoRoot, 'docs');
const websiteConfigPath = path.join(repoRoot, 'website', 'rspress.config.ts');

const markdownLinkPattern = /!?\[[^\]\n]*\]\(([^)\n]+)\)/g;
const websiteRoutePattern = /link:\s*['"`]([^'"`]+)['"`]/g;
const externalPattern = /^[a-z][a-z0-9+.-]*:|^\/\//i;

const errors = [];
let checkedTargets = 0;

function toDisplay(filePath) {
  return path.relative(repoRoot, filePath).replaceAll(path.sep, '/');
}

function listMarkdownFiles(entry) {
  const stat = fs.statSync(entry);
  if (stat.isFile()) return entry.endsWith('.md') ? [entry] : [];

  return fs.readdirSync(entry, { withFileTypes: true }).flatMap((dirent) => {
    const child = path.join(entry, dirent.name);
    if (dirent.isDirectory()) return listMarkdownFiles(child);
    return dirent.isFile() && dirent.name.endsWith('.md') ? [child] : [];
  });
}

function stripMarkdownTarget(rawTarget) {
  const trimmed = rawTarget.trim();
  if (trimmed.startsWith('<')) {
    const closing = trimmed.indexOf('>');
    return closing >= 0 ? trimmed.slice(1, closing) : trimmed.slice(1);
  }
  return trimmed.split(/\s+/)[0];
}

function withoutHashOrQuery(target) {
  return target.split('#')[0].split('?')[0];
}

function decodeTarget(target) {
  try {
    return decodeURIComponent(target);
  } catch {
    return target;
  }
}

function pathExists(targetPath) {
  const candidates = [targetPath];
  if (!path.extname(targetPath)) {
    candidates.push(`${targetPath}.md`);
    candidates.push(path.join(targetPath, 'index.md'));
  }
  return candidates.some((candidate) => fs.existsSync(candidate));
}

function docPathForRoute(route) {
  const cleanRoute = withoutHashOrQuery(route).replace(/\/+$/, '');
  if (cleanRoute === '' || cleanRoute === '/') return path.join(docsRoot, 'en', 'index.md');
  if (cleanRoute === '/schema-dsl') return path.join(docsRoot, 'en', 'index.md');

  let routePath = cleanRoute;
  if (routePath.startsWith('/schema-dsl/')) {
    routePath = routePath.slice('/schema-dsl'.length);
  }

  if (routePath === '/zh') return path.join(docsRoot, 'zh', 'index.md');
  if (routePath.startsWith('/zh/')) {
    const slug = routePath.slice('/zh/'.length) || 'index';
    return path.join(docsRoot, 'zh', `${slug}.md`);
  }

  if (routePath.startsWith('/')) {
    const slug = routePath.slice(1) || 'index';
    return path.join(docsRoot, 'en', `${slug}.md`);
  }

  return null;
}

function validateLocalTarget(sourceFile, rawTarget) {
  const target = stripMarkdownTarget(rawTarget);
  if (!target || target.startsWith('#') || externalPattern.test(target)) return;

  const targetWithoutHash = withoutHashOrQuery(target);
  if (!targetWithoutHash) return;

  checkedTargets += 1;

  if (targetWithoutHash.startsWith('/')) {
    const expectedDoc = docPathForRoute(targetWithoutHash);
    if (!expectedDoc || !fs.existsSync(expectedDoc)) {
      errors.push(`${toDisplay(sourceFile)} -> ${target} (missing route target ${expectedDoc ? toDisplay(expectedDoc) : 'unknown'})`);
    }
    return;
  }

  const decodedTarget = decodeTarget(targetWithoutHash);
  const resolved = path.resolve(path.dirname(sourceFile), decodedTarget);
  if (!pathExists(resolved)) {
    errors.push(`${toDisplay(sourceFile)} -> ${target} (missing file target ${toDisplay(resolved)})`);
  }
}

function validateMarkdownFile(filePath) {
  const content = fs.readFileSync(filePath, 'utf8');
  for (const match of content.matchAll(markdownLinkPattern)) {
    validateLocalTarget(filePath, match[1]);
  }
}

function validateWebsiteRoutes() {
  const content = fs.readFileSync(websiteConfigPath, 'utf8');
  for (const match of content.matchAll(websiteRoutePattern)) {
    const route = match[1];
    if (!route || externalPattern.test(route)) continue;

    checkedTargets += 1;
    const expectedDoc = docPathForRoute(route);
    if (!expectedDoc || !fs.existsSync(expectedDoc)) {
      errors.push(`${toDisplay(websiteConfigPath)} -> ${route} (missing route target ${expectedDoc ? toDisplay(expectedDoc) : 'unknown'})`);
    }
  }
}

const markdownFiles = [
  path.join(repoRoot, 'README.md'),
  ...listMarkdownFiles(docsRoot)
];

for (const filePath of markdownFiles) {
  validateMarkdownFile(filePath);
}
validateWebsiteRoutes();

if (errors.length > 0) {
  console.error(`[docs:linkcheck] ${errors.length} broken local link target(s) found:`);
  for (const error of errors) {
    console.error(`- ${error}`);
  }
  process.exitCode = 1;
} else {
  console.log(`[docs:linkcheck] OK: checked ${markdownFiles.length} markdown files and ${checkedTargets} local link/route targets.`);
}
