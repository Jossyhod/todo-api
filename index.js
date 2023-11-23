const express = require("express");
const bodyParser = require("body-parser");
const mongoose = require("mongoose");
const argon2 = require("argon2");
const router = express.Router();
const cors = require("cors");

const {
  validate,
  createUserSchema,
  createTaskSchema,
} = require("./db/validation.schema");

// const {query, validationResult} = require("express-validator");
const Users = require("./db/user.schema");
const Task = require("./db/task.schema");

mongoose.connect("mongodb://127.0.0.1:27017/taskdb");

mongoose.connection.on("open", () => console.log("Connected to Database"));

const app = express();
app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(express.json());

app.get("/", (req, res) => {
  res.json({ message: "my name is Joseph" });
});

const port = 5000;

// app.post("/users", createUserSchema, validate, async (req, res) => {
//   const { name, email, password } = req.body;

//   if (!name || name == "") {
//     return res.json({ error: "name is not valid" });
//   }

//   //   const hash = await argon2.hash("password");

//   //    res.json({hashed: hash });

//   const newUser = await Users.create({
//     name,
//     email,
//     password,
//   });

//   res.json(newUser);
// });

app.post("/signup", createUserSchema, validate, async (req, res) => {
  const { name, email, password } = req.body;

  // Validate if email has been taken
  const emailExist = await Users.findOne({
    email,
  });

  if (emailExist) {
    return res.status(409).json({ message: "Email Already Exist", data: null });
  }
  const hash = await argon2.hash(password);

  const signUp = await Users.create({
    name,
    email,
    password: hash,
  });
  delete signUp.password;
  return res
    .status(201)
    .json({ message: "Succesfully Registered", data: signUp });
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

app.post("/login", async (req, res) => {
  const { email, password } = req.body;

  const user = await Users.findOne({ email });

  if (!user) {
    return res.status(401).json({ error: "Invlaid email or password" });
  }

  const isPasswordValid = await argon2.verify(user.password, password);

  if (!isPasswordValid) {
    return res.status(401).json({ error: "Invalid email or password" });
  }

  delete user.password;
  return res.status(200).json({ message: "Login was Successful", data: user });
});

app.delete("/users/:id", async (req, res) => {
  const userId = req.params.id;

  const user = await Users.findByIdAndDelete(userId);

  res.json(user);
});

app.post(
  "/tasklist/user/:userId",
  createTaskSchema,
  validate,
  async (req, res) => {
    const { userId } = req.params;
    const { title, text } = req.body;
    const user = await Users.findById(userId);
    console.log(user);

    const newTask = await Task.create({
      title,
      text,
      user: userId,
    });

    user.tasks.push(newTask._id);

    await user.save();

    res.json(newTask);
  }
);

// To get all tasks

app.get("/tasklist", async (req, res) => {
  const tasks = await Task.find().populate("user", "name email").exec();

  res.json(tasks);
});

app.get("/tasklist/:userId", async (req, res) => {
  const { userId } = req.params;

  const tasks = await Task.find({ user: userId })
    .populate("user", "name email")
    .exec();

    return res.status(200).json({ message: "Successful", data : tasks });

});

app.put("/tasklist/:taskId", createTaskSchema, validate, async (req, res) => {
  const { title, text } = req.body;

  const editedTask = await Task.findByIdAndUpdate(
    { id: req.params.taskId },
    { title, text }
  );

  res.json(editedTask);
});

app.delete("/tasklist/:taskId", async (req, res) => {
  const { taskId } = req.params;

  const task = await Task.findByIdAndDelete(taskId);

  res.json(task);
});

app.listen(port, () => {
  console.log(`App is running on ${port}`);
});
