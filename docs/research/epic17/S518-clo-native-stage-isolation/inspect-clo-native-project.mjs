import { createHash } from 'node:crypto';
import { readFile, writeFile } from 'node:fs/promises';
import { inflateRawSync } from 'node:zlib';

const root = 'C:/G04-CLO-DXF-Exchange/S518-clo-native-stage-isolation';
const projectPath = process.argv[2] ?? `${root}/Projects/polo-aama-pre-export.zprj`;
const sourcePath = process.argv[3] ?? `${root}/Input/polo-standard-m.dxf`;
const reportPath = process.argv[4] ?? `${root}/Evidence/Analysis/s518-native-project-inspection.json`;
const expectedSourceSha256 = '796e537ec77e86b16d6b82c3aadd4a9982933314097b707ae689936c65944fca';
const testedCoordinates = [
  37.489, 74.514, 139.277, 66.459, 156.921, 174.564, 194.164,
  374.89, 745.14, 1392.77, 664.59,
];

function sha256(buffer) {
  return createHash('sha256').update(buffer).digest('hex');
}

const crcTable = Uint32Array.from({ length: 256 }, (_, value) => {
  let crc = value;
  for (let bit = 0; bit < 8; bit += 1) {
    crc = (crc & 1) ? (0xedb88320 ^ (crc >>> 1)) : (crc >>> 1);
  }
  return crc >>> 0;
});

function crc32(buffer) {
  let crc = 0xffffffff;
  for (const byte of buffer) crc = crcTable[(crc ^ byte) & 0xff] ^ (crc >>> 8);
  return (crc ^ 0xffffffff) >>> 0;
}

function parseEmbeddedZip(buffer, label) {
  const endSignature = Buffer.from([0x50, 0x4b, 0x05, 0x06]);
  const endOffset = buffer.lastIndexOf(endSignature);
  if (endOffset < 0 || endOffset + 22 > buffer.length) {
    throw new Error(`${label}: ZIP end record was not found`);
  }

  const commentLength = buffer.readUInt16LE(endOffset + 20);
  if (endOffset + 22 + commentLength !== buffer.length) {
    throw new Error(`${label}: ZIP end record does not terminate the container`);
  }

  const disk = buffer.readUInt16LE(endOffset + 4);
  const directoryDisk = buffer.readUInt16LE(endOffset + 6);
  const entriesOnDisk = buffer.readUInt16LE(endOffset + 8);
  const entryCount = buffer.readUInt16LE(endOffset + 10);
  const directorySize = buffer.readUInt32LE(endOffset + 12);
  const directoryOffset = buffer.readUInt32LE(endOffset + 16);
  if (disk !== 0 || directoryDisk !== 0 || entriesOnDisk !== entryCount) {
    throw new Error(`${label}: multi-disk ZIP is not supported`);
  }

  const directoryStart = endOffset - directorySize;
  const containerPrefix = directoryStart - directoryOffset;
  if (containerPrefix < 0) throw new Error(`${label}: invalid ZIP prefix offset`);

  const entries = [];
  let cursor = directoryStart;
  for (let index = 0; index < entryCount; index += 1) {
    if (buffer.readUInt32LE(cursor) !== 0x02014b50) {
      throw new Error(`${label}: invalid central-directory entry ${index}`);
    }
    const method = buffer.readUInt16LE(cursor + 10);
    const expectedCrc = buffer.readUInt32LE(cursor + 16);
    const compressedSize = buffer.readUInt32LE(cursor + 20);
    const uncompressedSize = buffer.readUInt32LE(cursor + 24);
    const nameLength = buffer.readUInt16LE(cursor + 28);
    const extraLength = buffer.readUInt16LE(cursor + 30);
    const entryCommentLength = buffer.readUInt16LE(cursor + 32);
    const localOffset = buffer.readUInt32LE(cursor + 42);
    const nameStart = cursor + 46;
    const name = buffer.toString('utf8', nameStart, nameStart + nameLength);
    const localStart = containerPrefix + localOffset;
    if (buffer.readUInt32LE(localStart) !== 0x04034b50) {
      throw new Error(`${label}: invalid local header for ${name}`);
    }
    const localNameLength = buffer.readUInt16LE(localStart + 26);
    const localExtraLength = buffer.readUInt16LE(localStart + 28);
    const dataStart = localStart + 30 + localNameLength + localExtraLength;
    const compressed = buffer.subarray(dataStart, dataStart + compressedSize);
    const data = method === 0
      ? Buffer.from(compressed)
      : method === 8
        ? inflateRawSync(compressed)
        : (() => { throw new Error(`${label}: unsupported ZIP method ${method} for ${name}`); })();
    if (data.length !== uncompressedSize || crc32(data) !== expectedCrc) {
      throw new Error(`${label}: size or CRC check failed for ${name}`);
    }
    entries.push({ name, data, method, compressedSize, uncompressedSize });
    cursor += 46 + nameLength + extraLength + entryCommentLength;
  }
  if (cursor !== endOffset) throw new Error(`${label}: central-directory size mismatch`);
  return { containerPrefix, directoryOffset, entries };
}

