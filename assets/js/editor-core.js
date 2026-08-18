(function (root, factory) {
  const api = factory();
  if (typeof module === "object" && module.exports) module.exports = api;
  if (root) root.SparkEditorCore = api;
})(typeof globalThis !== "undefined" ? globalThis : this, function () {
  "use strict";

  const clamp = (value, min, max) =>
    Math.min(max, Math.max(min, Number(value) || 0));

  const formatTime = (seconds, precise = false) => {
    const safe = Math.max(0, Number(seconds) || 0);
    const minutes = Math.floor(safe / 60);
    const wholeSeconds = Math.floor(safe % 60);
    const base = `${String(minutes).padStart(2, "0")}:${
      String(wholeSeconds).padStart(2, "0")
    }`;
    return precise ? `${base}.${Math.floor((safe % 1) * 10)}` : base;
  };

  const outputDimensions = (ratio, shortEdge) => {
    const safeRatio = clamp(ratio, 0.1, 10) || 16 / 9;
    const edge = Math.max(2, Math.round(Number(shortEdge) || 1080));
    let width = safeRatio <= 1 ? edge : Math.round(edge * safeRatio);
    let height = safeRatio <= 1 ? Math.round(edge / safeRatio) : edge;
    width -= width % 2;
    height -= height % 2;
    return { width: Math.max(2, width), height: Math.max(2, height) };
  };

  const segmentId = () =>
    `segment-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

  const normalizeSegments = (segments, duration) => {
    const limit = Math.max(0, Number(duration) || 0);
    return (Array.isArray(segments) ? segments : [])
      .map((segment) => ({
        ...segment,
        id: segment.id || segmentId(),
        start: clamp(segment.start, 0, limit),
        end: clamp(segment.end, 0, limit),
        speed: segment.speed || "1",
        motion: segment.motion || "none",
      }))
      .filter((segment) => segment.end - segment.start >= 0.04)
      .sort((a, b) => a.start - b.start)
      .reduce((result, segment) => {
        const previous = result[result.length - 1];
        if (previous && segment.start < previous.end) {
          segment.start = previous.end;
        }
        if (segment.end - segment.start >= 0.04) result.push(segment);
        return result;
      }, []);
  };

  const splitSegments = (segments, time, duration) => {
    const point = clamp(time, 0, duration);
    const result = [];
    normalizeSegments(segments, duration).forEach((segment) => {
      if (point > segment.start + 0.04 && point < segment.end - 0.04) {
        result.push({ ...segment, id: segmentId(), end: point });
        result.push({ ...segment, id: segmentId(), start: point });
      } else {
        result.push(segment);
      }
    });
    return result;
  };

  const subtractRanges = (segments, ranges, duration) => {
    let result = normalizeSegments(segments, duration);
    const exclusions = (Array.isArray(ranges) ? ranges : [])
      .map((range) => ({
        start: clamp(range.start, 0, duration),
        end: clamp(range.end, 0, duration),
      }))
      .filter((range) => range.end - range.start >= 0.04)
      .sort((a, b) => a.start - b.start);

    exclusions.forEach((range) => {
      const next = [];
      result.forEach((segment) => {
        if (range.end <= segment.start || range.start >= segment.end) {
          next.push(segment);
          return;
        }
        if (range.start > segment.start + 0.04) {
          next.push({ ...segment, id: segmentId(), end: range.start });
        }
        if (range.end < segment.end - 0.04) {
          next.push({ ...segment, id: segmentId(), start: range.end });
        }
      });
      result = next;
    });
    return normalizeSegments(result, duration);
  };

  const mergeRanges = (ranges, duration, options = {}) => {
    const limit = Number.isFinite(Number(duration))
      ? Math.max(0, Number(duration))
      : 0;
    if (!limit) return [];

    const settings = options && typeof options === "object" ? options : {};
    const gap = Number.isFinite(Number(settings.gap))
      ? Math.max(0, Number(settings.gap))
      : 0;
    const padding = Number.isFinite(Number(settings.padding))
      ? Math.max(0, Number(settings.padding))
      : 0;

    return (Array.isArray(ranges) ? ranges : [])
      .map((range) => {
        const rawStart = Number(range?.start);
        const rawEnd = Number(range?.end);
        if (
          !Number.isFinite(rawStart) || !Number.isFinite(rawEnd) ||
          rawEnd < rawStart
        ) {
          return null;
        }
        return {
          start: clamp(rawStart - padding, 0, limit),
          end: clamp(rawEnd + padding, 0, limit),
        };
      })
      .filter((range) => range && range.end > range.start)
      .sort((a, b) => a.start - b.start || a.end - b.end)
      .reduce((merged, range) => {
        const previous = merged[merged.length - 1];
        if (!previous || range.start > previous.end + gap) {
          merged.push({ ...range });
        } else {
          previous.end = Math.max(previous.end, range.end);
        }
        return merged;
      }, []);
  };

  const stableSegmentsFromRanges = (
    baseSegments,
    badRanges,
    duration,
    minSegmentDuration = 0.35,
  ) => {
    const limit = Number.isFinite(Number(duration))
      ? Math.max(0, Number(duration))
      : 0;
    const minimum = Number.isFinite(Number(minSegmentDuration))
      ? Math.max(0, Number(minSegmentDuration))
      : 0.35;
    if (!limit) return [];

    const exclusions = Array.isArray(badRanges) ? badRanges : [];
    return (Array.isArray(baseSegments) ? baseSegments : [])
      .map((segment, sourceIndex) => ({
        segment,
        sourceIndex,
        start: clamp(segment?.start, 0, limit),
        end: clamp(segment?.end, 0, limit),
      }))
      .filter(({ segment, start, end }) => segment && end > start)
      .sort((a, b) => a.start - b.start || a.sourceIndex - b.sourceIndex)
      .flatMap(({ segment, start, end }) => {
        const relevantRanges = mergeRanges(
          exclusions.filter((range) =>
            range?.clipId === undefined || range.clipId === null ||
            range.clipId === segment.clipId
          ),
          limit,
        ).filter((range) => range.end > start && range.start < end);

        const fragments = [];
        let cursor = start;
        relevantRanges.forEach((range) => {
          const cutStart = Math.max(start, range.start);
          const cutEnd = Math.min(end, range.end);
          if (cutStart > cursor) fragments.push([cursor, cutStart]);
          cursor = Math.max(cursor, cutEnd);
        });
        if (cursor < end) fragments.push([cursor, end]);

        return fragments
          .filter(([fragmentStart, fragmentEnd]) =>
            fragmentEnd - fragmentStart + Number.EPSILON >= minimum &&
            fragmentEnd > fragmentStart
          )
          .map(([fragmentStart, fragmentEnd], fragmentIndex) => {
            const fragment = {
              ...segment,
              start: fragmentStart,
              end: fragmentEnd,
            };
            if (fragmentIndex > 0 && segment.id) {
              fragment.id = `${segment.id}-stable-${fragmentIndex + 1}`;
            }
            return fragment;
          });
      });
  };

  const speedAt = (segment, progress) => {
    const value = String(segment?.speed || "1");
    const position = clamp(progress, 0, 1);
    if (value === "ramp-up") return 0.75 + position * 1.25;
    if (value === "ramp-down") return 2 - position * 1.25;
    return clamp(Number(value) || 1, 0.25, 4);
  };

  const segmentOutputDuration = (segment) => {
    const sourceDuration = Math.max(0, segment.end - segment.start);
    if (!String(segment.speed).startsWith("ramp")) {
      return sourceDuration / speedAt(segment, 0);
    }
    const steps = 80;
    let total = 0;
    for (let index = 0; index < steps; index += 1) {
      const progress = (index + 0.5) / steps;
      total += (sourceDuration / steps) / speedAt(segment, progress);
    }
    return total;
  };

  const outputDuration = (segments) =>
    (Array.isArray(segments) ? segments : []).reduce(
      (total, segment) => total + segmentOutputDuration(segment),
      0,
    );

  const findSegmentIndex = (segments, time) =>
    (Array.isArray(segments) ? segments : []).findIndex(
      (segment) => time >= segment.start - 0.015 && time < segment.end - 0.015,
    );

  const detectSilence = (samples, sampleRate, options = {}) => {
    if (!samples?.length || !sampleRate) return [];
    const thresholdDb = clamp(options.thresholdDb ?? -38, -80, -5);
    const minimumDuration = clamp(options.minimumDuration ?? 0.35, 0.08, 5);
    const padding = clamp(options.padding ?? 0.08, 0, 1);
    const windowDuration = 0.025;
    const windowSize = Math.max(1, Math.floor(sampleRate * windowDuration));
    const silentWindows = [];

    for (let offset = 0; offset < samples.length; offset += windowSize) {
      const end = Math.min(samples.length, offset + windowSize);
      let sum = 0;
      for (let index = offset; index < end; index += 1) {
        sum += samples[index] * samples[index];
      }
      const rms = Math.sqrt(sum / Math.max(1, end - offset));
      const db = 20 * Math.log10(Math.max(rms, 1e-8));
      silentWindows.push({
        start: offset / sampleRate,
        end: end / sampleRate,
        silent: db <= thresholdDb,
      });
    }

    const ranges = [];
    let start = null;
    silentWindows.forEach((window, index) => {
      if (window.silent && start === null) start = window.start;
      const closes = start !== null &&
        (!window.silent || index === silentWindows.length - 1);
      if (!closes) return;
      const rawEnd = window.silent ? window.end : window.start;
      if (rawEnd - start >= minimumDuration) {
        const paddedStart = start + padding;
        const paddedEnd = rawEnd - padding;
        if (paddedEnd - paddedStart >= 0.04) {
          ranges.push({ start: paddedStart, end: paddedEnd });
        }
      }
      start = null;
    });
    return ranges;
  };

  const parseSrtTime = (value) => {
    const match = String(value || "").trim().match(
      /(\d+):(\d{2}):(\d{2})[,.](\d{3})/,
    );
    if (!match) return null;
    return Number(match[1]) * 3600 + Number(match[2]) * 60 + Number(match[3]) +
      Number(match[4]) / 1000;
  };

  const parseSrt = (text) =>
    String(text || "")
      .replace(/\r/g, "")
      .trim()
      .split(/\n{2,}/)
      .map((block, index) => {
        const lines = block.split("\n");
        const timingIndex = lines.findIndex((line) => line.includes("-->"));
        if (timingIndex < 0) return null;
        const [rawStart, rawEnd] = lines[timingIndex].split("-->");
        const start = parseSrtTime(rawStart);
        const end = parseSrtTime(rawEnd);
        const captionText = lines.slice(timingIndex + 1).join(" ").replace(
          /<[^>]+>/g,
          "",
        ).trim();
        if (
          start === null || end === null || end <= start || !captionText
        ) return null;
        return {
          id: `caption-${Date.now()}-${index}`,
          start,
          end,
          text: captionText,
        };
      })
      .filter(Boolean);

  const downmixAndResample = (audioBuffer, targetRate = 16000) => {
    if (!audioBuffer?.length || !audioBuffer.sampleRate) {
      return new Float32Array();
    }
    const channels = audioBuffer.numberOfChannels;
    const sourceLength = audioBuffer.length;
    const ratio = audioBuffer.sampleRate / targetRate;
    const targetLength = Math.max(1, Math.floor(sourceLength / ratio));
    const result = new Float32Array(targetLength);
    const channelData = Array.from(
      { length: channels },
      (_, index) => audioBuffer.getChannelData(index),
    );

    for (let targetIndex = 0; targetIndex < targetLength; targetIndex += 1) {
      const sourceStart = Math.floor(targetIndex * ratio);
      const sourceEnd = Math.min(
        sourceLength,
        Math.max(sourceStart + 1, Math.floor((targetIndex + 1) * ratio)),
      );
      let sum = 0;
      let count = 0;
      for (
        let sourceIndex = sourceStart;
        sourceIndex < sourceEnd;
        sourceIndex += 1
      ) {
        for (let channel = 0; channel < channels; channel += 1) {
          sum += channelData[channel][sourceIndex];
        }
        count += channels;
      }
      result[targetIndex] = count ? sum / count : 0;
    }
    return result;
  };

  return {
    clamp,
    formatTime,
    outputDimensions,
    normalizeSegments,
    splitSegments,
    subtractRanges,
    mergeRanges,
    stableSegmentsFromRanges,
    speedAt,
    segmentOutputDuration,
    outputDuration,
    findSegmentIndex,
    detectSilence,
    parseSrt,
    downmixAndResample,
  };
});
