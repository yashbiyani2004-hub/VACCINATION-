import { SiteHeader } from "@/components/site-header"
import { RegistrationForm } from "@/components/registration-form"

export default function HomePage() {
  return (
    <main className="min-h-screen">
      <SiteHeader active="register" />
      <div className="mx-auto max-w-5xl px-4 py-8 sm:py-12">
        <div className="mb-8 max-w-2xl">
          <h1 className="text-balance text-3xl font-semibold tracking-tight text-foreground sm:text-4xl">
            Register for the Vaccination Drive
          </h1>
          <p className="mt-3 text-pretty leading-relaxed text-muted-foreground">
            Fill in your details, choose a vaccine, and complete the UPI payment.
            After registration you will get a unique registration ID. Show your
            confirmation QR on vaccination day once an admin confirms the payment.
          </p>
        </div>
        <RegistrationForm />
      </div>
    </main>
  )
}
