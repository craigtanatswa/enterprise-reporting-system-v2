import { format } from "date-fns"
import { getDepartmentLabel, getSubDepartmentLabel, type Department, type SubDepartment } from "@/lib/utils/permissions"
import { DOCUMENT_STATUSES } from "@/lib/utils/dashboard-routing"

export type ExportableDocument = {
  title: string
  department: string
  sub_department?: string | null
  category: string
  reporting_period?: string | null
  uploaded_by?: { full_name: string; email?: string } | null
  created_at: string
  status: string
}

export function documentStatusExportLabel(status: string) {
  return DOCUMENT_STATUSES.find((s) => s.value === status)?.label ?? status
}

function departmentLine(department: string, sub?: string | null) {
  const base = getDepartmentLabel(department as Department)
  if (!sub) return base
  return `${base} — ${getSubDepartmentLabel(sub as SubDepartment)}`
}

export function buildStandardDocumentTableExport(
  docs: ExportableDocument[],
  submittedByHeader = "Submitted by"
) {
  const headers = ["Title", "Department", "Category", "Period", submittedByHeader, "Date", "Status"]
  const rows = docs.map((doc) => [
    doc.title,
    departmentLine(doc.department, doc.sub_department),
    (doc.category || "").replace(/_/g, " "),
    doc.reporting_period || "",
    doc.uploaded_by
      ? doc.uploaded_by.email
        ? `${doc.uploaded_by.full_name} (${doc.uploaded_by.email})`
        : doc.uploaded_by.full_name
      : "",
    format(new Date(doc.created_at), "MMM d, yyyy"),
    documentStatusExportLabel(doc.status),
  ])
  return { headers, rows }
}
