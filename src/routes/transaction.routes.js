const express = require("express");
const { authMiddleware } = require("../middleware/auth.middleware");
const { CreateTransaction } = require("../controllers/transaction.controller");

const router = express.Router();

router.post("/", authMiddleware, CreateTransaction);

module.exports = router;
