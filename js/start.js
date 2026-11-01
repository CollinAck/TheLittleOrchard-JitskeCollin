async function startWebsite() {
  try {
    if (typeof d3 === 'undefined' || !d3.scaleLinear) {
      throw new Error('D3 version 7 could not load. Check your internet connection.');
    }

    const file = 'Financiële_en_overige_data_TheLittleOrchard.xlsx';
    const workbookData = await readExcelWorkbook(file);

    window.ORCHARD_DATA = workbookData.ORCHARD_DATA;
    window.FINANCIAL_SUMMARY = workbookData.FINANCIAL_SUMMARY;

    for (const fileName of ['d3-road.js', 'script.js', 'book.js', 'ranking.js', 'layout.js', 'd3-visuals.js', 'd3-operations.js']) {
      await loadScript(fileName);
    }
  } catch (error) {
    console.error(error);
    const message = document.createElement('div');
    message.className = 'excel-error';
    message.textContent = 'Could not start the website. Use Live Server in VS Code, keep the Excel file in the project folder and check your internet connection for D3 version 7.';
    document.body.prepend(message);
  }
}

function loadScript(fileName) {
  return new Promise((resolve, reject) => {
    const script = document.createElement('script');
    script.src = 'js/' + fileName;
    script.onload = resolve;
    script.onerror = () => reject(new Error(`JavaScript file not found: ${fileName}`));
    document.body.appendChild(script);
  });
}

startWebsite();
