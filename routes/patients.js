// routes/patients.js
const express = require("express");
const router = express.Router();
const mongoose = require("mongoose");

// ✅ 定義 Patient Schema（根據 MongoDB Atlas 的資料結構）
const patientSchema = new mongoose.Schema({
  name: String,
  patient_id: String,
  age: Number,
  gender: String,
  bed_id: Number,
  diagnosis: String,
  attending_doctor_id: String,
  admission_date: Date,
  discharge_date: Date,
  apache_score: Number
});

const Patient = mongoose.model("Patient", patientSchema);

// ✅ GET /api/patients — 支援全部查詢 / 依醫師查詢（query: ?doctorID=D001）
router.get("/", async (req, res) => {
  try {
    const doctorID = req.query.doctorID;
    const query = doctorID ? { attending_doctor_id: doctorID } : {};
    const patients = await Patient.find(query);
    res.json(patients);
  } catch (err) {
    console.error("❌ 查詢病患錯誤：", err);
    res.status(500).json({ message: "伺服器錯誤" });
  }
});

module.exports = router;
