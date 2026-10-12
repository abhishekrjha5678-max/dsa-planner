const KEY = "dsa-planner-v1";
let state = { start: "", done: {} };
try { state = Object.assign(state, JSON.parse(localStorage.getItem(KEY)) || {}); } catch (e) {}
const save = () => { try { localStorage.setItem(KEY, JSON.stringify(state)); } catch (e) {} };
const $ = id => document.getElementById(id);
const nice = s => s.split("-").map(w => w[0].toUpperCase() + w.slice(1)).join(" ");
const yt = t => "https://www.youtube.com/results?search_query=" + encodeURIComponent("take U forward " + t + " Java");
const lc = s => "https://leetcode.com/problems/" + s + "/";
const dayDate = (w, d) => {
  if (!state.start) return "";
  const t = new Date(state.start + "T00:00:00");
  t.setDate(t.getDate() + w * 7 + d);
  return t.toLocaleDateString(undefined, { weekday: "short", day: "numeric", month: "short" });
};
const keys = (w, d, n) => ["w" + w + "d" + d + "v", ...Array.from({ length: n }, (_, i) => "w" + w + "d" + d + "p" + i)];

function currentWeek() {
  if (state.start) {
    const diff = Math.floor((Date.now() - new Date(state.start + "T00:00:00")) / 864e5 / 7);
    return Math.min(Math.max(diff, 0), PLAN.length - 1);
  }
  const i = PLAN.findIndex((wk, w) => wk[1].some((x, d) => !keys(w, d, x.split("|")[1].split(" ").length).every(k => state.done[k])));
  return i < 0 ? PLAN.length - 1 : i;
}

function render() {
  const cur = currentWeek();
  $("start").value = state.start;
  $("weeks").innerHTML = PLAN.map((wk, w) => {
    const days = wk[1].map((x, d) => {
      const [title, probs] = x.split("|"), slugs = probs.split(" ");
      const ks = keys(w, d, slugs.length);
      const row = (k, link, label, tag) => `<label class="item"><input type="checkbox" data-k="${k}" ${state.done[k] ? "checked" : ""}><a href="${link}" target="_blank" rel="noopener">${label}</a><span class="tag">${tag}</span></label>`;
      return `<div class="day ${ks.every(k => state.done[k]) ? "done" : ""}"><h3>Day ${d + 1}: ${title}<span>${dayDate(w, d)}</span></h3>` +
        row(ks[0], yt(title), "Watch: " + title, "video") +
        slugs.map((s, i) => row(ks[i + 1], lc(s), nice(s), "problem")).join("") + `</div>`;
    }).join("");
    const all = wk[1].flatMap((x, d) => keys(w, d, x.split("|")[1].split(" ").length));
    const n = all.filter(k => state.done[k]).length, p = Math.round(n / all.length * 100);
    return `<details id="week${w}" class="${w === cur ? "now" : ""}" ${w === cur ? "open" : ""}><summary><b>Week ${w + 1}: ${wk[0]}</b><span class="pct">${p}%</span><small>${n} of ${all.length} tasks done</small><div class="wbar"><i style="width:${p}%"></i></div></summary>${days}</details>`;
  }).join("");
  stats();
}

function stats() {
  let total = 0, done = 0, probs = 0, days = 0;
  PLAN.forEach((wk, w) => wk[1].forEach((x, d) => {
    const ks = keys(w, d, x.split("|")[1].split(" ").length);
    total += ks.length;
    const c = ks.filter(k => state.done[k]).length;
    done += c; if (c === ks.length) days++;
    probs += ks.slice(1).filter(k => state.done[k]).length;
  }));
  $("bar").style.width = Math.round(done / total * 100) + "%";
  $("stats").textContent = `${Math.round(done / total * 100)}% complete · ${days} of ${PLAN.length * 5} days · ${probs} problems solved`;
}

$("weeks").addEventListener("change", e => {
  const k = e.target.dataset.k; if (!k) return;
  e.target.checked ? state.done[k] = 1 : delete state.done[k];
  save();
  const open = [...document.querySelectorAll("details[open]")].map(d => d.id), y = scrollY;
  render(); open.forEach(id => { const el = $(id); if (el) el.open = true; }); scrollTo(0, y);
});
$("start").onchange = e => { state.start = e.target.value; save(); render(); };
$("jump").onclick = () => { const el = $("week" + currentWeek()); el.open = true; el.scrollIntoView({ behavior: "smooth" }); };
$("export").onclick = () => {
  const a = document.createElement("a");
  a.href = URL.createObjectURL(new Blob([JSON.stringify(state)], { type: "application/json" }));
  a.download = "dsa-progress.json"; a.click();
};
$("import").onclick = () => $("file").click();
$("file").onchange = e => {
  const r = new FileReader();
  r.onload = () => { try { state = Object.assign({ start: "", done: {} }, JSON.parse(r.result)); save(); render(); } catch (x) { alert("That file is not a valid progress export."); } };
  if (e.target.files[0]) r.readAsText(e.target.files[0]);
};
$("reset").onclick = () => { if (confirm("Erase all progress and the start date?")) { state = { start: "", done: {} }; save(); render(); } };
render();
