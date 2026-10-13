/* global fetch */

import * as core from '@actions/core';
import path from 'path';
import { basicAuthHeader, errorDetail, findFiles, handleConflict, uploadFile } from '../utils/upload.js';

// Used to check for existing packages when the file isn't inside a <subdir>/ directory
const KNOWN_SUBDIRS = [
  'noarch',
  'linux-64',
  'linux-aarch64',
  'linux-ppc64le',
  'linux-s390x',
  'osx-64',
  'osx-arm64',
  'win-64',
  'win-arm64',
];
const SUBDIR_PATTERN = /^(noarch|[a-z]+-[a-z0-9_]+)$/;

function describeError(status, body, channelName) {
  switch (status) {
    case 401:
      return 'Authentication failed. Check that api_token is a valid RepoForge API token.';
    case 403:
      return 'Not authorized. The API token needs the "Conda - Full access" role.';
    case 404:
      return `Channel \`${channelName}\` doesn't exist in RepoForge. Create it first.`;
    default:
      return `HTTP ${status}: ${errorDetail(body)}`;
  }
}

export async function publishCondaPackage({ apiToken, hashId, channelName, packageDir, failOnConflict }) {
  if (!channelName) {
    core.setFailed('Input "channel_name" is required for Conda publishing.');
    return;
  }

  const channelUrl = `https://api.repoforge.io/conda/${hashId}/${encodeURIComponent(channelName)}/`;
  const files = findFiles(packageDir, ['.conda', '.tar.bz2']);

  core.info(`Publishing ${files.length} Conda package(s) to channel "${channelName}"`);

  // repodata.json per subdir, fetched lazily and shared between files
  const repoData = new Map();
  const getRepoData = async (subdir) => {
    if (!repoData.has(subdir)) {
      const response = await fetch(`${channelUrl}${subdir}/repodata.json`, {
        headers: { Authorization: basicAuthHeader(apiToken) },
      });
      repoData.set(subdir, response.ok ? await response.json() : null);
    }
    return repoData.get(subdir);
  };

  const alreadyExists = async (filePath) => {
    const fileName = path.basename(filePath);
    const parent = path.basename(path.dirname(filePath));
    const subdirs = SUBDIR_PATTERN.test(parent) ? [parent] : KNOWN_SUBDIRS;
    for (const subdir of subdirs) {
      const data = await getRepoData(subdir);
      if (data?.packages?.[fileName]) return true;
    }
    return false;
  };

  for (const filePath of files) {
    const fileName = path.basename(filePath);

    if (await alreadyExists(filePath)) {
      if (handleConflict(fileName, failOnConflict)) continue;
      return;
    }

    const { ok, status, body } = await uploadFile({ url: channelUrl, apiToken, field: 'file', filePath });
    if (!ok) {
      core.setFailed(`${fileName}: upload failed. ${describeError(status, body, channelName)}`);
      return;
    }
    core.info(`${fileName}: uploaded`);
  }
}
