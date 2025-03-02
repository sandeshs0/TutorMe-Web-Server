const Review = require("../model/review");
const Student = require("../model/student");
const Tutor = require("../model/tutor");
const User = require("../model/user");
const { sendNotification } = require("../utils/notifications");
const { date } = require("joi");

const ReviewController = {
  async giveReview(req, res) {
    console.log("creating review: ", req.body);
    try {
      const { tutorId, text, rating } = req.body;
      const student = await Student.findOne({ userId: req.user.id });
      const studentObject = await User.findOne({ _id: req.user.id });
      if (!student) {
        return res.status(500).json({ message: "Student profile not found." });
      }

      const tutor = await Tutor.findById(tutorId).populate("userId", "id");

      if (!tutor) {
        return res.status(404).json({ message: "Tutor not found." });
      }

      if (!tutor.userId) {
        console.error(" Tutor userId is missing for tutor:", tutor);
        return res.status(500).json({ message: "Tutor data is incomplete." });
      }

      console.log(" Tutor found:", tutor);

      const review = new Review({
        studentId: student._id,
        tutorId: tutor._id,
        text,
        rating,
      });

      await review.save();
      console.log(" Review created:", review);

      sendNotification(
        tutor.userId._id,
        `⭐ ${studentObject.name} rated you ${rating} stars!`
      );
      const allReviews = await Review.find({ tutorId: tutor._id });
      const totalRatings = allReviews.reduce((sum, r) => sum + r.rating, 0);
      const avgRating = totalRatings / allReviews.length;

      tutor.rating = avgRating.toFixed(1);
      await tutor.save();

      res.status(201).json({
        success: true,
        message: "Review created successfully.",
        review,
        avgRating: tutor.rating,
      });
      console.log("review created");
    } catch (error) {
      console.error(" Error creating review:", error);
      res.status(500).json({ message: "Failed to create review" });
    }
  },

  async getReviewsByTutorUsername(req, res) {
    try {
      const { username } = req.params;
      const user = await User.findOne({ username });

      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      const tutor = await Tutor.findOne({ userId: user._id });

      if (!tutor) {
        return res.status(404).json({ message: "Tutor profile not found" });
      }

      const reviews = await Review.find({ tutorId: tutor._id })
        .populate("studentId", "userId")
        .populate({
          path: "studentId",
          populate: { path: "userId", select: "name profileImage" },
        });

      // **Format the response**
      const formattedReviews = reviews.map((review) => ({
        reviewId: review._id,
        studentName: review.studentId.userId.name,
        studentProfileImage: review.studentId.profileImage,
        rating: review.rating,
        text: review.text,
        createdAt: review.createdAt,
      }));

      res.status(200).json({
        success: true,
        tutor: {
          tutorId: tutor._id,
          name: user.name,
          username: user.username,
          rating: tutor.rating,
        },
        reviews: formattedReviews,
      });
    } catch (error) {
      console.error("Error fetching reviews:", error);
      res.status(500).json({ message: "Failed to fetch reviews" });
    }
  },
};

module.exports = ReviewController;
