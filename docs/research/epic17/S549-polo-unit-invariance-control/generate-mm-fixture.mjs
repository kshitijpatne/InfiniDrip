import { createHash } from 'node:crypto';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
const sourcePath = 'C:/G04-CLO-DXF-Exchange/Input/polo-standard-m.dxf';
const outDir = 'C:/G04-CLO-DXF-Exchange/S549-polo-unit-invariance-control';
const input = await readFile(sourcePath, 'utf8');
const sha = value => createHash('sha256').update(value).digest('hex');
if (sha(Buffer.from(input, 'utf8')) !== '796e537ec77e86b16d6b82c3aadd4a9982933314097b707ae689936c65944fca') throw new Error('Unexpected source hash');
const lines = input.split(/\r?\n/);
if ((lines.length - 1) % 2 !== 0) throw new Error('DXF code/value pairs are malformed');
const lengthCodes = new Set([...Array.from({length:9},(_,i)=>10+i), ...Array.from({length:9},(_,i)=>20+i), ...Array.from({length:9},(_,i)=>30+i), 39, 40]);
let changed = 0;
const output = [];
for (let i=0;i<lines.length-1;i+=2) {
 const code = Number(lines[i].trim());
 let value = lines[i+1];
 if (lengthCodes.has(code)) {
   const n = Number(value.trim());
   if (!Number.isFinite(n)) throw new Error(`Non-numeric length value for DXF code ${code}`);
   value = String(n * 10);
   changed++;
 }
 output.push(lines[i], value);
}
output.push('');
const mm = output.join('\r\n');
const mmLines = mm.split(/\r?\n/);
let maxInverseError = 0;
for (let i=0;i<lines.length-1;i+=2) {
 const code=Number(lines[i].trim());
 if (lengthCodes.has(code)) {
   const a=Number(lines[i+1].trim()); const b=Number(mmLines[i+1].trim())/10;
   maxInverseError=Math.max(maxInverseError,Math.abs(a-b));
 } else if (lines[i]!==mmLines[i] || lines[i+1]!==mmLines[i+1]) throw new Error(`Non-geometric DXF data changed at pair ${i/2}`);
}
if (maxInverseError>1e-12) throw new Error(`Inverse unit conversion differs by ${maxInverseError}`);
await mkdir(outDir,{recursive:true});
const dest=`${outDir}/polo-standard-m-mm.dxf`;
await writeFile(dest, mm, 'utf8');
console.log(JSON.stringify({sourcePath,sourceSha256:sha(Buffer.from(input,'utf8')),outputPath:dest,outputSha256:sha(Buffer.from(mm,'utf8')),lengthValuesScaled:changed,inverseMaximumErrorCm:maxInverseError,bytes:Buffer.byteLength(mm)},null,2));
