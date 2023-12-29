const {body, validationResult} = require("express-validator");

 const validate = (req, res, next) => {
    const errors = validationResult(req);

    if(!errors.isEmpty()){
        return res.status(400).json({errors: errors.array()});
    }

    next();
};

const createUserSchema = [
    body("email").isEmail().withMessage("Please provide a valid email"),
    body("name").isString(),
    body("password").isLength({min : 8}).exists(),
];

const createTaskSchema = [
    body("title").isString().isLength({min : 3, max: 15}).exists(),
    body("text").isString().isLength({min : 1}).exists(),
];



module.exports = {validate, createUserSchema, createTaskSchema};

