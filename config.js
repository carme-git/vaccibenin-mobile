import { Platform } from 'react-native';

const getApiUrl = () => {
  if (Platform.OS === 'web') {
    // Navigateur 
    return 'http://127.0.0.1:8000/api';
  }
  // Mobile 
  return 'http://10.55.127.204:8000/api';
};

export const API_URL = getApiUrl();

const CONFIG = { API_URL };
export default CONFIG;