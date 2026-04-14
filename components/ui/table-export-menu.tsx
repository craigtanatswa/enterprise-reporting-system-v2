"use client"

import { useState } from "react"
import { Download } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { downloadTableAsPdf, downloadTableAsXlsx, type ExportCell } from "@/lib/utils/table-export"
import { useToast } from "@/hooks/use-toast"
import { cn } from "@/lib/utils"

export function TableExportMenu({
  fileBaseName,
  sheetName = "Export",
  title,
  headers,
  rows,
  disabled,
  className,
  align = "end",
}: {
  fileBaseName: string
  sheetName?: string
  title?: string
  headers: string[]
  rows: ExportCell[][]
  disabled?: boolean
  className?: string
  align?: "start" | "end"
}) {
  const [pending, setPending] = useState<"xlsx" | "pdf" | null>(null)
  const { toast } = useToast()

  const run = async (kind: "xlsx" | "pdf") => {
    setPending(kind)
    try {
      if (kind === "xlsx") {
        await downloadTableAsXlsx(fileBaseName, sheetName, headers, rows)
      } else {
        await downloadTableAsPdf(fileBaseName, title ?? fileBaseName, headers, rows)
      }
    } catch (e) {
      toast({
        title: "Export failed",
        description: e instanceof Error ? e.message : "Could not generate the file.",
        variant: "destructive",
      })
    } finally {
      setPending(null)
    }
  }

  const busy = pending !== null
  const isDisabled = disabled || busy || headers.length === 0 || rows.length === 0

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button type="button" variant="outline" size="sm" className={cn("gap-2", className)} disabled={isDisabled}>
          <Download className="size-4 shrink-0" />
          {busy ? "Exporting…" : "Export"}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align={align} className="w-52">
        <DropdownMenuItem disabled={busy} onSelect={() => void run("xlsx")}>
          Excel (.xlsx)
        </DropdownMenuItem>
        <DropdownMenuItem disabled={busy} onSelect={() => void run("pdf")}>
          PDF
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
