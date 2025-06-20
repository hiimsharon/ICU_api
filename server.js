require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const bcrypt = require('bcrypt'); // ✅ 用於密碼比對
const cors = require('cors');


const app = express();
const uri = process.env.MONGODB_URI;

const corsOptions = {
  origin: '*',
  //origin: ['https://icu-frontend.vercel.app'],
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  credentials: true,
  allowedHeaders: ['Content-Type']
};

app.use(cors(corsOptions));
app.options("*", cors(corsOptions));  // ✅ 預檢處理 ← 這是解決 Hoppscotch & 前端問題的關鍵
app.use(express.json());
/**
 * 📦 病患相關 API
 */
const patientsRoute = require('./routes/patients');
app.use('/api/patients', patientsRoute);

// 可選的首頁測試路由
app.get("/", (req, res) => {
  res.send("🏥 ICU API is running");
});

console.log("🔍 Using MongoDB URI:", process.env.MONGODB_URI);  //列印目前連線字串前幾碼（Debug 用）

mongoose.connect(process.env.MONGODB_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
  serverSelectionTimeoutMS: 30000, // 最多等待 30 秒
  socketTimeoutMS: 45000,          // Socket 最多等待 45 秒
})
  .then(() => console.log('✅ MongoDB connected'))
  .catch(err => console.error('❌ MongoDB connection error:', err));

/**
 * ✅ User 資料模型 - 密碼字段為加密後版本
 */
const userSchema = new mongoose.Schema({
  username: { type: String, required: true, unique: true },
  name: String,
  password_hash: { type: String, required: true }, // 雜湊後密碼
  role: { type: String, enum: ['admin', 'doctor'], required: true } // ✅ 新增角色欄位
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
      name: user.name, 
      role: user.role  // 新增這一行！
    });

  } catch (err) {
    console.error("🚨 登入錯誤:", err);
    return res.status(500).json({ success: false, message: "伺服器錯誤" });
  }
});

// ✅ 新增三個帳號
app.get('/add-test-users', async (req, res) => {
  try {
    const testUsers = [
      { username: 'D001', password: 'sharonD001', name: 'Doctor 001', role:'doctor' },
      { username: 'D002', password: 'sharonD002', name: 'Doctor 002', role:'doctor' },
      { username: 'D003', password: 'sharonD003', name: 'Doctor 003', role:'doctor' },
      { username: 'sharon', password: 'sharon12345', name: 'sharon', role:'admin' },
    ];

    const results = [];

    for (const { username, password, name, role } of testUsers) {
      const exists = await User.findOne({ username });
      if (exists) {
        results.push(`⚠️ 使用者 ${username} 已存在`);
        continue;
      }

      const password_hash = await bcrypt.hash(password, 10);
      await User.create({ username, password_hash, name, role });
      results.push(`✅ 建立使用者 ${username} 成功`);
    }

    res.send(results.join('<br>'));

  } catch (err) {
    console.error("🚨 建立測試帳號失敗:", err);
    res.status(500).send("❌ 建立失敗：" + err.message);
  }
});

/**
 * ✅ 新增測試用帳號 D004（密碼：sharonD004）
 */
app.get('/add-user-d004', async (req, res) => {
  try {
    const existing = await User.findOne({ username: 'D004' });
    if (existing) {
      return res.send('⚠️ 使用者 D004 已存在，無須重複建立');
    }

    const hash = await bcrypt.hash('sharonD004', 10);
    await User.create({ username: 'D004', password_hash: hash });
    res.send('✅ 使用者 D004 已建立（密碼為 sharonD004）');
  } catch (err) {
    res.status(500).send('❌ 建立失敗：' + err.message);
  }
});


/**
 * ✅ 測試 MongoDB 是否能查詢 User 集合
 */
app.get("/test-mongo", async (req, res) => {
  try {
    const count = await User.countDocuments();
    res.send(`✅ MongoDB connected. Total users: ${count}`);
  } catch (e) {
    res.status(500).send("❌ MongoDB error: " + e.message);
  }
});

// ✅ 修復 sharon 的角色欄位為 admin
app.get('/fix-sharon-role', async (req, res) => {
  try {
    const sharon = await User.findOne({ username: 'sharon' });
    if (!sharon) {
      return res.send("❌ 找不到使用者 sharon");
    }

    sharon.role = 'admin';
    await sharon.save();

    res.send("✅ 已補上 sharon 的角色欄位為 admin");
  } catch (err) {
    console.error("🚨 修復失敗:", err);
    res.status(500).send("❌ 修復失敗：" + err.message);
  }
});

// ✅ 重設 sharon 密碼為 sharon12345
app.get('/reset-sharon-password', async (req, res) => {
  try {
    const user = await User.findOne({ username: 'sharon' });
    if (!user) {
      return res.send("❌ 找不到使用者 sharon");
    }

    user.password_hash = await bcrypt.hash('sharon12345', 10);
    await user.save();

    res.send("✅ sharon 密碼已重設為 sharon12345");
  } catch (err) {
    console.error("🚨 密碼重設失敗:", err);
    res.status(500).send("❌ 密碼重設失敗：" + err.message);
  }
});


/**
 * 🔍 根路由檢查 API
 */
app.get("/", (req, res) => {
  res.send("✅ ICU API server is running");
});

const PORT = process.env.PORT || 8080;
app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));

// ✅ 測試用：顯示環境變數是否成功讀取
app.get("/api/env-test", (req, res) => {
  res.json({
    uri: process.env.MONGODB_URI ? "✅ 成功取得 MONGODB_URI" : "❌ 無法取得",
    preview: process.env.MONGODB_URI?.slice(0, 30) + "..."
  });
});
