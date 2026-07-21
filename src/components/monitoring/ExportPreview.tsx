"use client";

import { FillTemplateData } from "@/lib/template/fill-template";

interface Props {
  data: FillTemplateData[];
}

/**
 * A single cell in the 13-column grid (columns B-N in the source .xlsx).
 * col/row are 1-indexed and map 1:1 onto the merged-cell ranges in the
 * template, so this component's layout can be diffed directly against the
 * spreadsheet if the template ever changes.
 */
function Box({
  col,
  colSpan = 1,
  row,
  rowSpan = 1,
  label = false,
  center = false,
  muted = false,
  children,
}: {
  col: number;
  colSpan?: number;
  row: number;
  rowSpan?: number;
  label?: boolean;
  center?: boolean;
  muted?: boolean;
  children?: React.ReactNode;
}) {
  return (
    <div
      style={{
        gridColumn: `${col} / span ${colSpan}`,
        gridRow: `${row} / span ${rowSpan}`,
      }}
      className={[
        "border border-slate-300 px-2 py-1.5 text-sm flex items-center",
        center ? "justify-center text-center" : "",
        label ? "font-semibold bg-slate-50" : "",
        muted ? "text-slate-400" : "text-slate-800",
      ].join(" ")}
    >
      {children}
    </div>
  );
}

/** 13-column grid matching the sheet's columns B (1) through N (13). */
function SheetGrid({
  rows,
  children,
}: {
  rows: number;
  children: React.ReactNode;
}) {
  return (
    <div
      className="grid border-l border-t border-slate-300"
      style={{
        gridTemplateColumns: "repeat(13, minmax(0, 1fr))",
        gridTemplateRows: `repeat(${rows}, minmax(2rem, auto))`,
      }}
    >
      {children}
    </div>
  );
}

