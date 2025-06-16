require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const bcrypt = require('bcrypt'); // ✅ 用於密碼比對
const cors = require('cors');
const patientsRoute = require('./routes/patients');
const uri = process.env.MONGODB_URI;

const app = express();
app.use(cors());
app.use(express.json());

console.log("🔍 Using MongoDB URI:", process.env.MONGODB_URI);

const mongoose = require('mongoose');
mongoose.connect(process.env.MONGODB_URI)
  .then(() => console.log('✅ MongoDB connected'))
  .catch(err => console.error('❌ MongoDB connection error:', err));

/**
 * ✅ User 資料模型 - 密碼字段為加密後版本
 */
const userSchema = new mongoose.Schema({
  username: { type: String, required: true, unique: true },
  name: String,
  password: { type: String, required: true } // 雜湊後密碼
});
const User = mongoose.model('User', userSchema);

/**
 * ✅ 登入 API - 使用 bcrypt 驗證密碼
 */
app.post("/api/login", async (req, res) => {
  const { username, password } = req.body;

  try {
    const user = await User.findOne({ username });

    if (!user) {
      return res.status(401).json({ success: false, message: "帳號錯誤" });
    }

    // ✅ 使用 bcrypt 驗證使用者輸入的密碼
    const valid = await bcrypt.compare(password, user.password_hash);
    if (!valid) {
      return res.status(401).json({ success: false, message: "密碼錯誤" });
    }

    // ✅ 登入成功，回傳基本資料
    res.json({
      success: true,
      username: user.username,
      name: user.name
    });

  } catch (err) {
    console.error("🚨 登入錯誤:", err);
    res.status(500).json({ success: false, message: "伺服器錯誤" });
  }
});

/**
 * 📦 病患相關 API
 */
app.use('/api/patients', patientsRoute);

/**
 * 🔍 根路由檢查 API
 */
app.get("/", (req, res) => {
  res.send("✅ ICU API server is running");
});

const PORT = process.env.PORT || 8080;
app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));
