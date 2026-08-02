import { mkdirSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const sampleRate = 44_100;
const durationSeconds = 1.2;
const sampleCount = Math.floor(sampleRate * durationSeconds);
const samples = new Int16Array(sampleCount);
const notes = [
  { start: 0, frequency: 659.25 },
  { start: 0.28, frequency: 783.99 },
  { start: 0.56, frequency: 1046.5 },
];

for (let index = 0; index < sampleCount; index += 1) {
  const time = index / sampleRate;
  let value = 0;

  for (const note of notes) {
    const elapsed = time - note.start;
    if (elapsed < 0 || elapsed > 0.52) continue;

    const attack = Math.min(1, elapsed / 0.015);
    const release = Math.min(1, (0.52 - elapsed) / 0.12);
    const envelope = attack * release * Math.exp(-3.8 * elapsed);
    const fundamental = Math.sin(2 * Math.PI * note.frequency * elapsed);
    const overtone = Math.sin(4 * Math.PI * note.frequency * elapsed) * 0.22;
    value += (fundamental + overtone) * envelope * 0.24;
  }

  samples[index] = Math.round(Math.max(-1, Math.min(1, value)) * 32_767);
}

const dataSize = samples.byteLength;
const wav = Buffer.alloc(44 + dataSize);
wav.write("RIFF", 0);
wav.writeUInt32LE(36 + dataSize, 4);
wav.write("WAVE", 8);
wav.write("fmt ", 12);
wav.writeUInt32LE(16, 16);
wav.writeUInt16LE(1, 20);
wav.writeUInt16LE(1, 22);
wav.writeUInt32LE(sampleRate, 24);
wav.writeUInt32LE(sampleRate * 2, 28);
wav.writeUInt16LE(2, 32);
wav.writeUInt16LE(16, 34);
wav.write("data", 36);
wav.writeUInt32LE(dataSize, 40);

for (let index = 0; index < samples.length; index += 1) {
  wav.writeInt16LE(samples[index], 44 + index * 2);
}

const scriptDirectory = dirname(fileURLToPath(import.meta.url));
const output = resolve(scriptDirectory, "../assets/sounds/medication_reminder.wav");
mkdirSync(dirname(output), { recursive: true });
writeFileSync(output, wav);
console.log(`Som criado em ${output}`);
