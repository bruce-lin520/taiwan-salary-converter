import { initRouter, handleRoute } from "./router.js";
import { initRankings } from "./rankings.js";

// 1. 保留你现有 initSalaryConverter / initLivingCost / initTaxCalculator / initJobSearch
// 2. 加载 JSON 后初始化排行榜与路由

async function bootstrap() {
  let jobs = [];
  try {
    const res = await fetch("salaryData.json");
    const data = await res.json();
    jobs = data.jobs || [];
  } catch (e) {
    console.warn("salaryData.json 加载失败", e);
  }
  window.__salaryJobs = jobs;

  // 现有模块 init...
  initRankings(jobs);
  initRouter(() => jobs);
}

document.addEventListener("DOMContentLoaded", bootstrap);