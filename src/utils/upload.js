/* global fetch, FormData, Buffer */

import * as core from '@actions/core';
import { openAsBlob, readdirSync, statSync } from 'fs';
import path from 'path';

export function basicAuthHeader(apiToken) {
  return `Basic ${Buffer.from(`__token__:${apiToken}`).toString('base64')}`;
}

// Recursively finds files in `dir` whose names end with one of `extensions`
export function findFiles(dir, extensions) {
  const absDir = path.resolve(dir);
  let stat;
  try {
    stat = statSync(absDir);
  } catch {
    throw new Error(`Package directory ${absDir} does not exist.`);
  }
  if (!stat.isDirectory()) {
    throw new Error(`Package directory ${absDir} is not a directory.`);
  }

  const found = [];
  const walk = (current) => {
    for (const entry of readdirSync(current, { withFileTypes: true })) {
      const entryPath = path.join(current, entry.name);
      if (entry.isDirectory()) {
        walk(entryPath);
      } else if (extensions.some((ext) => entry.name.endsWith(ext))) {
        found.push(entryPath);
      }
    }
  };
  walk(absDir);

  if (found.length === 0) {
    throw new Error(`No ${extensions.join(' / ')} files found in ${absDir}.`);
  }
  return found.sort();
}

// Uploads a single file as multipart form data, returning the response status and body
export async function uploadFile({ url, apiToken, field, filePath }) {
  const form = new FormData();
  form.append(field, await openAsBlob(filePath), path.basename(filePath));

  const response = await fetch(url, {
    method: 'POST',
    headers: { Authorization: basicAuthHeader(apiToken) },
    body: form,
  });
  return { status: response.status, ok: response.ok, body: await response.text() };
}

// Extracts the `detail` message from a FastAPI error body, falling back to the raw body
export function errorDetail(body) {
  try {
    const parsed = JSON.parse(body);
    if (typeof parsed.detail === 'string') return parsed.detail;
  } catch {
    // not JSON
  }
  return body;
}

// Shared handling for a file whose version already exists in RepoForge
export function handleConflict(fileName, failOnConflict) {
  const msg = `${fileName}: version already exists.`;
  if (failOnConflict) {
    core.setFailed(`${msg} Failing as per configuration.`);
    return false;
  }
  core.warning(`${msg} Skipping upload.`);
  return true;
}
