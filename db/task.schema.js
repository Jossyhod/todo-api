const mongoose = require("mongoose");

const { Schema, Types } = mongoose;

const taskSchema = new Schema({
  title: {
    type: String,
    required: true,
  },
  text: {
    type: String,
    required: true,
  },

  user: { type: Schema.Types.ObjectId, ref: "Users" },

  date: Date,
});

const Task = mongoose.model("Task", taskSchema);

module.exports = Task;
