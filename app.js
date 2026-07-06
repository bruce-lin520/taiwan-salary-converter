/* ========== 配置：百分位（只改这里即可更新） ========== */
const INCOME_PERCENTILE_BANDS = [
  [25000, 10],
  [30000, 25],
  [35000, 40],
  [40000, 50],
  [45000, 58],
  [50000, 62],
  [55000, 68],
  [60000, 72],
  [70000, 78],
  [80000, 84],
  [90000, 88],
  [100000, 92],
  [120000, 96],
  [150000, 98],
  [Infinity, 99],
];
/* ========== 配置：税后工资估算（只改这里即可更新） ========== */
const TAX_CONFIG = {
  laborInsuranceRate: 0.025,   // 劳保员工负担（示意）
  laborInsuranceCap: 45800,    // 劳保投保薪資上限
  laborInsuranceMin: 25250,    // 劳保投保薪資下限
  healthInsuranceRate: 0.01551, // 健保员工负担（单身示意）
  healthInsuranceCap: 182000,
  standardDeduction: 124000,   // 所得税标准扣除额（单身）
  salaryDeduction: 218000,     // 薪资所得特别扣除额
  taxBrackets: [               // [上限, 税率] 年度应税所得
    [560000, 0.05],
    [1260000, 0.12],
    [2520000, 0.20],
    [4720000, 0.30],
    [Infinity, 0.40],
  ],
};

const INCOME_LEVEL_BANDS = [
  [35000, "一般水平"],
  [50000, "中等水平"],
  [70000, "中上水平"],
  [90000, "高收入水平"],
  [Infinity, "顶尖收入水平"],
];
const TAIWAN_AVERAGE_SALARY = 45800;

const DEFAULT_RATE = 0.223;

const COST_ITEMS = [
  {
    name: "单间房租（月）",
    taipei: "约 15,000–25,000 TWD",
    shanghai: "约 3,000–6,000 CNY",
  },
  {
    name: "外食一餐",
    taipei: "约 100–200 TWD",
    shanghai: "约 25–50 CNY",
  },
  {
    name: "地铁月票",
    taipei: "约 1,200 TWD",
    shanghai: "约 200 CNY",
  },
  {
    name: "超市日用品（月）",
    taipei: "约 3,000–5,000 TWD",
    shanghai: "约 500–800 CNY",
  },
];

/* ========== 状态 ========== */
let currentRate = DEFAULT_RATE;

/* ========== 工具函数 ========== */
function formatNumber(n) {
  return new Intl.NumberFormat("zh-TW", { maximumFractionDigits: 0 }).format(n);
}

function formatTwd(n) {
  return formatNumber(n) + " 元新台币";
}

function formatCnyAmount(n) {
  return new Intl.NumberFormat("zh-CN", {
    style: "currency",
    currency: "CNY",
    maximumFractionDigits: 0,
  }).format(n);
}

function formatCnyFromTwd(twd, rate) {
  return "≈ " + formatCnyAmount(twd * rate) + " 人民币";
}

function parseAmount(value) {
  const n = Number(value);
  return Number.isFinite(n) && n >= 0 ? n : 0;
}

function getPercentile(salary, bands) {
  for (let i = 0; i < bands.length; i++) {
    const cap = bands[i][0];
    const pct = bands[i][1];
    if (salary <= cap) return pct;
  }
  return bands[bands.length - 1][1];
}

function getRate() {
  return currentRate;
}
function formatNt(n) {
  return "NT$ " + formatNumber(n);
}

function getInsuredSalary(salary, min, max) {
  return Math.min(Math.max(salary, min), max);
}

function getIncomeLevel(salary, bands) {
  for (let i = 0; i < bands.length; i++) {
    if (salary <= bands[i][0]) return bands[i][1];
  }
  return bands[bands.length - 1][1];
}

