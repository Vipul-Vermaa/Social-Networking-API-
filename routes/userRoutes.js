import express from 'express'
import singleUpload from '../middlewares/multer.js'
import {isAuthenticated} from '../middlewares/auth.js'
import { changePassword, deleteProfile, followUser, forgetPassword, getAllUsers, getMyPosts, getMyProfile, getUserPost, getUserProfile, login, logout, register, resetPassword, updateBio, updateProfile, updateprofilepicture } from '../controllers/usercontroller.js'

const router=express.Router()

router.route("/register").post(register)
router.route("/login").post(login)
router.route("/logout").get(logout)

router.route("/follow/:id").get(isAuthenticated,followUser)

router.route('/changepassword').put(isAuthenticated,changePassword)
router.route('/forgetpassword').post(forgetPassword)
router.route('/resetpassword/:token').put(resetPassword)

router.route('/updatebio').put(isAuthenticated,updateBio)

router.route('/updateprofile').put(isAuthenticated,updateProfile)
router.route('/deleteprofile').delete(isAuthenticated,deleteProfile)

router.route('/updateprofilepicture').put(isAuthenticated,singleUpload,updateprofilepicture)

router.route('/allusers').get(isAuthenticated,getAllUsers)

router.route('/me').get(isAuthenticated,getMyProfile)

router.route('/myposts').get(isAuthenticated,getMyPosts)
router.route('/userposts/:id').get(isAuthenticated,getUserPost)

router.route('/user/:id').get(isAuthenticated,getUserProfile)

export default router