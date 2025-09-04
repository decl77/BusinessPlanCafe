// ---------- KONFIGURATION & SKALIERUNG ----------
const SCALING_FACTOR = 10.5;
const MAX_FONT_SIZE = 32;
const MONTHS_HS = 7;
const MONTHS_WS = 5;

// Check for non-touch device once
const isDesktop = window.matchMedia('(pointer: fine)').matches;

function scaleKpiFonts() {
  // Run scaling only on desktop
  if (!isDesktop) return;

  const kpiElements = document.querySelectorAll('#summary-section .kpi, .sticky-summary .kpi');
  let minFontSize = 14.4;

  const smallElement = document.querySelector('.kpi small');
  if (smallElement) {
    const style = window.getComputedStyle(smallElement, null).getPropertyValue('font-size');
    minFontSize = parseFloat(style);
  }

  kpiElements.forEach((kpi) => {
    const valueText = kpi.querySelector('.big');
    if (valueText) {
      const kpiWidth = kpi.clientWidth;
      let newSize = kpiWidth / SCALING_FACTOR;
      newSize = Math.max(minFontSize, Math.min(newSize, MAX_FONT_SIZE));
      valueText.style.fontSize = `${newSize}px`;
    }
  });
}

// ---------- UTILS ----------
const fmt = new Intl.NumberFormat('de-DE', { style: 'currency', currency: 'EUR' });
const $ = (q, root = document) => root.querySelector(q);
const $$ = (q, root = document) => Array.from(root.querySelectorAll(q));
const numValue = (v) => {
  if (typeof v === 'number') return v;
  const s = String(v ?? '').trim().replace(',', '.');
  const f = parseFloat(s);
  return Number.isFinite(f) ? f : 0;
};
function pct(x) {
  const v = numValue(x);
  if (!Number.isFinite(v)) return 0;
  return Math.max(0, Math.min(1, v > 1 ? v / 100 : v));
}
function formatGuests(x) {
  const isInt = Math.abs(x - Math.round(x)) < 1e-9;
  return isInt
    ? String(Math.round(x))
    : x.toLocaleString('de-DE', { minimumFractionDigits: 1, maximumFractionDigits: 1 });
}

