// Run: deno run --allow-read tests/diaria.test.js
import assert from "node:assert/strict";
import { runInNewContext } from "node:vm";
import { parseHTML } from "npm:linkedom@0.18.12";

const html = await Deno.readTextFile(new URL("../producao/index.html", import.meta.url));
const code = await Deno.readTextFile(new URL("../assets/js/diaria.js", import.meta.url));
const catalog = JSON.parse((await Deno.readTextFile(new URL("../data/portfolio.json", import.meta.url))).replace(/^\uFEFF/, ""));
const { document, Event, HTMLElement } = parseHTML(html);
const dialog = document.querySelector("dialog");
let focused = null;
HTMLElement.prototype.focus = function () { focused = this; };
dialog.showModal = () => { dialog.open = true; };
dialog.close = () => { dialog.open = false; dialog.dispatchEvent(new Event("close")); };
const click = (element) => element.dispatchEvent(new Event("click", { bubbles: true }));

const offers = JSON.parse(document.querySelector('script[type="application/ld+json"]').textContent).offers;
assert.deepEqual(offers.map((offer) => offer.price), ["600.00", "1200.00"]);
const plans = [...document.querySelectorAll(".daily-plan")];
assert.equal(plans.length, 2);
assert.equal(plans[0].querySelector(".daily-duration").textContent, "3 a 4 horas de gravação");
assert.equal(plans[1].querySelector(".daily-duration").textContent, "6 a 8 horas de gravação");
assert.equal(plans[0].querySelector(".daily-price").textContent, "R$600");
assert.equal(plans[1].querySelector(".daily-price").textContent, "R$1.200");
assert.equal(plans[0].querySelector("ul").textContent, plans[1].querySelector("ul").textContent, "Both plans include the same production services");
for (const [index, plan] of plans.entries()) {
  const link = new URL(plan.querySelector("[data-daily-plan]").getAttribute("href"));
  assert.equal(link.origin + link.pathname, "https://wa.me/5531999427901");
  const message = link.searchParams.get("text");
  assert(message.includes(index ? "R$1.200" : "R$600"), `Unexpected WhatsApp message: ${message}`);
  assert(message.includes(index ? "6 a 8 horas" : "3 a 4 horas"));
  assert.equal(plan.querySelector("a").getAttribute("rel"), "noopener noreferrer");
}
assert.equal(document.querySelector("main").lastElementChild.id, "opcoes", "Prices belong at the end of the page");
assert(!/50%|Black Friday|poucos horários/i.test(document.querySelector("main").textContent), "Do not copy promotion-specific conditions");
assert(document.querySelectorAll('a[href="../portfolio/index.html"]').length >= 2);

runInNewContext(code, { document, window: {} });
assert.equal(document.querySelectorAll("iframe").length, 0);
const buttons = [...document.querySelectorAll("[data-daily-video]")];
assert.equal(buttons.length, 5);
assert.equal(buttons.filter((button) => button.dataset.videoRatio === "16:9").length, 2);
assert.equal(buttons.filter((button) => button.dataset.videoRatio === "9:16").length, 3);
for (const button of buttons) {
  assert(button.querySelector("img").getAttribute("src").endsWith("maxresdefault.jpg"), "Use the highest available cover resolution first");
  const item = [...catalog.reels, ...catalog.cursos].find((item) => item.id.includes(button.dataset.dailyVideo));
  assert(item, "The selection must come from the real portfolio");
  assert.equal(button.dataset.videoRatio, item.ratio);
  click(button);
  assert(dialog.open);
  const iframe = dialog.querySelector("iframe");
  assert.equal(new URL(iframe.src).hostname, "www.youtube-nocookie.com");
  assert(iframe.src.includes(button.dataset.dailyVideo));
  assert.equal(iframe.title, button.closest("article").querySelector("h3").textContent);
  assert.equal(dialog.querySelector("[data-daily-screen]").classList.contains("is-vertical"), item.ratio === "9:16", "Player must match the selected video's orientation");
  assert.equal(dialog.querySelector("[data-daily-format]").textContent, `Trabalhos SparkFilmes / ${item.ratio}`);
  assert(document.body.classList.contains("film-is-open"));
  click(dialog.querySelector(".film-close"));
  assert.equal(document.querySelectorAll("iframe").length, 0);
  assert(!document.body.classList.contains("film-is-open"));
  assert.equal(focused, button);
}
// Reopen a vertical film after a landscape film to catch stale player dimensions.
click(buttons[0]);
assert(dialog.querySelector("[data-daily-screen]").classList.contains("is-vertical"));
click(dialog.querySelector(".film-close"));
const poster = buttons[0];
poster.querySelector("img").dispatchEvent(new Event("error"));
assert(poster.querySelector("img").src.endsWith("sddefault.jpg"));
poster.querySelector("img").dispatchEvent(new Event("error"));
assert(poster.querySelector("img").src.endsWith("hqdefault.jpg"));
poster.querySelector("img").dispatchEvent(new Event("error"));
assert(!poster.classList.contains("has-cover"));
assert(!poster.querySelector("img"));
assert(poster.querySelector(".film-poster-fallback strong").textContent.length > 0);
console.log("Content-day checks passed: both prices/durations, matching inclusions, WhatsApp messages, 5 catalog videos, portrait/landscape switching, lazy players, close/focus and failed covers.");
