const ORCHARD_DATA = window.ORCHARD_DATA;
const FINANCIAL_SUMMARY = window.FINANCIAL_SUMMARY;

const YEARS = ['2017', '2016', '2015', '2014', '2013', '2012', '2011', '2010'];
let selectedYear = '2017';
const COLOR_PALETTE = ['#C94B43', '#E0A22F', '#6FA84A', '#3F7FD8', '#8A5CCF', '#E07A5F', '#D65C9A', '#3AA6A0', '#8C6B4F', '#F2C84B'];
const colorsByVariety = {}; let nextColorIndex = 0;
function colorForVariety(n) {
  if (!colorsByVariety[n]) colorsByVariety[n] = COLOR_PALETTE[nextColorIndex++ % COLOR_PALETTE.length]; return colorsByVariety[n];
}
function formatNumber(n, d = 0) {
  return Number(n || 0).toLocaleString('en-GB', { minimumFractionDigits: d, maximumFractionDigits: d });
}
function formatEuro(n, d = 0) {
  return Number(n || 0).toLocaleString('en-GB', { style: 'currency', currency: 'EUR', minimumFractionDigits: d, maximumFractionDigits: d });
}
function harvest(y) {
  return Object.values(ORCHARD_DATA.production[y] || {}).reduce((s, p) => s + Number(p.tons || 0), 0);
}
function revenue(y) {
  return Number(FINANCIAL_SUMMARY.supply[y] ?? ORCHARD_DATA.financial[y]?.revenue ?? 0);
}
function knownCosts(y) {
  return Math.max(0, Number(FINANCIAL_SUMMARY.totalCosts[y] || 0)) + Math.max(0, Number(ORCHARD_DATA.financial[y]?.labor_cost || 0));
}
function profit(y) {
  return revenue(y) - knownCosts(y);
}
function price(y) {
  return Number(ORCHARD_DATA.financial[y]?.avg_price || 0);
}
function laborCosts(y) {
  return Number(ORCHARD_DATA.financial[y]?.labor_cost || 0);
}
function usedPlots(y) {
  return Object.values(ORCHARD_DATA.production[y] || {}).filter(p => Number(p.tons || 0) > 0).length;
}
function compareWithEarlierYear(fn, y) {
  const i = YEARS.indexOf(y);
  if (i < 0 || i >= YEARS.length - 1) return null;
  const prev = fn(YEARS[i + 1]);
  if (prev == null || Number.isNaN(prev) || prev === 0) return fn(y) === 0 ? 0 : null;
  return ((fn(y) - prev) / Math.abs(prev)) * 100;
}
function compareAmountWithUnit(fn, y, formatter, unitText) {
  const i = YEARS.indexOf(y);
  if (i < 0 || i >= YEARS.length - 1) return '';
  const earlier = YEARS[i + 1];
  const current = Number(fn(y) || 0);
  const prev = Number(fn(earlier) || 0);
  const diff = current - prev;
  if (Math.abs(diff) < 1e-9) return `${formatter(0)} unchanged from ${earlier}`;
  return `${formatter(Math.abs(diff))} ${diff > 0 ? 'more' : 'less'} ${unitText} than ${earlier}`;
}
function drawLaborIcon(x, y, r) {
  const s = (r / 23).toFixed(3);
  return `<g transform="translate(${x} ${y - 6}) scale(${s})">
    <circle class="road-metric-labor" cx="-6" cy="-6" r="4.2"></circle>
    <path class="road-metric-labor" d="M -13 7 q 1 -8 7 -8 q 6 0 7 8 M -10 3 h 8"></path>
    <circle class="road-metric-labor fill" cx="8.5" cy="0" r="7"></circle>
    <path class="road-metric-labor" d="M 10.5 -3.5 q -1.4 -1.2 -3.2 -1.2 q -3.1 0 -3.1 4.7 q 0 4.7 3.1 4.7 q 1.8 0 3.2 -1.2 M 2.7 -1.2 h 5.3 M 2.7 1.2 h 4.8"></path>
  </g>`;
}
function drawTimelineAppleIcon(x, y, r) {
  const s = (r / 20).toFixed(3);
  return `<g transform="translate(${x} ${y - 6}) scale(${s})">
    <path class="road-metric-icon" d="M 0 -9 q 0 -4 3 -5"></path>
    <path class="road-metric-icon" d="M 1 -11 q 4 -1 5 2 q -3 1 -5 -2"></path>
    <path class="road-metric-icon" d="M 0 -7 C -5.4 -11.4, -10.2 -7.2, -8.6 -1.2 C -7.1 4.4, -2.1 6.2, 0 4.2 C 2.1 6.2, 7.1 4.4, 8.6 -1.2 C 10.2 -7.2, 5.4 -11.4, 0 -7 Z"></path>
  </g>`;
}
function drawTimelinePlotIcon(year, x, y, r) {
  const total = 6;
  const used = Math.max(0, Math.min(total, usedPlots(year)));
  const scale = (r / 24).toFixed(3);
  const size = 4.8, gapX = 2.9, gapY = 3.2;
  const totalW = (size * 3) + (gapX * 2);
  const totalH = (size * 2) + gapY;
  const startX = -(totalW / 2);
  const startY = -(totalH / 2);
  let blocks = '';
  for (let i = 0; i < total; i++) {
    const col = i % 3, row = Math.floor(i / 3);
    const bx = startX + col * (size + gapX);
    const by = startY + row * (size + gapY);
    const isUsed = i < used;
    blocks += `<rect class="${isUsed ? 'road-parcel-used' : 'road-parcel-unused'}" x="${bx}" y="${by}" width="${size}" height="${size}" rx="1.1"></rect>`;
    if (!isUsed) {
      blocks += `<path class="road-parcel-cross" d="M ${bx + 0.9} ${by + 0.9} L ${bx + size - 0.9} ${by + size - 0.9} M ${bx + size - 0.9} ${by + 0.9} L ${bx + 0.9} ${by + size - 0.9}"></path>`;
    }
  }
  return `<g transform="translate(${x} ${y - 6}) scale(${scale})">${blocks}</g>`;
}
function drawTimelineArrow(x, y, r, dir, mode = 'default') {
  const ax = x + r * 0.48, ay = y + r * 0.48, len = r * 0.72;
  const cls = dir === 'flat' ? 'flat' : (mode === 'positive-better' ? (dir === 'up' ? 'good' : 'bad') : (dir === 'up' ? 'up' : 'down'));
  if (dir === 'up') {
    return `<path class="road-metric-arrow ${cls}" d="M ${ax} ${ay + len * 0.20} L ${ax} ${ay - len * 0.42} M ${ax - len * 0.22} ${ay - len * 0.20} L ${ax} ${ay - len * 0.42} L ${ax + len * 0.22} ${ay - len * 0.20}"></path>`;
  }
  if (dir === 'down') {
    return `<path class="road-metric-arrow ${cls}" d="M ${ax} ${ay - len * 0.20} L ${ax} ${ay + len * 0.42} M ${ax - len * 0.22} ${ay + len * 0.20} L ${ax} ${ay + len * 0.42} L ${ax + len * 0.22} ${ay + len * 0.20}"></path>`;
  }
  return `<path class="road-metric-arrow flat" d="M ${ax - len * 0.28} ${ay} L ${ax + len * 0.30} ${ay} M ${ax + len * 0.08} ${ay - len * 0.20} L ${ax + len * 0.30} ${ay} L ${ax + len * 0.08} ${ay + len * 0.20}"></path>`;
}
function differenceDirection(delta) {
  if (delta == null || Number.isNaN(delta)) return 'flat';
  if (delta > 0.01) return 'up';
  if (delta < -0.01) return 'down';
  return 'flat';
}

