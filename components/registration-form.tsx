"use client"

import { useEffect, useState } from "react"
import type { PublicRegistration, Vaccine } from "@/lib/types"

type Config = {
  vaccines: Vaccine[]
  payment: {
    mode: string
    upiId: string
    payeeName: string
    referenceQrImage: string
  }
}

type SubmitResult = {
  registration: PublicRegistration
  paymentQrDataUrl: string
}

const inputClass =
  "w-full rounded-md border border-input bg-card px-3 py-2 text-sm text-foreground outline-none transition-colors focus:border-ring focus:ring-2 focus:ring-ring/30"
const labelClass = "mb-1.5 block text-sm font-medium text-foreground"

export function RegistrationForm() {
  const [config, setConfig] = useState<Config | null>(null)
  const [vaccineId, setVaccineId] = useState("")
  const [screenshotDataUrl, setScreenshotDataUrl] = useState("")
  const [screenshotName, setScreenshotName] = useState("")
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState("")
  const [result, setResult] = useState<SubmitResult | null>(null)

  useEffect(() => {
    let cancelled = false
    fetch("/api/config")
      .then((res) => res.json())
      .then((data: Config) => {
        if (!cancelled) setConfig(data)
      })
      .catch(() => {
        if (!cancelled) setError("Could not load configuration. Please refresh.")
      })
    return () => {
      cancelled = true
    }
  }, [])

  const selectedVaccine = config?.vaccines.find((v) => v.id === vaccineId)

  async function handleFile(file: File | undefined) {
    if (!file) {
      setScreenshotDataUrl("")
      setScreenshotName("")
      return
    }
    const reader = new FileReader()
    reader.onload = () => {
      setScreenshotDataUrl(String(reader.result || ""))
      setScreenshotName(file.name)
    }
    reader.readAsDataURL(file)
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setError("")
    setSubmitting(true)

    const formData = new FormData(event.currentTarget)
    const payload = {
      fullName: formData.get("fullName"),
      age: formData.get("age"),
      gender: formData.get("gender"),
      phone: formData.get("phone"),
      email: formData.get("email"),
      address: formData.get("address"),
      batchName: formData.get("batchName"),
      vaccineId,
      dose: formData.get("dose"),
      paymentReference: formData.get("paymentReference"),
      paymentScreenshot: screenshotDataUrl,
    }

    try {
      const res = await fetch("/api/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      })
      const data = await res.json()
      if (!res.ok) {
        setError(data.error || "Registration failed.")
        return
      }
      setResult(data)
      window.scrollTo({ top: 0, behavior: "smooth" })
    } catch {
      setError("Network error. Please try again.")
    } finally {
      setSubmitting(false)
    }
  }

  if (result) {
    return <RegistrationSuccess result={result} onReset={() => setResult(null)} />
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="grid grid-cols-1 gap-6 lg:grid-cols-3"
    >
      <div className="lg:col-span-2">
        <div className="rounded-xl border border-border bg-card p-5 sm:p-6">
          <h2 className="text-lg font-semibold text-card-foreground">
            Participant details
          </h2>
          <div className="mt-5 grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="sm:col-span-2">
              <label htmlFor="fullName" className={labelClass}>
                Full name
              </label>
              <input id="fullName" name="fullName" required className={inputClass} />
            </div>
            <div>
              <label htmlFor="age" className={labelClass}>
                Age
              </label>
              <input
                id="age"
                name="age"
                type="number"
                min="1"
                max="120"
                required
                className={inputClass}
              />
            </div>
            <div>
              <label htmlFor="gender" className={labelClass}>
                Gender
              </label>
              <select id="gender" name="gender" required className={inputClass} defaultValue="">
                <option value="" disabled>
                  Select gender
                </option>
                <option>Female</option>
                <option>Male</option>
                <option>Other</option>
              </select>
            </div>
            <div>
              <label htmlFor="phone" className={labelClass}>
                Phone
              </label>
              <input
                id="phone"
                name="phone"
                type="tel"
                inputMode="tel"
                required
                className={inputClass}
              />
            </div>
            <div>
              <label htmlFor="email" className={labelClass}>
                Email
              </label>
              <input id="email" name="email" type="email" className={inputClass} />
            </div>
            <div className="sm:col-span-2">
              <label htmlFor="address" className={labelClass}>
                Address
              </label>
              <textarea id="address" name="address" rows={2} className={inputClass} />
            </div>
            <div>
              <label htmlFor="batchName" className={labelClass}>
                Batch name
              </label>
              <input id="batchName" name="batchName" required className={inputClass} />
            </div>
            <div>
              <label htmlFor="dose" className={labelClass}>
                Dose
              </label>
              <select id="dose" name="dose" required className={inputClass} defaultValue="">
                <option value="" disabled>
                  Select dose
                </option>
                <option>Dose 1</option>
                <option>Dose 2</option>
                <option>Booster</option>
              </select>
            </div>
          </div>

          <h2 className="mt-8 text-lg font-semibold text-card-foreground">
            Select vaccine
          </h2>
          <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
            {config?.vaccines.map((vaccine) => {
              const checked = vaccineId === vaccine.id
              return (
                <label
                  key={vaccine.id}
                  className={`flex cursor-pointer items-center justify-between rounded-lg border p-4 transition-colors ${
                    checked
                      ? "border-primary bg-accent"
                      : "border-border bg-card hover:border-ring/50"
                  }`}
                >
                  <span className="flex items-center gap-3">
                    <input
                      type="radio"
                      name="vaccineRadio"
                      className="h-4 w-4 accent-primary"
                      checked={checked}
                      onChange={() => setVaccineId(vaccine.id)}
                    />
                    <span className="text-sm font-medium text-foreground">
                      {vaccine.name}
                    </span>
                  </span>
                  <span className="font-mono text-sm font-semibold text-primary">
                    ₹{vaccine.price}
                  </span>
                </label>
              )
            })}
          </div>
        </div>
      </div>

      <div className="lg:col-span-1">
        <div className="sticky top-6 rounded-xl border border-border bg-card p-5 sm:p-6">
          <h2 className="text-lg font-semibold text-card-foreground">Payment</h2>
          {selectedVaccine ? (
            <PaymentPanel vaccineId={selectedVaccine.id} amount={selectedVaccine.price} />
          ) : (
            <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
              Select a vaccine to see the UPI payment amount and scan code.
            </p>
          )}

          <div className="mt-5">
            <label htmlFor="paymentReference" className={labelClass}>
              UPI reference / transaction ID
            </label>
            <input
              id="paymentReference"
              name="paymentReference"
              className={inputClass}
              placeholder="e.g. 4012 3456 7890"
            />
          </div>

          <div className="mt-4">
            <label htmlFor="screenshot" className={labelClass}>
              Payment screenshot
            </label>
            <input
              id="screenshot"
              type="file"
              accept="image/png,image/jpeg,image/webp"
              onChange={(e) => handleFile(e.target.files?.[0])}
              className="block w-full text-sm text-muted-foreground file:mr-3 file:rounded-md file:border-0 file:bg-secondary file:px-3 file:py-2 file:text-sm file:font-medium file:text-secondary-foreground hover:file:bg-muted"
            />
            {screenshotName ? (
              <p className="mt-2 text-xs text-muted-foreground">
                Attached: {screenshotName}
              </p>
            ) : null}
          </div>

          {error ? (
            <p
              role="alert"
              className="mt-4 rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive"
            >
              {error}
            </p>
          ) : null}

          <button
            type="submit"
            disabled={submitting}
            className="mt-5 w-full rounded-md bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground transition-opacity hover:opacity-90 disabled:opacity-60"
          >
            {submitting ? "Submitting…" : "Submit registration"}
          </button>
        </div>
      </div>
    </form>
  )
}

function PaymentPanel({ vaccineId, amount }: { vaccineId: string; amount: number }) {
  const [qr, setQr] = useState("")

  useEffect(() => {
    let cancelled = false
    setQr("")
    fetch(`/api/payment-qr/${vaccineId}`)
      .then((res) => res.json())
      .then((data) => {
        if (!cancelled) setQr(data.qrDataUrl || "")
      })
      .catch(() => {})
    return () => {
      cancelled = true
    }
  }, [vaccineId])

  return (
    <div className="mt-3">
      <div className="flex items-baseline justify-between rounded-lg bg-secondary px-3 py-2">
        <span className="text-sm text-secondary-foreground">Amount due</span>
        <span className="font-mono text-lg font-semibold text-primary">₹{amount}</span>
      </div>
      <div className="mt-4 flex flex-col items-center">
        {qr ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={qr || "/placeholder.svg"}
            alt="UPI payment QR code"
            width={180}
            height={180}
            className="rounded-lg border border-border"
          />
        ) : (
          <div className="flex h-[180px] w-[180px] items-center justify-center rounded-lg border border-dashed border-border text-xs text-muted-foreground">
            Generating QR…
          </div>
        )}
        <p className="mt-3 text-center text-xs leading-relaxed text-muted-foreground">
          Scan with any UPI app to pay. After paying, enter the reference ID and
          attach a screenshot.
        </p>
      </div>
    </div>
  )
}

