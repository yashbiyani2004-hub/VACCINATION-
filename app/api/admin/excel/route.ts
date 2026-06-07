import { NextResponse } from "next/server"
import { ADMIN_PASSWORD, readRegistrations } from "@/lib/store"
import { buildExcelBuffer } from "@/lib/excel"

export async function POST(req: Request) {
  const body = await req.json()
  if (body.password !== ADMIN_PASSWORD) {
    return NextResponse.json({ error: "Invalid admin password." }, { status: 403 })
  }

  const buffer = await buildExcelBuffer(readRegistrations())
  return new NextResponse(new Uint8Array(buffer), {
    status: 200,
    headers: {
      "Content-Type":
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "Content-Disposition":
        'attachment; filename="vaccination_registrations.xlsx"',
    },
  })
}
