const router = require("express").Router();
const bcrypt = require("bcrypt");

const User = require("../models/User");
const Task = require("../models/Task");
const Comment = require("../models/Comment");
const Category = require("../models/Category");

async function userExists(username) {
  return (await User.findOne({ username })) ? true : false;
}

async function userExists(username, email) {
  return (await User.findOne({ username } || (await User.findOne({ email }))))
    ? true
    : false;
}

//CREATE
router.post("/", async (req, res) => {
  try {
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(req.body.password, salt);

    const newUser = User({
      username: req.body.username,
      email: req.body.email,
      password: hashedPassword,
    });

    const user = await newUser.save();
    res.status(201).json(user);
  } catch (err) {
    res.status(500).json({ Error: err.message });
  }
});

//UPDATE
router.put("/:username", async (req, res) => {
  try {
    if (await userExists(req.params.username)) {
      try {
        if (req.body.password) {
          const salt = await bcrypt.genSalt(10);
          req.body.password = await bcrypt.hash(req.body.password, salt);
        }
        const user = await User.findOne({ username: req.params.username });
        const updatedUser = await User.findByIdAndUpdate(
          user.id,
          {
            $set: req.body,
          },
          { new: true }
        );
        res.status(200).json(updatedUser);
      } catch (err) {
        res.status(500).json({ Error: err.message });
      }
    } else {
      res.status(404).json({ Error: "User not found." });
    }
  } catch (err) {
    res.status(500).json({ Error: err.message });
  }
});

//DELETE
router.delete("/:username", async (req, res) => {
  try {
    if (await userExists(req.params.username)) {
      const user = await User.findOne({ username: req.params.username });
      await user.delete();
      await Category.deleteMany({ userId: user._id });
      await Task.deleteMany({ userId: user._id });
      await Comment.deleteMany({ userId: user._id });
      res.status(200).json("User has been deleted.");
    } else {
      res.status(404).json({ Error: "User not found." });
    }
  } catch (err) {
    res.status(500).json({ Error: err.message });
  }
});

//GET
router.get("/:username", async (req, res) => {
  try {
    if (await userExists(req.params.username)) {
      const user = await User.findOne({ username: req.params.username });
      res.status(200).json(user);
    } else {
      res.status(404).json({ Error: "User not found." });
    }
  } catch (err) {
    res.status(500).json({ Error: err.message });
  }
});

//GET ALL
router.get("/", async (req, res) => {
  try {
    const users = await User.find();
    if (users.length === 0) res.status(404).json("No users found.");
    else res.status(200).json(users);
  } catch (err) {
    res.status(500).json({ Error: err.message });
  }
});

module.exports = router;
