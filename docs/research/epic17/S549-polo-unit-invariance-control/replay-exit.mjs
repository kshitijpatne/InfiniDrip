import { execFileSync } from 'node:child_process';
for(const name of ['S549-exit-add-evidence.json','S549-exit-add-comment.json'])execFileSync(process.execPath,['ops/control-center/cli.mjs',`docs/research/epic17/S549-polo-unit-invariance-control/${name}`],{stdio:'inherit'});
