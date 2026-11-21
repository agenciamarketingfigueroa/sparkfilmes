(function (root) {
  "use strict";
  const fields = ["id", "title", "date", "time", "venue", "address", "photography", "video", "students", "notes", "reference", "instagram", "gallery", "googleMaps", "locationNote"];
  function normalize(input) {
    if (!input || typeof input !== "object") throw new Error("Dados do evento inválidos.");
    const event = {};
    fields.forEach(key => { event[key] = String(input[key] ?? "").trim().slice(0, key === "notes" ? 4000 : 600); });
    if (!event.id || !event.title || !event.venue || !event.address) throw new Error("Preencha título, local e endereço.");
    if (!/^\d{4}-\d{2}-\d{2}$/.test(event.date) || !Number.isFinite(new Date(event.date + "T12:00:00Z").getTime()) || new Date(event.date + "T12:00:00Z").toISOString().slice(0, 10) !== event.date) throw new Error("Informe uma data válida.");
    if (!/^([01]\d|2[0-3]):[0-5]\d$/.test(event.time)) throw new Error("Informe um horário válido.");
    event.arrivalMinutes = Number(input.arrivalMinutes ?? 30);
    if (!Number.isInteger(event.arrivalMinutes) || event.arrivalMinutes < 30 || event.arrivalMinutes > 1440) throw new Error("A antecedência deve ser de 30 a 1.440 minutos.");
    for (const key of ["instagram", "gallery", "googleMaps"]) {
      if (event[key]) {
        let url;
        try { url = new URL(event[key]); } catch { throw new Error("Informe links completos, começando por https://."); }
        if (url.protocol !== "https:") throw new Error("Use links seguros com https://.");
        if (key === "instagram" && !["instagram.com", "www.instagram.com"].includes(url.hostname)) throw new Error("Informe um link do Instagram.");
        if (key === "googleMaps" && !["google.com", "www.google.com", "maps.google.com", "maps.app.goo.gl", "share.google"].includes(url.hostname)) throw new Error("Informe um link do Google Maps.");
      }
    }
    event.photos = Array.isArray(input.photos) ? input.photos.slice(0, 6).map(photo => {
      const src = String(photo.src || "");
      if (!/^\/assets\/img\/agenda\/[a-zA-Z0-9_-]+\.(jpg|png|webp)$/.test(src)) throw new Error("Imagem do local inválida.");
      return { src, alt: String(photo.alt || "Foto do local").slice(0, 300), caption: String(photo.caption || "").slice(0, 120) };
    }) : [];
    return event;
  }
  function arrival(event) {
    const date = new Date(event.date + "T" + event.time + ":00Z");
    date.setUTCMinutes(date.getUTCMinutes() - event.arrivalMinutes);
    return { date: date.toISOString().slice(0, 10), time: date.toISOString().slice(11, 16) };
  }
  function encode(event) {
    const bytes = new TextEncoder().encode(JSON.stringify(normalize(event)));
    return btoa(Array.from(bytes, byte => String.fromCharCode(byte)).join("")).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
  }
  function decode(value) {
    if (value.length > 30000) throw new Error("Link de evento muito longo.");
    const raw = atob(value.replace(/-/g, "+").replace(/_/g, "/"));
    return normalize(JSON.parse(new TextDecoder().decode(Uint8Array.from(raw, c => c.charCodeAt(0)))));
  }
  function eventUrl(event, base, snapshot = false) {
    const url = new URL("evento.html", base);
    url.search = ""; url.hash = "";
    if (snapshot) url.hash = "evento=" + encode(event);
    else url.searchParams.set("id", event.id);
    return url.href;
  }
  function maps(event) {
    const query = encodeURIComponent(event.address);
    return { google: event.googleMaps || "https://www.google.com/maps/search/?api=1&query=" + query, waze: "https://www.waze.com/ul?q=" + query + "&navigate=yes" };
  }
  function merge(seed, saved) {
    const result = new Map(seed.map(event => [event.id, normalize(event)]));
    saved.forEach(event => { const valid = normalize(event); result.set(valid.id, valid); });
    return [...result.values()].sort((a, b) => (a.date + a.time).localeCompare(b.date + b.time));
  }
  root.SparkAgenda = { normalize, arrival, encode, decode, eventUrl, maps, merge };
})(globalThis);
