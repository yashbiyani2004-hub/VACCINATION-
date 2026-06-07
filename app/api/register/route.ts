import { NextResponse } from "next/server"
import QRCode from "qrcode"
import {
  createUpiUri,
  getVaccine,
  normalizeRegistration,
  publicRecord,
  readRegistrations,
  savePaymentScreenshot,
  validateRegistration,
} from "@/lib/store"

export async function GET() {
  return NextResponse.json(readRegistrations().map(publicRecord).reverse())
}

export async function POST(req: Request) {
  const body = await req.json()
  const records = readRegistrations()
  const registration = normalizeRegistration(body)

  const validationError = validateRegistration(registration)
  if (validationError) {
    return NextResponse.json({ error: validationError }, { status: 400 })
  }

  savePaymentScreenshot(registration, body.paymentScreenshot)
  records.push(registration)

  const vaccine = getVaccine(registration.vaccineId)
  const paymentQrDataUrl = vaccine
    ? await QRCode.toDataURL(createUpiUri(vaccine), {
        width: 320,
        margin: 2,
        color: { dark: "#0f172a", light: "#ffffff" },
      })
    : ""

  return NextResponse.json(
    { registration: publicRecord(registration), paymentQrDataUrl },
    { status: 201 },
  )
}
