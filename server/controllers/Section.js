const Section = require("../models/Section");
const Course = require("../models/Course");

//creating section
exports.createSection = async (req, res) => {
  try {
    //data fetch
    const { sectionName, courseId } = req.body;

    //data validation
    if (!sectionName || !courseId) {
      return res.status(400).json({
        success: false,
        message: "Please provide a section name and course id",
      });
    }

    //create section
    const newSection = await Section.create({ sectionName });
    //update course with section ObjectId
    const updatedCourseDetails = await Course.findByIdAndUpdate(
      courseId,
      {
        $push: {
          courseContent: newSection._id,
        },
      },
      { new: true }
    );

    //return response
    return res.status(200).json({
      success: true,
      message: "Section created successfully",
      section: newSection,
    });
  } catch (e) {
    console.log(e);
    return res.status(500).json({
      success: false,
      message: "error in section creation",
    });
  }
};

//updating section
exports.updateSection = async (req, res) => {
  try {
    //fetch data
    const { sectionName, sectionId } = req.body;
    //validate
    if (!sectionName || !sectionId) {
      return res.status(400).json({
        success: false,
        message: "Please provide a section name and section id",
      });
    }
    //update section
    const updatedSection = await Section.findByIdAndUpdate(
      sectionId,
      {
        sectionName: sectionName,
      },
      { new: true }
    );
    //return response
    return res.status(200).json({
      success: true,
      message: "Section updated successfully",
      section: updatedSection,
    });
  } catch (err) {
    console.log(err);
    return res.status(500).json({
      success: false,
      message: "error in section update",
    });
  }
};

//deleting section
exports.deleteSection = async (req, res) => {
  try {
    //fetch data
    const { sectionId } = req.params;
    //validate
    if (!sectionId) {
      return res.status(400).json({
        success: false,
        message: "Please provide a section id",
      });
    }
    //delete section
    const deletedSection = await Section.findByIdAndDelete(sectionId);

    //find all courses that have this section as content
    const courses = await Course.find({ courseContent: sectionId });

    // Update courses to remove the section reference
    await Promise.all(
      courses.map(async (course) => {
        course.courseContent = course.courseContent.filter(
          (content) => content.toString() !== sectionId
        );
        await course.save();
      })
    );

    //return response
    return res.status(200).json({
      success: true,
      message: "Section deleted successfully",
      section: deletedSection,
    });
  } catch (err) {
    console.log(err);
    return res.status(500).json({
      success: false,
      message: "error in section deletion",
    });
  }
};
