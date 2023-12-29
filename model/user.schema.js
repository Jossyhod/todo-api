const mongoose = require("mongoose");

const { Schema, Types } = mongoose;

const userSchema = new Schema({
  name: {
    type: String,
    required: true,
  },

  email: {
    type: String,
    unique: true,
  },

  password: {
    type: String,
    min: 8,
  },

  tasks: [{ type: Schema.Types.ObjectId, ref: "Task" }],
});

const Users = mongoose.model("Users", userSchema);

module.exports = Users;
