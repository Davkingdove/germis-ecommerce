import mongoose from "mongoose";
import bcrypt from "bcryptjs";

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true,"Name is Required"]
  },
  email: {
    type: String,
    required: [true,"Email is Required"],
    lowercase:true,
trim:true
},
  password: {
    type: String,
    required: [true,"Password is required"],
    minlength: [6, "Password must be at least 6 characters long"],
  },
  cartItems: [
    {
      product: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Product",
        required: true,
      },
      quantity: {
        type: Number,
        required: true,
        min: 1,
      },
    },
  ],
  role: {
    type: String,
    enum: ["user", "admin"],
    default: "user",
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
}); 
// pre save hook to hash password before saving
userSchema.pre("save",async function(next){
  if(!this.isModified("password")) return next();
  try{
    const salt=await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  }catch(error){
    next(error);
  }
});
// method to compare entered password with hashed password
userSchema.methods.comparePassword = async function(candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.password);
};
const User = mongoose.model("User",userSchema);
export default User;
