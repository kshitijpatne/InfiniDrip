import { execFileSync } from 'node:child_process';

for (const name of ['S571-start-add-evidence.json', 'S571-start-add-comment.json']) {
  execFileSync(process.execPath, ['ops/control-center/cli.mjs', `docs/research/epic17/S571-v03-closure-path-audit/${name}`], { stdio: 'inherit' });
}
