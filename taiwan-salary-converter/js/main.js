import { enrichJobs } from "./data-enrich.js";
import {
  initSalaryConverter,
  initLivingCost,
  initTaxCalculator,
  initJobSearch,
} from "./legacy.js";
import { initRankings } from "./rankings.js";
import { initRouter } from "./router.js";

async function bootstrap() {
  let jobs = [];
  try {
    const res = await fetch("salaryData.json");
    if (!res.ok) throw new Error("load failed");
    const data = await res.json();
    jobs = enrichJobs(Array.isArray(data.jobs) ? data.jobs : []);
  } catch (e) {
    console.warn("salaryData.json 加载失败", e);
  }

  window.__salaryJobs = jobs;

  initSalaryConverter();
  initLivingCost();
  initTaxCalculator();
  initJobSearch(jobs);
  initRankings(jobs);
  initRouter();
}

document.addEventListener("DOMContentLoaded", bootstrap);