function hasBytes(haystack, needle) {
  return haystack.indexOf(needle) >= 0;
}

function coordinateSignatures(payload) {
  return testedCoordinates.map((value) => {
    const f32 = Buffer.alloc(4);
    const f64 = Buffer.alloc(8);
    f32.writeFloatLE(value);
    f64.writeDoubleLE(value);
    return {
      value,
      ascii: hasBytes(payload, Buffer.from(String(value), 'ascii')),
      utf16le: hasBytes(payload, Buffer.from(String(value), 'utf16le')),
      float32le: hasBytes(payload, f32),
      float64le: hasBytes(payload, f64),
    };
  });
}

const [project, source] = await Promise.all([readFile(projectPath), readFile(sourcePath)]);
const sourceSha256 = sha256(source);
if (sourceSha256 !== expectedSourceSha256) {
  throw new Error(`Pinned source hash mismatch: ${sourceSha256}`);
}

const outer = parseEmbeddedZip(project, 'native project');
const nestedArchives = [];
let primaryPayload;
for (const entry of outer.entries) {
  if (!['.zpac', '.vmp', '.vlp', '.vrp'].some((suffix) => entry.name.endsWith(suffix))) continue;
  const nested = parseEmbeddedZip(entry.data, entry.name);
  nestedArchives.push({
    name: entry.name,
    prefixBytes: nested.containerPrefix,
    entries: nested.entries.map((child) => ({
      name: child.name,
      bytes: child.data.length,
      sha256: sha256(child.data),
    })),
  });
  if (entry.name.endsWith('.zpac')) {
    primaryPayload = nested.entries.find((child) => child.name.endsWith('.pac'));
  }
}
if (!primaryPayload) throw new Error('Native project pattern payload (.pac) was not found');

const coordinateChecks = coordinateSignatures(primaryPayload.data);
const report = {
  experiment: 'S518 native project saved after DXF-AAMA import and before any DXF export',
  receiver: 'CLO 2026.1.310 (r58944)',
  source: { path: sourcePath, bytes: source.length, sha256: sourceSha256 },
  nativeProject: {
    path: projectPath,
    bytes: project.length,
    sha256: sha256(project),
    prefix: project.subarray(0, 16).toString('ascii'),
    embeddedZipPrefixBytes: outer.containerPrefix,
    entries: outer.entries.map((entry) => ({ name: entry.name, bytes: entry.data.length })),
  },
  nestedArchives,
  patternPayload: {
    name: primaryPayload.name,
    bytes: primaryPayload.data.length,
    sha256: sha256(primaryPayload.data),
    printableSourceCoordinateMatches: coordinateChecks.filter((check) => check.ascii || check.utf16le).length,
    testedCoordinateSignatures: coordinateChecks,
    exactOutlineAssessment: 'Not measurable with the available safe parser: the CLO .pac geometry payload is a proprietary binary record; the embedded package index is readable, but no documented decoder or directly usable contour records were found. Coordinate signature checks are diagnostic only, not proof that geometry is absent.',
  },
  disposition: 'Stop before another DXF export. The native save proves the project captured an import-stage state, but without readable exact contour records it cannot attribute S516 point loss to import versus export. Re-exporting would repeat the already-failing combined transform without resolving stage attribution.',
};

await writeFile(reportPath, `${JSON.stringify(report, null, 2)}\n`);
console.log(JSON.stringify({ reportPath, nativeProjectSha256: report.nativeProject.sha256, patternPayloadBytes: report.patternPayload.bytes, nestedEntries: nestedArchives.map(({ name, entries }) => ({ name, count: entries.length })), readableSourceCoordinateMatches: report.patternPayload.printableSourceCoordinateMatches, disposition: report.disposition }, null, 2));
