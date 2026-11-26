// Dusri website ko iframe mein dikhane ka shared code.
function num(v, d, min, max) {
  v = parseFloat(v);
  if (isNaN(v)) v = d;
  return Math.min(max, Math.max(min, v));
}

function buildFrame(it, inModal) {
  const W = num(it.width, 100, 10, 5000);
  const unit = it.unit === "px" ? "px" : "%";
  const H = num(it.height, 400, 50, 3000);
  const ox = num(it.ox, 0, 0, 20000);
  const oy = num(it.oy, 0, 0, 20000);
  const s = num(it.zoom, 100, 10, 300) / 100;

  const wrap = document.createElement("div");
  wrap.className = "frame-wrap";
  wrap.style.width = W + unit;
  wrap.style.height = inModal ? "min(" + H + "px, 80vh)" : H + "px";

  const f = document.createElement("iframe");
  f.src = it.url;
  f.loading = "lazy";
  f.title = it.title || "Embedded website";
  f.referrerPolicy = "no-referrer";
  f.setAttribute("sandbox", "allow-scripts allow-same-origin allow-forms allow-popups");
  f.style.cssText =
    "position:absolute;left:0;top:0;border:0;transform-origin:0 0;" +
    "width:calc(100% / " + s + " + " + ox + "px);" +
    "height:calc(" + H + "px / " + s + " + " + oy + "px);" +
    "transform:scale(" + s + ") translate(" + -ox + "px," + -oy + "px)";
  wrap.appendChild(f);
  return wrap;
}

function openModal(it) {
  const m = document.createElement("div");
  m.className = "modal";
  const box = document.createElement("div");
  box.className = "modal-box";
  const x = document.createElement("button");
  x.className = "btn light modal-close";
  x.type = "button";
  x.textContent = "Band karein";
  const close = () => { m.remove(); document.removeEventListener("keydown", esc); };
  const esc = (e) => { if (e.key === "Escape") close(); };
  x.onclick = close;
  m.addEventListener("click", (e) => { if (e.target === m) close(); });
  document.addEventListener("keydown", esc);
  box.appendChild(x);
  box.appendChild(buildFrame(it, true));
  m.appendChild(box);
  document.body.appendChild(m);
}

function renderEmbeds(list, container) {
  container.innerHTML = "";
  const buttons = document.createElement("div");
  buttons.className = "embed-buttons";
  (list || []).forEach((it) => {
    if (!/^https:\/\//i.test(it.url || "")) return;
    if (it.mode === "inline") {
      const sec = document.createElement("div");
      if (it.title) {
        const h = document.createElement("h2");
        h.className = "embed-title";
        h.textContent = it.title;
        sec.appendChild(h);
      }
      sec.appendChild(buildFrame(it, false));
      container.appendChild(sec);
    } else {
      const b = document.createElement(it.mode === "tab" ? "a" : "button");
      b.className = "btn";
      b.textContent = it.title || "Kholein";
      if (it.mode === "tab") {
        b.href = it.url;
        b.target = "_blank";
        b.rel = "noopener";
      } else {
        b.type = "button";
        b.onclick = () => openModal(it);
      }
      buttons.appendChild(b);
    }
  });
  if (buttons.children.length) container.prepend(buttons);
}
