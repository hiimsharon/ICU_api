const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');

// ✅ 建立病患 Schema（與你資料庫結構一致）
const patientSchema = new mongoose.Schema({
  patient_id: Number,
  name: String,
  age: Number,
  gender: String,
  diagnosis: String,
  apache_score: Number,
  admission_date: Date,
  discharge_date: Date,
  attending_doctor_id: String,
  bed_id: Number
}, { collection: 'patients' });  // 👈 明確指定 collection 名稱

const Patient = mongoose.model('Patient', patientSchema);

/**
 * ✅ GET /api/patients
 * 回傳所有病患資料
 */
router.get("/", async (req, res) => {
  try {
    const patients = await Patient.find({});
    console.log("📦 撈到病患筆數：", patients.length);
    res.json(patients);
  } catch (err) {
    console.error("❌ 無法取得病患資料：", err);
    res.status(500).json({ error: "Server Error" });
  }
});

module.exports = router;
