import express from "express";
import dotenv from "dotenv";
import connectDB from "./config/db.js";
import authRouter from "./routes/auth.route.js";
import userRouter from "./routes/user.route.js";
import cookieParser from "cookie-parser";
import cors from "cors";
dotenv.config();

const app = express();
app.use(cors({
    origin: "https://virtualassistant-frontend-urk1.onrender.com",
    credentials: true
}))
connectDB();

app.use(express.json());
app.use(cookieParser());

app.use("/api/auth", authRouter);
app.use("/api/user", userRouter);


const port = process.env.PORT || 5000;

app.listen(port, () => {
    console.log("Server is running on port", port); 
})
