import ExcelJS, { Worksheet, Row } from 'exceljs';

/** One Dandori (setup) time-block entry -> row 14 (and cloned rows if there's more than one). */
export interface DandoriEntry {
  DandoriDate: string;      // e.g. "2026-07-15"
  DandoriStart: string;     // e.g. "08:00"
  DandoriEnd: string;       // e.g. "08:30"
  DandoriDuration: number;  // minutes, e.g. 30
}

/** One Production time-block entry -> row 18, then rows 19-27, then cloned rows past that. */
export interface ProductionEntry {
  ProductionDate: string;     // e.g. "2026-07-15"
  ProductionStart: string;    // e.g. "09:00"
  ProductionEnd: string;      // e.g. "17:00"
  ProductionDuration: number; // minutes, e.g. 480
  Status: string;             // e.g. "Dandori"
  ProductionPIC: string;      // person in charge name
}

/** One Problem time-block entry -> row 36, then rows 36-42, then cloned rows past that. */
export interface ProblemEntry {
  ProblemDate: string;        // e.g. "2026-07-15"
  ProblemStart: string;       // e.g. "09:00"
  ProblemEnd: string;         // e.g. "14:00"
  ProblemDuration: number;    // minutes, e.g. 300
  ProblemPIC: string;         // person in charge name
}

/** Flat key/value map for the single {{Placeholder}} cells (header block, rows 2-11). */
export interface HeaderData {
  Date: string;
  PartNo: string;
  PartName: string;
  Operators: string;
  MachineName: string;
  [extraKey: string]: string; // allow additional {{Key}} placeholders without changing the type
}

export interface FillTemplateData {
  header: HeaderData;
  dandori: DandoriEntry[];
  production: ProductionEntry[];
  problem: ProblemEntry[];
  totalProduction: number;
}

/** A single-row merge span, expressed as 1-based [startColumn, endColumn]. */
type ColumnSpan = [number, number];

interface LowerMerge {
  range: string;
  sRow: number;
  sCol: number;
  eRow: number;
  eCol: number;
}

/**
 * Get the single-row merge column spans that belong to `rowNumber`.
 * e.g. row 14 -> [[2,7],[8,9],[11,12]]  (B:G, H:I, K:L)
 */
function getRowMergeSpans(worksheet: Worksheet, rowNumber: number): ColumnSpan[] {
  const spans: ColumnSpan[] = [];
  (worksheet.model.merges as string[]).forEach((range) => {
    const [startAddr, endAddr] = range.split(':');
    const start = worksheet.getCell(startAddr).fullAddress;
    const end = worksheet.getCell(endAddr).fullAddress;
    if (start.row === rowNumber && end.row === rowNumber && start.col !== end.col) {
      spans.push([start.col, end.col]);
    }
  });
  return spans;
}

/** Copy height + per-cell style from one row to another (values not included). */
function copyRowStyle(worksheet: Worksheet, fromRow: number, toRow: number, maxCol = 19): void {
  const src: Row = worksheet.getRow(fromRow);
  const dst: Row = worksheet.getRow(toRow);
  dst.height = src.height;
  for (let c = 1; c <= maxCol; c++) {
    dst.getCell(c).style = { ...src.getCell(c).style };
  }
}

/**
 * Insert `extra` new rows directly below `templateRow`, giving each one the
 * same merges + styling as `templateRow`.
 *
 * exceljs's own `duplicateRow`/`insertRow` do NOT reliably relocate merges
 * that sit below the insertion point (see exceljs issues #1843, #2146,
 * #2317, #2640), so we unmerge everything below first, insert the plain
 * rows, then re-create every merge (both the shifted ones and the new ones)
 * ourselves.
 */
export function insertRepeatingRows(
  worksheet: Worksheet,
  templateRow: number,
  extra: number,
  maxCol = 19,
): void {
  if (extra <= 0) return;

  const spans = getRowMergeSpans(worksheet, templateRow);

  const lowerMerges: LowerMerge[] = (worksheet.model.merges as string[])
    .map((range) => {
      const [startAddr, endAddr] = range.split(':');
      const start = worksheet.getCell(startAddr).fullAddress;
      const end = worksheet.getCell(endAddr).fullAddress;
      return {
        range,
        sRow: start.row,
        sCol: start.col,
        eRow: end.row,
        eCol: end.col,
      };
    })
    .filter((m) => m.sRow > templateRow);

  lowerMerges.forEach((m) => worksheet.unMergeCells(m.range));

  for (let i = 0; i < extra; i++) {
    worksheet.insertRow(templateRow + 1, []);
  }

  lowerMerges.forEach((m) => {
    worksheet.mergeCells(m.sRow + extra, m.sCol, m.eRow + extra, m.eCol);
  });

  for (let i = 0; i < extra; i++) {
    const newRowNum = templateRow + 1 + i;
    copyRowStyle(worksheet, templateRow, newRowNum, maxCol);
    spans.forEach(([sc, ec]) => {
      worksheet.mergeCells(newRowNum, sc, newRowNum, ec);
    });
  }
}

