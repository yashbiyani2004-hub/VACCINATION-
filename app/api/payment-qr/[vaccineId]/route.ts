import { NextResponse } from "next/server"
import QRCode from "qrcode"
import { createUpiUri, getVaccine } from "@/lib/store"

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ vaccineId: string }> },
) {
  const { vaccineId } = await params
  const vaccine = getVaccine(vaccineId)
  if (!vaccine) {
    return NextResponse.json({ error: "Vaccine not found." }, { status: 404 })
  }

  const qrDataUrl = await QRCode.toDataURL(createUpiUri(vaccine), {
    width: 320,
    margin: 2,
    color: { dark: "#0f172a", light: "#ffffff" },
  })
  return NextResponse.json({ qrDataUrl, vaccine })
}
