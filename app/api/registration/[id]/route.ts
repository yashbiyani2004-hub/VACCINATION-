import { NextResponse } from "next/server"
import { publicRecord, readRegistrations } from "@/lib/store"

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params
  const record = readRegistrations().find((item) => item.registrationId === id)
  if (!record) {
    return NextResponse.json({ error: "Registration not found." }, { status: 404 })
  }
  return NextResponse.json(publicRecord(record))
}