// ---------- DATENOBJEKT ----------
const breakevenData = {
  costs: {
    personnel: {
      'exp-barista-40h': { label: 'Experienced Barista (Full Time 40h)', salary: 3000, high: 0, winter: 0 },
      'exp-barista-20h': { label: 'Experienced Barista (Part Time 20h)', salary: 1500, high: 1, winter: 1 },
      'trained-staff-40h': { label: 'Trained Staff/Service (Full Time 40h)', salary: 3180, high: 1, winter: 1 },
      'trained-staff-20h': { label: 'Trained Staff/Service (Part Time 20h)', salary: 1590, high: 0, winter: 0 },
      'untrained-staff-40h': { label: 'Untrained Staff (Full Time 40h)', salary: 2500, high: 0, winter: 0 },
      'untrained-staff-20h': { label: 'Untrained Staff (Part Time 20h)', salary: 1250, high: 1, winter: 0 },
      'mini-jobbers': { label: 'Mini-Jobbers', salary: 700, high: 1, winter: 2 },
    },
    goods: {
      cogs: { label: 'Cost of Goods Sold (COGS)', monthly: 2000 },
      consumables: { label: 'Consumables', monthly: 600 },
      cleaning: { label: 'Cleaning', monthly: 600 },
      'other-variable-costs': { label: 'Other Variable Costs', monthly: 300 },
    },
    operating: {
      rent: { label: 'Rent', monthly: 1750 },
      insurance: { label: 'Insurance', monthly: 100 },
      utilities: { label: 'Utilities (Electricity, Gas, Water)', monthly: 350 },
      'internet-phone': { label: 'Internet/Phone, Software', monthly: 150 },
      fees: { label: 'Fees (GEMA, card payments)', monthly: 250 },
      maintenance: { label: 'Maintenance & Repairs', monthly: 150 },
      'misc-tax': { label: 'Miscellaneous (tax advisor, etc.)', monthly: 300 },
    },
  },
  revenue: {
    daily: {
      'high-season-daily': { seatingCapacity: 50, tableTurnover: 2.5, occupancy: 70, spend: 10, openDays: 20 },
      'winter-season-daily': { seatingCapacity: 50, tableTurnover: 1.5, occupancy: 25, spend: 10, openDays: 16 },
    },
    ticketed: {
      'small-concerts': { label: 'Small Concerts', entryFee: 15, avgRevenue: 5, guests: 20, high: 1, winter: 2 },
      'trivia-nights': { label: 'Trivia Nights', entryFee: 10, avgRevenue: 10, guests: 20, high: 7, winter: 5 },
      'poetry-readings': { label: 'Poetry Readings', entryFee: 10, avgRevenue: 10, guests: 30, high: 1, winter: 2 },
      'board-game-nights': { label: 'Board Game Nights', entryFee: 5, avgRevenue: 10, guests: 20, high: 7, winter: 5 },
      'castle-stories': { label: 'Castle/Forest Stories', entryFee: 10, avgRevenue: 10, guests: 30, high: 1, winter: 2 },
    },
    fixed: {
      'coffee-classes': { label: 'Coffee Brewing Classes', price: 60, high: 1, winter: 2 },
      'small-weddings': { label: 'Small Weddings', price: 3000, high: 1, winter: 0 },
      'birthday-parties': { label: 'Birthday Parties', price: 1500, high: 1, winter: 1 },
      'company-retreats': { label: 'Company Retreats', price: 2500, high: 1, winter: 1 },
    },
  },
};

// ---------- DOM-ELEMENTE & SEITENLOGIK ----------
const stickySummary = $('.sticky-summary');

function handleScroll() {
  const summarySection = $('#summary-section');
  if (!summarySection) return;
  const summaryBottom = summarySection.getBoundingClientRect().bottom;
  const isNowVisible = summaryBottom <= 0;
  const wasVisible = stickySummary.classList.contains('visible');

  if (isNowVisible && !wasVisible) {
    stickySummary.classList.add('visible');
    scaleKpiFonts(); // Call scale function when it becomes visible
  } else if (!isNowVisible && wasVisible) {
    stickySummary.classList.remove('visible');
  }
}

function setupTabs() {
  const btnC = $('#tab-costs-btn');
  const btnR = $('#tab-rev-btn');
  const paneC = $('#tab-costs');
  const paneR = $('#tab-rev');
  const set = (rev) => {
    btnC.classList.toggle('active', !rev);
    btnR.classList.toggle('active', rev);
    btnC.setAttribute('aria-selected', String(!rev));
    btnR.setAttribute('aria-selected', String(rev));
    paneC.dataset.active = String(!rev);
    paneR.dataset.active = String(rev);
  };
  btnC.addEventListener('click', () => set(false));
  btnR.addEventListener('click', () => set(true));
  set(false);
}

