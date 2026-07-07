import { renderRankings, scrollToRankings } from "./rankings.js";
import { renderJobDetail, hideJobDetail } from "./job-detail.js";

const PAGE_SIZE = 30;

export function getBasePath() {
  const base = document.querySelector("base");
  if (base && base.href) {
    const u = new URL(base.href);
    return u.pathname.replace(/\/$/, "");
  }
  return "";
}

export function jobUrl(slug) {
  return `${getBasePath()}/job/${slug}`;
}

export function navigate(path) {
  history.pushState({}, "", path);
  handleRoute();
}

export function handleRoute() {
  const base = getBasePath();
  let path = location.pathname;
  if (base && path.startsWith(base)) path = path.slice(base.length) || "/";

  const match = path.match(/^\/job\/([^/]+)\/?$/);
  const homeSections = document.querySelectorAll(
    ".container > .module:not(#rankings):not(#job-detail-page), .container > h1, .container > .subtitle, .container > .result, .container > .compare"
  );
  const rankingsEl = document.getElementById("rankings");
  const detailEl = document.getElementById("job-detail-page");

  if (match) {
    homeSections.forEach((el) => el.classList.add("hidden"));
    if (rankingsEl) rankingsEl.classList.add("hidden");
    detailEl.classList.remove("hidden");
    renderJobDetail(match[1]);
    return;
  }

  detailEl.classList.add("hidden");
  homeSections.forEach((el) => el.classList.remove("hidden"));
  if (rankingsEl) rankingsEl.classList.remove("hidden");
  hideJobDetail();

  if (location.hash === "#rankings") scrollToRankings();
}

export function initRouter(getJobs) {
  window.__getJobs = getJobs;
  window.addEventListener("popstate", handleRoute);
  document.addEventListener("click", (e) => {
    const a = e.target.closest("a[data-internal]");
    if (!a) return;
    e.preventDefault();
    navigate(a.getAttribute("href"));
  });
  handleRoute();
}