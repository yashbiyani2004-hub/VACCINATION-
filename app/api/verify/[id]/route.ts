import { NextResponse } from "next/server"
import { publicRecord, readRegistrations } from "@/lib/store"

export async function POST(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params
  const records = readRegistrations()
  const index = records.findIndex((item) => item.registrationId === id)
  if (index === -1) {
    return NextResponse.json({ error: "Registration not found." }, { status: 404 })
  }

  records[index].verificationStatus = "Verified"
  records[index].verifiedAt = new Date().toISOString()
  return NextResponse.json(publicRecord(records[index]))
}