function createAccordionSection(tbody, data, type) {
  let i = 0;
  tbody.innerHTML = '';
  for (const [key, d] of Object.entries(data)) {
    let hs = 0;
    let ws = 0;
    let detailsHtml = '';
    if (type === 'ticketed') {
      const per = numValue(d.entryFee) + numValue(d.avgRevenue);
      hs = per * numValue(d.guests) * numValue(d.high);
      ws = per * numValue(d.guests) * numValue(d.winter);
      detailsHtml = `
                    <label>Events per Season (High)<input type="number" value="${d.high}" data-t-type="ticketed" data-t-key="${key}" data-t-field="high"></label>
                    <label>Events per Season (Winter)<input type="number" value="${d.winter}" data-t-type="ticketed" data-t-key="${key}" data-t-field="winter"></label>
                    <label>Entry Fee<input type="number" value="${d.entryFee}" data-t-type="ticketed" data-t-key="${key}" data-t-field="entryFee"></label>
                    <label>Avg. Revenue per Guest<input type="number" value="${d.avgRevenue}" data-t-type="ticketed" data-t-key="${key}" data-t-field="avgRevenue"></label>
                    <label>Guests per Event<input type="number" value="${d.guests}" data-t-type="ticketed" data-t-key="${key}" data-t-field="guests"></label>`;
    } else if (type === 'fixed') {
      hs = numValue(d.price) * numValue(d.high);
      ws = numValue(d.price) * numValue(d.winter);
      detailsHtml = `
                    <label>Events per Season (High)<input type="number" value="${d.high}" data-t-type="fixed" data-t-key="${key}" data-t-field="high"></label>
                    <label>Events per Season (Winter)<input type="number" value="${d.winter}" data-t-type="fixed" data-t-key="${key}" data-t-field="winter"></label>
                    <label>Price per Event<input type="number" value="${d.price}" data-t-type="fixed" data-t-key="${key}" data-t-field="price"></label>`;
    }

    const zebra = i++ % 2 ? ' style="background:var(--zebra)"' : '';
    tbody.insertAdjacentHTML(
      'beforeend',
      `
              <tr class="summary" data-key="${key}" aria-expanded="false"${zebra}>
                <td class="caret">${d.label}</td>
                <td class="num" id="${key}-hs">${fmt.format(hs)}</td>
                <td class="num" id="${key}-ws">${fmt.format(ws)}</td>
              </tr>
              <tr class="details" data-key="${key}" hidden>
                <td colspan="3"><div class="details-box"><div class="grid">${detailsHtml}</div></div></td>
              </tr>`
    );
  }
}

function renderAccordions() {
  createAccordionSection($('#ticketed-body'), breakevenData.revenue.ticketed, 'ticketed');
  createAccordionSection($('#fixed-body'), breakevenData.revenue.fixed, 'fixed');

  $$('tr.summary').forEach((tr) => {
    tr.addEventListener('click', () => {
      const key = tr.dataset.key;
      const det = document.querySelector(`tr.details[data-key="${key}"]`);
      const open = det.hasAttribute('hidden');
      det.toggleAttribute('hidden', !open);
      tr.setAttribute('aria-expanded', String(open));
    });
  });
  $$('.details input').forEach((inp) => {
    inp.addEventListener('input', () => {
      const t = inp.dataset.tType;
      const k = inp.dataset.tKey;
      const f = inp.dataset.tField;
      breakevenData.revenue[t][k][f] = numValue(inp.value);
      calculateAll();
    });
  });
}

function renderFixedTables() {
  const staffBody = $('#staff-body');
  staffBody.innerHTML = '';

  if (!isDesktop) {
    // Mobile view
    for (const [key, d] of Object.entries(breakevenData.costs.personnel)) {
      const labelRow = staffBody.insertRow();
      labelRow.className = 'staff-label-row';
      labelRow.innerHTML = `<td colspan="3">${d.label}</td>`;

      const inputRow = staffBody.insertRow();
      inputRow.className = 'staff-input-row';
      inputRow.innerHTML = `<td class="num"><input type="number" value="${d.salary}" data-cost-type="personnel" data-cost-item="${key}" data-cost-field="salary"></td>
                                <td class="num"><input type="number" value="${d.high}" data-cost-type="personnel" data-cost-item="${key}" data-cost-field="high"></td>
                                <td class="num"><input type="number" value="${d.winter}" data-cost-type="personnel" data-cost-item="${key}" data-cost-field="winter"></td>`;
    }
  } else {
    // Desktop view
    for (const [key, d] of Object.entries(breakevenData.costs.personnel)) {
      const row = staffBody.insertRow();
      row.innerHTML = `<td>${d.label}</td>
                           <td class="num"><input type="number" value="${d.salary}" data-cost-type="personnel" data-cost-item="${key}" data-cost-field="salary"></td>
                           <td class="num"><input type="number" value="${d.high}" data-cost-type="personnel" data-cost-item="${key}" data-cost-field="high"></td>
                           <td class="num"><input type="number" value="${d.winter}" data-cost-type="personnel" data-cost-item="${key}" data-cost-field="winter"></td>`;
    }
  }

  const goodsBody = $('#goods-body');
  goodsBody.innerHTML = '';
  for (const [key, d] of Object.entries(breakevenData.costs.goods)) {
    const row = goodsBody.insertRow();
    row.innerHTML = `<td>${d.label}</td>
                         <td class="num"><input type="number" value="${d.monthly}" data-cost-type="goods" data-cost-item="${key}" data-cost-field="monthly"></td>`;
  }

  const opBody = $('#op-body');
  opBody.innerHTML = '';
  for (const [key, d] of Object.entries(breakevenData.costs.operating)) {
    const row = opBody.insertRow();
    row.innerHTML = `<td>${d.label}</td>
                         <td class="num"><input type="number" value="${d.monthly}" data-cost-type="operating" data-cost-item="${key}" data-cost-field="monthly"></td>`;
  }
}

