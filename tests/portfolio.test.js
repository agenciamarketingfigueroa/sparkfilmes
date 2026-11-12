// DOM integration checks; native dialog behavior and layout still need browser QA.
// Run: deno run --allow-read tests/portfolio.test.js
import assert from "node:assert/strict";
import { runInNewContext } from "node:vm";
import { parseHTML } from "npm:linkedom@0.18.12";

const html = await Deno.readTextFile(new URL("../portfolio/index.html", import.meta.url));
const script = await Deno.readTextFile(new URL("../assets/js/portfolio.js", import.meta.url));
const catalog = JSON.parse((await Deno.readTextFile(new URL("../data/portfolio.json", import.meta.url))).replace(/^\uFEFF/, ""));
const settle = async () => { for (let i = 0; i < 8; i++) await Promise.resolve(); };

async function setup(fetchData = async () => ({ ok: true, json: async () => catalog })) {
  const { document, Event, HTMLElement } = parseHTML(html);
  let focused = null;
  HTMLElement.prototype.focus = function () { focused = this; };
  const dialog = document.querySelector("dialog");
  dialog.showModal = () => { dialog.open = true; };
  dialog.close = () => { dialog.open = false; dialog.dispatchEvent(new Event("close")); };
  runInNewContext(script, { document, window: {}, fetch: fetchData, URL });
  await settle();
  return { document, Event, dialog, focused: () => focused, click: (element) => element.dispatchEvent(new Event("click", { bubbles: true })) };
}

const app = await setup();
const { document, click, dialog, Event } = app;
const grid = document.querySelector("#film-grid");
const more = document.querySelector("[data-film-more]");
assert.equal(grid.children.length, 6);
assert.equal(grid.querySelectorAll(".film-card--wide").length, 2);
assert.equal(document.querySelectorAll("iframe").length, 0, "Players must not load before a visitor selects a film");
assert.equal(document.querySelector('[data-film-count="all"]').textContent, "25");

const first = grid.firstElementChild;
click(more);
assert.equal(grid.children.length, 12);
assert.equal(grid.firstElementChild, first, "Loading more must preserve existing posters and focus targets");
assert.equal(app.focused(), grid.children[6].querySelector("button"));
while (!more.hidden) click(more);
assert.equal(grid.children.length, 25);
assert.equal(new Set([...grid.querySelectorAll("h3")].map((el) => el.textContent)).size, 25);

for (const button of grid.querySelectorAll(".film-poster")) {
  click(button);
  assert(dialog.open);
  const iframe = dialog.querySelector("iframe");
  assert(iframe);
  assert(["www.youtube-nocookie.com", "drive.google.com"].includes(new URL(iframe.src).hostname));
  assert.equal(iframe.title, button.getAttribute("aria-label").replace("Assistir: ", ""));
  assert(document.body.classList.contains("film-is-open"));
  click(dialog.querySelector(".film-close"));
  assert.equal(dialog.querySelectorAll("iframe").length, 0, "Closing must remove the player and stop playback");
  assert(!document.body.classList.contains("film-is-open"));
  assert.equal(app.focused(), button);
}

click(document.querySelector('[data-film-filter="reels"]'));
assert.equal(grid.children.length, 8);
assert.equal(grid.querySelectorAll(".film-card--wide").length, 0);
while (!more.hidden) click(more);
assert.equal(grid.children.length, 17);
click(document.querySelector('[data-film-filter="cursos"]'));
assert.equal(grid.children.length, 6);
assert.equal(grid.querySelectorAll(".film-card--wide").length, 6);
click(more);
assert.equal(grid.children.length, 8);
assert.equal(document.querySelectorAll('[data-film-filter][aria-pressed="true"]').length, 1);

// A failed cover retains a labeled, playable poster instead of a broken image.
const cover = grid.querySelector("img");
cover.dispatchEvent(new Event("error"));
assert(cover.src.endsWith("sddefault.jpg"));
cover.dispatchEvent(new Event("error"));
assert(cover.src.endsWith("hqdefault.jpg"));
cover.dispatchEvent(new Event("error"));
assert(!cover.isConnected);
assert(grid.querySelector(".film-poster-fallback strong").textContent.length > 0);

let failed = true;
const recovery = await setup(async () => {
  if (failed) throw new Error("Offline");
  return { ok: true, json: async () => catalog };
});
assert.equal(recovery.document.querySelector("[data-film-error]").hidden, false);
assert.equal(recovery.document.querySelector("#film-grid").getAttribute("aria-busy"), "false");
failed = false;
recovery.click(recovery.document.querySelector("[data-film-retry]"));
await settle();
assert.equal(recovery.document.querySelector("[data-film-error]").hidden, true);
assert.equal(recovery.document.querySelector("#film-grid").children.length, 6);
console.log("Portfolio checks passed: all 25 films, format filters, pagination, lazy players, dialog cleanup/focus, failed covers and fetch recovery.");
