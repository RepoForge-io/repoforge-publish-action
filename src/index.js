import * as core from '@actions/core';
import { publishPythonPackage } from './languages/python.js';
import { publishDockerImage } from './languages/docker.js';
import { publishNpmPackage } from './languages/npm.js';
import { publishCondaPackage } from './languages/conda.js';
import { publishDebianPackage } from './languages/debian.js';

async function run() {
  try {
    const packageType = core.getInput('package_type') || 'python';
    const apiToken = core.getInput('api_token', { required: true });
    const hashId = core.getInput('hash_id', { required: true });
    const packageDir = core.getInput('package_dir', { required: true });
    
    switch (packageType.toLowerCase()) {
      case 'python': {
        const failOnConflict = core.getInput('fail_on_conflict') === 'true';
        await publishPythonPackage({ apiToken, hashId, packageDir, failOnConflict });
        break;
      }
      case 'docker': {
        const dockerTag = core.getInput('docker_tag', { required: false });
        const registryName = core.getInput('registry_name', { required: true });
        const dockerContext = core.getInput('docker_context', { required: false });
        const dockerfile = core.getInput('dockerfile', { required: false });
        const buildArgs = core.getInput('build_args', { required: false });
    
        await publishDockerImage({ apiToken, hashId, registryName, dockerTag, dockerContext, dockerfile, buildArgs });
        break;
      }
      case 'npm': {
        await publishNpmPackage({ apiToken, hashId, packageDir });
        break;
      }
      case 'conda': {
        const channelName = core.getInput('channel_name');
        const failOnConflict = core.getInput('fail_on_conflict') === 'true';
        await publishCondaPackage({ apiToken, hashId, channelName, packageDir, failOnConflict });
        break;
      }
      case 'debian': {
        const failOnConflict = core.getInput('fail_on_conflict') === 'true';
        await publishDebianPackage({ apiToken, hashId, packageDir, failOnConflict });
        break;
      }
      default: {
        core.setFailed(`Unsupported package_type: ${packageType}`);
        break;
      }
    }
  } catch (error) {
    core.setFailed(error.message);
  }
}

run();
