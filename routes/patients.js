const express = require('express');
const router = express.Router();

router.get('/', (req, res) => {
  res.json([{ name: "李敬", bedID: 101 }]);
});

module.exports = router;
