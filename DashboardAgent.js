// DashboardAgent.js — Écran principal de l'agent de santé
// Ce que voit un agent après connexion
// MODIFIÉ : données réelles via API Laravel + AsyncStorage + déconnexion

import React, { useState, useEffect } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet,
  SafeAreaView, ScrollView, FlatList, TextInput,
  ActivityIndicator, Alert,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import AsyncStorage from '@react-native-async-storage/async-storage';

// ⚠️ Remplace par l'IP de ton PC (même IP que dans App.js)
import CONFIG from './config';
const API_URL = CONFIG.API_URL;

// ─────────────────────────────────────────────
// COMPOSANT PRINCIPAL
// ─────────────────────────────────────────────
export default function DashboardAgent({ navigation, route }) {

  // Données reçues depuis l'écran de connexion
  const { user, token } = route.params || {};

  // États locaux
  const [stats, setStats]             = useState(null);   // statistiques du centre
  const [enfants, setEnfants]         = useState([]);     // liste des enfants suivis
  const [recherche, setRecherche]     = useState('');     // texte de la barre de recherche
  const [loading, setLoading]         = useState(true);   // spinner de chargement
  const [erreur, setErreur]           = useState('');     // message d'erreur

  // Au chargement du composant → récupérer les données depuis Laravel
  useEffect(() => {
    chargerDonnees();
  }, []);

  // ─── APPEL API — Récupérer les données du tableau de bord agent ───
  const chargerDonnees = async () => {
    try {
      setLoading(true);
      setErreur('');

      // Récupérer le token depuis AsyncStorage si non passé en params
      const tokenLocal = token || await AsyncStorage.getItem('token');

      if (!tokenLocal) {
        navigation.replace('Connexion');
        return;
      }

      // Appel API → GET /api/agent/dashboard
      // Le token est envoyé dans le header Authorization (standard Sanctum)
      const reponse = await fetch(`${API_URL}/agent/dashboard`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${tokenLocal}`,
          'Accept': 'application/json',
          'Content-Type': 'application/json',
        },
      });

      const data = await reponse.json();

      if (data.success) {
        setStats(data.stats);     // Statistiques du centre
        setEnfants(data.enfants); // Liste des enfants
      } else {
        setErreur('Impossible de charger les données.');
      }

    } catch (err) {
      console.error('Erreur API agent:', err);
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

  // Filtre les enfants selon le texte tapé
  // .filter() parcourt le tableau et garde les éléments qui correspondent
  // .toLowerCase() pour ignorer les majuscules
  const enfantsFiltres = enfants.filter(e =>
    e.prenom.toLowerCase().includes(recherche.toLowerCase()) ||
    e.nom.toLowerCase().includes(recherche.toLowerCase())
  );

  // Couleur du badge selon le statut
  const couleurStatut = (statut) => {
    return statut === 'à_jour' ? '#16a34a' : '#dc2626';
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
          <TouchableOpacity style={styles.boutonReessayer} onPress={chargerDonnees}>
            <Text style={styles.boutonReessayerTexte}>Réessayer</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style="light" />

      {/* EN-TÊTE VERT */}
      <View style={styles.header}>
        <View style={styles.headerTop}>
          <View>
            <Text style={styles.bonjour}>Tableau de bord agent</Text>
            {/* Nom de l'agent récupéré depuis les params de navigation */}
            <Text style={styles.nomAgent}>{user?.prenom} {user?.nom}</Text>
            <Text style={styles.centre}>📍 {user?.centre || 'Centre non défini'}</Text>
          </View>

          {/* Boutons en haut à droite */}
          <View style={styles.headerActions}>
            {/* Avatar de l'agent */}
            <View style={styles.avatarAgent}>
              <Text style={styles.avatarTexte}>🏥</Text>
            </View>
            {/* Bouton déconnexion */}
            <TouchableOpacity style={styles.deconnexionBtn} onPress={seDeconnecter}>
              <Text style={styles.deconnexionTexte}>⏻</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>

      <ScrollView style={styles.contenu} showsVerticalScrollIndicator={false}>

        {/* STATISTIQUES EN GRILLE 2x2 */}
        <Text style={styles.sectionTitre}>Statistiques du jour</Text>
        <View style={styles.statsGrille}>

          {/* Stat 1 — Total enfants */}
          <View style={[styles.statCarte, { borderLeftColor: '#1a6b3c' }]}>
            <Text style={styles.statNombre}>{stats?.totalEnfants || 0}</Text>
            <Text style={styles.statLabel}>Enfants enregistrés</Text>
            <Text style={styles.statEmoji}>👶</Text>
          </View>

          {/* Stat 2 — Vaccinés aujourd'hui */}
          <View style={[styles.statCarte, { borderLeftColor: '#2563eb' }]}>
            <Text style={[styles.statNombre, { color: '#2563eb' }]}>
              {stats?.vaccinesAujourdhui || 0}
            </Text>
            <Text style={styles.statLabel}>Vaccinés aujourd'hui</Text>
            <Text style={styles.statEmoji}>💉</Text>
          </View>

          {/* Stat 3 — En retard (rouge) */}
          <View style={[styles.statCarte, { borderLeftColor: '#dc2626' }]}>
            <Text style={[styles.statNombre, { color: '#dc2626' }]}>
              {stats?.retards || 0}
            </Text>
            <Text style={styles.statLabel}>En retard</Text>
            <Text style={styles.statEmoji}>⚠️</Text>
          </View>

          {/* Stat 4 — À venir (orange) */}
          <View style={[styles.statCarte, { borderLeftColor: '#d97706' }]}>
            <Text style={[styles.statNombre, { color: '#d97706' }]}>
              {stats?.aVenir || 0}
            </Text>
            <Text style={styles.statLabel}>À venir ce mois</Text>
            <Text style={styles.statEmoji}>📅</Text>
          </View>

        </View>

        {/* ACTIONS RAPIDES */}
        <Text style={styles.sectionTitre}>Actions rapides</Text>
        <View style={styles.actionsRapides}>

          <TouchableOpacity
            style={[styles.actionBtn, { backgroundColor: '#1a6b3c' }]}
            onPress={() => navigation.navigate('EnregistrerEnfant', { token })}
          >
            <Text style={styles.actionEmoji}>➕</Text>
            <Text style={styles.actionTexte}>Enregistrer un enfant</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.actionBtn, { backgroundColor: '#2563eb' }]}
            onPress={() => navigation.navigate('MarquerVaccin', { token })}
          >
            <Text style={styles.actionEmoji}>💉</Text>
            <Text style={styles.actionTexte}>Marquer un vaccin</Text>
          </TouchableOpacity>

        </View>

        {/* BARRE DE RECHERCHE */}
        <Text style={styles.sectionTitre}>Enfants suivis</Text>
        <View style={styles.rechercheContainer}>
          <Text style={styles.rechercheIcone}>🔍</Text>
          <TextInput
            style={styles.rechercheInput}
            placeholder="Rechercher un enfant..."
            placeholderTextColor="#9ca3af"
            value={recherche}
            onChangeText={setRecherche} // Met à jour au fur et à mesure de la frappe
          />
        </View>

        {/* LISTE DES ENFANTS */}
        {/* enfantsFiltres = tableau filtré selon la recherche */}
        <FlatList
          data={enfantsFiltres}
          keyExtractor={(item) => item.id.toString()}
          scrollEnabled={false}
          renderItem={({ item }) => (
            <TouchableOpacity
              style={styles.enfantLigne}
              // navigation.navigate avec params = passer des données à l'écran suivant
              onPress={() => navigation.navigate('FicheEnfant', { enfant: item, token })}
            >
              <Text style={styles.enfantAvatar}>
                {item.sexe === 'F' ? '👧' : '👦'}
              </Text>
              <View style={styles.enfantInfos}>
                <Text style={styles.enfantNom}>{item.prenom} {item.nom}</Text>
                <Text style={styles.enfantAge}>{item.age}</Text>
                <Text style={styles.enfantProchain}>{item.prochainVaccin}</Text>
              </View>
              {/* Badge statut coloré */}
              <View style={[styles.statutBadge, { backgroundColor: couleurStatut(item.statut) + '20' }]}>
                <Text style={[styles.statutTexte, { color: couleurStatut(item.statut) }]}>
                  {item.statut === 'à_jour' ? '✓ À jour' : '⚠ Retard'}
                </Text>
              </View>
            </TouchableOpacity>
          )}
          // Affiché quand la liste est vide (aucun résultat de recherche)
          ListEmptyComponent={
            <View style={styles.vide}>
              <Text style={styles.videTexte}>Aucun enfant trouvé</Text>
            </View>
          }
        />

        <View style={{ height: 80 }} />
      </ScrollView>

      {/* BARRE DE NAVIGATION BAS */}
      <View style={styles.navBar}>
        <TouchableOpacity style={styles.navItem}>
          <Text style={styles.navEmoji}>🏠</Text>
          <Text style={[styles.navTexte, styles.navActif]}>Accueil</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.navItem}>
          <Text style={styles.navEmoji}>👶</Text>
          <Text style={styles.navTexte}>Enfants</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.navItem}>
          <Text style={styles.navEmoji}>📊</Text>
          <Text style={styles.navTexte}>Rapports</Text>
        </TouchableOpacity>
        {/* Bouton déconnexion dans la nav bar */}
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

  header: {
    backgroundColor: '#1a6b3c',
    paddingTop: 20,
    paddingHorizontal: 20,
    paddingBottom: 24,
  },

  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },

  bonjour: { color: 'rgba(255,255,255,0.75)', fontSize: 13 },
  nomAgent: { color: 'white', fontSize: 20, fontWeight: 'bold', marginVertical: 2 },
  centre: { color: 'rgba(255,255,255,0.85)', fontSize: 13 },

  // Conteneur des boutons en haut à droite
  headerActions: { flexDirection: 'row', alignItems: 'center', gap: 10 },

  avatarAgent: {
    width: 50, height: 50, borderRadius: 25,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center', justifyContent: 'center',
  },
  avatarTexte: { fontSize: 26 },

  // Bouton déconnexion
  deconnexionBtn: {
    backgroundColor: 'rgba(255,255,255,0.2)',
    borderRadius: 20,
    padding: 8,
  },
  deconnexionTexte: { fontSize: 18 },

  contenu: { flex: 1, paddingHorizontal: 16, paddingTop: 16 },

  sectionTitre: {
    fontSize: 16, fontWeight: 'bold',
    color: '#1a3c2e', marginBottom: 12,
  },

  // Grille 2 colonnes pour les stats
  statsGrille: {
    flexDirection: 'row',
    flexWrap: 'wrap',    // Passe à la ligne quand plus de place
    justifyContent: 'space-between',
    marginBottom: 20,
  },

  statCarte: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 14,
    width: '48%',        // Environ la moitié = 2 colonnes
    marginBottom: 10,
    borderLeftWidth: 4,  // Barre colorée à gauche
    elevation: 2,
  },

  statNombre: { fontSize: 28, fontWeight: 'bold', color: '#1a6b3c' },
  statLabel: { fontSize: 12, color: '#6b7280', marginTop: 2 },
  statEmoji: { fontSize: 20, position: 'absolute', top: 14, right: 14 },

  // Boutons d'action côte à côte
  actionsRapides: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 20,
  },

  actionBtn: {
    flex: 1,
    borderRadius: 12,
    padding: 14,
    alignItems: 'center',
    marginHorizontal: 4,
    elevation: 2,
  },
  actionEmoji: { fontSize: 24, marginBottom: 6 },
  actionTexte: { color: 'white', fontSize: 12, fontWeight: '600', textAlign: 'center' },

  // Barre de recherche
  rechercheContainer: {
    flexDirection: 'row',
    backgroundColor: 'white',
    borderRadius: 12,
    paddingHorizontal: 14,
    alignItems: 'center',
    marginBottom: 12,
    elevation: 1,
  },
  rechercheIcone: { fontSize: 18, marginRight: 8 },
  rechercheInput: { flex: 1, paddingVertical: 12, fontSize: 15, color: '#1f2937' },

  // Ligne enfant dans la liste
  enfantLigne: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 14,
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
    elevation: 1,
  },
  enfantAvatar: { fontSize: 32, marginRight: 12 },
  enfantInfos: { flex: 1 },
  enfantNom: { fontSize: 15, fontWeight: '600', color: '#1a3c2e' },
  enfantAge: { fontSize: 12, color: '#9ca3af' },
  enfantProchain: { fontSize: 12, color: '#6b7280', marginTop: 2 },

  statutBadge: { borderRadius: 8, paddingHorizontal: 10, paddingVertical: 4 },
  statutTexte: { fontSize: 12, fontWeight: '600' },

  vide: { alignItems: 'center', padding: 30 },
  videTexte: { color: '#9ca3af', fontSize: 15 },

  navBar: {
    position: 'absolute',
    bottom: 0, left: 0, right: 0,
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