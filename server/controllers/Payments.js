const { instance } = require('../config/razorpay');
const Course = require('../models/Course');
const User = require('../models/User');
const mailSender = require('../utils/mailSender');
const { courseEnrollment } = require('../mail/templates/courseEnrollment');

//capture the payment and initiate the razorpay order
exports.capturePayment = async (req, res) => {
    //get course id and user id
    const {coures_id} = req.body;
    const {user_id} = req.user.id;
    //validation
    //valid courseId
    if(!coures_id){
        return res.status(400).json({
            success: false,
            message: "Please provide a course id"
        })
    }
    //valid courseDetail
    let course;
    try{
        course = await Course.findById(coures_id);
        if(!course){
            return res.status(404).json({
                success: false,
                message: "Course not found"
            })
        }

        //user already has paid for the course
        const uid = new mongoose.Types.ObjectId(userId);
        if(course.studentsEnrolled.includes(uid)){
            return res.status(404).json({
                success: false,
                message: "You have already enrolled in this course"
            })
        }
    }catch(e){
        console.log(e);
        return res.status(500).json({
            success: false,
            message: "error in getting course details"
        })
    }
    //creata order
    //return response

}