const express = require("express");
const { authMiddleware } = require("../middleware/auth.middleware");
const { useAccountController } = require("../controllers/account.controller");

const router = express.Router();

router.post("/", authMiddleware, useAccountController);

module.exports = router;
