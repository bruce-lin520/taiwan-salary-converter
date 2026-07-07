import { formatNt, formatNumber } from "./utils.js";
import { jobUrl, navigate } from "./router.js";

function setSEO(job) {
  document.title = `${job.name} 薪资多少？2026台湾${job.name}平均月薪 | 台湾工资换算`;
  let desc = document.querySelector('meta[name="description"]');
  if (!desc) {
    desc = document.createElement("meta");
    desc.name = "description";
    document.head.appendChild(desc);
  }
  desc.content = `${job.name}平均月薪约${formatNumber(job.averageMonthly)}元新台币，年薪约${formatNumber(job.averageAnnual)}元。工作内容、学历要求、职涯发展与薪资趋势一览。`;

  let ld = document.getElementById("job-jsonld");
  if (!ld) {
    ld = document.createElement("script");
    ld.type = "application/ld+json";
    ld.id = "job-jsonld";
    document.head.appendChild(ld);
  }
  ld.textContent = JSON.stringify({
    "@context": "https://schema.org",
    "@type": "Occupation",
    name: job.name,
    description: job.description,
    estimatedSalary: {
      "@type": "MonetaryAmountDistribution",
      currency: "TWD",
      duration: "P1M",
      median: job.medianMonthly,
    },
  });
}

function estimateLivingCost(job) {
  const expense = Math.round(job.averageMonthly * 0.72);
  const savings = job.averageMonthly - expense;
  return { expense, savings };
}

function drawTrendChart(canvas, trend) {
  const ctx = canvas.getContext("2d");
  const w = canvas.width = canvas.clientWidth * devicePixelRatio;
  const h = canvas.height = canvas.clientHeight * devicePixelRatio;
  ctx.clearRect(0, 0, w, h);
  const max = Math.max(...trend);
  const min = Math.min(...trend);
  const pad = 20 * devicePixelRatio;
  const step = (w - pad * 2) / (trend.length - 1);
  ctx.strokeStyle = getComputedStyle(document.documentElement).getPropertyValue("--accent") || "#2563eb";
  ctx.lineWidth = 2 * devicePixelRatio;
  ctx.beginPath();
  trend.forEach((v, i) => {
    const x = pad + i * step;
    const y = h - pad - ((v - min) / (max - min || 1)) * (h - pad * 2);
    i === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
  });
  ctx.stroke();
}

function renderRelated(jobs, slugs) {
  return (slugs || [])
    .map((slug) => jobs.find((j) => j.slug === slug))
    .filter(Boolean)
    .map((j) => `<a href="${jobUrl(j.slug)}" data-internal>${j.name}</a>`)
    .join("");
}

export function renderJobDetail(slug) {
  const jobs = window.__salaryJobs || [];
  const job = jobs.find((j) => j.slug === slug);
  const el = document.getElementById("job-detail-page");
  if (!job || !el) {
    el.innerHTML = '<p class="analysis warn">暂无该职业资料，未来会持续更新。</p>';
    return;
  }

  setSEO(job);
  const living = estimateLivingCost(job);
  const skills = (job.skills || []).join("、");

  el.innerHTML = `
    <a href="./#rankings" class="btn-secondary" data-internal>← 返回排行榜</a>
    <h2 style="margin-top:1rem">${job.name}</h2>
    <div class="result-cards" style="margin-top:1rem">
      <div class="card card-income"><span class="card-label">平均月薪</span><strong class="card-value">${formatNt(job.averageMonthly)}</strong></div>
      <div class="card card-income"><span class="card-label">平均年薪</span><strong class="card-value">${formatNt(job.averageAnnual)}</strong></div>
      <div class="card card-neutral"><span class="card-label">薪资范围</span><strong class="card-value">${formatNt(job.minMonthly)} – ${formatNt(job.maxMonthly)}</strong></div>
      <div class="card card-neutral"><span class="card-label">收入等级</span><strong class="card-value">${job.incomeLevel || "—"}</strong></div>
    </div>

    <div class="job-detail-grid" style="margin-top:1rem">
      <div class="detail-block"><h3>① 工作内容</h3><p>${job.description}</p></div>
      <div class="detail-block"><h3>② 工作环境</h3><p>${job.workEnvironment || "—"}</p></div>
      <div class="detail-block"><h3>③ 常见学历要求</h3><p>${job.education}</p></div>
      <div class="detail-block"><h3>④ 是否属于缺工产业</h3><p>${job.shortage ? "是，属于缺工职业" : "否，一般职缺"}</p></div>
      <div class="detail-block"><h3>⑤ 工作压力</h3><p>${job.workPressure || "中"}</p></div>
      <div class="detail-block"><h3>⑥ 加班情况</h3><p>${job.overtime || "中"}</p></div>
      <div class="detail-block"><h3>⑦ 职涯发展</h3><p>${job.career || job.outlook}</p></div>
      <div class="detail-block"><h3>⑧ 推荐技能</h3><p>${skills || "—"}</p></div>
      <div class="detail-block"><h3>⑨ 适合哪些人</h3><p>${job.suitableFor || "—"}</p></div>
      <div class="detail-block"><h3>⑩ 未来发展趋势</h3><p>${job.outlook}</p></div>
    </div>

    <div class="detail-block" style="margin-top:1rem">
      <h3>薪资成长曲线（模拟数据）</h3>
      <canvas class="trend-chart" id="trend-chart" aria-label="薪资成长折线图"></canvas>
    </div>

    <div class="detail-block" style="margin-top:0.75rem">
      <h3>生活成本分析（估算）</h3>
      <p>平均薪资：${formatNt(job.averageMonthly)}</p>
      <p>扣除生活成本（约 72%）：${formatNt(living.expense)}</p>
      <p><strong>预计每月可存：${formatNt(living.savings)}</strong></p>
    </div>

    <div class="coming-soon" style="margin-top:0.75rem">台湾 VS 大陆 · Coming Soon</div>

    <div class="detail-block" style="margin-top:0.75rem">
      <h3>相关职业</h3>
      <div class="related-jobs">${renderRelated(jobs, job.relatedJobs) || "暂无"}</div>
    </div>
  `;

  const canvas = document.getElementById("trend-chart");
  if (canvas && job.trend?.length) drawTrendChart(canvas, job.trend);
  window.scrollTo(0, 0);
}

export function hideJobDetail() {
  document.title = "台币工资换算 · 台北 vs 上海";
}