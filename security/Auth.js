const jwt= require("jsonwebtoken");

const SECRET_KEY= "c597cfe12544544faa9f04ef0860c5882dd30a5dbd65b567c6a511504823cdd5";

function authenticateToken(req,res,next){
    const token=req.header('Authorization')?.split(' ')[1];
    if(!token){
        res.status(401).send("Access Denied: No Token Provided");
    }

    try{
    const verified=jwt.verify(token,SECRET_KEY);
    req.user=verified;
    next();
    }catch(e){
        res.status(400).send("Invalid Token");
    }
}

function authorizeRole(role){
    return (req,res,next)=>{
        if(req.user.role!==role){
            return res.status(403).send("You are not authorized to access this resource");
        }
        next();
    }
}

module.exports={authenticateToken, authorizeRole};