import React, { useState, useEffect, createContext } from 'react';
import axios from "axios";

export const UserDataContext = createContext();

const UserContext = ({ children }) => {
    const serverUrl = "https://virtualassistant-backend-xyg7.onrender.com";
    const [userData, setUserData] = useState(null);
    const [frontendImage, setFrontendImage] = useState(null);
    const [backendImage, setBackendImage] = useState(null);
    const [selectedImage, setSelectedImage] = useState(null);
    const handleCurrentUser = async () => {
        try {
            const result = await axios.get(`${serverUrl}/api/user/current`, { withCredentials: true });
            setUserData(result.data);
            console.log(result.data);
        } catch (error) {
            console.log(error);
        }
    }

     const getGeminiResponse = async (command) => {
        try {
            const result = await axios.post(`${serverUrl}/api/user/askToAssistant`, { command }, { withCredentials: true });
            console.log(result);
            
            return result.data;
        } catch (error) {
            console.log(error);
            
        }
    }


    useEffect(() => {
        handleCurrentUser();
    },[])
    const value = {
        serverUrl, 
        userData, 
        setUserData,
        frontendImage, 
        setFrontendImage,
        backendImage, 
        setBackendImage,
        selectedImage, 
        setSelectedImage,
        getGeminiResponse
    }
  return (
    <div>
        <UserDataContext.Provider value={value}>
            {children}
        </UserDataContext.Provider>
    </div>
  )
}
export default UserContext;
