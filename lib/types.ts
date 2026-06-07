export type Vaccine = {
  id: string
  name: string
  price: number
}

export type Registration = {
  registrationId: string
  createdAt: string
  fullName: string
  age: number
  gender: string
  phone: string
  email: string
  address: string
  batchName: string
  vaccineId: string
  vaccine: string
  dose: string
  paymentAmount: number
  paymentMode: string
  upiId: string
  paymentReference: string
  paymentStatus: string
  paymentConfirmedAt: string
  paymentScreenshot: string
  verificationStatus: string
  verifiedAt: string
}

export type PublicRegistration = {
  registrationId: string
  createdAt: string
  fullName: string
  age: number
  gender: string
  phone: string
  vaccine: string
  batchName: string
  dose: string
  paymentAmount: number
  paymentMode: string
  paymentStatus: string
  paymentConfirmedAt: string
  verificationStatus: string
  verifiedAt: string
}

export type AdminRegistration = PublicRegistration & {
  email: string
  address: string
  upiId: string
  paymentReference: string
  paymentScreenshotDataUrl: string
}
