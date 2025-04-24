import { useState, useEffect, useRef } from "react";
import axios from "axios";
import "../styles/ChatBot.css";

const ChatBot = ({ onClose }) => {
  const [messages, setMessages] = useState([
    { from: "bot", text: "Salut! Cu ce te pot ajuta azi? 👋😊" }
  ]);
  
  const [input, setInput] = useState("");
  const chatRef = useRef(null);

  const sendMessage = async () => {
    if (!input.trim()) return;

    const userMessage = { from: "user", text: input };
    setMessages(prev => [...prev, userMessage]);
    setInput("");

    try {
      const res = await axios.post("http://localhost:4000/api/chatbot", { message: input });
      const botMessage = { from: "bot", text: res.data.reply };
      setMessages(prev => [...prev, botMessage]);
    } catch (err) {
      setMessages(prev => [...prev, { from: "bot", text: "⚠️ Sorry, something went wrong." }]);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === "Enter") sendMessage();
  };

  useEffect(() => {
    chatRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  return (
    <div className="chatbot-box">
      <div className="chatbot-header">
        Asistentul tau virtual
        <button className="close-chatbot" onClick={onClose}>×</button>
      </div>
      <div className="chatbot-messages">
        {messages.map((msg, idx) => (
          <div key={idx} className={`chatbot-msg ${msg.from}`}>
            {msg.text}
          </div>
        ))}
        <div ref={chatRef} />
      </div>
      <div className="chatbot-input">
        <input
          type="text"
          placeholder="Message"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyPress}
        />
        <button onClick={sendMessage}>
          <span>&#10148;</span>
        </button>
      </div>
    </div>
  );
};

export default ChatBot;
