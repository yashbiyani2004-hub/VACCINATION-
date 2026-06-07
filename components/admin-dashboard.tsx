"use client"

import { useState } from "react"
import type { AdminRegistration } from "@/lib/types"

const inputClass =
  "w-full rounded-md border border-input bg-card px-3 py-2 text-sm text-foreground outline-none transition-colors focus:border-ring focus:ring-2 focus:ring-ring/30"

type ConfirmResult = {
  registration: AdminRegistration
  confirmationUrl: string
  confirmationQrDataUrl: string
  mailtoUrl: string
}

export function AdminDashboard() {
  const [password, setPassword] = useState("")
  const [authed, setAuthed] = useState(false)
  const [records, setRecords] = useState<AdminRegistration[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [busyId, setBusyId] = useState("")
  const [confirmResult, setConfirmResult] = useState<ConfirmResult | null>(null)
  const [screenshot, setScreenshot] = useState<string>("")

  async function loadRecords(pwd: string) {
    setLoading(true)
    setError("")
    try {
      const res = await fetch("/api/admin/registrations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password: pwd }),
      })
      const data = await res.json()
      if (!res.ok) {
        setError(data.error || "Could not load registrations.")
        setAuthed(false)
        return
      }
      setRecords(data)
      setAuthed(true)
    } catch {
      setError("Network error. Please try again.")
    } finally {
      setLoading(false)
    }
  }

  async function confirmPayment(id: string) {
    setBusyId(id)
    setError("")
    try {
      const res = await fetch(`/api/admin/confirm-payment/${encodeURIComponent(id)}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password }),
      })
      const data = await res.json()
      if (!res.ok) {
        setError(data.error || "Could not confirm payment.")
        return
      }
      setConfirmResult(data)
      await loadRecords(password)
    } catch {
      setError("Network error. Please try again.")
    } finally {
      setBusyId("")
    }
  }

  async function downloadExcel() {
    setError("")
    try {
      const res = await fetch("/api/admin/excel", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password }),
      })
      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        setError(data.error || "Could not download Excel.")
        return
      }
      const blob = await res.blob()
      const url = URL.createObjectURL(blob)
      const link = document.createElement("a")
      link.href = url
      link.download = "vaccination_registrations.xlsx"
      document.body.appendChild(link)
      link.click()
      link.remove()
      URL.revokeObjectURL(url)
    } catch {
      setError("Network error. Please try again.")
    }
  }

  if (!authed) {
    return (
      <div className="mx-auto max-w-sm rounded-xl border border-border bg-card p-6">
        <h2 className="text-lg font-semibold text-card-foreground">Admin sign in</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Enter the admin password to manage registrations.
        </p>
        <form
          onSubmit={(e) => {
            e.preventDefault()
            loadRecords(password)
          }}
          className="mt-5"
        >
          <label htmlFor="password" className="mb-1.5 block text-sm font-medium text-foreground">
            Password
          </label>
          <input
            id="password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className={inputClass}
            autoComplete="current-password"
          />
          {error ? (
            <p
              role="alert"
              className="mt-3 rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive"
            >
              {error}
            </p>
          ) : null}
          <button
            type="submit"
            disabled={loading}
            className="mt-4 w-full rounded-md bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground transition-opacity hover:opacity-90 disabled:opacity-60"
          >
            {loading ? "Signing in…" : "Sign in"}
          </button>
        </form>
      </div>
    )
  }

  const confirmedCount = records.filter((r) => r.paymentStatus === "Confirmed").length
  const verifiedCount = records.filter((r) => r.verificationStatus === "Verified").length

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap gap-3">
          <Stat label="Total" value={records.length} />
          <Stat label="Confirmed" value={confirmedCount} />
          <Stat label="Verified" value={verifiedCount} />
        </div>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => loadRecords(password)}
            className="rounded-md border border-border bg-card px-4 py-2 text-sm font-medium text-foreground transition-colors hover:bg-muted"
          >
            Refresh
          </button>
          <button
            type="button"
            onClick={downloadExcel}
            className="rounded-md bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground transition-opacity hover:opacity-90"
          >
            Download Excel
          </button>
        </div>
      </div>

      {error ? (
        <p
          role="alert"
          className="mt-4 rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive"
        >
          {error}
        </p>
      ) : null}

      <div className="mt-6 overflow-x-auto rounded-xl border border-border bg-card">
        <table className="w-full min-w-[820px] text-left text-sm">
          <thead>
            <tr className="border-b border-border text-xs uppercase tracking-wide text-muted-foreground">
              <th className="px-4 py-3 font-medium">Registration</th>
              <th className="px-4 py-3 font-medium">Participant</th>
              <th className="px-4 py-3 font-medium">Vaccine</th>
              <th className="px-4 py-3 font-medium">Payment</th>
              <th className="px-4 py-3 font-medium">Status</th>
              <th className="px-4 py-3 font-medium">Actions</th>
            </tr>
          </thead>
          <tbody>
            {records.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-4 py-10 text-center text-muted-foreground">
                  No registrations yet.
                </td>
              </tr>
            ) : (
              records.map((record) => {
                const confirmed = record.paymentStatus === "Confirmed"
                return (
                  <tr key={record.registrationId} className="border-b border-border last:border-0">
                    <td className="px-4 py-3">
                      <p className="font-mono text-xs font-semibold text-foreground">
                        {record.registrationId}
                      </p>
                      <p className="mt-0.5 text-xs text-muted-foreground">
                        {new Date(record.createdAt).toLocaleString()}
                      </p>
                    </td>
                    <td className="px-4 py-3">
                      <p className="font-medium text-foreground">{record.fullName}</p>
                      <p className="text-xs text-muted-foreground">{record.phone}</p>
                    </td>
                    <td className="px-4 py-3">
                      <p className="text-foreground">{record.vaccine}</p>
                      <p className="text-xs text-muted-foreground">{record.dose}</p>
                    </td>
                    <td className="px-4 py-3">
                      <p className="font-mono text-foreground">₹{record.paymentAmount}</p>
                      {record.paymentReference ? (
                        <p className="text-xs text-muted-foreground">
                          Ref: {record.paymentReference}
                        </p>
                      ) : null}
                      {record.paymentScreenshotDataUrl ? (
                        <button
                          type="button"
                          onClick={() => setScreenshot(record.paymentScreenshotDataUrl)}
                          className="mt-1 text-xs font-medium text-primary underline"
                        >
                          View screenshot
                        </button>
                      ) : null}
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${
                          confirmed ? "bg-success/15 text-success" : "bg-secondary text-secondary-foreground"
                        }`}
                      >
                        {confirmed ? "Confirmed" : "Pending"}
                      </span>
                      <p className="mt-1 text-xs text-muted-foreground">
                        {record.verificationStatus}
                      </p>
                    </td>
                    <td className="px-4 py-3">
                      {confirmed ? (
                        <span className="text-xs text-muted-foreground">—</span>
                      ) : (
                        <button
                          type="button"
                          onClick={() => confirmPayment(record.registrationId)}
                          disabled={busyId === record.registrationId}
                          className="rounded-md bg-success px-3 py-1.5 text-xs font-semibold text-success-foreground transition-opacity hover:opacity-90 disabled:opacity-60"
                        >
                          {busyId === record.registrationId ? "Confirming…" : "Confirm payment"}
                        </button>
                      )}
                    </td>
                  </tr>
                )
              })
            )}
          </tbody>
        </table>
      </div>

      {confirmResult ? (
        <Modal onClose={() => setConfirmResult(null)} title="Payment confirmed">
          <p className="text-sm text-muted-foreground">
            {confirmResult.registration.fullName} ({confirmResult.registration.registrationId})
          </p>
          <div className="mt-4 flex flex-col items-center rounded-lg bg-secondary p-4">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={confirmResult.confirmationQrDataUrl || "/placeholder.svg"}
              alt="Confirmation QR code"
              width={200}
              height={200}
              className="rounded-lg border border-border bg-card"
            />
            <p className="mt-2 break-all text-center text-xs text-muted-foreground">
              {confirmResult.confirmationUrl}
            </p>
          </div>
          <a
            href={confirmResult.mailtoUrl}
            className="mt-4 block w-full rounded-md bg-primary px-4 py-2.5 text-center text-sm font-semibold text-primary-foreground transition-opacity hover:opacity-90"
          >
            Email confirmation to participant
          </a>
        </Modal>
      ) : null}

      {screenshot ? (
        <Modal onClose={() => setScreenshot("")} title="Payment screenshot">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={screenshot || "/placeholder.svg"}
            alt="Payment screenshot uploaded by participant"
            className="mx-auto max-h-[60vh] w-auto rounded-lg border border-border"
          />
        </Modal>
      ) : null}
    </div>
  )
}

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-lg border border-border bg-card px-4 py-2">
      <p className="text-xs uppercase tracking-wide text-muted-foreground">{label}</p>
      <p className="font-mono text-xl font-semibold text-foreground">{value}</p>
    </div>
  )
}

function Modal({
  title,
  children,
  onClose,
}: {
  title: string
  children: React.ReactNode
  onClose: () => void
}) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-foreground/40 p-4"
      role="dialog"
      aria-modal="true"
      aria-label={title}
      onClick={onClose}
    >
      <div
        className="w-full max-w-md rounded-xl border border-border bg-card p-6 shadow-lg"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold text-card-foreground">{title}</h3>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="rounded-md p-1 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
          >
            <svg
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              <path d="M18 6 6 18" />
              <path d="m6 6 12 12" />
            </svg>
          </button>
        </div>
        <div className="mt-4">{children}</div>
      </div>
    </div>
  )
}