function setInputValuesFromData() {
  $$('input[data-daily]').forEach((inp) => {
    const { daily, field } = inp.dataset;
    if (breakevenData.revenue.daily[daily] && breakevenData.revenue.daily[daily][field] !== undefined) {
      inp.value = breakevenData.revenue.daily[daily][field];
    }
  });
}

function bindInputs() {
  $$('input[data-cost-type], input[data-daily]').forEach((inp) => {
    inp.addEventListener('input', () => {
      if (inp.dataset.costType) {
        const { costType, costItem, costField } = inp.dataset;
        breakevenData.costs[costType][costItem][costField] = numValue(inp.value);
      } else if (inp.dataset.daily) {
        const { daily, field } = inp.dataset;
        breakevenData.revenue.daily[daily][field] = numValue(inp.value);
      }
      calculateAll();
    });
  });
}

// ---------- BERECHNUNGEN & DARSTELLUNG ----------
function calculateAll() {
  // Personalkosten
  let personnelHsA = 0;
  let personnelWsA = 0;
  for (const d of Object.values(breakevenData.costs.personnel)) {
    personnelHsA += numValue(d.salary) * numValue(d.high) * MONTHS_HS;
    personnelWsA += numValue(d.salary) * numValue(d.winter) * MONTHS_WS;
  }
  $('#staff-hs-month').textContent = fmt.format(personnelHsA / 12);
  $('#staff-ws-month').textContent = fmt.format(personnelWsA / 12);
  $('#staff-hs-annual').textContent = fmt.format(personnelHsA);
  $('#staff-ws-annual').textContent = fmt.format(personnelWsA);

  $('#staff-hs-month-mobile').textContent = fmt.format(personnelHsA / 12);
  $('#staff-ws-month-mobile').textContent = fmt.format(personnelWsA / 12);
  $('#staff-hs-annual-mobile').textContent = fmt.format(personnelHsA);
  $('#staff-ws-annual-mobile').textContent = fmt.format(personnelWsA);

  const staffA = personnelHsA + personnelWsA;

  // Waren & Betriebskosten
  const goodsM = Object.values(breakevenData.costs.goods).reduce((a, i) => a + numValue(i.monthly), 0);
  const opM = Object.values(breakevenData.costs.operating).reduce((a, i) => a + numValue(i.monthly), 0);
  $('#goods-month').textContent = fmt.format(goodsM);
  $('#goods-annual').textContent = fmt.format(goodsM * 12);
  $('#op-month').textContent = fmt.format(opM);
  $('#op-annual').textContent = fmt.format(opM * 12);

  // Tagesgeschäft Einnahmen
  const dailyCalc = (seasonKey) => {
    const s = breakevenData.revenue.daily[seasonKey];
    const guests = numValue(s.seatingCapacity) * pct(s.occupancy) * numValue(s.tableTurnover);
    $(`#guests-${seasonKey}`).textContent = formatGuests(guests);
    return guests * numValue(s.spend) * numValue(s.openDays);
  };
  const dailyHSM = dailyCalc('high-season-daily');
  const dailyWSM = dailyCalc('winter-season-daily');
  $('#daily-hs-month').textContent = fmt.format(dailyHSM);
  $('#daily-ws-month').textContent = fmt.format(dailyWSM);
  $('#daily-hs-annual').textContent = fmt.format(dailyHSM * MONTHS_HS);
  $('#daily-ws-annual').textContent = fmt.format(dailyWSM * MONTHS_WS);

  // Event Einnahmen
  let eventsA = 0;
  ['ticketed', 'fixed'].forEach((type) => {
    let totalHsA = 0;
    let totalWsA = 0;
    Object.entries(breakevenData.revenue[type]).forEach(([key, d]) => {
      const perGuest = type === 'ticketed' ? numValue(d.entryFee) + numValue(d.avgRevenue) : 0;
      const price = type === 'fixed' ? numValue(d.price) : perGuest * numValue(d.guests);
      const hsVal = price * numValue(d.high);
      const wsVal = price * numValue(d.winter);
      $(`#${key}-hs`).textContent = fmt.format(hsVal);
      $(`#${key}-ws`).textContent = fmt.format(wsVal);
      totalHsA += hsVal;
      totalWsA += wsVal;
    });
    $(`#${type}-hs-month`).textContent = fmt.format(totalHsA / 12);
    $(`#${type}-ws-month`).textContent = fmt.format(totalWsA / 12);
    $(`#${type}-hs-annual`).textContent = fmt.format(totalHsA);
    $(`#${type}-ws-annual`).textContent = fmt.format(totalWsA);
    eventsA += totalHsA + totalWsA;
  });

  // Gesamtsummen
  const costsA = staffA + goodsM * 12 + opM * 12;
  const revA = dailyHSM * MONTHS_HS + dailyWSM * MONTHS_WS + eventsA;
  const costsM = costsA / 12;
  const revM = revA / 12;
  const profitM = revM - costsM;
  const profitA = revA - costsA;

  // Top Summary Updates
  $('#sum-costs-m').textContent = fmt.format(costsM);
  $('#sum-costs-ann').textContent = fmt.format(costsA);
  $('#sum-rev-m').textContent = fmt.format(revM);
  $('#sum-rev-ann').textContent = fmt.format(revA);
  $('#sum-profit-m').textContent = fmt.format(profitM);
  $('#sum-profit-ann').textContent = fmt.format(profitA);

  // Sticky Header Updates (Desktop & Mobile)
  $('#sticky-costs-m-desktop').textContent = fmt.format(costsM);
  $('#sticky-costs-a-desktop').textContent = fmt.format(costsA);
  $('#sticky-costs-m').textContent = fmt.format(costsM);
  $('#sticky-costs-a').textContent = fmt.format(costsA);

  $('#sticky-rev-m-desktop').textContent = fmt.format(revM);
  $('#sticky-rev-a-desktop').textContent = fmt.format(revA);
  $('#sticky-rev-m').textContent = fmt.format(revM);
  $('#sticky-rev-a').textContent = fmt.format(revA);

  $('#sticky-profit-m-desktop').textContent = fmt.format(profitM);
  $('#sticky-profit-a-desktop').textContent = fmt.format(profitA);
  $('#sticky-profit-m').textContent = fmt.format(profitM);
  $('#sticky-profit-a').textContent = fmt.format(profitA);

  // Farb-Updates für negative Werte
  const negativeColor = 'var(--accent)';
  const defaultColorText = 'var(--text)';
  const defaultColorSummary = 'var(--summary-text)';

  $('#sum-costs-m').parentElement.style.color = negativeColor;
  $('#sum-costs-ann').parentElement.style.color = negativeColor;

  // Sticky Header Farben (Desktop & Mobile)
  $('#sticky-kpi-costs').style.color = negativeColor;

  $('#sum-profit-m').parentElement.style.color = profitM < 0 ? negativeColor : defaultColorText;
  $('#sum-profit-ann').parentElement.style.color = profitA < 0 ? negativeColor : defaultColorText;

  // Sticky Profit Farben (Desktop & Mobile)
  const profitColor = profitM < 0 ? negativeColor : defaultColorSummary;
  $('#sticky-kpi-profit').style.color = profitColor;

  // Schriftarten nach jeder Berechnung neu skalieren (nur für Desktop)
  scaleKpiFonts();
}

