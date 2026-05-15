import React, { useState, useEffect } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, StyleSheet,
  SafeAreaView, StatusBar, RefreshControl, ActivityIndicator
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
import { API_URL } from './config';

// ─── Helpers ────────────────────────────────────────────────────────────────
const formatDate = (dateStr) => {
  if (!dateStr) return '—';
  const d = new Date(dateStr);
  if (isNaN(d)) return dateStr;
  return d.toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' });
};

const formatDateCourt = (dateStr) => {
  if (!dateStr) return '—';
  const d = new Date(dateStr);
  if (isNaN(d)) return dateStr;
  return d.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' });
};

const calculerAge = (dateNaissance) => {
  if (!dateNaissance) return '';
  const naissance = new Date(dateNaissance);
  const now = new Date();
  const mois = (now.getFullYear() - naissance.getFullYear()) * 12 + (now.getMonth() - naissance.getMonth());
  if (mois < 1) return 'Moins d\'1 mois';
  if (mois < 24) return `${mois} mois`;
  return `${Math.floor(mois / 12)} ans`;
};

const statutVaccin = (v) => {
  if (v.date_administration) return 'fait';
  if (!v.date_prevue) return 'a_venir';
  return new Date(v.date_prevue) < new Date() ? 'retard' : 'a_venir';
};

// ─── Utilitaire : extraire un tableau depuis n'importe quelle réponse API ────
const extraireTableau = (response) => {
  if (!response) return [];
  const data = response.data ?? response;
  if (Array.isArray(data)) return data;
  if (data && Array.isArray(data.data)) return data.data;
  return [];
};

