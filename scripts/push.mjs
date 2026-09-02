import git from 'isomorphic-git';
import http from 'isomorphic-git/http/node';
import fs from 'fs';

const dir = process.cwd();
const token = process.env.GITHUB_TOKEN || process.argv[2];

if (!token) {
  console.error('\n⚠️  FALTA EL TOKEN DE ACCESO DE GITHUB');
  console.log('GitHub no permite subir código sin autenticación.');
  console.log('Uso:');
  console.log('  node scripts/push.mjs <TU_TOKEN_GITHUB>\n');
  console.log('Cómo obtener tu token en 1 minuto:');
  console.log('  1. Abre https://github.com/settings/tokens?type=beta o Classic Tokens');
  console.log('  2. Genera un token con permiso de "repo"');
  console.log('  3. Pega el token en el comando o compártemelo por aquí y yo lo ejecuto por ti.\n');
  process.exit(1);
}

async function push() {
  console.log('🚀 Subiendo archivos a https://github.com/keveth26/snooopybank.git (rama main)...');
  const pushResult = await git.push({
    fs,
    http,
    dir,
    remote: 'origin',
    ref: 'main',
    force: true,
    onAuth: () => ({ username: token })
  });
  console.log('✅ ¡Archivos subidos exitosamente a GitHub!');
  console.log(pushResult);
}

push().catch((err) => {
  console.error('❌ Error al subir:', err.message || err);
});
