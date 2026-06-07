import { NextResponse } from "next/server"
import QRCode from "qrcode"
import { ADMIN_PASSWORD, adminRecord, readRegistrations } from "@/lib/store"

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params
  const body = await req.json()
  if (body.password !== ADMIN_PASSWORD) {
    return NextResponse.json({ error: "Invalid admin password." }, { status: 403 })
  }

  const records = readRegistrations()
  const index = records.findIndex((item) => item.registrationId === id)
  if (index === -1) {
    return NextResponse.json({ error: "Registration not found." }, { status: 404 })
  }

  records[index].paymentStatus = "Confirmed"
  records[index].paymentConfirmedAt = new Date().toISOString()

  const origin = new URL(req.url).origin
  const url = `${origin}/verify?id=${encodeURIComponent(records[index].registrationId)}`
  const confirmationQrDataUrl = await QRCode.toDataURL(url, {
    width: 320,
    margin: 2,
    color: { dark: "#0f172a", light: "#ffffff" },
  })

  const subject = encodeURIComponent("Vaccination registration confirmed")
  const emailBody = encodeURIComponent(
    `Dear ${records[index].fullName},\n\nYour vaccination payment is confirmed.\nRegistration ID: ${records[index].registrationId}\nVaccine: ${records[index].vaccine}\nConfirmation QR link: ${url}\n\nPlease show this QR on the vaccination day.`,
  )
  const mailtoUrl = `mailto:${encodeURIComponent(
    records[index].email || "",
  )}?subject=${subject}&body=${emailBody}`

  return NextResponse.json({
    registration: adminRecord(records[index]),
    confirmationUrl: url,
    confirmationQrDataUrl,
    mailtoUrl,
  })
}
