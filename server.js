require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const bcrypt = require('bcrypt');
const cors = require('cors');
const patientsRoute = require('./routes/patients');

const app = express();
app.use(cors());
app.use(express.json());

console.log("🔍 Using MongoDB URI:", process.env.MONGODB_URI);

mongoose.connect(process.env.MONGODB_URI)
  .then(() => console.log('✅ MongoDB connected'))
  .catch(err => console.error('❌ MongoDB connection error:', err));

const userSchema = new mongoose.Schema({
  username: String,
  name: String,
  password_hash: String
});
const User = mongoose.model('User', userSchema);

app.post("/api/login", async (req, res) => {
  const { username, password } = req.body;

  try {
    const user = await User.findOne({ username });

    if (!user) {
      return res.status(401).json({ success: false, message: "帳號錯誤" });
    }

    const valid = await bcrypt.compare(password, user.password_hash);

    if (!valid) {
      return res.status(401).json({ success: false, message: "密碼錯誤" });
    }

    res.json({ success: true, username: user.username, name: user.name });

  } catch (err) {
    console.error("登入錯誤:", err);
    res.status(500).json({ success: false, message: "伺服器錯誤" });
  }
});

app.use('/api/patients', patientsRoute);

app.get("/", (req, res) => {
  res.send("✅ ICU API server is running");
});

const PORT = process.env.PORT || 8080;
app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));
