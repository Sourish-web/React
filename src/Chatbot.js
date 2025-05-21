import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import Cookies from 'universal-cookie';
import { FiMessageSquare, FiX, FiSend } from 'react-icons/fi';

const Chatbot = () => {
  const cookies = new Cookies();
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef(null);

  const API_URL = 'http://localhost:8090/api/chat';
  const getAuthToken = () => cookies.get('token');

  // Scroll to the bottom of messages when new messages are added
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Handle sending a message
  const sendMessage = async () => {
    if (!input.trim()) return;

    const token = getAuthToken();
    if (!token) {
      alert('You are not authenticated');
      return;
    }

    // Add user message to chat
    const userMessage = { role: 'user', content: input };
    setMessages((prev) => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    try {
      const response = await axios.post(
        API_URL,
        { prompt: input },
        {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        }
      );

      // Add bot response to chat
      const botMessage = { role: 'bot', content: response.data };
      setMessages((prev) => [...prev, botMessage]);
    } catch (error) {
      console.error('Error sending message:', error);
      const errorMessage = { role: 'bot', content: 'Error: Could not get response from server.' };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  // Handle Enter key press
  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  // Colors and styles (matching Portfolio.js theme)
  const colors = {
    primary: '#6366f1',
    success: '#22c55e',
    danger: '#ef4444',
    background: '#f8fafc',
    cardBackground: '#ffffff',
    textPrimary: '#1e293b',
    textSecondary: '#64748b',
  };

  const chatWindowStyle = {
    position: 'fixed',
    bottom: '90px',
    right: '20px',
    width: '360px',
    height: '500px',
    background: colors.cardBackground,
    borderRadius: '1rem',
    boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
    display: 'flex',
    flexDirection: 'column',
    zIndex: 1000,
    overflow: 'hidden',
  };

  const chatHeaderStyle = {
    background: colors.primary,
    color: 'white',
    padding: '1rem',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
  };

  const chatBodyStyle = {
    flex: 1,
    padding: '1rem',
    overflowY: 'auto',
    background: colors.background,
  };

  const messageStyle = (role) => ({
    margin: '0.5rem 0',
    padding: '0.75rem 1rem',
    borderRadius: '0.75rem',
    maxWidth: '80%',
    background: role === 'user' ? colors.primary : '#e2e8f0',
    color: role === 'user' ? 'white' : colors.textPrimary,
    alignSelf: role === 'user' ? 'flex-end' : 'flex-start',
  });

  const chatFooterStyle = {
    padding: '1rem',
    borderTop: `1px solid #e2e8f0`,
    display: 'flex',
    alignItems: 'center',
    gap: '0.5rem',
  };

  const inputStyle = {
    flex: 1,
    padding: '0.5rem',
    border: `1px solid #e2e8f0`,
    borderRadius: '0.5rem',
    outline: 'none',
    fontSize: '0.875rem',
  };

  const buttonStyle = {
    background: colors.primary,
    color: 'white',
    border: 'none',
    padding: '0.5rem',
    borderRadius: '0.5rem',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
  };

  const toggleButtonStyle = {
    position: 'fixed',
    bottom: '20px',
    right: '20px',
    background: colors.primary,
    color: 'white',
    border: 'none',
    borderRadius: '50%',
    width: '50px',
    height: '50px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    cursor: 'pointer',
    boxShadow: '0 2px 8px rgba(0,0,0,0.2)',
    zIndex: 1000,
  };

  return (
    <>
      <button
        style={toggleButtonStyle}
        onClick={() => setIsOpen(!isOpen)}
        title={isOpen ? 'Close Chat' : 'Open Chat'}
      >
        {isOpen ? <FiX size={24} /> : <FiMessageSquare size={24} />}
      </button>
      {isOpen && (
        <div style={chatWindowStyle}>
          <div style={chatHeaderStyle}>
            <h3 style={{ margin: 0, fontSize: '1rem' }}>Chatbot</h3>
            <button
              style={{ background: 'none', border: 'none', color: 'white', cursor: 'pointer' }}
              onClick={() => setIsOpen(false)}
            >
              <FiX size={20} />
            </button>
          </div>
          <div style={chatBodyStyle}>
            {messages.map((msg, index) => (
              <div
                key={index}
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: msg.role === 'user' ? 'flex-end' : 'flex-start',
                }}
              >
                <div style={messageStyle(msg.role)}>{msg.content}</div>
              </div>
            ))}
            {isLoading && (
              <div style={{ ...messageStyle('bot'), opacity: 0.7 }}>
                Thinking...
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>
          <div style={chatFooterStyle}>
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyPress={handleKeyPress}
              style={inputStyle}
              placeholder="Type your message..."
              disabled={isLoading}
            />
            <button
              style={buttonStyle}
              onClick={sendMessage}
              disabled={isLoading}
            >
              <FiSend size={20} />
            </button>
          </div>
        </div>
      )}
    </>
  );
};

export default Chatbot;