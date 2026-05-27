console.log("app.js 已加载");

const DEFAULT_RATE = 0.223;

const COST_ITEMS = [
  { name: "单间房租（月）", taipei: "约 15,000–25,000 TWD", shanghai: "约 3,000–6,000 CNY" },
  { name: "外食一餐", taipei: "约 100–200 TWD", shanghai: "约 25–50 CNY" },
  { name: "地铁月票", taipei: "约 1,200 TWD", shanghai: "约 200 CNY" },
  { name: "超市日用品（月）", taipei: "约 3,000–5,000 TWD", shanghai: "约 500–800 CNY" },
];

let currentRate = DEFAULT_RATE;

function formatCny(n) {
  return new Intl.NumberFormat("zh-CN", {
    style: "currency",
    currency: "CNY",
    maximumFractionDigits: 0,
  }).format(n);
}

function updateSalary() {
  const salaryInput = document.getElementById("salary");
  const cnyEl = document.getElementById("cny");
  if (!salaryInput || !cnyEl) return;

  const twd = Number(salaryInput.value);
  if (!twd || twd <= 0) {
    cnyEl.textContent = "—";
    return;
  }
  cnyEl.textContent = formatCny(twd * currentRate);
}

function renderCostTable() {
  const costTableEl = document.getElementById("cost-table");
  if (!costTableEl) return;

  const rows = [
    `<div class="cost-row header"><span>项目</span><span>台北</span><span>上海</span></div>`,
    ...COST_ITEMS.map(
      (item) =>
        `<div class="cost-row"><span>${item.name}</span><span>${item.taipei}</span><span>${item.shanghai}</span></div>`
    ),
  ];
  costTableEl.innerHTML = rows.join("");
}

async function loadRate() {
  console.log("loadRate 开始");
  const rateEl = document.getElementById("rate");
  if (!rateEl) {
    console.error("找不到 #rate");
    return;
  }

  rateEl.textContent = "正在获取汇率…";

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 8000);

  try {
    const res = await fetch(
      "https://api.exchangerate-api.com/v4/latest/TWD",
      { signal: controller.signal }
    );
    clearTimeout(timeout);
    if (!res.ok) throw new Error("HTTP " + res.status);
    const data = await res.json();
    const rate = data?.rates?.CNY;
    if (!rate || rate <= 0) throw new Error("invalid rate");
    currentRate = rate;
    rateEl.textContent = `1 TWD = ${rate.toFixed(4)} CNY（实时）`;
    console.log("汇率成功", rate);
  } catch (e) {
    console.warn("汇率失败，用默认", e);
    currentRate = DEFAULT_RATE;
    rateEl.textContent = `1 TWD = ${DEFAULT_RATE} CNY（默认估算）`;
  }

  updateSalary();
}

document.addEventListener("DOMContentLoaded", () => {
  console.log("DOM 就绪");
  const salaryInput = document.getElementById("salary");
  if (salaryInput) {
    salaryInput.addEventListener("input", updateSalary);
  } else {
    console.error("找不到 #salary");
  }
  renderCostTable();
  loadRate();
});