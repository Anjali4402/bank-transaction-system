const mongoose = require("mongoose");
const bcrypt = require("bcrypt");

const userSchema = new mongoose.Schema(
  {
    email: {
      type: String,
      trim: true,
      lowercase: true,
      match: [/^\S+@\S+\.\S+$/, "Please provide a valid email"],
      required: [true, "Email is required for creating an account"],
      unique: (true, "Email already exist"),
    },
    name: {
      type: String,
      required: [true, "Name is required for creating an account"],
    },
    password: {
      type: String,
      required: [true, "Password is required for creating an account"],
      minlength: [6, "Password should contain atleast 6 character"],
      select: false, //By default, password will NOT be returned in queries.
    },
  },
  /// we will get or store the timstap or each createing and updating user.
  {
    timestamps: true,
  },
);

// This function runs automatically before saving a document.
userSchema.pre("save", async function (next) {
  if (!this.isModified("password")) {
    return;
    //   return next();
  }

  //  -> Salt rounds (Represents hashing complexity.)
  const hash = await bcrypt.hash(this.password, 10);
  this.password = hash;

  //   return next();
});

// Creates a custom function available on every user document.
userSchema.methods.comparePassword = async function (password) {
  return await bcrypt.compare(password, this.password);
};

const userModel = mongoose.model("User", userSchema);

module.exports = userModel;
