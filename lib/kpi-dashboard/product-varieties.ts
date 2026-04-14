/**
 * Canonical product varieties for Sales & Marketing volume reporting.
 * IDs are stable keys for `kpi_sales_volume_monthly.variety_id`.
 */
export type ProductVariety = {
  id: string
  category: string
  label: string
}

export const SALES_PRODUCT_VARIETIES: ProductVariety[] = [
  { id: "maize-opv-zm521", category: "MAIZE", label: "OPV maize ZM521" },
  { id: "maize-zs269", category: "MAIZE", label: "ZS269" },
  { id: "maize-zs263", category: "MAIZE", label: "ZS263" },
  { id: "maize-zs265", category: "MAIZE", label: "ZS265" },
  { id: "maize-zs248a", category: "MAIZE", label: "ZS248A" },
  { id: "sorghum-macia", category: "SORGHUM", label: "SORGHUM Macia" },
  { id: "pearl-millet-okashana", category: "PEARL MILLET", label: "Pearl Millet Okashana" },
  { id: "cowpeas-cbc1", category: "AFRICAN TRADITIONAL PEAS (COW PEAS)", label: "CBC 1" },
  { id: "cowpeas-cbc2", category: "AFRICAN TRADITIONAL PEAS (COW PEAS)", label: "CBC 2" },
  { id: "soy-mhofu", category: "SOYABEANS", label: "Mhofu" },
  { id: "soy-bimha", category: "SOYABEANS", label: "Bimha" },
  { id: "sun-msasa", category: "SUNFLOWER", label: "Msasa" },
  { id: "sun-perodovic", category: "SUNFLOWER", label: "Perodovic" },
  { id: "sun-opv", category: "SUNFLOWER", label: "SUNFLOWER OPV" },
  { id: "sugar-nua45", category: "SUGARBEANS", label: "Nua 45" },
  { id: "sugar-gloria", category: "SUGARBEANS", label: "Gloria" },
  { id: "groundnuts-ilanda", category: "GROUNDNUTS", label: "Ilanda" },
  { id: "lab-lab", category: "LAB - LAB", label: "LAB - LAB" },
  { id: "velvet-bean", category: "VELVET BEAN", label: "VELVET BEAN" },
  { id: "wheat-ncema", category: "WHEAT", label: "Ncema" },
]

const byId = new Map(SALES_PRODUCT_VARIETIES.map((v) => [v.id, v]))

export function getVarietyLabel(varietyId: string): string {
  return byId.get(varietyId)?.label ?? varietyId
}
