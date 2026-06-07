const express = require("express");
const fs = require("fs");
const path = require("path");
const crypto = require("crypto");
const ExcelJS = require("exceljs");
const QRCode = require("qrcode");

const app = express();
const PORT = process.env.PORT || 3000;
const DATA_DIR = process.env.DATA_DIR ? path.resolve(process.env.DATA_DIR) : path.join(__dirname, "data");
const PUBLIC_DIR = path.join(__dirname, "public");
const DB_FILE = path.join(DATA_DIR, "registrations.json");
const EXCEL_FILE = path.join(DATA_DIR, "vaccination_registrations.xlsx");
const SCREENSHOT_DIR = path.join(DATA_DIR, "payment-screenshots");
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || "ap09cq2770";
const PAYMENT_UPI_ID = process.env.PAYMENT_UPI_ID || "9325339930@sbi";
const PAYMENT_PAYEE_NAME = process.env.PAYMENT_PAYEE_NAME || "Yash Biyani";
const VACCINES = [
  { id: "ceravac-hpv", name: "ceravac-HPV", price: 1300 },
  { id: "revac-b-hbv", name: "Revac-B+ -HBV vaccine", price: 75 }
];

const HEADERS = [
  "Registration ID",
  "Created At",
  "Full Name",
  "Age",
  "Gender",
  "Phone",
  "Email",
  "Address",
  "Batch Name",
  "Vaccine",
  "Dose",
  "Payment Amount",
  "Payment Mode",
  "UPI ID",
  "Payment Reference",
  "Payment Screenshot",
  "Payment Status",
  "Payment Confirmed At",
  "Verification Status",
  "Verified At"
];

fs.mkdirSync(DATA_DIR, { recursive: true });
fs.mkdirSync(SCREENSHOT_DIR, { recursive: true });

app.set("trust proxy", 1);
app.use(express.json({ limit: "8mb" }));
app.use(express.static(PUBLIC_DIR));

function readRegistrations() {
  if (!fs.existsSync(DB_FILE)) return [];
  return JSON.parse(fs.readFileSync(DB_FILE, "utf8"));
}

function writeRegistrations(records) {
  fs.writeFileSync(DB_FILE, JSON.stringify(records, null, 2));
}

function createRegistrationId() {
  const stamp = new Date().toISOString().slice(0, 10).replace(/-/g, "");
  const token = crypto.randomBytes(3).toString("hex").toUpperCase();
  return `VAC-${stamp}-${token}`;
}

function getVaccine(vaccineId) {
  return VACCINES.find((vaccine) => vaccine.id === vaccineId);
}

function createUpiUri(vaccine) {
  const params = new URLSearchParams({
    pa: PAYMENT_UPI_ID,
    pn: PAYMENT_PAYEE_NAME,
    am: String(vaccine.price),
    cu: "INR",
    tn: `${vaccine.name} vaccination`
  });
  return `upi://pay?${params.toString()}`;
}

function confirmationUrl(req, registrationId) {
  return `${req.protocol}://${req.get("host")}/verify.html?id=${encodeURIComponent(registrationId)}`;
}

function savePaymentScreenshot(record, dataUrl) {
  if (!dataUrl) return;

  const match = String(dataUrl).match(/^data:(image\/png|image\/jpe?g|image\/webp);base64,(.+)$/);
  if (!match) return;

  const extByMime = {
    "image/png": "png",
    "image/jpeg": "jpg",
    "image/jpg": "jpg",
    "image/webp": "webp"
  };
  const filename = `${record.registrationId}.${extByMime[match[1]] || "png"}`;
  fs.writeFileSync(path.join(SCREENSHOT_DIR, filename), Buffer.from(match[2], "base64"));
  record.paymentScreenshot = filename;
}

function readPaymentScreenshot(record) {
  if (!record.paymentScreenshot) return "";
  const screenshotPath = path.join(SCREENSHOT_DIR, record.paymentScreenshot);
  if (!fs.existsSync(screenshotPath)) return "";
  const ext = path.extname(screenshotPath).slice(1).toLowerCase();
  const mime = ext === "jpg" || ext === "jpeg" ? "image/jpeg" : `image/${ext}`;
  return `data:${mime};base64,${fs.readFileSync(screenshotPath).toString("base64")}`;
}

