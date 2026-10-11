import { createHash } from 'node:crypto';
import { readFile } from 'node:fs/promises';
import { inflateRawSync } from 'node:zlib';

const projectPath = process.argv[2] ?? 'C:/G04-CLO-DXF-Exchange/S565-clo-grade-state-diagnosis/s565-corrected-grade-trial.zprj';
const bytes = await readFile(projectPath);
const localSignature = Buffer.from([0x50, 0x4b, 0x03, 0x04]);
const centralSignature = 0x02014b50;
const endSignature = Buffer.from([0x50, 0x4b, 0x05, 0x06]);
const endOffset = bytes.lastIndexOf(endSignature);
if (endOffset < 0) throw new Error('No ZIP end-of-central-directory signature found');
const prefixLength = bytes.indexOf(localSignature);
if (prefixLength < 0) throw new Error('No first local-entry signature found');
const entryCount = bytes.readUInt16LE(endOffset + 10);
let cursor = bytes.readUInt32LE(endOffset + 16) + prefixLength;
const entries = [];
for (let index = 0; index < entryCount; index++) {
  if (bytes.readUInt32LE(cursor) !== centralSignature) throw new Error(`Invalid central entry at ${cursor}`);
  const method = bytes.readUInt16LE(cursor + 10);
  const compressedSize = bytes.readUInt32LE(cursor + 20);
  const uncompressedSize = bytes.readUInt32LE(cursor + 24);
  const nameLength = bytes.readUInt16LE(cursor + 28);
  const extraLength = bytes.readUInt16LE(cursor + 30);
  const commentLength = bytes.readUInt16LE(cursor + 32);
  const localOffset = bytes.readUInt32LE(cursor + 42) + prefixLength;
  const name = bytes.subarray(cursor + 46, cursor + 46 + nameLength).toString('utf8');
  const localNameLength = bytes.readUInt16LE(localOffset + 26);
  const localExtraLength = bytes.readUInt16LE(localOffset + 28);
  const dataStart = localOffset + 30 + localNameLength + localExtraLength;
  const compressed = bytes.subarray(dataStart, dataStart + compressedSize);
  let textObservation = null;
  if (name.endsWith('.xml')) {
    const expanded = method === 8 ? inflateRawSync(compressed) : compressed;
    if (expanded.length !== uncompressedSize) throw new Error(`Unexpected expanded length for ${name}`);
    const text = expanded.toString('utf8');
    textObservation = {
      root: text.match(/<([A-Za-z][\w.-]*)\b/)?.[1] ?? null,
      environmentOnly: /^\s*<\?xml[\s\S]*?<Environment\b[\s\S]*?<\/Environment>\s*$/i.test(text),
      patternOrGradeTags: [...text.matchAll(/<\/?([A-Za-z][\w.-]*)\b/g)].map(match => match[1]).filter(tag => /pattern|grade|piece|sew/i.test(tag)),
    };
  }
  entries.push({ name, method, compressedSize, uncompressedSize, textObservation });
  cursor += 46 + nameLength + extraLength + commentLength;
}

console.log(JSON.stringify({
  projectPath: projectPath.replaceAll('\\', '/'),
  sha256: createHash('sha256').update(bytes).digest('hex'),
  bytes: bytes.length,
  detectedContainer: `ZIP local and central records behind a ${prefixLength}-byte application prefix`,
  entryCount: entries.length,
  entries,
  limitation: 'The package exposes the environment XML text but stores the pattern/package payloads in application-specific binary entries; this inspector does not decode CLO pattern or grade semantics.',
}, null, 2));
