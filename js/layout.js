
(() => {
  const story = document.getElementById('horizontalStory');
  if (!story) return;

  const pages = [
    ...document.querySelectorAll('.hyear-panel')
  ];

  if (!pages.length) return;

  const clamp = (value, min, max) =>
    Math.min(Math.max(value, min), Math.max(min, max));

  const centerX = rect =>
    (rect.left + rect.right) / 2;

  const DESKTOP_BREAKPOINT = 980;
  const DESIGN_WIDTH = 850;
  const DESIGN_HEIGHT = 650;

  let scheduled = false;

  function calculateSceneScale(page) {
    const road = story.querySelector('.hroad-svg');

    const roadHeight = road
      ? road.getBoundingClientRect().height
      : 220;

    const panelWidth =
      page.getBoundingClientRect().width;

    const storyHeight = Math.min(
      story.clientHeight,
      window.innerHeight
    );

    const contentHeight = Math.max(
      1,
      storyHeight - roadHeight
    );

    const sidePadding = Math.max(
      22,
      Math.min(58, panelWidth * 0.03)
    );

    const topPadding = Math.max(
      18,
      Math.min(72, contentHeight * 0.06)
    );

    const scale = Math.max(0.05, Math.min(
      (panelWidth - sidePadding * 2) / DESIGN_WIDTH,
      (contentHeight - topPadding * 2) / DESIGN_HEIGHT
    ));

    const sceneTop = Math.max(
      topPadding,
      (contentHeight - DESIGN_HEIGHT * scale) / 2
    );

    page.style.setProperty(
      '--orchard-scene-top',
      `${sceneTop.toFixed(2)}px`
    );

    return scale;
  }

  function calculateLegacyScale(pageWidth) {
    if (window.innerWidth <= 620) {
      return 1;
    }

    if (window.innerWidth <= 900) {
      return clamp(pageWidth / 760, .82, 1.08);
    }

    return clamp(pageWidth / 800, .52, 1.04);
  }

  function layoutPage(page) {
    const root = page.querySelector('.hyear-ops');

    const leftBowl = page.querySelector(
      '.pan.left .bowl'
    );

    const rightBowl = page.querySelector(
      '.pan.right .bowl'
    );

    const carts = page.querySelector(
      '.handling-crate-wrap'
    );

    const truck = page.querySelector(
      '.sales-truck-wrap'
    );

    const cool = page.querySelector(
      '.crate-unit.cool'
    );

    const sold = page.querySelector(
      '.crate-unit.sold'
    );

    if (
      !root ||
      !leftBowl ||
      !rightBowl ||
      !carts ||
      !truck ||
      !cool ||
      !sold
    ) return;

    const desktop =
      window.innerWidth > DESKTOP_BREAKPOINT;

    const sceneScale = desktop
      ? calculateSceneScale(page)
      : 1;

    if (desktop) {
      page.style.setProperty(
        '--orchard-scene-scale',
        sceneScale.toFixed(5)
      );
    } else {
      page.style.removeProperty(
        '--orchard-scene-scale'
      );
    }

    const rootRect = root.getBoundingClientRect();
    const panelRect = page.getBoundingClientRect();

    const coolX = cool.offsetLeft;

    const visibleEnd =
      sold.offsetLeft + sold.offsetWidth;

    const visibleCenter =
      (coolX + visibleEnd) / 2;

    if (desktop) {
      const margin = 28;
      const gap = 26;

      const designWidth = root.clientWidth;

      const visibleCratesWidth = Math.max(
        1,
        visibleEnd - coolX
      );

      const fit =
        (designWidth - margin * 2 - gap) /
        (visibleCratesWidth + truck.offsetWidth);

      const objectScale = Math.min(
        1,
        Math.max(0.2, fit)
      );

      const leftCenter =
        (centerX(leftBowl.getBoundingClientRect())
          - rootRect.left) / sceneScale;

      const rightCenter =
        (centerX(rightBowl.getBoundingClientRect())
          - rootRect.left) / sceneScale;

      const cartMin =
        12 - coolX * objectScale;

      const cartMax =
        designWidth - 12 - visibleEnd * objectScale;

      const truckMin = margin;

      const truckMax =
        designWidth -
        margin -
        truck.offsetWidth * objectScale;

      let cartLeft = clamp(
        leftCenter - visibleCenter * objectScale,
        cartMin,
        cartMax
      );

      let truckLeft = clamp(
        rightCenter -
          truck.offsetWidth * objectScale / 2,
        truckMin,
        truckMax
      );

      let overlap =
        cartLeft +
        visibleEnd * objectScale +
        gap -
        truckLeft;

      if (overlap > 0) {
        const truckShift = Math.min(
          overlap,
          Math.max(0, truckMax - truckLeft)
        );

        truckLeft += truckShift;
        overlap -= truckShift;

        if (overlap > 0) {
          cartLeft = clamp(
            cartLeft - overlap,
            cartMin,
            cartMax
          );
        }
      }

      carts.style.left = `${cartLeft}px`;
      truck.style.left = `${truckLeft}px`;

      carts.style.transform =
        `scale(${objectScale})`;

      truck.style.transform =
        `scale(${objectScale})`;

      return;
    }

    // Bestaande werking voor smalle schermen

    const legacyScale =
      calculateLegacyScale(panelRect.width);

    const cartWidth =
      (visibleEnd - coolX) * legacyScale;

    const truckWidth =
      truck.offsetWidth * legacyScale;

    const minLeft =
      panelRect.left - rootRect.left + 10;

    const maxCartLeft =
      panelRect.right -
      rootRect.left -
      10 -
      cartWidth;

    const maxTruckLeft =
      panelRect.right -
      rootRect.left -
      10 -
      truckWidth;

    const cartLeft = clamp(
      centerX(leftBowl.getBoundingClientRect()) -
        rootRect.left -
        visibleCenter * legacyScale,
      minLeft,
      maxCartLeft
    );

    const truckLeft = clamp(
      centerX(rightBowl.getBoundingClientRect()) -
        rootRect.left -
        (truck.offsetWidth / 2) * legacyScale,
      minLeft,
      maxTruckLeft
    );

    carts.style.left = `${cartLeft}px`;
    truck.style.left = `${truckLeft}px`;

    carts.style.transform =
      `scale(${legacyScale})`;

    truck.style.transform =
      `scale(${legacyScale})`;
  }

  function calculateLayout() {
    scheduled = false;
    pages.forEach(layoutPage);
  }

  function requestLayout() {
    if (scheduled) return;

    scheduled = true;

    requestAnimationFrame(calculateLayout);
  }

  requestLayout();

  addEventListener(
    'resize',
    requestLayout,
    { passive: true }
  );

  addEventListener(
    'orientationchange',
    requestLayout,
    { passive: true }
  );

  if (typeof ResizeObserver !== 'undefined') {
    const observer = new ResizeObserver(requestLayout);
    observer.observe(story);
  }

  document
    .querySelectorAll('.hyear-panel .beam-wrap')
    .forEach(beam => {
      beam.addEventListener(
        'transitionend',
        requestLayout
      );
    });

  if (document.fonts?.ready) {
    document.fonts.ready.then(requestLayout);
  }
})();
