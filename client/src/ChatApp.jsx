import React, { useState, useEffect, useRef } from 'react';
import { Send, LogOut, Users, MessageCircle } from 'lucide-react';
import io from 'socket.io-client';

const API_URL = 'https://chattingappbackend-vzoi.onrender.com';

export default function ChatApp() {
  const [user, setUser] = useState(null);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [isLogin, setIsLogin] = useState(true);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [onlineUsers, setOnlineUsers] = useState([]);
  const [error, setError] = useState('');
  const [isConnected, setIsConnected] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  
  const socket = useRef(null);
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    verifyAuth();
  }, []);

  useEffect(() => {
    if (user) {
      connectSocket();
      fetchMessages();
    }
    return () => {
      if (socket.current) {
        socket.current.disconnect();
      }
    };
  }, [user]);

  const verifyAuth = async () => {
    try {
      const res = await fetch(`${API_URL}/api/auth/verify`, {
        method: 'GET',
        credentials: 'include'
      });
      if (res.ok) {
        const data = await res.json();
        setUser(data.user);
      }
    } catch (err) {
      console.error('Auth verification failed:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const connectSocket = () => {
   socket.current = io(API_URL, {
  withCredentials: true,
  transports: ["websocket"] 
});

    
    socket.current.on('connect', () => {
      console.log('Socket.IO connected');
      setIsConnected(true);
    });

    socket.current.on('disconnect', () => {
      console.log('Socket.IO disconnected');
      setIsConnected(false);
    });
    
    socket.current.on('message', (message) => {
      setMessages(prev => [...prev, message]);
    });
    
    socket.current.on('userList', (users) => {
      setOnlineUsers(users);
    });

    socket.current.on('error', (error) => {
      console.error('Socket error:', error);
    });
  };

  const fetchMessages = async () => {
    try {
      const res = await fetch(`${API_URL}/api/messages`, {
        credentials: 'include'
      });
      if (res.ok) {
        const data = await res.json();
        setMessages(data);
      }
    } catch (err) {
      console.error('Failed to fetch messages:', err);
    }
  };

  const handleAuth = async () => {
    setError('');
    
    const endpoint = isLogin ? '/api/auth/login' : '/api/auth/register';
    
    try {
      const res = await fetch(`${API_URL}${endpoint}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ username, password })
      });
      
      const data = await res.json();
      
      if (res.ok) {
        setUser(data.user);
        setUsername('');
        setPassword('');
      } else {
        setError(data.error || 'Authentication failed');
      }
    } catch (err) {
      setError('Connection error. Please check if the server is running.');
    }
  };

  const sendMessage = () => {
    if (newMessage.trim() && socket.current?.connected) {
      socket.current.emit('sendMessage', newMessage);
      setNewMessage('');
    }
  };
  
  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const handleLogout = async () => {
    try {
      await fetch(`${API_URL}/api/auth/logout`, {
        method: 'POST',
        credentials: 'include'
      });
      setUser(null);
      setMessages([]);
      if (socket.current) {
        socket.current.disconnect();
      }
    } catch (err) {
      console.error('Logout failed:', err);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
        <div className="text-white text-xl">Loading...</div>
      </div>
    );
  }

  if (!user) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500 p-6">

      {/* Glass Card */}
      <div className="backdrop-blur-xl bg-white/10 border border-white/20 shadow-2xl rounded-3xl p-10 w-full max-w-md animate-fadeIn">

        {/* Icon */}
        <div className="flex justify-center mb-6">
          <MessageCircle className="w-16 h-16 text-white drop-shadow-lg" />
        </div>

        {/* Heading */}
        <h2 className="text-4xl font-extrabold text-center text-white mb-6 drop-shadow-md tracking-wide">
          {isLogin ? "Welcome Back!" : "Create Your Account"}
        </h2>

        {/* Error Box */}
        {error && (
          <div className="bg-red-500/20 border border-red-400 text-red-200 px-4 py-3 rounded-lg mb-4">
            {error}
          </div>
        )}

        {/* Form */}
        <div className="space-y-5">
          <div>
            <label className="block text-white font-medium mb-2 tracking-wide">
              Username
            </label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleAuth()}
              className="w-full px-4 py-3 bg-white/20 text-white border border-white/30 placeholder-white/50 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-300 transition"
              placeholder="Enter your username"
            />
          </div>

          <div>
            <label className="block text-white font-medium mb-2 tracking-wide">
              Password
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleAuth()}
              className="w-full px-4 py-3 bg-white/20 text-white border border-white/30 placeholder-white/50 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-300 transition"
              placeholder="Enter your password"
            />
          </div>

          <button
            onClick={handleAuth}
            className="w-full bg-white text-purple-600 py-3 rounded-xl font-bold shadow-lg hover:bg-purple-100 transition active:scale-95 tracking-wide"
          >
            {isLogin ? "Login" : "Register"}
          </button>
        </div>

        {/* Switch Text */}
        <p className="text-center text-white/80 mt-5">
          {isLogin ? "Don't have an account? " : "Already have an account? "}
          <button
            onClick={() => {
              setIsLogin(!isLogin);
              setError('');
            }}
            className="text-yellow-300 font-bold hover:underline"
          >
            {isLogin ? "Register" : "Login"}
          </button>
        </p>
      </div>
    </div>
  );
}


  return (
    <div className="h-screen bg-gray-100 flex flex-col">
      <div className="bg-white shadow-md px-6 py-4 flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <MessageCircle className="w-8 h-8 text-blue-600" />
          <h1 className="text-2xl font-bold text-gray-800">Chat Room</h1>
          <div className="flex items-center space-x-2">
            <div className={`w-2 h-2 rounded-full ${isConnected ? 'bg-green-500' : 'bg-red-500'}`}></div>
            <span className="text-sm text-gray-600">
              {isConnected ? 'Connected' : 'Disconnected'}
            </span>
          </div>
        </div>
        <div className="flex items-center space-x-4">
          <span className="text-gray-700 font-medium">{user.username}</span>
          <button
            onClick={handleLogout}
            className="flex items-center space-x-2 bg-red-500 text-white px-4 py-2 rounded-lg hover:bg-red-600 transition"
          >
            <LogOut className="w-4 h-4" />
            <span>Logout</span>
          </button>
        </div>
      </div>

      <div className="flex flex-1 overflow-hidden">
        <div className="w-64 bg-white shadow-md p-4">
          <div className="flex items-center space-x-2 mb-4">
            <Users className="w-5 h-5 text-blue-600" />
            <h3 className="font-semibold text-gray-800">Online Users ({onlineUsers.length})</h3>
          </div>
          <div className="space-y-2">
            {onlineUsers.map((u, i) => (
              <div key={i} className="flex items-center space-x-2 p-2 bg-gray-50 rounded">
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                <span className="text-gray-700">{u}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="flex-1 flex flex-col">
          <div className="flex-1 overflow-y-auto p-6 space-y-4">
            {messages.map((msg, i) => (
              <div
                key={i}
                className={`flex ${msg.username === user.username ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
                    msg.username === user.username
                      ? 'bg-blue-600 text-white'
                      : 'bg-white text-gray-800'
                  } shadow`}
                >
                  <div className="font-semibold text-sm mb-1">
                    {msg.username}
                  </div>
                  <div>{msg.content}</div>
                  <div className={`text-xs mt-1 ${msg.username === user.username ? 'text-blue-100' : 'text-gray-500'}`}>
                    {new Date(msg.timestamp).toLocaleTimeString()}
                  </div>
                </div>
              </div>
            ))}
            <div ref={messagesEndRef} />
          </div>

          <div className="bg-white border-t p-4">
            <div className="flex space-x-2">
              <input
                type="text"
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="Type your message..."
                disabled={!isConnected}
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100 disabled:cursor-not-allowed"
              />
              <button
                onClick={sendMessage}
                disabled={!isConnected}
                className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition flex items-center space-x-2 disabled:bg-gray-400 disabled:cursor-not-allowed"
              >
                <Send className="w-4 h-4" />
                <span>Send</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}