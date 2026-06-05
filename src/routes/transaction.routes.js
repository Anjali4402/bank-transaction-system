const express = require("express");
const { authMiddleware } = require("../middleware/auth.middleware");
const { CreateTransaction } = require("../controllers/transaction.controller");
const creditController = require("../controllers/credit.controller");
const debitController = require("../controllers/debit.controller");

const router = express.Router();

router.post("/", authMiddleware, CreateTransaction);
router.post("/credit", authMiddleware, creditController);
router.post("/debit", authMiddleware, debitController);

module.exports = router;
