import git from 'isomorphic-git';
import http from 'isomorphic-git/http/node';
import fs from 'fs';
import path from 'path';

const dir = process.cwd();

async function addAll(currentDir) {
  const entries = fs.readdirSync(currentDir, { withFileTypes: true });
  for (const entry of entries) {
    const fullPath = path.join(currentDir, entry.name);
    const relPath = path.relative(dir, fullPath);

    // Skip ignored directories
    if (
      relPath === '.git' ||
      relPath.startsWith('.git/') ||
      relPath === 'node_modules' ||
      relPath.startsWith('node_modules/') ||
      relPath === 'dist' ||
      relPath.startsWith('dist/') ||
      relPath === 'dist-ssr' ||
      relPath.startsWith('dist-ssr/') ||
      relPath === '.DS_Store' ||
      relPath.endsWith('/.DS_Store') ||
      relPath === '.wrangler' ||
      relPath.startsWith('.wrangler/') ||
      relPath === '.system_generated' ||
      relPath.startsWith('.system_generated/') ||
      relPath === 'scratch' ||
      relPath.startsWith('scratch/')
    ) {
      continue;
    }

    if (entry.isDirectory()) {
      await addAll(fullPath);
    } else {
      await git.add({ fs, dir, filepath: relPath });
      console.log('Added:', relPath);
    }
  }
}

async function main() {
  console.log('1. Initializing Git repository...');
  await git.init({ fs, dir, defaultBranch: 'main' });

  console.log('2. Adding files...');
  await addAll(dir);

  console.log('3. Committing...');
  const sha = await git.commit({
    fs,
    dir,
    message: 'Initial commit: Snoopy Bank — Gestor financiero familiar y planificador de pagos',
    author: {
      name: 'David & Eveth',
      email: 'keveth26@users.noreply.github.com'
    }
  });
  console.log('Commit created! SHA:', sha);

  console.log('4. Setting remote origin...');
  await git.addRemote({
    fs,
    dir,
    remote: 'origin',
    url: 'https://github.com/keveth26/snooopybank.git',
    force: true
  });
  console.log('Remote configured: https://github.com/keveth26/snooopybank.git');
}

main().catch(console.error);
