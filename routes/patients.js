const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');

// ✅ 建立病患 Schema（與你資料庫結構一致）
const patientSchema = new mongoose.Schema({
  patient_id: { type: Number, required: true, unique: true },
  name: { type: String, required: true },
  age: { type: Number, required: true },
  gender: { type: String, required: true },
  diagnosis: { type: String, required: true },
  apache_score: { type: Number, required: true },
  admission_date: { type: Date, required: true },
  discharge_date: { type: Date, required: true },
  attending_doctor_id: { type: String, required: true },
  bed_id: { type: Number, required: true }
}, { collection: 'patients' });// 👈 明確指定 collection 名稱

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

/**
 * ✅ POST /api/patients
 * 新增病患資料
 */
router.post("/", async (req, res) => {
  try {
    const data = req.body;

    // 基本驗證
    const requiredFields = [
      "patient_id", "name", "age", "gender", "diagnosis",
      "apache_score", "admission_date", "discharge_date",
      "attending_doctor_id", "bed_id"
    ];
    for (const field of requiredFields) {
      if (!data[field]) {
        return res.status(400).json({ message: `欄位缺少：${field}` });
      }
    }

    const newPatient = new Patient(data);
    await newPatient.save();

    console.log("✅ 病患新增成功:", newPatient);
    res.status(201).json({ message: "新增成功", data: newPatient });

  } catch (err) {
    console.error("❌ 新增病患時錯誤:", err);
    if (err.code === 11000) {
      res.status(409).json({ message: "病歷號重複，請檢查 patient_id" });
    } else {
      res.status(500).json({ message: "伺服器錯誤", error: err.message });
    }
  }
});

module.exports = router;
