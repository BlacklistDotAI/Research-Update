import { motion } from 'framer-motion';
import { useTranslation } from 'react-i18next';

export const LanguageSwitcher = () => {
  const { i18n } = useTranslation();

  const changeLanguage = (lng: string) => {
    i18n.changeLanguage(lng);
  };

  return (
    <div className="flex items-center space-x-1 sm:space-x-2 bg-gray-100 rounded-lg p-1">
      <motion.button
        onClick={() => changeLanguage('vi')}
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        className={`px-2 sm:px-3 py-1 text-xs sm:text-sm rounded-md font-medium transition-all ${
          i18n.language === 'vi'
            ? 'bg-white text-gray-900 shadow-sm'
            : 'text-gray-600 hover:text-gray-900'
        }`}
      >
        VI
      </motion.button>
      <motion.button
        onClick={() => changeLanguage('en')}
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        className={`px-2 sm:px-3 py-1 text-xs sm:text-sm rounded-md font-medium transition-all ${
          i18n.language === 'en'
            ? 'bg-white text-gray-900 shadow-sm'
            : 'text-gray-600 hover:text-gray-900'
        }`}
      >
        EN
      </motion.button>
    </div>
  );
};