function estimateAnnualIncomeTax(annualGross, config) {
  const taxable = Math.max(
    0,
    annualGross - config.standardDeduction - config.salaryDeduction
  );
  if (taxable <= 0) return 0;

  let tax = 0;
  let prev = 0;
  for (let i = 0; i < config.taxBrackets.length; i++) {
    const cap = config.taxBrackets[i][0];
    const rate = config.taxBrackets[i][1];
    const upper = Math.min(taxable, cap);
    if (upper > prev) {
      tax += (upper - prev) * rate;
      prev = cap;
    }
    if (taxable <= cap) break;
  }
  return Math.round(tax);
}
/* ========== 模块 1：工资换算 ========== */
function updateSalary() {
  const salaryInput = document.getElementById("salary");
  const cnyEl = document.getElementById("cny");
  if (!salaryInput || !cnyEl) return;

  const twd = Number(salaryInput.value);
  if (!twd || twd <= 0) {
    cnyEl.textContent = "—";
    return;
  }
  cnyEl.textContent = formatCnyAmount(twd * currentRate);
}

function renderCostTable() {
  const costTableEl = document.getElementById("cost-table");
  if (!costTableEl) return;

  const rows = [
    `<div class="cost-row header">
      <span>项目</span><span>台北</span><span>上海</span>
    </div>`,
    ...COST_ITEMS.map(
      (item) => `
      <div class="cost-row">
        <span>${item.name}</span>
        <span>${item.taipei}</span>
        <span>${item.shanghai}</span>
      </div>`
    ),
  ];
  costTableEl.innerHTML = rows.join("");
}

async function loadRate() {
  const rateEl = document.getElementById("rate");
  if (rateEl) rateEl.textContent = "正在获取汇率…";

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
    const rate = data && data.rates && data.rates.CNY;
    if (!rate || rate <= 0) throw new Error("invalid rate");

    currentRate = rate;
    if (rateEl) {
      rateEl.textContent = "1 TWD = " + rate.toFixed(4) + " CNY（实时）";
    }
  } catch (e) {
    currentRate = DEFAULT_RATE;
    if (rateEl) {
      rateEl.textContent =
        "1 TWD = " + DEFAULT_RATE + " CNY（默认估算）";
    }
  }

  updateSalary();
}

function initSalaryConverter() {
  const salaryInput = document.getElementById("salary");
  if (salaryInput) {
    salaryInput.addEventListener("input", updateSalary);
  }
  renderCostTable();
  loadRate();
}

/* ========== 模块 2：生活成本计算器 ========== */
function getSavingsAnalysis(savings, salary) {
  const ratio = salary > 0 ? savings / salary : 0;

  if (savings < 0) {
    return {
      type: "danger",
      text:
        "⚠️ 当前支出超过收入，建议优先控制房租、餐饮或其他固定支出。",
    };
  }
  if (ratio >= 0.3) {
    return {
      type: "ok",
      text:
        "✅ 每个月可以存下约 " +
        formatNumber(savings) +
        " 元新台币，储蓄能力不错。",
    };
  }
  if (ratio >= 0.15) {
    return {
      type: "ok",
      text:
        "✅ 每月约可存 " +
        formatNumber(savings) +
        " 元新台币，略优于多数上班族。",
    };
  }
  if (ratio >= 0.05) {
    return {
      type: "warn",
      text: "⚠️ 当前支出较高，建议控制房租或娱乐支出。",
    };
  }
  return {
    type: "warn",
    text: "⚠️ 可存金额偏低，建议检视固定支出（房租、外食）是否过高。",
  };
}

function getPercentileText(salary) {
  const pct = getPercentile(salary, INCOME_PERCENTILE_BANDS);
  const lines = ["你的收入约超过台湾 " + pct + "% 上班族。"];

  if (salary >= TAIWAN_AVERAGE_SALARY) {
    lines.push("你的收入约高于台湾平均薪资。");
  } else {
    lines.push("你的收入略低于台湾平均薪资。");
  }

  return lines.join("<br />");
}

function calculateLivingCost() {
  const salary = parseAmount(document.getElementById("lc-salary").value);
  if (!salary) {
    const input = document.getElementById("lc-salary");
    if (input) input.focus();
    return;
  }

  const rent = parseAmount(document.getElementById("lc-rent").value);
  const food = parseAmount(document.getElementById("lc-food").value);
  const transport = parseAmount(document.getElementById("lc-transport").value);
  const utilities = parseAmount(document.getElementById("lc-utilities").value);
  const phone = parseAmount(document.getElementById("lc-phone").value);
  const other = parseAmount(document.getElementById("lc-other").value);

  const totalExpense =
    rent + food + transport + utilities + phone + other;
  const savings = salary - totalExpense;
  const rate = getRate();

  document.getElementById("lc-result-income").textContent = formatTwd(salary);
  document.getElementById("lc-result-expense").textContent =
    formatTwd(totalExpense);
  document.getElementById("lc-result-savings").textContent = formatTwd(savings);
  document.getElementById("lc-result-savings-cny").textContent =
    formatCnyFromTwd(savings, rate);

  const analysis = getSavingsAnalysis(savings, salary);
  const analysisEl = document.getElementById("living-cost-analysis");
  analysisEl.className = "analysis " + analysis.type;
  analysisEl.innerHTML = analysis.text;

  document.getElementById("living-cost-percentile").innerHTML =
    getPercentileText(salary);

  document.getElementById("living-cost-result").classList.remove("hidden");
  analysisEl.classList.remove("hidden");
  document.getElementById("living-cost-percentile").classList.remove("hidden");
}

