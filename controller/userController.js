const user=require("../model/user");

const getAll= async (req,res)=>{
    try{
        const users= await user.find();
        res.status(200).json(users);
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


module.exports = { getAll, create };