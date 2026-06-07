import { SiteHeader } from "@/components/site-header"
import { AdminDashboard } from "@/components/admin-dashboard"

export default function AdminPage() {
  return (
    <main className="min-h-screen">
      <SiteHeader active="admin" />
      <div className="mx-auto max-w-6xl px-4 py-8 sm:py-12">
        <div className="mb-8">
          <h1 className="text-balance text-3xl font-semibold tracking-tight text-foreground sm:text-4xl">
            Admin Dashboard
          </h1>
          <p className="mt-3 text-pretty leading-relaxed text-muted-foreground">
            Review registrations, confirm UPI payments, issue confirmation QR codes,
            and export all records to Excel.
          </p>
        </div>
        <AdminDashboard />
      </div>
    </main>
  )
}
