
(function () {
  'use strict';

  if (typeof d3 === 'undefined') {
    console.error('D3.js is not loaded; d3-visuals.js requires D3.');
    return;
  }
  const reducedMotion = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const numberOrZero = value => Number.isFinite(+value) ? +value : 0;
  const shade = { wood: '#855d3a', woodDark: '#5f422d', gold: '#c39238', goldLight: '#f3d98c', gray: '#9a9082', rim: '#d5c8b5' };


  function drawApple(group, color) {
    group.append('path')
      .attr('d', 'M9 5.2C6.6 3.4 3.7 4.4 3.5 7.5C3.2 11.5 6 14.8 9 13.3C12 14.8 14.8 11.5 14.5 7.5C14.3 4.4 11.4 3.4 9 5.2Z')
      .attr('fill', color).attr('stroke', 'rgba(48,45,35,.24)').attr('stroke-width', .8);
    group.append('path').attr('d', 'M9 5.1Q9.2 2.8 10.6 1.8')
      .attr('fill', 'none')
      .attr('stroke', '#775334')
      .attr('stroke-width', 1)
      .attr('stroke-linecap', 'round');
    group.append('ellipse').attr('cx', 12).attr('cy', 2.6).attr('rx', 2).attr('ry', 1.1)
      .attr('transform', 'rotate(-22 12 2.6)').attr('fill', '#78995f');
  }

  function drawHarvestApples() {
    d3.selectAll('svg.d3-harvest-svg').each(function () {
      const year = this.getAttribute('data-year');
      const crops = appleVarieties(year).filter(item => numberOrZero(item[1]) > 0).map(item => ({ name: item[0], tons: numberOrZero(item[1]) }));
      const svg = d3.select(this); svg.selectAll('*').remove();
      if (!crops.length) return;
      const maximum = d3.max(crops, d => d.tons) || 1;
      const scale = d3.scaleSqrt().domain([0, maximum]).range([12, 31]);
      const cols = Math.min(5, crops.length), rows = Math.ceil(crops.length / cols);
      const pitch = 180 / (cols + 0.3);
      const apples = svg.selectAll('g.d3-harvest-apple').data(crops).enter().append('g')
        .attr('class', 'd3-harvest-apple')
        .attr('transform', (d, i) => {
          const col = i % cols, row = Math.floor(i / cols);
          const x = 90 + (col - (cols - 1) / 2) * pitch;
          const y = 50 + (row - (rows - 1) / 2) * 38;
          return `translate(${x.toFixed(1)},${y.toFixed(1)}) scale(${(scale(d.tons) / 18).toFixed(3)}) translate(-9,-9)`;
        });
      apples.each(function (d) { drawApple(d3.select(this), colorForVariety(d.name)); });
    });
  }


  function buildScale(balance) {
    const beamWrap = balance.querySelector('.beam-wrap');
    const pans = ['left', 'right'].map(side => balance.querySelector(`.pan.${side}`));
    if (!beamWrap || pans.some(p => !p)) return;
    const base = d3.select(balance).insert('svg', '.beam-wrap')
      .attr('class', 'd3-scale-column')
      .attr('aria-hidden', 'true');
    const baseDefs = base.append('defs');
    const postGrad = baseDefs.append('linearGradient')
      .attr('id', 'd3post-' + balance.closest('.hyear-panel').dataset.year)
      .attr('x1', '0%').attr('x2', '100%').attr('y1', '0%').attr('y2', '0%');
    postGrad.selectAll('stop').data([
      { at: '0%', color: '#b68a60' }, { at: '35%', color: '#8e663f' }, { at: '100%', color: '#5b402b' }
    ]).enter().append('stop').attr('offset', d => d.at).attr('stop-color', d => d.color);
    const art = d3.select(beamWrap)
      .append('svg')
      .attr('class', 'd3-scale-art')
      .attr('aria-hidden', 'true');
    const defs = art.append('defs');
    const beamGrad = defs.append('linearGradient')
      .attr('id', 'd3beam-' + balance.closest('.hyear-panel').dataset.year)
      .attr('x1', '0%')
      .attr('y1', '0%')
      .attr('x2', '0%')
      .attr('y2', '100%');
    beamGrad.selectAll('stop').data([{ at: '0%', c: '#b38a5d' }, { at: '55%', c: '#835d3a' }, { at: '100%', c: '#573c2a' }]).enter()
      .append('stop')
      .attr('offset', d => d.at).attr('stop-color', d => d.c);
    const beam = art.append('g').attr('class', 'd3-beam-shape');
    const panDraw = art.selectAll('g.d3-svg-pan').data(['left', 'right']).enter().append('g')
      .attr('class', d => 'd3-svg-pan d3-pan-' + d);

    function calculateLayout() {
      const width = beamWrap.clientWidth || 600;
      const height = Math.max(320, balance.clientHeight || 360);
      base.attr('viewBox', `0 0 ${balance.clientWidth || 700} ${height}`);
      art.attr('viewBox', `0 0 ${width} 320`);
      base.selectAll('.d3-stand').remove();
      const cx = (balance.clientWidth || 700) / 2;
      const post = base.append('g').attr('class', 'd3-stand');
      const postTop = balance.querySelector('.stand-post')?.offsetTop || 134;
      const postHeight = balance.querySelector('.stand-post')?.offsetHeight || 224;
      post.append('rect')
        .attr('x', cx - 11)
        .attr('y', postTop)
        .attr('width', 22)
        .attr('height', postHeight)
        .attr('rx', 9)
        .attr('fill', `url(#${postGrad.attr('id')})`)
        .attr('stroke', '#765539')
        .attr('stroke-opacity', .42);
      post.append('ellipse').attr('cx', cx).attr('cy', postTop + 4).attr('rx', 17).attr('ry', 9)
        .attr('fill', shade.goldLight).attr('stroke', '#966d2b').attr('stroke-width', 1.4);
      beam.selectAll('*').remove();
      beam.append('rect').attr('x', 0).attr('y', 6).attr('width', width).attr('height', 12)
        .attr('rx', 6)
        .attr('fill', `url(#${beamGrad.attr('id')})`)
        .attr('stroke', '#73502f')
        .attr('stroke-width', 1);
      beam.selectAll('circle.d3-beam-end').data([6, width - 6]).enter().append('circle')
        .attr('class', 'd3-beam-end')
        .attr('cx', d => d)
        .attr('cy', 12)
        .attr('r', 7.3)
        .attr('fill', shade.gold)
        .attr('stroke', '#825b25').attr('stroke-width', 1.1);
      panDraw.each(function (side, i) {
        const pan = pans[i], scalePan = pan.querySelector('.bowl');
        const x = pan.offsetLeft + pan.offsetWidth / 2;
        const top = pan.offsetTop + (scalePan?.offsetTop || 58);
        const bw = scalePan?.offsetWidth || (i === 0 ? 182 : 182);
        const bh = scalePan?.offsetHeight || 104;
        const group = d3.select(this); group.selectAll('*').remove();
        group.append('line').attr('x1', x).attr('x2', x).attr('y1', 12).attr('y2', top + 2)
          .attr('stroke', '#92816b').attr('stroke-width', 3).attr('stroke-linecap', 'round');
        group.append('circle')
          .attr('cx', x)
          .attr('cy', top + 2)
          .attr('r', 5)
          .attr('fill', '#8e775b');
        const half = bw / 2;
        group.append('path')
          .attr('d', `M${x - half} ${top} C${x - half + 2} ${top + bh * .50},${x - half * .55} ${top + bh},${x} ${top + bh} C${x + half * .55} ${top + bh},${x + half - 2} ${top + bh * .50},${x + half} ${top} Z`)
          .attr('fill', '#e2d8ca').attr('stroke', '#ab9a84').attr('stroke-width', 2);
        group.append('ellipse').attr('cx', x).attr('cy', top + 3).attr('rx', half + 3).attr('ry', 8)
          .attr('fill', '#f7f0e5').attr('stroke', '#ac9e8a').attr('stroke-width', 2);
      });
    }
    calculateLayout();
    return { balance, beamWrap, pans, panDraw, layout: calculateLayout };
  }
  const scaleParts = [...document.querySelectorAll('.hyear-panel .balance')].map(buildScale).filter(Boolean);

  function tiltScales(year, duration) {
    scaleParts.forEach(obj => {
      const active = obj.balance.closest('.hyear-panel').dataset.year === String(year);
      const target = active ? numberOrZero(obj.balance.dataset.targetTilt) : 0;
      const left = active ? numberOrZero(obj.balance.dataset.leftY) : 0;
      const right = active ? numberOrZero(obj.balance.dataset.rightY) : 0;
      const balance = obj.balance;
      d3.select(balance).interrupt();
      const fromTilt = numberOrZero(balance.dataset.d3Tilt), fromLeft = numberOrZero(balance.dataset.d3Left), fromRight = numberOrZero(balance.dataset.d3Right);
      const drawScales = (tilt, dyL, dyR) => {
        obj.beamWrap.style.transform = `rotate(${tilt}deg)`;
        obj.pans[0].style.transform = `translateY(${dyL}px)`;
        obj.pans[1].style.transform = `translateY(${dyR}px)`;
        obj.panDraw.filter(d => d === 'left').attr('transform', `translate(0,${dyL})`);
        obj.panDraw.filter(d => d === 'right').attr('transform', `translate(0,${dyR})`);
        balance.dataset.d3Tilt = tilt;
        balance.dataset.d3Left = dyL;
        balance.dataset.d3Right = dyR;
      };
      if (!duration) { drawScales(target, left, right); return; }
      d3.select(balance).transition().duration(duration).ease(d3.easeCubicInOut).tween('d3-scale', function () {
        return function (t) { drawScales(fromTilt + (target - fromTilt) * t, fromLeft + (left - fromLeft) * t, fromRight + (right - fromRight) * t); };
      });
    });
  }
  window.OrchardD3Scales = {
    reset: () => tiltScales(null, 0),
    animate: (year) => tiltScales(year, reducedMotion ? 0 : 780),
    redraw: () => scaleParts.forEach(o => o.layout())
  };
  window.OrchardD3Scales.animate('2017');


  function drawFallingApples(page) {
    const svgElement = page.querySelector('.d3-apple-flow-svg');
    const appleFlow = page.querySelector('.apple-flow-layer');
    const scalePan = page.querySelector('.pan.left .bowl');
    const cool = page.querySelector('.crate-unit.cool .crate-bay');
    const sold = page.querySelector('.crate-unit.sold .crate-bay');
    if (!svgElement || !appleFlow || !scalePan || !cool || !sold) return;
    const year = page.dataset.year;
    const rect = appleFlow.getBoundingClientRect();
    if (rect.width < 5 || rect.height < 5) return;
    const svg = d3.select(svgElement).attr('viewBox', `0 0 ${rect.width} ${rect.height}`)
      .attr('preserveAspectRatio', 'none');
    svg.selectAll('*').remove();
    const tonsCool = Math.max(0, handlingTonnes(year, 'cooling'));
    const tonsSold = Math.max(0, handlingTonnes(year, 'sold'));
    const total = tonsCool + tonsSold; if (total <= 0) return;
    const amount = Math.max(10, Math.min(24, Math.round(10 + harvest(year) / (maxH || 1) * 14)));
    let nCool = Math.round(amount * tonsCool / total);
    nCool = tonsCool <= 0 ? 0 : Math.max(1, nCool);
    nCool = tonsSold <= 0 ? amount : Math.min(amount - 1, nCool);
    const destinations = [...Array(nCool).fill('cool'), ...Array(amount - nCool).fill('sold')];
    const varietiesYear = appleVarieties(year).filter(([, v]) => numberOrZero(v) > 0);
    const maxVariety = Math.max(1, ...varietiesYear.map(v => numberOrZero(v[1])));
    const sizeScale = d3.scaleSqrt().domain([0, maxVariety]).range([10, 19]);
    const sourceMeasurements = scalePan.getBoundingClientRect();
    const targetMeasurements = { cool: cool.getBoundingClientRect(), sold: sold.getBoundingClientRect() };
    const centerX = r => (r.left + r.right) / 2;
    const appleParticles = destinations.map((destination, i) => {
      const item = chooseWeightedAppleVariety(year, i, amount) || ['Apple', 1];
      const target = targetMeasurements[destination], size = sizeScale(item[1]);
      const x0 = centerX(sourceMeasurements) - rect.left + ((i % 5) - 2) * Math.min(11, sourceMeasurements.width * .065);
      const y0 = sourceMeasurements.bottom - rect.top - Math.min(35, sourceMeasurements.height * .32);
      const x1 = centerX(target) - rect.left + ((i % 3) - 1) * Math.min(10, target.width * .07);
      const y1 = target.top - rect.top + target.height * .55;
      const cy = Math.max(y0 + 35, (y0 + y1) / 2 - 35);
      return {
        dest: destination, i, name: item[0], tons: item[1], size: size,
        path: `M${x0.toFixed(1)},${y0.toFixed(1)} C${(x0 - 15 + (i % 4) * 9).toFixed(1)},${cy.toFixed(1)} ${(x1 + ((i % 3) - 1) * 9).toFixed(1)},${(cy + 40).toFixed(1)} ${x1.toFixed(1)},${y1.toFixed(1)}`,
        dur: (2.9 + (i % 5) * .18).toFixed(2) + 's', start: ((i % 7) * .34 + (destination === 'sold' ? .18 : 0)).toFixed(2) + 's'
      };
    });
    const startAnimations = [];
    const flight = svg.selectAll('g.d3-apple-flight').data(appleParticles).enter().append('g')
      .attr('class', d => 'd3-apple-flight d3-apple-flight-' + d.dest).attr('opacity', 0);
    flight.each(function (d) {
      const g = d3.select(this);
      const glyph = g.append('g')
        .attr('transform', `scale(${(d.size / 18).toFixed(3)}) translate(-9,-9)`);
      drawApple(glyph, colorForVariety(d.name));
      if (reducedMotion) return;
      const motion = g.append('animateMotion')
        .attr('path', d.path)
        .attr('dur', d.dur)
        .attr('begin', 'indefinite')
        .attr('repeatCount', 'indefinite').attr('rotate', 'auto').node();
      const visibilityAnimation = g.append('animate')
        .attr('attributeName', 'opacity')
        .attr('values', '0;1;1;0')
        .attr('keyTimes', '0;.12;.89;1').attr('dur', d.dur).attr('begin', 'indefinite')
        .attr('repeatCount', 'indefinite').node();
      startAnimations.push({ motion: motion, opacityAnim: visibilityAnimation, delay: parseFloat(d.start) || 0 });
    });
    requestAnimationFrame(() => {
      if (!page.classList.contains('flow-active')) return;
      startAnimations.forEach(({ motion: motion, opacityAnim: visibilityAnimation, delay: delay }) => {
        if (motion.isConnected && motion.beginElementAt) motion.beginElementAt(delay);
        if (visibilityAnimation.isConnected && visibilityAnimation.beginElementAt) visibilityAnimation.beginElementAt(delay);
      });
    });
  }
  let currentFlowYear = null;

  function activateAppleFlow(year, restart = false) {
    year = String(year);
    const chosenPage = document.querySelector(`.hyear-panel[data-year="${year}"]`);
    if (!chosenPage) return;
    const hasParticles = !!chosenPage.querySelector('g.d3-apple-flight');
    document.querySelectorAll('.hyear-panel').forEach(page => {
      const isSelected = page === chosenPage;
      page.classList.toggle('flow-active', isSelected);
      if (!isSelected) {
        const svg = page.querySelector('svg.d3-apple-flow-svg');
        if (svg) d3.select(svg).selectAll('*').remove();
      }
    });
    if (restart || currentFlowYear !== year || !hasParticles) drawFallingApples(chosenPage);
    currentFlowYear = year;
  }

  function redrawAppleFlow() {
    const chosenPage = document.querySelector('.hyear-panel.flow-active');
    if (chosenPage) activateAppleFlow(chosenPage.dataset.year, true);
  }
  window.OrchardD3Flows = { activate: activateAppleFlow };


  function drawRanking() {
    const podium = document.getElementById('podiumGrid');
    const compare = document.getElementById('compareGrid');
    if (!podium || !compare) return;
    const sortedYears = [...YEARS].filter(y => YEAR_RANKING[y] <= 3).sort((a, b) => YEAR_RANKING[a] - YEAR_RANKING[b]);
    const display = [sortedYears[1], sortedYears[0], sortedYears[2]];
    d3.select(podium).selectAll('.podium-item').data(display)
      .attr('data-d3-year', d => d).each(function (year) {
        const rank = YEAR_RANKING[year];
        const colorScheme = rank === 1 ? { main: '#e2b94a', dark: '#8a6522', light: '#f8e6a2', text: '#4f3912' }
          : rank === 2 ? { main: '#d7dde4', dark: '#78818d', light: '#f7fafc', text: '#212121' }
            : { main: '#c69061', dark: '#7d5332', light: '#efd2b9', text: '#111111' };
        const wrap = d3.select(this).select('.rank-wrap');
        wrap.selectAll('svg.podium-trophy').remove();
        const svg = wrap.insert('svg', ':first-child')
          .attr('class', 'podium-trophy d3-podium-trophy')
          .attr('viewBox', '0 0 72 72')
          .attr('aria-label', `Rank ${rank}, year ${year}, ${formatNumber(harvest(year), 0)} tonnes`)
          .attr('role', 'img');
        svg.append('path').attr('d', 'M23 16h26v10c0 8.6-5.9 15.4-13 15.4S23 34.6 23 26v-10Z')
          .attr('fill', colorScheme.main).attr('stroke', colorScheme.dark).attr('stroke-width', 2.4);
        svg.append('path')
          .attr('d', 'M23 20h-7c0 8.2 2.9 12.9 9.3 15.2M49 20h7c0 8.2-2.9 12.9-9.3 15.2')
          .attr('fill', 'none')
          .attr('stroke', colorScheme.dark)
          .attr('stroke-width', 2.6)
          .attr('stroke-linecap', 'round');
        svg.append('path').attr('d', 'M30 42h12v8l6 5H24l6-5v-8Z')
          .attr('fill', colorScheme.main).attr('stroke', colorScheme.dark).attr('stroke-width', 2.2);
        svg.append('rect')
          .attr('x', 22)
          .attr('y', 55)
          .attr('width', 28)
          .attr('height', 7)
          .attr('rx', 3.5)
          .attr('fill', colorScheme.dark);
        svg.append('circle')
          .attr('cx', 36)
          .attr('cy', 29)
          .attr('r', 10.8)
          .attr('fill', colorScheme.light)
          .attr('stroke', colorScheme.dark).attr('stroke-width', 1.7);
        svg.append('text').attr('x', 36).attr('y', 30.8).attr('font-family', 'Georgia,serif')
          .attr('font-size', 8.6).attr('font-weight', 700).attr('fill', colorScheme.text)
          .attr('text-anchor', 'middle').attr('dominant-baseline', 'middle').text(year);
      });
    const maxTopThreeHarvest = d3.max(display, harvest) || 1, maxTopThreeProfit = d3.max(display, profit) || 1, maxTopThreePrice = d3.max(display, price) || 1;
    const drawBar = (track, width, cls, ctx) => {
      const selection = d3.select(track);
      selection.selectAll('svg.d3-rank-bar').remove();
      const svg = selection.append('svg').attr('class', 'd3-rank-bar').attr('viewBox', '0 0 100 12')
        .attr('preserveAspectRatio', 'none').attr('aria-label', ctx).attr('role', 'img');
      svg.append('rect')
        .attr('width', 100)
        .attr('height', 12)
        .attr('rx', 5)
        .attr('fill', '#e4d8c5');
      const colors = { harvest: '#c56d51', profit: '#9fb66a', price: '#d7ab4e', variety: '#a4b978' };
      const rect = svg.append('rect')
        .attr('class', 'd3-ranking-fill ' + cls)
        .attr('width', reducedMotion ? width : 0)
        .attr('height', 12).attr('rx', 5).attr('fill', colors[cls] || colors.variety);
      if (!reducedMotion) rect.transition().duration(700).ease(d3.easeCubicOut).attr('width', width);
    };
    const keys = [
      { cls: 'harvest', get: harvest, max: maxTopThreeHarvest, label: 'harvest', unit: 'ton' },
      { cls: 'profit', get: profit, max: maxTopThreeProfit, label: 'profit', unit: 'euro' },
      { cls: 'price', get: price, max: maxTopThreePrice, label: 'price per kilogram', unit: 'euro per kg' }
    ];
    d3.select(compare).selectAll('.compare-card').data(display).each(function (year) {
      d3.select(this).selectAll('.compare-row').data(keys).each(function (key) {
        const v = key.get(year), scale = d3.scaleLinear().domain([0, Math.max(1, key.max)]).range([0, 100]);
        drawBar(this.querySelector('.compare-track'), Math.max(8, Math.min(100, scale(Math.max(0, v)))), key.cls,
          `${year} ${key.label}: ${formatNumber(v, 1)} ${key.unit}`);
      });
    });
    const maxima = { harvest: d3.max(YEARS, harvest) || 1, profit: d3.max(YEARS, profit) || 1, price: d3.max(YEARS, price) || 1 };
    d3.select('#remainingRanks').selectAll('.rank-row').each(function () {
      const year = this.querySelector('.rank-row-year')?.textContent?.trim();
      if (!year) return;
      d3.select(this).selectAll('.rank-row-metric').data(keys).each(function (key) {
        const v = key.get(year), scale = d3.scaleLinear().domain([0, maxima[key.cls]]).range([0, 100]);
        drawBar(this.querySelector('.rank-row-bar'), Math.max(8, Math.min(100, scale(Math.max(0, v)))), key.cls,
          `${year} ${key.label}: ${formatNumber(v, 1)} ${key.unit}`);
      });
    });

    const remainingYears = [...YEARS].filter(year => YEAR_RANKING[year] > 3).sort((a, b) => YEAR_RANKING[a] - YEAR_RANKING[b]);
    d3.select('#remainingRanks').selectAll('.rank-row').data(remainingYears).each(function (year) {
      const svg = d3.select(this).select('svg.rank-apple');
      if (svg.empty()) return;
      svg.selectAll('*').remove();
      const rank = YEAR_RANKING[year];
      const g = svg.append('g').attr('transform', 'translate(-4,5) scale(3.55)');
      drawApple(g, '#a9433b');
      svg.append('text').attr('x', 31).attr('y', 35).attr('text-anchor', 'middle')
        .attr('dominant-baseline', 'middle').attr('font-family', 'Georgia,serif')
        .attr('font-weight', 700).attr('font-size', 18).attr('fill', '#fff').text(rank);
    });

    const totalsByVariety = {};
    YEARS.forEach(year => appleVarieties(year).forEach(([name, tons]) => { totalsByVariety[name] = (totalsByVariety[name] || 0) + numberOrZero(tons); }));
    const sortedVarieties = Object.entries(totalsByVariety).sort((a, b) => b[1] - a[1]);
    const maxVariety = d3.max(sortedVarieties, v => v[1]) || 1;
    d3.select('#bestVarieties').selectAll('.variety-rank-card').data(sortedVarieties).each(function (v) {
      const scale = d3.scaleSqrt().domain([0, maxVariety]).range([0, 100]);
      drawBar(this.querySelector('.variety-bar'), Math.max(10, scale(v[1])), 'variety',
        `${v[0]}: ${formatNumber(v[1], 1)} tonnes harvested`);
    });
  }

  drawHarvestApples();
  drawRanking();
  let updatingMeasurements = false;

  function updateMeasurements() {
    if (updatingMeasurements) return;
    updatingMeasurements = true;
    requestAnimationFrame(() => requestAnimationFrame(() => {
      updatingMeasurements = false;
      window.OrchardD3Scales.redraw();
      redrawAppleFlow();
    }));
  }
  updateMeasurements();
  window.addEventListener('resize', updateMeasurements, { passive: true });
  window.addEventListener('orientationchange', updateMeasurements, { passive: true });
  if (document.fonts?.ready) document.fonts.ready.then(updateMeasurements);
  const track = document.getElementById('horizontalTrack');
  if (track) {
    track.addEventListener('transitionend', function (e) {
      if (e.target.closest?.('.beam-wrap,.hyear-ops')) updateMeasurements();
    });
  }
})();
