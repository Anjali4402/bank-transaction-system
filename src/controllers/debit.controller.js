const { accountModel } = require("../model/account.model");
const ledgerModel = require("../model/ledger.model");
const transactionModel = require("../model/transaction.model");
const mongoose = require("mongoose");

async function debitController(req, res) {
  // STEP 1 - Check request validation.
  const { fromAccount, amount, idempotencyKey } = req.body;

  if (!fromAccount || !amount || !idempotencyKey) {
    return res.status(400).json({
      success: false,
      message: "fromAccount, amount and idempotencyKey are required!",
    });
  }

  // STEP 2- Validate user.
  const fromAccountUser = await accountModel.findById(fromAccount);

  if (!fromAccountUser) {
    return res.status(402).json({
      success: false,
      message: "Account not exist!",
    });
  }

  // STEP 3 - validate requesting user and from Account user should be same.
  //   const requestingUserId = req.user._id;
  // const creditUserId = toAccountUser?.user;
  if (!fromAccountUser.user.equals(req.user._id)) {
    return res.status(403).json({
      success: false,
      message: "Invalid Account Access! permission denied",
    });
  }

  // STEP 4- Validate active account.
  if (fromAccountUser.status !== "ACTIVE") {
    return res.status(403).json({
      success: false,
      massage: "Account is not active.",
    });
  }

  // STEP 5 - Validate idempotencyKey

  const existingTransaction = await transactionModel.findOne({
    idempotencyKey: idempotencyKey,
  });

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

  // STEP 6 - Check balance.
  const balance = await fromAccountUser.getBalance();
  console.log("Balance is");

  if (balance < amount) {
    return res.status(403).json({
      success: false,
      message: `Insufficient balance. Current balance is ${balance}. Requested amount is ${amount}`,
    });
  }

  // STEP 7 - Validate system user.
  const systemUser = await accountModel.findOne().select("systemUser");

  if (!systemUser) {
    return res.status(403).json({
      success: false,
      message: "System user is not available.",
    });
  }

  // STEP 8 - Transaction Started.
  const session = await mongoose.startSession();
  session.startTransaction();

  const transaction = new transactionModel({
    fromAccount,
    toAccount: systemUser._id,
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
        account: system._id,
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
}

module.exports = debitController;
