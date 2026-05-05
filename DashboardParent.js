// DashboardParent.js — Écran principal du parent
// Ce que voit un parent après connexion
// MODIFIÉ : données réelles via API Laravel + AsyncStorage + déconnexion

import React, { useState, useEffect } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet,
  SafeAreaView, ScrollView, FlatList,
  ActivityIndicator, Alert,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import AsyncStorage from '@react-native-async-storage/async-storage';

//  Remplace par l'IP de ton PC (même IP que dans App.js)
import CONFIG from './config';
const API_URL = CONFIG.API_URL;

// ─────────────────────────────────────────────
// COMPOSANT PRINCIPAL
// ─────────────────────────────────────────────
export default function DashboardParent({ navigation, route }) {

  // Données reçues depuis l'écran de connexion via navigation.navigate()
  const { user, token } = route.params || {};

  // État local
  const [enfants, setEnfants]         = useState([]);   // liste des enfants du parent
  const [enfantActif, setEnfantActif] = useState(0);    // index de l'enfant sélectionné
  const [loading, setLoading]         = useState(true); // true pendant le chargement API
  const [erreur, setErreur]           = useState('');   // message d'erreur si API échoue

  // Au chargement du composant → récupérer les enfants depuis Laravel
  useEffect(() => {
    chargerEnfants();
  }, []);

  // ─── APPEL API — Récupérer les enfants du parent ───
  const chargerEnfants = async () => {
    try {
      setLoading(true);
      setErreur('');

      // Récupérer le token depuis AsyncStorage si non passé en params
      const tokenLocal = token || await AsyncStorage.getItem('token');
      const userLocal  = user  || JSON.parse(await AsyncStorage.getItem('user'));

      if (!tokenLocal || !userLocal) {
        // Pas de token → renvoyer vers la connexion
        navigation.replace('Connexion');
        return;
      }

      // Appel API → GET /api/enfants
      // Le token est envoyé dans le header Authorization (standard Sanctum)
      const reponse = await fetch(`${API_URL}/enfants`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${tokenLocal}`,
          'Accept': 'application/json',
          'Content-Type': 'application/json',
        },
      });

      const data = await reponse.json();

      if (data.success) {
        setEnfants(data.enfants); // Met à jour la liste des enfants
      } else {
        setErreur('Impossible de charger les données.');
      }

    } catch (err) {
      console.error('Erreur API enfants:', err);
      setErreur('Erreur de connexion au serveur.');
    } finally {
      setLoading(false); // Dans tous les cas, arrêter le spinner
    }
  };

  // ─── DÉCONNEXION ───
  const seDeconnecter = async () => {
    // Demander confirmation avant de déconnecter
    Alert.alert(
      'Déconnexion',
      'Voulez-vous vraiment vous déconnecter ?',
      [
        { text: 'Annuler', style: 'cancel' },
        {
          text: 'Déconnecter',
          style: 'destructive',
          onPress: async () => {
            try {
              // Appel API pour invalider le token côté Laravel
              const tokenLocal = token || await AsyncStorage.getItem('token');
              await fetch(`${API_URL}/logout`, {
                method: 'POST',
                headers: {
                  'Authorization': `Bearer ${tokenLocal}`,
                  'Accept': 'application/json',
                },
              });
            } catch (e) {
              // Même si l'API échoue, on déconnecte localement
              console.log('Erreur logout API:', e);
            }

            // Supprimer la session locale
            await AsyncStorage.removeItem('token');
            await AsyncStorage.removeItem('role');
            await AsyncStorage.removeItem('user');

            // Retourner à l'écran de connexion
            navigation.replace('Connexion');
          },
        },
      ]
    );
  };

  // Couleur selon le statut du vaccin
  const couleurStatut = (statut) => {
    if (statut === 'fait') return '#16a34a';      // Vert
    if (statut === 'retard') return '#dc2626';    // Rouge
    return '#d97706';                              // Orange = à venir
  };

  // Emoji selon le statut
  const emojiStatut = (statut) => {
    if (statut === 'fait') return '✅';
    if (statut === 'retard') return '❌';
    return '🕐';
  };

  // ─── AFFICHAGE PENDANT LE CHARGEMENT ───
  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.centreEcran}>
          <ActivityIndicator size="large" color="#1a6b3c" />
          <Text style={styles.chargementTexte}>Chargement des données...</Text>
        </View>
      </SafeAreaView>
    );
  }

  // ─── AFFICHAGE EN CAS D'ERREUR ───
  if (erreur) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.centreEcran}>
          <Text style={styles.erreurTexte}>⚠️ {erreur}</Text>
          {/* Bouton pour réessayer */}
          <TouchableOpacity style={styles.boutonReessayer} onPress={chargerEnfants}>
            <Text style={styles.boutonReessayerTexte}>Réessayer</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  // ─── AFFICHAGE SI AUCUN ENFANT ───
  if (enfants.length === 0) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.centreEcran}>
          <Text style={{ fontSize: 48 }}>👶</Text>
          <Text style={styles.erreurTexte}>Aucun enfant enregistré.</Text>
          <Text style={{ color: '#6b7280', textAlign: 'center', marginTop: 8 }}>
            Contactez votre centre de santé pour enregistrer votre enfant.
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  // Raccourci vers l'enfant sélectionné
  const enfant = enfants[enfantActif];

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style="light" />

      {/* EN-TÊTE VERT */}
      <View style={styles.header}>
        <View style={styles.headerTop}>

          {/* Salutation avec le nom du parent */}
          <View>
            <Text style={styles.bonjour}>Bonjour 👋</Text>
            <Text style={styles.nomParent}>
              {user?.prenom || user?.nom || 'Parent'}
            </Text>
          </View>

          {/* Boutons en haut à droite */}
          <View style={styles.headerActions}>
            {/* Bouton notification */}
            <TouchableOpacity style={styles.notifBtn}>
              <Text style={styles.notifEmoji}>🔔</Text>
              {/* Badge rouge indiquant 1 notif non lue */}
              <View style={styles.badge}>
                <Text style={styles.badgeTexte}>1</Text>
              </View>
            </TouchableOpacity>

            {/* Bouton déconnexion */}
            <TouchableOpacity style={styles.deconnexionBtn} onPress={seDeconnecter}>
              <Text style={styles.deconnexionTexte}>⏻</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* SÉLECTEUR D'ENFANT */}
        {/* ScrollView horizontal pour swiper entre les enfants */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.enfantsScroll}>
          {enfants.map((e, index) => (
            // Pour chaque enfant, on affiche un onglet
            // key={} est obligatoire dans les listes React — identifiant unique
            <TouchableOpacity
              key={e.id}
              style={[styles.enfantTab, enfantActif === index && styles.enfantTabActif]}
              onPress={() => setEnfantActif(index)} // Change l'enfant affiché
            >
              <Text style={styles.enfantAvatar}>
                {e.sexe === 'F' ? '👧' : '👦'}
              </Text>
              <Text style={[styles.enfantNom, enfantActif === index && styles.enfantNomActif]}>
                {e.prenom}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {/* CONTENU SCROLLABLE */}
      <ScrollView style={styles.contenu} showsVerticalScrollIndicator={false}>

        {/* CARTE ENFANT + PROGRESSION */}
        <View style={styles.carteEnfant}>
          <View style={styles.carteEnfantTop}>
            <Text style={styles.carteAvatar}>
              {enfant.sexe === 'F' ? '👧' : '👦'}
            </Text>
            <View style={styles.carteInfos}>
              <Text style={styles.carteNom}>{enfant.prenom} {enfant.nom}</Text>
              <Text style={styles.carteAge}>
                Né(e) le {enfant.date_naissance}
              </Text>
              {/* Code unique de l'enfant */}
              <Text style={styles.carteCode}>#{enfant.code_unique}</Text>
            </View>
            {/* Pourcentage affiché en haut à droite */}
            <Text style={styles.cartePourcentage}>
              {enfant.progression || 0}%
            </Text>
          </View>

          {/* Barre de progression vaccinale */}
          <Text style={styles.progressLabel}>Progression vaccinale</Text>
          {/* Conteneur de la barre grise */}
          <View style={styles.progressBarre}>
            {/* Barre verte qui s'étire selon le pourcentage */}
            {/* width: `${enfant.progression}%` = largeur dynamique en % */}
            <View style={[styles.progressRempli, { width: `${enfant.progression || 0}%` }]} />
          </View>
        </View>

        {/* ALERTE PROCHAIN VACCIN */}
        {enfant.prochainVaccin && (
          <View style={styles.alerteVaccin}>
            <Text style={styles.alerteEmoji}>⚠️</Text>
            <View style={styles.alerteTextes}>
              <Text style={styles.alerteTitre}>Prochain vaccin</Text>
              <Text style={styles.alerteNom}>{enfant.prochainVaccin.nom}</Text>
              <Text style={styles.alerteDetails}>
                📅 {enfant.prochainVaccin.date} — 📍 {enfant.prochainVaccin.centre}
              </Text>
            </View>
          </View>
        )}

        {/* BOUTONS RAPIDES */}
        <Text style={styles.sectionTitre}>Actions rapides</Text>
        <View style={styles.boutonsRapides}>

          {/* Bouton Carnet vaccinal */}
          <TouchableOpacity
            style={styles.boutonRapide}
            onPress={() => navigation.navigate('CarnetVaccinal', { enfant })}
          >
            <Text style={styles.boutonRapideEmoji}>📋</Text>
            <Text style={styles.boutonRapideTexte}>Carnet vaccinal</Text>
          </TouchableOpacity>

          {/* Bouton Centre proche */}
          <TouchableOpacity
            style={styles.boutonRapide}
            onPress={() => navigation.navigate('CentreProche')}
          >
            <Text style={styles.boutonRapideEmoji}>🏥</Text>
            <Text style={styles.boutonRapideTexte}>Centre proche</Text>
          </TouchableOpacity>

          {/* Bouton Contacter agent */}
          <TouchableOpacity
            style={styles.boutonRapide}
            onPress={() => navigation.navigate('Contact')}
          >
            <Text style={styles.boutonRapideEmoji}>💬</Text>
            <Text style={styles.boutonRapideTexte}>Contacter agent</Text>
          </TouchableOpacity>

        </View>

        {/* LISTE DES VACCINS */}
        <Text style={styles.sectionTitre}>Carnet vaccinal — {enfant.prenom}</Text>

        {/* FlatList = liste optimisée pour les grandes listes (comme v-for en Vue) */}
        {/* data = tableau à afficher */}
        {/* renderItem = fonction qui retourne le rendu de chaque élément */}
        {/* keyExtractor = identifiant unique pour chaque ligne */}
        <FlatList
          data={enfant.vaccins || []}
          keyExtractor={(item) => item.id.toString()}
          scrollEnabled={false} // Désactive le scroll interne (le ScrollView parent gère)
          ListEmptyComponent={
            <Text style={{ color: '#6b7280', textAlign: 'center', padding: 20 }}>
              Aucun vaccin enregistré pour cet enfant.
            </Text>
          }
          renderItem={({ item }) => (
            <View style={styles.vaccin}>
              <Text style={styles.vaccinEmoji}>{emojiStatut(item.statut)}</Text>
              <View style={styles.vaccinInfos}>
                <Text style={styles.vaccinNom}>{item.nom}</Text>
                <Text style={styles.vaccinDate}>{item.date}</Text>
              </View>
              {/* Badge coloré selon le statut */}
              <View style={[styles.vaccinBadge, { backgroundColor: couleurStatut(item.statut) + '20' }]}>
                <Text style={[styles.vaccinStatut, { color: couleurStatut(item.statut) }]}>
                  {item.statut === 'fait' ? 'Fait' : item.statut === 'retard' ? 'Retard' : 'À venir'}
                </Text>
              </View>
            </View>
          )}
        />

        {/* Espace en bas pour la barre de navigation */}
        <View style={{ height: 80 }} />
      </ScrollView>

      {/* BARRE DE NAVIGATION BAS */}
      {/* Position absolute = flotte au-dessus du contenu */}
      <View style={styles.navBar}>
        <TouchableOpacity style={styles.navItem}>
          <Text style={styles.navEmoji}>🏠</Text>
          <Text style={[styles.navTexte, styles.navActif]}>Accueil</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.navItem} onPress={() => navigation.navigate('CentreProche')}>
          <Text style={styles.navEmoji}>🏥</Text>
          <Text style={styles.navTexte}>Centres</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.navItem} onPress={() => navigation.navigate('Contact')}>
          <Text style={styles.navEmoji}>💬</Text>
          <Text style={styles.navTexte}>Contact</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.navItem} onPress={seDeconnecter}>
          <Text style={styles.navEmoji}>⏻</Text>
          <Text style={styles.navTexte}>Déconnexion</Text>
        </TouchableOpacity>
      </View>

    </SafeAreaView>
  );
}

// ─────────────────────────────────────────────
// STYLES
// ─────────────────────────────────────────────
const styles = StyleSheet.create({

  container: { flex: 1, backgroundColor: '#f3f4f6' },

  // Centrage pour les écrans de chargement/erreur
  centreEcran: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 24 },
  chargementTexte: { marginTop: 12, color: '#6b7280', fontSize: 14 },
  erreurTexte: { fontSize: 16, color: '#dc2626', textAlign: 'center', marginBottom: 16 },
  boutonReessayer: { backgroundColor: '#1a6b3c', borderRadius: 12, paddingHorizontal: 24, paddingVertical: 12 },
  boutonReessayerTexte: { color: 'white', fontWeight: 'bold' },

  // En-tête vert
  header: {
    backgroundColor: '#1a6b3c',
    paddingTop: 20,
    paddingHorizontal: 20,
    paddingBottom: 16,
  },

  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between', // Espace entre les deux éléments
    alignItems: 'center',
    marginBottom: 16,
  },

  bonjour: { color: 'rgba(255,255,255,0.8)', fontSize: 14 },
  nomParent: { color: 'white', fontSize: 20, fontWeight: 'bold' },

  // Conteneur des boutons en haut à droite
  headerActions: { flexDirection: 'row', alignItems: 'center', gap: 12 },

  notifBtn: { position: 'relative' }, // Position relative pour placer le badge dessus
  notifEmoji: { fontSize: 24 },

  // Badge rouge sur la cloche
  badge: {
    position: 'absolute', // Se place par rapport au parent relatif
    top: -4,
    right: -4,
    backgroundColor: '#ef4444',
    borderRadius: 10,
    width: 18,
    height: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  badgeTexte: { color: 'white', fontSize: 10, fontWeight: 'bold' },

  // Bouton déconnexion
  deconnexionBtn: {
    backgroundColor: 'rgba(255,255,255,0.2)',
    borderRadius: 20,
    padding: 8,
  },
  deconnexionTexte: { fontSize: 18 },

  // Scroll horizontal des onglets enfants
  enfantsScroll: { marginTop: 8 },

  enfantTab: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.2)',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 8,
    marginRight: 10,
  },

  enfantTabActif: { backgroundColor: 'white' },

  enfantAvatar: { fontSize: 18, marginRight: 6 },

  enfantNom: { color: 'rgba(255,255,255,0.8)', fontWeight: '600' },
  enfantNomActif: { color: '#1a6b3c' },

  // Zone de contenu principale
  contenu: { flex: 1, paddingHorizontal: 16, paddingTop: 16 },

  // Carte enfant
  carteEnfant: {
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    elevation: 2,
  },

  carteEnfantTop: { flexDirection: 'row', alignItems: 'center', marginBottom: 12 },
  carteAvatar: { fontSize: 40, marginRight: 12 },
  carteInfos: { flex: 1 },
  carteNom: { fontSize: 18, fontWeight: 'bold', color: '#1a3c2e' },
  carteAge: { color: '#6b7280', fontSize: 14 },
  carteCode: { color: '#1a6b3c', fontSize: 12, fontWeight: '600', marginTop: 2 },
  cartePourcentage: { fontSize: 24, fontWeight: 'bold', color: '#1a6b3c' },

  progressLabel: { fontSize: 13, color: '#6b7280', marginBottom: 8 },

  // Barre de progression
  progressBarre: {
    height: 10,
    backgroundColor: '#e5e7eb',
    borderRadius: 5,
    overflow: 'hidden', // Cache ce qui dépasse le borderRadius
  },
  progressRempli: {
    height: '100%',
    backgroundColor: '#1a6b3c',
    borderRadius: 5,
  },

  // Alerte vaccin (fond orange clair)
  alerteVaccin: {
    backgroundColor: '#fffbeb',
    borderWidth: 1,
    borderColor: '#fcd34d',
    borderRadius: 16,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  alerteEmoji: { fontSize: 24, marginRight: 12 },
  alerteTextes: { flex: 1 },
  alerteTitre: { fontSize: 12, color: '#92400e', fontWeight: '600', marginBottom: 2 },
  alerteNom: { fontSize: 16, fontWeight: 'bold', color: '#78350f', marginBottom: 4 },
  alerteDetails: { fontSize: 13, color: '#92400e' },

  sectionTitre: { fontSize: 16, fontWeight: 'bold', color: '#1a3c2e', marginBottom: 12 },

  // Boutons rapides en rangée
  boutonsRapides: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 20,
  },

  boutonRapide: {
    flex: 1,
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 16,
    alignItems: 'center',
    marginHorizontal: 4,
    elevation: 2,
  },
  boutonRapideEmoji: { fontSize: 28, marginBottom: 6 },
  boutonRapideTexte: { fontSize: 11, color: '#374151', textAlign: 'center', fontWeight: '500' },

  // Ligne vaccin
  vaccin: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 14,
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
    elevation: 1,
  },
  vaccinEmoji: { fontSize: 20, marginRight: 12 },
  vaccinInfos: { flex: 1 },
  vaccinNom: { fontSize: 15, fontWeight: '600', color: '#1a3c2e' },
  vaccinDate: { fontSize: 13, color: '#6b7280' },
  vaccinBadge: { borderRadius: 8, paddingHorizontal: 10, paddingVertical: 4 },
  vaccinStatut: { fontSize: 12, fontWeight: '600' },

  // Barre de navigation en bas
  navBar: {
    position: 'absolute', // Flotte en bas de l'écran
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'white',
    flexDirection: 'row',
    paddingVertical: 10,
    paddingBottom: 20,
    borderTopWidth: 1,
    borderTopColor: '#e5e7eb',
    elevation: 10,
  },
  navItem: { flex: 1, alignItems: 'center' },
  navEmoji: { fontSize: 22 },
  navTexte: { fontSize: 11, color: '#9ca3af', marginTop: 2 },
  navActif: { color: '#1a6b3c', fontWeight: 'bold' },
});