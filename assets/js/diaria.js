(() => {
  const dialog = document.querySelector(".daily-page .film-dialog");
  if (!dialog) return;
  const screen = dialog.querySelector("[data-daily-screen]");
  let opener = null;

  document.querySelectorAll("[data-daily-video]").forEach((button) => {
    const img = button.querySelector("img");
    const fallbackQualities = ["sddefault", "hqdefault"];
    let nextQuality = 0;
    const coverFailed = () => {
      img.classList.remove("is-loaded");
      button.classList.remove("has-cover");
      if (nextQuality < fallbackQualities.length) {
        img.src = `https://i.ytimg.com/vi/${button.dataset.dailyVideo}/${fallbackQualities[nextQuality++]}.jpg`;
      } else {
        img.remove();
      }
    };
    const coverLoaded = () => {
      // YouTube can return a tiny placeholder even with an HTTP success response.
      if (img.naturalWidth < 200) { coverFailed(); return; }
      img.classList.add("is-loaded");
      button.classList.add("has-cover");
    };
    img.addEventListener("load", coverLoaded);
    img.addEventListener("error", coverFailed);
    if (img.complete) coverLoaded();

    button.addEventListener("click", () => {
      const id = button.dataset.dailyVideo;
      if (!/^[\w-]{11}$/.test(id)) return;
      const original = `https://www.youtube.com/watch?v=${id}`;
      if (typeof dialog.showModal !== "function") {
        window.open(original, "_blank", "noopener,noreferrer");
        return;
      }
      const card = button.closest(".film-card");
      const title = card.querySelector("h3").textContent;
      const isVertical = button.dataset.videoRatio !== "16:9";
      screen.classList.toggle("is-vertical", isVertical);
      dialog.querySelector("[data-daily-format]").textContent = `Trabalhos SparkFilmes / ${isVertical ? "9:16" : "16:9"}`;
      dialog.querySelector("#daily-film-title").textContent = title;
      dialog.querySelector("#daily-film-description").textContent = card.querySelector(".film-caption p").textContent;
      dialog.querySelector("[data-daily-source]").href = original;
      const iframe = document.createElement("iframe");
      iframe.src = `https://www.youtube-nocookie.com/embed/${id}?autoplay=1&rel=0&playsinline=1`;
      iframe.title = title;
      iframe.allow = "autoplay; fullscreen; picture-in-picture; encrypted-media";
      iframe.allowFullscreen = true;
      iframe.referrerPolicy = "strict-origin-when-cross-origin";
      screen.replaceChildren(iframe);
      opener = button;
      document.body.classList.add("film-is-open");
      dialog.showModal();
    });
  });

  dialog.querySelector(".film-close").addEventListener("click", () => dialog.close());
  dialog.addEventListener("close", () => {
    screen.replaceChildren();
    document.body.classList.remove("film-is-open");
    if (opener?.isConnected) opener.focus({ preventScroll: true });
    opener = null;
  });
  dialog.addEventListener("cancel", () => screen.replaceChildren());
  let backdropPress = false;
  dialog.addEventListener("pointerdown", (event) => { backdropPress = event.target === dialog; });
  dialog.addEventListener("click", (event) => {
    if (backdropPress && event.target === dialog) dialog.close();
    backdropPress = false;
  });
})();
