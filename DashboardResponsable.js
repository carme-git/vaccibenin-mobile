
// DashboardResponsable.js — Écran principal du Responsable PEV
// Chef du centre : supervise agents, valide comptes, coordonne séances


import React, { useState } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet,
  SafeAreaView, ScrollView, FlatList,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';

// DONNÉES FICTIVES — à remplacer par l'API Laravel
// axios.get('/api/responsable/dashboard')

const responsableData = {
  nom: 'Dr. Espoir Dossou',
  centre: 'CSA Akpakpa, Cotonou',
  stats: {
    totalAgents: 6,
    agentsActifs: 5,
    comptesAValider: 2,       // Nouveaux agents en attente de validation
    seancesCeMois: 8,
    enfantsSuivis: 312,
    tauxCouverture: 78,       // % de couverture vaccinale du centre
  },
  // Liste des agents du centre avec leur statut
  agents: [
    { id: 1, nom: 'Dr. Adjoua Koffi', role: 'Agent', statut: 'actif', vaccinesTotal: 142, avatar: '👩‍⚕️' },
    { id: 2, nom: 'Mathieu Agbodjan', role: 'Agent', statut: 'actif', vaccinesTotal: 98, avatar: '👨‍⚕️' },
    { id: 3, nom: 'Rosine Hounsou', role: 'Agent', statut: 'actif', vaccinesTotal: 76, avatar: '👩‍⚕️' },
    { id: 4, nom: 'Jonas Amoussou', role: 'Agent', statut: 'inactif', vaccinesTotal: 0, avatar: '👨‍⚕️' },
  ],
  // Comptes en attente de validation
  comptesEnAttente: [
    { id: 1, nom: 'Brice Tokplo', email: 'brice@csa.bj', date: '25 Mars 2026', avatar: '👨‍⚕️' },
    { id: 2, nom: 'Aline Gbedo', email: 'aline@csa.bj', date: '26 Mars 2026', avatar: '👩‍⚕️' },
  ],
  // Prochaines séances de vaccination planifiées
  seancesAVenir: [
    { id: 1, titre: 'Séance BCG + Polio', date: '28 Mars 2026', heure: '08h00', lieu: 'Salle A', agentResponsable: 'Dr. Adjoua Koffi' },
    { id: 2, titre: 'Séance Pentavalent', date: '02 Avr 2026', heure: '09h00', lieu: 'Salle B', agentResponsable: 'Mathieu Agbodjan' },
    { id: 3, titre: 'Séance ROR', date: '10 Avr 2026', heure: '08h30', lieu: 'Salle A', agentResponsable: 'Rosine Hounsou' },
  ],
};

// COMPOSANT PRINCIPAL

