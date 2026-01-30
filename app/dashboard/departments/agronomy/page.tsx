import { redirect } from "next/navigation"

// Agronomy follows the standard documents-first pattern
// Redirect to Documents page as primary landing
export default async function AgronomyPage() {
  redirect("/dashboard/departments/agronomy/documents")
}