/** Replace every {{Key}} placeholder found in any cell's string value. */
export function replacePlaceholders(
  worksheet: Worksheet,
  data: Record<string, unknown>,
): void {
  worksheet.eachRow({ includeEmpty: true }, (row) => {
    row.eachCell({ includeEmpty: true }, (cell) => {
      if (typeof cell.value === 'string' && cell.value.includes('{{')) {
        cell.value = cell.value.replace(/{{\s*([\w.]+)\s*}}/g, (_match, key: string) => {
          const val = key
            .split('.')
            .reduce<unknown>((o, k) => (o == null ? o : (o as Record<string, unknown>)[k]), data);
          return val === undefined || val === null ? '' : String(val);
        });
      }
    });
  });
}

/**
 * Fill a single worksheet with the given data.
 * The worksheet must be a fresh copy of the template (with {{Placeholder}} values intact).
 */
function fillWorksheet(ws: Worksheet, data: FillTemplateData): void {
  const DANDORI_TEMPLATE_ROW = 14;
  const PRODUCTION_FIRST_ROW = 18;
  const PRODUCTION_REPEAT_ROW = 19;
  const PRODUCTION_LAST_PREBUILT = 27;
  const PROBLEM_FIRST_ROW = 36;
  const PROBLEM_REPEAT_ROW = 37;
  const PROBLEM_LAST_PREBUILT = 42;
  const PROBLEM_PREBUILT = PROBLEM_LAST_PREBUILT - PROBLEM_FIRST_ROW + 1;
  let totalRow = 28;

  const dandori: DandoriEntry[] = data.dandori ?? [];
  const production: ProductionEntry[] = data.production ?? [];
  const problem: ProblemEntry[] = data.problem ?? [];

  // expand DANDORI block if more than 1 row of data
  if (dandori.length > 1) {
    const extra = dandori.length - 1;
    insertRepeatingRows(ws, DANDORI_TEMPLATE_ROW, extra);
    totalRow += extra;
  }

  dandori.forEach((item, i) => {
    const r = DANDORI_TEMPLATE_ROW + i;
    ws.getCell(`B${r}`).value = item.DandoriDate ?? '';
    ws.getCell(`J${r}`).value = item.DandoriStart ?? '';
    ws.getCell(`N${r}`).value = '~';
    ws.getCell(`O${r}`).value = item.DandoriEnd ?? '';
    ws.getCell(`Q${r}`).value = item.DandoriDuration ?? '';
    ws.getCell(`R${r}`).value = 'Mnt';
  });

  // expand PRODUCTION block if more rows than pre-built capacity
  const prebuiltCapacity = PRODUCTION_LAST_PREBUILT - PRODUCTION_FIRST_ROW + 1;
  const dandoriShift = dandori.length > 1 ? dandori.length - 1 : 0;
  const productionRepeatRowAfterShift = PRODUCTION_REPEAT_ROW + dandoriShift;
  const lastPrebuiltAfterShift = PRODUCTION_LAST_PREBUILT + dandoriShift;

  if (production.length > prebuiltCapacity) {
    const extra = production.length - prebuiltCapacity;
    insertRepeatingRows(ws, lastPrebuiltAfterShift, extra);
    totalRow += extra;
  }

  const productionFirstRowAfterShift = PRODUCTION_FIRST_ROW + dandoriShift;

  production.forEach((item, i) => {
    const r = i === 0 ? productionFirstRowAfterShift : productionRepeatRowAfterShift + (i - 1);
    ws.getCell(`B${r}`).value = item.ProductionDate ?? '';
    ws.getCell(`G${r}`).value = item.ProductionStart ?? '';
    ws.getCell(`H${r}`).value = '~';
    ws.getCell(`J${r}`).value = item.ProductionEnd ?? '';
    ws.getCell(`L${r}`).value = item.Status ?? '';
    ws.getCell(`N${r}`).value = item.ProductionDuration ?? '';
    ws.getCell(`P${r}`).value = 'Mnt';
    ws.getCell(`Q${r}`).value = item.ProductionPIC ?? '';
  });

  ws.getCell(`N${totalRow}`).value = data.totalProduction ?? '';
  ws.getCell(`R${totalRow}`).value = 'Mnt';

  // expand PROBLEM block if more rows than pre-built capacity
  const productionShift = production.length > prebuiltCapacity ? production.length - prebuiltCapacity : 0;
  const problemShift = dandoriShift + productionShift;
  const problemFirstRowAfterShift = PROBLEM_FIRST_ROW + problemShift;
  const problemRepeatRowAfterShift = PROBLEM_REPEAT_ROW + problemShift;
  const problemLastPrebuiltAfterShift = PROBLEM_LAST_PREBUILT + problemShift;

  if (problem.length > PROBLEM_PREBUILT) {
    const extra = problem.length - PROBLEM_PREBUILT;
    insertRepeatingRows(ws, problemLastPrebuiltAfterShift, extra);
  }

  problem.forEach((item, i) => {
    const r = i === 0 ? problemFirstRowAfterShift : problemRepeatRowAfterShift + (i - 1);
    ws.getCell(`B${r}`).value = item.ProblemDate ?? '';
    ws.getCell(`E${r}`).value = item.ProblemStart ?? '';
    ws.getCell(`F${r}`).value = '~';
    ws.getCell(`G${r}`).value = item.ProblemEnd ?? '';
    ws.getCell(`H${r}`).value = item.ProblemDuration ?? '';
    ws.getCell(`I${r}`).value = 'Mnt';
    ws.getCell(`J${r}`).value = item.ProblemPIC ?? '';
  });

  replacePlaceholders(ws, data.header ?? {});
}