function normalizeRegistration(body) {
  const vaccine = getVaccine(String(body.vaccineId || "").trim());

  return {
    registrationId: createRegistrationId(),
    createdAt: new Date().toISOString(),
    fullName: String(body.fullName || "").trim(),
    age: Number(body.age || 0),
    gender: String(body.gender || "").trim(),
    phone: String(body.phone || "").trim(),
    email: String(body.email || "").trim(),
    address: String(body.address || "").trim(),
    batchName: String(body.batchName || body.batchNumber || "").trim(),
    vaccineId: vaccine ? vaccine.id : "",
    vaccine: vaccine ? vaccine.name : "",
    dose: String(body.dose || "").trim(),
    paymentAmount: vaccine ? vaccine.price : 0,
    paymentMode: "UPI",
    upiId: PAYMENT_UPI_ID,
    paymentReference: String(body.paymentReference || "").trim(),
    paymentStatus: "Pending Admin Confirmation",
    paymentConfirmedAt: "",
    paymentScreenshot: "",
    verificationStatus: "Pending",
    verifiedAt: ""
  };
}

function validateRegistration(record) {
  const required = [
    "fullName",
    "age",
    "gender",
    "phone",
    "batchName",
    "vaccine",
    "dose",
    "paymentStatus"
  ];

  for (const key of required) {
    if (record[key] === "" || record[key] === 0 || Number.isNaN(record[key])) {
      return `${key} is required.`;
    }
  }
  return null;
}

function toExcelRow(record) {
  return [
    record.registrationId,
    record.createdAt,
    record.fullName,
    record.age,
    record.gender,
    record.phone,
    record.email,
    record.address,
    record.batchName || record.batchNumber || "",
    record.vaccine,
    record.dose,
    record.paymentAmount,
    record.paymentMode,
    record.upiId || "",
    record.paymentReference,
    record.paymentScreenshot || "",
    record.paymentStatus,
    record.paymentConfirmedAt || "",
    record.verificationStatus,
    record.verifiedAt
  ];
}

async function saveExcel(records) {
  const workbook = new ExcelJS.Workbook();
  workbook.creator = "Vaccination Drive Registration Software";
  workbook.created = new Date();
  const sheet = workbook.addWorksheet("Registrations", {
    views: [{ state: "frozen", ySplit: 1 }]
  });

  sheet.addRow(HEADERS);
  records.forEach((record) => sheet.addRow(toExcelRow(record)));
  sheet.getRow(1).font = { bold: true, color: { argb: "FFFFFFFF" } };
  sheet.getRow(1).fill = {
    type: "pattern",
    pattern: "solid",
    fgColor: { argb: "FF0F766E" }
  };
  sheet.getRow(1).alignment = { vertical: "middle", horizontal: "center" };
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
    { width: 16 },
    { width: 18 }
  ];
  sheet.autoFilter = { from: "A1", to: "T1" };
  sheet.eachRow((row) => {
    row.eachCell((cell) => {
      cell.border = {
        top: { style: "thin", color: { argb: "FFE5E7EB" } },
        left: { style: "thin", color: { argb: "FFE5E7EB" } },
        bottom: { style: "thin", color: { argb: "FFE5E7EB" } },
        right: { style: "thin", color: { argb: "FFE5E7EB" } }
      };
      cell.alignment = { vertical: "top", wrapText: true };
    });
  });

  await workbook.xlsx.writeFile(EXCEL_FILE);
}

function publicRecord(record) {
  return {
    registrationId: record.registrationId,
    createdAt: record.createdAt,
    fullName: record.fullName,
    age: record.age,
    gender: record.gender,
    phone: record.phone,
    vaccine: record.vaccine,
    batchName: record.batchName || record.batchNumber || "",
    dose: record.dose,
    paymentAmount: record.paymentAmount,
    paymentMode: record.paymentMode,
    paymentStatus: record.paymentStatus,
    paymentConfirmedAt: record.paymentConfirmedAt,
    verificationStatus: record.verificationStatus,
    verifiedAt: record.verifiedAt
  };
}

function adminRecord(record) {
  return {
    ...publicRecord(record),
    email: record.email,
    address: record.address,
    upiId: record.upiId,
    paymentReference: record.paymentReference,
    paymentScreenshotDataUrl: readPaymentScreenshot(record)
  };
}

app.get("/api/registrations", (req, res) => {
  res.json(readRegistrations().map(publicRecord).reverse());
});

