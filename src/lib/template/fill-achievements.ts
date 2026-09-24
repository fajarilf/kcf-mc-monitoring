import JSZip from 'jszip';
import type { ProductionRecord } from '@/model/report-model';

const SHEET_PATH = 'xl/worksheets/sheet4.xml';
const TABLE_PATH = 'xl/tables/table1.xml';
const PIVOT_CACHE_PATH = 'xl/pivotCache/pivotCacheDefinition1.xml';

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
    cell('D', year),                                            // YEAR
    cell('E', dateSerial, { style: '11' }),                     // DATE
    cell('F', item.machine.code, { type: 'inlineStr' }),        // MACHINE
    cell('G', item.item.no, { type: 'inlineStr' }),             // ITEM NO
    cell('H', item.item.name, { type: 'inlineStr' }),           // ITEM NAME
    cell('I', item.speed.minute),                               // SPEED(M)
    cell('J', item.speed.hour),                                 // SPEED(H)
    cell('K', operatorName, { type: 'inlineStr' }),            // OPERATOR
    cell('L', item.times.dandori),                              // DANDORI T.
    cell('M', item.times.running),                              // RUNNING T.
    cell('N', item.productQuantity),                            // PRODUCT QTY
    cell('O', item.operatingRate),                              // OPERATING RATE
  ].join('');

  return `<row r="${r}" spans="3:15">${cells}</row>`;
}

export async function fillAchievementsTemplate(
  templateBuffer: Buffer,
  items: ProductionRecord[],
): Promise<Buffer> {
  const zip = await JSZip.loadAsync(templateBuffer);

  const tableFile = zip.file(TABLE_PATH);
  if (!tableFile) throw new Error(`Template missing ${TABLE_PATH}`);
  let tableXml = await tableFile.async('string');
  const refMatch = tableXml.match(/ref="C2:O(\d+)"/);
  if (!refMatch) throw new Error('Could not find Table range in table1.xml');
  let currentLastRow = parseInt(refMatch[1], 10);

  const sheetFile = zip.file(SHEET_PATH);
  if (!sheetFile) throw new Error(`Template missing ${SHEET_PATH}`);
  let sheetXml = await sheetFile.async('string');

  // ---- Strip the template's placeholder/demo rows (rows 3-14 in Book2.xlsx) ----
  // These ship inside the Table's own tracked range, so the pivot cache reads
  // them as real records: fabricated dates with every data column empty.
  // A row counts as placeholder if column E (ITEM NO) has no value (self-closed
  // cell) - real API rows always populate ITEM NO, so this only ever matches
  // the template's demo rows, never legitimate appended data.
  const isPlaceholderRow = (rowXml: string, rowNum: number): boolean => {
    const eCell = new RegExp(`<c r="F${rowNum}"[^>]*(?:/>|>(?:(?!</c>).)*</c>)`, 's').exec(rowXml);
    if (!eCell) return true; // no E cell at all -> treat as placeholder
    return eCell[0].endsWith('/>'); // self-closed = no <v>/<is> child = empty
  };

  let strippedAny = false;
  sheetXml = sheetXml.replace(/<row r="(\d+)"[^>]*>.*?<\/row>/g, (match, rNum) => {
    const rowNum = parseInt(rNum, 10);
    if (rowNum < 3 || rowNum > currentLastRow) return match; // outside template's demo range
    if (isPlaceholderRow(match, rowNum)) {
      strippedAny = true;
      return '';
    }
    return match;
  });

  if (strippedAny) {
    // Shrink the table's tracked range back down to just the header row.
    tableXml = tableXml
      .replace(`ref="C2:O${currentLastRow}"`, 'ref="C2:O2"')
      .replace(`<autoFilter ref="C2:O${currentLastRow}"`, '<autoFilter ref="C2:O2"');
    currentLastRow = 2;
  }

  // ---- Strip any other stray rows beyond the table (leftover debris) ----
  // the table's tracked range (e.g. manual edits, debris from earlier testing).
  // Blindly appending new rows before </sheetData> put them AFTER this stray
  // content in document order, producing duplicate row indexes and rows out
  // of ascending order — invalid OOXML that makes Excel silently "repair"
  // the file on open, which is what was stripping the pivot tables.
  // Strip anything past currentLastRow first so insertion is always clean.
  sheetXml = sheetXml.replace(/<row r="(\d+)"[^>]*>.*?<\/row>|<row r="(\d+)"[^>]*\/>/g, (match, r1, r2) => {
    const rowNum = parseInt(r1 ?? r2, 10);
    return rowNum > currentLastRow ? '' : match;
  });

  let r = currentLastRow + 1;
  let newRowsXml = '';
  for (const item of items) {
    for (const op of item.operator) {
      newRowsXml += buildRowXml(r, item, op.name);
      r++;
    }
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