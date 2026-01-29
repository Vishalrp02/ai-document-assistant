import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { Send, ArrowLeft, Bot, User } from 'lucide-react';

const Chat = ({ user }) => {
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [files, setFiles] = useState([]);
  const [selectedFile, setSelectedFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [chatHistory, setChatHistory] = useState([]);
  const messagesEndRef = useRef(null);

  useEffect(() => {
    fetchFiles();
    fetchChatHistory();
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const fetchFiles = async () => {
    try {
      const response = await axios.get('/api/files');
      setFiles(response.data);
    } catch (err) {
      setError('Failed to fetch files');
    }
  };

  const fetchChatHistory = async () => {
    try {
      const response = await axios.get('/api/chat/history');
      setChatHistory(response.data);
    } catch (err) {
      console.error('Failed to fetch chat history');
    }
  };

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!newMessage.trim()) return;

    const userMessage = {
      id: Date.now(),
      message: newMessage,
      sender: 'user',
      timestamp: new Date()
    };

    setMessages([...messages, userMessage]);
    setLoading(true);
    setError('');

    try {
      const response = await axios.post('/api/chat', {
        message: newMessage,
        file_id: selectedFile ? selectedFile.id : null
      });

      const aiMessage = {
        id: Date.now() + 1,
        message: response.data.response,
        sender: 'ai',
        timestamp: new Date(),
        timestampData: response.data.timestamp_data
      };

      setMessages(prev => [...prev, aiMessage]);
      setNewMessage('');
      
      // Refresh chat history
      fetchChatHistory();
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to send message');
    } finally {
      setLoading(false);
    }
  };

  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const formatTime = (timestamp) => {
    return new Date(timestamp).toLocaleTimeString([], { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  };

  const jumpToTimestamp = (timestamp) => {
    // This would interact with a media player component
    // For now, we'll just log it
    console.log('Jumping to timestamp:', timestamp);
    // You could emit an event or use context to control the media player
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Header */}
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div className="flex items-center">
              <button
                onClick={() => window.location.href = '/dashboard'}
                className="mr-4 text-gray-600 hover:text-gray-900"
              >
                <ArrowLeft className="h-6 w-6" />
              </button>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">AI Chat Assistant</h1>
                <p className="text-gray-600">Ask questions about your documents</p>
              </div>
            </div>
            <div className="text-sm text-gray-600">
              {user.email}
            </div>
          </div>
        </div>
      </header>

      <div className="flex-1 flex">
        {/* Sidebar */}
        <div className="w-80 bg-white border-r border-gray-200 p-4">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Documents</h3>
          
          <div className="mb-4">
            <select
              value={selectedFile ? selectedFile.id : ''}
              onChange={(e) => {
                const file = files.find(f => f.id === parseInt(e.target.value));
                setSelectedFile(file);
              }}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="">All Documents</option>
              {files.map((file) => (
                <option key={file.id} value={file.id}>
                  {file.original_filename}
                </option>
              ))}
            </select>
          </div>

          {selectedFile && (
            <div className="bg-gray-50 p-3 rounded-md mb-4">
              <h4 className="font-semibold text-gray-900 mb-2">Selected Document</h4>
              <p className="text-sm text-gray-700 truncate">{selectedFile.original_filename}</p>
              <p className="text-xs text-gray-500">
                {formatFileSize(selectedFile.file_size)} • {selectedFile.file_type}
              </p>
            </div>
          )}

          <div>
            <h4 className="font-semibold text-gray-900 mb-2">Chat History</h4>
            <div className="space-y-2 max-h-64 overflow-y-auto">
              {chatHistory.slice(0, 10).map((chat) => (
                <div key={chat.id} className="text-sm">
                  <p className="text-gray-700 truncate">{chat.message}</p>
                  <p className="text-xs text-gray-500">
                    {new Date(chat.created_at).toLocaleDateString()}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Chat Area */}
        <div className="flex-1 flex flex-col">
          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4">
            {messages.length === 0 && (
              <div className="text-center text-gray-500 mt-8">
                <Bot className="h-12 w-12 mx-auto mb-4 text-gray-400" />
                <p>Start a conversation about your documents</p>
              </div>
            )}

            {messages.map((message) => (
              <div
                key={message.id}
                className={`mb-4 flex ${message.sender === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-2xl px-4 py-3 rounded-lg ${
                    message.sender === 'user'
                      ? 'bg-blue-600 text-white'
                      : 'bg-white border border-gray-200'
                  }`}
                >
                  <div className="flex items-start space-x-2">
                    {message.sender === 'ai' && (
                      <Bot className="h-5 w-5 mt-1 text-blue-600" />
                    )}
                    {message.sender === 'user' && (
                      <User className="h-5 w-5 mt-1 text-blue-200" />
                    )}
                    <div className="flex-1">
                      <p className={`${message.sender === 'user' ? 'text-white' : 'text-gray-900'}`}>
                        {message.message}
                      </p>
                      
                      {/* Timestamp buttons for media files */}
                      {message.timestampData && message.timestampData.length > 0 && (
                        <div className="mt-3 space-y-2">
                          <p className="text-xs font-semibold text-gray-600">Relevant Timestamps:</p>
                          {message.timestampData.map((ts, index) => (
                            <button
                              key={index}
                              onClick={() => jumpToTimestamp(ts.start)}
                              className="block w-full text-left px-3 py-2 bg-gray-50 rounded hover:bg-gray-100 text-sm"
                            >
                              <div className="flex justify-between items-center">
                                <span className="truncate">{ts.text}</span>
                                <span className="text-xs text-gray-500 ml-2">
                                  {Math.floor(ts.start)}s
                                </span>
                              </div>
                            </button>
                          ))}
                        </div>
                      )}
                      
                      <p className={`text-xs mt-2 ${
                        message.sender === 'user' ? 'text-blue-200' : 'text-gray-500'
                      }`}>
                        {formatTime(message.timestamp)}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            ))}

            {loading && (
              <div className="flex justify-start mb-4">
                <div className="bg-white border border-gray-200 px-4 py-3 rounded-lg">
                  <div className="flex items-center space-x-2">
                    <Bot className="h-5 w-5 text-blue-600" />
                    <div className="flex space-x-1">
                      <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                      <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{animationDelay: '0.1s'}}></div>
                      <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{animationDelay: '0.2s'}}></div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Input Area */}
          <div className="border-t border-gray-200 bg-white p-4">
            {error && (
              <div className="mb-4 bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded">
                {error}
              </div>
            )}

            <form onSubmit={handleSendMessage} className="flex space-x-4">
              <input
                type="text"
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                placeholder="Ask a question about your documents..."
                className="flex-1 px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                disabled={loading}
              />
              <button
                type="submit"
                disabled={loading || !newMessage.trim()}
                className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 flex items-center"
              >
                <Send className="h-5 w-5" />
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Chat;
