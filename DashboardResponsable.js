// DashboardResponsable.js — Écran principal du Responsable PEV
// Chef du centre : supervise agents, valide comptes, coordonne séances
// MODIFIÉ : données réelles via API Laravel + AsyncStorage + déconnexion

import React, { useState, useEffect } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet,
  SafeAreaView, ScrollView, ActivityIndicator, Alert,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import AsyncStorage from '@react-native-async-storage/async-storage';

//  Remplace par l'IP de ton PC (même IP que dans App.js)
import CONFIG from './config';
const API_URL = CONFIG.API_URL;

// ─────────────────────────────────────────────
// COMPOSANT PRINCIPAL
// ─────────────────────────────────────────────
export default function DashboardResponsable({ navigation, route }) {

  // Données reçues depuis l'écran de connexion
  const { user, token } = route.params || {};

  // États locaux
  const [stats, setStats]                   = useState(null);  // statistiques globales
  const [agents, setAgents]                 = useState([]);    // liste des agents
  const [comptesEnAttente, setComptesEnAttente] = useState([]); // comptes à valider
  const [seances, setSeances]               = useState([]);    // séances planifiées
  const [onglet, setOnglet]                 = useState('apercu'); // onglet actif
  const [loading, setLoading]               = useState(true);  // spinner
  const [erreur, setErreur]                 = useState('');    // message d'erreur

  // Au chargement du composant → récupérer les données depuis Laravel
  useEffect(() => {
    chargerDonnees();
  }, []);

  // ─── APPEL API — Récupérer les données du tableau de bord responsable ───
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

      // Appel API → GET /api/responsable/dashboard
      // Le token est envoyé dans le header Authorization (standard Sanctum)
      const reponse = await fetch(`${API_URL}/responsable/dashboard`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${tokenLocal}`,
          'Accept': 'application/json',
          'Content-Type': 'application/json',
        },
      });

      const data = await reponse.json();

      if (data.success) {
        setStats(data.stats);                         // Statistiques globales
        setAgents(data.agents);                       // Liste des agents
        setComptesEnAttente(data.comptesEnAttente);   // Comptes à valider
        setSeances(data.seances);                     // Séances planifiées
      } else {
        setErreur('Impossible de charger les données.');
      }

    } catch (err) {
      console.error('Erreur API responsable:', err);
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

  // ─── VALIDER OU REFUSER UN COMPTE AGENT ───
  const gererCompte = async (agent, action) => {
    // action = 'valider' ou 'refuser'
    Alert.alert(
      action === 'valider' ? 'Valider le compte' : 'Refuser le compte',
      `Êtes-vous sûr de vouloir ${action} le compte de ${agent.nom} ?`,
      [
        { text: 'Annuler', style: 'cancel' },
        {
          text: action === 'valider' ? 'Valider' : 'Refuser',
          style: action === 'valider' ? 'default' : 'destructive',
          onPress: async () => {
            try {
              const tokenLocal = token || await AsyncStorage.getItem('token');

              // Appel API → POST /api/responsable/valider-compte
              const reponse = await fetch(`${API_URL}/responsable/valider-compte`, {
                method: 'POST',
                headers: {
                  'Authorization': `Bearer ${tokenLocal}`,
                  'Accept': 'application/json',
                  'Content-Type': 'application/json',
                },
                body: JSON.stringify({ agentId: agent.id, action }),
              });

              const data = await reponse.json();

              if (data.success) {
                // Retirer le compte de la liste d'attente
                setComptesEnAttente(prev => prev.filter(c => c.id !== agent.id));
                Alert.alert('Succès', data.message);
              } else {
                Alert.alert('Erreur', data.message);
              }
            } catch (e) {
              Alert.alert('Erreur', 'Impossible de traiter la demande.');
            }
          },
        },
      ]
    );
  };

  // ─── AFFICHAGE PENDANT LE CHARGEMENT ───
  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.centreEcran}>
          <ActivityIndicator size="large" color="#1a3c2e" />
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

      {/* EN-TÊTE VERT FONCÉ */}
      <View style={styles.header}>
        <View style={styles.headerTop}>
          <View>
            <Text style={styles.role}>Responsable PEV</Text>
            {/* Nom du responsable récupéré depuis les params */}
            <Text style={styles.nomResponsable}>{user?.prenom} {user?.nom}</Text>
            <Text style={styles.centre}>📍 {user?.centre || 'Centre non défini'}</Text>
          </View>

          {/* Boutons en haut à droite */}
          <View style={styles.headerActions}>
            <View style={styles.avatarContainer}>
              <Text style={styles.avatarEmoji}>👨‍💼</Text>
            </View>
            {/* Bouton déconnexion */}
            <TouchableOpacity style={styles.deconnexionBtn} onPress={seDeconnecter}>
              <Text style={styles.deconnexionTexte}>⏻</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* ONGLETS DE NAVIGATION */}
        {/* 3 onglets pour switcher entre les sections sans changer d'écran */}
        <View style={styles.onglets}>
          {[
            { id: 'apercu', label: '📊 Aperçu' },
            { id: 'agents', label: '👥 Agents' },
            { id: 'seances', label: '📅 RDV' },
          ].map((o) => (
            <TouchableOpacity
              key={o.id}
              style={[styles.onglet, onglet === o.id && styles.ongletActif]}
              onPress={() => setOnglet(o.id)}
            >
              <Text style={[styles.ongletTexte, onglet === o.id && styles.ongletTexteActif]}>
                {o.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      <ScrollView style={styles.contenu} showsVerticalScrollIndicator={false}>

        {/*
            ONGLET 1 — APERÇU GÉNÉRAL
            Affiché seulement si onglet === 'apercu'
        */}
        {onglet === 'apercu' && (
          <View>

            {/* Grille de statistiques */}
            <Text style={styles.sectionTitre}>Vue d'ensemble du centre</Text>
            <View style={styles.statsGrille}>

              <View style={[styles.statCarte, { borderLeftColor: '#1a6b3c' }]}>
                <Text style={styles.statNombre}>{stats?.enfantsSuivis || 0}</Text>
                <Text style={styles.statLabel}>Enfants suivis</Text>
                <Text style={styles.statEmoji}>👶</Text>
              </View>

              <View style={[styles.statCarte, { borderLeftColor: '#2563eb' }]}>
                <Text style={[styles.statNombre, { color: '#2563eb' }]}>
                  {stats?.tauxCouverture || 0}%
                </Text>
                <Text style={styles.statLabel}>Taux de couverture</Text>
                <Text style={styles.statEmoji}>📈</Text>
              </View>

              <View style={[styles.statCarte, { borderLeftColor: '#7c3aed' }]}>
                <Text style={[styles.statNombre, { color: '#7c3aed' }]}>
                  {stats?.totalAgents || 0}
                </Text>
                <Text style={styles.statLabel}>Agents au total</Text>
                <Text style={styles.statEmoji}>👥</Text>
              </View>

              <View style={[styles.statCarte, { borderLeftColor: '#d97706' }]}>
                <Text style={[styles.statNombre, { color: '#d97706' }]}>
                  {stats?.seancesCeMois || 0}
                </Text>
                <Text style={styles.statLabel}>RDV de ce mois</Text>
                <Text style={styles.statEmoji}>💉</Text>
              </View>

            </View>

            {/* Alerte comptes en attente — affiché seulement s'il y en a */}
            {comptesEnAttente.length > 0 && (
              <TouchableOpacity
                style={styles.alerteComptes}
                onPress={() => setOnglet('agents')} // Bascule vers l'onglet Agents
              >
                <Text style={styles.alerteEmoji}>🔔</Text>
                <View style={styles.alerteTextes}>
                  <Text style={styles.alerteTitre}>Comptes en attente</Text>
                  <Text style={styles.alerteDescription}>
                    {comptesEnAttente.length} agent(s) attendent votre validation
                  </Text>
                </View>
                {/* Flèche vers la droite */}
                <Text style={styles.alerteFleche}>›</Text>
              </TouchableOpacity>
            )}

            {/* Actions rapides */}
            <Text style={styles.sectionTitre}>Actions rapides</Text>
            <View style={styles.actionsGrille}>

              <TouchableOpacity
                style={[styles.actionCarte, { backgroundColor: '#1a6b3c' }]}
                onPress={() => navigation.navigate('NouvelleSeance', { token })}
              >
                <Text style={styles.actionEmoji}>📅</Text>
                <Text style={styles.actionTexte}>Planifier un RDV</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.actionCarte, { backgroundColor: '#2563eb' }]}
                onPress={() => navigation.navigate('Rapport', { token })}
              >
                <Text style={styles.actionEmoji}>📊</Text>
                <Text style={styles.actionTexte}>Générer un rapport</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.actionCarte, { backgroundColor: '#7c3aed' }]}
                onPress={() => setOnglet('agents')}
              >
                <Text style={styles.actionEmoji}>👥</Text>
                <Text style={styles.actionTexte}>Gérer les agents</Text>
              </TouchableOpacity>

            </View>
          </View>
        )}

        {/*
            ONGLET 2 — GESTION DES AGENTS
        */}
        {onglet === 'agents' && (
          <View>

            {/* Comptes en attente de validation */}
            {comptesEnAttente.length > 0 && (
              <View>
                <Text style={styles.sectionTitre}>⏳ En attente de validation</Text>
                {comptesEnAttente.map((agent) => (
                  <View key={agent.id} style={styles.carteValidation}>
                    <Text style={styles.carteAvatar}>{agent.avatar || '👨‍⚕️'}</Text>
                    <View style={styles.carteInfos}>
                      <Text style={styles.carteNom}>{agent.nom}</Text>
                      <Text style={styles.carteEmail}>{agent.email}</Text>
                      <Text style={styles.carteDate}>Demande : {agent.date}</Text>
                    </View>
                    {/* Boutons Valider / Refuser */}
                    <View style={styles.boutonsValidation}>
                      <TouchableOpacity
                        style={styles.btnValider}
                        onPress={() => gererCompte(agent, 'valider')}
                      >
                        <Text style={styles.btnValiderTexte}>✓</Text>
                      </TouchableOpacity>
                      <TouchableOpacity
                        style={styles.btnRefuser}
                        onPress={() => gererCompte(agent, 'refuser')}
                      >
                        <Text style={styles.btnRefuserTexte}>✕</Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                ))}
              </View>
            )}

            {/* Liste des agents actifs */}
            <Text style={styles.sectionTitre}>👥 Agents du centre</Text>
            {agents.length === 0 ? (
              <Text style={{ color: '#6b7280', textAlign: 'center', padding: 20 }}>
                Aucun agent enregistré.
              </Text>
            ) : (
              agents.map((agent) => (
                <View key={agent.id} style={styles.agentLigne}>
                  <Text style={styles.agentAvatar}>{agent.avatar || '👨‍⚕️'}</Text>
                  <View style={styles.agentInfos}>
                    <Text style={styles.agentNom}>{agent.nom}</Text>
                    <Text style={styles.agentRole}>{agent.role}</Text>
                    {/* Nombre de vaccinations réalisées */}
                    {agent.statut === 'actif' && (
                      <Text style={styles.agentVaccins}>💉 {agent.vaccinesTotal} vaccinations</Text>
                    )}
                  </View>
                  {/* Badge actif/inactif */}
                  <View style={[
                    styles.statutBadge,
                    { backgroundColor: agent.statut === 'actif' ? '#dcfce7' : '#fee2e2' }
                  ]}>
                    <Text style={[
                      styles.statutTexte,
                      { color: agent.statut === 'actif' ? '#16a34a' : '#dc2626' }
                    ]}>
                      {agent.statut === 'actif' ? '● Actif' : '● Inactif'}
                    </Text>
                  </View>
                </View>
              ))
            )}
          </View>
        )}

        {/*
            ONGLET 3 — SÉANCES DE VACCINATION
        */}
        {onglet === 'seances' && (
          <View>
            <View style={styles.seancesHeader}>
              <Text style={styles.sectionTitre}>📅 RDV planifiées</Text>
              {/* Bouton planifier nouvelle séance */}
              <TouchableOpacity
                style={styles.btnNouvelleSeance}
                onPress={() => navigation.navigate('NouvelleSeance', { token })}
              >
                <Text style={styles.btnNouvelleSeanceTexte}>+ Nouvelle</Text>
              </TouchableOpacity>
            </View>

            {seances.length === 0 ? (
              <Text style={{ color: '#6b7280', textAlign: 'center', padding: 20 }}>
                Aucune séance planifiée.
              </Text>
            ) : (
              seances.map((seance) => (
                <View key={seance.id} style={styles.carteSeance}>
                  {/* Bande verte à gauche = indicateur visuel */}
                  <View style={styles.seanceBande} />
                  <View style={styles.seanceInfos}>
                    <Text style={styles.seanceTitre}>{seance.titre}</Text>
                    <Text style={styles.seanceDetail}>📅 {seance.date} à {seance.heure}</Text>
                    <Text style={styles.seanceDetail}>📍 {seance.lieu}</Text>
                    <Text style={styles.seanceAgent}>👩‍⚕️ {seance.agentResponsable}</Text>
                  </View>
                  {/* Bouton modifier */}
                  <TouchableOpacity
                    style={styles.btnModifier}
                    onPress={() => navigation.navigate('ModifierSeance', { seance, token })}
                  >
                    <Text style={styles.btnModifierTexte}>✏️</Text>
                  </TouchableOpacity>
                </View>
              ))
            )}
          </View>
        )}

        <View style={{ height: 80 }} />
      </ScrollView>

      {/* BARRE DE NAVIGATION BAS */}
      <View style={styles.navBar}>
        <TouchableOpacity style={styles.navItem} onPress={() => setOnglet('apercu')}>
          <Text style={styles.navEmoji}>🏠</Text>
          <Text style={[styles.navTexte, onglet === 'apercu' && styles.navActif]}>Accueil</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.navItem} onPress={() => setOnglet('agents')}>
          <Text style={styles.navEmoji}>👥</Text>
          <Text style={[styles.navTexte, onglet === 'agents' && styles.navActif]}>Agents</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.navItem} onPress={() => setOnglet('seances')}>
          <Text style={styles.navEmoji}>📅</Text>
          <Text style={[styles.navTexte, onglet === 'seances' && styles.navActif]}>RDV</Text>
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
  boutonReessayer: { backgroundColor: '#1a3c2e', borderRadius: 12, paddingHorizontal: 24, paddingVertical: 12 },
  boutonReessayerTexte: { color: 'white', fontWeight: 'bold' },

  header: {
    backgroundColor: '#1a3c2e', // Vert plus foncé pour différencier du dashboard agent
    paddingTop: 20,
    paddingHorizontal: 20,
    paddingBottom: 0,
  },

  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 16,
  },

  role: { color: '#4ade80', fontSize: 12, fontWeight: '600', letterSpacing: 1 },
  nomResponsable: { color: 'white', fontSize: 20, fontWeight: 'bold', marginVertical: 2 },
  centre: { color: 'rgba(255,255,255,0.75)', fontSize: 13 },

  // Conteneur des boutons en haut à droite
  headerActions: { flexDirection: 'row', alignItems: 'center', gap: 10 },

  avatarContainer: {
    width: 50, height: 50, borderRadius: 25,
    backgroundColor: 'rgba(255,255,255,0.15)',
    alignItems: 'center', justifyContent: 'center',
  },
  avatarEmoji: { fontSize: 26 },

  // Bouton déconnexion
  deconnexionBtn: {
    backgroundColor: 'rgba(255,255,255,0.2)',
    borderRadius: 20,
    padding: 8,
  },
  deconnexionTexte: { fontSize: 18 },

  // Onglets dans l'en-tête
  onglets: {
    flexDirection: 'row',
    marginTop: 4,
  },

  onglet: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
    borderBottomWidth: 3,
    borderBottomColor: 'transparent',
  },

  ongletActif: {
    borderBottomColor: '#4ade80', // Ligne verte sous l'onglet actif
  },

  ongletTexte: {
    color: 'rgba(255,255,255,0.6)',
    fontSize: 13,
    fontWeight: '500',
  },

  ongletTexteActif: {
    color: 'white',
    fontWeight: 'bold',
  },

  contenu: { flex: 1, paddingHorizontal: 16, paddingTop: 16 },

  sectionTitre: { fontSize: 16, fontWeight: 'bold', color: '#1a3c2e', marginBottom: 12 },

  // Grille stats 2x2
  statsGrille: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginBottom: 16,
  },

  statCarte: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 14,
    width: '48%',
    marginBottom: 10,
    borderLeftWidth: 4,
    elevation: 2,
  },

  statNombre: { fontSize: 28, fontWeight: 'bold', color: '#1a6b3c' },
  statLabel: { fontSize: 12, color: '#6b7280', marginTop: 2 },
  statEmoji: { fontSize: 20, position: 'absolute', top: 14, right: 14 },

  // Alerte comptes en attente
  alerteComptes: {
    backgroundColor: '#fffbeb',
    borderWidth: 1,
    borderColor: '#fcd34d',
    borderRadius: 12,
    padding: 14,
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  alerteEmoji: { fontSize: 24, marginRight: 12 },
  alerteTextes: { flex: 1 },
  alerteTitre: { fontSize: 14, fontWeight: 'bold', color: '#78350f' },
  alerteDescription: { fontSize: 13, color: '#92400e', marginTop: 2 },
  alerteFleche: { fontSize: 24, color: '#d97706', fontWeight: 'bold' },

  // Grille d'actions rapides
  actionsGrille: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },

  actionCarte: {
    width: '48%',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    marginBottom: 10,
    elevation: 2,
  },
  actionEmoji: { fontSize: 28, marginBottom: 8 },
  actionTexte: { color: 'white', fontSize: 12, fontWeight: '600', textAlign: 'center' },

  // Carte validation d'un agent
  carteValidation: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 14,
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
    borderLeftWidth: 4,
    borderLeftColor: '#d97706',
    elevation: 2,
  },
  carteAvatar: { fontSize: 32, marginRight: 12 },
  carteInfos: { flex: 1 },
  carteNom: { fontSize: 15, fontWeight: 'bold', color: '#1a3c2e' },
  carteEmail: { fontSize: 12, color: '#6b7280' },
  carteDate: { fontSize: 12, color: '#9ca3af', marginTop: 2 },

  boutonsValidation: { flexDirection: 'row', gap: 8 },

  btnValider: {
    width: 36, height: 36, borderRadius: 18,
    backgroundColor: '#dcfce7',
    alignItems: 'center', justifyContent: 'center',
  },
  btnValiderTexte: { color: '#16a34a', fontSize: 18, fontWeight: 'bold' },

  btnRefuser: {
    width: 36, height: 36, borderRadius: 18,
    backgroundColor: '#fee2e2',
    alignItems: 'center', justifyContent: 'center',
  },
  btnRefuserTexte: { color: '#dc2626', fontSize: 18, fontWeight: 'bold' },

  // Ligne agent dans la liste
  agentLigne: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 14,
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
    elevation: 1,
  },
  agentAvatar: { fontSize: 32, marginRight: 12 },
  agentInfos: { flex: 1 },
  agentNom: { fontSize: 15, fontWeight: '600', color: '#1a3c2e' },
  agentRole: { fontSize: 12, color: '#9ca3af' },
  agentVaccins: { fontSize: 12, color: '#6b7280', marginTop: 2 },

  statutBadge: { borderRadius: 8, paddingHorizontal: 10, paddingVertical: 4 },
  statutTexte: { fontSize: 12, fontWeight: '600' },

  // En-tête séances
  seancesHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },

  btnNouvelleSeance: {
    backgroundColor: '#1a3c2e',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  btnNouvelleSeanceTexte: { color: 'white', fontSize: 13, fontWeight: 'bold' },

  // Carte séance
  carteSeance: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 14,
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
    elevation: 2,
  },
  seanceBande: {
    width: 4,
    alignSelf: 'stretch',
    backgroundColor: '#1a6b3c',
    borderRadius: 4,
    marginRight: 12,
  },
  seanceInfos: { flex: 1 },
  seanceTitre: { fontSize: 15, fontWeight: 'bold', color: '#1a3c2e', marginBottom: 4 },
  seanceDetail: { fontSize: 13, color: '#6b7280', marginBottom: 2 },
  seanceAgent: { fontSize: 13, color: '#1a6b3c', marginTop: 4, fontWeight: '500' },

  btnModifier: { padding: 8 },
  btnModifierTexte: { fontSize: 20 },

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