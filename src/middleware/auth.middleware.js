const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const userModel = require("../model/auth.model");

async function authMiddleware(req, res, next) {
  const token = req.cookies.token || req.headers?.authorization?.split(" ")[1];

  if (!token) {
    return res.status(400).json({
      success: false,
      message: "Unauthorised",
    });
  }

  try {
    // find user based on jwt token
    const decoded = await jwt.verify(token, process.env.JWT_SECRET);

    if (!decoded) {
      return res.status(409).json({
        success: false,
        message: "Unauthorised",
      });
    }

    const userData = await userModel.findById(decoded?.userId);

    if (!userData) {
      return res.status(409).json({
        success: false,
        message: "Unauthorised",
      });
    }

    req.user = userData;
    next();
  } catch (error) {
    return res.status(401).json({
      message: "Unauthorized access, token is invalid",
    });
  }

  return res.status(500).json({
    success: "failed",
    message: "Internal server error",
  });
}

module.exports = {
  authMiddleware,
};
