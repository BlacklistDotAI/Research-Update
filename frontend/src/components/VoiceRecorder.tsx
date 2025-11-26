import { useState, useRef, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { analyzeAudio, AnalysisResult } from '../utils/api';
import { ResultCard } from './ResultCard';
import { trackEvent } from './GoogleAnalytics';

interface VoiceRecorderProps {
  maxDuration?: number; // in seconds
}

export const VoiceRecorder = ({ maxDuration = 15 }: VoiceRecorderProps) => {
  const { t } = useTranslation();
  const [isRecording, setIsRecording] = useState(false);
  const [timeRemaining, setTimeRemaining] = useState(maxDuration);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [mediaRecorder, setMediaRecorder] = useState<MediaRecorder | null>(null);
  const [audioChunks, setAudioChunks] = useState<Blob[]>([]);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  
  const streamRef = useRef<MediaStream | null>(null);
  const timerRef = useRef<number | null>(null);
  const countdownRef = useRef<number | null>(null);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      // Cleanup recording state
      if (timerRef.current) window.clearTimeout(timerRef.current);
      if (countdownRef.current) window.clearInterval(countdownRef.current);
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
      }
      if (mediaRecorder && isRecording) {
        mediaRecorder.stop();
      }
      if (audioUrl) URL.revokeObjectURL(audioUrl);
    };
  }, [audioUrl, mediaRecorder, isRecording]);

  const startRecording = async () => {
    trackEvent('click', 'button', 'start_recording', 1);
    try {
      setError(null);
      setResult(null);
      setAudioChunks([]);
      if (audioUrl) {
        URL.revokeObjectURL(audioUrl);
        setAudioUrl(null);
      }

      // Request microphone access
      const stream = await navigator.mediaDevices.getUserMedia({ 
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
        } 
      });
      streamRef.current = stream;

      // Determine MIME type (prefer webm with opus, fallback to default)
      let mimeType = 'audio/webm;codecs=opus';
      if (!MediaRecorder.isTypeSupported(mimeType)) {
        mimeType = 'audio/webm';
        if (!MediaRecorder.isTypeSupported(mimeType)) {
          mimeType = ''; // Browser will choose default
        }
      }

      const recorder = new MediaRecorder(stream, {
        mimeType,
        audioBitsPerSecond: 128000, // 128 kbps for compression
      });

      const chunks: Blob[] = [];
      
      recorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          chunks.push(event.data);
        }
      };

      recorder.onstop = () => {
        const audioBlob = new Blob(chunks, { type: mimeType || 'audio/webm' });
        setAudioChunks(chunks);
        
        // Create preview URL
        const url = URL.createObjectURL(audioBlob);
        setAudioUrl(url);
        
        // Upload to API
        uploadAudio(audioBlob);
      };

      recorder.start(100); // Collect data every 100ms
      setMediaRecorder(recorder);
      setIsRecording(true);
      setTimeRemaining(maxDuration);

      // Countdown timer
      countdownRef.current = window.setInterval(() => {
        setTimeRemaining((prev) => {
          if (prev <= 1) {
            if (countdownRef.current) window.clearInterval(countdownRef.current);
            stopRecording();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);

      // Auto-stop after maxDuration
      timerRef.current = window.setTimeout(() => {
        stopRecording();
      }, maxDuration * 1000);

    } catch (err) {
      console.error('Error starting recording:', err);
      setError(err instanceof Error ? err.message : t('pageVoice.error.microphone'));
      setIsRecording(false);
    }
  };

  const stopRecording = () => {
      trackEvent('click', 'button', 'stop_recording', 1);
      if (timerRef.current) {
        window.clearTimeout(timerRef.current);
        timerRef.current = null;
      }
      if (countdownRef.current) {
        window.clearInterval(countdownRef.current);
        countdownRef.current = null;
      }

    if (mediaRecorder && mediaRecorder.state !== 'inactive') {
      mediaRecorder.stop();
    }

    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }

    setIsRecording(false);
    setMediaRecorder(null);
  };

  const uploadAudio = async (audioBlob: Blob) => {
    setIsUploading(true);
    setUploadProgress(0);
    setError(null);

    try {
      // Create File object from Blob
      const audioFile = new File([audioBlob], 'recording.webm', { 
        type: audioBlob.type || 'audio/webm' 
      });

      // Simulate progress (API doesn't provide real progress)
      const progressInterval = setInterval(() => {
        setUploadProgress((prev) => {
          if (prev >= 90) {
            clearInterval(progressInterval);
            return 90;
          }
          return prev + 10;
        });
      }, 200);

      // Call API
      const analysisResult = await analyzeAudio(audioFile);
      
      clearInterval(progressInterval);
      setUploadProgress(100);
      setResult(analysisResult);
      
      // Track successful analysis
      trackEvent('complete', 'analysis', analysisResult.flagged ? 'scam_detected_voice' : 'safe_voice', Math.round(analysisResult.riskScore * 100));

    } catch (err) {
      console.error('Error uploading audio:', err);
      trackEvent('error', 'analysis', 'voice_recording_failed', 0);
      setError(
        err instanceof Error 
          ? err.message 
          : t('pageVoice.error.upload')
      );
    } finally {
      setIsUploading(false);
      setTimeout(() => setUploadProgress(0), 500);
    }
  };

  const reset = () => {
    stopRecording();
    setResult(null);
    setError(null);
    setTimeRemaining(maxDuration);
    setUploadProgress(0);
    if (audioUrl) {
      URL.revokeObjectURL(audioUrl);
      setAudioUrl(null);
    }
  };

  const formatTime = (seconds: number) => {
    return `${seconds}s`;
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
  };

  const getAudioBlobSize = () => {
    if (audioChunks.length === 0) return 0;
    return audioChunks.reduce((total, chunk) => total + chunk.size, 0);
  };

  return (
    <div className="space-y-6">
      {/* Recording Controls */}
      <div className="bg-white rounded-xl border-2 border-gray-200 hover:border-gray-300 p-6 md:p-8 shadow-lg">
        <div className="flex flex-col items-center space-y-6">
          {/* Countdown Timer */}
          {isRecording && (
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="text-center"
            >
              <motion.div
                animate={{ scale: [1, 1.1, 1] }}
                transition={{ duration: 1, repeat: Infinity }}
                className="text-4xl md:text-5xl font-bold text-red-600 mb-2"
              >
                {formatTime(timeRemaining)}
              </motion.div>
              <p className="text-sm md:text-base text-gray-600">
                {t('pageVoice.recording')}
              </p>
            </motion.div>
          )}

          {/* Recording Status Indicator */}
          {isRecording && (
            <motion.div
              className="flex items-center space-x-2"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
            >
              <motion.div
                className="w-3 h-3 bg-red-500 rounded-full"
                animate={{ scale: [1, 1.3, 1] }}
                transition={{ duration: 1, repeat: Infinity }}
              />
              <span className="text-sm text-gray-600">
                {t('pageVoice.recordingStatus')}
              </span>
            </motion.div>
          )}

          {/* Main Control Button */}
          <div className="flex flex-col sm:flex-row gap-3 items-center">
            {!isRecording ? (
              <motion.button
                onClick={startRecording}
                disabled={isUploading}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="px-4 sm:px-8 py-3 sm:py-4 bg-gradient-to-r from-gray-900 to-gray-800 text-white font-semibold rounded-xl shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 sm:gap-3 w-full sm:w-auto sm:min-w-[200px] justify-center"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
                </svg>
                <span>{t('pageVoice.startRecording')}</span>
              </motion.button>
            ) : (
              <motion.button
                onClick={stopRecording}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="px-8 py-4 bg-red-600 text-white font-semibold rounded-xl shadow-lg hover:bg-red-700 flex items-center gap-3 min-w-[200px] justify-center"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 10a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1h-4a1 1 0 01-1-1v-4z" />
                </svg>
                <span>{t('pageVoice.stopRecording')}</span>
              </motion.button>
            )}

            {/* Reset Button */}
            {(result || error) && !isRecording && (
              <motion.button
                onClick={reset}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="px-6 py-4 bg-gray-200 text-gray-700 font-semibold rounded-xl hover:bg-gray-300 flex items-center gap-2"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
                <span>{t('pageVoice.reset')}</span>
              </motion.button>
            )}
          </div>

          {/* Audio Info */}
          {audioChunks.length > 0 && !isRecording && (
            <div className="text-center text-sm text-gray-600 space-y-1">
              <p>{t('pageVoice.fileSize')}: {formatFileSize(getAudioBlobSize())}</p>
              {audioUrl && (
                <audio controls src={audioUrl} className="mt-2 w-full max-w-md mx-auto">
                  {t('pageVoice.audioNotSupported')}
                </audio>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Upload Progress */}
      {isUploading && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-xl border-2 border-blue-200 p-6 md:p-8 shadow-lg"
        >
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm md:text-base font-semibold text-gray-700">
                {t('pageVoice.uploading')}
              </span>
              <span className="text-sm md:text-base font-bold text-blue-600">
                {uploadProgress}%
              </span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden">
              <motion.div
                className="h-full bg-gradient-to-r from-blue-500 to-blue-600 rounded-full"
                initial={{ width: 0 }}
                animate={{ width: `${uploadProgress}%` }}
                transition={{ duration: 0.3 }}
              />
            </div>
          </div>
        </motion.div>
      )}

      {/* Error Display */}
      {error && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-red-50 border-2 border-red-200 rounded-xl p-6 md:p-8"
        >
          <div className="flex items-start gap-3">
            <svg className="w-6 h-6 text-red-600 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <div className="flex-1">
              <h3 className="font-semibold text-red-900 mb-1">
                {t('pageVoice.error.title')}
              </h3>
              <p className="text-sm text-red-700">{error}</p>
            </div>
          </div>
        </motion.div>
      )}

      {/* Results */}
      {result && !isUploading && (
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5 }}
        >
          <h3 className="text-xl md:text-2xl font-bold text-gray-900 mb-4">
            {t('pageVoice.results')}
          </h3>
          <ResultCard result={result} />
        </motion.div>
      )}
    </div>
  );
};

