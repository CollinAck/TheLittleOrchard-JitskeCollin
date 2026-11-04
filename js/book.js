(function () {
  const viewport = document.getElementById('horizontalStory');
  const track = document.getElementById('horizontalTrack');
  if (!viewport || !track) return;
  function buildYearPage(year) {
    const h = harvest(year), pr = profit(year);
    const hn = h / maxH, pn = pr / maxP;
    const tilt = (pn - hn) * 10;
    const hail = HAIL_COUNTS[year] || 0;

    let yearLogo = ''
    if (String(year) === '2017') {
      yearLogo = '<img class="year-logo" src="img/logo-the-little-orchard.png">'
    }

    return `<article class="hyear-panel" data-year="${year}" aria-label="${year}">
      ${yearLogo}
      <div class="hyear-inner">
        ${buildSunLabel(year)}
        <div class="stage-hail show" tabindex="0" aria-label="${hail ? 'Hagel gevallen in' + year : 'Geen hagel gevallen in ' + year}">${buildHailDisplay(year)}</div>
        <div class="balance" data-target-tilt="${tilt.toFixed(2)}" data-left-y="${(-tilt * 1.7).toFixed(1)}" data-right-y="${(tilt * 1.7).toFixed(1)}">
          <div class="beam-wrap" style="transform:rotate(0deg)">
            <div class="pan left" style="transform:translateY(0px)">
              <div class="bowl"></div><div class="apple-bin">${buildApplesHTML(year)}</div>
              <button class="spray-single" type="button" tabindex="0" aria-label="Pesticide in ${year}">${buildSpraySummary(year)}</button>
            </div>            
            <div class="pan right" style="transform:translateY(0px)">
              <div class="bowl"></div><div class="money-bin">${buildMoneyCoins(year)}</div>
            </div>
          </div>
          <div class="stand-post"></div>
        </div>
        ${buildFallingApplesHTML(year)}
        <div class="hyear-ops" aria-label="Cooling and sales ${year}">
          <div class="handling-crate-wrap">
            <div class="handling-crate">${buildCartsHTML(year)}</div>
          </div>
          <div class="ops-connector" aria-hidden="true"></div>
          <div class="sales-truck-wrap"><div class="sales-truck">${buildTruckHTML(year)}</div></div>
        </div>
      </div>
    </article>`;
  }

  track.innerHTML = YEARS.map(buildYearPage).join('') + '<svg class="hroad-svg" id="hroadSvg" aria-label="Sand path with years"></svg>';
  const hroad = document.getElementById('hroadSvg');

  track.addEventListener('click', e => {
    const page = e.target.closest && e.target.closest('.hyear-panel');
    if (!page) return;
    const year = page.dataset.year;
    const idx = YEARS.indexOf(year);
    if (idx < 0) return;

    selectedYear = year;
    drawHorizontalSandPath();
    updatePageState(idx, true);
    navigationTarget = idx;
    viewport.scrollTo({ left: scrollPositionForYear(idx), behavior: 'smooth' });
    animateScaleForYear(year);
  });

  function pageWidth() {
    const first = track && track.querySelector ? track.querySelector('.hyear-panel') : null;
    if (first) {
      const w = first.getBoundingClientRect().width;
      if (w && Number.isFinite(w)) return w;
    }
    return window.innerWidth <= 980 ? window.innerWidth : window.innerWidth * .50;
  }
  function yearOffset() {
    return window.innerWidth <= 760 ? 72 : 112;
  }
  function maximumScroll() {
    return Math.max(0, track.scrollWidth - viewport.clientWidth);
  }
  function scrollPositionForYear(idx) {
    return Math.max(0, Math.min(maximumScroll(), idx * pageWidth()));
  }
  function restoreScales() {
    if (window.OrchardD3Scales) { window.OrchardD3Scales.reset(); return; }
    track.querySelectorAll('.hyear-panel .balance').forEach(balance => {
      const beam = balance.querySelector('.beam-wrap');
      const leftScale = balance.querySelector('.pan.left');
      const rightPan = balance.querySelector('.pan.right');
      if (beam) beam.style.transform = 'rotate(0deg)';
      if (leftScale) leftScale.style.transform = 'translateY(0px)';
      if (rightPan) rightPan.style.transform = 'translateY(0px)';
      balance.classList.remove('balance-clicked');
    });
  }
  function animateScaleForYear(year) {
    if (window.OrchardD3Scales) { window.OrchardD3Scales.animate(year); return; }
    restoreScales();
    const page = track.querySelector(`.hyear-panel[data-year="${year}"]`);
    const balance = page && page.querySelector('.balance');
    if (!balance) return;
    const beam = balance.querySelector('.beam-wrap');
    const leftScale = balance.querySelector('.pan.left');
    const rightPan = balance.querySelector('.pan.right');
    const tilt = Number(balance.dataset.targetTilt || 0);
    const leftY = Number(balance.dataset.leftY || 0);
    const rightY = Number(balance.dataset.rightY || 0);
    requestAnimationFrame(() => requestAnimationFrame(() => {
      balance.classList.add('balance-clicked');
      if (beam) beam.style.transform = `rotate(${tilt}deg)`;
      if (leftScale) leftScale.style.transform = `translateY(${leftY}px)`;
      if (rightPan) rightPan.style.transform = `translateY(${rightY}px)`;
    }));
  }

  function drawHorizontalSandPath() {
    const pw = pageWidth();
    const total = pw * YEARS.length;
    const h = window.innerWidth <= 760 ? 174 : 194;
    const y = window.innerWidth <= 760 ? 58 : 64;
    const compact = window.innerWidth <= 760;
    const beginIconX = total - (compact ? 190 : 270);
    window.OrchardD3Road.drawBook(hroad, {
      total: total, h, y, compact, beginIconX, pw, years: YEARS, activeYear: selectedYear,
      yearOffset: yearOffset(), periods: HARVEST_PERIODS, ranks: YEAR_RANKING,
      badge: buildYearRankSymbol, extras: buildTimelineDetails
    });
  }

  function activeIndexOnScroll() {
    const pw = pageWidth();
    const maxIndex = YEARS.length - 1;
    const raw = viewport.scrollLeft / pw;
    return Math.max(0, Math.min(maxIndex, Math.round(raw)));
  }

  let navigationTarget = null;
  function selectYearOnScroll() {
    if (navigationTarget !== null) {
      const targetLeft = scrollPositionForYear(navigationTarget);
      if (Math.abs(viewport.scrollLeft - targetLeft) > 8) return;
      navigationTarget = null;
    }
    const idx = activeIndexOnScroll();
    const year = YEARS[idx];
    if (selectedYear !== year) {
      selectedYear = year;

      drawHorizontalSandPath();
      animateScaleForYear(year);
    }
    updatePageState(idx);
  }

  function updatePageState(idx, restartFlow = false) {
    const pages = [...document.querySelectorAll('.hyear-panel')];
    pages.forEach((p, i) => {
      p.classList.toggle('active', i === idx || i === idx + 1 || i === idx - 1);
      p.classList.toggle('flow-active', i === idx);
    });
    const activePanelYear = YEARS[idx] || YEARS[0];
    if (window.OrchardD3Flows) window.OrchardD3Flows.activate(activePanelYear, restartFlow);
  }


  viewport.addEventListener('scroll', () => requestAnimationFrame(selectYearOnScroll), { passive: true });
  viewport.addEventListener('wheel', () => { navigationTarget = null; }, { passive: true });
  viewport.addEventListener('touchstart', () => { navigationTarget = null; }, { passive: true });
  hroad.addEventListener('click', e => {
    const hit = e.target.closest && e.target.closest('.road-stop-hit');
    if (!hit) return;
    const year = hit.dataset.year;
    const idx = YEARS.indexOf(year);
    if (idx >= 0) {

      selectedYear = year;
      drawHorizontalSandPath();
      updatePageState(idx, true);
      navigationTarget = idx;
      viewport.scrollTo({ left: scrollPositionForYear(idx), behavior: 'smooth' });
      animateScaleForYear(year);
    }
  });
  hroad.addEventListener('keydown', e => {
    const hit = e.target.closest && e.target.closest('.road-stop-hit');
    if (!hit || (e.key !== 'Enter' && e.key !== ' ')) return;
    e.preventDefault();
    const year = hit.dataset.year;
    const idx = YEARS.indexOf(year);
    if (idx >= 0) {

      selectedYear = year;
      drawHorizontalSandPath();
      updatePageState(idx, true);
      navigationTarget = idx;
      viewport.scrollTo({ left: scrollPositionForYear(idx), behavior: 'smooth' });
      animateScaleForYear(year);
    }
  });
  hroad.addEventListener('pointermove', e => {
    const hit = e.target.closest && e.target.closest('.road-metric-hit, .road-stop-hit');
    if (hit) showTimelineTooltip(hit, e.clientX, e.clientY);
    else timelineTooltip.classList.remove('show');
  });
  hroad.addEventListener('pointerleave', () => timelineTooltip.classList.remove('show'));
  hroad.addEventListener('focusin', e => {
    const hit = e.target.closest && e.target.closest('.road-metric-hit, .road-stop-hit');
    if (hit) {
      const bounds = hit.getBoundingClientRect();
      showTimelineTooltip(hit, bounds.left + bounds.width / 2, bounds.top);
    }
  });
  hroad.addEventListener('focusout', () => timelineTooltip.classList.remove('show'));

  window.addEventListener('resize', () => {
    drawHorizontalSandPath();
    const idx = Math.max(0, YEARS.indexOf(selectedYear));
    viewport.scrollLeft = scrollPositionForYear(idx);
  });

  selectedYear = '2017';
  viewport.scrollLeft = 0;
  restoreScales();
  drawHorizontalSandPath();
  selectYearOnScroll();
  updatePageState(activeIndexOnScroll());
})();
