import mongoose from "mongoose";
const schema=new mongoose.Schema({
    description:String,
    owner:{
        type:mongoose.Schema.Types.ObjectId,
        ref:"User",
    },
    createdAt:{
        type:Date,
        default:Date.now,
    }
})

export const Post=mongoose.model('Post',schema)