app.get("/api/config", (req, res) => {
  res.json({
    vaccines: VACCINES,
    payment: {
      mode: "UPI",
      upiId: PAYMENT_UPI_ID,
      payeeName: PAYMENT_PAYEE_NAME,
      referenceQrImage: "/assets/upi-payment-qr.jpeg"
    }
  });
});

app.get("/api/payment-qr/:vaccineId", async (req, res) => {
  const vaccine = getVaccine(req.params.vaccineId);
  if (!vaccine) return res.status(404).json({ error: "Vaccine not found." });

  const qrDataUrl = await QRCode.toDataURL(createUpiUri(vaccine), {
    width: 320,
    margin: 2,
    color: { dark: "#0f172a", light: "#ffffff" }
  });
  res.json({ qrDataUrl, vaccine });
});

app.post("/api/register", async (req, res) => {
  const records = readRegistrations();
  const registration = normalizeRegistration(req.body);
  const validationError = validateRegistration(registration);
  if (validationError) return res.status(400).json({ error: validationError });

  savePaymentScreenshot(registration, req.body.paymentScreenshot);
  records.push(registration);
  writeRegistrations(records);
  await saveExcel(records);

  const vaccine = getVaccine(registration.vaccineId);
  const paymentQrDataUrl = await QRCode.toDataURL(createUpiUri(vaccine), {
    width: 320,
    margin: 2,
    color: { dark: "#0f172a", light: "#ffffff" }
  });

  res.status(201).json({
    registration: publicRecord(registration),
    paymentQrDataUrl
  });
});

app.get("/api/registration/:id", (req, res) => {
  const record = readRegistrations().find((item) => item.registrationId === req.params.id);
  if (!record) return res.status(404).json({ error: "Registration not found." });
  res.json(publicRecord(record));
});

app.post("/api/verify/:id", async (req, res) => {
  const records = readRegistrations();
  const index = records.findIndex((item) => item.registrationId === req.params.id);
  if (index === -1) return res.status(404).json({ error: "Registration not found." });

  records[index].verificationStatus = "Verified";
  records[index].verifiedAt = new Date().toISOString();
  writeRegistrations(records);
  await saveExcel(records);
  res.json(publicRecord(records[index]));
});

app.get("/download/excel", async (req, res) => {
  res.status(403).send("Use the admin page to download Excel.");
});

app.post("/api/admin/excel", async (req, res) => {
  if (req.body.password !== ADMIN_PASSWORD) {
    return res.status(403).json({ error: "Invalid admin password." });
  }

  await saveExcel(readRegistrations());
  res.download(EXCEL_FILE, "vaccination_registrations.xlsx");
});

app.post("/api/admin/registrations", (req, res) => {
  if (req.body.password !== ADMIN_PASSWORD) {
    return res.status(403).json({ error: "Invalid admin password." });
  }

  res.json(readRegistrations().map(adminRecord).reverse());
});

app.post("/api/admin/confirm-payment/:id", async (req, res) => {
  if (req.body.password !== ADMIN_PASSWORD) {
    return res.status(403).json({ error: "Invalid admin password." });
  }

  const records = readRegistrations();
  const index = records.findIndex((item) => item.registrationId === req.params.id);
  if (index === -1) return res.status(404).json({ error: "Registration not found." });

  records[index].paymentStatus = "Confirmed";
  records[index].paymentConfirmedAt = new Date().toISOString();
  writeRegistrations(records);
  await saveExcel(records);

  const url = confirmationUrl(req, records[index].registrationId);
  const confirmationQrDataUrl = await QRCode.toDataURL(url, {
    width: 320,
    margin: 2,
    color: { dark: "#0f172a", light: "#ffffff" }
  });
  const subject = encodeURIComponent("Vaccination registration confirmed");
  const body = encodeURIComponent(
    `Dear ${records[index].fullName},\n\nYour vaccination payment is confirmed.\nRegistration ID: ${records[index].registrationId}\nVaccine: ${records[index].vaccine}\nConfirmation QR link: ${url}\n\nPlease show this QR on the vaccination day.`
  );
  const mailtoUrl = `mailto:${encodeURIComponent(records[index].email || "")}?subject=${subject}&body=${body}`;

  res.json({
    registration: adminRecord(records[index]),
    confirmationUrl: url,
    confirmationQrDataUrl,
    mailtoUrl
  });
});

app.listen(PORT, () => {
  console.log(`Vaccination drive app running at http://localhost:${PORT}`);
});
