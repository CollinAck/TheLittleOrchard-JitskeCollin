(function () {
  'use strict';

  const DESKTOP_MIN = 981;
  const sceneSelector = '#horizontalStory';

  let scheduled = false;

  function bottomOfWheels(page, selector, fallback) {
    const wheels = [
      ...page.querySelectorAll(selector)
    ];

    if (wheels.length) {
      return Math.max(
        ...wheels.map(wheel =>
          wheel.getBoundingClientRect().bottom
        )
      );
    }

    return fallback.getBoundingClientRect().bottom;
  }

  function positionOnSandPath() {
    scheduled = false;

    if (window.innerWidth < DESKTOP_MIN) return;

    const story = document.querySelector(
      sceneSelector
    );

    const road = story &&
      story.querySelector('.hroad-svg');

    const strokePath = road &&
      road.querySelector('.road-shadow');

    const fillPath = road &&
      road.querySelector('.road-fill');

    if (
      !road ||
      !strokePath ||
      !fillPath ||
      !road.viewBox?.baseVal?.height
    ) return;

    const geometry = (
      fillPath.getAttribute('d') || ''
    ).match(/M\s*[-+\d.]+[ ,]+([-+\d.]+)/i);

    if (!geometry) return;

    const viewHeight =
      road.viewBox.baseVal.height;

    const roadBox =
      road.getBoundingClientRect();

    const pixelsPerSvgUnit =
      roadBox.height / viewHeight;

    const centerY =
      roadBox.top +
      Number(geometry[1]) * pixelsPerSvgUnit;

    const shadowWidth =
      parseFloat(
        getComputedStyle(strokePath).strokeWidth
      ) || 82;

    const wheelGroundY =
      centerY -
      shadowWidth / 2 * pixelsPerSvgUnit +
      2;

    for (const page of story.querySelectorAll(
      '.hyear-panel'
    )) {
      const sceneScale = parseFloat(
        getComputedStyle(page).getPropertyValue(
          '--orchard-scene-scale'
        )
      );

      if (
        !Number.isFinite(sceneScale) ||
        sceneScale <= 0
      ) continue;

      const carts = page.querySelector(
        '.handling-crate-wrap'
      );

      const truck = page.querySelector(
        '.sales-truck-wrap'
      );

      const cooling = page.querySelector(
        '.crate-unit.cool'
      );

      const sold = page.querySelector(
        '.crate-unit.sold'
      );

      if (
        !carts ||
        !truck ||
        !cooling ||
        !sold
      ) continue;

      carts.style.bottom = '0px';
      truck.style.bottom = '0px';

      cooling.style.top = '0px';
      sold.style.top = '0px';

      const coolingWheelY = bottomOfWheels(
        page,
        '.crate-unit.cool .d3-cart-wheel circle:first-of-type',
        cooling
      );

      const soldWheelY = bottomOfWheels(
        page,
        '.crate-unit.sold .d3-cart-wheel circle:first-of-type',
        sold
      );

      const truckWheelY = bottomOfWheels(
        page,
        '.d3-truck-wheel circle:first-of-type',
        truck
      );

      const cartReferenceY = Math.max(
        coolingWheelY,
        soldWheelY
      );

      cooling.style.top = (
        (cartReferenceY - coolingWheelY) /
        sceneScale
      ).toFixed(3) + 'px';

      sold.style.top = (
        (cartReferenceY - soldWheelY) /
        sceneScale
      ).toFixed(3) + 'px';

      carts.style.bottom = (
        (cartReferenceY - wheelGroundY) /
        sceneScale
      ).toFixed(3) + 'px';

      truck.style.bottom = (
        (truckWheelY - wheelGroundY) /
        sceneScale
      ).toFixed(3) + 'px';
    }
  }

  function schedulePosition() {
    if (scheduled) return;

    scheduled = true;

    requestAnimationFrame(() =>
      requestAnimationFrame(positionOnSandPath)
    );
  }

  window.addEventListener(
    'orchard-ready',
    schedulePosition
  );

  window.addEventListener(
    'resize',
    schedulePosition,
    { passive: true }
  );

  window.addEventListener(
    'orientationchange',
    schedulePosition,
    { passive: true }
  );

  document.addEventListener(
    'transitionend',
    event => {
      if (
        event.target.matches?.(
          '.beam-wrap, .pan'
        )
      ) {
        schedulePosition();
      }
    }
  );

  if (document.fonts?.ready) {
    document.fonts.ready.then(schedulePosition);
  }

  if (document.querySelector('.d3-truck-wheel')) {
    schedulePosition();
  }
})();
