const { accountModel } = require("../model/account.model");

async function createAccountController(req, res) {
  try {
    const { currency } = req.body;

    const newAccount = await accountModel.create({
      user: req.user?._id,
      currency,
    });

    if (!newAccount) {
      return res.status(400).json({
        success: false,
        message: "Failed to Create Account!",
      });
    }

    return res.status(201).json({
      success: true,
      message: "Account successfully created!",
      data: newAccount,
    });
  } catch (error) {
    if (error.name === "ValidationError") {
      const messages = Object.values(error.errors).map((err) => err.message);
      return res.status(400).json({
        status: "failed",
        message: messages[0],
        errors: messages,
      });
    }

    return res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
}

module.exports = { createAccountController };
