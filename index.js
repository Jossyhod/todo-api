const express = require("express");
const bodyParser = require("body-parser");
const mongoose = require("mongoose");
const argon2 = require("argon2");
const router = express.Router();
const cors = require("cors");
const jwt = require("jsonwebtoken");
require("dotenv").config();

const {
  validate,
  createUserSchema,
  createTaskSchema,
} = require("./utils/validation.schema");

// const {query, validationResult} = require("express-validator");
const Users = require("./model/user.schema");
const Task = require("./model/task.schema");
const RefreshToken = require("./utils/refresh.schema");

mongoose.connect(process.env.DATABASE_URL);

mongoose.connection.on("open", () => console.log("Connected to Database"));

const app = express();
app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(express.json());

app.get("/", (req, res) => {
  res.json({ message: "my name" });
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
  const { userId } = req.params;

  const user = await Users.findById(userId).populate("tasks").exec();

  if (!user) {
    return res.status(400).json({ message: "User not found", data: user });
  }

  delete user.password;

  return res.status(200).json({ message: "Successful", data: user });
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

//   const payload =
//   {
//     id: user._id,
//     email: user.email
//   }

//   const accessToken = generateAccessToken(payload);
//   const refreshToken = refreshAccessToken(payload);

//   await RefreshToken.create({
//     token : refreshToken,
//     id : user._id
//   });

// res.json({accessToken, refreshToken});

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
    console.log(req.body);

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

  return res.status(200).json({ message: "Successful", data: tasks });
});

app.put("/tasklist/:taskId", createTaskSchema, validate, async (req, res) => {
  // var id = new mongoose.Types.ObjectId(req.params.taskId);
  const { title, text } = req.body;

  const editedTask = await Task.findByIdAndUpdate(
    { _id: req.params.taskId },
    { title, text },
    { new: true }
  );

  res.json(editedTask);
});

app.delete("/tasklist/:taskId", async (req, res) => {
  const { taskId } = req.params;

  const task = await Task.findByIdAndDelete(taskId);

  res.json(task);
});

// Check if the user credentials are correct
// on login create a token for the user and sends to frontend
// authenticate the token for a particular user using the token secret
// refresh user token after a given time.
// when both token and refresh token expires server logs user out.

function authenticateToken(req, res, next) {
  const authHeader = req.headers["authorization"];

  const token = authHeader && authHeader.split("")[1];
  if(token === null) return res.sendstatus(401);
  jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, (err, user) => {
    if(err) return res.sendstatus(401);
      
    req.user = user

    next();
  })

}


app.listen(port, () => {
  console.log(`App is running on ${port}`);
});

// app.post("/test/:userId", async(req, res) => {
//  console.log("Body", req.body);
//  console.log("Query", req.query);
//  console.log("Param", req.params);

// });
