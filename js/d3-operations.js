(function () {
  'use strict';

  if (typeof d3 === 'undefined') return;

  const colors = {
    wood: '#906943',
    darkEdge: '#6e5038',
    captan: '#77a9de',
    switch: '#95bb7a',
    bellis: '#d4a24d'
  };

  let drawingNumber = 0;

  function positiveNumber(value) {
    return Number.isFinite(+value) ? Math.max(0, +value) : 0;
  }

  function uniqueName(element) {
    if (!element.dataset.paintId) {
      drawingNumber += 1;
      element.dataset.paintId = `orchardpaint${drawingNumber}`;
    }

    return element.dataset.paintId;
  }

  function createGradient(definitions, name, colorStops, direction) {
    const gradient = definitions.append('linearGradient')
      .attr('id', name)
      .attr('x1', '0%')
      .attr('y1', '0%')
      .attr('x2', direction === 'horizontal' ? '100%' : '0%')
      .attr('y2', direction === 'horizontal' ? '0%' : '100%');

    gradient.selectAll('stop')
      .data(colorStops)
      .enter()
      .append('stop')
      .attr('offset', color => color.position)
      .attr('stop-color', color => color.color);
  }

  function drawCart(element) {
    const svg = d3.select(element);
    const kind = element.dataset.kind;
    const uniqueId = uniqueName(element);
    const woodGradientName = `cartwood-${uniqueId}-${kind}`;
    const metalGradientName = `cartmetal-${uniqueId}-${kind}`;

    svg.selectAll('*').remove();
    const definitions = svg.append('defs');

    createGradient(definitions, woodGradientName, [
      { position: '0%', color: '#e2bf8d' },
      { position: '45%', color: '#bf9663' },
      { position: '100%', color: '#8b643f' }
    ]);

    createGradient(definitions, metalGradientName, [
      { position: '0%', color: '#a99a81' },
      { position: '100%', color: '#675845' }
    ], 'horizontal');

    const cart = svg.append('g').attr('class', 'd3-cart-art');

    cart.append('path')
      .attr('d', 'M8 30L126 30L122 100Q118 105 111 105H21Q15 105 12 100Z')
      .attr('fill', `url(#${woodGradientName})`)
      .attr('fill-opacity', 0.25)
      .attr('stroke', colors.darkEdge)
      .attr('stroke-width', 3);

    cart.selectAll('rect.cart-board')
      .data([0, 1, 2])
      .enter()
      .append('rect')
      .attr('class', 'cart-board')
      .attr('x', number => 19 + number * 34)
      .attr('y', 36)
      .attr('width', 24)
      .attr('height', 59)
      .attr('rx', 3.5)
      .attr('fill', `url(#${woodGradientName})`)
      .attr('fill-opacity', 0.43)
      .attr('stroke', '#8b6946')
      .attr('stroke-opacity', 0.5)
      .attr('stroke-width', 0.9);

    cart.selectAll('path.cart-grain')
      .data([0, 1, 2])
      .enter()
      .append('path')
      .attr('class', 'cart-grain')
      .attr('d', number => `M${24 + number * 34} 41Q${31 + number * 34} 64 ${25 + number * 34} 91`)
      .attr('fill', 'none')
      .attr('stroke', '#fff0ce')
      .attr('stroke-opacity', 0.4)
      .attr('stroke-width', 1.5);

    cart.selectAll('path.cart-bar')
      .data([43, 76, 99])
      .enter()
      .append('path')
      .attr('class', 'cart-bar')
      .attr('d', height => `M9 ${height}H125`)
      .attr('fill', 'none')
      .attr('stroke', '#765337')
      .attr('stroke-width', height => height === 99 ? 5 : 4)
      .attr('stroke-linecap', 'round');

    cart.append('path')
      .attr('d', 'M6 31Q67 26 128 31')
      .attr('fill', 'none')
      .attr('stroke', '#6d4d34')
      .attr('stroke-width', 8)
      .attr('stroke-linecap', 'round');

    cart.append('path')
      .attr('d', 'M7 27Q67 24 127 27')
      .attr('fill', 'none')
      .attr('stroke', '#f0d6a9')
      .attr('stroke-width', 2.2)
      .attr('stroke-linecap', 'round');

    cart.append('path')
      .attr('d', 'M16 34L19 103M118 34L115 103')
      .attr('stroke', '#765238')
      .attr('stroke-width', 5.5)
      .attr('stroke-linecap', 'round');

    cart.append('rect')
      .attr('x', 23)
      .attr('y', 106)
      .attr('width', 90)
      .attr('height', 5)
      .attr('rx', 2.5)
      .attr('fill', `url(#${metalGradientName})`);

    const wheels = cart.selectAll('g.d3-cart-wheel')
      .data([31, 104])
      .enter()
      .append('g')
      .attr('class', 'd3-cart-wheel')
      .attr('transform', x => `translate(${x},115)`);

    wheels.append('circle')
      .attr('r', 13)
      .attr('fill', '#5b4a3d')
      .attr('stroke', '#453b31')
      .attr('stroke-width', 2);

    wheels.append('circle')
      .attr('r', 9)
      .attr('fill', '#aa9c87')
      .attr('stroke', '#ebe2d3')
      .attr('stroke-width', 1.5);

    wheels.selectAll('path.spoke')
      .data(d3.range(4))
      .enter()
      .append('path')
      .attr('class', 'spoke')
      .attr('d', number => `M0 0L${Math.cos(number * Math.PI / 2) * 6} ${Math.sin(number * Math.PI / 2) * 6}`)
      .attr('stroke', '#68594a')
      .attr('stroke-width', 1.3);

    wheels.append('circle')
      .attr('r', 3)
      .attr('fill', '#544e46')
      .attr('stroke', '#e5d6c3')
      .attr('stroke-width', 0.8);
  }

  function drawTruck(element) {
    const svg = d3.select(element);
    const uniqueId = uniqueName(element);
    const boxGradientName = `d3truckbody-${uniqueId}`;
    const cabGradientName = `d3truckcab-${uniqueId}`;

    svg.selectAll('*').remove();
    const definitions = svg.append('defs');

    createGradient(definitions, boxGradientName, [
      { position: '0%', color: '#f1e5cf' },
      { position: '60%', color: '#e0cfad' },
      { position: '100%', color: '#c4ad89' }
    ]);

    createGradient(definitions, cabGradientName, [
      { position: '0%', color: '#e7d0a9' },
      { position: '100%', color: '#be9563' }
    ], 'horizontal');

    const vehicle = svg.append('g').attr('class', 'd3-truck-art');

    const freightCosts = FINANCIAL_SUMMARY.accounts['Vracht']
    const highestFreightCost = d3.max(Object.values(freightCosts))
    const truckSizeScale = d3.scaleLinear()
      .domain([0, highestFreightCost])
      .range([0.50, 1.40])

    let currentfreightCosts = Number(freightCosts[element.dataset.year])
    if (Number.isNaN(currentfreightCosts)) {
      currentfreightCosts = 0
    }

    const truckSize = truckSizeScale(currentfreightCosts)
    vehicle.attr('transform', 'translate(150 120) scale(' + truckSize + ') translate(-150 -120)')

    vehicle.append('rect')
      .attr('x', 8).attr('y', 23)
      .attr('width', 219).attr('height', 70).attr('rx', 6)
      .attr('fill', `url(#${boxGradientName})`)
      .attr('stroke', '#8a7053').attr('stroke-width', 1.8);

    vehicle.append('path')
      .attr('d', 'M8 31H227M8 48H227M8 65H227M8 81H227')
      .attr('fill', 'none').attr('stroke', '#aa9572')
      .attr('stroke-opacity', 0.4).attr('stroke-width', 1.2);

    vehicle.selectAll('path.cargo-seam')
      .data([12, 114, 220])
      .enter().append('path')
      .attr('class', 'cargo-seam')
      .attr('d', x => `M${x} 27V90`)
      .attr('stroke', '#9b8468')
      .attr('stroke-opacity', 0.48)
      .attr('stroke-width', 1.3);

    vehicle.append('path')
      .attr('d', 'M10 21H221Q229 21 229 28')
      .attr('stroke', '#7d6b52').attr('stroke-width', 4)
      .attr('fill', 'none').attr('stroke-linecap', 'round');

    vehicle.append('rect')
      .attr('x', 13).attr('y', 87)
      .attr('width', 265).attr('height', 7).attr('rx', 2)
      .attr('fill', '#796c5c').attr('stroke', '#63594e')
      .attr('stroke-width', 1);

    vehicle.append('path')
      .attr('d', 'M225 50L244 43H270Q279 45 282 55L288 89H225Z')
      .attr('fill', `url(#${cabGradientName})`)
      .attr('stroke', '#876746')
      .attr('stroke-width', 1.8)
      .attr('stroke-linejoin', 'round');

    vehicle.append('path')
      .attr('d', 'M241 48H267Q273 48 275 54L278 66H238Z')
      .attr('fill', '#d4eaf0')
      .attr('stroke', '#74654c')
      .attr('stroke-width', 1.6)
      .attr('stroke-linejoin', 'round');

    vehicle.append('path')
      .attr('d', 'M241 51H268L272 59H239Z')
      .attr('fill', '#f9fcfc').attr('fill-opacity', 0.6);

    vehicle.append('path')
      .attr('d', 'M239 68V86M237 73H276')
      .attr('fill', 'none').attr('stroke', '#987650')
      .attr('stroke-opacity', 0.68).attr('stroke-width', 1.3);

    vehicle.append('rect')
      .attr('x', 258).attr('y', 74)
      .attr('width', 7).attr('height', 2.2).attr('rx', 1)
      .attr('fill', '#755a41');

    vehicle.append('path')
      .attr('d', 'M282 68L289 69V79H282Z')
      .attr('fill', '#b09c7f')
      .attr('stroke', '#6b5845').attr('stroke-width', 1);

    vehicle.append('rect')
      .attr('x', 286).attr('y', 83)
      .attr('width', 7).attr('height', 7).attr('rx', 2)
      .attr('fill', '#f6edcb')
      .attr('stroke', '#8f7858').attr('stroke-width', 1);

    vehicle.append('rect')
      .attr('x', 6).attr('y', 84)
      .attr('width', 5).attr('height', 9).attr('rx', 1)
      .attr('fill', '#b96854');

    vehicle.append('path')
      .attr('d', 'M282 91H294')
      .attr('stroke', '#756656')
      .attr('stroke-width', 5)
      .attr('stroke-linecap', 'round');

    const wheels = vehicle.selectAll('g.d3-truck-wheel')
      .data([56, 171, 263])
      .enter().append('g')
      .attr('class', 'd3-truck-wheel')
      .attr('transform', x => `translate(${x},98)`);

    wheels.append('circle')
      .attr('r', 14.7)
      .attr('fill', '#4d524d')
      .attr('stroke', '#766f61')
      .attr('stroke-width', 2);

    wheels.append('circle')
      .attr('r', 9.2)
      .attr('fill', '#b2b8b3')
      .attr('stroke', '#ece7da')
      .attr('stroke-width', 2);

    wheels.selectAll('circle.bolt')
      .data(d3.range(5))
      .enter().append('circle')
      .attr('class', 'bolt')
      .attr('cx', number => 5.8 * Math.cos(number * 2 * Math.PI / 5))
      .attr('cy', number => 5.8 * Math.sin(number * 2 * Math.PI / 5))
      .attr('r', 1.25)
      .attr('fill', '#6b6d66');

    wheels.append('circle').attr('r', 2.5).attr('fill', '#777b76');
  }

  function drawDroplet(group, color) {
    group.append('path')
      .attr('d', 'M0 -9C-3 -4 -7 -1 -7 3A7 7 0 0 0 7 3C7 -1 3 -4 0 -9Z')
      .attr('fill', color)
      .attr('stroke', '#6f7c80')
      .attr('stroke-width', 1.1);

    group.append('path')
      .attr('d', 'M-2 -3Q-5 0 -4 4')
      .attr('stroke', '#ffffff')
      .attr('stroke-opacity', 0.45)
      .attr('stroke-width', 1)
      .attr('fill', 'none');
  }

  function drawSprayProducts(element) {
    const svg = d3.select(element);
    const year = element.dataset.year;
    const colorName = `d3spray-${uniqueName(element)}`;
    const products = SPRAY_PRODUCTS.map(product => ({
      name: product.label,
      count: positiveNumber(countSprayProduct(year, product.key)),
      kind: product.cls
    })).filter(product => product.count > 0);

    svg.selectAll('*').remove();
    svg.attr('viewBox', '0 0 96 112')
      .attr('preserveAspectRatio', 'xMidYMid meet');

    const definitions = svg.append('defs');
    createGradient(definitions, colorName, [
      { position: '0%', color: '#cfb28d' },
      { position: '50%', color: '#dbc49e' },
      { position: '100%', color: '#a88255' }
    ], 'horizontal');

    const bottle = svg.append('g').attr('class', 'd3-spray-bottle');

    bottle.append('rect')
      .attr('x', 16).attr('y', 47)
      .attr('width', 34).attr('height', 52).attr('rx', 11)
      .attr('fill', `url(#${colorName})`)
      .attr('stroke', '#988164').attr('stroke-width', 1.5);

    bottle.append('rect')
      .attr('x', 25).attr('y', 36)
      .attr('width', 16).attr('height', 13).attr('rx', 4)
      .attr('fill', '#876348')
      .attr('stroke', '#68513f').attr('stroke-width', 1);

    bottle.append('path')
      .attr('d', 'M37 38L52 38L55 41L49 44L46 42L39 42')
      .attr('fill', '#826349')
      .attr('stroke', '#68513f').attr('stroke-width', 1.2);

    bottle.append('rect')
      .attr('x', 22).attr('y', 64)
      .attr('width', 22).attr('height', 18).attr('rx', 4)
      .attr('fill', '#f7e9d0')
      .attr('fill-opacity', 0.63)
      .attr('stroke', '#c3a47d').attr('stroke-width', 1);

    const rows = svg.selectAll('g.d3-spray-row')
      .data(products)
      .enter().append('g')
      .attr('class', product => `d3-spray-row d3-spray-${product.kind}`)
      .attr('transform', (product, number) => `translate(58,${22 + number * 26})`)
      .attr('role', 'img')
      .attr('tabindex', 0)
      .attr('aria-label', product => `${product.name}: ${product.count} keer gebruikt in ${year}`);

    rows.each(function (product) {
      d3.select(this).selectAll('g.drop-copy')
        .data(d3.range(product.count))
        .enter().append('g')
        .attr('class', 'drop-copy')
        .attr('transform', number =>
          `translate(${(number % 3) * 11},${Math.floor(number / 3) * 12}) scale(0.75)`
        )
        .each(function () {
          drawDroplet(d3.select(this), colors[product.kind]);
        });
    });
  }

  function drawAll() {
    d3.selectAll('.hyear-panel svg.d3-cart-svg')
      .each(function () { drawCart(this); });

    d3.selectAll('.hyear-panel svg.d3-truck-svg')
      .each(function () { drawTruck(this); });

    d3.selectAll('.hyear-panel svg.d3-spray-svg')
      .each(function () { drawSprayProducts(this); });
  }

  drawAll();
})();
