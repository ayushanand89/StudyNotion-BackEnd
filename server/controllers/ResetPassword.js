const User = require("../models/User");
const mailSender = require("../utils/mailSender");
const crypto = require("crypto");
const bcrypt = require("bcrypt");

//resetPasswordToken
exports.resetPasswordToken = async (req, res) => {
  try {
    //get email from req body
    const { email } = req.body;
    //validation
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(400).json({
        success: false,
        message: "User not found",
      });
    }
    //generate token
    const token = crypto.randomBytes(32).toString("hex");
    //update user by adding token and expiration time
    const updateDetails = await User.findOneAndUpdate(
      { email },
      {
        token: token,
        resetPasswordExpires: Date.now() + 10 * 60 * 1000,
      },
      { new: true }
    );
    //create url
    const url = `http://localhost:3000/update-password/${token}`;
    //send mail containing the url
    await mailSender(
      email,
      "Password Reset Link",
      `Password Reset Link: ${url}`
    );
    //return response
    return res.status(200).json({
      success: true,
      message: "Password reset link has been sent to your email",
    });
  } catch (e) {
    console.log(e);
    return res.status(500).json({
      success: false,
      message: "error in reset password token",
    });
  }
};

//reset Password

exports.resetPassword = async (req, res) => {
  try {
    //fetch data
    const { password, confirmPassword, token } = req.body;
    //validation
    if (password !== confirmPassword) {
      return res.status(400).json({
        success: false,
        message: "Passwords do not match",
      });
    }

    //get user details from db using token
    const userDetails = await User.findOne({ token });
    //if no entry - invalid token
    if (!userDetails) {
      return res.status(400).json({
        success: false,
        message: "Invalid token",
      });
    }
    //token time check
    if (userDetails.resetPasswordExpires < Date.now()) {
      return res.status(400).json({
        success: false,
        message: "Token has expired",
      });
    }

    //hash pwd
    const hashedPassword = await bcrypt.hash(password, 10);
    //pwd update
    await User.findOneAndUpdate(
      { token },
      { password: hashedPassword },
      { new: true }
    );
    //return response
    return res.status(200).json({
      success: true,
      message: "Password updated successfully",
    });
  } catch (e) {
    console.log(e);
    return res.status(500).json({
      success: false,
      message: "error in reset password",
    });
  }
};
