import User from "../models/user.model.js"
import jwt from "jsonwebtoken";
import {redis} from "../lib/redis.js"

const generateTokens=(userId)=>{
    const accessToken=jwt.sign({userId},process.env.ACCESS_TOKEN_SECRET,{expiresIn:'15m'});
    const refreshToken =jwt.sign({userId},process.env.REFRESH_TOKEN_SECRET,{expiresIn:'7d'});
    return {accessToken,refreshToken};
};
const storeRefreshTokens= async (userId, refreshToken) => {
   await redis.set(`refresh_token:${userId}`,refreshToken,"EX",60*60*24*7);
};
const setCookies=(res,accessToken,refreshToken)=>{
    res.cookie("accessToken",accessToken,{httpOnly:true
        ,secure:process.env.NODE_ENV==="production",
        sameSite:"strict",
        maxAge:15*60*1000 // 15 minutes 
    });
    res.cookie("refreshToken",refreshToken,{httpOnly:true,
        secure:process.env.NODE_ENV==="production",
        sameSite:"strict",
        maxAge:7*24*60*60*1000 // 7 days
    });
};
export const signup = async (req, res) => {
  // Handle signup logic here
  const {email,password,name}=req.body
  try {
  const userExist=await User.findOne({email})
  if(userExist) return res.status(400).send("User already exists");
const user=await User.create({name,email,password})
// authenticate
const {accessToken,refreshToken}=await generateTokens(user._id);
await storeRefreshTokens(user._id,refreshToken);
setCookies(res,accessToken,refreshToken);
  res.status(201).json({user :{id:user._id,email:user.email,name:user.name,role:user.role},
    message:"Signup successful"});
  } catch (error) {
    console.log("Error in singn up controller :"+error.message )
    res.status(500).json({message:error.message});
  }
};
export const login = async (req, res) => {
  // Handle login logic here
  const {email,password}=req.body
  const user=await User.findOne({email})
  if(!user) return res.status(400).send("User not found");
  const isMatch=await user.comparePassword(password)
  if(!isMatch) return res.status(400).send("Invalid credentials");
  res.send("Login successful");
};
export const logout = async (req, res) => {
    res.send("Logout successful");
};
