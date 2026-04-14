export type ExportCell = string | number | null | undefined

function cellToString(c: ExportCell): string {
  if (c === null || c === undefined) return ""
  return String(c)
}

export async function downloadTableAsXlsx(
  fileBaseName: string,
  sheetName: string,
  headers: string[],
  rows: ExportCell[][]
) {
  const XLSX = await import("xlsx")
  const body = rows.map((r) => r.map(cellToString))
  const aoa = [headers, ...body]
  const ws = XLSX.utils.aoa_to_sheet(aoa)
  const wb = XLSX.utils.book_new()
  const safeSheet = (sheetName || "Sheet1").slice(0, 31) || "Sheet1"
  XLSX.utils.book_append_sheet(wb, ws, safeSheet)
  const safeName = fileBaseName.replace(/[^\w\-]+/g, "_").replace(/_+/g, "_").slice(0, 80)
  XLSX.writeFile(wb, `${safeName}.xlsx`)
}

export async function downloadTableAsPdf(
  fileBaseName: string,
  title: string,
  headers: string[],
  rows: ExportCell[][]
) {
  const [{ default: jsPDF }, autoTableMod] = await Promise.all([import("jspdf"), import("jspdf-autotable")])
  const autoTable = (autoTableMod as { default: (d: InstanceType<typeof jsPDF>, opts: object) => void }).default
  const body = rows.map((r) => r.map((c) => cellToString(c)))
  const landscape = headers.length > 7
  const doc = new jsPDF({ orientation: landscape ? "landscape" : "portrait", unit: "mm", format: "a4" })
  const margin = 12
  let startY = margin
  if (title) {
    doc.setFontSize(11)
    doc.text(title, margin, startY)
    startY += 7
  }
  autoTable(doc, {
    startY,
    head: [headers],
    body,
    styles: { fontSize: landscape ? 6 : 8, cellPadding: 1.5 },
    headStyles: { fillColor: [55, 55, 55] },
    margin: { left: margin, right: margin },
  })
  const safeName = fileBaseName.replace(/[^\w\-]+/g, "_").replace(/_+/g, "_").slice(0, 80)
  doc.save(`${safeName}.pdf`)
}
