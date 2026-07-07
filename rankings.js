import { jobUrl, navigate } from "./router.js";
import { formatNt } from "./utils.js";

const PAGE_SIZE = 10; // 每页 10 条，共 TOP30
let state = { filter: "all", sort: "averageMonthly", search: "", page: 1 };

const CATEGORY_MAP = {
  tech: "tech", medical: "medical", education: "education",
  service: "service", finance: "finance", manufacturing: "manufacturing",
};

function applyFilter(jobs) {
  let list = [...jobs];
  const q = state.search.trim().toLowerCase();
  if (q) {
    list = list.filter((j) =>
      [j.name, ...(j.aliases || [])].some((t) =>
        String(t).toLowerCase().includes(q)
      )
    );
  }
  switch (state.filter) {
    case "top-income": list.sort((a, b) => b.averageMonthly - a.averageMonthly); break;
    case "hot": list = list.filter((j) => j.isHot); break;
    case "shortage": list = list.filter((j) => j.shortage); break;
    default:
      if (CATEGORY_MAP[state.filter]) {
        list = list.filter((j) => j.category === state.filter);
      }
  }
  if (state.sort === "averageMonthly") list.sort((a, b) => b.averageMonthly - a.averageMonthly);
  else if (state.sort === "averageAnnual") list.sort((a, b) => b.averageAnnual - a.averageAnnual);
  else list.sort((a, b) => a.name.localeCompare(b.name, "zh-Hant"));
  return list.slice(0, 30);
}

function paginate(list) {
  const start = (state.page - 1) * PAGE_SIZE;
  return list.slice(start, start + PAGE_SIZE);
}

function renderRankCard(job, index, pageStart) {
  const rank = pageStart + index + 1;
  const badge = job.shortage
    ? '<span class="job-badge shortage">缺工</span>'
    : '<span class="job-badge normal">一般</span>';
  return `
    <article class="rank-card" data-slug="${job.slug}">
      <div class="rank-card-top">
        <div>
          <div class="rank-no">🏆 第 ${rank} 名 · ${job.name}</div>
          <p class="rank-meta">平均月薪 ${formatNt(job.averageMonthly)} · 年薪 ${formatNt(job.averageAnnual)}</p>
          <p class="rank-meta">范围 ${formatNt(job.minMonthly)} – ${formatNt(job.maxMonthly)}</p>
        </div>
        ${badge}
      </div>
      <div class="rank-actions">
        <a class="btn-secondary" href="${jobUrl(job.slug)}" data-internal>查看详情</a>
      </div>
    </article>`;
}

export function renderRankings(jobs) {
  const listEl = document.getElementById("rankings-list");
  const pageEl = document.getElementById("rankings-pagination");
  if (!listEl) return;

  const filtered = applyFilter(jobs);
  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  if (state.page > totalPages) state.page = 1;
  const pageItems = paginate(filtered);
  const pageStart = (state.page - 1) * PAGE_SIZE;

  listEl.innerHTML = pageItems.length
    ? pageItems.map((j, i) => renderRankCard(j, i, pageStart)).join("")
    : '<p class="analysis warn">暂无符合条件的职业。</p>';

  pageEl.innerHTML = Array.from({ length: totalPages }, (_, i) => {
    const n = i + 1;
    return `<button class="page-btn ${n === state.page ? "active" : ""}" data-page="${n}">${n}</button>`;
  }).join("");
}

export function initRankings(jobs) {
  const search = document.getElementById("rankings-search");
  const filter = document.getElementById("rankings-filter");
  const sort = document.getElementById("rankings-sort");
  const pageEl = document.getElementById("rankings-pagination");

  const refresh = () => renderRankings(jobs);
  search?.addEventListener("input", () => { state.search = search.value; state.page = 1; refresh(); });
  filter?.addEventListener("change", () => { state.filter = filter.value; state.page = 1; refresh(); });
  sort?.addEventListener("change", () => { state.sort = sort.value; refresh(); });
  pageEl?.addEventListener("click", (e) => {
    const btn = e.target.closest("[data-page]");
    if (!btn) return;
    state.page = Number(btn.dataset.page);
    refresh();
  });
  refresh();
}

export function scrollToRankings() {
  document.getElementById("rankings")?.scrollIntoView({ behavior: "smooth" });
}