import { catchAsyncError } from '../middlewares/catchAsyncError.js'
import {Post} from '../models/Post.js'
import {User} from '../models/User.js'
import ErrorHandler from '../utils/errorHandler.js'

// creating new post
export const createPost=catchAsyncError(async(req,res,next)=>{
    const newPost={
        description:req.body.description,
        owner:req.user._id
    }
    const post=await Post.create(newPost)
    const user=await User.findById(req.user._id)
    user.posts.unshift(post._id)
    await user.save()
    res.status(201).json({
        success:true,
        message:"Post Created"
    })
})

// deleting post
export const deletePost=catchAsyncError(async(req,res,next)=>{
    const {post}=await Post.findById(req.params.id)
    if(!post) return next(new ErrorHandler("Not found",404))
    if(post.owner.toString()!==req.user._id.toString()){
        return res.status(401).json({
            success:false,
            message:"Unauthorised",
        })
    }
    await post.remove()
    const user=await User.findById(req.user._id)
    const index=user.posts.indexOf(req.params.id)
    user.posts.splice(index,1)
    await user.save()
    res.status(200).json({
        success:true,
        message:'Post Deleted'
    })
})

// post of user following
export const getPostOfFollowing=catchAsyncError(async(req,res,next)=>{
    const user=await User.findById(req.user._id)
    const posts=await Post.find({
        owner:{
            $in:user.following
        },
    }).populate('owner')
    res.status(200).json({
        success:true,
        posts:posts.reverse()
    })
})

// update description
export const updateDescription=catchAsyncError(async(req,res,next)=>{
    const post=await Post.findById(req.params.id)
    if(!post) next(new ErrorHandler('Not Found',404))
    if(post.owner.toString()!==req.user._id.toString()){
        return next(new ErrorHandler('Unauthorised',401))
    }
    post.description=req.body.description
    await post.save()
    res.status(200).json({
        success:true,
        message:'Post Updated'
    })
})