function ReportSection({ data }: { data: FillTemplateData }) {
  const { header, dandori, production, totalProduction } = data;

  return (
    <div className="flex flex-col gap-6">
      {/* Header info block: excel rows 4, 6-11 -> grid rows 1-7 */}
      <SheetGrid rows={7}>
        {/* row 4 */}
        <Box col={1} colSpan={3} row={1} label>
          Rekap Selesai Produksi
        </Box>
        <Box col={7} row={1} label center>
          TANGGAL:
        </Box>
        <Box col={8} row={1} center>
          {header.Date || "—"}
        </Box>

        {/* row 6-7 */}
        <Box col={1} colSpan={2} row={2} rowSpan={2} label>
          Customer
        </Box>
        <Box col={3} row={2} rowSpan={2}>
          {header.Customer || "—"}
        </Box>
        <Box col={4} colSpan={2} row={2} label center>
          OPERATOR
        </Box>
        <Box col={6} colSpan={3} row={2} label center>
          DISETUJUI
        </Box>
        <Box col={9} colSpan={3} row={2} label center>
          DIPERIKSA
        </Box>
        <Box col={12} colSpan={2} row={2} label center>
          DIBUAT
        </Box>

        <Box col={4} colSpan={2} row={3} rowSpan={2}>
          {header.Operators || "—"}
        </Box>
        {/* signature boxes: empty in the exported file, kept for layout fidelity */}
        <Box col={6} colSpan={3} row={3} rowSpan={5} muted />
        <Box col={9} colSpan={3} row={3} rowSpan={5} muted />
        <Box col={12} colSpan={2} row={3} rowSpan={5} muted />

        {/* row 8-9 */}
        <Box col={1} colSpan={2} row={4} rowSpan={2} label>
          Part No
        </Box>
        <Box col={3} row={4} rowSpan={2}>
          {header.PartNo || "—"}
        </Box>
        <Box col={4} colSpan={2} row={5} label center>
          MESIN
        </Box>

        {/* row 10-11 */}
        <Box col={1} colSpan={2} row={6} rowSpan={2} label>
          Part Name
        </Box>
        <Box col={3} row={6} rowSpan={2}>
          {header.PartName || "—"}
        </Box>
        <Box col={4} colSpan={2} row={6} rowSpan={2}>
          {header.MachineName || "—"}
        </Box>
      </SheetGrid>

      {/* DANDORI section: excel rows 12-14(+) */}
      <SheetGrid rows={2 + Math.max(dandori.length, 1)}>
        <Box col={1} colSpan={13} row={1} label center>
          DANDORI
        </Box>
        <Box col={1} colSpan={11} row={2} label center>
          WAKTU
        </Box>
        <Box col={12} colSpan={2} row={2} label center>
          DURASI
        </Box>

        {dandori.length === 0 ? (
          <Box col={1} colSpan={13} row={3} center muted>
            No dandori entries
          </Box>
        ) : (
          dandori.map((entry, i) => {
            const r = 3 + i;
            return (
              <div key={i} style={{ display: "contents" }}>
                <Box col={1} colSpan={6} row={r} center>
                  {entry.DandoriDate}
                </Box>
                <Box col={7} colSpan={2} row={r} center>
                  {entry.DandoriStart}
                </Box>
                <Box col={9} row={r} center>
                  ~
                </Box>
                <Box col={10} colSpan={2} row={r} center>
                  {entry.DandoriEnd}
                </Box>
                <Box col={12} row={r} center>
                  {entry.DandoriDuration}
                </Box>
                <Box col={13} row={r} center muted>
                  Mnt
                </Box>
              </div>
            );
          })
        )}
      </SheetGrid>

      {/* PRODUKSI section: excel rows 16-28(+) */}
      <SheetGrid rows={3 + Math.max(production.length, 1)}>
        <Box col={1} colSpan={13} row={1} label center>
          PRODUKSI
        </Box>
        <Box col={1} colSpan={8} row={2} label center>
          WAKTU
        </Box>
        <Box col={9} colSpan={3} row={2} label center>
          DURASI
        </Box>
        <Box col={12} colSpan={2} row={2} label center>
          PIC
        </Box>

        {production.length === 0 ? (
          <Box col={1} colSpan={13} row={3} center muted>
            No production entries
          </Box>
        ) : (
          production.map((entry, i) => {
            const r = 3 + i;
            return (
              <div key={i} style={{ display: "contents" }}>
                <Box col={1} colSpan={4} row={r} center>
                  {entry.ProductionDate}
                </Box>
                <Box col={5} row={r} center>
                  {entry.ProductionStart}
                </Box>
                <Box col={6} row={r} center>
                  ~
                </Box>
                <Box col={7} colSpan={2} row={r} center>
                  {entry.ProductionEnd}
                </Box>
                <Box col={9} colSpan={2} row={r} center>
                  {entry.ProductionDuration}
                </Box>
                <Box col={11} row={r} center muted>
                  Mnt
                </Box>
                <Box col={12} colSpan={2} row={r} center>
                  {entry.ProductionPIC}
                </Box>
              </div>
            );
          })
        )}

        {/* TOTAL row */}
        <Box
          col={1}
          colSpan={8}
          row={3 + Math.max(production.length, 1)}
          label
          center
        >
          TOTAL
        </Box>
        <Box
          col={9}
          colSpan={4}
          row={3 + Math.max(production.length, 1)}
          label
          center
        >
          {totalProduction}
        </Box>
        <Box
          col={13}
          row={3 + Math.max(production.length, 1)}
          center
          muted
        >
          Mnt
        </Box>
      </SheetGrid>
    </div>
  );
}

export function ExportPreview({ data }: Props) {
  return (
    <div className="flex flex-col gap-6 p-6 text-foreground bg-white">
      {/* B2:N2 */}
      <h2 className="text-center text-lg font-bold tracking-tight">
        PRESENTASI PRODUKTIVITAS KERJA
      </h2>

      {data.map((item, i) => (
        <div key={i} className="flex flex-col gap-6">
          {data.length > 1 && (
            <div className="flex items-center gap-3">
              <div className="h-px flex-1 bg-slate-300" />
              <span className="text-sm font-semibold text-slate-500">
                {item.header.PartNo} — {item.header.PartName}
              </span>
              <div className="h-px flex-1 bg-slate-300" />
            </div>
          )}
          <ReportSection data={item} />
        </div>
      ))}
    </div>
  );
}
