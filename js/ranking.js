(function () {
  const podiumGrid = document.getElementById('podiumGrid');
  const compareGrid = document.getElementById('compareGrid');
  const remainingRanks = document.getElementById('remainingRanks');
  const bestVarietiesEl = document.getElementById('bestVarieties');
  if (!podiumGrid || !compareGrid || !remainingRanks || !bestVarietiesEl) return;

  const top3 = [...YEARS].filter(y => YEAR_RANKING[y] <= 3).sort((a, b) => YEAR_RANKING[a] - YEAR_RANKING[b]);

  function buildTrophyHTML(rank, year) {
    const trophy = rank === 1
      ? { main: '#e2b94a', dark: '#8a6522', light: '#f8e6a2', text: '#4f3912' }
      : rank === 2
        ? { main: '#d7dde4', dark: '#78818d', light: '#f7fafc', text: '#212121' }
        : { main: '#c69061', dark: '#7d5332', light: '#efd2b9', text: '#111111' };
    return `<svg class="podium-trophy" viewBox="0 0 72 72" aria-hidden="true">
      <path d="M23 16h26v10c0 8.6-5.9 15.4-13 15.4S23 34.6 23 26v-10Z" fill="${trophy.main}" stroke="${trophy.dark}" stroke-width="2.4"/>
      <path d="M23 20h-7c0 8.2 2.9 12.9 9.3 15.2M49 20h7c0 8.2-2.9 12.9-9.3 15.2" fill="none" stroke="${trophy.dark}" stroke-width="2.6" stroke-linecap="round"/>
      <path d="M30 42h12v8l6 5H24l6-5v-8Z" fill="${trophy.main}" stroke="${trophy.dark}" stroke-width="2.2"/>
      <rect x="22" y="55" width="28" height="7" rx="3.5" fill="${trophy.dark}"/>
      <circle cx="36" cy="29" r="10.8" fill="${trophy.light}" stroke="${trophy.dark}" stroke-width="1.7"/>
      <text x="36" y="30.8" font-family="Georgia,serif" font-size="8.6" font-weight="700" fill="${trophy.text}" text-anchor="middle" dominant-baseline="middle">${year}</text>
    </svg>`;
  }

  function buildPodiumHTML(y) {
    const rank = YEAR_RANKING[y];
    return `<div class="podium-item rank-${rank}">
      <div class="rank-wrap podium-rank-wrap">${buildTrophyHTML(rank, y)}${buildRankingInfo(y)}</div>
      <div class="podium-profit"> Profit: ${formatEuro(profit(y),0)}</div>
      <div class="podium-year">${y}</div>
      <div class="podium-rank">place ${rank}</div>
      <div class="podium-metric">${formatNumber(harvest(y), 0)} tonnes · ${formatEuro(profit(y), 0)} profit</div>
      <div class="podium-base"><span class="podium-base-number">${rank}</span></div>
    </div>`;
  }

  const order = [top3[1], top3[0], top3[2]];
  podiumGrid.innerHTML = order.map(buildPodiumHTML).join('');

  function buildComparisonRow(label, valueText) {
    return `<div class="compare-row"><span class="compare-label">${label}</span><div class="compare-track"></div><span class="compare-value">${valueText}</span></div>`;
  }

  compareGrid.innerHTML = order.map(y => {
    return `<article class="compare-card" aria-label="Vergelijking ${y}">
      ${buildComparisonRow('harvest', `${formatNumber(harvest(y), 0)} tonnes`, )}
      ${buildComparisonRow('price / kg', `€${formatNumber(price(y), 2)}`, )}
    </article>`;
  }).join('');

  const totalsByVariety = {};
  YEARS.forEach(y => appleVarieties(y).forEach(([name, tons]) => { totalsByVariety[name] = (totalsByVariety[name] || 0) + Number(tons || 0); }));
  const allVarieties = Object.entries(totalsByVariety).sort((a, b) => b[1] - a[1]);
  bestVarietiesEl.innerHTML = allVarieties.map(([name, tons], idx) => `<article class="variety-rank-card" aria-label="${name}, ${formatNumber(tons, 1)} tonnes total">
    <div class="variety-rank-icon"><span aria-hidden="true">${buildAppleSVG(colorForVariety(name))}</span><span class="variety-rank-number">${idx + 1}</span></div>
    <div class="variety-rank-copy"><strong>${name}</strong><small>${formatNumber(tons, 1)} tonnes · total 2010–2017</small><div class="variety-bar"></div></div>
  </article>`).join('');

  const remaining = [...YEARS].filter(y => YEAR_RANKING[y] > 3).sort((a, b) => YEAR_RANKING[a] - YEAR_RANKING[b]);
  function buildRankAppleIcon(rank) {
    return `<svg class="rank-apple" viewBox="0 0 64 64" aria-hidden="true">
      <path d="M31 15c-7-7-18-2-21 8-5 17 6 30 21 30s26-13 21-30c-3-10-14-15-21-8Z" fill="#a9433b" stroke="#7a4b36" stroke-width="2"/>
      <path d="M31 16c0-6 3-10 8-13" fill="none" stroke="#6b4a32" stroke-width="3" stroke-linecap="round"/>
      <path d="M35 8c5-5 11-4 14-1-3 5-9 7-14 1Z" fill="#6f945f"/>
      <text x="31" y="34" font-family="Georgia,serif" font-size="18" font-weight="700" fill="#ffffff" text-anchor="middle" dominant-baseline="middle">${rank}</text>
    </svg>`;
  }

  remainingRanks.innerHTML = remaining.map(y => {
    const rank = YEAR_RANKING[y];
    return `<article class="rank-row" aria-label="Rank ${rank}, year ${y}">
      <div class="rank-wrap">${buildRankAppleIcon(rank)}${buildRankingInfo(y)}</div>
      <div class="rank-row-year">${y}</div>
      <div class="rank-row-metrics">
        <div class="rank-row-metric"><small>harvest</small><strong>${formatNumber(harvest(y), 0)} tonnes</strong><div class="rank-row-bar"></div></div>
        <div class="rank-row-metric"><small>profit</small><strong>${formatEuro(profit(y), 0)}</strong><div class="rank-row-bar"></div></div>
        <div class="rank-row-metric"><small>price / kg</small><strong>€${formatNumber(price(y), 2)}</strong><div class="rank-row-bar"></div></div>
      </div>
    </article>`;
  }).join('');

})();