function calculateYield(y) {
  const h = harvest(y), p = profit(y);
  return h > 0 ? p / h : 0;
}
const YEAR_RANKING = (() => {
  const ranked = [...YEARS].sort((a, b) => calculateYield(b) - calculateYield(a));
  const map = {};
  ranked.forEach((y, i) => map[y] = i + 1);
  return map;
})();

const HARVEST_PERIODS = {
  '2017': '13 Sep – 4 Oct',
  '2016': '8 Sep – 29 Oct',
  '2015': '3 Sep – 6 Nov',
  '2014': '15 Sep – 18 Oct',
  '2013': '10 Sep – 25 Oct',
  '2012': '18 Sep – 12 Oct',
  '2011': '9 Sep – 2 Nov',
  '2010': '14 Sep – 21 Oct'
};
function buildRankingInfo(y) {
  return `<span class="rank-tip"><span>${HARVEST_PERIODS[y] || ''}</span></span>`;
}

const SPRAY_PRODUCTS = [
  { key: 'captan', label: 'Captan', cls: 'captan' },
  { key: 'switch', label: 'Switch', cls: 'switch' },
  { key: 'bellis', label: 'Bellis', cls: 'bellis' }
];
const HAIL_COUNTS = { '2010': 1, '2012': 1, '2014': 1 };
function normalizeSprayName(v) {
  return String(v || '').toLowerCase().replace('switsch', 'switch');
}
function countSprayProduct(year, key) {
  const parcels = ORCHARD_DATA.production[year] || {};
  return Object.values(parcels).filter(p => normalizeSprayName(p.top_spray).includes(key)).length;
}

