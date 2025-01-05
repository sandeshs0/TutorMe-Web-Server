const joi=require("joi");

const userSchema=joi.object({
    name:joi.string().required(),
    email:joi.string().email().required(),
    phone:joi.string().required(),
    password:joi.string().required(),
});

function validateUser(req,res,next){
    const {name,email,phone,password}=req.body;
    const{error}=userSchema.validate({name,email,phone,password});
    if (error){
        return res.json(error)
    }
    next();
}

module.exports=validateUser;