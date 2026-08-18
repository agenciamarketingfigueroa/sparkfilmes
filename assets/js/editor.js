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

  const waitForMediaEvent = (target, events, timeout = 30000) =>
    new Promise((resolve, reject) => {
      const names = Array.isArray(events) ? events : [events];
      const timer = globalThis.setTimeout(() => {
        cleanup();
        reject(new Error("O celular demorou demais para liberar o vídeo."));
      }, timeout);
      const cleanup = () => {
        globalThis.clearTimeout(timer);
        names.forEach((name) => target.removeEventListener(name, onDone));
        target.removeEventListener("error", onError);
      };
      const onDone = () => {
        cleanup();
        resolve();
      };
      const onError = () => {
        cleanup();
        reject(
          new Error("O navegador não conseguiu abrir este formato de vídeo."),
        );
      };
      names.forEach((name) =>
        target.addEventListener(name, onDone, { once: true })
      );
      target.addEventListener("error", onError, { once: true });
    });

  const elements = {
    dropzone: $("#editor-dropzone"),
    dropzoneStatus: $("#dropzone-status"),
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
    videoStage: $("#video-stage"),
    previewQuality: $("#preview-quality"),
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
    analyzeTakes: $("#analyze-takes"),
    avoidShaky: $("#avoid-shaky"),
    smartAnalysis: $("#smart-analysis"),
    analysisSummary: $("#analysis-summary"),
    analysisDetail: $("#analysis-detail"),
    analysisApproved: $("#analysis-approved"),
    analysisRemoved: $("#analysis-removed"),
    analysisMusic: $("#analysis-music"),
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
    muteTakes: $$("[data-mute-takes]"),
    musicVolume: $("#music-volume"),
    musicVolumeOutput: $("#music-volume-output"),
    musicMixStatus: $("#music-mix-status"),
    regenerateMusic: $("#regenerate-music"),
    removeMusic: $("#remove-music"),
    wasmStatus: $("#wasm-status"),
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
    format: "original",
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
    soundtrackMode: "auto",
    musicUrl: "",
    musicVolume: 0.72,
    muteOriginal: true,
    wasmAnalyzer: null,
    wasmAttempted: false,
    wasmPromise: null,
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
    exportError: "",
    exportStream: null,
    recorder: null,
    chunks: [],
    mimeType: "",
    transcriber: null,
    analysis: [],
    qualityRanges: [],
    analyzing: false,
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
    if (elements.dropzoneStatus) {
      elements.dropzoneStatus.textContent = message;
      elements.dropzoneStatus.className = `dropzone-status${
        type ? ` is-${type}` : ""
      }`;
    }
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
        elapsed += core.segmentOutputDurationAt(segment, progress);
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

  const playMixAudio = async () => {
    const playback = [];
    const add = (element, label) => {
      try {
        playback.push({ label, promise: Promise.resolve(element.play()) });
      } catch (error) {
        playback.push({ label, promise: Promise.reject(error) });
      }
    };
    if (
      state.voiceoverUrl &&
      elements.voiceover.currentTime < elements.voiceover.duration
    ) {
      add(elements.voiceover, "narração");
    }
    if (state.musicUrl) add(elements.music, "trilha sonora");
    const results = await Promise.allSettled(
      playback.map((item) => item.promise),
    );
    const failedIndex = results.findIndex((result) =>
      result.status === "rejected"
    );
    if (failedIndex >= 0) {
      throw new Error(
        `A ${
          playback[failedIndex].label
        } não pôde ser reproduzida. Toque em reproduzir novamente ou escolha outro arquivo.`,
      );
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
    const portrait = height > width;
    elements.videoStage.classList.toggle("is-portrait", portrait);
    elements.videoStage.classList.toggle("is-landscape", !portrait);
    elements.canvas.style.aspectRatio = `${width} / ${height}`;
    const formatLabel = state.format === "original" ? "Original" : state.format;
    elements.previewQuality.textContent = `${formatLabel} · quadro completo`;
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
    const zoom = state.fit === "cover" ? motionScale(segment, time) : 1;
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
    const elapsed = before + core.segmentOutputDurationAt(segment, progress);
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
      const sourceChanged = clip.id !== state.activeClipId ||
        elements.video.src !== clip.url;
      const needsSeek = sourceChanged ||
        Math.abs(elements.video.currentTime - localTime) > 0.015;
      if (
        needsSeek && state.exporting && state.recorder?.state === "recording"
      ) {
        state.recorder.pause();
        pausedRecorderForTransition = true;
        if (state.recorder.state !== "paused") {
          await waitForEvent(state.recorder, "pause");
        }
      }
      if (needsSeek) elements.video.pause();
      if (sourceChanged) {
        elements.video.src = clip.url;
        elements.video.load();
        state.activeClipId = clip.id;
        if (elements.video.readyState < 1) {
          await waitForEvent(elements.video, "loadedmetadata");
        }
      }
      if (needsSeek) {
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
        await playMixAudio();
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
    if (state.recorder && state.recorder.state !== "inactive") {
      try {
        state.recorder.stop();
      } catch (_error) {
        cleanupExport();
      }
    } else if (state.exporting) {
      cleanupExport();
    }
  };

  const handleTransitionFailure = (error) => {
    const message = error?.message ||
      "O navegador não conseguiu avançar para o próximo trecho.";
    if (state.exporting) {
      state.exportCancelled = true;
      state.exportError = message;
      setStatus(message, "error");
      finishExportPlayback();
      return;
    }
    elements.video.pause();
    setStatus(message, "error");
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
      activateGlobalTime(state.segments[index].start, true).catch(
        handleTransitionFailure,
      );
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
        activateGlobalTime(next.start, true).catch(handleTransitionFailure);
        selectSegment(next.id);
      } else if (state.exporting) {
        finishExportPlayback();
      } else {
        elements.video.pause();
        elements.voiceover.pause();
        activateGlobalTime(state.segments[0].start).catch(
          handleTransitionFailure,
        );
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
    state.qualityRanges.forEach((range) => {
      const marker = document.createElement("span");
      marker.className = "quality-marker";
      marker.style.left = `${(range.start / state.duration) * 100}%`;
      marker.style.width = `${
        ((range.end - range.start) / state.duration) * 100
      }%`;
      marker.title = "Trecho instável detectado";
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
    activateGlobalTime(target).catch(handleTransitionFailure);
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
    const mixBus = context.createGain();
    const masterCompressor = context.createDynamicsCompressor();
    const monitor = context.createGain();
    const destination = context.createMediaStreamDestination();
    gain.gain.value = state.muteOriginal ? 0 : state.volume;
    voiceGain.gain.value = state.voiceVolume;
    musicGain.gain.value = state.musicUrl ? state.musicVolume : 0;
    source.connect(highpass).connect(lowpass).connect(compressor).connect(gain);
    gain.connect(mixBus);
    voiceSource.connect(voiceGain).connect(mixBus);
    musicSource.connect(musicGain).connect(mixBus);
    masterCompressor.threshold.value = -4;
    masterCompressor.knee.value = 2;
    masterCompressor.ratio.value = 16;
    masterCompressor.attack.value = 0.003;
    masterCompressor.release.value = 0.16;
    mixBus.connect(masterCompressor);
    masterCompressor.connect(monitor).connect(context.destination);
    masterCompressor.connect(destination);
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
      mixBus,
      masterCompressor,
      monitor,
      destination,
    };
    updateAudioGraph();
    return state.audio;
  };

  const setMuteOriginal = (muted) => {
    state.muteOriginal = Boolean(muted);
    elements.muteTakes.forEach((input) => {
      input.checked = state.muteOriginal;
    });
    updateAudioGraph();
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
    const originalVolume = state.muteOriginal
      ? 0
      : state.voiceoverUrl && state.duckOriginal
      ? state.volume * 0.25
      : state.volume;
    gain.gain.cancelScheduledValues(now);
    if (state.muteOriginal) gain.gain.setValueAtTime(0, now);
    else gain.gain.setTargetAtTime(originalVolume, now, 0.02);
    voiceGain.gain.setTargetAtTime(state.voiceVolume, now, 0.02);
    musicGain.gain.setTargetAtTime(
      state.musicUrl ? state.musicVolume * (state.voiceoverUrl ? 0.42 : 1) : 0,
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
    await playMixAudio();
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
    state.analysis = [];
    state.qualityRanges = [];
    elements.smartAnalysis.hidden = true;
    state.captionsEnabled = state.projectType === "content";
    elements.captionsEnabled.checked = state.captionsEnabled;
    elements.captionMode.value = state.captionsEnabled ? "auto" : "none";
    elements.captionPreset.disabled = !state.captionsEnabled;
    elements.autoCaptions.disabled = !state.captionsEnabled;
    setMuteOriginal(state.projectType === "aftermovie");
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
      /\.(mp4|mov|m4v|webm|ogv|avi|3gp|mpeg|mpg|mts|m2ts|hevc)$/i.test(
        file.name,
      )
    );

  const probeVideo = async (file) => {
    const url = URL.createObjectURL(file);
    const video = document.createElement("video");
    video.preload = "metadata";
    video.muted = true;
    video.playsInline = true;
    video.setAttribute("playsinline", "");
    video.setAttribute("webkit-playsinline", "");
    video.style.position = "fixed";
    video.style.width = "1px";
    video.style.height = "1px";
    video.style.opacity = "0";
    video.style.pointerEvents = "none";
    document.body.appendChild(video);
    video.src = url;
    video.load();
    try {
      if (video.readyState < 1) {
        await waitForMediaEvent(video, "loadedmetadata");
      }

      let duration = Number(video.duration);
      if (Number.isNaN(duration) || duration <= 0) {
        if (video.readyState < 2) {
          await waitForMediaEvent(video, ["loadeddata", "canplay"], 15000);
        }
        duration = Number(video.duration);
      }
      if (duration === Infinity) {
        video.currentTime = Number.MAX_SAFE_INTEGER;
        await waitForMediaEvent(video, ["durationchange", "timeupdate"], 15000);
        duration = Number(video.duration);
        video.currentTime = 0;
      }

      if (!Number.isFinite(duration) || duration <= 0) {
        throw new Error(`Não foi possível ler “${file.name}”.`);
      }
      return {
        id: globalThis.crypto?.randomUUID?.() ||
          `clip-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
        file,
        url,
        name: file.name,
        duration,
        width: video.videoWidth,
        height: video.videoHeight,
        offset: 0,
      };
    } catch (error) {
      URL.revokeObjectURL(url);
      throw error;
    } finally {
      video.remove();
      video.removeAttribute("src");
      video.load();
    }
  };

  const loadVideos = async (files, append = false) => {
    const selectedFiles = Array.isArray(files) ? files : [];
    const validFiles = selectedFiles.filter(looksLikeVideo);
    if (!validFiles.length) {
      setStatus(
        "Não encontrei um vídeo compatível nessa seleção. Tente MP4, MOV ou M4V.",
        "error",
      );
      return;
    }
    if (state.exporting) return;
    [elements.chooseVideo, elements.addVideos, elements.flowAddVideos].forEach(
      (button) => setBusy(button, true, "Importando…"),
    );
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
    const incoming = [];
    const rejected = selectedFiles.length - validFiles.length;
    let failedToOpen = 0;
    try {
      for (const file of validFiles) {
        try {
          incoming.push(await probeVideo(file));
        } catch (_error) {
          failedToOpen += 1;
        }
      }
      if (!incoming.length) {
        throw new Error(
          "O celular selecionou os arquivos, mas não conseguiu decodificá-los. Se estiverem em HEVC, tente exportá-los como ‘Mais compatível’ ou MP4.",
        );
      }
      if (!append) {
        state.clips.forEach((clip) => URL.revokeObjectURL(clip.url));
        state.clips = incoming;
        state.captions = [];
        state.silenceRanges = [];
        state.analysis = [];
        state.qualityRanges = [];
        elements.smartAnalysis.hidden = true;
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
      const skipped = rejected + failedToOpen;
      const warning = skipped
        ? `${incoming.length} ${
          incoming.length === 1 ? "take importado" : "takes importados"
        }. ${skipped} ${
          skipped === 1
            ? "arquivo não pôde ser aberto"
            : "arquivos não puderam ser abertos"
        } neste navegador.`
        : state.duration > 900
        ? "Takes carregados. O projeto soma mais de 15 minutos e pode exigir bastante memória."
        : `${incoming.length} ${
          incoming.length === 1 ? "take carregado" : "takes carregados"
        }. A primeira montagem respeita a ordem de seleção.`;
      setStatus(warning, skipped || state.duration > 900 ? "" : "success");
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
      [elements.chooseVideo, elements.addVideos, elements.flowAddVideos]
        .forEach(
          (button) => setBusy(button, false),
        );
    }
  };

  const median = (values) => {
    const sorted = values.filter(Number.isFinite).sort((a, b) => a - b);
    if (!sorted.length) return 0;
    const middle = Math.floor(sorted.length / 2);
    return sorted.length % 2
      ? sorted[middle]
      : (sorted[middle - 1] + sorted[middle]) / 2;
  };

  const loadWasmAnalyzer = async () => {
    if (state.wasmAnalyzer) return state.wasmAnalyzer;
    if (state.wasmPromise) return state.wasmPromise;
    if (state.wasmAttempted || typeof WebAssembly !== "object") return null;
    state.wasmAttempted = true;
    state.wasmPromise = (async () => {
      try {
        const response = await fetch("../assets/wasm/spark-processor.wasm");
        if (!response.ok) throw new Error("Módulo WASM indisponível.");
        let result;
        try {
          result = await WebAssembly.instantiateStreaming(response.clone(), {});
        } catch {
          result = await WebAssembly.instantiate(
            await response.arrayBuffer(),
            {},
          );
        }
        const api = result.instance.exports;
        const memory = api.memory;
        const requiredFunctions = [
          "current_buffer",
          "exposure",
          "sharpness",
          "best_shift",
          "shift_error",
          "commit_frame",
          "audio_buffer",
          "master_audio",
        ];
        if (
          !memory ||
          requiredFunctions.some((name) => typeof api[name] !== "function")
        ) {
          throw new Error("ABI WebAssembly incompatível.");
        }
        state.wasmAnalyzer = {
          api,
          setFrame(gray) {
            new Uint8Array(
              memory.buffer,
              Number(api.current_buffer()),
              gray.length,
            ).set(gray);
          },
          exposure(length) {
            return Number(api.exposure(length)) / (255 * 256);
          },
          sharpness(width, height) {
            return Number(api.sharpness(width, height)) / (256 * 255);
          },
          estimateShift(width, height) {
            const packed = Number(api.best_shift(width, height, 3));
            return {
              dx: packed >> 16,
              dy: (packed << 16) >> 16,
              error: Number(api.shift_error()) / 65536,
            };
          },
          commit(length) {
            api.commit_frame(length);
          },
          master(samples, targetPeak = 0.92) {
            if (
              typeof api.audio_buffer !== "function" ||
              typeof api.master_audio !== "function"
            ) return samples;
            const pointer = Number(api.audio_buffer());
            const requiredBytes = pointer + samples.byteLength;
            if (requiredBytes > memory.buffer.byteLength) {
              memory.grow(
                Math.ceil((requiredBytes - memory.buffer.byteLength) / 65536),
              );
            }
            const buffer = new Float32Array(
              memory.buffer,
              pointer,
              samples.length,
            );
            buffer.set(samples);
            api.master_audio(samples.length, targetPeak);
            samples.set(buffer);
            return samples;
          },
        };
        elements.wasmStatus.classList.add("is-ready");
        elements.wasmStatus.lastChild.textContent = " WASM ativo";
        return state.wasmAnalyzer;
      } catch (_error) {
        elements.wasmStatus.classList.remove("is-ready");
        elements.wasmStatus.lastChild.textContent = " modo compatível";
        return null;
      }
    })();
    try {
      return await state.wasmPromise;
    } finally {
      state.wasmPromise = null;
    }
  };

  const frameMetrics = (pixels, width, height, analyzer = null) => {
    const gray = new Uint8Array(width * height);
    let luminance = 0;
    for (let index = 0; index < gray.length; index += 1) {
      const offset = index * 4;
      const value = pixels[offset] * 0.2126 + pixels[offset + 1] * 0.7152 +
        pixels[offset + 2] * 0.0722;
      gray[index] = value;
      luminance += value;
    }
    if (analyzer) {
      analyzer.setFrame(gray);
      return {
        gray,
        exposure: analyzer.exposure(gray.length),
        sharpness: analyzer.sharpness(width, height),
      };
    }
    let detail = 0;
    let samples = 0;
    for (let y = 1; y < height - 1; y += 1) {
      for (let x = 1; x < width - 1; x += 1) {
        const index = y * width + x;
        detail += Math.abs(
          gray[index] * 4 - gray[index - 1] - gray[index + 1] -
            gray[index - width] - gray[index + width],
        );
        samples += 1;
      }
    }
    return {
      gray,
      exposure: luminance / Math.max(1, gray.length) / 255,
      sharpness: detail / Math.max(1, samples) / 255,
    };
  };

  const estimateFrameShift = (previous, current, width, height) => {
    let best = { dx: 0, dy: 0, error: Infinity };
    const radius = 3;
    for (let dy = -radius; dy <= radius; dy += 1) {
      for (let dx = -radius; dx <= radius; dx += 1) {
        let error = 0;
        let count = 0;
        for (let y = radius; y < height - radius; y += 2) {
          for (let x = radius; x < width - radius; x += 2) {
            const a = previous[y * width + x];
            const b = current[(y + dy) * width + x + dx];
            const difference = a - b;
            error += difference * difference;
            count += 1;
          }
        }
        const normalized = Math.sqrt(error / Math.max(1, count)) / 255;
        if (normalized < best.error) best = { dx, dy, error: normalized };
      }
    }
    return best;
  };

  const waitForDecodedFrame = (video) =>
    new Promise((resolve) => {
      let settled = false;
      const finish = () => {
        if (settled) return;
        settled = true;
        resolve();
      };
      globalThis.setTimeout(finish, 800);
      if (typeof video.requestVideoFrameCallback === "function") {
        video.requestVideoFrameCallback(finish);
      } else {
        requestAnimationFrame(() => requestAnimationFrame(finish));
      }
    });

  const seekAnalysisFrame = async (video, time) => {
    const target = core.clamp(time, 0, Math.max(0, video.duration - 0.03));
    if (Math.abs(video.currentTime - target) > 0.015) {
      video.currentTime = target;
      await waitForMediaEvent(video, "seeked", 8000);
    }
    await waitForDecodedFrame(video);
  };

  const analyzeClipQuality = async (clip, index, total, analyzer = null) => {
    const video = document.createElement("video");
    const canvas = document.createElement("canvas");
    const context = canvas.getContext("2d", { willReadFrequently: true });
    video.muted = true;
    video.playsInline = true;
    video.preload = "auto";
    video.style.position = "fixed";
    video.style.width = "1px";
    video.style.height = "1px";
    video.style.opacity = "0";
    document.body.appendChild(video);
    video.src = clip.url;
    video.load();
    try {
      if (video.readyState < 1) {
        await waitForMediaEvent(video, "loadedmetadata", 20000);
      }
      const width = 96;
      const ratio = (video.videoHeight || clip.height || 9) /
        Math.max(1, video.videoWidth || clip.width || 16);
      const height = Math.max(54, Math.min(128, Math.round(width * ratio)));
      canvas.width = width;
      canvas.height = height;
      const projectSampleBudget = 120;
      const maxSamples = Math.max(
        8,
        Math.min(42, Math.floor(projectSampleBudget / state.clips.length)),
      );
      const sampleCount = Math.max(
        4,
        Math.min(maxSamples, Math.ceil(clip.duration / 0.7)),
      );
      const interval = clip.duration / sampleCount;
      const frames = [];
      let previous = null;
      let previousShift = { dx: 0, dy: 0 };

      for (let frameIndex = 0; frameIndex < sampleCount; frameIndex += 1) {
        const time = Math.min(
          clip.duration - 0.04,
          Math.max(0.02, (frameIndex + 0.5) * interval),
        );
        elements.analysisDetail.textContent = `Take ${
          index + 1
        } de ${total} · quadro ${frameIndex + 1} de ${sampleCount}`;
        await seekAnalysisFrame(video, time);
        context.drawImage(video, 0, 0, width, height);
        const image = context.getImageData(0, 0, width, height);
        const metrics = frameMetrics(image.data, width, height, analyzer);
        let shift = { dx: 0, dy: 0, error: 0 };
        let jerk = 0;
        if (previous || (analyzer && frameIndex > 0)) {
          shift = analyzer
            ? analyzer.estimateShift(width, height)
            : estimateFrameShift(previous, metrics.gray, width, height);
          if (shift.error < 0.26) {
            jerk = Math.hypot(
              shift.dx - previousShift.dx,
              shift.dy - previousShift.dy,
            );
            previousShift = shift;
          } else {
            previousShift = { dx: 0, dy: 0 };
          }
        }
        frames.push({ time, interval, jerk, ...shift, ...metrics });
        if (analyzer) analyzer.commit(metrics.gray.length);
        else previous = metrics.gray;
      }

      const typicalSharpness = median(frames.map((frame) => frame.sharpness));
      const candidates = frames.map((frame) => {
        const shaky = frame.jerk >= 2.45 && frame.error < 0.2;
        const blurry = typicalSharpness > 0.01 &&
          frame.sharpness < typicalSharpness * 0.42;
        const exposureBad = frame.exposure < 0.045 || frame.exposure > 0.965;
        const severity = (shaky ? frame.jerk / 2.45 : 0) +
          (blurry ? 0.8 : 0) + (exposureBad ? 0.65 : 0);
        return { ...frame, shaky, blurry, exposureBad, severity };
      }).filter((frame) => frame.severity > 0);

      const removalBudget = clip.duration * 0.34;
      let reserved = 0;
      const selected = candidates.sort((a, b) => b.severity - a.severity)
        .filter((frame) => {
          const amount = Math.min(frame.interval, 1.25);
          if (reserved + amount > removalBudget) return false;
          reserved += amount;
          return true;
        });
      const ranges = selected.map((frame) => ({
        start: clip.offset + Math.max(0, frame.time - frame.interval * 0.55),
        end: clip.offset + Math.min(
          clip.duration,
          frame.time + frame.interval * 0.55,
        ),
        clipId: clip.id,
        reason: frame.shaky ? "shake" : frame.blurry ? "blur" : "exposure",
        severity: frame.severity,
      }));
      const selectedTimes = new Set(selected.map((frame) => frame.time));
      const bestFrame = frames.filter((frame) => !selectedTimes.has(frame.time))
        .reduce((best, frame) => {
          const sharpnessScore = typicalSharpness
            ? Math.min(2, frame.sharpness / typicalSharpness)
            : 1;
          const exposureScore = 1 - Math.min(1, Math.abs(frame.exposure - 0.5));
          const score = sharpnessScore + exposureScore - frame.jerk * 0.16;
          return !best || score > best.score ? { frame, score } : best;
        }, null)?.frame || frames[Math.floor(frames.length / 2)];
      const highlightDuration = Math.min(
        clip.duration,
        Math.max(2.8, Math.min(5.2, clip.duration * 0.42)),
      );
      const localStart = core.clamp(
        (bestFrame?.time || clip.duration / 2) - highlightDuration / 2,
        0,
        Math.max(0, clip.duration - highlightDuration),
      );
      const stableFrames = Math.max(0, frames.length - selected.length);
      return {
        clipId: clip.id,
        name: clip.name,
        frames: frames.length,
        stableFrames,
        score: frames.length ? stableFrames / frames.length : 1,
        ranges,
        bestWindow: {
          start: clip.offset + localStart,
          end: clip.offset + localStart + highlightDuration,
        },
      };
    } finally {
      video.pause();
      video.removeAttribute("src");
      video.load();
      video.remove();
    }
  };

  const mergeQualityRanges = (ranges) => {
    if (typeof core.mergeRanges === "function") {
      return core.mergeRanges(ranges, state.duration, {
        gap: 0.28,
        padding: 0.08,
      });
    }
    return ranges.sort((a, b) => a.start - b.start);
  };

  const applyQualityCuts = (ranges) => {
    if (!ranges.length || !elements.avoidShaky.checked) return 0;
    const before = core.outputDuration(state.segments);
    const next = typeof core.stableSegmentsFromRanges === "function"
      ? core.stableSegmentsFromRanges(
        state.segments,
        ranges,
        state.duration,
        0.85,
      )
      : core.subtractRanges(state.segments, ranges, state.duration).filter(
        (segment) => segment.end - segment.start >= 0.85,
      );
    if (!next.length) return 0;
    state.segments = next;
    state.selectedSegmentId = state.segments[0].id;
    return Math.max(0, before - core.outputDuration(state.segments));
  };

  const analyzeTakes = async () => {
    if (state.analyzing || !state.clips.length) return null;
    state.analyzing = true;
    state.analysis = [];
    state.qualityRanges = [];
    elements.smartAnalysis.hidden = false;
    elements.smartAnalysis.classList.add("is-running");
    elements.smartAnalysis.classList.remove("is-complete");
    elements.analysisSummary.textContent = "Lendo movimento e nitidez…";
    elements.analysisDetail.textContent = "Tudo acontece neste dispositivo";
    elements.analysisApproved.textContent = "…";
    elements.analysisRemoved.textContent = "…";
    elements.analysisMusic.textContent = state.musicUrl ? "pronta" : "pendente";
    setBusy(elements.analyzeTakes, true, "Analisando…");
    try {
      const analyzer = await loadWasmAnalyzer();
      elements.analysisDetail.textContent = analyzer
        ? "WebAssembly ativo · análise acelerada no dispositivo"
        : "Análise compatível ativa neste dispositivo";
      for (let index = 0; index < state.clips.length; index += 1) {
        state.analysis.push(
          await analyzeClipQuality(
            state.clips[index],
            index,
            state.clips.length,
            analyzer,
          ),
        );
      }
      state.qualityRanges = mergeQualityRanges(
        state.analysis.flatMap((result) => result.ranges),
      );
      if (state.projectType === "aftermovie") {
        state.segments = core.normalizeSegments(
          state.analysis.map((result, index) => {
            const source = state.segments.find((segment) =>
              segment.clipId === result.clipId
            );
            return {
              ...(source || {}),
              id: source?.id || `highlight-${result.clipId}`,
              clipId: result.clipId,
              start: result.bestWindow.start,
              end: result.bestWindow.end,
              speed: source?.speed || (index % 3 === 1 ? "1.25" : "1"),
              motion: source?.motion || "none",
            };
          }),
          state.duration,
        );
        state.selectedSegmentId = state.segments[0]?.id || "";
      }
      const removed = applyQualityCuts(state.qualityRanges);
      const approved = core.outputDuration(state.segments);
      const averageScore = state.analysis.reduce(
        (sum, item) => sum + item.score,
        0,
      ) / Math.max(1, state.analysis.length);
      elements.analysisSummary.textContent = state.projectType === "aftermovie"
        ? "Melhores momentos selecionados e montagem limpa"
        : state.qualityRanges.length
        ? "Montagem limpa e estabilizada por corte"
        : "Seus takes estão visualmente estáveis";
      elements.analysisDetail.textContent = `${state.analysis.length} ${
        state.analysis.length === 1 ? "take analisado" : "takes analisados"
      } · qualidade média ${Math.round(averageScore * 100)}%`;
      elements.analysisApproved.textContent = core.formatTime(approved);
      elements.analysisRemoved.textContent = core.formatTime(removed);
      elements.smartAnalysis.classList.remove("is-running");
      elements.smartAnalysis.classList.add("is-complete");
      selectSegment(state.selectedSegmentId, true);
      renderTimeline();
      setStatus(
        removed > 0.05
          ? `${
            core.formatTime(removed, true)
          } de tremor, desfoque ou exposição ruim removidos.`
          : "Análise concluída: não encontrei trechos críticos para remover.",
        "success",
      );
      return { removed, approved, score: averageScore };
    } catch (error) {
      elements.analysisSummary.textContent =
        "Não foi possível concluir a análise";
      elements.analysisDetail.textContent = error.message ||
        "O navegador interrompeu a leitura dos quadros.";
      elements.smartAnalysis.classList.remove("is-running");
      setStatus(elements.analysisDetail.textContent, "error");
      return null;
    } finally {
      state.analyzing = false;
      setBusy(elements.analyzeTakes, false);
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
    state.muteOriginal = Boolean(elements.muteTakes[0]?.checked);
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
        musicVolume: 72,
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
        musicVolume: 48,
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
        musicVolume: 52,
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
    state.musicVolume = recipe.musicVolume / 100;
    state.cleanVoice = recipe.cleanVoice;
    elements.contrast.value = recipe.contrast;
    elements.saturation.value = recipe.saturation;
    elements.warmth.value = recipe.warmth;
    elements.volume.value = recipe.volume;
    elements.musicVolume.value = recipe.musicVolume;
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
    elements.musicMixStatus.textContent = "Sem trilha";
    elements.analysisMusic.textContent = "sem trilha";
    elements.musicVolume.disabled = true;
    elements.removeMusic.disabled = true;
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
    elements.musicVolume.disabled = false;
    elements.removeMusic.disabled = false;
    elements.musicMixStatus.textContent = `Pronta · ${
      Math.round(state.musicVolume * 100)
    }%`;
    elements.analysisMusic.textContent = "pronta";
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

  const getMusicApiEndpoint = () =>
    String(
      $('meta[name="spark-music-api"]')?.getAttribute("content") || "",
    ).trim();

  const decodeBase64Audio = (encoded, type = "audio/mpeg") => {
    const raw = globalThis.atob(encoded);
    const bytes = new Uint8Array(raw.length);
    for (let index = 0; index < raw.length; index += 1) {
      bytes[index] = raw.charCodeAt(index);
    }
    return new Blob([bytes], { type });
  };

  const requestExternalMusic = async (description, duration, preset) => {
    const endpoint = getMusicApiEndpoint();
    if (!endpoint) return null;
    const response = await fetch(endpoint, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        prompt: description,
        duration: core.clamp(Math.round(duration || 45), 8, 180),
        preset,
        projectType: state.projectType,
      }),
    });
    if (!response.ok) {
      let message = "O serviço externo de música não respondeu.";
      try {
        const body = await response.json();
        if (body?.error) message = String(body.error);
      } catch (_error) {
        // O fallback local assume quando o provedor não envia JSON.
      }
      throw new Error(message);
    }
    const type = response.headers.get("content-type") || "";
    if (type.startsWith("audio/")) return response.blob();
    const body = await response.json();
    if (body.audioBase64) {
      return decodeBase64Audio(body.audioBase64, body.mimeType);
    }
    if (body.audioUrl) {
      const audioResponse = await fetch(body.audioUrl);
      if (!audioResponse.ok) {
        throw new Error("A música foi criada, mas não pôde ser baixada.");
      }
      return audioResponse.blob();
    }
    throw new Error("O serviço externo não retornou um arquivo de áudio.");
  };

  const masterMusicFallback = (samples, targetPeak = 0.92) => {
    let peak = 0;
    let energy = 0;
    for (let index = 0; index < samples.length; index += 1) {
      const value = samples[index];
      peak = Math.max(peak, Math.abs(value));
      energy += value * value;
    }
    const rms = Math.sqrt(energy / Math.max(1, samples.length));
    const gain = Math.min(
      peak ? targetPeak / peak : 1,
      rms ? 0.2 / rms : 1,
      3.2,
    );
    const saturation = Math.tanh(1.35);
    for (let index = 0; index < samples.length; index += 1) {
      samples[index] = Math.tanh(samples[index] * gain * 1.35) / saturation;
    }
    return samples;
  };

  const generateMusicSamples = (description, duration, preset) => {
    const sampleRate = 32000;
    const mobile = globalThis.matchMedia?.("(max-width: 780px)")?.matches;
    const safeDuration = core.clamp(duration || 45, 20, mobile ? 60 : 120);
    const length = Math.ceil(safeDuration * sampleRate);
    const samples = new Float32Array(length);
    const words = `${description} ${preset}`.toLowerCase();
    const cinematic = /cinema|emoc|rise|dram/.test(words);
    const gentle = /calm|leve|suave|golden|acoustic/.test(words);
    const bpm = gentle ? 94 : cinematic ? 110 : 126;
    const beat = 60 / bpm;
    const seed = musicSeed(words);
    const roots = cinematic
      ? [110, 130.81, 146.83, 98]
      : gentle
      ? [130.81, 164.81, 196, 146.83]
      : [110, 146.83, 130.81, 164.81];
    const chord = cinematic ? [1, 1.189207, 1.498307] : [1, 1.259921, 1.498307];
    const barDuration = beat * 4;
    const brightness = cinematic ? 0.5 : gentle ? 0.62 : 0.82;
    let noiseState = seed || 1;
    let previousNoise = 0;

    for (let index = 0; index < length; index += 1) {
      const time = index / sampleRate;
      const progress = time / safeDuration;
      const barPosition = time % barDuration;
      const barIndex = Math.floor(time / barDuration);
      const root = roots[barIndex % roots.length];
      const energy = progress < 0.1
        ? 0.22 + progress * 3.8
        : progress < 0.34
        ? 0.68 + (progress - 0.1) * 1.15
        : progress < 0.72
        ? 1
        : progress < 0.8
        ? 0.34
        : progress < 0.94
        ? 1.08
        : Math.max(0.18, (1 - progress) * 16);
      const kickPosition = time % beat;
      const kickEnabled = progress > 0.08 &&
        !(progress > 0.72 && progress < 0.8);
      const kick = kickEnabled && kickPosition < 0.18
        ? Math.sin(
          2 * Math.PI * (58 * kickPosition - 32 * kickPosition ** 2),
        ) * Math.exp(-kickPosition * 23)
        : 0;
      noiseState ^= noiseState << 13;
      noiseState ^= noiseState >>> 17;
      noiseState ^= noiseState << 5;
      const noise = (noiseState >>> 0) / 2147483648 - 1;
      const brightNoise = noise - previousNoise * 0.82;
      previousNoise = noise;
      const hatPosition = time % (beat / 2);
      const hat = hatPosition < 0.045
        ? brightNoise * Math.exp(-hatPosition * 78)
        : 0;
      const snarePosition = (time + beat) % (beat * 2);
      const snare = snarePosition < 0.16
        ? (brightNoise * 0.78 +
          Math.sin(2 * Math.PI * 176 * snarePosition) * 0.22) *
          Math.exp(-snarePosition * 19)
        : 0;
      const pulseGate = (time % (beat / 2)) < beat * 0.3 ? 1 : 0.12;
      const bass = (
        Math.sin(2 * Math.PI * (root / 2) * time) * 0.78 +
        Math.sin(2 * Math.PI * (root / 4) * time) * 0.22
      ) * pulseGate;
      const pad = (
        Math.sin(2 * Math.PI * root * chord[0] * time) +
        Math.sin(2 * Math.PI * root * chord[1] * time) * 0.72 +
        Math.sin(2 * Math.PI * root * chord[2] * time) * 0.58
      ) / 2.3;
      const arpStep = Math.floor(time / (beat / 2));
      const arpFrequency = root * 2 * chord[arpStep % chord.length];
      const arpPosition = time % (beat / 2);
      const arp = Math.sin(2 * Math.PI * arpFrequency * time) *
        Math.exp(-arpPosition * (gentle ? 5.5 : 8));
      const barEdge = Math.min(
        1,
        barPosition / 0.045,
        (barDuration - barPosition) / 0.045,
      );
      const transition = barIndex % 8 === 7
        ? brightNoise * Math.max(0, (barPosition / barDuration - 0.72) * 0.16)
        : 0;
      const sidechain = kickEnabled
        ? 0.58 + 0.42 * Math.min(1, kickPosition / 0.14)
        : 1;
      const fade = Math.min(1, time / 0.9, (safeDuration - time) / 1.7);
      const drums = kick * 0.5 + snare * 0.18 * energy +
        hat * 0.085 * brightness * energy;
      const harmony = (
        bass * 0.2 * energy +
        pad * 0.15 * barEdge +
        arp * 0.1 * brightness * Math.max(0.25, energy)
      ) * sidechain;
      samples[index] = (drums + harmony + transition) * Math.max(0, fade);
    }
    return { samples, sampleRate };
  };

  const createMusic = async () => {
    const mode = elements.soundtrackMode.value;
    const preset = elements.musicLibrary.value;
    const description = String(elements.musicPrompt.value || "").trim() ||
      String(elements.projectNiche.value || "").trim() ||
      (state.projectType === "aftermovie"
        ? "eletrônica crescente, enérgica e cinematográfica"
        : "moderna, leve e discreta para conteúdo");
    if (mode === "ai" && !description) {
      setStatus("Descreva o clima da trilha que você quer gerar.", "error");
      elements.musicPrompt.focus();
      return;
    }
    setBusy(elements.createMusic, true, "Criando…");
    elements.musicMixStatus.textContent = "Criando…";
    try {
      const duration = core.outputDuration(state.segments);
      if (["auto", "ai"].includes(mode) && getMusicApiEndpoint()) {
        try {
          const externalMusic = await requestExternalMusic(
            description,
            duration,
            preset,
          );
          if (externalMusic) {
            await useMusicBlob(externalMusic, "Trilha criada pela IA");
            return;
          }
        } catch (externalError) {
          setStatus(
            `${externalError.message} Criando uma versão local agora…`,
          );
        }
      }
      await new Promise((resolve) => globalThis.setTimeout(resolve, 30));
      const generated = generateMusicSamples(
        description,
        duration,
        preset,
      );
      elements.musicMixStatus.textContent = "Masterizando…";
      const analyzer = await loadWasmAnalyzer();
      let wasmMastered = false;
      if (analyzer) {
        try {
          analyzer.master(generated.samples, 0.92);
          wasmMastered = true;
        } catch (_error) {
          masterMusicFallback(generated.samples, 0.92);
        }
      } else {
        masterMusicFallback(generated.samples, 0.92);
      }
      await useMusicBlob(
        encodeWav(generated.samples, generated.sampleRate),
        mode === "library"
          ? "Trilha do banco Spark"
          : wasmMastered
          ? "Trilha generativa masterizada"
          : "Trilha generativa local",
      );
    } catch (error) {
      elements.musicMixStatus.textContent = "Não criada";
      setStatus(error.message || "Não foi possível criar a trilha.", "error");
    } finally {
      setBusy(elements.createMusic, false);
    }
  };

  const importMusic = async (file) => {
    const compatible = file && (
      String(file.type).startsWith("audio/") ||
      /\.(mp3|wav|m4a|aac|ogg|oga|opus|flac|aiff?|caf)$/i.test(file.name)
    );
    if (!compatible) {
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
      ? getMusicApiEndpoint() ? "Gerar com IA" : "Gerar versão local"
      : "Usar trilha";
    if (mode === "upload") elements.musicInput.click();
    if (mode === "none") {
      clearMusic();
      setStatus("Projeto configurado sem trilha sonora.");
    }
  };

  const ensureAutomaticMusic = async () => {
    const mode = elements.soundtrackMode.value;
    if (mode === "none") {
      elements.analysisMusic.textContent = "sem trilha";
      return false;
    }
    if (mode === "upload") {
      elements.analysisMusic.textContent = state.musicUrl
        ? "pronta"
        : "aguardando";
      return Boolean(state.musicUrl);
    }
    if (state.musicUrl) {
      elements.analysisMusic.textContent = "pronta";
      return true;
    }
    const direction = String(elements.projectNiche.value || "").trim();
    const words = direction.toLocaleLowerCase("pt-BR");
    const preset = /emoc|cinema|elegante|institucional/.test(words)
      ? "cinematic"
      : state.projectType === "content" || /leve|calm|delicad/.test(words)
      ? "golden"
      : "pulse";
    elements.musicLibrary.value = preset;
    if (!elements.musicPrompt.value.trim()) {
      elements.musicPrompt.value = direction || (
        state.projectType === "aftermovie"
          ? "trilha eletrônica crescente, enérgica e cinematográfica"
          : "trilha moderna, leve e discreta para conteúdo"
      );
    }
    elements.analysisMusic.textContent = "criando…";
    await createMusic();
    elements.analysisMusic.textContent = state.musicUrl ? "pronta" : "falhou";
    return Boolean(state.musicUrl);
  };

  const createCompleteVideo = async () => {
    if (state.analyzing || !state.clips.length) return;
    setupAudioGraph().catch(() => {});
    setBusy(elements.applyRecipe, true, "Analisando e montando…");
    try {
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
      applyRecipe();
      const analysis = await analyzeTakes();
      if (!analysis) {
        throw new Error(
          "A montagem foi iniciada, mas a análise dos takes não pôde ser concluída.",
        );
      }
      const hasMusic = await ensureAutomaticMusic();
      if (!hasMusic && elements.soundtrackMode.value !== "none") {
        throw new Error(
          elements.soundtrackMode.value === "upload"
            ? "A montagem está pronta, mas falta selecionar a trilha que será exportada."
            : "A montagem está pronta, mas a trilha não pôde ser criada. Tente gerar uma nova trilha.",
        );
      }
      elements.smartAnalysis.hidden = false;
      elements.smartAnalysis.classList.add("is-complete");
      if (elements.captionMode.value === "auto") {
        globalThis.setTimeout(() => transcribe(), 0);
      }
      setStatus(
        `Primeira versão pronta${
          analysis?.removed > 0.05
            ? ` · ${
              core.formatTime(analysis.removed, true)
            } instáveis removidos`
            : " · takes aprovados"
        }${hasMusic ? " · trilha adicionada" : ""}.`,
        "success",
      );
    } catch (error) {
      setStatus(error.message || "Não foi possível montar o vídeo.", "error");
    } finally {
      setBusy(elements.applyRecipe, false);
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
    state.exportStream?.getTracks().forEach((track) => track.stop());
    state.exportStream = null;
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
      state.exportError = "";
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
        ...state.audio.destination.stream.getAudioTracks().map((track) =>
          track.clone()
        ),
      ];
      const stream = new MediaStream(tracks);
      state.exportStream = stream;
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
          setStatus(
            state.exportError || "Exportação cancelada.",
            state.exportError ? "error" : "",
          );
          elements.exportProgress.hidden = true;
        }
        cleanupExport();
      }, { once: true });
      state.recorder.addEventListener("error", () => {
        state.exportCancelled = true;
        state.exportError =
          "O navegador interrompeu a exportação. Tente uma qualidade menor ou um vídeo mais curto.";
        setStatus(state.exportError, "error");
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
      const videoPlayback = elements.video.play();
      const audioPlayback = playMixAudio();
      state.recorder.start(1000);
      await videoPlayback;
      await audioPlayback;
      setStatus(
        "Renderizando no dispositivo. A prévia ficará sem som durante a exportação.",
      );
    } catch (error) {
      state.exportCancelled = true;
      state.exportError = error.message ||
        "Não foi possível iniciar a exportação.";
      setStatus(state.exportError, "error");
      if (state.recorder && state.recorder.state !== "inactive") {
        state.recorder.stop();
      } else {
        cleanupExport();
      }
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
    elements.musicVolumeOutput.textContent = `${
      Math.round(state.musicVolume * 100)
    }%`;
    if (state.musicUrl) {
      elements.musicMixStatus.textContent = `Pronta · ${
        Math.round(state.musicVolume * 100)
      }%`;
    }
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
      setMuteOriginal(state.projectType === "aftermovie");
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
    elements.regenerateMusic.addEventListener("click", () => {
      if (["none", "upload"].includes(elements.soundtrackMode.value)) {
        elements.soundtrackMode.value = "auto";
        updateSoundtrackControls();
      }
      clearMusic();
      createMusic();
    });
    elements.removeMusic.addEventListener("click", () => {
      elements.soundtrackMode.value = "none";
      updateSoundtrackControls();
      setStatus("Trilha removida da montagem.", "success");
    });
    elements.muteTakes.forEach((input) =>
      input.addEventListener("change", () => {
        setMuteOriginal(input.checked);
        setStatus(
          input.checked
            ? "Áudio dos takes silenciado. A exportação usará apenas a trilha e a narração."
            : "Áudio original dos takes reativado.",
          "success",
        );
      })
    );
    elements.musicVolume.addEventListener("input", () => {
      state.musicVolume = Number(elements.musicVolume.value) / 100;
      if (state.musicUrl) {
        elements.musicMixStatus.textContent = `Pronta · ${
          Math.round(state.musicVolume * 100)
        }%`;
      }
      updateOutputs();
      updateAudioGraph();
    });
    elements.musicInput.addEventListener("change", () => {
      importMusic(elements.musicInput.files?.[0]).catch((error) => {
        setStatus(
          error.message || "Não foi possível carregar a trilha.",
          "error",
        );
      });
    });
    elements.applyRecipe.addEventListener("click", createCompleteVideo);
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
    elements.analyzeTakes.addEventListener("click", analyzeTakes);
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
    const warmWasm = () => loadWasmAnalyzer();
    if (typeof globalThis.requestIdleCallback === "function") {
      globalThis.requestIdleCallback(warmWasm, { timeout: 2500 });
    } else {
      globalThis.setTimeout(warmWasm, 500);
    }
  }
})();
