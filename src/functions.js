import jwt from "jsonwebtoken";
import bcrypt from "bcrypt";
import { validationResult } from "express-validator";
import UserModel from "./user.js";
import { registerValidation } from "./auth.js";

export const register = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json(errors.array());
    }

    const password = req.body.password;
    const salt = await bcrypt.genSalt(10);
    const hash = await bcrypt.hash(password, salt);

    const doc = new UserModel({
      email: req.body.email,
      fullname: req.body.fullname,
      phone: req.body.phone || "00000",
      avatarUrl: req.body.avatarUrl || "",
      passwordHash: hash
    });

    const user = await doc.save();

    const token = jwt.sign(
      {
        _Id: user.id
      },
      "kluch",
      {
        expiresIn: "30d"
      }
    );

    res.json({ user, token });

    const { passwordHash, ...userData } = user._doc;

    res.json({ userData, token });
  } catch (err) {}
};

export const login = async (req, res) => {
  try {
    const user = await UserModel.findOne({ email: req.body.email });
    if (!user) {
      return res.status(400).json({
        Message: "nema takoho user`a"
      });
    }

    const isValidPass = await bcrypt.compare(
      req.body.password,
      user._doc.passwordHash
    );
    if (!isValidPass) {
      return res.status(400).json({
        message: "wrong log or pass"
      });
    }

    const token = jwt.sign(
      {
        _Id: user.id
      },
      "kluch",
      {
        expiresIn: "30d"
      }
    );

    res.json({ user, token });
  } catch (err) {
    console.log(err);
    res.status(500).json({
      message: "shos pishlo ne tak"
    });
  }
};

export const edit = async (req, res) => {
  try {
    const user = await UserModel.findOneAndUpdate(
      { email: req.body.email },
      {
        avatarUrl: req.body.avatarUrl,
        phone: req.body.phone,
        fullname: req.body.fullname
      }
    );

    res.json({
      succes: true
    });
  } catch (err) {
    console.log(err);
    res.status(500).json({
      message: "shos pishlo ne tak"
    });
  }
};

export const getMe = async (req, res) => {
  try {
    const user = await UserModel.findById(req.userId);

    if (!user) {
      return res.status(404).json({
        message: "no such user"
      });
    }

    res.json({ user });
  } catch (err) {
    console.log(err);
    res.status(500).json({
      message: "shos pishlo ne tak"
    });
  }
};
