import { readFile, writeFile } from 'node:fs/promises';

const input = new URL('../S403-woven-front-source-crossing-audit/woven-front-path-crossings.json', import.meta.url);
const output = new URL('./woven-collar-placket-overlap-summary.json', import.meta.url);
const matrix = JSON.parse(await readFile(input, 'utf8'));
const groups = new Map();

for (const row of matrix.records) {
  if (row.revisionId !== 'live-draft:woven-shirt:14:14') throw new Error(`unexpected revision ${row.revisionId}`);
  for (const crossing of row.pathPairCrossings) {
    const firstRole = crossing.firstEntityId.match(/component:([^:]+):outline/)?.[1];
    const secondRole = crossing.secondEntityId.match(/component:([^:]+):outline/)?.[1];
    if (!['buttonPlacket', 'buttonholePlacket'].includes(firstRole) ||
        !['outerStand', 'underCollar', 'upperCollar'].includes(secondRole)) continue;
    for (const point of crossing.points) {
      const key = `${firstRole}|${secondRole}|${point.x.toFixed(6)}|${point.y.toFixed(6)}`;
      const group = groups.get(key) ?? { firstRole, secondRole, point, cases: [] };
      group.cases.push({ caseId: row.caseId, options: row.options });
      groups.set(key, group);
    }
  }
}

const summary = {
  source: 'S403 production-renderer path matrix; no regeneration or renderer changes',
  revisionId: 'live-draft:woven-shirt:14:14',
  configurationCount: matrix.records.length,
  crossingGroups: [...groups.values()].map(group => ({
    ...group,
    configurationCount: group.cases.length,
    uniquePoints: 1,
  })),
};
await writeFile(output, `${JSON.stringify(summary, null, 2)}\n`);
process.stdout.write(`wrote ${summary.crossingGroups.length} exact point groups from ${summary.configurationCount} configurations\n`);
