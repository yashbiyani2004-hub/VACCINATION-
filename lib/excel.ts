import ExcelJS from "exceljs"
import { HEADERS } from "./store"
import type { Registration } from "./types"

function toExcelRow(record: Registration) {
  return [
    record.registrationId,
    record.createdAt,
    record.fullName,
    record.age,
    record.gender,
    record.phone,
    record.email,
    record.address,
    record.batchName,
    record.vaccine,
    record.dose,
    record.paymentAmount,
    record.paymentMode,
    record.upiId || "",
    record.paymentReference,
    record.paymentScreenshot ? "uploaded" : "",
    record.paymentStatus,
    record.paymentConfirmedAt || "",
    record.verificationStatus,
    record.verifiedAt,
  ]
}

export async function buildExcelBuffer(records: Registration[]): Promise<Buffer> {
  const workbook = new ExcelJS.Workbook()
  workbook.creator = "Vaccination Drive Registration Software"
  workbook.created = new Date()
  const sheet = workbook.addWorksheet("Registrations", {
    views: [{ state: "frozen", ySplit: 1 }],
  })

  sheet.addRow(HEADERS)
  records.forEach((record) => sheet.addRow(toExcelRow(record)))
  sheet.getRow(1).font = { bold: true, color: { argb: "FFFFFFFF" } }
  sheet.getRow(1).fill = {
    type: "pattern",
    pattern: "solid",
    fgColor: { argb: "FF0F766E" },
  }
  sheet.getRow(1).alignment = { vertical: "middle", horizontal: "center" }
  sheet.columns = [
    { width: 22 },
    { width: 24 },
    { width: 24 },
    { width: 8 },
    { width: 12 },
    { width: 16 },
    { width: 26 },
    { width: 36 },
    { width: 18 },
    { width: 18 },
    { width: 16 },
    { width: 18 },
    { width: 16 },
    { width: 16 },
    { width: 24 },
    { width: 22 },
    { width: 24 },
    { width: 18 },
    { width: 24 },
    { width: 18 },
  ]
  sheet.autoFilter = { from: "A1", to: "T1" }
  sheet.eachRow((row) => {
    row.eachCell((cell) => {
      cell.border = {
        top: { style: "thin", color: { argb: "FFE5E7EB" } },
        left: { style: "thin", color: { argb: "FFE5E7EB" } },
        bottom: { style: "thin", color: { argb: "FFE5E7EB" } },
        right: { style: "thin", color: { argb: "FFE5E7EB" } },
      }
      cell.alignment = { vertical: "top", wrapText: true }
    })
  })

  const arrayBuffer = await workbook.xlsx.writeBuffer()
  return Buffer.from(arrayBuffer)
}