function buildSpraySummary(year) {
  const items = SPRAY_PRODUCTS.map(type => ({ label: type.label, count: countSprayProduct(year, type.key) })).filter(d => d.count > 0);
  const description = items.length ? items.map(d => `${d.label}: ${d.count}×`).join(' · ') : 'no main pesticide recorded';
  const tip = items.length
    ? items.map(d => `<span>${d.label}: ${d.count}×</span>`).join('')
    : '<span>no main pesticide recorded</span>';
  return `<svg class="d3-spray-svg" data-year="${year}" role="img" aria-label="Pesticides in ${year}: ${description}" viewBox="0 0 96 112"></svg><span class="spray-single-tip"><strong>pesticide</strong>${tip}</span>`;
}


function buildTimelineDetails(year, x, y, nextPoint, prevPoint) {
  if (year === '2010') return '';
  const mobile = window.innerWidth <= 760;
  const r = mobile ? 30 : 38;
  const isActive = year === selectedYear;
  const laborDirection = differenceDirection(compareWithEarlierYear(laborCosts, year));
  const priceDirection = differenceDirection(compareWithEarlierYear(price, year));
  const laborTitle = compareAmountWithUnit(laborCosts, year, v => formatEuro(v, 0), 'labour costs');
  const priceTitle = compareAmountWithUnit(price, year, v => formatEuro(v, 2), 'per kg');
  const parcelCount = usedPlots(year);
  const parcelTitle = `${parcelCount} plot${parcelCount === 1 ? '' : 's'} used in ${year}`;
  const target = nextPoint || { x: x + (prevPoint ? Math.max(126, Math.abs(x - prevPoint.x) * 0.48) : 126), y };
  const offsetY = y + (mobile ? 2 : 3);
  const points = [0.34, 0.54, 0.74].map(t => ({ x: x + (target.x - x) * t, y: offsetY }));
  return [
    { kind: 'labor', x: points[0].x, y: points[0].y, title: laborTitle, dir: laborDirection },
    { kind: 'price', x: points[1].x, y: points[1].y, title: priceTitle, dir: priceDirection },
    { kind: 'parcels', x: points[2].x, y: points[2].y, title: parcelTitle }
  ].map(item => {
    const circle = `<circle class="road-metric-bg" cx="${item.x}" cy="${item.y}" r="${r}"></circle>`;
    let icon = '', value = '';
    if (item.kind === 'labor') {
      icon = drawLaborIcon(item.x, item.y, r);
      value = drawTimelineArrow(item.x, item.y, r, item.dir);
    } else if (item.kind === 'price') {
      icon = drawTimelineAppleIcon(item.x, item.y, r);
      value = drawTimelineArrow(item.x, item.y, r, item.dir, 'positive-better');
    } else {
      icon = drawTimelinePlotIcon(year, item.x, item.y, r);
      value = '';
    }
    return `<g class="road-metric-hit ${isActive ? 'active' : 'ghost'}" data-tip="${item.title}" tabindex="0" aria-label="${item.title}" role="img">${circle}${icon}${value}</g>`;
  }).join('');
}

