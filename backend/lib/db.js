// import mongoose from 'mongoose'
// export const connectDB = async () => {
//   try {
//    const conn= await mongoose.connect(process.env.MONGO_URI)
//     console.log("MongoDB connected")
//   } catch (error) {
//     console.error("MongoDB connection failed:", error)
//     process.exit(1)
//   }
// }
// //import express from "express"
import mongoose from "mongoose";

export const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGO_URI);
    console.log(`MongoDB Connected: ${conn.connection.host}`);
  } catch (error) {
    console.error("MongoDB connection failed:", error);
    process.exit(1);
  }
}
