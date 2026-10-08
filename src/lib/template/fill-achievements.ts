import JSZip from 'jszip';
import type { DandoriReportData, MonthlyValues, ProductionRecord } from '@/model/report-model';

const SHEET_PATH = 'xl/worksheets/sheet4.xml';
const OPERATOR_SHEET_PATH = 'xl/worksheets/sheet1.xml';
const STYLES_PATH = 'xl/styles.xml';
const TABLE_PATH = 'xl/tables/table1.xml';
const PIVOT_CACHE_PATH = 'xl/pivotCache/pivotCacheDefinition1.xml';
const MONTHS: (keyof MonthlyValues)[] = [
  'jan', 'feb', 'mar', 'apr', 'may', 'jun',
  'jul', 'aug', 'sep', 'oct', 'nov', 'dec',
];

function toExcelSerial(dateStr: string): number {
  const d = new Date(dateStr);
  const excelEpoch = Date.UTC(1899, 11, 30);
  const msPerDay = 24 * 60 * 60 * 1000;
  return Math.round((d.getTime() - excelEpoch) / msPerDay);
}

function xmlEscape(str: string): string {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

function buildRowXml(r: number, item: ProductionRecord, operatorName: string): string {
  const dateSerial = toExcelSerial(item.date);

  const cell = (
    col: string,
    value: string | number,
    opts?: { formula?: string; type?: 'inlineStr'; style?: string },
  ): string => {
    const ref = `${col}${r}`;
    const s = opts?.style ?? '5';
    if (opts?.formula) {
      return `<c r="${ref}" s="${s}" t="str"><f>${xmlEscape(opts.formula)}</f><v>${xmlEscape(String(value))}</v></c>`;
    }
    if (opts?.type === 'inlineStr') {
      return `<c r="${ref}" s="${s}" t="inlineStr"><is><t>${xmlEscape(String(value))}</t></is></c>`;
    }
    return `<c r="${ref}" s="${s}"><v>${value}</v></c>`;
  };

  const monthLabel = new Date(item.date).toLocaleString('en-US', { month: 'short' });
  const year = new Date(item.date).getFullYear();

  const cells = [
    cell('C', monthLabel, { formula: `TEXT(E${r}, "mmm")` }),  // MONTH
    cell('D', year, { formula: `TEXT(E${r}, "yyyy")` }),        // YEAR — was "mmm", copy-paste bug: showed the cached number now but would flip to a month abbreviation on Excel's next recalc
    cell('E', dateSerial, { style: '9' }),                     // DATE
    cell('F', item.machine.code, { type: 'inlineStr' }),        // MACHINE
    cell('G', item.item.no, { type: 'inlineStr' }),             // ITEM NO
    cell('H', item.item.name, { type: 'inlineStr' }),           // ITEM NAME
    cell('I', item.speed.minute),                               // SPEED(M)
    cell('J', item.speed.hour),                                 // SPEED(H)
    cell('K', operatorName, { type: 'inlineStr' }),            // OPERATOR
    cell('L', item.times.dandori),                              // DANDORI T.
    cell('M', item.times.running),                              // RUNNING T.
    cell('N', item.productQuantity),                            // PRODUCT QTY
    cell('O', item.operatingRate, { style: '15' }),             // OPERATING RATE
  ].join('');

  return `<row r="${r}" spans="3:15">${cells}</row>`;
}

async function addLightTurquoiseStyle(zip: JSZip): Promise<string> {
  const stylesFile = zip.file(STYLES_PATH);
  if (!stylesFile) throw new Error(`Template missing ${STYLES_PATH}`);
  let stylesXml = await stylesFile.async('string');
  const fillCount = Number(stylesXml.match(/<fills count="(\d+)">/)?.[1]);
  const styleCount = Number(stylesXml.match(/<cellXfs count="(\d+)">/)?.[1]);
  if (!fillCount || !styleCount) throw new Error('Could not read template styles');

  stylesXml = stylesXml
    .replace(`<fills count="${fillCount}">`, `<fills count="${fillCount + 1}">`)
    .replace(
      '</fills>',
      '<fill><patternFill patternType="solid"><fgColor rgb="FFCCFFFF"/><bgColor indexed="64"/></patternFill></fill></fills>',
    )
    .replace(`<cellXfs count="${styleCount}">`, `<cellXfs count="${styleCount + 1}">`)
    .replace(
      '</cellXfs>',
      `<xf numFmtId="0" fontId="0" fillId="${fillCount}" borderId="1" xfId="0" applyFill="1" applyBorder="1" applyAlignment="1"><alignment horizontal="center" vertical="center"/></xf></cellXfs>`,
    );
  zip.file(STYLES_PATH, stylesXml);
  return String(styleCount);
}

function buildOperatorSheetRows(data: DandoriReportData, accentStyle: string): string {
  const textCell = (ref: string, value: string, style: string) =>
    `<c r="${ref}" s="${style}" t="inlineStr"><is><t>${xmlEscape(value)}</t></is></c>`;
  const numberCell = (ref: string, value: number | null, style: string) =>
    value === null ? `<c r="${ref}" s="${style}"/>` : `<c r="${ref}" s="${style}"><v>${value}</v></c>`;
  const columns = 'CDEFGHIJKLMN';
  const valueCells = (
    row: number,
    months: MonthlyValues,
    average: number | null,
    style = '3',
  ) => MONTHS.map((month, i) =>
    numberCell(`${columns[i]}${row}`, months[month], style),
  ).join('') + numberCell(`O${row}`, average, accentStyle);

  const title = 'BCDEFGHIJKLMNO'.split('').map((column) =>
    textCell(
      `${column}9`,
      column === 'B' ? 'DANDORI T AVG.' : column === 'C' ? 'Column Labels' : '',
      accentStyle,
    ),
  ).join('');
  const headers = MONTHS.map((month, i) =>
    textCell(`${columns[i]}10`, month[0].toUpperCase() + month.slice(1), accentStyle),
  ).join('');
  const operatorRows = data.operators.map((operator, i) => {
    const row = i + 11;
    return `<row r="${row}" spans="2:15">${textCell(`B${row}`, operator.name, '12')}${valueCells(row, operator.months, operator.average)}</row>`;
  }).join('');
  const averageRow = data.operators.length + 11;

  return `<row r="9" spans="2:15">${title}</row>`
    + `<row r="10" spans="2:15">${textCell('B10', 'Operator Name', accentStyle)}${headers}${textCell('O10', 'Average', accentStyle)}</row>`
    + operatorRows
    + `<row r="${averageRow}" spans="2:15">${textCell(`B${averageRow}`, 'Average', accentStyle)}${valueCells(averageRow, data.average, data.average.overall, accentStyle)}</row>`;
}

export async function fillAchievementsTemplate(
  templateBuffer: Buffer,
  items: ProductionRecord[],
  dandori: DandoriReportData,
): Promise<Buffer> {
  const zip = await JSZip.loadAsync(templateBuffer);
  const operatorAccentStyle = await addLightTurquoiseStyle(zip);

  const operatorSheetFile = zip.file(OPERATOR_SHEET_PATH);
  if (!operatorSheetFile) throw new Error(`Template missing ${OPERATOR_SHEET_PATH}`);
  let operatorSheetXml = await operatorSheetFile.async('string');
  operatorSheetXml = operatorSheetXml.replace(
    /<row r="(\d+)"[^>]*>[\s\S]*?<\/row>/g,
    (rowXml, rowNumber) => Number(rowNumber) >= 9 ? '' : rowXml,
  );
  const operatorLastRow = dandori.operators.length + 11;
  operatorSheetXml = operatorSheetXml
    .replace('</sheetData>', `${buildOperatorSheetRows(dandori, operatorAccentStyle)}</sheetData>`)
    .replace(/<dimension ref="[^"]+"\/>/, `<dimension ref="B4:O${operatorLastRow}"/>`);
  zip.file(OPERATOR_SHEET_PATH, operatorSheetXml);

  const tableFile = zip.file(TABLE_PATH);
  if (!tableFile) throw new Error(`Template missing ${TABLE_PATH}`);
  let tableXml = await tableFile.async('string');
  const refMatch = tableXml.match(/ref="C2:O(\d+)"/);
  if (!refMatch) throw new Error('Could not find Table range in table1.xml');
  let currentLastRow = parseInt(refMatch[1], 10);

  const sheetFile = zip.file(SHEET_PATH);
  if (!sheetFile) throw new Error(`Template missing ${SHEET_PATH}`);
  let sheetXml = await sheetFile.async('string');

  // ---- Strip ALL template demo rows (rows 3 through currentLastRow) ----
  // Rows 1-2 are title + header and must be preserved.
  sheetXml = sheetXml.replace(/<row r="(\d+)"[^>]*>[\s\S]*?<\/row>/g, (match, rNum) => {
    const rowNum = parseInt(rNum, 10);
    return (rowNum >= 3 && rowNum <= currentLastRow) ? '' : match;
  });

  // Shrink the table's tracked range back down to just the header row.
  tableXml = tableXml
    .replace(`ref="C2:O${currentLastRow}"`, 'ref="C2:O2"')
    .replace(`<autoFilter ref="C2:O${currentLastRow}"`, '<autoFilter ref="C2:O2"');
  currentLastRow = 2;

  // Strip any stray rows beyond the table (self-closing OR with content —
  // matching only self-closed rows here was the bug: a stray row with an
  // actual leftover cell in it, like row 17, was never being removed, and
  // real appended data later collided with it at the same row number,
  // producing a duplicate <row> index again.
  sheetXml = sheetXml.replace(/<row r="(\d+)"[^>]*>[\s\S]*?<\/row>|<row r="(\d+)"[^>]*\/>/g, (match, r1, r2) => {
    const rowNum = parseInt(r1 ?? r2, 10);
    return rowNum > currentLastRow ? '' : match;
  });

  let r = currentLastRow + 1;
  let newRowsXml = '';
  for (const item of items) {
    newRowsXml += buildRowXml(r, item, item.operator.map((op) => op.name).join(', '));
    r++;
  }
  const newLastRow = r - 1;

  sheetXml = sheetXml.replace('</sheetData>', `${newRowsXml}</sheetData>`);
  sheetXml = sheetXml.replace(
    /<dimension ref="C1:O\d+"\/>/,
    `<dimension ref="C1:O${newLastRow}"/>`,
  );
  zip.file(SHEET_PATH, sheetXml);

  // 3. Extend the Table range so pivot cache source grows
  tableXml = tableXml
    .replace(
      `ref="C2:O${currentLastRow}"`,
      `ref="C2:O${newLastRow}"`,
    )
    .replace(
      `<autoFilter ref="C2:O${currentLastRow}"`,
      `<autoFilter ref="C2:O${newLastRow}"`,
    );
  zip.file(TABLE_PATH, tableXml);

  // 4. Flag pivot cache to refresh on load
  const pivotFile = zip.file(PIVOT_CACHE_PATH);
  if (pivotFile) {
    let pivotCacheXml = await pivotFile.async('string');
    if (!pivotCacheXml.includes('refreshOnLoad')) {
      pivotCacheXml = pivotCacheXml.replace(
        '<pivotCacheDefinition ',
        '<pivotCacheDefinition refreshOnLoad="1" ',
      );
    }
    zip.file(PIVOT_CACHE_PATH, pivotCacheXml);
  }

  // 5. Remove stale calc chain (Excel rebuilds it automatically)
  zip.remove('xl/calcChain.xml');
  const contentTypesFile = zip.file('[Content_Types].xml');
  if (contentTypesFile) {
    let contentTypes = await contentTypesFile.async('string');
    contentTypes = contentTypes.replace(
      /<Override PartName="\/xl\/calcChain\.xml"[^/]*\/>/,
      '',
    );
    zip.file('[Content_Types].xml', contentTypes);
  }
  const wbRelsFile = zip.file('xl/_rels/workbook.xml.rels');
  if (wbRelsFile) {
    let wbRels = await wbRelsFile.async('string');
    wbRels = wbRels.replace(
      /<Relationship[^>]*calcChain\.xml[^>]*\/>/,
      '',
    );
    zip.file('xl/_rels/workbook.xml.rels', wbRels);
  }

  // 6. Return buffer
  return zip.generateAsync({ type: 'nodebuffer' }) as Promise<Buffer>;
}