import { renderJobDetail, hideJobDetail } from "./job-detail.js";
import { scrollToRankings } from "./rankings.js";
import { getBasePath, homeUrl, resolveNavPath } from "./paths.js";

export { getBasePath, jobUrl, homeUrl } from "./paths.js";

export function navigate(path) {
  history.pushState({}, "", path);
  handleRoute();
}

export function handleRoute() {
  const base = getBasePath();
  let path = location.pathname;
  if (base && path.startsWith(base)) {
    path = path.slice(base.length) || "/";
  }

  const match = path.match(/^\/job\/([^/]+)\/?$/);
  const homeSections = document.querySelectorAll(".home-section");
  const headerEl = document.querySelector(".site-header");
  const rankingsEl = document.getElementById("rankings");
  const detailEl = document.getElementById("job-detail-page");
  const footerEl = document.querySelector(".site-footer");

  if (match) {
    homeSections.forEach((el) => el.classList.add("hidden"));
    rankingsEl?.classList.add("hidden");
    footerEl?.classList.add("hidden");
    headerEl?.classList.remove("hidden");
    detailEl?.classList.remove("hidden");
    renderJobDetail(match[1]);
    return;
  }

  detailEl?.classList.add("hidden");
  homeSections.forEach((el) => el.classList.remove("hidden"));
  rankingsEl?.classList.remove("hidden");
  footerEl?.classList.remove("hidden");
  headerEl?.classList.remove("hidden");
  hideJobDetail();

  if (location.hash === "#rankings") {
    scrollToRankings();
  }
}

export function initRouter() {
  window.addEventListener("popstate", handleRoute);
  document.addEventListener("click", (e) => {
    const a = e.target.closest("a[data-internal]");
    if (!a) return;
    e.preventDefault();
    navigate(resolveNavPath(a.getAttribute("href")));
  });
  handleRoute();
}
