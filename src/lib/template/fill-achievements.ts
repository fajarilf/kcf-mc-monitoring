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

function buildRowXml(r: number, item: ProductionRecord): string {
  const operatorNames = item.operator.map((o) => o.name).join(', ');
  const dateSerial = toExcelSerial(item.date);

  const cell = (
    col: string,
    value: string | number,
    opts?: { formula?: string; type?: 'inlineStr' },
  ): string => {
    const ref = `${col}${r}`;
    if (opts?.formula) {
      return `<c r="${ref}" s="5" t="str"><f>${xmlEscape(opts.formula)}</f><v>${xmlEscape(String(value))}</v></c>`;
    }
    if (opts?.type === 'inlineStr') {
      return `<c r="${ref}" s="5" t="inlineStr"><is><t>${xmlEscape(String(value))}</t></is></c>`;
    }
    return `<c r="${ref}" s="5"><v>${value}</v></c>`;
  };

  const cells = [
    cell('B', `TEXT(C${r}, "mmm")`, { formula: `TEXT(C${r}, "mmm")` }),
    cell('C', dateSerial),
    cell('D', item.machine.code, { type: 'inlineStr' }),
    cell('E', item.item.no, { type: 'inlineStr' }),
    cell('F', item.item.name, { type: 'inlineStr' }),
    cell('G', item.speed.minute),
    cell('H', item.speed.hour),
    cell('I', operatorNames, { type: 'inlineStr' }),
    cell('J', item.times.dandori),
    cell('K', item.times.running),
    cell('L', item.productQuantity),
    cell('M', item.operatingRate),
  ].join('');

  return `<row r="${r}" spans="2:13">${cells}</row>`;
}

export async function fillAchievementsTemplate(
  templateBuffer: Buffer,
  items: ProductionRecord[],
): Promise<Buffer> {
  const zip = await JSZip.loadAsync(templateBuffer);

  // 1. Find current last row from table1.xml
  const tableFile = zip.file(TABLE_PATH);
  if (!tableFile) throw new Error(`Template missing ${TABLE_PATH}`);
  let tableXml = await tableFile.async('string');
  const refMatch = tableXml.match(/ref="B2:M(\d+)"/);
  if (!refMatch) throw new Error('Could not find Table range in table1.xml');
  const currentLastRow = parseInt(refMatch[1], 10);

  // 2. Build and append new rows to sheet4.xml
  const sheetFile = zip.file(SHEET_PATH);
  if (!sheetFile) throw new Error(`Template missing ${SHEET_PATH}`);
  let sheetXml = await sheetFile.async('string');

  let r = currentLastRow + 1;
  let newRowsXml = '';
  for (const item of items) {
    newRowsXml += buildRowXml(r, item);
    r++;
  }
  const newLastRow = r - 1;

  sheetXml = sheetXml.replace('</sheetData>', `${newRowsXml}</sheetData>`);
  sheetXml = sheetXml.replace(
    /<dimension ref="B1:M\d+"\/>/,
    `<dimension ref="B1:M${newLastRow}"/>`,
  );
  zip.file(SHEET_PATH, sheetXml);

  // 3. Extend the Table range so pivot cache source grows
  tableXml = tableXml
    .replace(
      `ref="B2:M${currentLastRow}"`,
      `ref="B2:M${newLastRow}"`,
    )
    .replace(
      `<autoFilter ref="B2:M${currentLastRow}"`,
      `<autoFilter ref="B2:M${newLastRow}"`,
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
