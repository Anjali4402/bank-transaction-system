const userModel = require("../model/auth.model");
const jwt = require("jsonwebtoken");

const userRegisterController = async (req, res) => {
  try {
    const { email, name, password } = req.body;

    const isExist = await userModel.findOne({ email });

    if (isExist) {
      return res.status(422).json({
        message: "User already exists with this email",
        status: "failed",
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
    return res.status(201).json({
      message: "User registered successfully",
      success: true,
      user,
    });
  } catch (error) {
    // Mongoose validation errors
    if (error.name === "ValidationError") {
      const messages = Object.values(error.errors).map((err) => err.message);

      return res.status(400).json({
        status: "failed",
        message: messages[0], // first validation message
        errors: messages, // all validation messages
      });
    }

    return res.status(500).json({
      status: "failed",
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
        success: "failed",
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
        status: "failed",
        message: messages[0], // first validation message
        errors: messages, // all validation messages
      });
    }

    res.status(400).json({
      message: "Something went wrong",
    });
  }

  return res.status(500).json({
    success: "failed",
    message: "Internal server error",
  });
};

module.exports = { userRegisterController, userLoginController };