function buildHailDisplay(year) {
  const count = HAIL_COUNTS[year] || 0;
  if (!count) return '';
  return `<div class="stage-hail-tip"><span>${count} hailstorms</span></div>
  <svg viewBox="0 0 120 86" aria-hidden="true">
    <defs>
      <linearGradient id="hailCloud" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stop-color="#ffffff"/>
        <stop offset="100%" stop-color="#ffffff"/>
      </linearGradient>
      <linearGradient id="hailStone" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stop-color="#d9e7f5"/>
        <stop offset="100%" stop-color="#a9bfd8"/>
      </linearGradient>
    </defs>
    <path d="M27 52c-11 0-19-7-19-17 0-8 6-15 14-16 3-10 13-17 25-17 13 0 24 8 27 20 9 0 17 7 17 16 0 8-7 14-17 14H27Z" fill="#ffffff" stroke="#d8e0e6" stroke-width="2.5"/>
    <circle cx="38" cy="63" r="5.5" fill="url(#hailStone)" stroke="#8da6c2" stroke-width="1.2"/>
    <circle cx="55" cy="71" r="5.8" fill="url(#hailStone)" stroke="#8da6c2" stroke-width="1.2"/>
    <circle cx="73" cy="62" r="5.2" fill="url(#hailStone)" stroke="#8da6c2" stroke-width="1.2"/>
    <circle cx="89" cy="70" r="5.4" fill="url(#hailStone)" stroke="#8da6c2" stroke-width="1.2"/>
    <path d="M37 55 L39 59 M54 63 L56 66 M72 55 L74 59 M88 63 L90 66" stroke="#9eb6d5" stroke-width="1.2" stroke-linecap="round"/>
  </svg>`;
}
function appleVarieties(y) {
  const a = {}; Object.values(ORCHARD_DATA.production[y] || {}).forEach(p => Object.entries(p.varieties || {}).forEach(([n, v]) => a[n] = (a[n] || 0) + Number(v || 0)));
  return Object.entries(a).sort((x, z) => z[1] - x[1]);
}
const maxH = Math.max(...YEARS.map(harvest)), maxP = Math.max(...YEARS.map(profit));
function buildAppleSVG(fill) {
  return `<svg viewBox="0 0 18 18" aria-hidden="true"><path d="M9 5.2C6.6 3.4 3.7 4.4 3.5 7.5C3.2 11.5 6 14.8 9 13.3C12 14.8 14.8 11.5 14.5 7.5C14.3 4.4 11.4 3.4 9 5.2Z" fill="${fill}" stroke="rgba(48,45,35,.2)" stroke-width=".8"/><path d="M9 5.1Q9.2 2.8 10.6 1.8" fill="none" stroke="#775334" stroke-width="1" stroke-linecap="round"/><ellipse cx="12" cy="2.6" rx="2" ry="1.1" transform="rotate(-22 12 2.6)" fill="#78995f"/></svg>`;
}
function buildApplesHTML(y) {

  return `<svg class="d3-harvest-svg" viewBox="0 0 180 86" role="img" aria-label="Apple varieties harvested in ${y}" data-year="${y}"></svg>`;
}

function chooseWeightedAppleVariety(y, index, count) {
  const vars = appleVarieties(y).filter(([_, tons]) => tons > 0);
  if (!vars.length) return null;
  const total = vars.reduce((sum, [, tons]) => sum + Number(tons || 0), 0) || 1;
  const target = ((index + .5) / Math.max(1, count)) * total;
  let acc = 0;
  for (const item of vars) {
    acc += Number(item[1] || 0);
    if (target <= acc) return item;
  }
  return vars[vars.length - 1];
}
function buildFallingApplesHTML(y) {

  return `<div class="apple-flow-layer" aria-hidden="true"><svg class="d3-apple-flow-svg" data-year="${y}" aria-hidden="true"></svg></div>`;
}

