// deconnexion.js — Utilitaire partagé VacciBenin
// Importer dans chaque dashboard : import { deconnecter } from './deconnexion';

import AsyncStorage from '@react-native-async-storage/async-storage';
import { Alert } from 'react-native';

/**
 * Efface la session et redirige vers l'écran de connexion.
 * @param {object} navigation - objet navigation de React Navigation
 */
export const deconnecter = async (navigation) => {
  try {
    await AsyncStorage.multiRemove(['token', 'role', 'user']);
  } catch (e) {
    console.error('Erreur lors de la déconnexion:', e);
  }
  // reset() empêche de revenir en arrière avec le bouton retour
  navigation.reset({
    index: 0,
    routes: [{ name: 'Connexion' }],
  });
};

/**
 * Demande confirmation avant de déconnecter.
 * @param {object} navigation
 */
export const deconnecterAvecConfirmation = (navigation) => {
  Alert.alert(
    'Déconnexion',
    'Voulez-vous vous déconnecter ?',
    [
      { text: 'Annuler', style: 'cancel' },
      {
        text: 'Se déconnecter',
        style: 'destructive',
        onPress: () => deconnecter(navigation),
      },
    ]
  );
};