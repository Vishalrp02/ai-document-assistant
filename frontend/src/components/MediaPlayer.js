import React, { useState, useRef } from 'react';
import ReactPlayer from 'react-player';
import { Play, Pause, Volume2, VolumeX, SkipBack, SkipForward } from 'lucide-react';

const MediaPlayer = ({ file }) => {
  const [playing, setPlaying] = useState(false);
  const [volume, setVolume] = useState(0.8);
  const [muted, setMuted] = useState(false);
  const [played, setPlayed] = useState(0);
  const [duration, setDuration] = useState(0);
  const [playbackRate, setPlaybackRate] = useState(1.0);
  const playerRef = useRef(null);

  const handlePlayPause = () => {
    setPlaying(!playing);
  };

  const handleVolumeChange = (e) => {
    setVolume(parseFloat(e.target.value));
  };

  const handleMute = () => {
    setMuted(!muted);
  };

  const handleProgress = (progress) => {
    setPlayed(progress.played);
  };

  const handleDuration = (duration) => {
    setDuration(duration);
  };

  const handleSeekChange = (e) => {
    setPlayed(parseFloat(e.target.value));
  };

  const handleSeekMouseUp = (e) => {
    playerRef.current?.seekTo(parseFloat(e.target.value));
  };

  const handlePlaybackRateChange = () => {
    const rates = [0.5, 0.75, 1.0, 1.25, 1.5, 2.0];
    const currentIndex = rates.indexOf(playbackRate);
    const nextIndex = (currentIndex + 1) % rates.length;
    setPlaybackRate(rates[nextIndex]);
  };

  const skipTime = (seconds) => {
    const currentTime = played * duration;
    const newTime = Math.max(0, Math.min(duration, currentTime + seconds));
    playerRef.current?.seekTo(newTime / duration);
  };

  const jumpToTimestamp = (timestamp) => {
    if (duration > 0) {
      playerRef.current?.seekTo(timestamp / duration);
      setPlaying(true);
    }
  };

  const formatTime = (seconds) => {
    const date = new Date(seconds * 1000);
    const hh = date.getUTCHours();
    const mm = date.getUTCMinutes();
    const ss = date.getUTCSeconds().toString().padStart(2, '0');
    if (hh) {
      return `${hh}:${mm.toString().padStart(2, '0')}:${ss}`;
    }
    return `${mm}:${ss}`;
  };

  const getFileUrl = () => {
    // In a real application, this would be the actual URL to the file
    // For now, we'll assume the file is served from the uploads directory
    return `/uploads/${file.filename}`;
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">Media Player</h3>
      
      {/* Video/Audio Player */}
      <div className="mb-4">
        <ReactPlayer
          ref={playerRef}
          url={getFileUrl()}
          width="100%"
          height={file.file_type === 'video' ? '400px' : '50px'}
          playing={playing}
          volume={volume}
          muted={muted}
          playbackRate={playbackRate}
          onProgress={handleProgress}
          onDuration={handleDuration}
          controls={false}
          config={{
            file: {
              attributes: {
                controlsList: 'nodownload'
              }
            }
          }}
        />
      </div>

      {/* Custom Controls */}
      <div className="space-y-4">
        {/* Progress Bar */}
        <div className="flex items-center space-x-3">
          <span className="text-sm text-gray-600 w-12">
            {formatTime(played * duration)}
          </span>
          <input
            type="range"
            min={0}
            max={0.999999}
            step="any"
            value={played}
            onChange={handleSeekChange}
            onMouseUp={handleSeekMouseUp}
            className="flex-1 h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
          />
          <span className="text-sm text-gray-600 w-12">
            {formatTime(duration)}
          </span>
        </div>

        {/* Control Buttons */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <button
              onClick={() => skipTime(-10)}
              className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded"
              title="Skip back 10s"
            >
              <SkipBack className="h-5 w-5" />
            </button>
            
            <button
              onClick={handlePlayPause}
              className="p-3 bg-blue-600 text-white rounded-full hover:bg-blue-700"
            >
              {playing ? <Pause className="h-5 w-5" /> : <Play className="h-5 w-5" />}
            </button>
            
            <button
              onClick={() => skipTime(10)}
              className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded"
              title="Skip forward 10s"
            >
              <SkipForward className="h-5 w-5" />
            </button>
          </div>

          <div className="flex items-center space-x-3">
            <button
              onClick={handleMute}
              className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded"
            >
              {muted ? <VolumeX className="h-5 w-5" /> : <Volume2 className="h-5 w-5" />}
            </button>
            
            <input
              type="range"
              min={0}
              max={1}
              step="any"
              value={volume}
              onChange={handleVolumeChange}
              className="w-24 h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
            />
            
            <button
              onClick={handlePlaybackRateChange}
              className="px-3 py-1 text-sm bg-gray-200 text-gray-700 rounded hover:bg-gray-300"
            >
              {playbackRate}x
            </button>
          </div>
        </div>
      </div>

      {/* Timestamps from metadata */}
      {file.metadata && file.metadata.timestamps && file.metadata.timestamps.length > 0 && (
        <div className="mt-6">
          <h4 className="text-md font-semibold text-gray-900 mb-3">Timestamps</h4>
          <div className="max-h-48 overflow-y-auto space-y-2">
            {file.metadata.timestamps.map((timestamp, index) => (
              <button
                key={index}
                onClick={() => jumpToTimestamp(timestamp.start)}
                className="w-full text-left p-3 bg-gray-50 rounded hover:bg-gray-100 transition-colors"
              >
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <p className="text-sm text-gray-700 line-clamp-2">
                      {timestamp.text}
                    </p>
                    <p className="text-xs text-gray-500 mt-1">
                      {formatTime(timestamp.start)} - {formatTime(timestamp.end)}
                    </p>
                  </div>
                  <div className="ml-3">
                    <Play className="h-4 w-4 text-blue-600" />
                  </div>
                </div>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* File Info */}
      <div className="mt-6 pt-4 border-t border-gray-200">
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <span className="font-medium text-gray-900">Duration:</span>
            <span className="ml-2 text-gray-600">
              {formatTime(file.metadata?.duration || 0)}
            </span>
          </div>
          <div>
            <span className="font-medium text-gray-900">Language:</span>
            <span className="ml-2 text-gray-600">
              {file.metadata?.language || 'Unknown'}
            </span>
          </div>
          <div>
            <span className="font-medium text-gray-900">File Size:</span>
            <span className="ml-2 text-gray-600">
              {(file.file_size / (1024 * 1024)).toFixed(2)} MB
            </span>
          </div>
          <div>
            <span className="font-medium text-gray-900">Type:</span>
            <span className="ml-2 text-gray-600 capitalize">
              {file.file_type}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MediaPlayer;
