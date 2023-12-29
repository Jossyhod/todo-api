const router = require("express").Router();
const { User } = require("../models/user");
const {
  generateAccessToken,
  generateRefreshToken,
} = require("../utils/generateAuthToken");
const { loginValidation } = require("../validators/auth");
const bcrypt = require("bcrypt");

router.post("/login", async (req, res) => {
  try {
    const { error } = loginValidation(req.body);
    if (error) {
      res.status(400).send({ message: error.details[0].message });
    }

    const user = await User.findOne({ email: req.body.email });

    if (!user) {
      return res.status(401).send({ message: "Invalid Credentials" });
    }

    const validPassword = await bcrypt.compare(
      req.body.password,
      user.password
    );

    if (!validPassword) {
      return res.status(401).send({ message: "Invalid Credentials" });
    }

    const accessToken = generateAccessToken(user._id);
    const refreshToken = generateRefreshToken(user._id);
    const data = { accessToken, refreshToken };

    res.status(200).send({ data, message: "Logged in successfully" });
  } catch (err) {
    console.log(err);
    res.status(500).send({ message: "Internal Server Error" });
  }
});

module.exports = router;
