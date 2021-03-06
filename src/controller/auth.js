const bcrypt = require("bcrypt");
const Joi = require("joi");
const { User } = require("../models/auth");
const jwt = require("jsonwebtoken");
const shortid = require("shortid");
// signup
const signup = async (req, res) => {
  // validatsiya qilish
  const { error } = validateUser(req.body);
  if (error) {
    return res.status(404).send(error.message);
  }
  // email bo`yicha tekshirish
  let user = await User.findOne({ email: req.body.email });
  if (user) return res.status(400).send("Bu email oldin ro`yxatdan o`tgan");
  // destructing assigment
  let { firstName, lastName, email, password, role } = req.body;
  // passwordni hashlash
  let hash_password = await bcrypt.hash(password, 10);
  // yangi user qo`shish
  let newUser = new User({
    firstName,
    lastName,
    email,
    hash_password,
    userName: shortid.generate(),
    role,
  });
// yangi userni saqlash
  newUser.save((error, data) => {
    if (error) {
      console.log(error);
      return res.status(400).json({ message: "User saqlanmadi" });
    }
    if (data) {
      return res.status(201).json({ message: "User saqlandi" });
    }
  });
};
// qo`shilmoqchi bo`lgan yuzerni validatsiya qilish ya`ni tekshirish
function validateUser(user) {
  try {
    const userSchema = Joi.object({
      firstName: Joi.string().min(3).max(20).required(),
      lastName: Joi.string().min(3).max(20).required(),
      userName: Joi.string().required(),
      email: Joi.string().required().email(),
      password: Joi.string().min(4).required(),
    });
    return userSchema.validate(user);
  } catch (error) {
    console.log("5 error");
  }
}
// signin

const signin = async (req, res) => {
  try {
    // validatsiya qilish
    const { error } = validate(req.body);
    if (error) return res.status(400).send(error.message);
    // emailni tekshirish
    let user = await User.findOne({ email: req.body.email });
    if (!user) {
      return res.status(400).send("Email xato!!!");
    } else {

      let password = await user.authentification(req.body.password);
      if (!password) {
        return res.status(400).send("Parol xato!!!");
      }
      const token = jwt.sign({ _id: user._id, role: user.role }, process.env.SECRET, {expiresIn: `1d`,});
      const {firstName, lastName, fullName, email, role} = user;
      res.status(200).json({ token, user:{firstName, lastName, fullName, email, role} });
    } 

  } catch (error) {
    console.log(error);
  }
};

function validate(req) {
  const schema = Joi.object({
    email: Joi.string().min(5).max(255).required().email(),
    password: Joi.string().min(5).max(255).required(),
  });

  return schema.validate(req);
}

module.exports = {
  signup: signup,
  signin: signin,
};
