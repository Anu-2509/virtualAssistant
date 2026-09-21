import jwt  from 'jsonwebtoken';

const genToken = async (userId) => {
    try {
        const token = await jwt.sign({userId}, process.env.JWT_SECRET_KEY, { expiresIn: "10d" });
        return token;
    } catch (error) {
        resizeBy.status(500).json({
            message: "Error in creating token",
            error: error
        })
    }
}

export default genToken;