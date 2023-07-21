import mongoose from "mongoose";
import validator from 'validator';
const Schema = mongoose.Schema;

const userSchema = mongoose.Schema(
  {
    email: {
      type: String,
      required: [true,"Email is required"],
      validate: [validator.isEmail,"Please enter a valid email"]
    },
    products: [{
      type: Number,
      required: true,
    },],
  },
  { timestamps: true }
);

const User = mongoose.model("User", userSchema);

export default User;