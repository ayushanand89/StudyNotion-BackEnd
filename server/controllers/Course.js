const Course = require("../models/Course");
const Tag = require("../models/Tags");
const User = require("../models/User");
const { uploadImageToCloudinary } = require("../utils/imageUploader");
require("dotenv").config();

//createCourse handler function
exports.createCourse = async (req, res) => {
  try {
    //fetch data
    const { courseName, courseDescription, whatYouWillLearn, price, tag } =
      req.body;

    //get thumbnail
    const thumbnail = req.files.thumbnailImage;

    //validation
    if (
      !courseName ||
      !courseDescription ||
      !whatYouWillLearn ||
      !price ||
      !tag ||
      !thumbnail
    ) {
      return res.status(400).json({
        success: false,
        message: "Please fill all the fields",
      });
    }

    //chech for instructor
    const userId = req.user.id; 
    const instructorDetails = await User.findById(userId);
    console.log("instructorDetails: ", instructorDetails);

    if (!instructorDetails) {
      return res.status(404).json({
        success: false,
        message: "Instructor details not found",
      });
    }

    //chech given tag is valid or not
    const tagDetails = await Tag.findById(tag);
    if (!tagDetails) {
      return res.status(404).json({
        success: false,
        message: "Tag not found",
      });
    }

    //upload image to cloudinary
    const thumbnailImage = await uploadImageToCloudinary(
      thumbnail,
      process.env.FOLDER_NAME
    );

    //create entry for new course
    const newCourse = await Course.create({
      courseName,
      courseDescription,
      whatYouWillLearn: whatYouWillLearn,
      price,
      thumbnail: thumbnailImage,
      tag: tagDetails._id,
      instructor: instructorDetails._id,
    });

    //add the new course to the user schema of instructor
    await User.findByIdAndUpdate(
      { _id: instructorDetails._id },
      {
        $push: {
          courses: newCourse._id,
        },
      },
      {
        new: true,
      }
    );

    //update the TAG schema
    const newTag = await Tag.create({
      name: tagDetails.name,
      description: tagDetails.description,
      course: newCourse._id,
    });

    //return response
    return res.status(200).json({
      success: true,
      message: "Course created successfully",
      newCourse,
    });
  } catch (e) {
    console.log(e);
    return res.status(500).json({
      success: false,
      message: "error in course creation",
    });
  }
};

//getAllCourses handler function

exports.showAllCourses = async (req, res) => {
  try {
    const allCourses = await Course.find(
      {},
      {
        courseName: true,
        price: true,
        thumbnail: true,
        instructor: true,
        ratingAndReviews: true,
        studentsEnrolled: true,
      }
    )
      .populate("instructor")
      .exec();

    return res.status(200).json({
      success: true,
      message: "All courses fetched successfully",
      courses: allCourses,
    }); 
  } catch (e) {
    console.log(error);
    return res.status(500).json({
      success: false,
      message: "error in getting all courses",
      error: error.message,
    });
  }
};
