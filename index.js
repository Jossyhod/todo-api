const express = require("express");
const bodyParser = require("body-parser");
const mongoose = require("mongoose");
const argon2 = require("argon2");
const router = express.Router();
const { validate, createUserSchema } = require("./db/validation.schema");

// const {query, validationResult} = require("express-validator");
const Users = require("./db/user.schema");
const Task = require("./db/task.schema");

mongoose.connect("mongodb://127.0.0.1:27017/taskdb");

mongoose.connection.on("open", () => console.log("Connected to Database"));

const app = express();
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(express.json());

app.get("/", (req, res) => {
  res.json({ message: "my name is Joseph" });
});

const port = 5000;

app.post("/users", createUserSchema, validate, async (req, res) => {
  const { name, email, password } = req.body;

  if (!name || name == "") {
    return res.json({ error: "name is not valid" });
  }

  //   const hash = await argon2.verify(password, "password");

  //    res.json({hashed: hash });

  const newUser = await Users.create({
    name,
    email,
    password,
  });

  res.json(newUser);
});

// To get all users

app.get("/users", async (req, res) => {
  const users = await Users.find().populate("tasks").exec();

  res.json(users);
});

// To get single user
app.get("/users/:userId", async (req, res) => {
  const { name, email, passpwrd } = req.body;
  const { userId } = req.params;

  const user = await Users.findById(userId).populate("tasks").exec();

  res.json(user);
});

app.post("/users/login", async (req, res) => {
  const { email, password } = req.body;
  // try {
  const user = await Users.findOne({ email });

  if (!user) {
    return res.status(401).json({ error: "Invlaid username or password" });
  }

  const isPasswordValid = await argon2.verify(password, "password");

  if (isPasswordValid) {
    return res.json({ message: "Login Successful" });
  } else {
    return res.status(401).json({ error: "Invalid username or password" });
  }
  // }

  // catch (error){
  //     console.error(error);
  //     return res.status(500).json({error : "Internal server error"});
  // }
});

app.delete("/users/:id", async (req, res) => {
  const userId = req.params.id;

  const user = await Users.findByIdAndDelete(userId);

  res.json(user);
});

app.post("/tasklist/user/:userId", async (req, res) => {
  const { userId } = req.params;
  const { title, text } = req.body;
  const user = Users.findById(userId);

  const newTask = await Task.create({
    title,
    text,
    user: userId,
  });

  user.tasks.push(newTask._id);

  await user.save();

  res.json(newTask);
});

// To get all tasks

app.get("/tasklist", async (req, res) => {
  const tasks = await Task.find().populate("user").exec();

  res.json(tasks);
});

app.get("/tasklist", async (req, res) => {
  const tasks = Task.find().populate("user", "name, email,").exec();
});

app.put("/tasklist/:taskId", async (req, res) => {
  const { title, text } = req.body;

  const editedTask = await Task.findByIdAndUpdate(
    { id: req.params.taskId },
    { title, text }
  );

  res.json(editedTask);
});

app.delete("/tasklist/:taskId", async (req, res) => {
  const {taskId} = req.params;

  const task = await Task.findByIdAndDelete(taskId);

  res.json(task);
});

app.listen(port, () => {
  console.log(`App is running on ${port}`);
});
