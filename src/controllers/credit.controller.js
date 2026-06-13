const { accountModel } = require("../model/account.model");
const mongoose = require("mongoose");
const transactionModel = require("../model/transaction.model");
const ledgerModel = require("../model/ledger.model");
const userModel = require("../model/auth.model");
const { validateIdempotency } = require("../helpers/transaction.helper");
const { creditMoney } = require("../services/transaction.service");

/**
 * Credit Amount.
 *
 * Steps -
 *  1. We get in payload - 1. To Account, amount, idempotency key.
 *  2. Find the system user he will send the money.
 *  3. Send money process.
 *  4. same transaction step.
 *
 *  5. send Email.
 *
 */
async function creditController(req, res, next) {
  const { toAccount, amount, idempotencyKey } = req.body;

  try {
    // Validate payload.
    if (
      !toAccount ||
      typeof amount !== "number" ||
      amount <= 0 ||
      !idempotencyKey
    ) {
      return res.status(400).json({
        success: false,
        message: "ToAccount, Amount, idempotencykey are required",
      });
    }

    // Validate is toAcccount exist.
    const toAccountUser = await accountModel.findById(toAccount);
    if (!toAccountUser) {
      return res.status(400).json({
        success: false,
        message: "Account is not exist.",
      });
    }

    const isSystemUser = await userModel
      .findOne({
        systemUser: true,
        _id: req.user._id,
      })
      .select("systemUser");

    // Validate is requesting user and account holder is same?
    if (!isSystemUser) {
      return res.status(403).json({
        success: false,
        message: "Invalid access. permission denied!",
      });
    }
    // * STEP 2 - Validate idempotency key.

    const transactionCheck = await validateIdempotency(idempotencyKey);

    if (transactionCheck) {
      return res.status(transactionCheck.response.code).json({
        success: transactionCheck.response.success,
        message: transactionCheck.response.message,
      });
    }

    const existingTransaction = await transactionModel.findOne({
      idempotencyKey,
    });

    // now 1. who is credit the money and who is requesting both are same.

    const systemUser = await accountModel
      .findOne({
        user: req.user._id,
      })
      .select("systemUser");

    // Transaction Started.
    const session = await mongoose.startSession();

    try {
      session.startTransaction();

      // all operations
      const transaction = await creditMoney({
        fromAccount: systemUser._id,
        toAccount,
        amount,
        idempotencyKey,
        session,
      });

      await transactionModel.findOneAndUpdate(
        { _id: transaction._id },
        { status: "COMPLETED" },
        { session },
      );

      await session.commitTransaction();

      return res.status(201).json({
        success: true,
        message: "Transaction completed successfully!",
      });
    } catch (error) {
      await session.abortTransaction();
      throw error;
    } finally {
      session.endSession();
    }
  } catch (error) {
    if (error.name === "CastError") {
      return res.status(400).json({
        success: false,
        message: "Invalid ID format",
      });
    }

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
      message: "Internal server error.",
    });
  }
}

module.exports = creditController;
