import uploadOnCloudinary from "../config/cloudinary.js";
import geminiResponse from "../gemini.js";
import userModel from "../models/user.model.js";
import  moment from "moment";

const getCurrentUser = async (req,res) => {
    try {
        const userId = req.userId;
        
        const user = await userModel.findById(userId).select("-password");
        if(!user){
            return res.status(401).json({
                message: "User not found"
            })
        }
        return res.status(200).json(user);
    } catch (error) {
        return res.status(400).json({message: "Get current user error"})
    }
}

const updateAssistant = async (req,res) => {
    try {
        const { assistantName, imageUrl } = req.body;
        let assistantImage;
        if(req.file){
            assistantImage = await uploadOnCloudinary(req.file.path);
        }else{
            assistantImage = imageUrl;
        }
        const user = await userModel.findByIdAndUpdate(req.userId, {
            assistantName,
            assistantImage
        }, { returnDocument: "after" }).select("-password");
        return res.status(200).json(user);
    } catch (error) {
        console.log(error);
        
        return res.status(400).json({

            message: "UpdateAssistant Error"
        })
    }
}

const askToAssistant = async (req,res) => {
    try {
        const { command } = req.body;
        const user = await userModel.findById(req.userId);
        user.history.push(command);
        user.save();
        const userName = user.name;
        const assistantName = user.assistantName;
        const result = await geminiResponse(command, assistantName, userName);
        
        if (!result) {
    return res.status(500).json({
        success: false,
        message: "Gemini response is empty"
    });
}
        
        const jsonMatch = result.match(/{[\s\S]*}/);
        if(!jsonMatch){
            return res.status(500).json({
                success: false,
                message: "Invalid Ai response"
            })
        }
        const gemResult = JSON.parse(jsonMatch[0]);
        
        const type = gemResult.type;
        switch(type){
            case 'get_date': 
                return res.json({
                    type,
                    userInput: gemResult.userinput,
                    response: `Current date is ${moment().format("YYYY-MM-DD")}`
                });
            case 'get_time': 
                return res.json({
                    type,
                    userInput: gemResult.userInput,
                    response: `Current time is ${moment().format("hh:mm A")}`
                });
            case "get_day":
                return res.json({
                    type,
                    userInput: gemResult.userinput,
                    response: `Today is ${moment().format("dddd")}`
                });
            case "get_month": 
                return res.json({
                    type,
                    userInput: gemResult.userinput,
                    response: `Current month is ${moment().format("MMMM")}`
                });
            case 'google_search':
            case 'youtube_search':
            case 'youtube_play': 
            case 'general': 
            case 'calculator_open':
            case 'instagram_open':
            case 'facebook_open':
            case 'weather_show':
                return res.json({
                    type,
                    userInput: gemResult.userInput,
                    response: gemResult.response
                })
            default: 
                return res.status(400).json({response: "I didn't understand that command."})
        }
    } catch (error) {
        console.log("Error from asktoassitant ->", error);
        
        return res.status(500).json({
            response: "ask assistant error"
        })
    }
}

export { getCurrentUser, updateAssistant, askToAssistant };