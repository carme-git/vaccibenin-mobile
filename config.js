import { Platform } from 'react-native';

const getApiUrl = () => {
  if (Platform.OS === 'web') {
    return 'http://127.0.0.1:8000/api';
  }
  // Mobile Expo Go — votre IP locale
  return 'http://10.152.65.204:8000/api';
};

export const API_URL = getApiUrl();
const CONFIG = { API_URL };
export default CONFIG;