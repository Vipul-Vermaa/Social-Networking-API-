import express from "express";
import {config} from 'dotenv'
import ErrorMiddleware from './middlewares/Error.js'
import cors from 'cors'
import cookieParser from 'cookie-parser'
import rateLimit from 'express-rate-limit'
import  swaggerUi  from "swagger-ui-express";
import swaggerSpec from "./utils/swaggerOptions.js";

config({
    path:'./config/config.env'
})

const app=express()

// rate limiting
const limiter=rateLimit({
    windowMs:15*60*1000,
    max:100,
    message:'Too many requests from this IP, please try again later',
})

// Using Middlewares

app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec))
app.use(limiter)
app.use(express.json())
app.use(
    express.urlencoded({
        extended:true,
    }))
app.use(cookieParser())
app.use(
    cors({
        origin:process.env.FRONTEND_URL,
        credentials:true,
        methods:['GET','POST','PUT','DELETE']
    }))

// Importing Routes
import post from './routes/postRoutes.js'
import user from './routes/userRoutes.js'

// Using Routes
app.use('/api/v1/posts',post)
app.use('/api/v1/users',user)

export default app


app.get('/',(req,res)=>
res.send(
    `<h1>Working. Click on this <a href=${process.env.FRONTEND_URL}>here<a/> to visit frontend</h1?`
)
)

app.use(ErrorMiddleware)