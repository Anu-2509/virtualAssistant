import React, { useEffect, useRef, useState } from "react";
import { useContext } from "react";
import { UserDataContext } from "../context/userContext";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import aiImg from "../assets/ai.gif";
import userImg from "../assets/user.gif";
import { CgMenuRight } from "react-icons/cg";
import { RxCross1 } from "react-icons/rx";

const Home = () => {
  const { userData, serverUrl, setUserData, getGeminiResponse } =
    useContext(UserDataContext);
  const navigate = useNavigate();
  const [listening, setListening] = useState(false);
  const [userText, setUserText] = useState("");
  const [aiText, setAiText] = useState("");
  const isSpeakingRef = useRef(false);
  const isRecognizingRef = useRef(false);
  const recognitionRef = useRef(null);
  const [ham, setHam] = useState(false);
  const synth = window.speechSynthesis;

  const handleLogOut = async () => {
    try {
      const result = await axios.get(`${serverUrl}/api/auth/logout`, {
        withCredentials: true,
      });
      setUserData(null);
      console.log(result.data);

      navigate("/signin");
    } catch (error) {
      setUserData(null);
      console.log(error);
    }
  };

  const startRecognition = () => {
    if (!isSpeakingRef.current && !isRecognizingRef.current) {
      try {
        recognitionRef.current?.start();
        console.log("Recognition requested to start");
        
      } catch (error) {
        if (error.name !== "InvalidStateError") {
          console.error("Start error: ", error);
        }
      }
    }
  };

  const speakByAssistant = (text) => {
    console.log(text);

    const utterance = new SpeechSynthesisUtterance(text);
    console.log(utterance);
    utterance.lang = "hi-IN";
    const voices = window.speechSynthesis.getVoices();
    const hindiVoice = voices.find((v) => v.lang === "hi-IN");
    if (hindiVoice) {
      utterance.voice = hindiVoice;
    }

    isSpeakingRef.current = true;
    utterance.onend = () => {
      setAiText("");
      isSpeakingRef.current = false;
      setTimeout(() => {
         startRecognition(); // Delay se race condition avoid hoti hai
      }, 800);
    };
    synth.cancel(); // pehle se jo speaking ho rhi hai usko cancel kar dega
    synth.speak(utterance);
  };

  const handleCommand = (data) => {
    if (!data) {
      console.log("somthing went wrong");
      return;
    }
    const { type, userInput, response } = data;
    speakByAssistant(response);

    if (type === "google_search") {
      const query = encodeURIComponent(userInput);
      window.open(`https://www.google.com/search?q=${query}`, "_blank");
    }
    if (type === "calculator_open") {
      window.open(`https://www.google.com/search?q=calculator`, "_blank");
    }
    if (type === "instagram_open") {
      window.open(`https://www.instagram.com/`, "_blank");
    }
    if (type === "facebook_open") {
      window.open(`https://www.facebook.com/`, "_blank");
    }
    if (type === "weather_show") {
      window.open(`https://www.google.com/search?q=today+weather`, "_blank");
    }
    if (type === "youtube_search" || type === "youtube_play") {
      const query = encodeURIComponent(userInput);
      window.open(
        `https://www.youtube.com/results?search_query=${query}`,
        "_blank",
      );
      // ((window.location.href = `https://www.youtube.com/results?search_query=${query}`),
      //   "_blank");
    }
  };

  useEffect(() => {
    if (!userData) {
      console.log("⚠️ userData not ready yet, skipping SR init");
      return;
    }

    console.log("🤖 Assistant name:", userData?.assistantName);

    const SpeechRecognition =
      window.SpeechRecognition || window.webkitSpeechRecognition;
    const recognition = new SpeechRecognition();

    recognition.continuous = true;
    recognition.lang = "en-US";
    recognition.interimResults = false;

    recognitionRef.current = recognition;

    let isMounted = true; // flag to avoid setState on unmounted component

    // Start recognition after 1 second delay only if component still isMounted
    const startTimeout = setTimeout(() => {
      if(isMounted && !isSpeakingRef.current && !isRecognizingRef.current){
        try {
          recognition.start();
          console.log("Recognition requested to start");
          
        } catch (e) {
          if(e.name !== "InvalidStateError"){
            console.error(e);
          }
        }
      }
    }, 1000);

    recognition.onStart = () => {
      console.log("Recognition started");
      isRecognizingRef.current = true;
      setListening(true);
    };

    recognition.onend = () => {
      console.log("Recognition ended");
      isRecognizingRef.current = false;
      setListening(false);
      if(isMounted && !isSpeakingRef.current){
        setTimeout(() => {
          if(isMounted){
            try {
              recognition.start();
              console.log("Recognition Restarted");
            } catch (e) {
              if(e.name !== "InvalidStateError")console.error(e);
          
            }
          }
        }, 1000);
      }
    };


   

    recognition.onerror = (event) => {
      console.warn("Recognition error:", event.error);
      isRecognizingRef.current = false;
      setListening(false);
      if (event.error !== "aborted" && isMounted && !isSpeakingRef.current) {
        setTimeout(() => {
            if(isMounted){
              try {
                recognition.start();
                console.log("Recognition restarted after error");
                
              } catch (e) {
                if(e.name !== "InvalidStateError")console.error(e);
              }
            }
        }, 1000);
      }
    };


    recognition.onresult = async (e) => {
      const transcript = e.results[e.results.length - 1][0].transcript.trim();
      console.log("Heard:", transcript);
      console.log("Checking for:", userData?.assistantName);

      if (
        transcript
          .toLowerCase()
          .includes(userData?.assistantName?.toLowerCase())
      ) {
        setAiText("");
        setUserText(transcript);
        console.log("Name matched! Calling Gemini...");
        recognition.stop();
        isRecognizingRef.current = false;
        setListening(false);
        const data = await getGeminiResponse(transcript);
        console.log("Gemini response:", data);
        handleCommand(data);
        setAiText(data.response);
        setUserText("");
      } else {
        console.log("❌ Name not matched in transcript");
      }
    };

    window.speechSynthesis.onvoiceschanged = () => {
      const greeting = new SpeechSynthesisUtterance(`Hello ${userData.name}, what can I help you with?`);
      greeting.lang = "hi-IN";
      greeting.onend = () => {
        startRecognition();  // start listening after speech
      }
      window.speechSynthesis.speak(greeting);
    }

    return () => {
      isMounted = false;
      clearTimeout(startTimeout);
      recognition.stop();
      setListening(false);
      isRecognizingRef.current = false;
    };
  }, []);

  return (
    <div className="w-full h-[100vh] bg-gradient-to-t from-[black] to-[#02023d] flex justify-center items-center flex-col gap-[15px] overflow-hidden">
      <CgMenuRight
        className="lg:hidden text-white absolute top-[20px] right-[20px] w-[25px] h-[25px]"
        onClick={() => setHam(true)}
      />

      <div className="hidden lg:flex absolute top-[20px] right-[20px] gap-[15px]">
        <button
          className="min-w-[150px] h-[50px] bg-white text-black font-semibold rounded-full text-[17px] px-[20px] cursor-pointer"
          onClick={handleLogOut}
        >
          Logout
        </button>

        <button
          className="min-w-[200px] h-[50px] bg-white text-black font-semibold rounded-full text-[17px] px-[20px] cursor-pointer"
          onClick={() => navigate("/customize")}
        >
          Customize your Assistant
        </button>
      </div>
      <div
        className={`absolute lg:hidden top-0 w-full h-full bg-[#00000048] backdrop-blur-lg p-[20px] flex flex-col gap-[20px] items-start ${ham ? "translate-x-0" : "translate-x-full"} transition-transform`}
      >
        <RxCross1
          className="text-white absolute top-[20px] right-[20px] w-[25px] h-[25px]"
          onClick={() => setHam(false)}
        />

        <button
          className="min-w-[150px] h-[60px] bg-white text-black  font-semibold rounded-full text-[19px] cursor-pointer"
          onClick={handleLogOut}
        >
          Logout
        </button>
        <button
          className="min-w-[150px] h-[60px] bg-white  text-black font-semibold rounded-full text-[19px] px-[20px] py-[10px] cursor-pointer"
          onClick={() => navigate("/customize")}
        >
          Customize your Assistant
        </button>

        <div className="w-full h-[2px] bg-gray-400"></div>
        <h1 className="text-white font-semibold text-[19px]">History</h1>
        <div className="w-full h-[400px] gap-[20px] overflow-y-auto flex flex-col">
          {userData.history?.map((his, index) => (
            <span key={index} className="text-gray-200 text-[18px] truncate- ">{his}</span>
          ))}
        </div>
      </div>

      <div className="w-[300px] h-[400px] flex justify-center items-center overflow-hidden rounded-4xl shadow-lg">
        <img
          src={userData?.assistantImage}
          alt=""
          className="h-full object-cover"
        />
      </div>
      <h1 className="text-white text-[18px] font-semibold">
        I'm {userData?.assistantName}
      </h1>
      {!aiText && <img src={userImg} alt="" className="w-[200px]" />}
      {aiText && <img src={aiImg} alt="" className="w-[200px]" />}
      <h1 className="text-white text-[18px] font-semibold text-wrap">
        {userText ? userText : aiText ? aiText : null}
      </h1>
    </div>
  );
};

export default Home;
