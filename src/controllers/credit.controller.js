const { accountModel } = require("../model/account.model");
const mongoose = require("mongoose");
const transactionModel = require("../model/transaction.model");
const ledgerModel = require("../model/ledger.model");

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

    // * STEP 2 - Validate idempotency key.
    const existingTransaction = await transactionModel.findOne({
      idempotencyKey,
    });

    // if idempotencyKey already available.

    // not just give sime error, handle all 4 status of it
    const statusMessages = {
      COMPLETED: {
        success: true,
        code: 200,
        message: "This transaction has already been processed successfully.",
      },
      PENDING: {
        success: true,
        code: 202,
        message: "This transaction is currently being processed.",
      },
      FAILED: {
        success: false,
        code: 409,
        message: "This transaction failed and was not completed.",
      },
      REVERSED: {
        success: false,
        code: 409,
        message: "This transaction was reversed.",
      },
    };

    if (existingTransaction) {
      const response = statusMessages[existingTransaction.status];

      return res.status(response.code).json({
        success: response.success,
        status: existingTransaction.status,
        message: response.message,
        transactionId: existingTransaction._id,
      });
    }

    // now 1. who is credit the money and who is requesting both are same.
    const requestingUserId = req.user._id;
    const creditUserId = toAccountUser?.user;

    if (!requestingUserId.equals(creditUserId)) {
      return res.status(403).json({
        success: false,
        message: "Invalid Account Access! permission denied",
      });
    }

    // find from account user
    // const systemUser = await accountModel
    // .findOne({
    // systemUser: true,
    // })
    // .select("+systemUser");
    const systemUser = await accountModel.findOne().select("systemUser");

    if (!systemUser) {
      return res.status(400).json({
        success: false,
        message: "System user is not available! Process failed.",
      });
    }

    // check and validate balance
    // const balance = await systemUser.getBalance();

    // if (balance < amount) {
    //   return res.status(403).json({
    //     success: false,
    //     message: `Insufficient balance. Current balance is ${balance}. Requested amount is ${amount}`,
    //   });
    // }

    // Transaction Started.
    const session = await mongoose.startSession();
    session.startTransaction();

    const transaction = new transactionModel({
      fromAccount: systemUser?._id,
      toAccount,
      amount,
      idempotencyKey,
    });

    const debitLedgerEntry = await ledgerModel.create(
      [
        {
          account: systemUser?._id,
          amount: amount,
          transaction: transaction._id,
          type: "DEBIT",
        },
      ],
      { session },
    );

    const creditLedgerEntry = await ledgerModel.create(
      [
        {
          account: toAccount,
          amount: amount,
          transaction: transaction._id,
          type: "CREDIT",
        },
      ],
      { session },
    );

    transaction.status = "COMPLETED";
    await transaction.save({ session });

    await session.commitTransaction();
    session.endSession();

    return res.status(201).json({
      success: true,
      message: "Transaction completed successfully!",
    });

    //
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
