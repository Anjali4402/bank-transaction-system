const express = require("express");
const { authMiddleware } = require("../middleware/auth.middleware");
const {
  createAccountController,
  viewAccountController,
  viewAccountBalanceController,
} = require("../controllers/account.controller");
const accountMiddleware = require("../middleware/account.middleware");

const router = express.Router();

router.post("/", authMiddleware, createAccountController);
router.get("/", accountMiddleware, viewAccountController);
router.get(
  "/balance/:accountId",
  accountMiddleware,
  viewAccountBalanceController,
);

module.exports = router;
