// ---------- Config: edit links here ----------
const VIDEOS = {
  "video-main": "vaH6NgG_wIA", // main cinematic (river photo)
  "video-02":   "YdS18IdxTdQ", // Sillage story polaroid
  "video-01":   "oRUz9DhJLIg", // top polaroid
  "video-03":   "ZiSjl3Bx4pQ"  // polaroid behind notebook
};
const DOWNLOAD_FILE = "downloads/DataViz-760-Project.twbx";
const GALLERIES = {
  "gallery-viz":   "data/visualizations.json",
  "gallery-notes": "data/notes.json"
};

// ---------- Modal ----------
const modal = document.getElementById("modal");
const body  = modal.querySelector(".modal-body");

function openModal(node) {
  body.replaceChildren(node);
  modal.showModal();
}
function closeModal() { modal.close(); }

modal.addEventListener("close", () => body.replaceChildren()); // stops video
modal.querySelector(".modal-close").addEventListener("click", closeModal);
modal.addEventListener("click", (e) => { if (e.target === modal) closeModal(); });

// ---------- Actions ----------
function playVideo(id) {
  const wrap = document.createElement("div");
  wrap.className = "video-wrap";
  const iframe = document.createElement("iframe");
  iframe.src = `https://www.youtube-nocookie.com/embed/${id}?autoplay=1&rel=0`;
  iframe.allow = "autoplay; encrypted-media; picture-in-picture; fullscreen";
  iframe.allowFullscreen = true;
  iframe.title = "Video player";
  wrap.append(iframe);
  openModal(wrap);
}

async function openGallery(url) {
  let items = [];
  try {
    const res = await fetch(url);
    items = await res.json();
  } catch (err) {
    console.error("Gallery failed to load:", err);
    return;
  }
  let i = 0;

  const box = document.createElement("div");
  box.className = "gallery";
  box.innerHTML = `
    <img alt="">
    <p class="g-title"></p>
    <p class="g-caption"></p>
    <div class="g-nav">
      <button type="button" data-dir="-1" aria-label="Previous">←</button>
      <span class="g-count"></span>
      <button type="button" data-dir="1" aria-label="Next">→</button>
    </div>`;

  const img = box.querySelector("img");
  const render = () => {
    const it = items[i];
    img.src = it.src;
    img.alt = it.alt || "";
    box.querySelector(".g-title").textContent = it.title || "";
    box.querySelector(".g-caption").textContent = it.caption || "";
    box.querySelector(".g-count").textContent = `${i + 1} / ${items.length}`;
  };
  const step = (d) => { i = (i + d + items.length) % items.length; render(); };

  box.querySelectorAll("[data-dir]").forEach((b) =>
    b.addEventListener("click", () => step(Number(b.dataset.dir))));

  const onKey = (e) => {
    if (e.key === "ArrowRight") step(1);
    if (e.key === "ArrowLeft") step(-1);
  };
  modal.addEventListener("keydown", onKey);
  modal.addEventListener("close", () => modal.removeEventListener("keydown", onKey), { once: true });

  render();
  openModal(box);
}

function download() {
  const a = document.createElement("a");
  a.href = DOWNLOAD_FILE;
  a.download = "";
  document.body.append(a);
  a.click();
  a.remove();
}

// ---------- Dispatcher: one listener for every button ----------
document.addEventListener("click", (e) => {
  const btn = e.target.closest("[data-action]");
  if (!btn) return;
  const action = btn.dataset.action;

  if (VIDEOS[action]) return playVideo(VIDEOS[action]);
  if (GALLERIES[action]) return openGallery(GALLERIES[action]);
  if (action === "download-tableau") return download();
});