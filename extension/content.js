// Runs on supported job board pages to extract job title and company
(function () {
  const selectors = {
    title: [
      "h1.t-24",               // LinkedIn
      "h1.jobsearch-JobInfoHeader-title", // Indeed
      ".job-title h1",
      "h1[data-testid='job-title']",
      "h1",
    ],
    company: [
      ".jobs-unified-top-card__company-name a", // LinkedIn
      ".icl-u-lg-mr--sm.icl-u-xs-mr--sm",        // Indeed
      "[data-testid='inlineHeader-companyName']",
      ".employer-name",
    ],
  };

  function first(list) {
    for (const sel of list) {
      const el = document.querySelector(sel);
      if (el?.textContent?.trim()) return el.textContent.trim();
    }
    return "";
  }

  window.__seevvJobData = {
    title:   first(selectors.title),
    company: first(selectors.company),
    url:     window.location.href,
  };
})();
