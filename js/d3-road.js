(function () {
  'use strict';

  if (typeof d3 === 'undefined') return;

  const sandPathLayers = [
    'road-shadow',
    'road-outline',
    'road-fill',
    'road-track-1',
    'road-track-2',
    'road-highlight'
  ];

  function drawSandPath(svgElement, width, height, path) {
    const svg = d3.select(svgElement);

    svg
      .attr('viewBox', `0 0 ${width} ${height}`)
      .attr('preserveAspectRatio', 'none');

    svg.selectAll('*').remove();

    svg.selectAll('path.d3-sandpath')
      .data(sandPathLayers)
      .enter()
      .append('path')
      .attr('class', name => `d3-sandpath ${name}`)
      .attr('d', path);

    return svg;
  }

  function drawYearButtons(svg, years, options) {
    const calendarWidth = options.calW;
    const calendarHeight = options.calH;
    const calendarHeaderHeight = options.topH;
    const centerY = options.y;

    const buttons = svg.selectAll('g.road-stop-hit')
      .data(years, year => year.year)
      .enter()
      .append('g')
      .attr('class', year => `road-stop-hit ${year.active ? 'active' : 'ghost'}`)
      .attr('data-year', year => year.year)
      .attr('data-tip', year => `Harvest period ${options.periods[year.year] || 'unknown'}`)
      .attr('tabindex', 0)
      .attr('role', 'button')
      .attr('aria-label', year => `Go to ${year.year}, harvest period ${options.periods[year.year] || 'unknown'}`);

    buttons.append('rect')
      .attr('class', 'road-stop')
      .attr('x', year => year.x - calendarWidth / 2)
      .attr('y', centerY - calendarHeight / 2)
      .attr('width', calendarWidth)
      .attr('height', calendarHeight)
      .attr('rx', 10);

    buttons.append('rect')
      .attr('class', 'road-stop-top')
      .attr('x', year => year.x - calendarWidth / 2)
      .attr('y', centerY - calendarHeight / 2)
      .attr('width', calendarWidth)
      .attr('height', calendarHeaderHeight)
      .attr('rx', 10);

    buttons.selectAll('line.road-stop-ringmark')
      .data(year => [
        year.x - calendarWidth * 0.22,
        year.x + calendarWidth * 0.22
      ])
      .enter()
      .append('line')
      .attr('class', 'road-stop-ringmark')
      .attr('x1', x => x)
      .attr('x2', x => x)
      .attr('y1', centerY - calendarHeight / 2 - 3)
      .attr('y2', centerY - calendarHeight / 2 + 7);

    buttons.append('text')
      .attr('class', 'road-year')
      .attr('x', year => year.x)
      .attr('y', centerY + calendarHeaderHeight * 0.35)
      .text(year => year.year);

    buttons.each(function (year) {
      const distance = calendarWidth * (options.compactRoad ? 0.40 : 0.42);
      const x = year.x + distance;
      const y = centerY - calendarHeight * 0.34;
      const html = options.badge(
        options.rank[year.year],
        x,
        y,
        options.rankSize
      );

      d3.select(this)
        .append('g')
        .attr('class', 'road-year-badge')
        .html(html);
    });

    return buttons;
  }

  function addExtraIcons(svg, html) {
    if (!html) return;

    svg.append('g')
      .attr('class', 'd3-road-extras')
      .html(html);
  }

  function drawBookPath(element, options) {
    const pathEnd = options.beginIconX - 22;
    const sandPath = `M 0 ${options.y} L ${pathEnd} ${options.y}`;
    const svg = drawSandPath(element, options.total, options.h, sandPath);

    const lastIndex = options.years.length - 1;
    const yearPosition = d3.scaleLinear()
      .domain([0, lastIndex])
      .range([options.yearOffset, lastIndex * options.pw + options.yearOffset]);

    const years = options.years.map((year, index) => {
      const hasNextYear = index < lastIndex;
      const hasPreviousYear = index > 0;

      return {
        year: year,
        x: yearPosition(index),
        active: options.activeYear === year,
        next: hasNextYear
          ? { x: yearPosition(index + 1), y: options.y }
          : null,
        prev: hasPreviousYear
          ? { x: yearPosition(index - 1), y: options.y }
          : null
      };
    });

    drawYearButtons(svg, years, {
      y: options.y,
      calW: options.compact ? 96 : 122,
      calH: options.compact ? 70 : 90,
      topH: options.compact ? 17 : 20,
      rankSize: options.compact ? 30 : 39,
      rank: options.ranks,
      badge: options.badge,
      periods: options.periods,
      compactRoad: true
    });

    years.forEach(year => {
      if (!year.next) return;

      addExtraIcons(
        svg,
        options.extras(year.year, year.x, options.y, year.next, year.prev)
      );
    });

    const flag = `<g class="road-metric-hit road-flag-hit"
                     data-tip="Business founded"
                     tabindex="0"
                     role="img"
                     aria-label="Business founded"
                     transform="translate(${options.beginIconX - 26} ${options.y - 34}) scale(1.2)">
      <path d="M17 47V11" fill="none" stroke="#5b4630"
            stroke-width="3.2" stroke-linecap="round"/>
      <path d="M18 13h25l-6.5 8.5 6.5 8.5H18Z"
            fill="#d78853" stroke="#8a5b35"
            stroke-width="2.2" stroke-linejoin="round"/>
    </g>`;

    addExtraIcons(svg, flag);
  }

  window.OrchardD3Road = { drawBook: drawBookPath };
})();