/**
 * Deep-clone a worksheet within the same workbook.
 * Copies column widths, row heights, cell values, cell styles, and merged ranges.
 */
function cloneWorksheet(
  workbook: ExcelJS.Workbook,
  source: Worksheet,
  name: string,
): Worksheet {
  const target = workbook.addWorksheet(name, {
    views: JSON.parse(JSON.stringify(source.views)),
    properties: JSON.parse(JSON.stringify(source.properties)),
    pageSetup: JSON.parse(JSON.stringify(source.pageSetup)),
  });

  // Copy column widths
  source.columns.forEach((col, i) => {
    if (col.width) target.getColumn(i + 1).width = col.width;
  });

  // Copy rows, cells, values, styles
  source.eachRow({ includeEmpty: true }, (row, rowNumber) => {
    const newRow = target.getRow(rowNumber);
    newRow.height = row.height;
    row.eachCell({ includeEmpty: true }, (cell, colNumber) => {
      const newCell = newRow.getCell(colNumber);
      newCell.value = cell.value;
      newCell.style = { ...cell.style };
    });
  });

  // Copy merged ranges
  const merges = source.model.merges as string[];
  if (merges) {
    merges.forEach((range) => {
      try {
        target.mergeCells(range);
      } catch {
        // ignore merge errors (some may be auto-created by exceljs)
      }
    });
  }

  return target;
}

/**
 * Fill the "Rekap Selesai Produksi" template with a single data set.
 *
 * @param templateBuffer  the .xlsx file loaded from disk/S3/etc
 * @param data            see FillTemplateData
 * @returns               an xlsx file as an ExcelJS-produced Buffer/ArrayBuffer
 */
export async function fillTemplate(
  templateBuffer: ExcelJS.Buffer | Buffer,
  data: FillTemplateData,
): Promise<ExcelJS.Buffer> {
  const workbook = new ExcelJS.Workbook();
  await workbook.xlsx.load(templateBuffer as ExcelJS.Buffer);
  const ws = workbook.getWorksheet('Sheet1');
  if (!ws) throw new Error('Sheet1 not found in template');

  fillWorksheet(ws, data);

  return workbook.xlsx.writeBuffer();
}

/**
 * Fill the template with multiple data sets, one sheet per product.
 *
 * @param templateBuffer  the .xlsx file loaded from disk/S3/etc
 * @param dataItems       array of FillTemplateData (one per product)
 * @returns               a single xlsx with one sheet per product
 */
export async function fillTemplateMulti(
  templateBuffer: ExcelJS.Buffer | Buffer,
  dataItems: FillTemplateData[],
): Promise<ExcelJS.Buffer> {
  if (dataItems.length === 0) throw new Error('No data to export');

  const workbook = new ExcelJS.Workbook();
  await workbook.xlsx.load(templateBuffer as ExcelJS.Buffer);
  const templateWs = workbook.getWorksheet('Sheet1');
  if (!templateWs) throw new Error('Sheet1 not found in template');

  if (dataItems.length === 1) {
    // Single product — fill the existing Sheet1 directly
    fillWorksheet(templateWs, dataItems[0]);
    templateWs.name = dataItems[0].header.PartNo || 'Report';
    return workbook.xlsx.writeBuffer();
  }

  // Multiple products — clone the template sheet for each product
  // First, create N-1 clones from the unfilled template
  const sheets: Worksheet[] = [templateWs];
  for (let i = 1; i < dataItems.length; i++) {
    const sheetName = dataItems[i].header.PartNo || `Product ${i + 1}`;
    sheets.push(cloneWorksheet(workbook, templateWs, sheetName));
  }

  // Rename the first sheet
  templateWs.name = dataItems[0].header.PartNo || 'Report';

  // Now fill each sheet with its product's data
  for (let i = 0; i < dataItems.length; i++) {
    fillWorksheet(sheets[i], dataItems[i]);
  }

  return workbook.xlsx.writeBuffer();
}
