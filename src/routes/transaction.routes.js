const express = require("express");
const { authMiddleware } = require("../middleware/auth.middleware");
const { CreateTransaction } = require("../controllers/transaction.controller");
const creditController = require("../controllers/credit.controller");

const router = express.Router();

router.post("/", authMiddleware, CreateTransaction);
router.post("/credit", authMiddleware, creditController);

module.exports = router;
