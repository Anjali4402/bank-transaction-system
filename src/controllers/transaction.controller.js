const mongoose = require("mongoose");
const { accountModel } = require("../model/account.model");
const transactionModel = require("../model/transaction.model");
const ledgerModel = require("../model/ledger.model");

/**
 *
 * - Create a new transaction
 * THE 10-STEP TRANSFER FLOW :
 *   1. Validate request.
 *   2. Validate idempotency key.
 *   3. Check account status.
 *   4. Derive sender balance from ledger.
 *   5. Create transaction (PENDING).
 *   6. Create DEBIT ledger entry.
 *   7. Create CREDIT ledger entry.
 *   8. Mark transaction COMPLETED.
 *   9. Commit MongoDB session.
 *   10. Send email notification.
 *
 */
async function CreateTransaction(req, res) {
  const { fromAccount, toAccount, amount, idempotencyKey } = req.body;
  // * STEP 1 - Validate request.
  if (
    !fromAccount ||
    !toAccount ||
    typeof amount !== "number" ||
    amount <= 0 ||
    !idempotencyKey
  ) {
    return res.status(400).json({
      success: false,
      message: "FromAccount, ToAccount, Amount and idempotencyKey are required",
    });
  }

  if (fromAccount === toAccount) {
    return res.status(400).json({
      success: false,
      message: "Cannot transfer to same account",
    });
  }

  try {
    // const fromAccountUser = await accountModel.findById(fromAccount);
    // const toAccountUser = await accountModel.findById(toAccount);
    const [fromAccountUser, toAccountUser] = await Promise.all([
      accountModel.findById(fromAccount),
      accountModel.findById(toAccount),
    ]);

    if (!fromAccountUser || !toAccountUser) {
      return res.status(400).json({
        success: false,
        message: "Invalid from account or to account",
      });
    }

    // * STEP 2 - Validate idempotency key.
    const isIdempotencyKey = await transactionModel.findOne({
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

    // * STEP 3 - Check account status.

    if (
      fromAccountUser.status !== "ACTIVE" ||
      toAccountUser.status !== "ACTIVE"
    ) {
      return res.status(403).json({
        success: false,
        message: "Account is not active.",
      });
    }

    // * STEP 4 - Derive sender balance from ledger.

    // check if sender user have not enough balance.
    const balance = await fromAccountUser.getBalance();

    // if balance is less then the sending amount.
    if (balance < amount) {
      return res.status(403).json({
        success: false,
        message: `Insufficient balance. Current balance is ${balance}. Requested amount is ${amount}`,
      });
    }

    // STEP 5 - Create transaction (PENDING)
    const session = await mongoose.startSession();
    session.startTransaction();

    const transaction = new transactionModel({
      fromAccount,
      toAccount,
      status: "PENDING",
      amount,
      idempotencyKey,
    });

    const debitLedgerEntry = await ledgerModel.create(
      [
        {
          account: fromAccount,
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

module.exports = {
  CreateTransaction,
};