// ---------- CSV IM/EXPORT ----------
function flattenObject(obj, parent = '', res = {}) {
  for (const key in obj) {
    if (Object.prototype.hasOwnProperty.call(obj, key)) {
      const propName = parent ? `${parent}.${key}` : key;
      if (typeof obj[key] === 'object' && obj[key] !== null && !Array.isArray(obj[key])) {
        flattenObject(obj[key], propName, res);
      } else {
        res[propName] = obj[key];
      }
    }
  }
  return res;
}

function setNestedValue(obj, path, value) {
  const keys = path.split('.');
  let current = obj;
  for (let i = 0; i < keys.length - 1; i++) {
    const key = keys[i];
    if (!current[key] || typeof current[key] !== 'object') {
      current[key] = {};
    }
    current = current[key];
  }
  const finalKey = keys[keys.length - 1];

  // Temporarily navigate to get the original value's type
  let originalValue;
  try {
    originalValue = keys.reduce((o, k) => o[k], breakevenData);
  } catch (e) {
    originalValue = undefined;
  }

  current[finalKey] = typeof originalValue === 'number' ? numValue(value) : value;
}

function exportDataToCSV() {
  const flatData = flattenObject(breakevenData);
  let csvContent = 'data:text/csv;charset=utf-8,key,value\n';

  for (const [key, value] of Object.entries(flatData)) {
    // We don't need to export the labels, they are static
    if (key.endsWith('.label')) continue;
    csvContent += `${key},"${String(value).replace(/"/g, '""')}"\n`;
  }

  const encodedUri = encodeURI(csvContent);
  const link = document.createElement('a');
  link.setAttribute('href', encodedUri);
  link.setAttribute('download', 'breakeven_data.csv');
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

function importDataFromCSV(event) {
  const file = event.target.files[0];
  if (!file) return;

  const reader = new FileReader();
  reader.onload = function (e) {
    const text = e.target.result;
    const rows = text.split('\n').slice(1); // Skip header
    rows.forEach((row) => {
      if (row.trim() === '') return;
      const [key, ...valueParts] = row.split(',');
      if (!key) return; // Skip empty keys
      const value = valueParts.join(',').replace(/^"|"$/g, '').replace(/""/g, '"');
      setNestedValue(breakevenData, key.trim(), value);
    });

    // Re-render everything after import
    renderFixedTables();
    renderAccordions();
    setInputValuesFromData();
    bindInputs(); // Re-bind inputs after re-rendering
    calculateAll();
  };
  reader.readAsText(file);
}

// ---------- INITIALISIERUNG ----------
function init() {
  setupTabs();
  renderFixedTables();
  renderAccordions();
  setInputValuesFromData();
  bindInputs();
  calculateAll();

  // Bind CSV buttons
  $('#export-btn').addEventListener('click', exportDataToCSV);
  $('#import-btn').addEventListener('click', () => $('#csv-import-input').click());
  $('#csv-import-input').addEventListener('change', importDataFromCSV);

  window.addEventListener('scroll', handleScroll);
  window.addEventListener('resize', scaleKpiFonts);
}

document.addEventListener('DOMContentLoaded', init);

