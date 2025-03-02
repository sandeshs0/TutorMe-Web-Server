const Tutor = require("../model/tutor");
const User = require("../model/user");
const Subject = require("../model/subject");
const bcrypt = require("bcrypt");
const cloudinary = require("../utils/cloudinary");

// Fetch all tutors
// const getTutors = async (req, res) => {
//   try {
//     const {
//       subject,
//       minHourlyRate,
//       maxHourlyRate,
//       page = 1,
//       limit = 10,
//     } = req.query;

//     const query = {};
//     if (subject) {
//       const subjectDoc = await Subject.findOne({ name: subject });
//       if (subjectDoc) query.subjects = subjectDoc._id;
//     }
//     if (minHourlyRate)
//       query.hourlyRate = { ...query.hourlyRate, $gte: Number(minHourlyRate) };
//     if (maxHourlyRate)
//       query.hourlyRate = { ...query.hourlyRate, $lte: Number(maxHourlyRate) };

//     const tutors = await Tutor.find(query)
//       .populate("userId", "name profileImage email username") // Only populate public fields
//       .populate("subjects", "name") // Only fetch subject names
//       .skip((page - 1) * limit)
//       .limit(Number(limit));

//     const totalTutors = await Tutor.countDocuments(query);

//     // Filter out sensitive data from the response
//     const filteredTutors = tutors.map((tutor) => ({
//       id: tutor._id,
//       name: tutor.userId?.name,
//       profileImage: tutor.profileImage,
//       email: tutor.userId?.email,
//       username: tutor.userId?.username,
//       bio: tutor.bio,
//       description: tutor.description,
//       hourlyRate: tutor.hourlyRate,
//       rating: tutor.rating,
//       subjects: tutor.subjects.map((subject) => subject.name), // Include subject names only
//       availability: tutor.availability,
//     }));

//     res.status(200).json({
//       message: "Tutors fetched successfully",
//       tutors: filteredTutors,
//       pagination: {
//         currentPage: Number(page),
//         totalPages: Math.ceil(totalTutors / limit),
//         totalTutors,
//       },
//     });
//   } catch (error) {
//     console.error("Error fetching tutors:", error);
//     res.status(500).json({ message: "Failed to fetch tutors" });
//   }
// };


const getTutors = async (req, res) => {
  try {
    const {
      subject,
      minHourlyRate,
      maxHourlyRate,
      minRating,
      maxRating,
      search,
      sortBy,
      sortOrder = "asc",
      page = 1,
      limit = 10,
    } = req.query;

    const query = {};

    if (search) {
      const userSearchQuery = { 
        $or: [
          { name: { $regex: search, $options: "i" } }, 
          { username: { $regex: search, $options: "i" } }, 
        ],
      };

  
      const users = await User.find(userSearchQuery).select("_id");
      const userIds = users.map(user => user._id);

      query.$or = [
        { userId: { $in: userIds } }, 
        { bio: { $regex: search, $options: "i" } }, 
        { description: { $regex: search, $options: "i" } }, 
      ];
    }

    if (subject) {
      const subjectDoc = await Subject.findOne({ name: subject });
      if (subjectDoc) query.subjects = subjectDoc._id;
    }

    if (minHourlyRate) query.hourlyRate = { ...query.hourlyRate, $gte: Number(minHourlyRate) };
    if (maxHourlyRate) query.hourlyRate = { ...query.hourlyRate, $lte: Number(maxHourlyRate) };

    if (minRating) query.rating = { ...query.rating, $gte: Number(minRating) };
    if (maxRating) query.rating = { ...query.rating, $lte: Number(maxRating) };

    const sortOptions = {};
    if (sortBy) {
      const validSortFields = ["hourlyRate", "rating", "name"];
      if (validSortFields.includes(sortBy)) {
        sortOptions[sortBy] = sortOrder === "desc" ? -1 : 1;
      }
    }

    const tutors = await Tutor.find(query)
      .populate("userId", "name profileImage email username") 
      .populate("subjects", "name")
      .sort(sortOptions)
      .skip((page - 1) * limit)
      .limit(Number(limit));

    const totalTutors = await Tutor.countDocuments(query);

    const filteredTutors = tutors.map((tutor) => ({
      id: tutor._id,
      name: tutor.userId?.name,
      profileImage: tutor.profileImage,
      email: tutor.userId?.email,
      username: tutor.userId?.username,
      bio: tutor.bio,
      description: tutor.description,
      hourlyRate: tutor.hourlyRate,
      rating: tutor.rating,
      subjects: tutor.subjects.map((subject) => subject.name),
      availability: tutor.availability,
    }));

    res.status(200).json({
      message: "Tutors fetched successfully",
      tutors: filteredTutors,
      pagination: {
        currentPage: Number(page),
        totalPages: Math.ceil(totalTutors / limit),
        totalTutors,
      },
    });
  } catch (error) {
    console.error("Error fetching tutors:", error);
    res.status(500).json({ message: "Failed to fetch tutors" });
  }
};

