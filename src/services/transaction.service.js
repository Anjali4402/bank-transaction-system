const transactionModel = require("../model/transaction.model");
const { createLedger } = require("./ledger.service");

async function creditMoney({
  fromAccount,
  toAccount,
  amount,
  idempotencyKey,
  session,
}) {
  const transaction = new transactionModel({
    fromAccount,
    toAccount,
    amount,
    idempotencyKey,
  });

  // await transaction.save({ session });

  await createLedger({
    account: fromAccount,
    amount,
    transactionId: transaction._id,
    type: "DEBIT",
    session,
  });

  await createLedger({
    account: toAccount,
    amount,
    transactionId: transaction._id,
    type: "CREDIT",
    session,
  });

  transaction.status = "COMPLETED";

  await transaction.save({ session });

  return transaction;
}

module.exports = {
  creditMoney,
};
