import { Suspense } from "react"
import { SiteHeader } from "@/components/site-header"
import { VerifyPanel } from "@/components/verify-panel"

export default function VerifyPage() {
  return (
    <main className="min-h-screen">
      <SiteHeader active="verify" />
      <div className="mx-auto max-w-2xl px-4 py-8 sm:py-12">
        <div className="mb-8">
          <h1 className="text-balance text-3xl font-semibold tracking-tight text-foreground sm:text-4xl">
            Verify a Registration
          </h1>
          <p className="mt-3 text-pretty leading-relaxed text-muted-foreground">
            Enter a Registration ID to view its status. Staff can mark a confirmed
            registration as verified on vaccination day.
          </p>
        </div>
        <Suspense fallback={null}>
          <VerifyPanel />
        </Suspense>
      </div>
    </main>
  )
}
