require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const bcrypt = require('bcrypt'); // ✅ 用於密碼比對
const cors = require('cors');
const patientsRoute = require('./routes/patients');
app.use('/api/patients', patientsRoute);

const uri = process.env.MONGODB_URI;

const app = express();
app.use(cors());
app.use(express.json());

console.log("🔍 Using MongoDB URI:", process.env.MONGODB_URI?.slice(0, 40));  //列印目前連線字串前幾碼（Debug 用）

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
  password_hash: { type: String, required: true } // 雜湊後密碼
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

// ✅ 新增三個帳號
app.get('/add-test-users', async (req, res) => {
  try {
    const testUsers = [
      { username: 'D001', password: 'sharonD001', name: 'Doctor 001' },
      { username: 'D002', password: 'sharonD002', name: 'Doctor 002' },
      { username: 'D003', password: 'sharonD003', name: 'Doctor 003' }
    ];

    const results = [];

    for (const { username, password, name } of testUsers) {
      const exists = await User.findOne({ username });
      if (exists) {
        results.push(`⚠️ 使用者 ${username} 已存在`);
        continue;
      }

      const password_hash = await bcrypt.hash(password, 10);
      await User.create({ username, password_hash, name });
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
 * 📦 病患相關 API
 */
app.use('/api/patients', patientsRoute);

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