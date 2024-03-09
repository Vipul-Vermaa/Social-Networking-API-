import {catchAsyncError} from '../middlewares/catchAsyncError.js'
import ErrorHandler from '../utils/errorHandler.js'
import {User} from '../models/User.js'
import {Post} from '../models/Post.js'
import cloudinary from 'cloudinary'
import getDataUri from '../utils/dataUri.js'

// creating new user
export const register=catchAsyncError(async(req,res,next)=>{
    const {name,email,password}=req.body
    const file=req.file

    if(!name || !email || !password || !file)
    return next(new ErrorHandler('PLease Enter all Fields',400))
    let user=await User.findOne({email})
    if (user) return next(new ErrorHandler('User already Exist',400))

    const fileUri=getDataUri(file)
    const mycloud=await cloudinary.v2.uploader.upload(fileUri.content)

    user=await User.create({
        name,email,password,
        avatar:{
            public_id:mycloud.public_id,
            url:mycloud.secure_url
        },
        })
        sendToken(res,user,'Registered Successfully',201)
})

// user login
export const login=catchAsyncError(async(req,res,next)=>{
    const {email,password}=req.body
    if( !email || !password)
    return next(new ErrorHandler('Enter all fields',400))
    const user=await User.findOne({email}).select('+password')
    if (!user) return next(new ErrorHandler('Incorrect Email or Password',401)) 
    const isMatch=await user.comparepassword(password)
    if (!isMatch) return next(new ErrorHandler('Incorrect Email or Password',401))
    sendToken(res,user,`Welcome Back,${user.name}`,200)
})

// user logout
export const logout=catchAsyncError(async(req,res,next)=>{
    res.status(200).cookie('token',null,{
        expires:new Date(Date.now()),
        httpOnly:true,
        secure:true,
        sameSite:'none'
    }).json({
        success:true,
        message:'Logged out'
    })
})

// user/owner profile
export const getMyProfile=catchAsyncError(async(req,res,next)=>{
    const user=await User.findById(req.user._id).populate("posts followers following")
    res.status(200).json({
        success:true,
        user,
    })
})

// updatepassword
export const changePassword=catchAsyncError(async(req,res,next)=>{
    const {oldPassword,newPassword}=req.body
    if(!oldPassword || !newPassword) return next(new ErrorHandler("Enter All Field",400))
    const user=await User.findById(req.user._id).select("+password")
    const isMatch=await user.comparepassword(oldPassword)
    if(!isMatch) return next(new ErrorHandler('Incorrect',400))
    user.password=newPassword
    await user.save()
    res.status(200).json({
    success:true,
    message:"Password Changed Successfully"
})
})

// forgetpassword
export const forgetPassword=catchAsyncError(async(req,res,next)=>{
    const {email}=req.body
    const user=await User.findOne({email})
    if(!user) return next(new ErrorHandler("Not Found",400))
    const resetToken=await user.getResetToken()
    await user.save()
    const url=`${process.env.FRONTEND_URL}/resetpassword/${resetToken}`
    const message=`Click on the link to reset your password. ${url}.If you
    have not request,please ignore.`
    await sendEmail(user.email,"Reset Password",message)
    res.status(200).json({
        success:true,
        message:`Reset Token has been sent to ${user.email}`,
    })
})

// resetpassword
export const resetPassword=catchAsyncError(async(req,res,next)=>{
    const {token}=req.params
    const resetPasswordToken=crypto
    .createHash('sha256')
    .update(token)
    .digest('hex') 
    const user=await User.findOne({
        resetPasswordToken,
        resetPasswordExpire:{
            $gt:Date.now(),
        },
    })
    if(!user) return next(new ErrorHandler("Token is invalid or expire",401))
    user.password=req.body.passowrd;
    user.resetPasswordToken=undefined;
    user.resetPasswordExpire=undefined;
    await user.save()
    res.status(200).json({
        success:true,
        message:"Password Changed Successfully",
    })
})

// updating user name,email
export const updateProfile=catchAsyncError(async(req,res,next)=>{
    const{name,email}=req.body
    const user=await User.findById(req.user._id)
    if (name) user.name=name
    if (email) user.name=email
    await user.save()
    res.status(200).json({
        success:true,
        message:'Profile Updated Successfully'
    })
})