const updateTutorProfile = async (req, res) => {
  try {
    const tutorId = req.user.id;
    const { bio, description, hourlyRate, subjects, availability } = req.body;
    console.log(typeof subjects);
    const updateFields = {};

    if (bio) updateFields.bio = bio;
    if (description) updateFields.description = description;
    if (hourlyRate) updateFields.hourlyRate = hourlyRate;
    if (availability) updateFields.availability = availability;
    // if (profileImage) updateFields.profileImage = profileImage;

    if (req.file) {
      const uploadResult = await cloudinary.uploader.upload(req.file.path, {
        folder: "tutor-profile-images", 
      });
      updateFields.profileImage = uploadResult.secure_url;
      console.log("uploadResult:", uploadResult);
    }

    // if (subjects) {
    //   const subjectIds = await Promise.all(
    //     subjects.map(async (subjectName) => {
    //       let subject = await Subject.findOne({ name: subjectName });
    //       if (!subject) {
    //         subject = new Subject({ name: subjectName });
    //         await subject.save();
    //       }
    //       return subject._id;
    //     })
    //   );
    //   updateFields.subjects = subjectIds;
    // }
    if (subjects) {
      const subjectIds = await Promise.all(
        subjects.map(async (subjectName) => {
          let subject = await Subject.findOne({ name: subjectName });
          if (!subject) {
            subject = new Subject({ name: subjectName });
            await subject.save();
          }
          return subject._id;
        })
      );

      updateFields.subjects = subjectIds;
    }


    // if (profileImage) {
    //   updateFields.profileImage = profileImage; // Add profile picture if uploaded
    // }

    const updatedTutor = await Tutor.findOneAndUpdate(
      { userId: tutorId },
      { $set: updateFields },
      { new: true }
    ).populate("subjects", "name");

    if (!updatedTutor) {
      return res
        .status(404)
        .json({ message: "Tutor not found or unauthorized" });
    }

    res.status(200).json({
      message: "Profile updated successfully",
      updatedTutor,
    });
  } catch (error) {
    console.error("Error updating tutor profile:", error);
    res.status(500).json({ message: "Failed to update tutor profile" });
  }
};

const getTutorProfile = async (req, res) => {
  try {
    const tutorId = req.user.id; 

   
    const tutor = await Tutor.findOne({ userId: tutorId })
      .populate("userId", "name email phone profileImage")
      .populate("subjects", "name");

    if (!tutor) {
      return res.status(404).json({ message: "Tutor profile not found" });
    }

    const tutorProfile = {
      id: tutor._id,
      name: tutor.userId.name,
      email: tutor.userId.email,
      phone: tutor.userId.phone,
      profileImage: tutor.profileImage,
      bio: tutor.bio,
      walletBalance: tutor.walletBalance,
      description: tutor.description,
      hourlyRate: tutor.hourlyRate,
      rating: tutor.rating,
      subjects: tutor.subjects.map((subject) => subject.name),
      availability: tutor.availability,
    };

    res.status(200).json({
      message: "Tutor profile fetched successfully",
      tutor: tutorProfile,
    });
  } catch (error) {
    console.error("Error fetching tutor profile:", error);
    res.status(500).json({ message: "Failed to fetch tutor profile" });
  }
};

const getTutorByUsername = async (req, res) => {
  try {
    const { username } = req.params; 
    const user = await User.findOne({ username });

    if (!user) {
      return res
        .status(404)
        .json({ message: "Tutor with the given username not found" });
    }


    const tutor = await Tutor.findOne({ userId: user._id })
      .populate("userId", "name profileImage") 
      .populate("subjects", "name");

    if (!tutor) {
      return res.status(404).json({ message: "Tutor profile not found" });
    }

    const tutorProfile = {
      id: tutor._id,
      name: tutor.userId?.name || "N/A",
      profileImage: tutor.profileImage,
      bio: tutor.bio,
      username: tutor.userId?.username,
      description: tutor.description,
      hourlyRate: tutor.hourlyRate,
      rating: tutor.rating,
      subjects: tutor.subjects.map((subject) => subject.name),
      availability: tutor.availability,
    };

    res.status(200).json({
      message: "Tutor profile fetched successfully",
      tutor: tutorProfile,
    });
  } catch (error) {
    console.error("Error fetching tutor profile:", error);
    res.status(500).json({ message: "Failed to fetch tutor profile" });
  }
};

module.exports = {
  getTutors,
  updateTutorProfile,
  getTutorByUsername,
  getTutorProfile,
};
