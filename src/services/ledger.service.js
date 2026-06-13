// services/ledger.service.js

const ledgerModel = require("../model/ledger.model");

async function createLedger({ account, amount, transactionId, type, session }) {
  return ledgerModel.create(
    [
      {
        account,
        amount,
        transaction: transactionId,
        type,
      },
    ],
    { session },
  );
}

module.exports = {
  createLedger,
};
