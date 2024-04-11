const User = require("../models/User");
const OTP = require("../models/OTP");
const Profile = require("../models/Profile");
const otpGenerator = require("otp-generator");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
require("dotenv").config();

//send OTP
exports.sendOTP = async (req, res) => {
  try {
    //fetch email from request body
    const { email } = req.body;

    //check if email exists in database
    const checkUserPresent = await User.findOne({ email });
    if (checkUserPresent) {
      return res.status(401).json({
        success: false,
        message: "User already exists",
      });
    }
    //generate otp
    var otp = otpGenerator.generate(6, {
      upperCaseAlphabets: false,
      lowerCaseAlphabets: false,
      specialChars: false,
    });

    //check unique otp or not
    let result = await OTP.findOne({ otp });

    while (result) {
      otp = otpGenerator.generate(6, {
        upperCaseAlphabets: false,
        lowerCaseAlphabets: false,
        specialChars: false,
      });
      result = await OTP.findOne({ otp });
    }

    const otpPayload = { email, otp };

    //create an entry in DB
    const otpBody = await OTP.create({ otpPayload });
    console.log(otpBody);

    //return response successful
    res.status(200).json({
      success: true,
      message: "OTP sent successfully",
      otp: otpBody.otp,
    });
  } catch (e) {
    console.log("error occured while sending email: ", e);
    res.status(500).json({
      success: false,
      message: "error in otp generation",
    });
  }
};

//signUp
exports.signUp = async (req, res) => {
  try {
    const {
      firstName,
      lastName,
      email,
      password,
      confirmPassword,
      accountType,
      contactNumber,
      otp,
    } = req.body;

    //validation
    if (
      !firstName ||
      !lastName ||
      !email ||
      !password ||
      !confirmPassword ||
      !otp
    ) {
      return res.status(403).json({
        success: false,
        message: "Please fill all the fields",
      });
    }

    //match password and confirm password
    if (password !== confirmPassword) {
      return res.status(400).json({
        success: false,
        message: "Passwords do not match",
      });
    }

    //check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: "User already exists",
      });
    }

    //find most recent OTP stored for the use
    const recentOtp = await OTP.find({ email })
      .sort({ createdAt: -1 })
      .limit(1);
    console.log(recentOtp);

    //validatea opt
    if (recentOtp.length == 0) {
      //otp not found
      return res.status(400).json({
        success: false,
        message: "OTP not found",
      });
    } else if (otp !== recentOtp) {
      //otp not matching
      return res.status(400).json({
        success: false,
        message: "invalid otp",
      });
    }

    //Hash Password
    const hashedPassword = await bcrypt.hash(password, 10);

    //create entry in DB

    const profileDetails = await Profile.create({
      gender: null,
      dateOfBirth: null,
      about: null,
      contactNumber: null,
    });

    const user = await User.create({
      firstName,
      lastName,
      email,
      password: hashedPassword,
      accountType,
      contactNumber,
      additionalDetails: profileDetails._id,
      image: `https://api.dicebear.com/5.x/initials/svg?seed=${firstName} ${lastName}`,
    });

    //return res
    return res.status(200).json({
      success: true,
      message: "User created successfully",
      user,
    });
  } catch (e) {
    console.log(e);
    return res.status(500).json({
      success: false,
      message: "error in user creation",
    });
  }
};

//Login
exports.login = async (req, res) => {
  try {
    //get data from req body
    const { email, password } = req.body;
    //validate fetched data
    if (!email || !password) {
      return res.status(403).json({
        success: false,
        message: "Please fill all the fields",
      });
    }
    //check if user exists
    const existingUser = await User.findOne({ email });
    if (!existingUser) {
      return res.status(400).json({
        success: false,
        message: "User not found",
      });
    }
    //check if password matches then generate JWT token
    const isMatch = await bcrypt.compare(password, existingUser.password);
    if (!isMatch) {
      return res.status(400).json({
        success: false,
        message: "Invalid password",
      });
    }
    const payload = {
      email: existingUser.email,
      id: existingUser._id,
      accountType: existingUser.accountType,
    };
    const token = jwt.sign(payload, process.env.JWT_SECRET, {
      expiresIn: "2h",
    });
    existingUser.toObject();
    existingUser.token = token;
    existingUser.password = undefined;

    //create Cookie and send response
    res.cookie("token", token, {
      expires: new Date(Date.now() + 1000 * 60 * 60 * 24),
      httpOnly: true,
    });
    return res.status(200).json({
      success: true,
      message: "User logged in successfully",
      user: existingUser,
    });
  } catch (e) {
    console.log(e);
    return res.status(500).json({
      success: false,
      message: "error in user login",
    });
  }
};

exports.changePassword = async (req, res) => {
  try {
    //get data from body
    const { newPassword, confirmPassword } = req.body;
    //validate data
    if (!newPassword || !confirmPassword) {
      return res.json({
        success: false,
        message: "Fill both fields",
      });
    }
    if (newPassword != confirmPassword) {
      return res.status(401).json({
        success: false,
        message: "Passwords does not match!!",
      });
    }

    const token = req.cookies.token;
    const decodedToken = jwt.verify(token, process.env.JWT_SECRET);
    if (!decodedToken) {
      return res.status(403).json({
        success: false,
        message: "Invalid token",
      });
    }
    const email = decodedToken.email;
    //update password in db
    const user = await User.findOne({ email });
    // Hash the new password
    const hashedPassword = await bcrypt.hash(newPassword, 10);
    // Update password in the database
    user.password = hashedPassword;
    //send mail - password updated
    await mailSender(
      email,
      "Password Updation mail",
      "Password Successfully updated"
    );
    //return response
    return res.status(201).json({
      success: true,
      message: "Password updation successfull!",
    });
  } catch (error) {
    console.log("Error updating password", error);
    return res.status(403).json({
      success: false,
      message: "Error updating password!!",
    });
  }
};
