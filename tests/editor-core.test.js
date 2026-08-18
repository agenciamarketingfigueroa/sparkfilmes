import assert from "node:assert/strict";
import "../assets/js/editor-core.js";

const core = globalThis.SparkEditorCore;

assert.equal(core.formatTime(0), "00:00");
assert.equal(core.formatTime(65.94, true), "01:05.9");
assert.deepEqual(core.outputDimensions(16 / 9, 2160), {
  width: 3840,
  height: 2160,
});
assert.deepEqual(core.outputDimensions(9 / 16, 2160), {
  width: 2160,
  height: 3840,
});

const original = core.normalizeSegments([{ start: 0, end: 10 }], 10);
const split = core.splitSegments(original, 4, 10);
assert.equal(split.length, 2);
assert.equal(split[0].end, 4);
assert.equal(split[1].start, 4);

const subtracted = core.subtractRanges(original, [{ start: 2, end: 3 }, {
  start: 7,
  end: 9,
}], 10);
assert.deepEqual(subtracted.map(({ start, end }) => [start, end]), [[0, 2], [
  3,
  7,
], [9, 10]]);
assert.equal(core.outputDuration([{ start: 0, end: 10, speed: "2" }]), 5);
assert.equal(core.findSegmentIndex(subtracted, 5), 1);
assert.equal(core.findSegmentIndex(subtracted, 2.5), -1);

const rangesToMerge = [
  { start: 3.12, end: 4 },
  { start: 2, end: 3 },
  { start: -1, end: 0.2 },
  { start: 9.8, end: 11 },
  { start: 7, end: 6 },
];
const rangesSnapshot = structuredClone(rangesToMerge);
assert.deepEqual(
  core.mergeRanges(rangesToMerge, 10, { gap: 0.15, padding: 0.05 }),
  [
    { start: 0, end: 0.25 },
    { start: 1.95, end: 4.05 },
    { start: 9.75, end: 10 },
  ],
);
assert.deepEqual(rangesToMerge, rangesSnapshot);

const baseSegments = [
  {
    id: "segment-a",
    start: 0,
    end: 5,
    clipId: "take-a",
    speed: "1",
    motion: "none",
  },
  {
    id: "segment-b",
    start: 5,
    end: 10,
    clipId: "take-b",
    speed: "1.25",
    motion: "zoom-in",
  },
];
const baseSegmentsSnapshot = structuredClone(baseSegments);
const badRanges = [
  { start: 1, end: 2, clipId: "take-a" },
  { start: 3, end: 4.7, clipId: "take-a" },
  { start: 6, end: 9, clipId: "take-b" },
];
const stableSegments = core.stableSegmentsFromRanges(
  baseSegments,
  badRanges,
  10,
  0.5,
);
assert.deepEqual(
  stableSegments.map(({ start, end, clipId }) => ({ start, end, clipId })),
  [
    { start: 0, end: 1, clipId: "take-a" },
    { start: 2, end: 3, clipId: "take-a" },
    { start: 5, end: 6, clipId: "take-b" },
    { start: 9, end: 10, clipId: "take-b" },
  ],
);
assert.equal(stableSegments[1].id, "segment-a-stable-2");
assert.equal(stableSegments[2].speed, "1.25");
assert.equal(stableSegments[2].motion, "zoom-in");
assert.deepEqual(baseSegments, baseSegmentsSnapshot);
assert.deepEqual(
  core.stableSegmentsFromRanges(baseSegments, badRanges, 10, 0.5),
  stableSegments,
);

const multiClip = core.normalizeSegments([
  { start: 0, end: 3, clipId: "take-a" },
  { start: 3, end: 8, clipId: "take-b" },
], 8);
const multiClipSplit = core.splitSegments(multiClip, 5, 8);
assert.equal(multiClipSplit.length, 3);
assert.equal(multiClipSplit[1].clipId, "take-b");
assert.equal(multiClipSplit[2].clipId, "take-b");

const samples = new Float32Array(4 * 1000);
for (let index = 1000; index < 2000; index += 1) samples[index] = 0.5;
const silence = core.detectSilence(samples, 1000, {
  thresholdDb: -38,
  minimumDuration: 0.5,
  padding: 0,
});
assert.equal(silence.length, 2);
assert.ok(silence[0].end >= 0.9 && silence[0].end <= 1.05);
assert.ok(silence[1].start >= 1.9 && silence[1].start <= 2.05);

const captions = core.parseSrt(`1
00:00:01,000 --> 00:00:03,500
Olá, mundo!

2
00:00:04.000 --> 00:00:06.000
Segunda legenda.`);
assert.equal(captions.length, 2);
assert.deepEqual(
  captions.map(({ start, end, text }) => ({ start, end, text })),
  [
    { start: 1, end: 3.5, text: "Olá, mundo!" },
    { start: 4, end: 6, text: "Segunda legenda." },
  ],
);

console.log("Todos os testes do núcleo do editor passaram.");
