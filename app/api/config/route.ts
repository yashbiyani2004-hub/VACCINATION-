import { NextResponse } from "next/server"
import { VACCINES, PAYMENT_UPI_ID, PAYMENT_PAYEE_NAME } from "@/lib/store"

export async function GET() {
  return NextResponse.json({
    vaccines: VACCINES,
    payment: {
      mode: "UPI",
      upiId: PAYMENT_UPI_ID,
      payeeName: PAYMENT_PAYEE_NAME,
      referenceQrImage: "/assets/upi-payment-qr.jpeg",
    },
  })
}
