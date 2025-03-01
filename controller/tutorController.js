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

// const getTutors = async (req, res) => {
//   try {
//     const {
//       subject,
//       minHourlyRate,
//       maxHourlyRate,
//       minRating,
//       maxRating,
//       search,
//       sortBy,
//       sortOrder = "asc",
//       page = 1,
//       limit = 10,
//     } = req.query;

//     const query = {};

//     // 🔍 Search by name, username, or bio
//     if (search) {
//       query.$or = [
//         { bio: { $regex: search, $options: "i" } },
//         { description: { $regex: search, $options: "i" } },
//       ];
//     }

//     // 🎯 Filter by subject
//     if (subject) {
//       const subjectDoc = await Subject.findOne({ name: subject });
//       if (subjectDoc) query.subjects = subjectDoc._id;
//     }

//     if (minHourlyRate)
//       query.hourlyRate = { ...query.hourlyRate, $gte: Number(minHourlyRate) };
//     if (maxHourlyRate)
//       query.hourlyRate = { ...query.hourlyRate, $lte: Number(maxHourlyRate) };

//           if (minRating)
//       query.rating = { ...query.rating, $gte: Number(minRating) };
//     if (maxRating)
//       query.rating = { ...query.rating, $lte: Number(maxRating) };

//     const sortOptions = {};
//     if (sortBy) {
//       const validSortFields = ["hourlyRate", "rating", "name"];
//       if (validSortFields.includes(sortBy)) {
//         sortOptions[sortBy] = sortOrder === "desc" ? -1 : 1;
//       }
//     }

//     // Fetch tutors with filters, sorting, and pagination
//     const tutors = await Tutor.find(query)
//       .populate("userId", "name profileImage email username") // Fetch user details
//       .populate("subjects", "name") // Fetch subject names
//       .sort(sortOptions)
//       .skip((page - 1) * limit)
//       .limit(Number(limit));

//     const totalTutors = await Tutor.countDocuments(query);

//     // Format response
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
//       subjects: tutor.subjects.map((subject) => subject.name),
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

    // 🎯 Search by name, username, bio, or description
    if (search) {
      const userSearchQuery = { 
        $or: [
          { name: { $regex: search, $options: "i" } }, // Search by name
          { username: { $regex: search, $options: "i" } }, // Search by username
        ],
      };

      // Find matching users first
      const users = await User.find(userSearchQuery).select("_id");
      const userIds = users.map(user => user._id);

      query.$or = [
        { userId: { $in: userIds } }, // Match user IDs from search
        { bio: { $regex: search, $options: "i" } }, // Match bio
        { description: { $regex: search, $options: "i" } }, // Match description
      ];
    }

    // 🎯 Filter by subject
    if (subject) {
      const subjectDoc = await Subject.findOne({ name: subject });
      if (subjectDoc) query.subjects = subjectDoc._id;
    }

    // 🎯 Filter by hourly rate
    if (minHourlyRate) query.hourlyRate = { ...query.hourlyRate, $gte: Number(minHourlyRate) };
    if (maxHourlyRate) query.hourlyRate = { ...query.hourlyRate, $lte: Number(maxHourlyRate) };

    // 🎯 Filter by rating
    if (minRating) query.rating = { ...query.rating, $gte: Number(minRating) };
    if (maxRating) query.rating = { ...query.rating, $lte: Number(maxRating) };

    // 🔀 Sorting logic
    const sortOptions = {};
    if (sortBy) {
      const validSortFields = ["hourlyRate", "rating", "name"];
      if (validSortFields.includes(sortBy)) {
        sortOptions[sortBy] = sortOrder === "desc" ? -1 : 1;
      }
    }

    // Fetch tutors with filters, sorting, and pagination
    const tutors = await Tutor.find(query)
      .populate("userId", "name profileImage email username") // Fetch user details
      .populate("subjects", "name") // Fetch subject names
      .sort(sortOptions)
      .skip((page - 1) * limit)
      .limit(Number(limit));

    const totalTutors = await Tutor.countDocuments(query);

    // Format response
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


// Update Tutor Profile

const updateTutorProfile = async (req, res) => {
  try {
    const tutorId = req.user.id; // Authenticated tutor's ID from token
    const { bio, description, hourlyRate, subjects, availability } = req.body;
    // let profileImage = req.file?.path; // Use the Cloudinary URL provided by multer
    console.log(typeof subjects);
    const updateFields = {};

    if (bio) updateFields.bio = bio;
    if (description) updateFields.description = description;
    if (hourlyRate) updateFields.hourlyRate = hourlyRate;
    if (availability) updateFields.availability = availability;
    // if (profileImage) updateFields.profileImage = profileImage;

    if (req.file) {
      const uploadResult = await cloudinary.uploader.upload(req.file.path, {
        folder: "tutor-profile-images", // Ensure the correct folder is used
      });
      updateFields.profileImage = uploadResult.secure_url;
      console.log("uploadResult:", uploadResult);
      // Update the database with the new URL
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

      // Update the subjects field in updateFields
      updateFields.subjects = subjectIds;
    }

    // Update the tutor profile

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

// Fetch a Specific Tutor's Profile
const getTutorProfile = async (req, res) => {
  try {
    const tutorId = req.user.id; // Authenticated tutor's ID from token

    // Fetch the tutor's details along with the related user and subjects
    const tutor = await Tutor.findOne({ userId: tutorId })
      .populate("userId", "name email phone profileImage")
      .populate("subjects", "name");

    if (!tutor) {
      return res.status(404).json({ message: "Tutor profile not found" });
    }

    // Format the response to include only public and necessary fields
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

// Fetch a Specific Tutor's Profile by Username
const getTutorByUsername = async (req, res) => {
  try {
    const { username } = req.params; // Get the username from the request params
    const user = await User.findOne({ username });

    if (!user) {
      return res
        .status(404)
        .json({ message: "Tutor with the given username not found" });
    }

    // Fetch the tutor details using the user's ID
    const tutor = await Tutor.findOne({ userId: user._id })
      .populate("userId", "name profileImage") // Include name and profile image of the tutor
      .populate("subjects", "name"); // Include the names of the subjects

    if (!tutor) {
      return res.status(404).json({ message: "Tutor profile not found" });
    }

    // Format the response to include only necessary fields
    const tutorProfile = {
      id: tutor._id,
      name: tutor.userId?.name || "N/A",
      profileImage: tutor.profileImage,
      bio: tutor.bio,
      username: tutor.userId?.username,
      description: tutor.description,
      hourlyRate: tutor.hourlyRate,
      rating: tutor.rating,
      subjects: tutor.subjects.map((subject) => subject.name), // Include subject names only
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
