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

async function viewAccountController(req, res) {
  const data = req.user;

  try {
    const userAccounts = await accountModel.find({
      user: data?._id,
    });

    if (!userAccounts) {
      return res.status(400).json({
        message: "there is some issue",
      });
    }

    return res.status(200).json({
      success: true,
      data: userAccounts,
      message: "User Accounts fetch successfully",
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
}

async function viewAccountBalanceController(req, res) {
  const accountId = req.params.accountId;

  if (!accountId) {
    return res.status(400).json({
      success: false,
      message: "Account Id is not provided",
    });
  }

  try {
    const userData = await accountModel.findOne({ _id: accountId });

    if (!userData) {
      return res.status(404).json({
        success: false,
        message: "Account not found",
      });
    }

    const balance = await userData.getBalance();

    return res.status(200).json({
      success: true,
      message: "Balance fetch successfully!",
      data: {
        accountId: accountId,
        balance: balance,
      },
    });
  } catch (error) {
    // console.error("view balance Error:", error);

    return res.status(500).json({
      success: false,
      message: "Internal server error",
      error: error,
    });
  }
}

module.exports = {
  createAccountController,
  viewAccountController,
  viewAccountBalanceController,
};
