const joi=require("joi");

const userSchema = joi.object({
    name: joi.string().required(),
    email: joi.string().email().required(),
    phone: joi.string().required(),
    password: joi.string().required(),
    role: joi.string().valid("student", "tutor").required(),
    bio: joi.when("role", { is: "tutor", then: joi.string().required(), otherwise: joi.forbidden() }),
    description: joi.when("role", { is: "tutor", then: joi.string().required(), otherwise: joi.forbidden() }),
    hourlyRate: joi.when("role", { is: "tutor", then: joi.number().required(), otherwise: joi.forbidden() }),
    subjects: joi.when("role", { is: "tutor", then: joi.array().items(joi.string()).required(), otherwise: joi.forbidden() }),
});

function validateUser(req, res, next) {
    const { error } = userSchema.validate(req.body);
    if (error) {
        return res.status(400).json({ message: error.details[0].message });
    }
    next();
}


module.exports=validateUser;