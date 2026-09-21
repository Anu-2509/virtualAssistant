import jwt from "jsonwebtoken";

const isAuth = async (req,res,next) => {
    try {
        // console.log("ISAUTH HIT:", req.originalUrl);
        const token = req.cookies.token;
        
        if(!token){
            return res.status(400).json({
                message: "Token not found"
            })
        }
        const verifyToken = await jwt.verify(token, process.env.JWT_SECRET_KEY)
        if(!verifyToken){
            return res.status(404).json({message: "Invalid Token"})
        }
        req.userId = verifyToken.userId;
        next();
    } catch (error) {
        console.log(error);
        return res.status(500).json({message: "isAuth error"})
    }
}

export default isAuth;