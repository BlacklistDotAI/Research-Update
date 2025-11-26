import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { Navbar } from '../components/Navbar';
import { SEO } from '../components/SEO';
import { ResultCard } from '../components/ResultCard';
import { isAuthenticated } from '../utils/auth';
import { getSavedFiles, deleteFile, SavedFile } from '../utils/storage';
import { trackEvent } from '../components/GoogleAnalytics';

export const Files = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [files, setFiles] = useState<SavedFile[]>([]);
  const [selectedFile, setSelectedFile] = useState<SavedFile | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<'mobile-detail' | 'desktop'>('desktop');

  useEffect(() => {
    if (!isAuthenticated()) {
      navigate('/login');
      return;
    }
    loadFiles();
  }, [navigate]);

  const loadFiles = () => {
    setFiles(getSavedFiles());
  };

  const handleDelete = (id: string) => {
    trackEvent('click', 'button', 'delete_file', 1);
    deleteFile(id);
    loadFiles();
    setDeleteConfirm(null);
    if (selectedFile?.id === id) {
      setSelectedFile(null);
    }
    trackEvent('complete', 'file', 'file_deleted', 1);
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('vi-VN', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const formatShortDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffTime = Math.abs(now.getTime() - date.getTime());
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays === 0) return t('pageFiles.today');
    if (diffDays === 1) return t('pageFiles.yesterday');
    if (diffDays < 7) return `${diffDays} ${t('pageFiles.daysAgo')}`;
    
    return date.toLocaleDateString('vi-VN', {
      month: 'short',
      day: 'numeric',
    });
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
  };

  const getRiskColor = (score: number) => {
    if (score >= 70) return {
      text: 'text-red-700',
      bg: 'bg-red-50',
      border: 'border-red-200',
      iconBg: 'bg-red-100',
      gradient: 'from-red-500 to-red-600'
    };
    if (score >= 40) return {
      text: 'text-yellow-700',
      bg: 'bg-yellow-50',
      border: 'border-yellow-200',
      iconBg: 'bg-yellow-100',
      gradient: 'from-yellow-500 to-yellow-600'
    };
    return {
      text: 'text-green-700',
      bg: 'bg-green-50',
      border: 'border-green-200',
      iconBg: 'bg-green-100',
      gradient: 'from-green-500 to-green-600'
    };
  };

  const getFileIcon = (fileName: string) => {
    const ext = fileName.split('.').pop()?.toLowerCase();
    if (['mp3', 'wav', 'm4a', 'aac', 'ogg'].includes(ext || '')) {
      return (
        <svg className="w-8 h-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3" />
        </svg>
      );
    }
    return (
      <svg className="w-8 h-8 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
      </svg>
    );
  };

  if (!isAuthenticated()) {
    return null;
  }

  return (
    <div className="min-h-screen flex flex-col bg-gray-50 overflow-x-hidden w-full">
      <SEO 
        title={`${t('pageFiles.title')} - ${t('common.appName')}`}
        description={t('pageFiles.description')}
      />
      <Navbar showAuth={true} />
      <main className="flex-1 max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-4 sm:py-6 lg:py-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="space-y-4 sm:space-y-6"
        >
          {/* Header */}
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent mb-1 sm:mb-2">
                {t('pageFiles.title')}
              </h1>
              <p className="text-xs sm:text-sm lg:text-base text-gray-600">
                {t('pageFiles.description')} ({files.length} {t('pageFiles.files')})
              </p>
            </div>
            {files.length > 0 && (
              <motion.button
                onClick={() => setViewMode(viewMode === 'mobile-detail' ? 'desktop' : 'mobile-detail')}
                className="lg:hidden px-3 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-all"
                whileTap={{ scale: 0.95 }}
              >
                {viewMode === 'mobile-detail' ? t('pageFiles.showList') : t('pageFiles.showDetail')}
              </motion.button>
            )}
          </div>

          {files.length === 0 ? (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="bg-white rounded-xl shadow-lg border-2 border-gray-200 p-8 sm:p-12 lg:p-16 text-center"
            >
              <motion.div
                animate={{ y: [0, -10, 0] }}
                transition={{ duration: 2, repeat: Infinity, repeatDelay: 1 }}
              >
                <svg className="w-16 h-16 sm:w-20 sm:h-20 mx-auto mb-4 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </motion.div>
              <p className="text-sm sm:text-base text-gray-500 mb-4">{t('pageFiles.empty')}</p>
              <motion.a
                href="/scan"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="inline-block px-6 py-3 text-sm font-medium text-white bg-gray-900 rounded-lg hover:bg-gray-800 transition-all shadow-md hover:shadow-lg"
              >
                {t('pageFiles.goToDashboard')}
              </motion.a>
            </motion.div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">
              {/* Files List - Desktop: Sidebar, Mobile: Full width or hidden */}
              {(() => {
                // Check window width only on client side
                if (typeof window === 'undefined') return viewMode === 'desktop';
                return viewMode === 'desktop' || window.innerWidth >= 1024;
              })() && (
                <motion.div
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.5, delay: 0.1 }}
                  className={`${viewMode === 'mobile-detail' ? 'hidden lg:block' : ''} lg:col-span-1`}
                >
                  <div className="bg-white rounded-xl shadow-lg border-2 border-gray-200 p-4 sm:p-5 lg:p-6">
                    <h2 className="text-base sm:text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                      <div className="p-2 bg-gradient-to-br from-gray-900 to-gray-800 rounded-lg">
                        <svg className="w-4 h-4 sm:w-5 sm:h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </svg>
                      </div>
                      <span>{t('pageFiles.listTitle')}</span>
                      <span className="ml-auto text-xs sm:text-sm font-normal text-gray-500 bg-gray-100 px-2 py-1 rounded-full">
                        {files.length}
                      </span>
                    </h2>

                    <div className="space-y-2 sm:space-y-3 max-h-[calc(100vh-280px)] overflow-y-auto pr-2">
                      <AnimatePresence>
                        {files.map((file, index) => {
                          const riskColors = getRiskColor(file.result.riskScore);
                          const isSelected = selectedFile?.id === file.id;
                          
                          return (
                            <motion.div
                              key={file.id}
                              initial={{ opacity: 0, x: -10 }}
                              animate={{ opacity: 1, x: 0 }}
                              exit={{ opacity: 0, x: -10, scale: 0.95 }}
                              transition={{ delay: index * 0.03, duration: 0.3 }}
                              whileHover={{ scale: 1.02, x: 4 }}
                              whileTap={{ scale: 0.98 }}
                              className={`group relative p-3 sm:p-4 rounded-xl border-2 cursor-pointer transition-all duration-300 ${
                                isSelected
                                  ? 'border-gray-900 bg-gradient-to-br from-gray-50 to-gray-100/50 shadow-lg scale-[1.02]'
                                  : 'border-gray-200 bg-white hover:border-gray-400 hover:shadow-md'
                              }`}
                              onClick={() => {
                                setSelectedFile(file);
                                if (typeof window !== 'undefined' && window.innerWidth < 1024) {
                                  setViewMode('mobile-detail');
                                }
                              }}
                            >
                              <div className="flex items-start gap-3">
                                {/* File Icon */}
                                <div className={`flex-shrink-0 p-2 rounded-lg ${isSelected ? 'bg-gray-200' : 'bg-gray-100 group-hover:bg-gray-200'} transition-colors`}>
                                  {getFileIcon(file.fileName)}
                                </div>
                                
                                {/* File Info */}
                                <div className="flex-1 min-w-0">
                                  <p className="text-xs sm:text-sm font-semibold text-gray-900 truncate mb-1.5 group-hover:text-gray-950 transition-colors">
                                    {file.fileName}
                                  </p>
                                  <div className="flex items-center gap-2 mb-2 flex-wrap">
                                    <span className="text-[10px] sm:text-xs text-gray-500 flex items-center gap-1">
                                      <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                                      </svg>
                                      {formatShortDate(file.uploadedAt)}
                                    </span>
                                    <span className="text-[10px] sm:text-xs text-gray-400">•</span>
                                    <span className="text-[10px] sm:text-xs text-gray-500">{formatFileSize(file.fileSize)}</span>
                                  </div>
                                  
                                  {/* Risk Score Badge */}
                                  <div className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg border-2 ${riskColors.border} ${riskColors.bg} ${riskColors.text}`}>
                                    <div className={`w-1.5 h-1.5 rounded-full ${riskColors.iconBg}`}></div>
                                    <span className="text-xs font-bold">{file.result.riskScore}%</span>
                                    <span className="text-[10px] font-medium">{t('pageFiles.risk')}</span>
                                  </div>
                                </div>

                                {/* Delete Button */}
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    if (deleteConfirm === file.id) {
                                      handleDelete(file.id);
                                    } else {
                                      setDeleteConfirm(file.id);
                                    }
                                  }}
                                  className={`flex-shrink-0 p-1.5 rounded-lg transition-all ${
                                    deleteConfirm === file.id
                                      ? 'bg-red-100 text-red-700'
                                      : 'text-gray-400 hover:bg-red-50 hover:text-red-600 group-hover:opacity-100 opacity-0'
                                  }`}
                                  title={t('pageFiles.delete')}
                                >
                                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                  </svg>
                                </button>
                              </div>

                              {/* Selected Indicator */}
                              {isSelected && (
                                <motion.div
                                  initial={{ scale: 0 }}
                                  animate={{ scale: 1 }}
                                  className="absolute -top-1 -right-1 w-3 h-3 bg-gray-900 rounded-full border-2 border-white"
                                />
                              )}
                            </motion.div>
                          );
                        })}
                      </AnimatePresence>
                    </div>
                  </div>
                </motion.div>
              )}

              {/* File Details */}
              {((viewMode === 'desktop' && selectedFile) || viewMode === 'mobile-detail') && (
                <motion.div
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.5, delay: 0.2 }}
                  className="lg:col-span-2"
                >
                  {selectedFile ? (
                    <div className="bg-white rounded-xl shadow-lg border-2 border-gray-200 p-4 sm:p-6 lg:p-8 space-y-4 sm:space-y-6">
                      {/* File Header */}
                      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4 pb-4 sm:pb-6 border-b border-gray-200">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start gap-3 sm:gap-4 mb-3">
                            <div className="flex-shrink-0 p-3 bg-gradient-to-br from-gray-100 to-gray-200 rounded-xl">
                              {getFileIcon(selectedFile.fileName)}
                            </div>
                            <div className="flex-1 min-w-0">
                              <h2 className="text-base sm:text-lg lg:text-xl font-bold text-gray-900 mb-2 break-words">
                                {selectedFile.fileName}
                              </h2>
                              <div className="flex flex-wrap gap-2 sm:gap-3 text-xs sm:text-sm text-gray-600">
                                <span className="flex items-center gap-1.5 bg-gray-50 px-2.5 py-1 rounded-lg">
                                  <svg className="w-3.5 h-3.5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                  </svg>
                                  {formatDate(selectedFile.uploadedAt)}
                                </span>
                                <span className="flex items-center gap-1.5 bg-gray-50 px-2.5 py-1 rounded-lg">
                                  <svg className="w-3.5 h-3.5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4" />
                                  </svg>
                                  {formatFileSize(selectedFile.fileSize)}
                                </span>
                              </div>
                            </div>
                          </div>
                          
                          {/* Risk Score Badge Large */}
                          <div className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl border-2 ${getRiskColor(selectedFile.result.riskScore).border} ${getRiskColor(selectedFile.result.riskScore).bg} ${getRiskColor(selectedFile.result.riskScore).text}`}>
                            <div className={`w-2 h-2 rounded-full ${getRiskColor(selectedFile.result.riskScore).iconBg}`}></div>
                            <span className="text-lg sm:text-xl font-bold">{selectedFile.result.riskScore}%</span>
                            <span className="text-xs sm:text-sm font-medium">{t('pageFiles.riskScore')}</span>
                          </div>
                        </div>
                        
                        <div className="flex items-center gap-2 sm:gap-3">
                          {typeof window !== 'undefined' && window.innerWidth < 1024 && viewMode === 'mobile-detail' && (
                            <motion.button
                              onClick={() => setViewMode('desktop')}
                              whileTap={{ scale: 0.95 }}
                              className="px-3 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-all"
                            >
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                              </svg>
                            </motion.button>
                          )}
                          <motion.button
                            onClick={() => {
                              if (deleteConfirm === selectedFile.id) {
                                handleDelete(selectedFile.id);
                              } else {
                                setDeleteConfirm(selectedFile.id);
                              }
                            }}
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            className={`px-3 sm:px-4 py-2 text-xs sm:text-sm font-medium rounded-lg transition-all border ${
                              deleteConfirm === selectedFile.id
                                ? 'text-red-700 bg-red-100 border-red-300'
                                : 'text-red-600 bg-red-50 border-red-200 hover:bg-red-100 hover:border-red-300'
                            }`}
                          >
                            {deleteConfirm === selectedFile.id ? t('pageFiles.confirmDelete') : t('pageFiles.delete')}
                          </motion.button>
                        </div>
                      </div>

                      {/* Delete Confirmation */}
                      {deleteConfirm === selectedFile.id && (
                        <motion.div
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: 'auto' }}
                          exit={{ opacity: 0, height: 0 }}
                          className="bg-gradient-to-br from-red-50 to-red-100/50 border-2 border-red-200 rounded-xl p-4 sm:p-5"
                        >
                          <div className="flex items-start gap-3 mb-3">
                            <div className="flex-shrink-0 p-2 bg-red-200 rounded-lg">
                              <svg className="w-5 h-5 text-red-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                              </svg>
                            </div>
                            <p className="text-sm sm:text-base text-red-800 font-medium">{t('pageFiles.deleteWarning')}</p>
                          </div>
                          <div className="flex flex-col sm:flex-row gap-2 sm:gap-3">
                            <motion.button
                              onClick={() => handleDelete(selectedFile.id)}
                              whileHover={{ scale: 1.02 }}
                              whileTap={{ scale: 0.98 }}
                              className="flex-1 px-4 py-2.5 text-sm font-medium text-white bg-red-600 rounded-lg hover:bg-red-700 transition-colors shadow-md"
                            >
                              {t('pageFiles.confirmDelete')}
                            </motion.button>
                            <motion.button
                              onClick={() => setDeleteConfirm(null)}
                              whileHover={{ scale: 1.02 }}
                              whileTap={{ scale: 0.98 }}
                              className="flex-1 px-4 py-2.5 text-sm font-medium text-gray-700 bg-white border-2 border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                            >
                              {t('pageFiles.cancel')}
                            </motion.button>
                          </div>
                        </motion.div>
                      )}

                      {/* Results */}
                      <ResultCard result={selectedFile.result} />
                    </div>
                  ) : viewMode === 'desktop' ? (
                    <motion.div
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      className="bg-white rounded-xl shadow-lg border-2 border-gray-200 p-8 sm:p-12 lg:p-16 text-center"
                    >
                      <motion.div
                        animate={{ y: [0, -10, 0], rotate: [0, 5, -5, 0] }}
                        transition={{ duration: 3, repeat: Infinity, repeatDelay: 1 }}
                      >
                        <svg className="w-16 h-16 sm:w-20 sm:h-20 mx-auto mb-4 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 15l-2 5L9 9l11 4-5 2zm0 0l5 5M7.188 2.239l.777 2.897M5.136 7.965l-2.898-.777M13.95 4.05l-2.122 2.122m-5.657 5.656l-2.12 2.122" />
                        </svg>
                      </motion.div>
                      <p className="text-sm sm:text-base text-gray-500 mb-1">{t('pageFiles.selectFile')}</p>
                      <p className="text-xs sm:text-sm text-gray-400">{t('pageFiles.selectFileHint')}</p>
                    </motion.div>
                  ) : (
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className="bg-white rounded-xl shadow-lg border-2 border-gray-200 p-6 text-center"
                    >
                      <p className="text-sm text-gray-500 mb-4">{t('pageFiles.selectFile')}</p>
                      <motion.button
                        onClick={() => setViewMode('desktop')}
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border-2 border-gray-300 rounded-lg hover:bg-gray-50 transition-all"
                      >
                        {t('pageFiles.showList')}
                      </motion.button>
                    </motion.div>
                  )}
                </motion.div>
              )}
            </div>
          )}
        </motion.div>
      </main>
    </div>
  );
};

