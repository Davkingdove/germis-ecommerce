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
export const refreshToken=async (req,res)=>{
    try {
        const refreshToken=req.cookies.refreshToken;
        if(!refreshToken) return res.status(401).send("Refresh token not found");
        const decoded=jwt.verify(refreshToken,process.env.REFRESH_TOKEN_SECRET);
        const storedToken=await redis.get(`refresh_token:${decoded.userId}`);
        if(storedToken !== refreshToken) return res.status(403).json({message:"Invalid refresh token"});
        
        const accessToken=jwt.sign({userId:decoded.userId},process.env.ACCESS_TOKEN_SECRET,{expiresIn:'15m'});
        res.cookie("accessToken",accessToken,{httpOnly:true
            ,secure:process.env.NODE_ENV==="production",
            sameSite:"strict",
            maxAge:15*60*1000 // 15 minutes
        });
        res.json({message:"Tokens refreshed successfully"});
    } catch (error) {
        console.log("Error in refresh token controller :"+error.message )
        res.status(500).json({message:error.message});
    }
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
  try {
  const {email,password}=req.body
  const user=await User.findOne({email})
  if(user && (await user.comparePassword(password))){
const {accessToken,refreshToken}=await generateTokens(user._id);
await storeRefreshTokens(user._id,refreshToken);
setCookies(res,accessToken,refreshToken);
    return res.status(200).json({user :{id:user._id,email:user.email,name:user.name,role:user.role},
    message:"Login successful"});
  }
  else{
  res.status(400).send("Invalid email or password");
  }
} catch (error) {
  console.log("Error in login controller :"+error.message )
  res.status(500).json({message:error.message});
}
};
export const logout = async (req, res) => {
try { 
  const refreshToken  =req.cookies.refreshToken;
  if(!refreshToken) return res.status(400).send("Refresh token not found");
  const decoded=jwt.verify(refreshToken,process.env.REFRESH_TOKEN_SECRET);
  await redis.del(`refresh_token:${decoded.userId}`);
  res.clearCookie("accessToken");
  res.clearCookie("refreshToken");
  res.json({message:"Logout successful"});
} catch (error) {
  console.log("Error in logout controller :"+error.message )
  res.status(500).json({message:error.message});
}  
};
