const Profile = require("../models/Profile");
const User = require("../models/User");

//updating profile details coz profile already created with null values in sign up handler
exports.updateProfile = async (req, res) => {
  try {
    //get data
    const { dateOfBirth = "", about = "", contactNumber, gender } = req.body;

    //get userId
    const id = req.user.id;
    //validation
    if (!contactNumber || !gender || !id) {
      return res.status(400).json({
        success: false,
        message: "All fields are required",
      });
    }
    //find proflie
    const userDetails = await User.findById({ id });
    const profileId = userDetails.additionalDetails;
    const profileDetails = await Profile.findById({ profileId });
    //update profile
    profileDetails.dateOfBirth = dateOfBirth;
    profileDetails.about = about;
    profileDetails.contactNumber = contactNumber;
    profileDetails.gender = gender;
    await profileDetails.save();

    //return response
    return res.status(200).json({
      success: true,
      message: "Profile updated successfully",
      profileDetails,
    });
  } catch (e) {
    return res.status(500).json({
      success: false,
      message: "error in updating profile",
    });
  }
};

//delete Account

exports.deleteAccount = async (req, res) => {
  try {
    //get id
    const id = req.user.id;
    //find user
    const userDetails = await User.findById({ id });
    //validation
    if (!userDetails) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }
    //find profile
    const profileId = userDetails.additionalDetails;
    const profileDetails = await Profile.findById({ profileId });
    //delete profile
    await profileDetails.remove();

    //unenroll user from all enrolled users

    //delete user
    await User.findByIdAndDelete({ id });
    //return response
    return res.status(200).json({
      success: true,
      message: "Account deleted successfully",
    });
    e;
  } catch (e) {
    return res.status(500).json({
      success: false,
      message: "error in deleting account",
    });
  }
};

//get all user details

exports.getAllUserDetails = async (req, res) => {
  try {
    //get id
    const id = req.user.id;

    //validation and get uesr details
    const userDetails = await User.findById({ id })
      .populate("additionalDetails")
      .exec();

    //return response
    return res.status(200).json({
      success: true,
      message: "User details fetched successfully",
      userDetails,
    });
  } catch (e) {
    return res.status(500).json({
      success: false,
      message: "error in fetching user details",
    });
  }
};
