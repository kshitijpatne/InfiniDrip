import { execFileSync } from 'node:child_process';
for (const name of ['S564-start-add-evidence.json', 'S564-start-add-comment.json']) {
  execFileSync(process.execPath, ['ops/control-center/cli.mjs', `docs/research/epic17/S564-clo-native-size-group-probe/${name}`], { stdio: 'inherit' });
}
