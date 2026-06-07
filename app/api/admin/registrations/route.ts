import { NextResponse } from "next/server"
import { ADMIN_PASSWORD, adminRecord, readRegistrations } from "@/lib/store"

export async function POST(req: Request) {
  const body = await req.json()
  if (body.password !== ADMIN_PASSWORD) {
    return NextResponse.json({ error: "Invalid admin password." }, { status: 403 })
  }
  return NextResponse.json(readRegistrations().map(adminRecord).reverse())
}
