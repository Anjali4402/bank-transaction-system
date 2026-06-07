const userModel = require("../model/auth.model");
const jwt = require("jsonwebtoken");
const emailService = require("../services/email.service");
const tokenBlackListModel = require("../model/blackList.model");

const userRegisterController = async (req, res) => {
  try {
    const { email, name, password } = req.body;

    const isExist = await userModel.findOne({ email });

    if (isExist) {
      return res.status(422).json({
        message: "User already exists with this email",
        success: false,
      });
    }

    const user = await userModel.create({
      email,
      name,
      password,
    });

    // Create JWT Token
    const token = await jwt.sign(
      {
        userId: user._id,
      },
      process.env.JWT_SECRET,
      {
        expiresIn: "3d",
      },
    );

    // Send token in cookes
    await res.cookie("token", token);

    // after successfully token set. send a response
    res.status(201).json({
      message: "User registered successfully",
      success: true,
      user,
    });

    // send email to the user.
    // await emailService.sendRegistrationEmail(user.email, user.name);
  } catch (error) {
    // Mongoose validation errors
    if (error.name === "ValidationError") {
      const messages = Object.values(error.errors).map((err) => err.message);

      return res.status(400).json({
        success: false,
        message: messages[0], // first validation message
        errors: messages, // all validation messages
      });
    }

    return res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

const userLoginController = async (req, res) => {
  try {
    const { email, password } = req.body;

    const user = await userModel.findOne({ email }).select("+password");

    if (!user) {
      return res.status(409).json({
        success: false,
        message: "User not found! Please sign up.",
      });
    }

    // If user exist.
    // now  match the password
    const isExist = await user.comparePassword(password);

    // If User Exist
    if (!isExist) {
      return res.status(400).json({
        success: false,
        message: "Wrong Password",
      });
    }

    // Create JWT Token
    const token = await jwt.sign({ userId: user._id }, process.env.JWT_SECRET, {
      expiresIn: "3d",
    });

    // Send token in cookes
    await res.cookie("token", token);

    // after successfully token set. send a response
    return res.status(201).json({
      message: "User Login successfully",
      success: true,
      user: user,
    });
  } catch (error) {
    if (error.name === "ValidationError") {
      const messages = Object.values(error.errors).map((err) => err.message);

      return res.status(400).json({
        success: true,
        message: messages[0], // first validation message
        errors: messages, // all validation messages
      });
    }

    return res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

const userLogoutController = async (req, res) => {
  // token blacklist
  await tokenBlackListModel.create({ token });
  // Clear cookie
  res.clearCookie("token");

  // send response.
  res.status(201).json({
    success: true,
    message: "User logout successfully!",
  });
};

module.exports = {
  userRegisterController,
  userLoginController,
  userLogoutController,
};