const HANDLING_TONNES = ORCHARD_DATA.handling;

const SUN_HOURS = {
  "2017": { spring: 418, summer: 692, autumn: 352, winter: 198 },
  "2016": { spring: 392, summer: 666, autumn: 334, winter: 182 },
  "2015": { spring: 448, summer: 724, autumn: 382, winter: 214 },
  "2014": { spring: 364, summer: 608, autumn: 301, winter: 171 },
  "2013": { spring: 381, summer: 651, autumn: 318, winter: 188 },
  "2012": { spring: 401, summer: 673, autumn: 348, winter: 201 },
  "2011": { spring: 342, summer: 592, autumn: 286, winter: 164 },
  "2010": { spring: 372, summer: 621, autumn: 309, winter: 176 }
};
const SEASON_ORDER = ['spring', 'summer', 'autumn', 'winter'];
function sunHoursBySeason(y, key) {
  return Number(SUN_HOURS[y]?.[key] || 0);
}
function totalSunHours(y) {
  return SEASON_ORDER.reduce((sum, key) => sum + sunHoursBySeason(y, key), 0);
}
const MAX_REVENUE = Math.max(...YEARS.map(revenue));
const MAX_COSTS = Math.max(...YEARS.map(knownCosts));
const MAX_PROFIT = Math.max(...YEARS.map(profit));
const MAX_COINS = Math.max(MAX_REVENUE, MAX_COSTS, MAX_PROFIT);
const SEASON_INFO = {
  spring: { label: '', icon: `<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M18 5c-6.5 1.2-10.8 5.1-12 11.5 4.3-.2 7.6-1.8 10.1-4.7-1.1 2.7-1.3 5.3-.6 7.7" fill="none" stroke="#6f9d4f" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/><path d="M18 5c.3 4.5-1 7.8-4 10" fill="none" stroke="#8ebd68" stroke-width="2" stroke-linecap="round"/></svg>` },
  summer: { label: '', icon: `<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="4.6" fill="#efc24f" stroke="#c9972f" stroke-width="1.5"/><g stroke="#c9972f" stroke-width="1.7" stroke-linecap="round"><path d="M12 2.5v3"/><path d="M12 18.5v3"/><path d="M2.5 12h3"/><path d="M18.5 12h3"/><path d="M5.2 5.2l2.2 2.2"/><path d="M16.6 16.6l2.2 2.2"/><path d="M18.8 5.2l-2.2 2.2"/><path d="M7.4 16.6l-2.2 2.2"/></g></svg>` },
  autumn: { label: '', icon: `<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M19 4c-6 1-11 5.5-12.5 12.5 5-.3 9-2.3 11.8-6 .3 2.8-.1 5.2-1.3 7.5" fill="none" stroke="#b77739" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/><path d="M8.5 20.5c1.7-2.8 2.4-5.8 2-9.2" fill="none" stroke="#d69b5f" stroke-width="1.8" stroke-linecap="round"/></svg>` },
  winter: { label: '', icon: `<svg viewBox="0 0 24 24" aria-hidden="true"><g stroke="#86a9c8" stroke-width="1.8" stroke-linecap="round"><path d="M12 3v18"/><path d="M3 12h18"/><path d="M5.6 5.6l12.8 12.8"/><path d="M18.4 5.6L5.6 18.4"/></g></svg>` }
};

function handlingTonnes(y, type) {
  return Math.max(0, Number(HANDLING_TONNES[y]?.[type] || 0));
}
function buildCoolingIcon() {
  return `<img src="img/icon-cooling.png" alt="" style="width:100%;height:100%;object-fit:contain;display:block">`;
}
function buildSalesIcon() {
  return `<img src="img/icon-sold.png" alt="" style="width:100%;height:100%;object-fit:contain;display:block">`;
}

