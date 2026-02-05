import * as core from '@actions/core';
import * as exec from '@actions/exec';
import { writeFileSync } from 'fs';

import path from 'path';

export async function publishNpmPackage({ apiToken, hashId, packageDir }) {
  const absPath = path.resolve(packageDir);
  const registryUrl = `https://api.repoforge.io/npm/${hashId}/`;
  const authTokenUrl = `//api.repoforge.io/npm/${hashId}/:_authToken`;

  core.info(`Publishing NPM package from ${absPath}`);
  core.info(`Using registry: ${registryUrl}`);

  const npmrcContent = `
@repoforge:registry=${registryUrl}
${authTokenUrl}=${apiToken}
`;

  const npmrcPath = path.join(absPath, '.npmrc');
  writeFileSync(npmrcPath, npmrcContent.trim());

  await exec.exec('npm publish', [], { cwd: absPath });
}
