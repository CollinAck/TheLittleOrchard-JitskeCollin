async function readExcelWorkbook(fileName) {
  const response = await fetch(fileName);

  if (!response.ok) {
    throw new Error(`Could not open the Excel file: ${fileName}`);
  }

  const archive = await readExcelArchive(await response.arrayBuffer());
  const sharedStrings = readSharedStrings(await archive.read('xl/sharedStrings.xml'));
  const sheetNames = ['Productie', 'Afrekeningsoverzicht', 'Omzet&Prijs', 'Loonkosten'];
  const sheets = {};

  for (let index = 0; index < sheetNames.length; index++) {
    const xml = await archive.read(`xl/worksheets/sheet${index + 1}.xml`);
    sheets[sheetNames[index]] = readWorksheet(xml, sharedStrings);
  }

  return buildDataFromSheets(sheets);
}

async function readExcelArchive(buffer) {
  const view = new DataView(buffer);
  const bytes = new Uint8Array(buffer);
  const decoder = new TextDecoder();
  const entriesByName = {};
  let end = -1;

  for (let index = bytes.length - 22; index >= Math.max(0, bytes.length - 65557); index--) {
    if (view.getUint32(index, true) === 0x06054b50) {
      end = index;
      break;
    }
  }

  if (end === -1) throw new Error('The file is not a valid XLSX archive.');

  const fileCount = view.getUint16(end + 10, true);
  let position = view.getUint32(end + 16, true);

  for (let index = 0; index < fileCount; index++) {
    if (view.getUint32(position, true) !== 0x02014b50) {
      throw new Error('Invalid XLSX file index.');
    }

    const method = view.getUint16(position + 10, true);
    const size = view.getUint32(position + 20, true);
    const nameLength = view.getUint16(position + 28, true);
    const extraLength = view.getUint16(position + 30, true);
    const commentLength = view.getUint16(position + 32, true);
    const start = view.getUint32(position + 42, true);
    const name = decoder.decode(bytes.slice(position + 46, position + 46 + nameLength));
    entriesByName[name] = { method, size, start };
    position += 46 + nameLength + extraLength + commentLength;
  }

  return {
    async read(name) {
      const entry = entriesByName[name];
      if (!entry) throw new Error(`Excel entry is missing: ${name}`);
      const start = entry.start;
      const nameLength = view.getUint16(start + 26, true);
      const extraLength = view.getUint16(start + 28, true);
      const contentStart = start + 30 + nameLength + extraLength;
      const content = bytes.slice(contentStart, contentStart + entry.size);

      if (entry.method === 0) return decoder.decode(content);
      if (entry.method !== 8) throw new Error('This Excel compression type is not supported.');

      const stream = new Blob([content]).stream().pipeThrough(new DecompressionStream('deflate-raw'));
      return decoder.decode(await new Response(stream).arrayBuffer());
    }
  };
}

function readSharedStrings(xmlText) {
  const xml = new DOMParser().parseFromString(xmlText, 'application/xml');

  return Array.from(xml.getElementsByTagName('si'), item =>
    Array.from(item.getElementsByTagName('t'), text => text.textContent).join('')
  );
}

function readWorksheet(xmlText, sharedStrings) {
  const xml = new DOMParser().parseFromString(xmlText, 'application/xml');
  const rows = Array.from(xml.getElementsByTagName('row'));
  if (xml.querySelector('parsererror')) throw new Error('Invalid XML in Excel file.');

  return rows.map(row => {
    const values = [];

    for (const cell of Array.from(row.getElementsByTagName('c'))) {
      const letters = cell.getAttribute('r').match(/^[A-Z]+/)[0];
      let column = 0;

      for (const letter of letters) column = column * 26 + letter.charCodeAt(0) - 64;

      const type = cell.getAttribute('t');
      const value = cell.getElementsByTagName('v')[0]?.textContent;
      const text = cell.getElementsByTagName('is')[0]?.textContent;
      values[column - 1] = type === 's' ? sharedStrings[Number(value)]
        : type === 'inlineStr' ? text
          : type === 'b' ? value === '1'
            : value === undefined ? null
              : Number(value);
    }

    return values;
  });
}