function buildCartsHTML(y) {
  const cooled = handlingTonnes(y, 'cooling'), sold = handlingTonnes(y, 'sold');
  const total = Math.max(1, cooled + sold);
  const compact = window.innerWidth <= 480, medium = window.innerWidth <= 900;
  const minimum = compact ? 18 : (medium ? 22 : 24), maximum = compact ? 82 : (medium ? 104 : 126);
  const sizeForValue = value => Math.round(minimum + Math.max(0, Math.min(1, value / total)) * (maximum - minimum));
  const maakKar = (kind, label, value, color, icon) => {
    const size = sizeForValue(value), ic = Math.max(10, Math.round(size * .38));
    return `<div class="crate-unit ${kind}">
      <button class="crate-bay ${kind}" type="button" tabindex="0" aria-label="${label} ${formatNumber(value, 1)} tonnes">
        <div class="crate-inner"><span class="crate-apple-wrap" style="width:${size}px;height:${size}px">
          <span class="crate-apple" style="width:${size}px;height:${size}px">${buildAppleSVG(color)}</span>
          <span class="crate-icon" style="width:${ic}px;height:${ic}px">${icon}</span>
        </span></div>
        <div class="crate-tip"><strong>${label.toLowerCase()}</strong><span>${formatNumber(value, 1)} tonnes in ${y}</span></div>
      </button>
      <svg class="d3-cart-svg" data-kind="${kind}" data-year="${y}" role="img" aria-label="Wooden cart: ${label} ${formatNumber(value, 1)} tonnes" viewBox="0 0 134 128" preserveAspectRatio="none"></svg>
    </div>`;
  };
  return maakKar('cool', 'Cooling', cooled, '#79b7dc', buildCoolingIcon()) +
    `<div class="crate-link" aria-hidden="true"></div>` +
    maakKar('sold', 'Sold', sold, '#d9a646', buildSalesIcon());
}

function buildTruckHTML(year) {
  let freightCost = Number(FINANCIAL_SUMMARY.accounts['Vracht'][year])
  if (Number.isNaN(freightCost)) {
    freightCost = 0 
  }

  const freightText = formatEuro(freightCost, 2);

  return '<div class="sales-truck-btn" aria-label="Freight costs ' + freightText + '">' +
    '<svg class="d3-truck-svg" data-year="' + year + '" viewBox="0 0 300 120" preserveAspectRatio="none" role="img" aria-label="Truck freight costs ' + freightText + '"></svg>' +
    '<div class="ops-big-tip"><strong>freight costs</strong><span>' + freightText + ' in ' + year + '</span></div>' +
    '</div>'
}
function buildMoneyCoins(y) {
  const entries = [
    { key: 'revenue', label: 'revenue', value: revenue(y), className: 'revenue' },
    { key: 'costs', label: 'costs', value: knownCosts(y), className: 'costs' },
    { key: 'profit', label: 'profit', value: profit(y), className: 'profit' }
  ];
  const stacks = entries.map(item => {
    const ratio = item.value / (MAX_COINS || 1);
    const count = Math.max(2, Math.min(14, Math.round(ratio * 12) + 1));
    const coins = '<span class="coin"></span>'.repeat(count);
    return `<button class="money-stack ${item.className}" type="button" tabindex="0" aria-label="${item.label} ${formatEuro(item.value, 0)}">${coins}<span class="money-stack-tip"><strong>${item.label}</strong><span>${formatEuro(item.value, 0)} in ${y}</span></span></button>`;
  }).join('');
  return `<div class="money-coins-group">${stacks}</div>`;
}