export default function DashboardResponsable({ navigation }) {

  // Onglet actif : 'apercu', 'agents', ou 'seances'
  // Permet de switcher entre les 3 vues sans changer d'écran
  const [onglet, setOnglet] = useState('apercu');

  // FONCTION — Valider ou refuser un compte agent
  
  const gererCompte = (agent, action) => {
    // action = 'valider' ou 'refuser'
    const message = action === 'valider'
      ? `Le compte de ${agent.nom} a été validé. Il peut maintenant se connecter.`
      : `Le compte de ${agent.nom} a été refusé.`;
    alert(message);
    // TODO : axios.post('/api/responsable/valider-compte', { agentId: agent.id, action })
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style="light" />

      {/*  EN-TÊTE  */}
      <View style={styles.header}>
        <View style={styles.headerTop}>
          <View>
            <Text style={styles.role}>Responsable PEV</Text>
            <Text style={styles.nomResponsable}>{responsableData.nom}</Text>
            <Text style={styles.centre}>📍 {responsableData.centre}</Text>
          </View>
          <View style={styles.avatarContainer}>
            <Text style={styles.avatarEmoji}>👨‍💼</Text>
          </View>
        </View>

        {/*  ONGLETS DE NAVIGATION */}
        {/* 3 onglets pour switcher entre les sections sans changer d'écran */}
        <View style={styles.onglets}>
          {[
            { id: 'apercu', label: '📊 Aperçu' },
            { id: 'agents', label: '👥 Agents' },
            { id: 'seances', label: '📅 RDV en cours' },
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
                <Text style={styles.statNombre}>{responsableData.stats.enfantsSuivis}</Text>
                <Text style={styles.statLabel}>Enfants suivis</Text>
                <Text style={styles.statEmoji}>👶</Text>
              </View>

              <View style={[styles.statCarte, { borderLeftColor: '#2563eb' }]}>
                <Text style={[styles.statNombre, { color: '#2563eb' }]}>
                  {responsableData.stats.tauxCouverture}%
                </Text>
                <Text style={styles.statLabel}>Taux de couverture</Text>
                <Text style={styles.statEmoji}>📈</Text>
              </View>

              <View style={[styles.statCarte, { borderLeftColor: '#7c3aed' }]}>
                <Text style={[styles.statNombre, { color: '#7c3aed' }]}>
                  {responsableData.stats.totalAgents}
                </Text>
                <Text style={styles.statLabel}>Agents au total</Text>
                <Text style={styles.statEmoji}>👥</Text>
              </View>

              <View style={[styles.statCarte, { borderLeftColor: '#d97706' }]}>
                <Text style={[styles.statNombre, { color: '#d97706' }]}>
                  {responsableData.stats.seancesCeMois}
                </Text>
                <Text style={styles.statLabel}>RDV de ce mois</Text>
                <Text style={styles.statEmoji}>💉</Text>
              </View>

            </View>

            {/* Alerte comptes en attente — affiché seulement s'il y en a */}
            {responsableData.stats.comptesAValider > 0 && (
              <TouchableOpacity
                style={styles.alerteComptes}
                onPress={() => setOnglet('agents')} // Bascule vers l'onglet Agents
              >
                <Text style={styles.alerteEmoji}>🔔</Text>
                <View style={styles.alerteTextes}>
                  <Text style={styles.alerteTitre}>Comptes en attente</Text>
                  <Text style={styles.alerteDescription}>
                    {responsableData.stats.comptesAValider} agent(s) attendent votre validation
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
                onPress={() => navigation.navigate('NouvelleSeance')}
              >
                <Text style={styles.actionEmoji}>📅</Text>
                <Text style={styles.actionTexte}>Planifier une RDV</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.actionCarte, { backgroundColor: '#2563eb' }]}
                onPress={() => navigation.navigate('Rapport')}
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
            {responsableData.comptesEnAttente.length > 0 && (
              <View>
                <Text style={styles.sectionTitre}>⏳ En attente de validation</Text>
                {responsableData.comptesEnAttente.map((agent) => (
                  <View key={agent.id} style={styles.carteValidation}>
                    <Text style={styles.carteAvatar}>{agent.avatar}</Text>
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
            {responsableData.agents.map((agent) => (
              <View key={agent.id} style={styles.agentLigne}>
                <Text style={styles.agentAvatar}>{agent.avatar}</Text>
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
            ))}
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
                onPress={() => navigation.navigate('NouvelleSeance')}
              >
                <Text style={styles.btnNouvelleSeanceTexte}>+ Nouvelle</Text>
              </TouchableOpacity>
            </View>

            {responsableData.seancesAVenir.map((seance) => (
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
                <TouchableOpacity style={styles.btnModifier}>
                  <Text style={styles.btnModifierTexte}>✏️</Text>
                </TouchableOpacity>
              </View>
            ))}
          </View>
        )}

        <View style={{ height: 80 }} />
      </ScrollView>

      {/* ===== BARRE DE NAVIGATION BAS ===== */}
      <View style={styles.navBar}>
        <TouchableOpacity style={styles.navItem}>
          <Text style={styles.navEmoji}>🏠</Text>
          <Text style={[styles.navTexte, styles.navActif]}>Accueil</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.navItem} onPress={() => setOnglet('agents')}>
          <Text style={styles.navEmoji}>👥</Text>
          <Text style={styles.navTexte}>Agents</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.navItem} onPress={() => setOnglet('seances')}>
          <Text style={styles.navEmoji}>📅</Text>
          <Text style={styles.navTexte}>RDV</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.navItem}>
          <Text style={styles.navEmoji}>👤</Text>
          <Text style={styles.navTexte}>Profil</Text>
        </TouchableOpacity>
      </View>

    </SafeAreaView>
  );
}

// STYLES

const styles = StyleSheet.create({

  container: { flex: 1, backgroundColor: '#f3f4f6' },

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

  avatarContainer: {
    width: 50, height: 50, borderRadius: 25,
    backgroundColor: 'rgba(255,255,255,0.15)',
    alignItems: 'center', justifyContent: 'center',
  },
  avatarEmoji: { fontSize: 26 },

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

  // Grille d'actions rapides 2x2
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
    backgroundColor: '#1a6b3c',
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
    width: 4, height: '100%',
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