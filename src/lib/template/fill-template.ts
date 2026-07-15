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
  ProductionPIC: string;      // person in charge name
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
function copyRowStyle(worksheet: Worksheet, fromRow: number, toRow: number, maxCol = 14): void {
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
  maxCol = 14,
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
 * Fill the "Rekap Selesai Produksi" template.
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

  // --- 1. figure out how many rows already exist for each repeating block ---
  const DANDORI_TEMPLATE_ROW = 14;   // only 1 slot pre-built
  const PRODUCTION_FIRST_ROW = 18;   // has its own (wider) column layout
  const PRODUCTION_REPEAT_ROW = 19;  // rows 19-27 share this narrower/merged layout
  const PRODUCTION_LAST_PREBUILT = 27;
  let totalRow = 28;                 // will shift if we insert rows

  const dandori: DandoriEntry[] = data.dandori ?? [];
  const production: ProductionEntry[] = data.production ?? [];

  // --- 2. expand DANDORI block if more than 1 row of data ---
  if (dandori.length > 1) {
    const extra = dandori.length - 1;
    insertRepeatingRows(ws, DANDORI_TEMPLATE_ROW, extra);
    totalRow += extra; // everything below shifted down
  }

  // fill dandori rows (row 14, 15, 16... depending on how many were inserted)
  dandori.forEach((item, i) => {
    const r = DANDORI_TEMPLATE_ROW + i;
    ws.getCell(`B${r}`).value = item.DandoriDate ?? '';
    ws.getCell(`H${r}`).value = item.DandoriStart ?? '';
    ws.getCell(`J${r}`).value = '~';
    ws.getCell(`K${r}`).value = item.DandoriEnd ?? '';
    ws.getCell(`M${r}`).value = item.DandoriDuration ?? '';
    ws.getCell(`N${r}`).value = 'Mnt';
  });

  // --- 3. expand PRODUCTION block if more rows than pre-built capacity ---
  const prebuiltCapacity = PRODUCTION_LAST_PREBUILT - PRODUCTION_FIRST_ROW + 1; // 10
  const dandoriShift = dandori.length > 1 ? dandori.length - 1 : 0;
  const productionRepeatRowAfterShift = PRODUCTION_REPEAT_ROW + dandoriShift;
  const lastPrebuiltAfterShift = PRODUCTION_LAST_PREBUILT + dandoriShift;

  if (production.length > prebuiltCapacity) {
    const extra = production.length - prebuiltCapacity;
    // clone from the LAST pre-built repeat row, not row 18, since 19-27 share one layout
    insertRepeatingRows(ws, lastPrebuiltAfterShift, extra);
    totalRow += extra;
  }

  const productionFirstRowAfterShift = PRODUCTION_FIRST_ROW + dandoriShift;

  production.forEach((item, i) => {
    const r = i === 0 ? productionFirstRowAfterShift : productionRepeatRowAfterShift + (i - 1);
    ws.getCell(`B${r}`).value = item.ProductionDate ?? '';
    ws.getCell(`F${r}`).value = item.ProductionStart ?? '';
    ws.getCell(`G${r}`).value = '~';
    ws.getCell(`H${r}`).value = item.ProductionEnd ?? '';
    ws.getCell(`J${r}`).value = item.ProductionDuration ?? '';
    ws.getCell(`L${r}`).value = 'Mnt';
    ws.getCell(`M${r}`).value = item.ProductionPIC ?? '';
  });

  ws.getCell(`J${totalRow}`).value = data.totalProduction ?? '';
  ws.getCell(`N${totalRow}`).value = 'Mnt';

  // --- 4. simple header placeholders (Date, Customer, PartNo, etc.) ---
  replacePlaceholders(ws, data.header ?? {});

  return workbook.xlsx.writeBuffer();
}