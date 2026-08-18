import assert from "node:assert/strict";

const bytes = await Deno.readFile(
  new URL("../assets/wasm/spark-processor.wasm", import.meta.url),
);
const { instance } = await WebAssembly.instantiate(bytes);
const api = instance.exports;
const requiredExports = [
  "memory",
  "current_buffer",
  "previous_buffer",
  "audio_buffer",
  "exposure",
  "sharpness",
  "best_shift",
  "shift_error",
  "commit_frame",
  "master_audio",
];

requiredExports.forEach((name) =>
  assert.ok(api[name], `Export ausente: ${name}`)
);

const width = 16;
const height = 16;
const length = width * height;
const current = new Uint8Array(
  api.memory.buffer,
  api.current_buffer(),
  length,
);
current.fill(128);
assert.equal(api.exposure(length), 128 * 256);
assert.equal(api.sharpness(width, height), 0);

for (let index = 0; index < length; index += 1) {
  current[index] = (index * 37 + index * index * 11) % 256;
}
assert.ok(api.sharpness(width, height) > 0);
api.commit_frame(length);
const previous = current.slice();
current.fill(0);
for (let y = 0; y < height; y += 1) {
  for (let x = 0; x < width - 1; x += 1) {
    current[y * width + x + 1] = previous[y * width + x];
  }
}
const packedShift = api.best_shift(width, height, 3);
assert.equal(packedShift >> 16, 1);
assert.equal((packedShift << 16) >> 16, 0);
assert.equal(api.shift_error(), 0);

// Excede deliberadamente o antigo limite de 16.384 para testar memória dinâmica.
const sampleCount = 50_000;
const audioPointer = api.audio_buffer();
const requiredBytes = audioPointer +
  sampleCount * Float32Array.BYTES_PER_ELEMENT;
if (requiredBytes > api.memory.buffer.byteLength) {
  api.memory.grow(
    Math.ceil((requiredBytes - api.memory.buffer.byteLength) / 65_536),
  );
}
const audio = new Float32Array(api.memory.buffer, audioPointer, sampleCount);
for (let index = 0; index < sampleCount; index += 1) {
  audio[index] = index % 2 ? -0.2 : 0.2;
}
audio[123] = Number.NaN;
const gain = api.master_audio(sampleCount, 0.9);
assert.ok(Math.abs(gain - 4.5) < 0.001);
assert.ok(Math.abs(audio[0] - 0.9) < 0.001);
assert.ok(Math.abs(audio[sampleCount - 1] + 0.9) < 0.001);
assert.equal(audio[123], 0);

console.log("Todos os testes do processador WebAssembly passaram.");
