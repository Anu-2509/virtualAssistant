import express from 'express';
import { signUp, login, logout } from '../controllers/auth.controller.js'

const authRouter = express.Router();

authRouter.post('/signup', signUp);
authRouter.post('/signin', login);
authRouter.get('/logout', logout);

export default authRouter;


