"use client"

import { useEffect, useState } from "react"
import { useSearchParams } from "next/navigation"
import type { PublicRegistration } from "@/lib/types"

const inputClass =
  "w-full rounded-md border border-input bg-card px-3 py-2 text-sm text-foreground outline-none transition-colors focus:border-ring focus:ring-2 focus:ring-ring/30"

function StatusBadge({ label, tone }: { label: string; tone: "success" | "pending" }) {
  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
        tone === "success"
          ? "bg-success/15 text-success"
          : "bg-secondary text-secondary-foreground"
      }`}
    >
      {label}
    </span>
  )
}

export function VerifyPanel() {
  const searchParams = useSearchParams()
  const [id, setId] = useState("")
  const [record, setRecord] = useState<PublicRegistration | null>(null)
  const [loading, setLoading] = useState(false)
  const [verifying, setVerifying] = useState(false)
  const [error, setError] = useState("")

  async function lookup(registrationId: string) {
    if (!registrationId.trim()) return
    setLoading(true)
    setError("")
    setRecord(null)
    try {
      const res = await fetch(`/api/registration/${encodeURIComponent(registrationId.trim())}`)
      const data = await res.json()
      if (!res.ok) {
        setError(data.error || "Registration not found.")
        return
      }
      setRecord(data)
    } catch {
      setError("Network error. Please try again.")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    const initial = searchParams.get("id")
    if (initial) {
      setId(initial)
      lookup(initial)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  async function markVerified() {
    if (!record) return
    setVerifying(true)
    setError("")
    try {
      const res = await fetch(`/api/verify/${encodeURIComponent(record.registrationId)}`, {
        method: "POST",
      })
      const data = await res.json()
      if (!res.ok) {
        setError(data.error || "Could not verify.")
        return
      }
      setRecord(data)
    } catch {
      setError("Network error. Please try again.")
    } finally {
      setVerifying(false)
    }
  }

  const paymentConfirmed = record?.paymentStatus === "Confirmed"
  const isVerified = record?.verificationStatus === "Verified"

  return (
    <div>
      <form
        onSubmit={(e) => {
          e.preventDefault()
          lookup(id)
        }}
        className="flex flex-col gap-3 sm:flex-row"
      >
        <input
          value={id}
          onChange={(e) => setId(e.target.value)}
          placeholder="VAC-20260607-AB12CD"
          aria-label="Registration ID"
          className={`${inputClass} font-mono`}
        />
        <button
          type="submit"
          disabled={loading}
          className="rounded-md bg-primary px-5 py-2 text-sm font-semibold text-primary-foreground transition-opacity hover:opacity-90 disabled:opacity-60"
        >
          {loading ? "Looking up…" : "Look up"}
        </button>
      </form>

      {error ? (
        <p
          role="alert"
          className="mt-4 rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive"
        >
          {error}
        </p>
      ) : null}

      {record ? (
        <div className="mt-6 rounded-xl border border-border bg-card p-5 sm:p-6">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <p className="font-mono text-sm font-semibold text-foreground">
              {record.registrationId}
            </p>
            <div className="flex gap-2">
              <StatusBadge
                label={paymentConfirmed ? "Payment Confirmed" : record.paymentStatus}
                tone={paymentConfirmed ? "success" : "pending"}
              />
              <StatusBadge
                label={isVerified ? "Verified" : "Not Verified"}
                tone={isVerified ? "success" : "pending"}
              />
            </div>
          </div>

          <dl className="mt-5 grid grid-cols-1 gap-x-6 gap-y-3 sm:grid-cols-2">
            <Detail label="Name" value={record.fullName} />
            <Detail label="Vaccine" value={record.vaccine} />
            <Detail label="Dose" value={record.dose} />
            <Detail label="Batch" value={record.batchName} />
            <Detail label="Amount" value={`₹${record.paymentAmount}`} />
            <Detail
              label="Verified at"
              value={record.verifiedAt ? new Date(record.verifiedAt).toLocaleString() : "—"}
            />
          </dl>

          <div className="mt-6 border-t border-border pt-5">
            {!paymentConfirmed ? (
              <p className="text-sm leading-relaxed text-muted-foreground">
                Payment has not been confirmed by an admin yet. Verification will be
                available once the payment is confirmed.
              </p>
            ) : isVerified ? (
              <p className="text-sm font-medium text-success">
                This registration is verified. The participant may proceed.
              </p>
            ) : (
              <button
                type="button"
                onClick={markVerified}
                disabled={verifying}
                className="rounded-md bg-success px-5 py-2 text-sm font-semibold text-success-foreground transition-opacity hover:opacity-90 disabled:opacity-60"
              >
                {verifying ? "Verifying…" : "Mark as verified"}
              </button>
            )}
          </div>
        </div>
      ) : null}
    </div>
  )
}

function Detail({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-xs uppercase tracking-wide text-muted-foreground">{label}</dt>
      <dd className="mt-0.5 text-sm text-foreground">{value || "—"}</dd>
    </div>
  )
}
