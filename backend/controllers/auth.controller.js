import userModel from "../models/user.model.js";
import bcrypt from "bcryptjs";
import genToken from "../config/token.js";


const signUp = async (req,res) => {
    try {
        const { name, email, password } = req.body;
        const existingUser = await userModel.findOne({email});
        if(existingUser){
            return res.status(409).json({
                success: false,
                message: "User Already Exists."
            })
        }
        if(password.length < 6){
            return res.status(400).json({
                message: "Password must be atleast 6 characters!"
            })
        }
        const hashedPassword = await bcrypt.hash(password, 10);

        const user = await userModel.create({
            name,
            email,
            password: hashedPassword
        })

        const token = await genToken(user._id);

        res.cookie("token",token,{
            httpOnly: true,
            maxAge: 7*24*60*60*1000,
            sameSite: "strict",
            secure: false
        })

        return res.status(201).json({
            success: true,
            message: "User Created Successfully",
            user
        })

    } catch (error) {
        return res.status(500).json({
            success: false,
            message: "Internal Server Error",
            error: error.message
        })
    }
}

const login = async (req,res) => {
    try {
        const { email, password } = req.body;
        const user = await userModel.findOne({email});
        if(!user){
            return res.status(409).json({
                success: false,
                message: "User doesn't Exists."
            })
        }
        const isMatch = await bcrypt.compare(password, user.password);
        if(!isMatch){
            return res.status(400).json({
                success: false,
                message: "Incorrect Password"
            })
        }
        if(password.length < 6){
            return res.status(400).json({
                message: "Password must be atleast 6 characters!"
            })
        }

        const token = await genToken(user._id);

        res.cookie("token",token,{
            httpOnly: true,
            maxAge: 7*24*60*60*1000,
            sameSite: "strict",
            secure: false
        })

        return res.status(200).json({
            success: true,
            message: "User logged in Successfully",
            user
        })

    } catch (error) {
        return res.status(500).json({
            success: false,
            message: "Login Error",
            error: error.message
        })
    }
}

const logout = async (req, res) => {
    try {

        res.clearCookie("token", {
            httpOnly: true,
            sameSite: "strict",
            secure: false
        });

        return res.status(200).json({
            success: true,
            message: "Logout successful"
        });

    } catch (error) {

        return res.status(500).json({
            success: false,
            message: "Logout error",
            error: error.message
        });
    }
}
export { signUp, login, logout };