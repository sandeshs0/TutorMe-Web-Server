const Tutor= require('../model/tutor');

const getAll= async (req,res)=>{
    try{
        const tutors= await Tutor.find();
        res.status(200).json(tutors);
    }catch(e){
        res.status(500).json({ message: error.message });
    }
};

// Get tutor by ID
const getById= async (req,res)=>{
    try {
        const tutor = await Tutor.findById(req.params.id);
        if (!tutor) {
            return res.status(404).json({ message: "Tutor not found" });
        }
        res.status(200).json(tutor);
    }catch(e){
        res.status(500).json({ message: error.message });
    }
};

// Create tutor
const create = async (req, res) => {
    try {
        const { userId, bio,description, hourlyRate, subjects } = req.body;
        const tutor = new Tutor({ 
            userId,
             image:req.file.originalname,
              bio,
               description,
                hourlyRate,
                 subjects });
        await tutor.save();
        res.status(201).json(tutor);
    } catch (error) {
        if (error.code === 11000) {
            return res.status(400).json({ message: "Duplicate entry: " + error.message });
        }
        res.status(400).json({ message: error.message });
    }
};

// Update tutor
const update = async (req, res) => {
    try {
        const tutor = await Tutor.findByIdAndUpdate(req.params.id, req.body, { new: true });
        if (!tutor) {
            return res.status(404).json({ message: "Tutor not found" });
        }
        res.status(200).json(provider);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// Delete tutor
const deleteById = async (req, res) => {
    try {
        const tutor = await Tutor.findByIdAndDelete(req.params.id);
        if (!tutor) {
            return res.status(404).json({ message: "Tutor not found" });
        }
        res.status(200).json({ message: "Tutor deleted successfully" });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

module.exports = {
    getAll,
    getById,
    create,
    update,
    deleteById
};