function RegistrationSuccess({
  result,
  onReset,
}: {
  result: SubmitResult
  onReset: () => void
}) {
  const { registration, paymentQrDataUrl } = result
  return (
    <div className="rounded-xl border border-border bg-card p-6 sm:p-8">
      <div className="flex items-center gap-3">
        <span className="flex h-10 w-10 items-center justify-center rounded-full bg-success text-success-foreground">
          <svg
            width="20"
            height="20"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
          >
            <path d="M20 6 9 17l-5-5" />
          </svg>
        </span>
        <div>
          <h2 className="text-xl font-semibold text-card-foreground">
            Registration received
          </h2>
          <p className="text-sm text-muted-foreground">
            Payment is pending admin confirmation.
          </p>
        </div>
      </div>

      <dl className="mt-6 grid grid-cols-1 gap-x-6 gap-y-3 sm:grid-cols-2">
        <Detail label="Registration ID" value={registration.registrationId} mono />
        <Detail label="Name" value={registration.fullName} />
        <Detail label="Vaccine" value={registration.vaccine} />
        <Detail label="Amount" value={`₹${registration.paymentAmount}`} />
        <Detail label="Dose" value={registration.dose} />
        <Detail label="Payment status" value={registration.paymentStatus} />
      </dl>

      {paymentQrDataUrl ? (
        <div className="mt-6 flex flex-col items-center rounded-lg bg-secondary p-4">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={paymentQrDataUrl || "/placeholder.svg"}
            alt="UPI payment QR code"
            width={160}
            height={160}
            className="rounded-lg border border-border bg-card"
          />
          <p className="mt-2 text-xs text-muted-foreground">
            Keep this UPI QR if you still need to pay.
          </p>
        </div>
      ) : null}

      <p className="mt-6 text-sm leading-relaxed text-muted-foreground">
        Save your Registration ID. You can check its status anytime on the{" "}
        <a href={`/verify?id=${registration.registrationId}`} className="font-medium text-primary underline">
          verification page
        </a>
        .
      </p>

      <button
        type="button"
        onClick={onReset}
        className="mt-5 rounded-md border border-border bg-card px-4 py-2 text-sm font-medium text-foreground transition-colors hover:bg-muted"
      >
        Register another participant
      </button>
    </div>
  )
}

function Detail({
  label,
  value,
  mono,
}: {
  label: string
  value: string
  mono?: boolean
}) {
  return (
    <div>
      <dt className="text-xs uppercase tracking-wide text-muted-foreground">{label}</dt>
      <dd className={`mt-0.5 text-sm text-foreground ${mono ? "font-mono font-semibold" : ""}`}>
        {value || "—"}
      </dd>
    </div>
  )
}
