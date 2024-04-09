const jwt = require("jsonwebtoken");
require("dotenv").config();
const User = require("../models/User");

//auth
exports.auth = async (req, res, next) => {
  try {
    //extract token
    const token =
      req.cookies.token ||
      req.body.token ||
      req.header("Authorisation").replace("Bearer ", "");

    //if token missing, then return response
    if (!token) {
      return res.status(401).json({
        success: false,
        message: "Token is missing",
      });
    }

    //verify the token
    try {
      const decode = await jwt.verify(token, process.env.JWT_SECRET);
      console.log(decode);
      req.user = decode;
    } catch (e) {
      //verification failed
      return res.status(401).json({
        success: false,
        message: "Token is invalid",
      });
    }
    next();
  } catch (e) {
    return res.status(401).json({
      success: false,
      message: "something went wrong while verifying token",
    });
  }
};

//isStudent
exports.isStudent = async (req, res, next) => {
  try {
    if (req.user.accountType !== "Student") {
      return res.status(401).json({
        success: false,
        message: "You are not a student",
      });
    }
    next();
  } catch (e) {
    return res.status(500).json({
      success: false,
      message: "user role can't be verified, try again",
    });
  }
};

//isInstructor
exports.isInstructor = async (req, res, next) => {
  try {
    if (req.user.accountType !== "Instructor") {
      return res.status(401).json({
        success: false,
        message: "You are not a student",
      });
    }
    next();
  } catch (e) {
    return res.status(500).json({
      success: false,
      message: "user role can't be verified, try again",
    });
  }
};

//isAdmin

exports.isAdmin = async (req, res, next) => {
  try {
    if (req.user.accountType !== "Admin") {
      return res.status(401).json({
        success: false,
        message: "You are not an admin",
      });
    }
    next();
  } catch (e) {
    return res.status(500).json({
      success: false,
      message: "user role can't be verified, try again",
    });
  }
};
