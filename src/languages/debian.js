/* global fetch */

import * as core from '@actions/core';
import * as exec from '@actions/exec';
import path from 'path';
import { basicAuthHeader, errorDetail, findFiles, handleConflict, uploadFile } from '../utils/upload.js';

function describeError(status, body) {
  switch (status) {
    case 401:
      return 'Authentication failed. Check that api_token is a valid RepoForge API token.';
    case 403:
      return 'Not authorized. The API token needs the "Debian - Full access" role.';
    case 500:
      return `HTTP 500: ${errorDetail(body)}. Check that the file is a valid .deb package.`;
    default:
      return `HTTP ${status}: ${errorDetail(body)}`;
  }
}

// Reads Package, Version and Architecture from a .deb. Returns null if dpkg-deb isn't installed.
async function readControlFields(filePath) {
  let result;
  try {
    result = await exec.getExecOutput('dpkg-deb', ['-f', filePath, 'Package', 'Version', 'Architecture'], {
      silent: true,
      ignoreReturnCode: true,
    });
  } catch {
    return null;
  }
  if (result.exitCode !== 0) {
    throw new Error(`${path.basename(filePath)} is not a valid Debian package: ${result.stderr.trim()}`);
  }
  const fields = {};
  for (const line of result.stdout.split('\n')) {
    const [key, ...rest] = line.split(':');
    if (key) fields[key.trim().toLowerCase()] = rest.join(':').trim();
  }
  return fields;
}

export async function publishDebianPackage({ apiToken, hashId, packageDir, failOnConflict }) {
  const baseUrl = `https://api.repoforge.io/debian/${hashId}/`;
  const files = findFiles(packageDir, ['.deb']);

  core.info(`Publishing ${files.length} Debian package(s)`);

  // RepoForge keeps one version per package and architecture, so compare against that
  const alreadyExists = async (filePath) => {
    const fields = await readControlFields(filePath);
    if (!fields) {
      core.warning('dpkg-deb not found, so existing versions can\'t be checked. Uploads will overwrite them.');
      return false;
    }
    const { package: name, version, architecture } = fields;
    const response = await fetch(
      `${baseUrl}dists/${encodeURIComponent(name)}/main/binary-${encodeURIComponent(architecture)}/Packages`,
      { headers: { Authorization: basicAuthHeader(apiToken) } },
    );
    if (!response.ok) return false;
    const match = (await response.text()).match(/^Version:\s*(.+)$/m);
    return match?.[1].trim() === version;
  };

  for (const filePath of files) {
    const fileName = path.basename(filePath);

    if (await alreadyExists(filePath)) {
      if (handleConflict(fileName, failOnConflict)) continue;
      return;
    }

    const { ok, status, body } = await uploadFile({ url: baseUrl, apiToken, field: 'content', filePath });
    if (!ok) {
      core.setFailed(`${fileName}: upload failed. ${describeError(status, body)}`);
      return;
    }
    core.info(`${fileName}: uploaded`);
  }
}
