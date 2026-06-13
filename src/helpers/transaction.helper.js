const transactionModel = require("../model/transaction.model");

async function validateIdempotency(idempotencyKey) {
  const existingTransaction = await transactionModel.findOne({
    idempotencyKey,
  });

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

  return {
    transaction: existingTransaction,
    response: statusMessages[existingTransaction.status],
  };
}

module.exports = {
  validateIdempotency,
};
