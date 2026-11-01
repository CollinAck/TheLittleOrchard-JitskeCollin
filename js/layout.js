(() => {
  const story = document.getElementById('horizontalStory');
  if (!story) return;
  const pages = [...document.querySelectorAll('.hyear-panel')];
  if (!pages.length) return;
  const clamp = (x, a, b) => Math.min(Math.max(x, a), Math.max(a, b));
  const centerX = r => (r.left + r.right) / 2;
  let scheduled = false;
  function calculateSizeFactor(pageWidth) {

    if (window.innerWidth <= 620) return 1;
    if (window.innerWidth <= 900) return clamp(pageWidth / 760, .82, 1.08);
    return clamp(pageWidth / 800, .52, 1.04);
  }
  function layoutPage(page) {
    const root = page.querySelector('.hyear-ops');
    const leftBowl = page.querySelector('.pan.left .bowl');
    const rightBowl = page.querySelector('.pan.right .bowl');
    const carts = page.querySelector('.handling-crate-wrap');
    const truck = page.querySelector('.sales-truck-wrap');
    const cool = page.querySelector('.crate-unit.cool');
    const sold = page.querySelector('.crate-unit.sold');
    if (!root || !leftBowl || !rightBowl || !carts || !truck || !cool || !sold) return;
    const rootR = root.getBoundingClientRect();
    const panelR = page.getBoundingClientRect();
    const scale = calculateSizeFactor(panelR.width);


    const coolX = cool.offsetLeft;
    const visibleEnd = sold.offsetLeft + sold.offsetWidth;
    const visibleCenter = (coolX + visibleEnd) / 2;
    const cartWidth = (visibleEnd - coolX) * scale;
    const truckWidth = truck.offsetWidth * scale;
    const minLeft = panelR.left - rootR.left + 10;
    const maxCartLeft = panelR.right - rootR.left - 10 - cartWidth;
    const maxTruckLeft = panelR.right - rootR.left - 10 - truckWidth;
    const cartLeft = clamp(centerX(leftBowl.getBoundingClientRect()) - rootR.left - visibleCenter * scale, minLeft, maxCartLeft);
    const truckLeft = clamp(centerX(rightBowl.getBoundingClientRect()) - rootR.left - (truck.offsetWidth / 2) * scale, minLeft, maxTruckLeft);
    carts.style.left = `${cartLeft}px`;
    truck.style.left = `${truckLeft}px`;
    carts.style.transform = `scale(${scale})`;
    truck.style.transform = `scale(${scale})`;
      
  }
  function calculateLayout() {
    scheduled = false; pages.forEach(layoutPage);
  }
  function requestLayout() {
    if (scheduled) return; scheduled = true; requestAnimationFrame(calculateLayout);
  }
  requestLayout();
  addEventListener('resize', requestLayout, { passive: true });
  addEventListener('orientationchange', requestLayout, { passive: true });


  document.querySelectorAll('.hyear-panel .beam-wrap').forEach(beam => {
    beam.addEventListener('transitionend', requestLayout);
  });
  if (document.fonts?.ready) document.fonts.ready.then(requestLayout);
})();