function buildSunLabel(y) {
  const rows = SEASON_ORDER.map(key => {
    const meta = SEASON_INFO[key];
    return `<div class="year-sun-row"><span class="year-sun-label"><span class="year-sun-icon">${meta.icon}</span></span><span>${formatNumber(sunHoursBySeason(y, key), 0)} hours</span></div>`;
  }).join('');
  return `<button class="year-sun" type="button" tabindex="0" aria-label="Sunshine hours: ${formatNumber(totalSunHours(y), 0)} hours in ${y}"><span class="year-sun-core"></span><span class="year-sun-tip">${rows}<div class="year-sun-total">Total ${formatNumber(totalSunHours(y), 0)} hours</div></span></button>`;
}


function buildYearRankSymbol(rank, cx, cy, size) {
  if (rank <= 3) {
    const trophy = rank === 1
      ? { main: '#d7b24a', dark: '#a57d22', light: '#f3de8b', text: '#6b4d11' }
      : rank === 2
        ? { main: '#bfc4cc', dark: '#858c97', light: '#eceff3', text: '#000000' }
        : { main: '#c48452', dark: '#8f5a33', light: '#e2b08a', text: '#5a3419' };
    const s = size / 72;
    return `<g class="road-rank-badge road-rank-shadow" transform="translate(${(cx - size / 2).toFixed(1)} ${(cy - size / 2).toFixed(1)}) scale(${s.toFixed(4)})">
      <path d="M23 16h26v10c0 8.6-5.9 15.4-13 15.4S23 34.6 23 26v-10Z" fill="${trophy.main}" stroke="${trophy.dark}" stroke-width="2.4"/>
      <path d="M23 20h-7c0 8.2 2.9 12.9 9.3 15.2M49 20h7c0 8.2-2.9 12.9-9.3 15.2" fill="none" stroke="${trophy.dark}" stroke-width="2.6" stroke-linecap="round"/>
      <path d="M30 42h12v8l6 5H24l6-5v-8Z" fill="${trophy.main}" stroke="${trophy.dark}" stroke-width="2.2"/>
      <rect x="22" y="55" width="28" height="7" rx="3.5" fill="${trophy.dark}"/>
      <circle cx="36" cy="29" r="10.8" fill="${trophy.light}" stroke="${trophy.dark}" stroke-width="1.7"/>
      <text x="36" y="29.8" font-size="15" fill="${trophy.text}">${rank}</text>
    </g>`;
  }
  const s = size / 58;
  return `<g class="road-rank-badge road-rank-shadow" transform="translate(${(cx - size / 2).toFixed(1)} ${(cy - size / 2).toFixed(1)}) scale(${s.toFixed(4)})">
    <path d="M28 12c-2.2-4.5.4-8.2 4.3-9.8" fill="none" stroke="#69462e" stroke-width="3" stroke-linecap="round"/>
    <path d="M31 8c4.8-5.1 10.8-3.6 13.1-1.4-2.9 4.9-8.5 6.4-13.1 1.4Z" fill="#6f945f"/>
    <path d="M29 12c-9.8-7-20.7.5-20.7 13.2C8.3 38.2 18.2 45 29 45s20.7-6.8 20.7-19.8C49.7 12.5 38.8 5 29 12Z" fill="#a9433b"/>
    <path d="M12 40h34l-3.2 12H15.2L12 40Z" fill="#b9834f"/>
    <path d="M16 44h26M19 48h20" stroke="#f0d2a6" stroke-width="2" stroke-linecap="round"/>
    <text x="29" y="27" font-size="18" fill="#ffffff">${rank}</text>
  </g>`;
}

const timelineTooltip = document.createElement('div');
timelineTooltip.className = 'road-hover-tip';
document.body.appendChild(timelineTooltip);
function showTimelineTooltip(hit, x, y) {
  if (!hit) return;
  timelineTooltip.textContent = hit.dataset.tip || '';
  timelineTooltip.classList.add('show');
  const path = 14;
  const rect = timelineTooltip.getBoundingClientRect();
  let left = x + 16, top = y - rect.height - 14;
  if (left + rect.width > window.innerWidth - path) left = x - rect.width - 16;
  if (top < path) top = y + 16;
  timelineTooltip.style.left = `${Math.max(path, left)}px`;
  timelineTooltip.style.top = `${Math.max(path, top)}px`;
}
