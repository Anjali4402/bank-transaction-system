const jwt = require("jsonwebtoken");
const userModel = require("../model/auth.model");

async function accountMiddleware(req, res, next) {
  // Get JWT token from cookie or Authorization header
  const token = req.cookies.token || req.headers?.authorization?.split(" ")[1];

  // Block request if token is not provided
  if (!token) {
    return res.status(401).json({
      success: false,
      message: "Unauthorised",
    });
  }

  try {
    // Verify token and extract payload data
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Extra safety check (jwt.verify usually throws if invalid)
    if (!decoded) {
      return res.status(401).json({
        success: false,
        message: "Unauthorised",
      });
    }

    // Find user associated with the token
    const userData = await userModel.findOne({
      _id: decoded.userId,
    });

    // User may have been deleted after token was issued
    if (!userData) {
      return res.status(403).json({
        success: false,
        message: "Not have access!",
      });
    }

    // Attach user id to request for use in controllers
    req.user = userData._id;

    // Pass control to next middleware/controller
    next();
  } catch (error) {
    // Handle invalid or expired JWT token
    if (
      error.name === "JsonWebTokenError" ||
      error.name === "TokenExpiredError"
    ) {
      return res.status(401).json({
        success: false,
        message: "Invalid or expired token",
      });
    }

    // Log unexpected server errors
    // console.error(error);

    return res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
}

module.exports = accountMiddleware;
