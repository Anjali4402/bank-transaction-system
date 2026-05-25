const express = require("express");
const connectDB = require("./db/db");
require("dotenv").config();
const authRouter = require("./routes/auth.routes");
const cookieParser = require("cookie-parser");

connectDB();
const app = express();
app.use(express.json());
app.use(cookieParser());

app.use("/api/v1/auth", authRouter);

module.exports = app;