// ─── Composant Principal ─────────────────────────────────────────────────────
export default function DashboardParent({ navigation }) {
  const [loading, setLoading]               = useState(true);
  const [refreshing, setRefreshing]         = useState(false);
  const [parent, setParent]                 = useState(null);
  const [enfants, setEnfants]               = useState([]);
  const [enfantActif, setEnfantActif]       = useState(null);
  const [vaccins, setVaccins]               = useState([]);
  const [loadingVaccins, setLoadingVaccins] = useState(false);

  // ── Chargement vaccins d'un enfant ──────────────────────────────────────
  const chargerVaccins = async (enfantId, tokenParam) => {
    setLoadingVaccins(true);
    try {
      const token = tokenParam || await AsyncStorage.getItem('token');
      // ✅ CORRIGÉ : suppression du /api en double
      const res = await axios.get(`${API_URL}/enfants/${enfantId}/vaccinations`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      // ✅ Extraction sécurisée
      const raw = extraireTableau(res);

      // ✅ Sort sécurisé
      if (Array.isArray(raw)) {
        raw.sort((a, b) =>
          new Date(a.date_prevue || a.date_administration || 0) -
          new Date(b.date_prevue || b.date_administration || 0)
        );
        setVaccins(raw);
      } else {
        setVaccins([]);
      }
    } catch (e) {
      console.error('Erreur vaccins:', e?.response?.data || e.message);
      setVaccins([]);
    } finally {
      setLoadingVaccins(false);
    }
  };

  // ── Chargement initial ──────────────────────────────────────────────────
  const charger = async () => {
    try {
      const token = await AsyncStorage.getItem('token');
      const h = { Authorization: `Bearer ${token}` };
      const [profilRes, enfantsRes] = await Promise.all([
        axios.get(`${API_URL}/profil`, { headers: h }),
        axios.get(`${API_URL}/parent/enfants`, { headers: h }),
      ]);

      setParent(profilRes.data?.user || profilRes.data);

      // ✅ Extraction sécurisée de la liste d'enfants
      const liste = extraireTableau(enfantsRes);
      setEnfants(liste);

      if (liste.length > 0) {
        setEnfantActif(liste[0]);
        await chargerVaccins(liste[0].id, token);
      }
    } catch (e) {
      console.error('Erreur DashboardParent:', e?.response?.data || e.message);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  // ── Changer d'enfant ────────────────────────────────────────────────────
  const selectionnerEnfant = async (enfant) => {
    setEnfantActif(enfant);
    await chargerVaccins(enfant.id);
  };

  useEffect(() => { charger(); }, []);
  const onRefresh = () => { setRefreshing(true); charger(); };

  // ── Calculs couverture ──────────────────────────────────────────────────
  const nbFaits  = vaccins.filter(v => v.date_administration).length;
  const nbTotal  = vaccins.length;
  const pctCouv  = nbTotal > 0 ? Math.round((nbFaits / nbTotal) * 100) : 0;

  const prochainVaccin = vaccins.find(v => !v.date_administration);
  const aUnRetard      = vaccins.some(v => statutVaccin(v) === 'retard');

  if (loading) {
    return (
      <View style={S.loader}>
        <ActivityIndicator size="large" color="#2e7d32" />
        <Text style={S.loaderT}>Chargement…</Text>
      </View>
    );
  }

  return (
    <SafeAreaView style={S.container}>
      <StatusBar barStyle="light-content" backgroundColor="#2e7d32" />

      {/* ── Header vert ── */}
      <View style={S.header}>
        <View style={S.headerTop}>
          <View>
            <Text style={S.headerBonjour}>Bonjour 👋</Text>
            <Text style={S.headerNom}>{parent?.prenom} {parent?.nom}</Text>
          </View>
          {/* ✅ CORRIGÉ : Connexion au lieu de Login */}
          <TouchableOpacity style={S.iconBtn} onPress={() => navigation.navigate('Connexion')}>
            <Text style={S.iconBtnT}>⏻</Text>
          </TouchableOpacity>
        </View>

        {/* Chips enfants */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={S.chipsScroll}>
          {(Array.isArray(enfants) ? enfants : []).map((e) => (
            <TouchableOpacity
              key={e.id}
              style={[S.chipEnfant, enfantActif?.id === e.id && S.chipEnfantActif]}
              onPress={() => selectionnerEnfant(e)}
            >
              <Text style={[S.chipEnfantT, enfantActif?.id === e.id && S.chipEnfantTActif]}>
                {e.prenom}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {/* ── Corps ── */}
      <ScrollView
        style={S.scroll}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#2e7d32']} />}
      >
        {enfantActif ? (
          <>
            {/* ── Fiche enfant ── */}
            <View style={S.card}>
              <View style={S.ficheHead}>
                <View style={{ flex: 1 }}>
                  <Text style={S.ficheNom}>{enfantActif.prenom} {enfantActif.nom}</Text>
                  <Text style={S.ficheMeta}>
                    {enfantActif.sexe === 'F' ? 'Née' : 'Né'} le {formatDate(enfantActif.date_naissance)} · {calculerAge(enfantActif.date_naissance)}
                  </Text>
                  <Text style={S.ficheCode}>#{enfantActif.code || enfantActif.id}</Text>
                </View>
                <View style={[S.chipStatut, aUnRetard ? S.chipRetard : S.chipOk]}>
                  <Text style={[S.chipStatutT, aUnRetard ? S.chipRetardT : S.chipOkT]}>
                    {aUnRetard ? 'En retard' : 'À jour'}
                  </Text>
                </View>
              </View>

              {/* Barre couverture */}
              <View style={S.couvertureSection}>
                <View style={S.couvertureRow}>
                  <Text style={S.couvertureLabel}>Couverture vaccinale</Text>
                  <Text style={S.couverturePct}>{pctCouv}%</Text>
                </View>
                <View style={S.barreBg}>
                  <View style={[S.barreF, { width: `${pctCouv}%` }]} />
                </View>
                <Text style={S.couvertureDetail}>{nbFaits} / {nbTotal} vaccins administrés</Text>
              </View>
            </View>

            {/* ── Prochain vaccin ── */}
            {prochainVaccin && (
              <View style={S.prochainCard}>
                <Text style={S.prochainLabel}>Prochain vaccin</Text>
                <Text style={S.prochainNom}>
                  {prochainVaccin.vaccin || prochainVaccin.nom_vaccin} — {calculerAge(enfantActif.date_naissance)}
                </Text>
                {prochainVaccin.date_prevue && (
                  <Text style={S.prochainDate}>📅 {formatDate(prochainVaccin.date_prevue)}</Text>
                )}
              </View>
            )}

            {/* ── Actions rapides ── */}
            <View style={S.card}>
              <Text style={S.secTitle}>Actions rapides</Text>
              <View style={S.actionsRow}>
                <TouchableOpacity
                  style={[S.actionBtn, { backgroundColor: '#2e7d32' }]}
                  onPress={() => navigation.navigate('CarnetVaccinal', { enfantId: enfantActif.id, enfant: enfantActif })}
                >
                  <Text style={S.actionBtnT}>Carnet vaccinal</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[S.actionBtn, { backgroundColor: '#00695C' }]}
                  onPress={() => navigation.navigate('CentresProches')}
                >
                  <Text style={S.actionBtnT}>Centre proche</Text>
                </TouchableOpacity>
              </View>
            </View>

            {/* ── Carnet vaccinal ── */}
            <View style={S.card}>
              <Text style={S.secTitle}>Carnet vaccinal — {enfantActif.prenom}</Text>

              {loadingVaccins ? (
                <View style={S.loadingVaccins}>
                  <ActivityIndicator size="small" color="#2e7d32" />
                </View>
              ) : vaccins.length === 0 ? (
                <View style={S.vide}>
                  <Text style={S.videT}>Aucune vaccination enregistrée</Text>
                </View>
              ) : (
                (Array.isArray(vaccins) ? vaccins : []).map((v, i) => {
                  const statut    = statutVaccin(v);
                  const estFait   = statut === 'fait';
                  const estRetard = statut === 'retard';
                  return (
                    <View key={i} style={[S.vaccinLigne, i < vaccins.length - 1 && S.vaccinLigneBorder]}>
                      <View style={S.vaccinInfo}>
                        <Text style={S.vaccinNom}>{v.vaccin || v.nom_vaccin || '—'}</Text>
                        <Text style={S.vaccinMeta}>
                          {estFait
                            ? `${formatDateCourt(v.date_administration)} — ${v.centre_sante?.nom || v.agent?.centre_sante?.nom || '—'}`
                            : estRetard
                            ? `En retard — prévu le ${formatDateCourt(v.date_prevue)}`
                            : `À venir — ${v.age_cible || calculerAge(enfantActif.date_naissance)}`
                          }
                        </Text>
                      </View>
                      <View style={[
                        S.chipVaccin,
                        estFait   ? S.chipVaccinFait   :
                        estRetard ? S.chipVaccinRetard :
                                    S.chipVaccinAVenir
                      ]}>
                        <Text style={[
                          S.chipVaccinT,
                          estFait   ? S.chipVaccinFaitT   :
                          estRetard ? S.chipVaccinRetardT :
                                      S.chipVaccinAVenirT
                        ]}>
                          {estFait ? 'Fait' : estRetard ? 'En retard' : 'À venir'}
                        </Text>
                      </View>
                    </View>
                  );
                })
              )}
            </View>
          </>
        ) : (
          <View style={S.vide}>
            <Text style={S.videT}>Aucun enfant enregistré</Text>
          </View>
        )}

        <View style={{ height: 80 }} />
      </ScrollView>

      {/* ── Navbar ── */}
      <View style={S.navbar}>
        <TouchableOpacity style={[S.navItem, S.navItemActif]}>
          <Text style={S.navIcon}>🏠</Text>
          <Text style={[S.navLabel, S.navLabelActif]}>Accueil</Text>
        </TouchableOpacity>
        <TouchableOpacity style={S.navItem} onPress={() => navigation.navigate('CentresProches')}>
          <Text style={S.navIcon}>🏥</Text>
          <Text style={S.navLabel}>Centres</Text>
        </TouchableOpacity>
        <TouchableOpacity style={S.navItem} onPress={() => navigation.navigate('Contact')}>
          <Text style={S.navIcon}>📞</Text>
          <Text style={S.navLabel}>Contact</Text>
        </TouchableOpacity>
        {/* ✅ CORRIGÉ : Connexion au lieu de Login */}
        <TouchableOpacity style={S.navItem} onPress={() => navigation.navigate('Connexion')}>
          <Text style={S.navIcon}>↩️</Text>
          <Text style={S.navLabel}>Déco.</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

// ─── Styles ──────────────────────────────────────────────────────────────────
const VERT = '#2e7d32';
const S = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f6f5' },
  loader:    { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#f5f6f5' },
  loaderT:   { marginTop: 12, color: VERT, fontSize: 14 },
  scroll:    { flex: 1 },

  header: {
    backgroundColor: VERT,
    paddingHorizontal: 16,
    paddingTop: 14,
    paddingBottom: 14,
  },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  headerBonjour: { color: 'rgba(255,255,255,0.75)', fontSize: 13 },
  headerNom:     { color: '#fff', fontSize: 20, fontWeight: '500', marginTop: 2 },
  iconBtn: {
    width: 34, height: 34, borderRadius: 17,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center', alignItems: 'center',
  },
  iconBtnT: { color: '#fff', fontSize: 16 },

  chipsScroll:      { flexDirection: 'row' },
  chipEnfant:       { borderWidth: 1.5, borderColor: 'rgba(255,255,255,0.5)', borderRadius: 20, paddingHorizontal: 14, paddingVertical: 5, marginRight: 8 },
  chipEnfantActif:  { backgroundColor: '#fff', borderColor: '#fff' },
  chipEnfantT:      { color: 'rgba(255,255,255,0.85)', fontSize: 13, fontWeight: '500' },
  chipEnfantTActif: { color: VERT, fontWeight: '600' },

  card: {
    backgroundColor: '#fff',
    marginHorizontal: 12, marginTop: 10,
    borderRadius: 12,
    padding: 14,
    borderWidth: 0.5, borderColor: '#e8e8e8',
  },
  secTitle: { fontSize: 13, fontWeight: '500', color: '#555', marginBottom: 12 },

  ficheHead:  { flexDirection: 'row', alignItems: 'flex-start', marginBottom: 14 },
  ficheNom:   { fontSize: 16, fontWeight: '600', color: '#1a1a1a' },
  ficheMeta:  { fontSize: 12, color: '#777', marginTop: 3 },
  ficheCode:  { fontSize: 12, color: VERT, fontWeight: '500', marginTop: 4 },

  chipStatut:  { borderRadius: 20, paddingHorizontal: 10, paddingVertical: 4, marginLeft: 8 },
  chipOk:      { backgroundColor: '#e8f5e9' },
  chipRetard:  { backgroundColor: '#fce4ec' },
  chipOkT:     { fontSize: 11, fontWeight: '600', color: VERT },
  chipRetardT: { fontSize: 11, fontWeight: '600', color: '#c62828' },

  couvertureSection: {},
  couvertureRow:     { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6 },
  couvertureLabel:   { fontSize: 12, color: '#555' },
  couverturePct:     { fontSize: 12, fontWeight: '600', color: VERT },
  barreBg:           { height: 7, backgroundColor: '#e0e0e0', borderRadius: 4, overflow: 'hidden', marginBottom: 6 },
  barreF:            { height: '100%', backgroundColor: VERT, borderRadius: 4 },
  couvertureDetail:  { fontSize: 11, color: '#9e9e9e' },

  prochainCard: {
    backgroundColor: '#f1f8f1',
    marginHorizontal: 12, marginTop: 10,
    borderRadius: 12,
    padding: 14,
    borderLeftWidth: 3, borderLeftColor: VERT,
    borderWidth: 0.5, borderColor: '#c8e6c9',
  },
  prochainLabel: { fontSize: 11, color: '#555', marginBottom: 4 },
  prochainNom:   { fontSize: 16, fontWeight: '500', color: '#1a1a1a' },
  prochainDate:  { fontSize: 12, color: '#777', marginTop: 4 },

  actionsRow: { flexDirection: 'row', gap: 10 },
  actionBtn:  { flex: 1, borderRadius: 8, paddingVertical: 13, alignItems: 'center' },
  actionBtnT: { color: '#fff', fontSize: 13, fontWeight: '500' },

  vaccinLigne:       { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 12 },
  vaccinLigneBorder: { borderBottomWidth: 0.5, borderBottomColor: '#f0f0f0' },
  vaccinInfo:        { flex: 1, paddingRight: 10 },
  vaccinNom:         { fontSize: 14, fontWeight: '500', color: '#1a1a1a' },
  vaccinMeta:        { fontSize: 11, color: '#9e9e9e', marginTop: 2 },

  chipVaccin:         { borderRadius: 20, paddingHorizontal: 10, paddingVertical: 3 },
  chipVaccinFait:     { backgroundColor: '#e8f5e9' },
  chipVaccinRetard:   { backgroundColor: '#fce4ec' },
  chipVaccinAVenir:   { backgroundColor: '#fff3e0' },
  chipVaccinFaitT:    { fontSize: 11, fontWeight: '600', color: VERT },
  chipVaccinRetardT:  { fontSize: 11, fontWeight: '600', color: '#c62828' },
  chipVaccinAVenirT:  { fontSize: 11, fontWeight: '600', color: '#e65100' },

  loadingVaccins: { paddingVertical: 20, alignItems: 'center' },

  vide:  { paddingVertical: 30, alignItems: 'center' },
  videT: { color: '#9e9e9e', fontSize: 14 },

  navbar: {
    backgroundColor: '#fff',
    borderTopWidth: 0.5, borderTopColor: '#e0e0e0',
    flexDirection: 'row',
    paddingVertical: 8, paddingBottom: 12,
  },
  navItem:       { flex: 1, alignItems: 'center', gap: 2 },
  navItemActif:  {},
  navIcon:       { fontSize: 18 },
  navLabel:      { fontSize: 10, color: '#bdbdbd' },
  navLabelActif: { color: VERT, fontWeight: '600' },
});