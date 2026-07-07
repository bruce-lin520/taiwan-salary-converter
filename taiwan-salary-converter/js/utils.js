export function formatNumber(n) {
  return new Intl.NumberFormat("zh-TW", { maximumFractionDigits: 0 }).format(n);
}

export function formatNt(n) {
  return "NT$ " + formatNumber(n);
}

export function formatTwd(n) {
  return formatNumber(n) + " 元新台币";
}

export function formatCnyAmount(n) {
  return new Intl.NumberFormat("zh-CN", {
    style: "currency",
    currency: "CNY",
    maximumFractionDigits: 0,
  }).format(n);
}

export function formatCnyFromTwd(twd, rate) {
  return "≈ " + formatCnyAmount(twd * rate) + " 人民币";
}

export function parseAmount(value) {
  const n = Number(value);
  return Number.isFinite(n) && n >= 0 ? n : 0;
}

export function normalizeSearchText(text) {
  return String(text || "")
    .trim()
    .toLowerCase()
    .replace(/\s+/g, "");
}

export function getJobSearchTerms(job) {
  return [job.name].concat(job.aliases || []);
}

export function searchJobs(query, jobs) {
  const q = normalizeSearchText(query);
  if (!q) return [];
  return jobs.filter((job) =>
    getJobSearchTerms(job).some((term) => {
      const t = normalizeSearchText(term);
      return t.includes(q) || q.includes(t);
    })
  );
}
