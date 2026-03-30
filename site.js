
function renderHeader(activePage = "") {
  const header = document.getElementById("site-header");
  if (!header) return;
  const links = [
    ["index.html", "Overview", "home"],
    ["models.html", "Models", "models"],
    ["tasks.html", "Tasks", "tasks"],
    ["datasets.html", "Datasets", "datasets"],
    ["contribute.html", "Contribute", "contribute"],
  ];
  header.innerHTML = `
    <div class="topbar sticky top-0 z-50">
      <div class="container-xl mx-auto px-5 lg:px-8 py-4 flex items-center justify-between gap-6">
        <a href="index.html" class="flex items-center gap-3 shrink-0">
          <div>
            <div class="text-3xl font-bold tracking-tight brand-mark">ImmunoBench</div>
          </div>
        </a>
        <nav class="hidden md:flex items-center gap-8 text-base font-medium">
          ${links.map(([href, label, key]) => `<a href="${href}" class="nav-link ${activePage === key ? "active" : ""}">${label}</a>`).join("")}
        </nav>
        <div class="flex items-center gap-3">
          <a href="#" target="_blank" rel="noreferrer" class="btn-secondary rounded-full px-5 py-2.5 text-base font-medium flex items-center gap-2">
            <svg viewBox="0 0 24 24" width="18" height="18" stroke="currentColor" stroke-width="2" fill="none" stroke-linecap="round" stroke-linejoin="round">
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
              <polyline points="14 2 14 8 20 8"></polyline>
              <line x1="16" y1="13" x2="8" y2="13"></line>
              <line x1="16" y1="17" x2="8" y2="17"></line>
              <polyline points="10 9 9 9 8 9"></polyline>
            </svg>
            Paper
          </a>
          <a href="https://github.com/yanfang-research/IHCoBench" target="_blank" rel="noreferrer" class="btn-secondary rounded-full px-5 py-2.5 text-base font-medium flex items-center gap-2">
            <svg viewBox="0 0 24 24" width="18" height="18" stroke="currentColor" stroke-width="2" fill="none" stroke-linecap="round" stroke-linejoin="round">
              <path d="M9 19c-5 1.5-5-2.5-7-3m14 6v-3.87a3.37 3.37 0 0 0-.94-2.61c3.14-.35 6.44-1.54 6.44-7A5.44 5.44 0 0 0 20 4.77 5.07 5.07 0 0 0 19.91 1S18.73.65 16 2.48a13.38 13.38 0 0 0-7 0C6.27.65 5.09 1 5.09 1A5.07 5.07 0 0 0 5 4.77a5.44 5.44 0 0 0-1.5 3.78c0 5.42 3.3 6.61 6.44 7A3.37 3.37 0 0 0 9 18.13V22"></path>
            </svg>
            GitHub
          </a>
        </div>
      </div>
    </div>`;
}

function renderFooter() {
  const footer = document.getElementById("site-footer");
  if (!footer) return;
  footer.innerHTML = `
    <div class="container-xl mx-auto px-5 lg:px-8 pb-10">
      <div class="mt-12 text-center text-sm text-slate-400">
        © 2026 ImmunoBench Team. All rights reserved.
      </div>
    </div>`;
}

function formatNumber(value) {
  if (typeof value === "number") return value.toLocaleString();
  return value;
}

function parseMean(value) {
  if (value == null) return NaN;
  if (typeof value === "number") return value;
  const s = String(value).split("±")[0].trim();
  const n = Number(s);
  return Number.isFinite(n) ? n : NaN;
}

function getTaskGroup(taskName = "") {
  const t = taskName.toLowerCase();
  if (t === "staining intensity" || t === "staining location" || t === "staining quantity") return "IHC Staining Assessment";
  if (/survival|recurrence|metastasis|progress|status|days_to|-os\b|-ttf\b|-mfs\b|-rfs\b/.test(t)) return "Progression & Prognosis";
  if (/pcr|residual|therapy|treatment|rcb|adjuvant|cause|event/.test(t)) return "Therapeutic Response";
  if (/-comp/.test(t)) return "Microenvironment";
  if (/subtype|grading|benign|malignant|cin|staging|testis-pt|testis-infiltration/.test(t) && !/-eber|-bcl2|-cd20|-cd10|-ar|he2|-her2|-er|-pr|-ki-67|-ck|-gata3|-s100|-syn|-pax8|-p40|-ttf1|-cdx2|-psa|-p53|-pd-l1/.test(t)) return "Diagnosis & Grading";
  return "Biomarker Expression";
}

function getTopTaskRows(limit = 24) {
  return Object.entries(DATA.tasks)
    .map(([task, rows]) => {
      const sorted = [...rows].sort((a, b) => parseMean(b.auc) - parseMean(a.auc));
      return { task, best: sorted[0], models: rows.length, group: getTaskGroup(task) };
    })
    .filter(d => d.best)
    .sort((a, b) => parseMean(b.best.auc) - parseMean(a.best.auc))
    .slice(0, limit);
}

function createChart(ctx, labels, values, label = "AUC", yRange = null) {
  return new Chart(ctx, {
    type: 'bar',
    data: {
      labels,
      datasets: [{
        label,
        data: values,
        backgroundColor: 'rgba(109, 124, 255, 0.55)',
        borderColor: 'rgba(109, 124, 255, 0.95)',
        borderWidth: 1.2,
        borderRadius: 10,
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: { legend: { display: false } },
      scales: {
        x: {
          ticks: { color: '#4b5a7c', font: { size: 11 } },
          grid: { display: false }
        },
        y: {
          ticks: { color: '#4b5a7c' },
          grid: { color: 'rgba(99,102,241,0.09)' },
          suggestedMin: yRange ? yRange[0] : 0.7,
          suggestedMax: yRange ? yRange[1] : 1.0
        }
      }
    }
  });
}

document.addEventListener('DOMContentLoaded', () => {
  if (!document.querySelector("link[rel='icon']")) {
    const link = document.createElement("link");
    link.rel = "icon";
    link.href = "data:image/svg+xml,<svg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 100 100%22><text y=%22.9em%22 font-size=%2290%22>🧫</text></svg>";
    document.head.appendChild(link);
  }
  renderFooter();
});
