const user=require("../model/user");

const getAll= async (req,res)=>{
    try{
        const users= await user.find();
        res.status(200).json(users);
    }catch(e){
        res.status(500).json({ message: error.message });
    }
};

const getById= async (req,res)=>{
    try {
        const user = await user.findById(req.params.id);
        if (user == null) {
            return res.status(404).json({ message: "User not found" });
        }
        res.status(200).json(user);
    }catch(e){
        res.status(500).json({ message: error.message });
    }
};

const create = async (req, res) => {
    console.log("Request Body:", req.body);
    try {
        const { name, email, phone, password, role } = req.body;
        const user = new User({name, email, phone, password, role});

        await user.save();
        console.log("User Saved:", user);

        res.status(201).json(user);
    } catch (error) {
        console.error("Error saving user:", error);
        if (error.code === 11000) {
            return res.status(400).json({ message: "Email or phone number already exists" });
        }
        res.status(400).json({ message: error.message });
    }
};

// Update method
const update = async (req, res) => {
    try{
        const user = await User.findByIdAndUpdate(req.params.id, req.body, { new: true }); 
        if(!user){
            return res.status(404).json({ message: "User not found" });
        }
        res.status(200).json(user);
    }catch(error){
        res.status(500).json({ message: error.message });
    }
};

// Delete method
const deleteById = async (req, res) => {
    try{
        const user = await User.findByIdAndDelete(req.params.id);
        if(!user){
            return res.status(404).json({ message: "User not found" });
        }
        res.status(200).json({ message: "User deleted successfully" });
    }catch(error){
        res.status(500).json({ message: error.message });
    }
};




module.exports = {
    getAll,
    create,
    getById,
    update,
    deleteById };