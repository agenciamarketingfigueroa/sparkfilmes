(function () {
  "use strict";

  const core = globalThis.SparkEditorCore;
  if (!core) return;

  const $ = (selector, scope = document) => scope.querySelector(selector);
  const $$ = (selector, scope = document) =>
    Array.from(scope.querySelectorAll(selector));
  const waitForEvent = (target, event) =>
    new Promise((resolve, reject) => {
      const onError = () => {
        cleanup();
        reject(new Error("Não foi possível preparar o vídeo."));
      };
      const onDone = () => {
        cleanup();
        resolve();
      };
      const cleanup = () => {
        target.removeEventListener(event, onDone);
        target.removeEventListener("error", onError);
      };
      target.addEventListener(event, onDone, { once: true });
      target.addEventListener("error", onError, { once: true });
    });

  const elements = {
    dropzone: $("#editor-dropzone"),
    workspace: $("#editor-workspace"),
    videoInput: $("#video-input"),
    chooseVideo: $("#choose-video"),
    addVideos: $("#add-videos"),
    replaceVideo: $("#replace-video"),
    resetProject: $("#reset-project"),
    projectName: $("#project-name"),
    projectMeta: $("#project-meta"),
    video: $("#source-video"),
    voiceover: $("#voiceover-audio"),
    canvas: $("#preview-canvas"),
    stageEmpty: $("#stage-empty"),
    togglePlay: $("#toggle-play"),
    currentTime: $("#current-time"),
    totalTime: $("#total-time"),
    status: $("#editor-status"),
    timeline: $("#timeline-ruler"),
    timelineSegments: $("#timeline-segments"),
    silenceMarkers: $("#silence-markers"),
    captionMarkers: $("#caption-markers"),
    playhead: $("#timeline-playhead"),
    segmentList: $("#segment-list"),
    keptDuration: $("#kept-duration"),
    removedDuration: $("#removed-duration"),
    segmentCount: $("#segment-count"),
    speed: $("#segment-speed"),
    motion: $("#segment-motion"),
    selectionHint: $("#selection-hint"),
    projectType: $("#project-type"),
    projectNiche: $("#project-niche"),
    applyRecipe: $("#apply-recipe"),
    flowAddVideos: $("#flow-add-videos"),
    flowTakesSummary: $("#flow-takes-summary"),
    transitionStyle: $("#transition-style"),
    captionMode: $("#caption-mode"),
    captionPreset: $("#caption-preset"),
    captionsEnabled: $("#captions-enabled"),
    soundtrackMode: $("#soundtrack-mode"),
    soundtrackConfig: $("#soundtrack-config"),
    musicPrompt: $("#music-prompt"),
    musicLibrary: $("#music-library"),
    createMusic: $("#create-music"),
    musicInput: $("#music-input"),
    music: $("#music-audio"),
    fitMode: $("#fit-mode"),
    brightness: $("#brightness"),
    contrast: $("#contrast"),
    saturation: $("#saturation"),
    warmth: $("#warmth"),
    cleanVoice: $("#clean-voice"),
    volume: $("#volume"),
    voiceScript: $("#voice-script"),
    suggestVoiceScript: $("#suggest-voice-script"),
    generateVoice: $("#generate-voice"),
    voiceResult: $("#voice-result"),
    voiceSummary: $("#voice-summary"),
    previewVoice: $("#preview-voice"),
    removeVoice: $("#remove-voice"),
    voiceVolume: $("#voice-volume"),
    duckOriginal: $("#duck-original"),
    silenceThreshold: $("#silence-threshold"),
    silenceDuration: $("#silence-duration"),
    detectSilence: $("#detect-silence"),
    silenceResult: $("#silence-result"),
    silenceSummary: $("#silence-summary"),
    applySilence: $("#apply-silence"),
    autoCaptions: $("#auto-captions"),
    addCaption: $("#add-caption"),
    importSrt: $("#import-srt"),
    srtInput: $("#srt-input"),
    captionList: $("#caption-list"),
    captionSize: $("#caption-size"),
    captionPosition: $("#caption-position"),
    exportButton: $("#export-video"),
    exportQuality: $("#export-quality"),
    exportSupport: $("#export-support"),
    exportProgress: $("#export-progress"),
    exportProgressBar: $("#export-progress-bar"),
    exportProgressText: $("#export-progress-text"),
  };

  const ctx = elements.canvas?.getContext("2d", { alpha: false });
  const state = {
    file: null,
    files: [],
    clips: [],
    activeClipId: "",
    objectUrl: "",
    duration: 0,
    segments: [],
    selectedSegmentId: "",
    silenceRanges: [],
    captions: [],
    audioBuffer: null,
    audioSamples: null,
    audio: null,
    format: "9:16",
    fit: "contain",
    brightness: 0,
    contrast: 0,
    saturation: 0,
    warmth: 0,
    volume: 1,
    cleanVoice: true,
    projectType: "aftermovie",
    niche: "",
    transitionStyle: "auto",
    captionsEnabled: false,
    soundtrackMode: "none",
    musicUrl: "",
    musicVolume: 0.32,
    voiceoverUrl: "",
    voiceoverDuration: 0,
    voiceVolume: 1,
    duckOriginal: true,
    synthesizer: null,
    transformers: null,
    transitioning: false,
    captionStyle: "spark",
    captionSize: 8,
    captionPosition: 78,
    exporting: false,
    exportCancelled: false,
    recorder: null,
    chunks: [],
    mimeType: "",
    transcriber: null,
    renderFrameId: 0,
  };

  const formatBytes = (bytes) => {
    if (!Number.isFinite(bytes) || bytes <= 0) return "0 MB";
    if (bytes < 1024 ** 2) return `${Math.round(bytes / 1024)} KB`;
    return `${
      (bytes / 1024 ** 2).toFixed(bytes >= 100 * 1024 ** 2 ? 0 : 1)
    } MB`;
  };

  const setStatus = (message = "", type = "") => {
    elements.status.textContent = message;
    elements.status.className = `editor-status${type ? ` is-${type}` : ""}`;
  };

  const setBusy = (button, busy, label) => {
    if (!button) return;
    if (busy) {
      button.dataset.originalLabel = button.innerHTML;
      button.disabled = true;
      if (label) button.innerHTML = label;
    } else {
      button.disabled = false;
      if (button.dataset.originalLabel) {
        button.innerHTML = button.dataset.originalLabel;
      }
      delete button.dataset.originalLabel;
    }
  };

  const selectedSegment = () =>
    state.segments.find((segment) => segment.id === state.selectedSegmentId) ||
    state.segments[0] || null;

  const activeClip = () =>
    state.clips.find((clip) => clip.id === state.activeClipId) ||
    state.clips[0] || null;

  const globalTime = () => {
    const clip = activeClip();
    return clip ? clip.offset + (Number(elements.video.currentTime) || 0) : 0;
  };

  const clipAtGlobalTime = (time) => {
    const safe = core.clamp(time, 0, state.duration);
    return state.clips.find((clip, index) =>
      safe >= clip.offset - 0.01 &&
      (safe < clip.offset + clip.duration - 0.01 ||
        index === state.clips.length - 1)
    ) || state.clips[state.clips.length - 1] || null;
  };

  const outputTimeAt = (time) => {
    let elapsed = 0;
    for (const segment of state.segments) {
      if (time >= segment.end) {
        elapsed += core.segmentOutputDuration(segment);
        continue;
      }
      if (time >= segment.start) {
        const progress = core.clamp(
          (time - segment.start) / Math.max(0.01, segment.end - segment.start),
          0,
          1,
        );
        elapsed += core.segmentOutputDuration(segment) * progress;
      }
      break;
    }
    return elapsed;
  };

  const syncVoiceover = (time = globalTime(), force = false) => {
    if (!state.voiceoverUrl || !Number.isFinite(elements.voiceover.duration)) {
      return;
    }
    const target = core.clamp(
      outputTimeAt(time),
      0,
      elements.voiceover.duration || 0,
    );
    if (force || Math.abs(elements.voiceover.currentTime - target) > 0.3) {
      elements.voiceover.currentTime = target;
    }
  };

  const syncMusic = (time = globalTime(), force = false) => {
    if (
      !state.musicUrl || !Number.isFinite(elements.music.duration) ||
      !elements.music.duration
    ) {
      return;
    }
    const target = outputTimeAt(time) % elements.music.duration;
    if (force || Math.abs(elements.music.currentTime - target) > 0.35) {
      elements.music.currentTime = target;
    }
  };

  const selectSegment = (id, seek = false) => {
    const segment = state.segments.find((item) => item.id === id);
    if (!segment) return;
    state.selectedSegmentId = segment.id;
    elements.speed.value = segment.speed;
    elements.motion.value = segment.motion;
    const index = state.segments.indexOf(segment);
    elements.selectionHint.textContent = `Trecho ${index + 1} selecionado · ${
      core.formatTime(segment.start, true)
    } até ${core.formatTime(segment.end, true)}`;
    if (seek) seekTo(segment.start);
    renderTimeline();
  };

  const selectSegmentAtTime = (time) => {
    const index = core.findSegmentIndex(state.segments, time);
    if (index >= 0 && state.segments[index].id !== state.selectedSegmentId) {
      selectSegment(state.segments[index].id);
    }
  };

  const updateCanvasSize = (forExport = false) => {
    const ratio = state.format === "9:16"
      ? 9 / 16
      : state.format === "1:1"
      ? 1
      : state.format === "16:9"
      ? 16 / 9
      : (elements.video.videoWidth || 16) / (elements.video.videoHeight || 9);
    const targetEdge = forExport ? Number(elements.exportQuality.value) : 720;
    let width;
    let height;
    if (forExport) {
      ({ width, height } = core.outputDimensions(ratio, targetEdge));
    } else if (ratio <= 1) {
      height = targetEdge;
      width = Math.round(height * ratio);
    } else {
      width = targetEdge;
      height = Math.round(width / ratio);
    }
    width -= width % 2;
    height -= height % 2;
    elements.canvas.width = Math.max(2, width);
    elements.canvas.height = Math.max(2, height);
    drawPreview();
  };

  const motionScale = (segment, time) => {
    if (!segment || segment.motion === "none") return 1;
    const progress = core.clamp(
      (time - segment.start) / Math.max(0.01, segment.end - segment.start),
      0,
      1,
    );
    if (segment.motion === "zoom-in") return 1 + 0.13 * progress;
    if (segment.motion === "zoom-out") return 1.13 - 0.13 * progress;
    if (segment.motion === "punch") {
      return progress < 0.08 ? 1 + (progress / 0.08) * 0.16 : 1.16;
    }
    return 1;
  };

  const wrapText = (context, text, maxWidth) => {
    const words = String(text || "").trim().split(/\s+/).filter(Boolean);
    const lines = [];
    let line = "";
    words.forEach((word) => {
      const candidate = line ? `${line} ${word}` : word;
      if (line && context.measureText(candidate).width > maxWidth) {
        lines.push(line);
        line = word;
      } else {
        line = candidate;
      }
    });
    if (line) lines.push(line);
    return lines.slice(0, 3);
  };

  const roundedRect = (context, x, y, width, height, radius) => {
    const r = Math.min(radius, width / 2, height / 2);
    context.beginPath();
    if (typeof context.roundRect === "function") {
      context.roundRect(x, y, width, height, r);
      return;
    }
    context.moveTo(x + r, y);
    context.arcTo(x + width, y, x + width, y + height, r);
    context.arcTo(x + width, y + height, x, y + height, r);
    context.arcTo(x, y + height, x, y, r);
    context.arcTo(x, y, x + width, y, r);
    context.closePath();
  };

  const drawCaption = (time) => {
    if (!state.captionsEnabled) return;
    const caption = state.captions.find((item) =>
      time >= item.start && time <= item.end
    );
    if (!caption?.text) return;
    const width = elements.canvas.width;
    const height = elements.canvas.height;
    const size = Math.max(18, Math.round(width * (state.captionSize / 100)));
    const lineHeight = size * 1.18;
    const style = state.captionStyle;
    const weight = style === "clean" ? 700 : 900;
    ctx.save();
    ctx.font = `${weight} ${size}px Manrope, sans-serif`;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    const text = style === "clean"
      ? caption.text
      : caption.text.toLocaleUpperCase("pt-BR");
    const lines = wrapText(ctx, text, width * 0.82);
    const centerY = height * (state.captionPosition / 100);
    const top = centerY - ((lines.length - 1) * lineHeight) / 2;

    lines.forEach((line, index) => {
      const y = top + index * lineHeight;
      const measured = ctx.measureText(line).width;
      if (style === "spark") {
        ctx.fillStyle = "rgba(239, 40, 82, 0.94)";
        roundedRect(
          ctx,
          (width - measured) / 2 - size * 0.3,
          y - lineHeight * 0.46,
          measured + size * 0.6,
          lineHeight * 0.92,
          size * 0.12,
        );
        ctx.fill();
        ctx.fillStyle = "white";
        ctx.shadowColor = "transparent";
      } else if (style === "impact") {
        ctx.fillStyle = "#ffe23d";
        ctx.strokeStyle = "rgba(0, 0, 0, 0.9)";
        ctx.lineWidth = Math.max(3, size * 0.11);
        ctx.lineJoin = "round";
        ctx.strokeText(line, width / 2, y);
      } else {
        ctx.fillStyle = "white";
        ctx.shadowColor = "rgba(0, 0, 0, 0.9)";
        ctx.shadowBlur = size * 0.22;
        ctx.shadowOffsetY = size * 0.08;
      }
      ctx.fillText(line, width / 2, y);
    });
    ctx.restore();
  };

  const drawTransition = (segment, time) => {
    if (!segment || state.transitionStyle === "clean") return;
    const index = state.segments.indexOf(segment);
    if (index <= 0) return;
    const elapsed = time - segment.start;
    const duration = state.transitionStyle === "dynamic" ? 0.22 : 0.38;
    if (elapsed < 0 || elapsed > duration) return;
    const progress = core.clamp(elapsed / duration, 0, 1);
    ctx.save();
    if (state.transitionStyle === "dynamic") {
      ctx.globalAlpha = Math.sin(progress * Math.PI) * 0.18;
      ctx.fillStyle = "white";
    } else {
      ctx.globalAlpha = (1 - progress) * 0.55;
      ctx.fillStyle = "#09090c";
    }
    ctx.fillRect(0, 0, elements.canvas.width, elements.canvas.height);
    ctx.restore();
  };

  const drawPreview = () => {
    if (!ctx || !state.file || elements.video.readyState < 2) return;
    const canvasWidth = elements.canvas.width;
    const canvasHeight = elements.canvas.height;
    const videoWidth = elements.video.videoWidth;
    const videoHeight = elements.video.videoHeight;
    if (!videoWidth || !videoHeight) return;
    ctx.save();
    ctx.fillStyle = "#09090c";
    ctx.fillRect(0, 0, canvasWidth, canvasHeight);
    const time = globalTime();
    const index = core.findSegmentIndex(state.segments, time);
    const segment = index >= 0 ? state.segments[index] : selectedSegment();
    const zoom = motionScale(segment, time);
    const scale =
      (state.fit === "cover"
        ? Math.max(canvasWidth / videoWidth, canvasHeight / videoHeight)
        : Math.min(canvasWidth / videoWidth, canvasHeight / videoHeight)) *
      zoom;
    const drawWidth = videoWidth * scale;
    const drawHeight = videoHeight * scale;
    const x = (canvasWidth - drawWidth) / 2;
    const y = (canvasHeight - drawHeight) / 2;
    ctx.filter = `brightness(${100 + state.brightness}%) contrast(${
      100 + state.contrast
    }%) saturate(${100 + state.saturation}%)`;
    ctx.drawImage(elements.video, x, y, drawWidth, drawHeight);
    ctx.filter = "none";
    if (state.warmth !== 0) {
      ctx.globalCompositeOperation = "soft-light";
      ctx.globalAlpha = Math.min(0.34, Math.abs(state.warmth) / 120);
      ctx.fillStyle = state.warmth > 0 ? "#ff7a28" : "#2a71ff";
      ctx.fillRect(0, 0, canvasWidth, canvasHeight);
      ctx.globalAlpha = 1;
      ctx.globalCompositeOperation = "source-over";
    }
    ctx.restore();
    drawTransition(segment, time);
    drawCaption(time);
  };

  const updateTransport = () => {
    const time = globalTime();
    elements.currentTime.textContent = core.formatTime(time, true);
    elements.totalTime.textContent = core.formatTime(state.duration, true);
    const percent = state.duration ? (time / state.duration) * 100 : 0;
    elements.playhead.style.left = `${core.clamp(percent, 0, 100)}%`;
    elements.timeline.setAttribute(
      "aria-valuenow",
      String(Math.round(percent)),
    );
    if (!elements.video.paused) selectSegmentAtTime(time);
  };

  const exportProgressAt = (segmentIndex, time) => {
    const before = state.segments.slice(0, segmentIndex).reduce(
      (sum, segment) => sum + core.segmentOutputDuration(segment),
      0,
    );
    const segment = state.segments[segmentIndex];
    if (!segment) return 0;
    const progress = core.clamp(
      (time - segment.start) / Math.max(0.01, segment.end - segment.start),
      0,
      1,
    );
    const elapsed = before + core.segmentOutputDuration(segment) * progress;
    return elapsed / Math.max(0.01, core.outputDuration(state.segments));
  };

  const activateGlobalTime = async (time, autoplay = false) => {
    if (!state.clips.length) return;
    const targetTime = core.clamp(time, 0, state.duration);
    const clip = clipAtGlobalTime(targetTime);
    if (!clip || state.transitioning) return;
    state.transitioning = true;
    let pausedRecorderForTransition = false;
    try {
      const localTime = core.clamp(
        targetTime - clip.offset,
        0,
        clip.duration,
      );
      if (clip.id !== state.activeClipId || elements.video.src !== clip.url) {
        if (state.exporting && state.recorder?.state === "recording") {
          state.recorder.pause();
          pausedRecorderForTransition = true;
          if (state.recorder.state !== "paused") {
            await waitForEvent(state.recorder, "pause");
          }
        }
        elements.video.pause();
        elements.video.src = clip.url;
        elements.video.load();
        state.activeClipId = clip.id;
        if (elements.video.readyState < 1) {
          await waitForEvent(elements.video, "loadedmetadata");
        }
      }
      if (Math.abs(elements.video.currentTime - localTime) > 0.015) {
        elements.video.currentTime = localTime;
        if (elements.video.seeking) {
          await waitForEvent(elements.video, "seeked");
        }
      }
      syncVoiceover(targetTime, true);
      syncMusic(targetTime, true);
      drawPreview();
      updateTransport();
      if (autoplay) {
        await elements.video.play();
        if (
          state.voiceoverUrl &&
          elements.voiceover.currentTime < elements.voiceover.duration
        ) {
          elements.voiceover.play().catch(() => {});
        }
        if (state.musicUrl) elements.music.play().catch(() => {});
        if (pausedRecorderForTransition && state.recorder?.state === "paused") {
          state.recorder.resume();
        }
      }
    } finally {
      state.transitioning = false;
    }
  };

  const finishExportPlayback = () => {
    elements.video.pause();
    elements.voiceover.pause();
    elements.music.pause();
    if (state.recorder?.state === "recording") state.recorder.stop();
  };

  const maintainPlayback = () => {
    if (
      elements.video.paused || !state.segments.length || state.transitioning
    ) {
      return;
    }
    const time = globalTime();
    let index = core.findSegmentIndex(state.segments, time);
    if (index < 0) {
      index = state.segments.findIndex((segment) => segment.start > time);
      if (index < 0) {
        if (state.exporting) finishExportPlayback();
        else elements.video.pause();
        return;
      }
      activateGlobalTime(state.segments[index].start, true);
      return;
    }
    const segment = state.segments[index];
    const progress = core.clamp(
      (time - segment.start) /
        Math.max(0.01, segment.end - segment.start),
      0,
      1,
    );
    elements.video.playbackRate = core.speedAt(segment, progress);
    if (time >= segment.end - 0.035) {
      const next = state.segments[index + 1];
      if (next) {
        activateGlobalTime(next.start, true);
        selectSegment(next.id);
      } else if (state.exporting) {
        finishExportPlayback();
      } else {
        elements.video.pause();
        elements.voiceover.pause();
        activateGlobalTime(state.segments[0].start);
      }
    }
    syncVoiceover(time);
    syncMusic(time);
    if (state.exporting) {
      const progressValue = exportProgressAt(index, time);
      elements.exportProgressBar.style.width = `${
        Math.round(progressValue * 100)
      }%`;
      elements.exportProgressText.textContent = `Renderizando… ${
        Math.round(progressValue * 100)
      }%`;
    }
  };

  const renderLoop = () => {
    maintainPlayback();
    if (!elements.video.paused || state.exporting) {
      drawPreview();
      updateTransport();
    }
    state.renderFrameId = requestAnimationFrame(renderLoop);
  };

  const renderTimeline = () => {
    if (!state.duration) return;
    elements.timelineSegments.innerHTML = "";
    elements.segmentList.innerHTML = "";
    state.segments.forEach((segment, index) => {
      const left = (segment.start / state.duration) * 100;
      const width = ((segment.end - segment.start) / state.duration) * 100;
      const block = document.createElement("button");
      block.type = "button";
      block.className = `timeline-segment${
        segment.id === state.selectedSegmentId ? " is-selected" : ""
      }`;
      block.style.left = `${left}%`;
      block.style.width = `${width}%`;
      block.title = `Trecho ${index + 1}: ${
        core.formatTime(segment.start, true)
      } – ${core.formatTime(segment.end, true)}`;
      block.innerHTML = `<span>${index + 1}</span>`;
      block.addEventListener("click", (event) => {
        event.stopPropagation();
        selectSegment(segment.id, true);
      });
      elements.timelineSegments.appendChild(block);

      const chip = document.createElement("button");
      chip.type = "button";
      chip.className = `segment-chip${
        segment.id === state.selectedSegmentId ? " is-selected" : ""
      }`;
      const clip = state.clips.find((item) => item.id === segment.clipId);
      chip.innerHTML = `<strong>Trecho ${index + 1} · ${
        escapeHtml(clip?.name || "take")
      }</strong><small>${core.formatTime(segment.start, true)} — ${
        core.formatTime(segment.end, true)
      }</small>`;
      chip.addEventListener("click", () => selectSegment(segment.id, true));
      elements.segmentList.appendChild(chip);
    });

    elements.silenceMarkers.innerHTML = "";
    state.silenceRanges.forEach((range) => {
      const marker = document.createElement("span");
      marker.className = "silence-marker";
      marker.style.left = `${(range.start / state.duration) * 100}%`;
      marker.style.width = `${
        ((range.end - range.start) / state.duration) * 100
      }%`;
      elements.silenceMarkers.appendChild(marker);
    });
    renderCaptionMarkers();
    const kept = core.outputDuration(state.segments);
    elements.keptDuration.textContent = core.formatTime(kept);
    elements.removedDuration.textContent = core.formatTime(
      Math.max(
        0,
        state.duration -
          state.segments.reduce((sum, item) => sum + item.end - item.start, 0),
      ),
    );
    elements.segmentCount.textContent = String(state.segments.length);
    elements.segmentCount.parentElement.lastChild.textContent =
      state.segments.length === 1 ? " trecho" : " trechos";
  };

  const renderCaptionMarkers = () => {
    elements.captionMarkers.innerHTML = "";
    if (!state.duration) return;
    state.captions.forEach((caption) => {
      const marker = document.createElement("span");
      marker.className = "caption-marker";
      marker.style.left = `${(caption.start / state.duration) * 100}%`;
      marker.style.width = `${
        ((caption.end - caption.start) / state.duration) * 100
      }%`;
      elements.captionMarkers.appendChild(marker);
    });
  };

  const seekTo = (time) => {
    if (!state.file) return;
    const target = core.clamp(time, 0, state.duration);
    elements.video.pause();
    elements.voiceover.pause();
    elements.music.pause();
    selectSegmentAtTime(target);
    activateGlobalTime(target);
  };

  const setupAudioGraph = async () => {
    if (state.audio) {
      if (state.audio.context.state === "suspended") {
        await state.audio.context.resume();
      }
      return state.audio;
    }
    const AudioContextClass = globalThis.AudioContext ||
      globalThis.webkitAudioContext;
    if (!AudioContextClass) {
      throw new Error("O navegador não oferece processamento de áudio local.");
    }
    const context = new AudioContextClass();
    const source = context.createMediaElementSource(elements.video);
    const highpass = context.createBiquadFilter();
    highpass.type = "highpass";
    const lowpass = context.createBiquadFilter();
    lowpass.type = "lowpass";
    const compressor = context.createDynamicsCompressor();
    const gain = context.createGain();
    const voiceSource = context.createMediaElementSource(elements.voiceover);
    const voiceGain = context.createGain();
    const musicSource = context.createMediaElementSource(elements.music);
    const musicGain = context.createGain();
    const monitor = context.createGain();
    const destination = context.createMediaStreamDestination();
    source.connect(highpass).connect(lowpass).connect(compressor).connect(gain);
    gain.connect(monitor).connect(context.destination);
    gain.connect(destination);
    voiceSource.connect(voiceGain);
    voiceGain.connect(monitor);
    voiceGain.connect(destination);
    musicSource.connect(musicGain);
    musicGain.connect(monitor);
    musicGain.connect(destination);
    state.audio = {
      context,
      source,
      highpass,
      lowpass,
      compressor,
      gain,
      voiceSource,
      voiceGain,
      musicSource,
      musicGain,
      monitor,
      destination,
    };
    updateAudioGraph();
    return state.audio;
  };

  const updateAudioGraph = () => {
    if (!state.audio) return;
    const {
      context,
      highpass,
      lowpass,
      compressor,
      gain,
      voiceGain,
      musicGain,
    } = state.audio;
    const now = context.currentTime;
    highpass.frequency.setTargetAtTime(state.cleanVoice ? 75 : 20, now, 0.02);
    lowpass.frequency.setTargetAtTime(
      state.cleanVoice ? 14500 : Math.min(22000, context.sampleRate / 2 - 10),
      now,
      0.02,
    );
    compressor.threshold.setTargetAtTime(state.cleanVoice ? -22 : 0, now, 0.02);
    compressor.knee.setTargetAtTime(state.cleanVoice ? 18 : 0, now, 0.02);
    compressor.ratio.setTargetAtTime(state.cleanVoice ? 3 : 1, now, 0.02);
    compressor.attack.setTargetAtTime(0.012, now, 0.02);
    compressor.release.setTargetAtTime(0.22, now, 0.02);
    const originalVolume = state.voiceoverUrl && state.duckOriginal
      ? state.volume * 0.25
      : state.volume;
    gain.gain.setTargetAtTime(originalVolume, now, 0.02);
    voiceGain.gain.setTargetAtTime(state.voiceVolume, now, 0.02);
    musicGain.gain.setTargetAtTime(
      state.musicUrl ? state.musicVolume : 0,
      now,
      0.02,
    );
  };

  const play = async () => {
    if (!state.segments.length) return;
    await setupAudioGraph();
    const time = globalTime();
    let index = core.findSegmentIndex(state.segments, time);
    if (index < 0) {
      index = state.segments.findIndex((segment) => segment.start > time);
      await activateGlobalTime(
        state.segments[Math.max(0, index)]?.start || 0,
      );
    }
    await elements.video.play();
    syncVoiceover(globalTime(), true);
    syncMusic(globalTime(), true);
    if (
      state.voiceoverUrl &&
      elements.voiceover.currentTime < elements.voiceover.duration
    ) {
      elements.voiceover.play().catch(() => {});
    }
    if (state.musicUrl) elements.music.play().catch(() => {});
  };

  const togglePlay = async () => {
    try {
      if (elements.video.paused) await play();
      else {
        elements.video.pause();
        elements.voiceover.pause();
        elements.music.pause();
      }
    } catch (error) {
      setStatus(
        error.message || "Não foi possível reproduzir o vídeo.",
        "error",
      );
    }
  };

  const resetEditing = () => {
    if (!state.duration) return;
    elements.video.pause();
    elements.music.pause();
    state.segments = core.normalizeSegments(
      state.clips.map((clip) => ({
        start: clip.offset,
        end: clip.offset + clip.duration,
        clipId: clip.id,
        speed: "1",
        motion: "none",
      })),
      state.duration,
    );
    state.selectedSegmentId = state.segments[0].id;
    state.silenceRanges = [];
    state.captions = [];
    state.captionsEnabled = state.projectType === "content";
    elements.captionsEnabled.checked = state.captionsEnabled;
    elements.captionMode.value = state.captionsEnabled ? "auto" : "none";
    elements.captionPreset.disabled = !state.captionsEnabled;
    elements.autoCaptions.disabled = !state.captionsEnabled;
    if (state.voiceoverUrl) removeVoiceover();
    state.brightness = 0;
    state.contrast = 0;
    state.saturation = 0;
    state.warmth = 0;
    state.volume = 1;
    state.cleanVoice = true;
    [
      elements.brightness,
      elements.contrast,
      elements.saturation,
      elements.warmth,
    ].forEach((input) => {
      input.value = 0;
    });
    elements.volume.value = 100;
    elements.cleanVoice.checked = true;
    updateOutputs();
    updateAudioGraph();
    elements.silenceResult.hidden = true;
    seekTo(0);
    selectSegment(state.selectedSegmentId);
    renderCaptions();
    setStatus("Edição restaurada.", "success");
  };

  const looksLikeVideo = (file) =>
    file && (
      String(file.type).startsWith("video/") ||
      /\.(mp4|mov|m4v|webm|ogv|avi)$/i.test(file.name)
    );

  const probeVideo = async (file) => {
    const url = URL.createObjectURL(file);
    const video = document.createElement("video");
    video.preload = "metadata";
    video.src = url;
    video.load();
    try {
      if (video.readyState < 1) await waitForEvent(video, "loadedmetadata");
      if (!Number.isFinite(video.duration) || video.duration <= 0) {
        throw new Error(`Não foi possível ler “${file.name}”.`);
      }
      return {
        id: globalThis.crypto?.randomUUID?.() ||
          `clip-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
        file,
        url,
        name: file.name,
        duration: video.duration,
        width: video.videoWidth,
        height: video.videoHeight,
        offset: 0,
      };
    } catch (error) {
      URL.revokeObjectURL(url);
      throw error;
    } finally {
      video.removeAttribute("src");
      video.load();
    }
  };

  const loadVideos = async (files, append = false) => {
    const validFiles = (Array.isArray(files) ? files : []).filter(
      looksLikeVideo,
    );
    if (!validFiles.length) {
      setStatus("Escolha pelo menos um arquivo de vídeo válido.", "error");
      return;
    }
    if (state.exporting) return;
    elements.video.pause();
    elements.voiceover.pause();
    elements.music.pause();
    state.audioBuffer = null;
    state.audioSamples = null;
    setStatus(
      `Preparando ${validFiles.length} ${
        validFiles.length === 1 ? "take" : "takes"
      }…`,
    );
    try {
      const incoming = [];
      for (const file of validFiles) incoming.push(await probeVideo(file));
      if (!append) {
        state.clips.forEach((clip) => URL.revokeObjectURL(clip.url));
        state.clips = incoming;
        state.captions = [];
        state.silenceRanges = [];
        state.activeClipId = "";
        if (state.voiceoverUrl) removeVoiceover();
        if (state.musicUrl) clearMusic();
      } else {
        state.clips.push(...incoming);
      }
      let offset = 0;
      state.clips.forEach((clip) => {
        clip.offset = offset;
        offset += clip.duration;
      });
      state.duration = offset;
      state.files = state.clips.map((clip) => clip.file);
      state.file = state.files[0];
      state.objectUrl = state.clips[0].url;
      if (!append) {
        state.segments = core.normalizeSegments(
          state.clips.map((clip) => ({
            start: clip.offset,
            end: clip.offset + clip.duration,
            clipId: clip.id,
            speed: "1",
            motion: "none",
          })),
          state.duration,
        );
      } else {
        state.segments = core.normalizeSegments([
          ...state.segments,
          ...incoming.map((clip) => ({
            start: clip.offset,
            end: clip.offset + clip.duration,
            clipId: clip.id,
            speed: "1",
            motion: "none",
          })),
        ], state.duration);
      }
      state.selectedSegmentId = append
        ? state.segments[state.segments.length - incoming.length]?.id ||
          state.segments[0].id
        : state.segments[0].id;
      const totalBytes = state.files.reduce((sum, file) => sum + file.size, 0);
      elements.projectName.textContent = state.clips.length === 1
        ? state.clips[0].name
        : `${state.clips.length} takes no projeto`;
      elements.projectMeta.textContent = `${formatBytes(totalBytes)} · ${
        core.formatTime(state.duration)
      } · montagem com ${state.clips.length} ${
        state.clips.length === 1 ? "take" : "takes"
      }`;
      elements.flowTakesSummary.textContent = `${state.clips.length} ${
        state.clips.length === 1 ? "take" : "takes"
      } · ${core.formatTime(state.duration)} no total`;
      elements.dropzone.hidden = true;
      elements.workspace.hidden = false;
      elements.stageEmpty.hidden = true;
      await activateGlobalTime(append ? selectedSegment().start : 0);
      updateCanvasSize();
      selectSegment(state.selectedSegmentId);
      renderTimeline();
      renderCaptions();
      const warning = state.duration > 900
        ? "Takes carregados. O projeto soma mais de 15 minutos e pode exigir bastante memória."
        : `${incoming.length} ${
          incoming.length === 1 ? "take carregado" : "takes carregados"
        }. A primeira montagem respeita a ordem de seleção.`;
      setStatus(warning, state.duration > 900 ? "" : "success");
    } catch (error) {
      if (!state.clips.length) {
        state.file = null;
        elements.dropzone.hidden = false;
        elements.workspace.hidden = true;
      }
      setStatus(
        error.message ||
          "Um dos takes usa um formato não suportado pelo navegador.",
        "error",
      );
    } finally {
      elements.videoInput.value = "";
    }
  };

  const getAudioSamples = async () => {
    if (state.audioSamples) return state.audioSamples;
    if (!state.file) throw new Error("Selecione um vídeo primeiro.");
    setStatus("Decodificando o áudio no dispositivo…");
    const AudioContextClass = globalThis.AudioContext ||
      globalThis.webkitAudioContext;
    if (!AudioContextClass) {
      throw new Error(
        "O navegador não permite analisar o áudio deste arquivo.",
      );
    }
    const temporaryContext = new AudioContextClass();
    try {
      const decoded = [];
      for (const clip of state.clips) {
        const data = await clip.file.arrayBuffer();
        const audioBuffer = await temporaryContext.decodeAudioData(
          data.slice(0),
        );
        decoded.push(core.downmixAndResample(audioBuffer, 16000));
      }
      const totalLength = decoded.reduce(
        (sum, samples) => sum + samples.length,
        0,
      );
      state.audioSamples = new Float32Array(totalLength);
      let writeOffset = 0;
      decoded.forEach((samples) => {
        state.audioSamples.set(samples, writeOffset);
        writeOffset += samples.length;
      });
      return state.audioSamples;
    } catch {
      throw new Error(
        "Não foi possível decodificar o áudio. Tente converter o arquivo para MP4/H.264 com áudio AAC.",
      );
    } finally {
      temporaryContext.close().catch(() => {});
    }
  };

  const detectSilences = async () => {
    setBusy(
      elements.detectSilence,
      true,
      '<span class="quick-action-icon">…</span><span><strong>Analisando áudio</strong><small>Isso acontece no dispositivo</small></span>',
    );
    try {
      const samples = await getAudioSamples();
      state.silenceRanges = core.detectSilence(samples, 16000, {
        thresholdDb: Number(elements.silenceThreshold.value),
        minimumDuration: Number(elements.silenceDuration.value),
        padding: 0.08,
      }).filter((range) =>
        range.start > 0.04 && range.end < state.duration - 0.04
      );
      const total = state.silenceRanges.reduce(
        (sum, range) => sum + range.end - range.start,
        0,
      );
      elements.silenceResult.hidden = false;
      elements.silenceSummary.textContent = state.silenceRanges.length
        ? `${state.silenceRanges.length} ${
          state.silenceRanges.length === 1
            ? "pausa encontrada"
            : "pausas encontradas"
        } · ${core.formatTime(total, true)} sugeridos para corte`
        : "Nenhuma pausa encontrada com estes ajustes.";
      elements.applySilence.disabled = state.silenceRanges.length === 0;
      renderTimeline();
      setStatus(
        state.silenceRanges.length
          ? "Sugestões marcadas em amarelo. Revise e clique em “Aplicar cortes”."
          : "Tente aumentar a sensibilidade ou reduzir a pausa mínima.",
        state.silenceRanges.length ? "success" : "",
      );
    } catch (error) {
      setStatus(error.message, "error");
    } finally {
      setBusy(elements.detectSilence, false);
    }
  };

  const applySilenceCuts = () => {
    if (!state.silenceRanges.length) return;
    const updated = core.subtractRanges(
      state.segments,
      state.silenceRanges,
      state.duration,
    );
    if (!updated.length) {
      setStatus(
        "Os ajustes removeriam todo o vídeo. Reduza a sensibilidade.",
        "error",
      );
      return;
    }
    state.segments = updated;
    state.selectedSegmentId = state.segments[0].id;
    const count = state.silenceRanges.length;
    state.silenceRanges = [];
    elements.silenceResult.hidden = true;
    selectSegment(state.selectedSegmentId, true);
    renderTimeline();
    setStatus(
      `${count} ${
        count === 1 ? "pausa removida" : "pausas removidas"
      }. Você ainda pode restaurar a edição.`,
      "success",
    );
  };

  const splitAtPlayhead = () => {
    const before = state.segments.length;
    const time = globalTime();
    state.segments = core.splitSegments(
      state.segments,
      time,
      state.duration,
    );
    if (state.segments.length === before) {
      setStatus("Posicione o cursor dentro de um trecho para dividi-lo.");
      return;
    }
    const index = core.findSegmentIndex(
      state.segments,
      time + 0.02,
    );
    selectSegment(state.segments[Math.max(0, index)].id);
    renderTimeline();
    setStatus("Trecho dividido no cursor.", "success");
  };

  const setBoundary = (boundary) => {
    const segment = selectedSegment();
    const time = globalTime();
    if (!segment) return;
    if (boundary === "start" && time < segment.end - 0.08) {
      segment.start = Math.max(segment.start, time);
    } else if (boundary === "end" && time > segment.start + 0.08) {
      segment.end = Math.min(segment.end, time);
    } else {
      setStatus(
        "O cursor precisa permanecer dentro do trecho selecionado.",
        "error",
      );
      return;
    }
    state.segments = core.normalizeSegments(state.segments, state.duration);
    state.selectedSegmentId = segment.id;
    renderTimeline();
    selectSegment(segment.id);
    setStatus(
      boundary === "start" ? "Nova entrada definida." : "Nova saída definida.",
      "success",
    );
  };

  const removeSelectedSegment = () => {
    if (state.segments.length <= 1) {
      setStatus("O projeto precisa manter pelo menos um trecho.", "error");
      return;
    }
    const index = state.segments.findIndex((segment) =>
      segment.id === state.selectedSegmentId
    );
    state.segments.splice(index, 1);
    const next = state.segments[Math.min(index, state.segments.length - 1)];
    selectSegment(next.id, true);
    renderTimeline();
    setStatus("Trecho excluído da edição.", "success");
  };

  const renderCaptions = () => {
    elements.captionList.innerHTML = "";
    if (!state.captions.length) {
      elements.captionList.innerHTML =
        '<p class="empty-list">Nenhuma legenda adicionada.</p>';
      renderCaptionMarkers();
      return;
    }
    state.captions.sort((a, b) => a.start - b.start).forEach(
      (caption, index) => {
        const row = document.createElement("article");
        row.className = "caption-row";
        row.innerHTML = `
        <input type="text" maxlength="180" value="${
          escapeHtml(caption.text)
        }" aria-label="Texto da legenda ${index + 1}" />
        <div class="caption-row-times">
          <input type="number" min="0" max="${state.duration}" step="0.1" value="${
          caption.start.toFixed(1)
        }" aria-label="Início da legenda ${index + 1}" />
          <input type="number" min="0" max="${state.duration}" step="0.1" value="${
          caption.end.toFixed(1)
        }" aria-label="Fim da legenda ${index + 1}" />
          <button type="button" aria-label="Excluir legenda ${
          index + 1
        }">×</button>
        </div>`;
        const inputs = $$("input", row);
        inputs[0].addEventListener("input", () => {
          caption.text = inputs[0].value;
          drawPreview();
        });
        inputs[1].addEventListener("change", () => {
          caption.start = core.clamp(inputs[1].value, 0, caption.end - 0.05);
          renderCaptionMarkers();
        });
        inputs[2].addEventListener("change", () => {
          caption.end = core.clamp(
            inputs[2].value,
            caption.start + 0.05,
            state.duration,
          );
          renderCaptionMarkers();
        });
        $("button", row).addEventListener("click", () => {
          state.captions = state.captions.filter((item) =>
            item.id !== caption.id
          );
          renderCaptions();
        });
        row.addEventListener("dblclick", () => seekTo(caption.start));
        elements.captionList.appendChild(row);
      },
    );
    renderCaptionMarkers();
  };

  const escapeHtml = (value) =>
    String(value || "")
      .replaceAll("&", "&amp;")
      .replaceAll('"', "&quot;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;");

  const addCaptionAtPlayhead = () => {
    const start = globalTime();
    state.captions.push({
      id: `caption-${Date.now()}`,
      start,
      end: Math.min(state.duration, start + 3),
      text: "Digite a legenda",
    });
    renderCaptions();
    showTab("captions");
    const lastInput = elements.captionList.lastElementChild?.querySelector(
      'input[type="text"]',
    );
    lastInput?.focus();
    lastInput?.select();
  };

  const importSrtFile = async (file) => {
    if (!file) return;
    try {
      const captions = core.parseSrt(await file.text())
        .filter((caption) => caption.start < state.duration)
        .map((caption) => ({
          ...caption,
          end: Math.min(state.duration, caption.end),
        }));
      if (!captions.length) {
        throw new Error(
          "Nenhuma legenda válida foi encontrada no arquivo SRT.",
        );
      }
      state.captions = captions;
      renderCaptions();
      showTab("captions");
      setStatus(`${captions.length} legendas importadas.`, "success");
    } catch (error) {
      setStatus(error.message, "error");
    }
  };

  const buildVoiceScript = () => {
    const niche = String(elements.projectNiche.value || "").trim() ||
      "este projeto";
    const scripts = {
      aftermovie:
        `Alguns momentos passam rápido, mas deixam uma energia que permanece. Foi assim em ${niche}: encontros, detalhes e histórias acontecendo ao mesmo tempo. Um dia feito para viver, lembrar e compartilhar.`,
      content:
        `Se você trabalha com ${niche}, aqui vai uma dica importante: comece pelo objetivo, simplifique a mensagem e mostre o valor na prática. Quando as pessoas entendem com clareza, a decisão fica muito mais fácil.`,
      sales:
        `Você procura uma solução de ${niche} que una qualidade, confiança e resultado? Conheça uma experiência pensada para transformar sua necessidade em uma entrega memorável. Fale com a gente e dê o próximo passo.`,
    };
    elements.voiceScript.value = scripts[state.projectType] || scripts.content;
    showTab("audio");
    setStatus(
      "Sugestão criada a partir do tipo e do nicho. Ajuste o texto antes de gerar a voz.",
      "success",
    );
  };

  const setCaptionStyle = (style) => {
    state.captionStyle = style;
    const input = $(`input[name="caption-style"][value="${style}"]`);
    if (input) input.checked = true;
  };

  const applyRecipe = () => {
    state.projectType = elements.projectType.value;
    state.niche = String(elements.projectNiche.value || "").trim();
    state.transitionStyle = elements.transitionStyle.value;
    state.captionsEnabled = elements.captionMode.value !== "none";
    elements.captionsEnabled.checked = state.captionsEnabled;
    state.fit = "contain";
    elements.fitMode.value = "contain";
    const recipes = {
      aftermovie: {
        motions: ["zoom-in", "zoom-out", "punch"],
        speeds: ["1", "1.25", "1"],
        contrast: 8,
        saturation: 12,
        warmth: 6,
        volume: 80,
        captionStyle: "clean",
        cleanVoice: false,
      },
      content: {
        motions: ["none", "punch", "none"],
        speeds: ["1", "1", "1"],
        contrast: 4,
        saturation: 5,
        warmth: 2,
        volume: 100,
        captionStyle: "spark",
        cleanVoice: true,
      },
      sales: {
        motions: ["punch", "zoom-in", "zoom-out"],
        speeds: ["1.25", "ramp-up", "1"],
        contrast: 12,
        saturation: 14,
        warmth: 5,
        volume: 65,
        captionStyle: "impact",
        cleanVoice: true,
      },
    };
    const recipe = recipes[state.projectType];
    const transitionRecipes = {
      auto: { motions: recipe.motions, speeds: recipe.speeds },
      soft: { motions: ["zoom-in", "zoom-out"], speeds: ["1"] },
      dynamic: {
        motions: ["punch", "zoom-in", "zoom-out"],
        speeds: ["ramp-up", "1.25", "ramp-down"],
      },
      clean: { motions: ["none"], speeds: ["1"] },
    };
    const transitionRecipe = transitionRecipes[state.transitionStyle];
    state.segments.forEach((segment, index) => {
      segment.motion =
        transitionRecipe.motions[index % transitionRecipe.motions.length];
      segment.speed =
        transitionRecipe.speeds[index % transitionRecipe.speeds.length];
    });
    state.contrast = recipe.contrast;
    state.saturation = recipe.saturation;
    state.warmth = recipe.warmth;
    state.volume = recipe.volume / 100;
    state.cleanVoice = recipe.cleanVoice;
    elements.contrast.value = recipe.contrast;
    elements.saturation.value = recipe.saturation;
    elements.warmth.value = recipe.warmth;
    elements.volume.value = recipe.volume;
    elements.cleanVoice.checked = recipe.cleanVoice;
    setCaptionStyle(elements.captionPreset.value || recipe.captionStyle);
    const selected = selectedSegment();
    if (selected) {
      elements.speed.value = selected.speed;
      elements.motion.value = selected.motion;
    }
    updateOutputs();
    updateAudioGraph();
    renderTimeline();
    drawPreview();
    setStatus(
      `Primeira montagem criada com ${state.segments.length} trechos${
        state.captionsEnabled
          ? ". A legenda está pronta para gerar."
          : " e sem legendas."
      }`,
      "success",
    );
    if (elements.captionMode.value === "auto") {
      globalThis.setTimeout(() => transcribe(), 0);
    }
  };

  const encodeWav = (samples, sampleRate) => {
    const buffer = new ArrayBuffer(44 + samples.length * 2);
    const view = new DataView(buffer);
    const writeText = (offset, text) => {
      for (let index = 0; index < text.length; index += 1) {
        view.setUint8(offset + index, text.charCodeAt(index));
      }
    };
    writeText(0, "RIFF");
    view.setUint32(4, 36 + samples.length * 2, true);
    writeText(8, "WAVE");
    writeText(12, "fmt ");
    view.setUint32(16, 16, true);
    view.setUint16(20, 1, true);
    view.setUint16(22, 1, true);
    view.setUint32(24, sampleRate, true);
    view.setUint32(28, sampleRate * 2, true);
    view.setUint16(32, 2, true);
    view.setUint16(34, 16, true);
    writeText(36, "data");
    view.setUint32(40, samples.length * 2, true);
    samples.forEach((sample, index) => {
      const safe = Math.max(-1, Math.min(1, sample));
      view.setInt16(
        44 + index * 2,
        safe < 0 ? safe * 32768 : safe * 32767,
        true,
      );
    });
    return new Blob([buffer], { type: "audio/wav" });
  };

  const clearMusic = () => {
    elements.music.pause();
    elements.music.removeAttribute("src");
    elements.music.load();
    if (state.musicUrl) URL.revokeObjectURL(state.musicUrl);
    state.musicUrl = "";
    updateAudioGraph();
  };

  const useMusicBlob = async (blob, label) => {
    clearMusic();
    state.musicUrl = URL.createObjectURL(blob);
    elements.music.src = state.musicUrl;
    elements.music.load();
    if (elements.music.readyState < 1) {
      await waitForEvent(elements.music, "loadedmetadata");
    }
    await setupAudioGraph();
    updateAudioGraph();
    setStatus(
      `${label} adicionada à montagem e pronta para exportar.`,
      "success",
    );
  };

  const musicSeed = (text) =>
    Array.from(String(text || "spark")).reduce(
      (seed, character) => ((seed * 31) + character.charCodeAt(0)) >>> 0,
      2166136261,
    );

  const generateMusicSamples = (description, duration, preset) => {
    const sampleRate = 22050;
    const safeDuration = core.clamp(duration || 45, 20, 180);
    const length = Math.ceil(safeDuration * sampleRate);
    const samples = new Float32Array(length);
    const words = `${description} ${preset}`.toLowerCase();
    const bpm = /calm|leve|suave|golden/.test(words)
      ? 92
      : /cinema|emoc|rise/.test(words)
      ? 108
      : 126;
    const beat = 60 / bpm;
    const seed = musicSeed(words);
    const roots = /cinema|emoc|rise/.test(words)
      ? [110, 130.81, 146.83, 98]
      : /leve|golden|acoustic/.test(words)
      ? [130.81, 164.81, 196, 146.83]
      : [110, 146.83, 130.81, 164.81];
    const brightness = /dark|cinema|dram/.test(words) ? 0.45 : 0.72;

    for (let index = 0; index < length; index += 1) {
      const time = index / sampleRate;
      const barPosition = time % (beat * 4);
      const root = roots[Math.floor(time / (beat * 4)) % roots.length];
      const kickPosition = time % beat;
      const kick = kickPosition < 0.13
        ? Math.sin(2 * Math.PI * (52 - kickPosition * 145) * kickPosition) *
          Math.exp(-kickPosition * 25)
        : 0;
      const hatPosition = (time + beat / 2) % beat;
      const noise = (((index * 16807 + seed) % 2147483647) / 1073741823.5) - 1;
      const hat = hatPosition < 0.045 ? noise * Math.exp(-hatPosition * 70) : 0;
      const pulseGate = (time % (beat / 2)) < beat * 0.28 ? 1 : 0.18;
      const bass = Math.sin(2 * Math.PI * (root / 2) * time) * pulseGate;
      const pad = (
        Math.sin(2 * Math.PI * root * time) +
        Math.sin(2 * Math.PI * root * 1.25 * time) * 0.55 +
        Math.sin(2 * Math.PI * root * 1.5 * time) * 0.4
      ) / 1.95;
      const rise = Math.min(1, time / 6);
      const fade = Math.min(1, time / 0.8, (safeDuration - time) / 1.5);
      samples[index] = (kick * 0.36 + hat * 0.08 * brightness + bass * 0.16 +
        pad * 0.13 * rise) * Math.max(0, fade);
      if (barPosition > beat * 3.75) samples[index] *= 0.72;
    }
    return { samples, sampleRate };
  };

  const createMusic = async () => {
    const mode = elements.soundtrackMode.value;
    const preset = elements.musicLibrary.value;
    const description = String(elements.musicPrompt.value || "").trim();
    if (mode === "ai" && !description) {
      setStatus("Descreva o clima da trilha que você quer gerar.", "error");
      elements.musicPrompt.focus();
      return;
    }
    setBusy(elements.createMusic, true, "Criando…");
    try {
      await new Promise((resolve) => globalThis.setTimeout(resolve, 40));
      const generated = generateMusicSamples(
        description,
        core.outputDuration(state.segments),
        preset,
      );
      await useMusicBlob(
        encodeWav(generated.samples, generated.sampleRate),
        mode === "ai" ? "Trilha generativa" : "Trilha do banco Spark",
      );
    } catch (error) {
      setStatus(error.message || "Não foi possível criar a trilha.", "error");
    } finally {
      setBusy(elements.createMusic, false);
    }
  };

  const importMusic = async (file) => {
    if (!file || !String(file.type).startsWith("audio/")) {
      setStatus("Escolha um arquivo de áudio válido.", "error");
      return;
    }
    await useMusicBlob(file, `Trilha “${file.name}”`);
    elements.musicInput.value = "";
  };

  const updateSoundtrackControls = () => {
    const mode = elements.soundtrackMode.value;
    state.soundtrackMode = mode;
    elements.soundtrackConfig.hidden = !["library", "ai"].includes(mode);
    elements.musicPrompt.hidden = mode !== "ai";
    elements.musicLibrary.hidden = mode !== "library";
    elements.createMusic.textContent = mode === "ai"
      ? "Gerar trilha"
      : "Usar trilha";
    if (mode === "upload") elements.musicInput.click();
    if (mode === "none") {
      clearMusic();
      setStatus("Projeto configurado sem trilha sonora.");
    }
  };

  const loadTransformers = async () => {
    if (!state.transformers) {
      state.transformers = await import(
        "https://cdn.jsdelivr.net/npm/@huggingface/transformers@3.8.1"
      );
    }
    return state.transformers;
  };

  const removeVoiceover = () => {
    elements.voiceover.pause();
    elements.voiceover.removeAttribute("src");
    elements.voiceover.load();
    if (state.voiceoverUrl) URL.revokeObjectURL(state.voiceoverUrl);
    state.voiceoverUrl = "";
    state.voiceoverDuration = 0;
    elements.voiceResult.hidden = true;
    updateAudioGraph();
    setStatus("Narração removida da edição.");
  };

  const generateVoiceover = async () => {
    const text = String(elements.voiceScript.value || "").trim();
    if (!text) {
      setStatus(
        "Escreva ou gere uma sugestão de texto para a narração.",
        "error",
      );
      return;
    }
    setBusy(elements.generateVoice, true, "Gerando voz…");
    try {
      setStatus(
        "Preparando a voz em português. Na primeira vez, o modelo de IA será baixado.",
      );
      const transformers = await loadTransformers();
      if (!state.synthesizer) {
        state.synthesizer = await transformers.pipeline(
          "text-to-speech",
          "Xenova/mms-tts-por",
          {
            progress_callback: (progress) => {
              if (
                progress?.status === "progress" &&
                Number.isFinite(progress.progress)
              ) {
                elements.generateVoice.textContent = `Baixando… ${
                  Math.round(progress.progress)
                }%`;
              }
            },
          },
        );
      }
      const output = await state.synthesizer(text);
      const samples = output?.audio;
      const sampleRate = Number(output?.sampling_rate) || 16000;
      if (!samples?.length) throw new Error("O modelo não retornou áudio.");
      if (state.voiceoverUrl) URL.revokeObjectURL(state.voiceoverUrl);
      state.voiceoverUrl = URL.createObjectURL(encodeWav(samples, sampleRate));
      elements.voiceover.src = state.voiceoverUrl;
      elements.voiceover.load();
      if (elements.voiceover.readyState < 1) {
        await waitForEvent(elements.voiceover, "loadedmetadata");
      }
      state.voiceoverDuration = elements.voiceover.duration;
      elements.voiceResult.hidden = false;
      const resultDuration = core.outputDuration(state.segments);
      const overflow = Math.max(0, state.voiceoverDuration - resultDuration);
      elements.voiceSummary.textContent = overflow > 0.1
        ? `Narração com ${core.formatTime(overflow, true)} além do vídeo`
        : `Narração pronta · ${core.formatTime(state.voiceoverDuration, true)}`;
      await setupAudioGraph();
      updateAudioGraph();
      setStatus(
        overflow > 0.1
          ? "A narração ficou maior que a montagem. Encurte o texto ou mantenha apenas a parte que cabe."
          : "Narração gerada e adicionada à mixagem. Use “Ouvir” para revisar.",
        overflow > 0.1 ? "" : "success",
      );
    } catch (error) {
      const hint = /fetch|network|module/i.test(String(error?.message))
        ? " É necessário acesso à internet para baixar o modelo na primeira vez."
        : "";
      setStatus(
        `${error.message || "Não foi possível gerar a voz."}${hint}`,
        "error",
      );
    } finally {
      setBusy(elements.generateVoice, false);
    }
  };

  const previewVoiceover = async () => {
    if (!state.voiceoverUrl) return;
    await setupAudioGraph();
    elements.video.pause();
    if (elements.voiceover.paused) {
      if (elements.voiceover.ended) elements.voiceover.currentTime = 0;
      await elements.voiceover.play();
      elements.previewVoice.textContent = "Pausar";
    } else {
      elements.voiceover.pause();
      elements.previewVoice.textContent = "Ouvir";
    }
  };

  const progressLabel = (progress) => {
    if (!progress || typeof progress !== "object") {
      return "Carregando a IA de transcrição…";
    }
    if (progress.status === "progress" && Number.isFinite(progress.progress)) {
      return `Baixando modelo de IA… ${Math.round(progress.progress)}%`;
    }
    if (progress.status === "ready") {
      return "Modelo pronto. Transcrevendo o áudio…";
    }
    return "Preparando a IA local…";
  };

  const transcribe = async () => {
    state.captionsEnabled = true;
    elements.captionsEnabled.checked = true;
    elements.captionMode.value = "auto";
    setBusy(
      elements.autoCaptions,
      true,
      '<span class="quick-action-icon">…</span><span><strong>Transcrevendo</strong><small id="ai-progress-label">Preparando modelo local</small></span>',
    );
    try {
      if (state.duration > 1200) {
        throw new Error(
          "Para preservar a memória do dispositivo, a legenda automática desta versão aceita vídeos de até 20 minutos.",
        );
      }
      const samples = await getAudioSamples();
      setStatus(
        "Na primeira utilização, o navegador baixa e guarda o modelo de IA. O áudio não é enviado.",
      );
      if (!state.transcriber) {
        const transformers = await loadTransformers();
        const options = {
          dtype: navigator.gpu
            ? { encoder_model: "fp32", decoder_model_merged: "q4" }
            : "q8",
          progress_callback: (progress) => {
            const label = $("#ai-progress-label");
            if (label) label.textContent = progressLabel(progress);
          },
        };
        if (navigator.gpu) options.device = "webgpu";
        try {
          state.transcriber = await transformers.pipeline(
            "automatic-speech-recognition",
            "onnx-community/whisper-tiny",
            options,
          );
        } catch (webGpuError) {
          if (!navigator.gpu) throw webGpuError;
          setStatus("A GPU não aceitou o modelo. Tentando o modo compatível…");
          state.transcriber = await transformers.pipeline(
            "automatic-speech-recognition",
            "onnx-community/whisper-tiny",
            {
              dtype: "q8",
              progress_callback: options.progress_callback,
            },
          );
        }
      }
      const result = await state.transcriber(samples, {
        language: "portuguese",
        task: "transcribe",
        return_timestamps: true,
        chunk_length_s: 30,
        stride_length_s: 5,
      });
      const chunks = Array.isArray(result?.chunks) ? result.chunks : [];
      if (chunks.length) {
        state.captions = chunks.map((chunk, index) => ({
          id: `caption-ai-${Date.now()}-${index}`,
          start: core.clamp(chunk.timestamp?.[0] ?? 0, 0, state.duration),
          end: core.clamp(
            chunk.timestamp?.[1] ?? state.duration,
            0.05,
            state.duration,
          ),
          text: String(chunk.text || "").trim(),
        })).filter((caption) => caption.text && caption.end > caption.start);
      } else if (String(result?.text || "").trim()) {
        state.captions = [{
          id: `caption-ai-${Date.now()}`,
          start: 0,
          end: state.duration,
          text: result.text.trim(),
        }];
      }
      if (!state.captions.length) {
        throw new Error("A IA não encontrou fala reconhecível neste vídeo.");
      }
      renderCaptions();
      showTab("captions");
      setStatus(
        `${state.captions.length} blocos de legenda criados. Revise o texto e os tempos antes de exportar.`,
        "success",
      );
    } catch (error) {
      const offlineHint =
        /fetch|network|import|module/i.test(String(error?.message))
          ? " É necessário acesso à internet apenas para baixar o modelo na primeira utilização."
          : "";
      setStatus(
        `${
          error.message || "Não foi possível gerar as legendas."
        }${offlineHint}`,
        "error",
      );
    } finally {
      setBusy(elements.autoCaptions, false);
    }
  };

  const showTab = (name) => {
    $$("[data-tab]").forEach((button) => {
      const active = button.dataset.tab === name;
      button.classList.toggle("is-active", active);
      button.setAttribute("aria-selected", String(active));
    });
    $$("[data-panel]").forEach((panel) => {
      const active = panel.dataset.panel === name;
      panel.hidden = !active;
      panel.classList.toggle("is-active", active);
    });
  };

  const chooseMimeType = () => {
    const candidates = [
      "video/mp4;codecs=avc1.42E01E,mp4a.40.2",
      "video/mp4",
      "video/webm;codecs=vp9,opus",
      "video/webm;codecs=vp8,opus",
      "video/webm",
    ];
    return candidates.find((type) =>
      globalThis.MediaRecorder?.isTypeSupported(type)
    ) || "";
  };

  const updateExportSupport = () => {
    const mime = chooseMimeType();
    if (!globalThis.MediaRecorder || !elements.canvas?.captureStream || !mime) {
      elements.exportButton.disabled = true;
      elements.exportSupport.textContent =
        "Exportação indisponível neste navegador";
      return;
    }
    const is4k = Number(elements.exportQuality.value) === 2160;
    elements.exportSupport.textContent = `${
      mime.startsWith("video/mp4") ? "Saída MP4" : "Saída WebM"
    } · ${is4k ? "4K exige um dispositivo potente" : "renderização local"}`;
  };

  const cleanupExport = () => {
    state.exporting = false;
    state.recorder = null;
    elements.voiceover.pause();
    elements.music.pause();
    if (state.audio) state.audio.monitor.gain.value = 1;
    elements.exportButton.textContent = "Exportar vídeo";
    elements.exportButton.classList.remove("is-cancelling");
    updateCanvasSize(false);
    seekTo(state.segments[0]?.start || 0);
  };

  const startExport = async () => {
    if (state.exporting) {
      state.exportCancelled = true;
      finishExportPlayback();
      return;
    }
    if (!state.file || !state.segments.length) return;
    const mimeType = chooseMimeType();
    if (!mimeType) {
      setStatus(
        "O navegador não oferece um formato compatível para exportação.",
        "error",
      );
      return;
    }
    try {
      await setupAudioGraph();
      state.exporting = true;
      state.exportCancelled = false;
      state.chunks = [];
      state.mimeType = mimeType;
      elements.video.pause();
      elements.voiceover.pause();
      elements.music.pause();
      state.audio.monitor.gain.value = 0;
      updateCanvasSize(true);
      drawPreview();
      const canvasStream = elements.canvas.captureStream(30);
      const tracks = [
        ...canvasStream.getVideoTracks(),
        ...state.audio.destination.stream.getAudioTracks(),
      ];
      const stream = new MediaStream(tracks);
      const quality = Number(elements.exportQuality.value);
      const bitrate = quality >= 2160
        ? 35_000_000
        : quality >= 1080
        ? 10_000_000
        : 5_000_000;
      state.recorder = new MediaRecorder(stream, {
        mimeType,
        videoBitsPerSecond: bitrate,
        audioBitsPerSecond: 192000,
      });
      state.recorder.addEventListener("dataavailable", (event) => {
        if (event.data?.size) state.chunks.push(event.data);
      });
      state.recorder.addEventListener("stop", () => {
        stream.getTracks().forEach((track) => track.stop());
        if (!state.exportCancelled && state.chunks.length) {
          const blob = new Blob(state.chunks, { type: mimeType });
          const url = URL.createObjectURL(blob);
          const link = document.createElement("a");
          const baseName = state.clips.length > 1
            ? `${state.projectType}-sparkfilmes`
            : state.file.name.replace(/\.[^.]+$/, "") || "video";
          link.href = url;
          link.download = `${baseName}-spark-cut.${
            mimeType.startsWith("video/mp4") ? "mp4" : "webm"
          }`;
          document.body.appendChild(link);
          link.click();
          link.remove();
          globalThis.setTimeout(() => URL.revokeObjectURL(url), 60_000);
          setStatus(
            `Exportação concluída · ${
              formatBytes(blob.size)
            } salvos no dispositivo.`,
            "success",
          );
          elements.exportProgressText.textContent =
            "Concluído. O download foi iniciado.";
          elements.exportProgressBar.style.width = "100%";
        } else {
          setStatus("Exportação cancelada.");
          elements.exportProgress.hidden = true;
        }
        cleanupExport();
      }, { once: true });
      state.recorder.addEventListener("error", () => {
        state.exportCancelled = true;
        setStatus(
          "O navegador interrompeu a exportação. Tente uma qualidade menor ou um vídeo mais curto.",
          "error",
        );
        cleanupExport();
      }, { once: true });
      elements.exportProgress.hidden = false;
      elements.exportProgressBar.style.width = "0%";
      elements.exportProgressText.textContent = "Preparando renderização…";
      elements.exportButton.textContent = "Cancelar exportação";
      elements.exportButton.classList.add("is-cancelling");
      await activateGlobalTime(state.segments[0].start);
      syncVoiceover(state.segments[0].start, true);
      syncMusic(state.segments[0].start, true);
      state.recorder.start(1000);
      await elements.video.play();
      if (state.voiceoverUrl) elements.voiceover.play().catch(() => {});
      if (state.musicUrl) elements.music.play().catch(() => {});
      setStatus(
        "Renderizando no dispositivo. A prévia ficará sem som durante a exportação.",
      );
    } catch (error) {
      state.exportCancelled = true;
      if (state.recorder?.state === "recording") state.recorder.stop();
      cleanupExport();
      setStatus(
        error.message || "Não foi possível iniciar a exportação.",
        "error",
      );
    }
  };

  const updateOutputs = () => {
    $("#brightness-output").textContent = state.brightness > 0
      ? `+${state.brightness}`
      : String(state.brightness);
    $("#contrast-output").textContent = state.contrast > 0
      ? `+${state.contrast}`
      : String(state.contrast);
    $("#saturation-output").textContent = state.saturation > 0
      ? `+${state.saturation}`
      : String(state.saturation);
    $("#warmth-output").textContent = state.warmth > 0
      ? `+${state.warmth}`
      : String(state.warmth);
    $("#volume-output").textContent = `${Math.round(state.volume * 100)}%`;
    $("#voice-volume-output").textContent = `${
      Math.round(state.voiceVolume * 100)
    }%`;
    $("#silence-threshold-output").textContent = `${
      elements.silenceThreshold.value.replace("-", "−")
    } dB`;
    $("#silence-duration-output").textContent = `${
      Number(elements.silenceDuration.value).toLocaleString("pt-BR", {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      })
    } s`;
    $("#caption-size-output").textContent = `${state.captionSize}%`;
    $("#caption-position-output").textContent = `${state.captionPosition}%`;
  };

  const bindEvents = () => {
    elements.chooseVideo.addEventListener(
      "click",
      () => {
        elements.videoInput.dataset.mode = "replace";
        elements.videoInput.click();
      },
    );
    elements.addVideos.addEventListener(
      "click",
      () => {
        elements.videoInput.dataset.mode = "append";
        elements.videoInput.click();
      },
    );
    elements.flowAddVideos.addEventListener(
      "click",
      () => {
        elements.videoInput.dataset.mode = "append";
        elements.videoInput.click();
      },
    );
    elements.replaceVideo.addEventListener(
      "click",
      () => {
        elements.videoInput.dataset.mode = "replace";
        elements.videoInput.click();
      },
    );
    elements.videoInput.addEventListener(
      "change",
      () =>
        loadVideos(
          Array.from(elements.videoInput.files || []),
          elements.videoInput.dataset.mode === "append",
        ),
    );
    ["dragenter", "dragover"].forEach((eventName) =>
      elements.dropzone.addEventListener(eventName, (event) => {
        event.preventDefault();
        elements.dropzone.classList.add("is-dragging");
      })
    );
    ["dragleave", "drop"].forEach((eventName) =>
      elements.dropzone.addEventListener(eventName, (event) => {
        event.preventDefault();
        elements.dropzone.classList.remove("is-dragging");
      })
    );
    elements.dropzone.addEventListener(
      "drop",
      (event) => loadVideos(Array.from(event.dataTransfer?.files || [])),
    );
    elements.resetProject.addEventListener("click", resetEditing);
    elements.togglePlay.addEventListener("click", togglePlay);
    elements.video.addEventListener("play", () => {
      elements.togglePlay.textContent = "Ⅱ";
      elements.togglePlay.setAttribute("aria-label", "Pausar");
    });
    elements.video.addEventListener("pause", () => {
      elements.togglePlay.textContent = "▶";
      elements.togglePlay.setAttribute("aria-label", "Reproduzir");
      elements.voiceover.pause();
      elements.music.pause();
    });
    elements.video.addEventListener("seeked", () => {
      drawPreview();
      updateTransport();
    });
    elements.video.addEventListener("loadeddata", () => {
      drawPreview();
      updateTransport();
    });
    elements.voiceover.addEventListener("ended", () => {
      elements.previewVoice.textContent = "Ouvir";
    });
    $$("[data-seek]").forEach((button) =>
      button.addEventListener("click", () => {
        const target = button.dataset.seek === "start"
          ? state.segments[0]?.start || 0
          : globalTime() + Number(button.dataset.seek);
        seekTo(target);
      })
    );
    $('[data-action="split"]').addEventListener("click", splitAtPlayhead);
    elements.timeline.addEventListener("click", (event) => {
      const track = $(".timeline-track", elements.timeline);
      const rect = track.getBoundingClientRect();
      seekTo(((event.clientX - rect.left) / rect.width) * state.duration);
    });
    elements.timeline.addEventListener("keydown", (event) => {
      if (!["ArrowLeft", "ArrowRight"].includes(event.key)) return;
      event.preventDefault();
      seekTo(
        globalTime() + (event.key === "ArrowRight" ? 0.5 : -0.5),
      );
    });
    $("#set-in").addEventListener("click", () => setBoundary("start"));
    $("#set-out").addEventListener("click", () => setBoundary("end"));
    $("#remove-segment").addEventListener("click", removeSelectedSegment);
    elements.speed.addEventListener("change", () => {
      const segment = selectedSegment();
      if (segment) segment.speed = elements.speed.value;
      renderTimeline();
    });
    elements.motion.addEventListener("change", () => {
      const segment = selectedSegment();
      if (segment) segment.motion = elements.motion.value;
      drawPreview();
    });
    $$("[data-tab]").forEach((button) =>
      button.addEventListener("click", () => showTab(button.dataset.tab))
    );
    $$('input[name="format"]').forEach((input) =>
      input.addEventListener("change", () => {
        state.format = input.value;
        updateCanvasSize();
      })
    );
    elements.fitMode.addEventListener("change", () => {
      state.fit = elements.fitMode.value;
      drawPreview();
    });
    elements.projectType.addEventListener("change", () => {
      state.projectType = elements.projectType.value;
      const enabled = state.projectType === "content";
      state.captionsEnabled = enabled;
      elements.captionMode.value = enabled ? "auto" : "none";
      elements.captionsEnabled.checked = enabled;
      elements.captionPreset.disabled = !enabled;
      elements.autoCaptions.disabled = !enabled;
      drawPreview();
    });
    elements.projectNiche.addEventListener("input", () => {
      state.niche = elements.projectNiche.value.trim();
    });
    elements.transitionStyle.addEventListener("change", () => {
      state.transitionStyle = elements.transitionStyle.value;
    });
    elements.captionMode.addEventListener("change", () => {
      const enabled = elements.captionMode.value !== "none";
      state.captionsEnabled = enabled;
      elements.captionsEnabled.checked = enabled;
      elements.captionPreset.disabled = !enabled;
      elements.autoCaptions.disabled = !enabled;
      drawPreview();
    });
    elements.captionPreset.addEventListener("change", () => {
      setCaptionStyle(elements.captionPreset.value);
      drawPreview();
    });
    elements.captionsEnabled.addEventListener("change", () => {
      state.captionsEnabled = elements.captionsEnabled.checked;
      elements.captionMode.value = state.captionsEnabled ? "manual" : "none";
      elements.captionPreset.disabled = !state.captionsEnabled;
      elements.autoCaptions.disabled = !state.captionsEnabled;
      drawPreview();
    });
    elements.soundtrackMode.addEventListener(
      "change",
      updateSoundtrackControls,
    );
    elements.createMusic.addEventListener("click", createMusic);
    elements.musicInput.addEventListener("change", () => {
      importMusic(elements.musicInput.files?.[0]).catch((error) => {
        setStatus(
          error.message || "Não foi possível carregar a trilha.",
          "error",
        );
      });
    });
    elements.applyRecipe.addEventListener("click", applyRecipe);
    const colorBindings = [
      [elements.brightness, "brightness"],
      [elements.contrast, "contrast"],
      [elements.saturation, "saturation"],
      [elements.warmth, "warmth"],
    ];
    colorBindings.forEach(([input, key]) =>
      input.addEventListener("input", () => {
        state[key] = Number(input.value);
        updateOutputs();
        drawPreview();
      })
    );
    $("#reset-color").addEventListener("click", () => {
      colorBindings.forEach(([input, key]) => {
        input.value = 0;
        state[key] = 0;
      });
      updateOutputs();
      drawPreview();
    });
    elements.cleanVoice.addEventListener("change", () => {
      state.cleanVoice = elements.cleanVoice.checked;
      updateAudioGraph();
    });
    elements.volume.addEventListener("input", () => {
      state.volume = Number(elements.volume.value) / 100;
      updateOutputs();
      updateAudioGraph();
    });
    elements.suggestVoiceScript.addEventListener("click", buildVoiceScript);
    elements.generateVoice.addEventListener("click", generateVoiceover);
    elements.previewVoice.addEventListener("click", () => {
      previewVoiceover().catch((error) => setStatus(error.message, "error"));
    });
    elements.removeVoice.addEventListener("click", removeVoiceover);
    elements.voiceVolume.addEventListener("input", () => {
      state.voiceVolume = Number(elements.voiceVolume.value) / 100;
      updateOutputs();
      updateAudioGraph();
    });
    elements.duckOriginal.addEventListener("change", () => {
      state.duckOriginal = elements.duckOriginal.checked;
      updateAudioGraph();
    });
    [elements.silenceThreshold, elements.silenceDuration].forEach((input) =>
      input.addEventListener("input", updateOutputs)
    );
    elements.detectSilence.addEventListener("click", detectSilences);
    elements.applySilence.addEventListener("click", applySilenceCuts);
    elements.autoCaptions.addEventListener("click", transcribe);
    elements.addCaption.addEventListener("click", addCaptionAtPlayhead);
    elements.importSrt.addEventListener(
      "click",
      () => elements.srtInput.click(),
    );
    elements.srtInput.addEventListener(
      "change",
      () => importSrtFile(elements.srtInput.files?.[0]),
    );
    $$('input[name="caption-style"]').forEach((input) =>
      input.addEventListener("change", () => {
        state.captionStyle = input.value;
        elements.captionPreset.value = input.value;
        drawPreview();
      })
    );
    elements.captionSize.addEventListener("input", () => {
      state.captionSize = Number(elements.captionSize.value);
      updateOutputs();
      drawPreview();
    });
    elements.captionPosition.addEventListener("input", () => {
      state.captionPosition = Number(elements.captionPosition.value);
      updateOutputs();
      drawPreview();
    });
    elements.exportButton.addEventListener("click", startExport);
    elements.exportQuality.addEventListener("change", updateExportSupport);
    globalThis.addEventListener("beforeunload", (event) => {
      if (!state.exporting) return;
      event.preventDefault();
      event.returnValue = "";
    });
  };

  if (ctx && elements.dropzone) {
    bindEvents();
    updateOutputs();
    updateExportSupport();
    renderLoop();
  }
})();