// updating user bio
export const updateBio=catchAsyncError(async(req,res,next)=>{
    const {bio}=req.body
    const user=await User.findById(req.user._id)
    if (bio) user.bio=bio
    await user.save()
    res.status(200).json({
        success:true,
        message:'Bio updated'
    })
})

// delete user profile
export const deleteProfile=catchAsyncError(async(req,res,next)=>{
    const user=await User.findById(req.user._id)
    const posts=user.posts
    const followers=user.followers
    const following=user.following
    const userId=user._id
    await cloudinary.v2.uploader.destroy(user.avatar.public_id)
    await user.remove()
    res.cookie('token',null,{
        expires:new Date(Date.now()),
        httpOnly:true,
    })
    for (let i=0;i<posts.length;i++){
        const post=await Post.findById(posts[i])
        await post.remove()
    }
    for (let i = 0; i < followers.length; i++) {
        const follower = await User.findById(followers[i]);
        const index = follower.following.indexOf(userId);
        follower.following.splice(index, 1);
        await follower.save();
    }
    for (let i = 0; i < following.length; i++) {
        const follows = await User.findById(following[i]);  
        const index = follows.followers.indexOf(userId);
        follows.followers.splice(index, 1);
        await follows.save();
    }  
    res.status(200).json({
        success:true,
        message:'Profile deleted',
    })
})

// updating user profilepicture
export const updateprofilepicture=catchAsyncError(async(req,res,next)=>{
    const file=req.file
    const user=await User.findById(req.user._id)
    const fileUri=getDataUri(file)
    const mycloud=await cloudinary.v2.uploader.upload(fileUri.content)
    await cloudinary.v2.uploader.destroy(user.avatar.public_id)
    user.avatar={
        public_id:mycloud.public_id,
        url:mycloud.secure_url
    }
    await user.save()
    res.status(200).json({
        success:true,
        message:'Profile Picture Updated Successfully'
    })
})


// followuser
export const followUser=catchAsyncError(async(req,res,next)=>{
    const userToFollow=await User.findById(req.params.id)
    const loggedInUser=await User.findById(req.user._id)
    if(!userToFollow) return next(new ErrorHandler('Not Found',404))
    if (loggedInUser.following.includes(userToFollow._id)){
        const indexfollowing=loggedInUser.following.indexOf(userToFollow._id)
        const indexfollowers=userToFollow.followers.indexOf(loggedInUser._id)        
        loggedInUser.following.splice(indexfollowing,1)
        userToFollow.followers.splice(indexfollowers,1)
        await loggedInUser.save()
        await userToFollow.save()
        res.status(200).json({
            success:true,
            message:'Unfollowed',
        })
    }
    else{
        loggedInUser.following.push(userToFollow._id)
        userToFollow.followers.push(loggedInUser._id)
        await loggedInUser.save()
        await userToFollow.save()
        res.status(200).json({
            success:true,
            message:'Followed',
        })
    }
})

// user profile
export const getUserProfile=catchAsyncError(async(req,res,next)=>{
    const user=await User.findById(req.params.id).populate('posts followers following')
    if(!user) return next (new ErrorHandler('Not Found',404))
    res.status(200).json({
    success:true,
    user,    
    })
})

// all users
export const getAllUsers=catchAsyncError(async(req,res,next)=>{
    const users=await User.find({
        name:{$regex:req.query.name,$options:"i"},
    })
    res.status(200).json({
        success:true,
        users,
    })
})

// owner's post
export const getMyPosts=catchAsyncError(async(req,res,next)=>{
    const user=await User.findById(req.user._id)
    const posts=[]
    for(let i=0;i<user.posts.length;i++){
        const post=await Post.findById(user.posts[i]).populate(
            'likes.user owner'
        )
        posts.push(post)
    }
    res.status(200).json({
        success:true,
        posts,
    })
})

// user's post
export const getUserPost=catchAsyncError(async(req,res,next)=>{
    const user=await User.findById(req.params.id)
    const posts=[]
    for (let i=0;i<user.posts.length;i++){
        const post=await Post.findById(user.posts[i]).populate(
            'likes.user owner')
        posts.push(post)
        }
        res.status(200).json({
            success:true,
            posts,
        })
})