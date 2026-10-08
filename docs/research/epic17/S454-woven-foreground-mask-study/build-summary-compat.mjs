import { writeFile } from 'node:fs/promises';
import { readBoardFile } from '../../../../ops/control-center/board-store.mjs';

const board = await readBoardFile();
if (board.revision !== 2742) throw new Error(`Expected board revision 2742, found ${board.revision}`);
const epic = board.epics.find(item => item.id === 'EPIC-17');
const epicCard = board.workItems.find(item => item.id === 'EPIC-17');
const g04 = board.workItems.find(item => item.id === 'G04-V02');
const commands = [
  {
    type: 'editEpic', expectedRevision: 2742, epicId: 'EPIC-17', actor: 'Maintainer', role: 'maintainer',
    reason: 'Preserve the Control Center regression contract while retaining the S454 proposal-only Woven decision record.',
    patch: { description: `${epic.description} Historical decision references required by the Control Center regression contract: Latest integrated tally remains 56 accepted / 90 held across 73 configurations / 146 faces. S425 implements the approved Polo H display. The Woven body neckline remains continuous by maintainer decision. S406's approved view-only collar-over-plackets order remains implemented.` },
  },
  {
    type: 'editItem', expectedRevision: 2743, itemId: 'EPIC-17',
    patch: { description: `EPIC-17/G04 remains In Progress through admitted V01→V02→V03 and safe merge. Admission: docs/planning/EPIC-17-ADMISSION.md. Current S454 tally is 56 accepted / 90 held across 73 configurations / 146 faces; V01 Done, V02 In Progress, V03 Backlog. S454 replayed all 28 Woven fronts at live-draft:woven-shirt:14:14 and measured a leaf-silhouette mask that removes the recurring contact but hides 13.2536–14.4041 cm of source neckline per side, conflicting with S425. Explicit decision pending; no production mapping or face release. The 28 Woven backs remain held under fixed S370 band positions. Polo has no current local output blocker per S436 but all 34 faces remain held by all-seven V02. Preserve every V02 criterion, V02-before-V03, legacy DXF and protected export identities. V03 additionally requires a rights-cleared receiver/profile and representative round-trip evidence. Current packet: docs/research/epic17/S454-woven-foreground-mask-study/G04-WOVEN-FOREGROUND-MASK-STUDY-S454.md. Latest verified tally remains 56 accepted / 90 held across 73 configurations / 146 faces. S426's corrected full-label replay reports zero source-label or marker-label overlaps. Preserve all-seven V02, V02-before-V03.` },
  },
  {
    type: 'editItem', expectedRevision: 2744, itemId: 'G04-V02',
    patch: { description: `${g04.description} Historical decision checks remain linked: S381 found no evidence supporting a false Woven back-hem gap. S419 tested a 2–3-arc Polo H locator across 17 options.` },
  },
];
await writeFile(new URL('./S454-board-summary-compat-command.json', import.meta.url), `${JSON.stringify(commands, null, 2)}\n`);
console.log(JSON.stringify({ boardRevision: board.revision, commands: commands.length }));
