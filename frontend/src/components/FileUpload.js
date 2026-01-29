import React, { useState, useRef } from 'react';
import axios from 'axios';
import { Upload, X, FileText, AlertCircle } from 'lucide-react';

const FileUpload = ({ onFileUpload }) => {
  const [dragActive, setDragActive] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');
  const [progress, setProgress] = useState(0);
  const fileInputRef = useRef(null);

  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFiles(e.dataTransfer.files);
    }
  };

  const handleChange = (e) => {
    e.preventDefault();
    if (e.target.files && e.target.files[0]) {
      handleFiles(e.target.files);
    }
  };

  const handleFiles = async (files) => {
    const file = files[0];
    setError('');
    setProgress(0);

    // Validate file type
    const allowedTypes = ['.pdf', '.mp3', '.mp4', '.wav', '.m4a', '.mov'];
    const fileExtension = '.' + file.name.split('.').pop().toLowerCase();
    
    if (!allowedTypes.includes(fileExtension)) {
      setError(`File type ${fileExtension} not allowed. Allowed types: ${allowedTypes.join(', ')}`);
      return;
    }

    // Validate file size (100MB)
    const maxSize = 100 * 1024 * 1024;
    if (file.size > maxSize) {
      setError('File size exceeds 100MB limit');
      return;
    }

    setUploading(true);

    const formData = new FormData();
    formData.append('file', file);

    try {
      const response = await axios.post('/api/upload', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
        onUploadProgress: (progressEvent) => {
          const percentCompleted = Math.round(
            (progressEvent.loaded * 100) / progressEvent.total
          );
          setProgress(percentCompleted);
        },
      });

      onFileUpload(response.data);
      setProgress(0);
      
      // Reset file input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to upload file');
      setProgress(0);
    } finally {
      setUploading(false);
    }
  };

  const onButtonClick = () => {
    fileInputRef.current?.click();
  };

  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  return (
    <div className="w-full">
      <div
        className={`relative border-2 border-dashed rounded-lg p-6 text-center transition-colors ${
          dragActive
            ? 'border-blue-400 bg-blue-50'
            : 'border-gray-300 bg-white hover:border-gray-400'
        }`}
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
      >
        <input
          ref={fileInputRef}
          type="file"
          onChange={handleChange}
          accept=".pdf,.mp3,.mp4,.wav,.m4a,.mov"
          className="hidden"
        />

        {uploading ? (
          <div className="space-y-4">
            <div className="flex justify-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            </div>
            <div>
              <p className="text-sm text-gray-600 mb-2">Uploading file...</p>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div
                  className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${progress}%` }}
                ></div>
              </div>
              <p className="text-xs text-gray-500 mt-1">{progress}%</p>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="flex justify-center">
              <Upload className="h-12 w-12 text-gray-400" />
            </div>
            <div>
              <p className="text-lg font-medium text-gray-900">
                Drop your files here, or{' '}
                <button
                  type="button"
                  onClick={onButtonClick}
                  className="text-blue-600 hover:text-blue-500 font-medium"
                >
                  browse
                </button>
              </p>
              <p className="text-sm text-gray-500 mt-1">
                Supported formats: PDF, MP3, MP4, WAV, M4A, MOV
              </p>
              <p className="text-xs text-gray-400 mt-1">
                Maximum file size: 100MB
              </p>
            </div>
          </div>
        )}
      </div>

      {error && (
        <div className="mt-4 bg-red-50 border border-red-200 rounded-md p-4">
          <div className="flex">
            <AlertCircle className="h-5 w-5 text-red-400 mr-2" />
            <div className="text-sm text-red-600">
              {error}
            </div>
          </div>
        </div>
      )}

      {/* File Type Info */}
      <div className="mt-6 grid grid-cols-3 gap-4">
        <div className="text-center p-3 bg-gray-50 rounded-md">
          <FileText className="h-8 w-8 text-red-500 mx-auto mb-2" />
          <p className="text-sm font-medium text-gray-900">PDF</p>
          <p className="text-xs text-gray-500">Documents</p>
        </div>
        <div className="text-center p-3 bg-gray-50 rounded-md">
          <div className="h-8 w-8 bg-green-500 rounded-full mx-auto mb-2 flex items-center justify-center">
            <span className="text-white text-xs font-bold">♫</span>
          </div>
          <p className="text-sm font-medium text-gray-900">Audio</p>
          <p className="text-xs text-gray-500">MP3, WAV, M4A</p>
        </div>
        <div className="text-center p-3 bg-gray-50 rounded-md">
          <div className="h-8 w-8 bg-blue-500 rounded-full mx-auto mb-2 flex items-center justify-center">
            <span className="text-white text-xs font-bold">▶</span>
          </div>
          <p className="text-sm font-medium text-gray-900">Video</p>
          <p className="text-xs text-gray-500">MP4, MOV</p>
        </div>
      </div>
    </div>
  );
};

export default FileUpload;
