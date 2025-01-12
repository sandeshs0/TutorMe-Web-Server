const bcrypt = require("bcrypt");
const Credentials = require("../model/credential");
const SECRET_KEY= "c597cfe12544544faa9f04ef0860c5882dd30a5dbd65b567c6a511504823cdd5";
const jwt= require("jsonwebtoken");

const register = async(req,res)=>{
    const {username, password,role}=req.body;
    const hashedPassword=await bcrypt.hash(password,10);
    const cred= new Credentials({username,password:hashedPassword,role});
    cred.save();
    res.status(201).json(cred);
};

const login = async(req,res)=>{
    const {username, password}=req.body;
    const cred=await Credentials.findOne({username});
    if(!cred || !(await bcrypt.compare(password,cred.password))){
        return res.status(403).json({message:"Invalid Credentials"});
    }
    const token =jwt.sign({username,role:cred.role},SECRET_KEY,{expiresIn:"1h"});
    res.status(200).json({token});
};

module.exports={register,login};