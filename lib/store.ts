import crypto from "crypto"
import type {
  AdminRegistration,
  PublicRegistration,
  Registration,
  Vaccine,
} from "./types"

export const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || "ap09cq2770"
export const PAYMENT_UPI_ID = process.env.PAYMENT_UPI_ID || "9325339930@sbi"
export const PAYMENT_PAYEE_NAME = process.env.PAYMENT_PAYEE_NAME || "Yash Biyani"

export const VACCINES: Vaccine[] = [
  { id: "ceravac-hpv", name: "ceravac-HPV", price: 1300 },
  { id: "revac-b-hbv", name: "Revac-B+ -HBV vaccine", price: 75 },
]

export const HEADERS = [
  "Registration ID",
  "Created At",
  "Full Name",
  "Age",
  "Gender",
  "Phone",
  "Email",
  "Address",
  "Batch Name",
  "Vaccine",
  "Dose",
  "Payment Amount",
  "Payment Mode",
  "UPI ID",
  "Payment Reference",
  "Payment Screenshot",
  "Payment Status",
  "Payment Confirmed At",
  "Verification Status",
  "Verified At",
]

/**
 * In-memory data store.
 *
 * NOTE: Vercel's serverless runtime does not provide a persistent disk, so this
 * store is NOT durable across cold starts or deployments. It keeps the app fully
 * functional for a public URL; swap in a database (e.g. Neon) for permanent storage.
 *
 * A module-level global is used so the data survives hot-reloads in dev and is
 * shared across requests within a warm serverless instance.
 */
const globalStore = globalThis as unknown as {
  __vaccinationRegistrations?: Registration[]
}

function store(): Registration[] {
  if (!globalStore.__vaccinationRegistrations) {
    globalStore.__vaccinationRegistrations = []
  }
  return globalStore.__vaccinationRegistrations
}

export function readRegistrations(): Registration[] {
  return store()
}

export function getVaccine(vaccineId: string): Vaccine | undefined {
  return VACCINES.find((vaccine) => vaccine.id === vaccineId)
}

export function createRegistrationId(): string {
  const stamp = new Date().toISOString().slice(0, 10).replace(/-/g, "")
  const token = crypto.randomBytes(3).toString("hex").toUpperCase()
  return `VAC-${stamp}-${token}`
}

export function createUpiUri(vaccine: Vaccine): string {
  const params = new URLSearchParams({
    pa: PAYMENT_UPI_ID,
    pn: PAYMENT_PAYEE_NAME,
    am: String(vaccine.price),
    cu: "INR",
    tn: `${vaccine.name} vaccination`,
  })
  return `upi://pay?${params.toString()}`
}

export function normalizeRegistration(body: Record<string, unknown>): Registration {
  const vaccine = getVaccine(String(body.vaccineId || "").trim())

  return {
    registrationId: createRegistrationId(),
    createdAt: new Date().toISOString(),
    fullName: String(body.fullName || "").trim(),
    age: Number(body.age || 0),
    gender: String(body.gender || "").trim(),
    phone: String(body.phone || "").trim(),
    email: String(body.email || "").trim(),
    address: String(body.address || "").trim(),
    batchName: String(body.batchName || body.batchNumber || "").trim(),
    vaccineId: vaccine ? vaccine.id : "",
    vaccine: vaccine ? vaccine.name : "",
    dose: String(body.dose || "").trim(),
    paymentAmount: vaccine ? vaccine.price : 0,
    paymentMode: "UPI",
    upiId: PAYMENT_UPI_ID,
    paymentReference: String(body.paymentReference || "").trim(),
    paymentStatus: "Pending Admin Confirmation",
    paymentConfirmedAt: "",
    paymentScreenshot: "",
    verificationStatus: "Pending",
    verifiedAt: "",
  }
}

export function validateRegistration(record: Registration): string | null {
  const required: (keyof Registration)[] = [
    "fullName",
    "age",
    "gender",
    "phone",
    "batchName",
    "vaccine",
    "dose",
    "paymentStatus",
  ]

  for (const key of required) {
    const value = record[key]
    if (value === "" || value === 0 || (typeof value === "number" && Number.isNaN(value))) {
      return `${key} is required.`
    }
  }
  return null
}

export function savePaymentScreenshot(record: Registration, dataUrl: unknown): void {
  if (!dataUrl) return
  const match = String(dataUrl).match(
    /^data:(image\/png|image\/jpe?g|image\/webp);base64,(.+)$/,
  )
  if (!match) return
  // Store the data URL directly on the record (no filesystem on serverless).
  record.paymentScreenshot = String(dataUrl)
}

export function readPaymentScreenshot(record: Registration): string {
  return record.paymentScreenshot || ""
}

export function publicRecord(record: Registration): PublicRegistration {
  return {
    registrationId: record.registrationId,
    createdAt: record.createdAt,
    fullName: record.fullName,
    age: record.age,
    gender: record.gender,
    phone: record.phone,
    vaccine: record.vaccine,
    batchName: record.batchName,
    dose: record.dose,
    paymentAmount: record.paymentAmount,
    paymentMode: record.paymentMode,
    paymentStatus: record.paymentStatus,
    paymentConfirmedAt: record.paymentConfirmedAt,
    verificationStatus: record.verificationStatus,
    verifiedAt: record.verifiedAt,
  }
}

export function adminRecord(record: Registration): AdminRegistration {
  return {
    ...publicRecord(record),
    email: record.email,
    address: record.address,
    upiId: record.upiId,
    paymentReference: record.paymentReference,
    paymentScreenshotDataUrl: readPaymentScreenshot(record),
  }
}
