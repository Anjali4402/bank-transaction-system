const express = require("express");
const connectDB = require("./db/db");
require("dotenv").config();
const authRouter = require("./routes/auth.routes");
const accountRouter = require("./routes/account.routes");
const transactionRouter = require("./routes/transaction.routes");
const cookieParser = require("cookie-parser");
const { authMiddleware } = require("./middleware/auth.middleware");

connectDB();
const app = express();
app.use(express.json());
app.use(cookieParser());

app.use("/api/v1/auth", authRouter);
app.use("/api/v1/account", accountRouter);
app.use("/api/v1/transaction", transactionRouter);

module.exports = app;