function buildDataFromSheets(sheets) {
  const years = Array.from({ length: 8 }, (_, index) => String(2010 + index));
  const production = {};
  const finances = {};
  const handling = {};
  const supply = {};
  const totalCosts = {};
  const accounts = {};
  const accountOrder = [];
  const accountCounts = {};

  for (const year of years) {
    production[year] = {};
    handling[year] = { cooling: 0, sold: 0 };

    for (let plot = 1; plot <= 6; plot++) {
      production[year][plot] = {
        tons: 0,
        records: 0,
        varieties: {},
        top_spray: null,
        first_harvest: null,
        last_harvest: null,
        avg_safety_days: null
      };
    }

    finances[year] = {
      revenue: 0,
      quantity_kg: 0,
      avg_price: 0,
      labor_cost: 0,
      settlement_costs: 0,
      top_varieties: []
    };
    supply[year] = 0;
    totalCosts[year] = 0;
  }

  const sprayCounts = {};
  const waitingPeriods = {};

  for (const row of sheets.Productie.slice(1)) {
    const year = String(row[1]);
    if (!production[year]) continue;

    const plots = [...new Set((String(row[2] ?? '').match(/[1-6]/g) || []))];
    if (!plots.length) continue;

    const tonnes = Number(row[4]) || 0;
    const share = tonnes / plots.length;
    const variety = String(row[3] || 'Unknown');
    const product = String(row[7] || '').trim();
    const destination = String(row[5] || '').trim().toLowerCase();
    if (destination === 'koeling') handling[year].cooling += tonnes;
    if (destination === 'afgezet') handling[year].sold += tonnes;
    const date = dateFromExcel(row[0]);
    const waitingDays = Number(row[8]);

    for (const plotNumber of plots) {
      const plot = production[year][plotNumber];
      const key = `${year}-${plotNumber}`;
      plot.tons += share;
      plot.records++;
      plot.varieties[variety] = (plot.varieties[variety] || 0) + share;

      if (date) {
        if (!plot.first_harvest || date < plot.first_harvest) plot.first_harvest = date;
        if (!plot.last_harvest || date > plot.last_harvest) plot.last_harvest = date;
      }

      if (product) {
        sprayCounts[key] ||= {};
        sprayCounts[key][product] = (sprayCounts[key][product] || 0) + 1;
      }

      if (row[8] !== null && row[8] !== undefined && Number.isFinite(waitingDays)) {
        waitingPeriods[key] ||= [];
        waitingPeriods[key].push(waitingDays);
      }
    }
  }

  for (const year of years) {
    for (const [number, plot] of Object.entries(production[year])) {
      const key = `${year}-${number}`;
      const products = sprayCounts[key] || {};
      plot.top_spray = Object.entries(products).sort((a, b) => b[1] - a[1])[0]?.[0] || null;
      const days = waitingPeriods[key] || [];
      plot.avg_safety_days = days.length
        ? days.reduce((sum, dag) => sum + dag, 0) / days.length : null;
    }
  }

  const varietyRevenue = {};

  for (const row of sheets['Omzet&Prijs'].slice(1)) {
    const year = String(row[0]);
    if (!finances[year]) continue;
    const variety = String(row[1]);
    const kg = Number(row[2]) || 0;
    const euro = Number(row[3]) || 0;
    finances[year].quantity_kg += kg;
    finances[year].revenue += euro;
    varietyRevenue[year] ||= [];
    varietyRevenue[year].push({ name: variety, qty: kg, revenue: euro, price: kg ? euro / kg : 0 });
  }

  for (const row of sheets.Loonkosten.slice(1)) {
    const year = String(row[1]);
    if (finances[year]) finances[year].labor_cost += Number(row[2]) || 0;
  }

  for (const year of years) {
    const yearData = finances[year];
    yearData.avg_price = yearData.quantity_kg
      ? yearData.revenue / yearData.quantity_kg : 0;
    yearData.top_varieties = (varietyRevenue[year] || [])
      .sort((a, b) => b.revenue - a.revenue).slice(0, 4);
  }

  for (const row of sheets.Afrekeningsoverzicht.slice(1)) {
    const year = String(row[4]);
    if (!(year in supply)) continue;
    const categorie = String(row[1] || '');
    const account = String(row[2] || '');
    const amount = Number(row[5]) || 0;

    if (account === 'Omzet' && categorie === 'Opbrengsten') {
      supply[year] += Math.abs(amount);
    }

    if (categorie === 'Kosten') {
      totalCosts[year] += amount;
      if (!accounts[account]) {
        accounts[account] = {};
        accountOrder.push(account);
      }
      accounts[account][year] = (accounts[account][year] || 0) + amount;
      accountCounts[account] = (accountCounts[account] || 0) + 1;
    }
  }

  return {
    ORCHARD_DATA: { years: years, production: production, financial: finances, handling: handling },
    FINANCIAL_SUMMARY: {
      years: years,
      supply,
      totalCosts: totalCosts,
      accounts: accounts,
      accountOrder: accountOrder,
      accountCounts: accountCounts
    }
  };
}

function dateFromExcel(value) {
  if (!Number.isFinite(Number(value)) || !value) return null;
  return new Date(Date.UTC(1899, 11, 30) + Number(value) * 86400000)
    .toISOString().slice(0, 10);
}
