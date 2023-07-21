import mongoose from "mongoose";
const Schema = mongoose.Schema;
import validator from 'validator';

const variantSchema = new Schema({
  name: {
    type: Number,
    required: true,
  },
  isNotified: {
    type: Boolean,
    default: false,
  },
  user: [{ // Change 'user' to an array of objects
    email: {
      type: String,
      required: [true, "User email is required"],
      validate: [validator.isEmail, "Please enter a valid email"]
    }
  }],
  // Add other variant properties here
});
const ProductSchema = new Schema(
  {
    productId: {
      type: Number,
      required: true,
    },
    shopId: {
      type: Number,
      required: true,
    },
    variants: [variantSchema],   
  },
  { timestamps: true }
);
export default mongoose.model("Product", ProductSchema);