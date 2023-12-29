const mongoose = require("mongoose");
const jwt = require("jsonwebtoken");

const generateAccessToken = (userId) =>
  jwt.sign({ id: userId }, process.env.JWT_SECRET, {
    expiresIn: process.env.ACCESS_TOKEN_EXPIRY,
  });

const generateRefreshToken = (userId) =>
  jwt.sign({ id: userId }, process.env.JWT_SECRET, {
    expiresIn: process.env.REFRESH_TOKEN_EXPIRY,
  });

module.exports = { generateAccessToken, generateRefreshToken };



const Schema  = mongoose.Schema;

const refreshToken = new Schema({
    token : String,
    user : {type : Schema.Types.ObjectId, ref: "Users"}

});

const RefreshToken = mongoose.model("RefreshToken", refreshToken);

module.exports = {RefreshToken};


