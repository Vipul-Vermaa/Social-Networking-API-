import  express  from "express";
import {isAuthenticated} from '../middlewares/auth.js'
import { createPost, deletePost, getPostOfFollowing, updateDescription } from "../controllers/postController.js";

const router=express.Router()


// createpost
router.route('/createpost').post(isAuthenticated,createPost)

// deletepost 
// updatedescription
router.route('/post/:id')
.delete(isAuthenticated,deletePost)
.put(isAuthenticated,updateDescription)

// post of following
router.route('/posts').get(isAuthenticated,getPostOfFollowing)


export default router