function initLivingCost() {
  const form = document.getElementById("living-cost-form");
  if (!form) return;

  form.addEventListener("submit", function (e) {
    e.preventDefault();
    calculateLivingCost();
  });

  // 与上方工资换算联动：输入月薪时同步到生活成本
  const topSalary = document.getElementById("salary");
  const lcSalary = document.getElementById("lc-salary");
  if (topSalary && lcSalary) {
    topSalary.addEventListener("input", function () {
      if (topSalary.value) lcSalary.value = topSalary.value;
    });
  }
}
/* ========== 模块 3：税后工资计算器 ========== */
function calculateAfterTax() {
  const gross = parseAmount(document.getElementById("tax-gross").value);
  if (!gross) {
    document.getElementById("tax-gross").focus();
    return;
  }

  const payPeriods = Number(
    document.querySelector('input[name="pay-periods"]:checked').value
  );

  const insuredSalary = getInsuredSalary(
    gross,
    TAX_CONFIG.laborInsuranceMin,
    TAX_CONFIG.laborInsuranceCap
  );

  const laborInsurance = Math.round(
    insuredSalary * TAX_CONFIG.laborInsuranceRate
  );

  const healthBase = getInsuredSalary(
    gross,
    TAX_CONFIG.laborInsuranceMin,
    TAX_CONFIG.healthInsuranceCap
  );
  const healthInsurance = Math.round(
    healthBase * TAX_CONFIG.healthInsuranceRate
  );

  const annualGross = gross * payPeriods;
  const annualTax = estimateAnnualIncomeTax(annualGross, TAX_CONFIG);
  const monthlyIncomeTax = Math.round(annualTax / 12);

  const monthlyNet = gross - laborInsurance - healthInsurance - monthlyIncomeTax;
  const annualNet = monthlyNet * payPeriods;

  document.getElementById("tax-result-gross").textContent = formatNt(gross);
  document.getElementById("tax-result-labor").textContent = formatNt(laborInsurance);
  document.getElementById("tax-result-health").textContent = formatNt(healthInsurance);
  document.getElementById("tax-result-income-tax").textContent =
    formatNt(monthlyIncomeTax);
  document.getElementById("tax-result-net-monthly").textContent =
    formatNt(monthlyNet);
  document.getElementById("tax-result-annual-gross").textContent =
    formatNt(annualGross);
  document.getElementById("tax-result-annual-net").textContent =
    formatNt(annualNet);

  const netRatio = gross > 0 ? Math.round((monthlyNet / gross) * 100) : 0;
  const level = getIncomeLevel(gross, INCOME_LEVEL_BANDS);
  const analysisLines = [
    "你的税后收入约占税前收入 " + netRatio + "%。",
  ];

  if (gross >= TAIWAN_AVERAGE_SALARY) {
    analysisLines.push("你的收入高于台湾平均薪资。");
  } else {
    analysisLines.push("你的收入略低于台湾平均薪资。");
  }

  analysisLines.push("你的收入属于" + level + "。");

  const analysisEl = document.getElementById("tax-analysis");
  analysisEl.className = "analysis ok";
  analysisEl.innerHTML = analysisLines.join("<br />");

  document.getElementById("tax-result").classList.remove("hidden");
  analysisEl.classList.remove("hidden");
}

