import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Upload, FileText, MessageSquare, LogOut, Trash2, Eye, Download, Play } from 'lucide-react';
import FileUpload from '../components/FileUpload';
import MediaPlayer from '../components/MediaPlayer';

const Dashboard = ({ user, onLogout }) => {
  const [files, setFiles] = useState([]);
  const [selectedFile, setSelectedFile] = useState(null);
  const [showUpload, setShowUpload] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [summary, setSummary] = useState(null);
  const [loadingSummary, setLoadingSummary] = useState(false);

  useEffect(() => {
    fetchFiles();
  }, []);

  const fetchFiles = async () => {
    try {
      const response = await axios.get('/api/files');
      setFiles(response.data);
    } catch (err) {
      setError('Failed to fetch files');
    } finally {
      setLoading(false);
    }
  };

  const handleFileUpload = (newFile) => {
    setFiles([newFile, ...files]);
    setShowUpload(false);
  };

  const handleDeleteFile = async (fileId) => {
    if (!window.confirm('Are you sure you want to delete this file?')) return;
    
    try {
      await axios.delete(`/api/files/${fileId}`);
      setFiles(files.filter(file => file.id !== fileId));
      if (selectedFile?.id === fileId) {
        setSelectedFile(null);
        setSummary(null);
      }
    } catch (err) {
      setError('Failed to delete file');
    }
  };

  const handleGenerateSummary = async (fileId) => {
    setLoadingSummary(true);
    try {
      const response = await axios.post(`/api/summarize/${fileId}`);
      setSummary(response.data);
    } catch (err) {
      setError('Failed to generate summary');
    } finally {
      setLoadingSummary(false);
    }
  };

  const getFileIcon = (fileType) => {
    switch (fileType) {
      case 'pdf':
        return <FileText className="h-8 w-8 text-red-500" />;
      case 'audio':
        return <Play className="h-8 w-8 text-green-500" />;
      case 'video':
        return <Play className="h-8 w-8 text-blue-500" />;
      default:
        return <FileText className="h-8 w-8 text-gray-500" />;
    }
  };

  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-100">
        <div className="text-xl text-gray-600">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">AI Document Assistant</h1>
              <p className="text-gray-600">Welcome, {user.email}</p>
            </div>
            <div className="flex items-center space-x-4">
              <button
                onClick={() => window.location.href = '/chat'}
                className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
              >
                <MessageSquare className="h-5 w-5 mr-2" />
                Chat
              </button>
              <button
                onClick={onLogout}
                className="flex items-center px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700"
              >
                <LogOut className="h-5 w-5 mr-2" />
                Logout
              </button>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {error && (
          <div className="mb-4 bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded">
            {error}
          </div>
        )}

        {/* Upload Section */}
        <div className="mb-8">
          <button
            onClick={() => setShowUpload(!showUpload)}
            className="flex items-center px-6 py-3 bg-green-600 text-white rounded-md hover:bg-green-700"
          >
            <Upload className="h-5 w-5 mr-2" />
            Upload New File
          </button>
        </div>

        {showUpload && (
          <div className="mb-8">
            <FileUpload onFileUpload={handleFileUpload} />
          </div>
        )}

        {/* Files Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
          {files.map((file) => (
            <div key={file.id} className="bg-white rounded-lg shadow-md p-6">
              <div className="flex items-start justify-between mb-4">
                {getFileIcon(file.file_type)}
                <div className="flex space-x-2">
                  <button
                    onClick={() => setSelectedFile(file)}
                    className="text-blue-600 hover:text-blue-800"
                  >
                    <Eye className="h-5 w-5" />
                  </button>
                  <button
                    onClick={() => handleDeleteFile(file.id)}
                    className="text-red-600 hover:text-red-800"
                  >
                    <Trash2 className="h-5 w-5" />
                  </button>
                </div>
              </div>
              
              <h3 className="text-lg font-semibold text-gray-900 mb-2 truncate">
                {file.original_filename}
              </h3>
              
              <div className="text-sm text-gray-600 mb-4">
                <p>Size: {formatFileSize(file.file_size)}</p>
                <p>Type: {file.file_type}</p>
                <p>Uploaded: {new Date(file.created_at).toLocaleDateString()}</p>
              </div>
              
              <div className="flex space-x-2">
                <button
                  onClick={() => handleGenerateSummary(file.id)}
                  disabled={loadingSummary}
                  className="flex-1 px-3 py-2 bg-blue-600 text-white text-sm rounded hover:bg-blue-700 disabled:opacity-50"
                >
                  {loadingSummary ? 'Generating...' : 'Summarize'}
                </button>
                {file.file_type === 'audio' || file.file_type === 'video' ? (
                  <button
                    onClick={() => setSelectedFile(file)}
                    className="flex-1 px-3 py-2 bg-green-600 text-white text-sm rounded hover:bg-green-700"
                  >
                    Play
                  </button>
                ) : null}
              </div>
            </div>
          ))}
        </div>

        {/* File Details */}
        {selectedFile && (
          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex justify-between items-start mb-4">
              <h2 className="text-2xl font-bold text-gray-900">{selectedFile.original_filename}</h2>
              <button
                onClick={() => setSelectedFile(null)}
                className="text-gray-500 hover:text-gray-700"
              >
                ×
              </button>
            </div>
            
            {summary && summary.file_id === selectedFile.id && (
              <div className="mb-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-3">Summary</h3>
                <div className="bg-gray-50 p-4 rounded-md">
                  <p className="text-gray-700 mb-4">{summary.summary}</p>
                  {summary.key_points && summary.key_points.length > 0 && (
                    <div>
                      <h4 className="font-semibold text-gray-900 mb-2">Key Points:</h4>
                      <ul className="list-disc list-inside text-gray-700">
                        {summary.key_points.map((point, index) => (
                          <li key={index}>{point}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              </div>
            )}
            
            {selectedFile.file_type === 'audio' || selectedFile.file_type === 'video' ? (
              <MediaPlayer file={selectedFile} />
            ) : (
              <div className="bg-gray-50 p-4 rounded-md">
                <h3 className="text-lg font-semibold text-gray-900 mb-3">Extracted Text</h3>
                <div className="max-h-96 overflow-y-auto">
                  <p className="text-gray-700 whitespace-pre-wrap">
                    {selectedFile.extracted_text || 'No text extracted yet'}
                  </p>
                </div>
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
};

export default Dashboard;
