import mongoose from 'mongoose'
import bcrypt from 'bcrypt'
import jwt from 'jsonwebtoken'
import crypto from 'crypto'
import validator from 'validator'

const schema=new mongoose.Schema({
    name:{
        type:String,
        required:[true,"Enter Your Name"]
    },
    email:{
        type:String,
        required:[true,'Enter Your Email'],
        unique:true,
        validate:validator.isEmail,
    },
    password:{
        type:String,
        required:[true,"Enter Your Password"],
        minLength:[6,'must be 6 or more'],
        select:false,   
    },
    bio:{
        type:String
    },

    avatar: {
        public_id: String,
        url: String,
    },
    posts: [
        {
          type: mongoose.Schema.Types.ObjectId,
          ref: "Post",
        },
    ],
    followers: [
        {
          type: mongoose.Schema.Types.ObjectId,
          ref: "User",
        },
    ],
    following: [
        {
          type: mongoose.Schema.Types.ObjectId,
          ref: "User",
        },
    ],

    resetPasswordToken: String,
    resetPasswordExpire: Date,
})

schema.pre('save',async function(next){
    if(!this.isModified('password'))return next()
    this.password=await bcrypt.hash(this.password,10)
})

schema.methods.getJWTToken=function (){
    return jwt.sign({_id:this._id},process.env.JWT_SECRET,{
        expiresIn:'10d',      
    })
}

schema.methods.comparePassword=async function(password){
    return await bcrypt.compare(password,this.password)
}

schema.methods.getResetToken=function(){
    const resetToken=crypto.randomBytes(20).toString('hex')
    
    this.resetPasswordToken=crypto
    .createHash('sha256')
    .update(resetToken)
    .digest('hex')
    
    this.resetPasswordExpire=Date.now()+15*60*1000
    
    return resetToken
    }

export const User=mongoose.model('User',schema)