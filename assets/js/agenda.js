(async function () {
  "use strict";
  const core = globalThis.SparkAgenda;
  const $ = selector => document.querySelector(selector);
  const storageKey = "sparkfilmes-agenda-v1";
  const isEvent = !!$("#event-content");
  const escape = value => String(value ?? "").replace(/[&<>"']/g, char => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[char]));
  const dateLabel = (date, options = { day: "numeric", month: "long", year: "numeric" }) => new Date(date + "T12:00:00Z").toLocaleDateString("pt-BR", { ...options, timeZone: "UTC" });
  const localToday = () => new Intl.DateTimeFormat("en-CA", { timeZone: "America/Sao_Paulo", year: "numeric", month: "2-digit", day: "2-digit" }).format(new Date());
  let seed = [], saved = [], events = [], selected = localToday(), month = selected.slice(0, 7), toastTimer;
  const external = (url, label, cls = "button secondary") => `<a class="${cls}" href="${escape(url)}" target="_blank" rel="noopener noreferrer">${escape(label)}</a>`;
  const icons = {
    clock: '<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>',
    camera: '<path d="M8 5 6 8H3v12h18V8h-3l-2-3Z"/><circle cx="12" cy="13" r="3"/>',
    video: '<rect x="3" y="6" width="12" height="12" rx="2"/><path d="m15 10 6-3v10l-6-3"/>',
    play: '<circle cx="12" cy="12" r="9"/><path d="m10 8 6 4-6 4Z"/>',
    message: '<path d="M21 11a8 8 0 0 1-8 8H7l-4 3V11a9 9 0 0 1 18 0Z"/><path d="M7 10h10M7 14h6"/>',
    check: '<path d="m8 12 3 3 5-6M12 2l9 4v6c0 5-9 10-9 10S3 17 3 12V6Z"/>',
    pin: '<path d="M20 10c0 6-8 12-8 12S4 16 4 10a8 8 0 0 1 16 0Z"/><circle cx="12" cy="10" r="2.5"/>',
    calendar: '<rect x="3" y="5" width="18" height="16" rx="2"/><path d="M7 3v4m10-4v4M3 11h18M7 15h3"/>',
    people: '<circle cx="9" cy="7" r="3"/><path d="M3 21v-3a6 6 0 0 1 12 0v3M16 4a3 3 0 0 1 0 6m2 4a5 5 0 0 1 3 5v2"/>',
    copy: '<rect x="8" y="8" width="12" height="13" rx="2"/><path d="M16 8V3H3v13h5"/>',
    instagram: '<rect x="3" y="3" width="18" height="18" rx="5"/><circle cx="12" cy="12" r="4"/><circle cx="17.5" cy="6.5" r=".7" fill="currentColor" stroke="none"/>',
    spark: '<path d="m12 2 2.7 7.3L22 12l-7.3 2.7L12 22l-2.7-7.3L2 12l7.3-2.7Z"/>'
  };
  const icon = name => `<svg class="agenda-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false">${icons[name] || icons.spark}</svg>`;
  const teamPhotos = {
    delliz: { src: "../assets/img/Equipe/Delliz (Fotógrafa).png", crop: "delliz" },
    edi: { src: "../assets/img/Equipe/Edi (Fotógrafo).jpg", crop: "edi" },
    felipe: { src: "../assets/img/perfil-spark.svg", crop: "felipe" },
    bruno: { src: "../assets/img/Equipe/Burno Ocelli (Videomaker).png", crop: "bruno" },
    "bruno ocelli": { src: "../assets/img/Equipe/Burno Ocelli (Videomaker).png", crop: "bruno" }
  };
  function teamCard(names, role, symbol) {
    const members = (names || "A definir").split(/\s+e\s+|[,;\n]+/i).map(name => name.trim()).filter(Boolean);
    return `<article><span class="team-role">${icon(symbol)}${role}</span><div class="team-members">${members.map(name => {
      const key = name.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLocaleLowerCase("pt-BR");
      const photo = teamPhotos[key];
      return `<div class="team-member"><span class="team-portrait${photo ? " team-portrait-" + photo.crop : ""}">${photo ? `<img src="${escape(photo.src)}" alt="Foto de ${escape(name)}" width="88" height="88" loading="lazy" decoding="async"/>` : icon(symbol)}</span><h3>${escape(name)}</h3></div>`;
    }).join("")}</div></article>`;
  }
  function orientationCards(notes) {
    const sections = [];
    let section;
    for (const raw of notes.split(/\r?\n/)) {
      const line = raw.trim();
      if (!line) continue;
      const heading = line.length < 85 && /[A-ZÀ-Ý]/.test(line) && line === line.toLocaleUpperCase("pt-BR") && !/[.!?]$/.test(line);
      if (heading) { section = { title: line, lines: [] }; sections.push(section); }
      else { if (!section) { section = { title: "Orientações da produção", lines: [] }; sections.push(section); } section.lines.push(line); }
    }
    return sections.map(section => {
      const name = /ATENDIMENTO|PAIS/.test(section.title) ? "message" : /FAMÍLIA|FOTO/.test(section.title) ? "camera" : /ENCERRAMENTO|LIBERAÇÃO/.test(section.title) ? "check" : /BRINC|CRIANÇ/.test(section.title) ? "play" : /COLAÇÃO|HORÁRIO|CERIMÔNIA/.test(section.title) ? "clock" : "spark";
      const title = section.title === section.title.toLocaleUpperCase("pt-BR") ? section.title.charAt(0) + section.title.slice(1).toLocaleLowerCase("pt-BR") : section.title;
      const emphasize = text => escape(text).replace(/\b(\d{1,2}h(?:\d{2})?|\d+ minutos|\d+ min)\b/g, '<strong>$1</strong>');
      const main = section.lines.filter(line => !/^(Exemplo:|Contexto:)/i.test(line));
      const quote = section.lines.find(line => /^Exemplo:/i.test(line));
      const context = section.lines.find(line => /^Contexto:/i.test(line));
      return `<article class="orientation-card orientation-${name}"><header><span class="orientation-icon">${icon(name)}</span><h3>${escape(title)}</h3></header><ul>${main.map(line => `<li>${emphasize(line.replace(/^[-•]\s*/, ""))}</li>`).join("")}</ul>${quote ? `<blockquote>${escape(quote.replace(/^Exemplo:\s*/i, ""))}</blockquote>` : ""}${context ? `<details><summary>Por que esse cuidado?</summary><p>${escape(context.replace(/^Contexto:\s*/i, ""))}</p></details>` : ""}</article>`;
    }).join("");
  }
  function toast(message) {
    $("#toast").textContent = message;
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => { $("#toast").textContent = ""; }, 5000);
  }
  async function copy(value) {
    try { await navigator.clipboard.writeText(value); toast("Link copiado! Pronto para enviar no grupo."); }
    catch { $("#copy-value").value = value; $("#copy-dialog").showModal(); $("#copy-value").focus(); $("#copy-value").select(); }
  }
  function urlFor(event) { return core.eventUrl(event, location.href, saved.some(item => item.id === event.id)); }
  async function loadSeed() {
    const response = await fetch("../data/agenda.json", { cache: "no-cache" });
    if (!response.ok) throw new Error("Não foi possível carregar a agenda. Tente recarregar a página.");
    const data = await response.json();
    return data.events.map(core.normalize);
  }
  function card(event) {
    const arrival = core.arrival(event);
    return `<article class="agenda-event-card"><span class="event-type">Produção confirmada</span><h3>${escape(event.title)}</h3><p class="card-time">${event.time} <span>· Chegada ${arrival.time}${arrival.date !== event.date ? " do dia anterior" : ""}</span></p><p class="card-venue">${escape(event.venue)}</p><p class="card-team">Foto: ${escape(event.photography || "A definir")}<br>Vídeo: ${escape(event.video || "A definir")}</p><a class="button primary full" href="${escape(urlFor(event))}">Abrir página do evento</a><div class="card-actions"><button class="text-action" data-copy="${escape(event.id)}">Copiar link</button><button class="text-action" data-edit="${escape(event.id)}">Editar evento</button></div></article>`;
  }
  function renderCalendar() {
    const [year, number] = month.split("-").map(Number);
    const first = new Date(Date.UTC(year, number - 1, 1)).getUTCDay();
    const days = new Date(Date.UTC(year, number, 0)).getUTCDate();
    $("#month-label").textContent = dateLabel(month + "-01", { month: "long", year: "numeric" });
    let html = "";
    for (let i = 0; i < first; i++) html += '<span class="calendar-blank" aria-hidden="true"></span>';
    for (let day = 1; day <= days; day++) {
      const date = month + "-" + String(day).padStart(2, "0");
      const dayEvents = events.filter(event => event.date === date);
      html += `<button class="calendar-day${date === selected ? " selected" : ""}${dayEvents.length ? " has-event" : ""}${date === localToday() ? " is-today" : ""}" data-date="${date}" aria-pressed="${date === selected}" aria-label="${dateLabel(date)}, ${dayEvents.length} evento${dayEvents.length === 1 ? "" : "s"}" ${date === localToday() ? 'aria-current="date"' : ""}><span>${day}</span>${dayEvents.length ? `<small>${escape(dayEvents[0].title)}${dayEvents.length > 1 ? " +" + (dayEvents.length - 1) : ""}</small><i aria-hidden="true"></i>` : ""}</button>`;
    }
    $("#calendar").innerHTML = html;
    $("#selected-label").textContent = dateLabel(selected, { weekday: "long", day: "numeric", month: "long" });
    const dayEvents = events.filter(event => event.date === selected);
    $("#day-events").innerHTML = dayEvents.length ? dayEvents.map(card).join("") : '<div class="empty-day"><span aria-hidden="true">＋</span><h3>Dia livre na agenda</h3><p>Cadastre uma produção para reunir as informações da equipe.</p></div>';
  }
  function openEditor(event) {
    $("#event-form").reset();
    $("#form-status").textContent = "";
    $("#editor-title").textContent = event ? "Editar evento" : "Novo evento";
    const values = event || { id: "evento-" + crypto.randomUUID(), date: selected, arrivalMinutes: 30 };
    for (const [key, value] of Object.entries(values)) {
      const field = $("#event-form").elements.namedItem(key);
      if (field) field.value = value;
    }
    $("#event-editor").showModal();
  }
  function renderEvent(event, snapshot) {
    document.title = event.title + " | Equipe SparkFilmes";
    const arrival = core.arrival(event), maps = core.maps(event);
    const link = core.eventUrl(event, location.href, snapshot);
    const instagramHandle = event.instagram ? "@" + new URL(event.instagram).pathname.split("/").filter(Boolean)[0] : "";
    const instagramCard = event.instagram ? `<a class="venue-instagram" href="${escape(event.instagram)}" target="_blank" rel="noopener noreferrer">${icon("instagram")}<span><small>Instagram do espaço</small><strong>${escape(instagramHandle)}</strong></span><span class="instagram-action">Ver perfil</span></a>` : "";
    const venueGallery = event.photos.length ? `<section class="venue-gallery" aria-labelledby="venue-gallery-title"><header class="venue-gallery-heading"><div><p class="kicker">Antes de chegar</p><h2 id="venue-gallery-title">Conheça o espaço<span>.</span></h2><p>${escape(event.venue)}</p></div>${instagramCard}</header><div class="venue-photo-grid">${event.photos.map(photo => `<figure><a href="${escape(photo.src)}" target="_blank" rel="noopener noreferrer" aria-label="Ampliar: ${escape(photo.caption || photo.alt)}"><img src="${escape(photo.src)}" alt="${escape(photo.alt)}" width="1200" height="800" loading="lazy" decoding="async"/><span class="photo-zoom">Ampliar foto</span></a><figcaption>${escape(photo.caption)}</figcaption></figure>`).join("")}</div><p class="venue-gallery-credit">Fotos de referência de outro evento. A decoração e a montagem podem mudar.${event.gallery ? " " + external(event.gallery, event.gallery.includes("insettefotografia.com.br") ? "Fotos: Insette Fotografia" : "Crédito e galeria original", "text-action") : ""}</p></section>` : "";
    $("#event-content").innerHTML = `
      <section class="event-hero"><div><p class="kicker">${icon("spark")} Equipe Spark / ${escape(dateLabel(event.date, { weekday: "long" }))}</p><h1>${escape(event.title)}<span>.</span></h1><p class="event-date">${escape(dateLabel(event.date))} <span>·</span> ${escape(event.venue)}</p><p class="event-lead">O combinado do dia.<br>Boas memórias começam com uma equipe alinhada.</p></div><div class="hero-share"><button class="button primary" id="share-event">${icon("copy")} Copiar link do evento</button><span>Tudo aqui. Pronto para o grupo.</span></div></section>
      <div class="event-facts"><div>${icon("calendar")}<span>Data do evento</span><strong>${escape(dateLabel(event.date, { day: "2-digit", month: "2-digit" }))}</strong><small>${event.date.slice(0, 4)}</small></div><div class="arrival-fact">${icon("clock")}<span>Chegada da equipe</span><strong>${arrival.time}</strong><small>${arrival.date !== event.date ? dateLabel(arrival.date) + " · " : ""}Pelo menos ${event.arrivalMinutes} min antes</small></div><div>${icon("play")}<span>Início ${event.students ? "da formatura" : "do evento"}</span><strong>${event.time}</strong><small>Horário de Brasília</small></div>${event.students ? `<div>${icon("people")}<span>Uma turma especial</span><strong>${escape(event.students)}</strong><small>alunos</small></div>` : ""}</div>
      ${venueGallery}
      <div class="briefing-layout"><div class="briefing-main">
        <section class="briefing-section"><header class="briefing-heading"><p class="kicker">Leitura rápida / produção tranquila</p><h2>Nosso roteiro<span>.</span></h2></header><div class="arrival-reminder">${icon("clock")}<p>Todo mundo no local às <strong>${arrival.time}</strong>${arrival.date !== event.date ? " em " + dateLabel(arrival.date) : ""}.<span>São ${event.arrivalMinutes} minutos para chegar antes do início.</span></p></div>${event.notes ? `<div class="orientation-grid">${orientationCards(event.notes)}</div>` : ""}</section>
        <section class="briefing-section"><header class="briefing-heading"><p class="kicker">Quem faz acontecer</p><h2>O time do dia<span>.</span></h2></header><div class="team-grid">${teamCard(event.photography, "Fotografia", "camera")}${teamCard(event.video, "Vídeo", "video")}</div></section>
      </div><aside class="location-panel"><div class="location-illustration" aria-hidden="true">${icon("pin")}<span>A gente se encontra aqui.</span></div><div class="location-content"><p class="kicker">O ponto de encontro</p><h2>${escape(event.venue)}</h2><address>${escape(event.address)}</address><div class="location-actions">${external(maps.google, "Abrir no Google Maps", "button primary full")}${external(maps.waze, "Ir com o Waze", "button secondary full")}</div><p class="location-caption">Confira o endereço e a entrada antes de iniciar a rota.</p>${event.locationNote ? `<details><summary>Referência do endereço</summary><p>${escape(event.locationNote)}</p></details>` : ""}<hr><h3>Conheça o espaço</h3><p>Uma olhada no ambiente antes de chegar.</p><div class="location-actions">${event.instagram ? external(event.instagram, "Instagram do espaço", "button secondary full") : ""}${event.gallery ? external(event.gallery, "Ver galeria de referência", "button secondary full") : ""}${external(maps.google, "Ver local e fotos no Google", "text-action")}</div>${event.gallery.includes("insettefotografia") ? '<p class="photo-credit">Galeria externa: Insette Fotografia · Espaço Bretas 2. Fotos de outro evento; a decoração pode mudar.</p>' : ""}</div></aside></div>
      <div class="event-bottom"><p>Informações alinhadas, equipe pronta.</p><button class="button secondary" id="share-bottom">Copiar link do evento</button><button class="text-action" id="print-event">Imprimir informações</button></div>`;
    $("#share-event").onclick = $("#share-bottom").onclick = () => copy(link);
    $("#print-event").onclick = () => window.print();
  }
  try {
    if (isEvent) {
      const payload = new URLSearchParams(location.hash.slice(1)).get("evento");
      if (payload) renderEvent(core.decode(payload), true);
      else {
        seed = await loadSeed();
        const event = seed.find(item => item.id === new URLSearchParams(location.search).get("id"));
        if (!event) throw new Error("Evento não encontrado. Peça à produção o link atualizado.");
        renderEvent(event, false);
      }
      return;
    }
    seed = await loadSeed();
    try {
      const parsed = JSON.parse(localStorage.getItem(storageKey) || "[]");
      if (!Array.isArray(parsed)) throw new Error();
      saved = parsed.map(core.normalize);
    } catch { toast("Não foi possível ler os cadastros deste navegador. Os eventos publicados continuam disponíveis."); }
    events = core.merge(seed, saved);
    selected = (events.find(event => event.date >= localToday()) || events.at(-1))?.date || localToday();
    month = selected.slice(0, 7);
    $("#load-status").hidden = true;
    $("#agenda-content").hidden = false;
    $("#new-event").disabled = false;
    renderCalendar();
    $("#calendar").onclick = e => { const button = e.target.closest("[data-date]"); if (button) { selected = button.dataset.date; renderCalendar(); } };
    function changeMonth(offset) {
      const [year, number] = month.split("-").map(Number);
      month = new Date(Date.UTC(year, number - 1 + offset, 1)).toISOString().slice(0, 7);
      selected = month + "-01";
      renderCalendar();
    }
    $("#prev-month").onclick = () => changeMonth(-1);
    $("#next-month").onclick = () => changeMonth(1);
    $("#today").onclick = () => { selected = localToday(); month = selected.slice(0, 7); renderCalendar(); };
    $("#new-event").onclick = $("#add-on-date").onclick = () => openEditor();
    $("#close-editor").onclick = $("#cancel-editor").onclick = () => $("#event-editor").close();
    $("#day-events").onclick = e => {
      const copyButton = e.target.closest("[data-copy]"), editButton = e.target.closest("[data-edit]");
      if (copyButton) copy(urlFor(events.find(item => item.id === copyButton.dataset.copy)));
      if (editButton) openEditor(events.find(item => item.id === editButton.dataset.edit));
    };
    $("#event-form").onsubmit = e => {
      e.preventDefault();
      try {
        const values = Object.fromEntries(new FormData(e.currentTarget));
        const previous = events.find(item => item.id === values.id);
        const event = core.normalize({ ...values, photos: previous?.photos || [] });
        const next = [...saved.filter(item => item.id !== event.id), event];
        try { localStorage.setItem(storageKey, JSON.stringify(next)); }
        catch { throw new Error("O navegador não permitiu salvar. Libere o armazenamento e tente novamente; o formulário continua preenchido."); }
        saved = next; events = core.merge(seed, saved); selected = event.date; month = selected.slice(0, 7);
        $("#event-editor").close(); renderCalendar(); toast("Evento salvo. Copie o novo link para compartilhar com a equipe.");
      } catch (error) { $("#form-status").textContent = error.message; }
    };
  } catch (error) {
    const target = isEvent ? $("#event-content") : $("#load-status");
    target.replaceChildren();
    const message = document.createElement("p");
    message.setAttribute("role", "alert"); message.textContent = error.message;
    const retry = document.createElement("button"); retry.className = "button secondary"; retry.textContent = "Recarregar página"; retry.onclick = () => location.reload();
    target.append(message, retry);
  }
})();