function initTaxCalculator() {
  const form = document.getElementById("tax-calculator-form");
  if (!form) return;

  form.addEventListener("submit", function (e) {
    e.preventDefault();
    calculateAfterTax();
  });

  // 与上方模块联动
  const topSalary = document.getElementById("salary");
  const lcSalary = document.getElementById("lc-salary");
  const taxGross = document.getElementById("tax-gross");

  function syncTaxGross(value) {
    if (taxGross && value) taxGross.value = value;
  }

  if (topSalary) {
    topSalary.addEventListener("input", function () {
      syncTaxGross(topSalary.value);
    });
  }
  if (lcSalary) {
    lcSalary.addEventListener("input", function () {
      syncTaxGross(lcSalary.value);
    });
  }
}
/* ========== 入口 ========== */
document.addEventListener("DOMContentLoaded", function () {
  initSalaryConverter();
  initLivingCost();
  initTaxCalculator(); 
  initJobSearch();  //
});
/* ========== 模块 4：台湾行业薪资查询 ========== */
let salaryJobsData = [];

function normalizeSearchText(text) {
  return String(text || "")
    .trim()
    .toLowerCase()
    .replace(/\s+/g, "");
}

function getJobSearchTerms(job) {
  return [job.name].concat(job.aliases || []);
}

function searchJobs(query, jobs) {
  const q = normalizeSearchText(query);
  if (!q) return [];

  return jobs.filter(function (job) {
    return getJobSearchTerms(job).some(function (term) {
      const t = normalizeSearchText(term);
      return t.includes(q) || q.includes(t);
    });
  });
}

function renderJobCard(job) {
  const rangeText =
    formatNt(job.minMonthly) + " – " + formatNt(job.maxMonthly);
  const shortageBadge = job.shortage
    ? '<span class="job-badge shortage">缺工职业</span>'
    : '<span class="job-badge normal">一般职业</span>';

  return (
    '<article class="job-card">' +
    '<div class="job-card-header">' +
    "<h3 class=\"job-card-title\">" + job.name + "</h3>" +
    shortageBadge +
    "</div>" +
    '<div class="job-stats">' +
    '<div class="job-stat"><span class="job-stat-label">平均月薪</span><span class="job-stat-value">' +
    formatNt(job.averageMonthly) +
    "</span></div>" +
    '<div class="job-stat"><span class="job-stat-label">薪资中位数</span><span class="job-stat-value">' +
    formatNt(job.medianMonthly) +
    "</span></div>" +
    '<div class="job-stat"><span class="job-stat-label">常见薪资范围</span><span class="job-stat-value">' +
    rangeText +
    "</span></div>" +
    '<div class="job-stat"><span class="job-stat-label">平均年薪</span><span class="job-stat-value">' +
    formatNt(job.averageAnnual) +
    "</span></div>" +
    "</div>" +
    '<p class="job-detail"><strong>工作内容简介：</strong>' +
    job.description +
    "</p>" +
    '<p class="job-detail"><strong>学历建议：</strong>' +
    job.education +
    "</p>" +
    '<p class="job-detail"><strong>发展前景：</strong>' +
    job.outlook +
    "</p>" +
    "</article>"
  );
}

function renderJobSearchResults(jobs) {
  const resultsEl = document.getElementById("job-search-results");
  const emptyEl = document.getElementById("job-search-empty");

  if (!resultsEl || !emptyEl) return;

  if (!jobs.length) {
    resultsEl.classList.add("hidden");
    resultsEl.innerHTML = "";
    emptyEl.classList.remove("hidden");
    return;
  }

  emptyEl.classList.add("hidden");
  resultsEl.innerHTML = jobs.map(renderJobCard).join("");
  resultsEl.classList.remove("hidden");
}

function handleJobSearch() {
  const input = document.getElementById("job-query");
  if (!input) return;

  const query = input.value.trim();
  if (!query) {
    input.focus();
    return;
  }

  const results = searchJobs(query, salaryJobsData);
  renderJobSearchResults(results);
}

async function loadSalaryData() {
  try {
    const res = await fetch("salaryData.json");
    if (!res.ok) throw new Error("load failed");
    const data = await res.json();
    salaryJobsData = Array.isArray(data.jobs) ? data.jobs : [];
  } catch (e) {
    salaryJobsData = [];
    console.warn("salaryData.json 加载失败", e);
  }
}

function initJobSearch() {
  const form = document.getElementById("job-search-form");
  if (!form) return;

  form.addEventListener("submit", function (e) {
    e.preventDefault();
    handleJobSearch();
  });

  loadSalaryData();
}
