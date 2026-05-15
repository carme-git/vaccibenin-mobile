import React, { useState, useEffect } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, StyleSheet,
  SafeAreaView, StatusBar, ActivityIndicator, RefreshControl, Alert
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
  if (!dateNaissance) return '—';
  const naissance = new Date(dateNaissance);
  const now = new Date();
  const mois = (now.getFullYear() - naissance.getFullYear()) * 12 + (now.getMonth() - naissance.getMonth());
  if (mois < 1) return 'Moins d\'1 mois';
  if (mois < 24) return `${mois} mois`;
  const ans = Math.floor(mois / 12);
  return `${ans} an${ans > 1 ? 's' : ''}`;
};

const statutVaccin = (v) => {
  if (v.date_administration) return 'effectue';
  if (!v.date_prevue) return 'programme';
  return new Date(v.date_prevue) < new Date() ? 'retard' : 'programme';
};

// ─── Déconnexion (réutilisable) ──────────────────────────────────────────────
export const deconnecter = async (navigation) => {
  try {
    await AsyncStorage.multiRemove(['token', 'role', 'user']);
  } catch (e) {
    console.error('Erreur déconnexion:', e);
  }
  navigation.reset({ index: 0, routes: [{ name: 'Connexion' }] });
};

// ─── Badge statut vaccin ─────────────────────────────────────────────────────
const BadgeStatut = ({ statut }) => {
  const cfg = {
    effectue:  { label: 'Fait',       bg: '#e8f5e9', color: '#2e7d32' },
    retard:    { label: 'En retard',  bg: '#fce4ec', color: '#c62828' },
    programme: { label: 'À venir',    bg: '#fff3e0', color: '#e65100' },
  }[statut] || { label: statut, bg: '#f3f4f6', color: '#374151' };

  return (
    <View style={[S.badge, { backgroundColor: cfg.bg }]}>
      <Text style={[S.badgeT, { color: cfg.color }]}>{cfg.label}</Text>
    </View>
  );
};

const LigneInfo = ({ label, value }) => (
  <View style={S.ligneInfo}>
    <Text style={S.ligneLabel}>{label}</Text>
    <Text style={S.ligneValeur}>{value || '—'}</Text>
  </View>
);

// ─── Composant Principal ─────────────────────────────────────────────────────
export default function FicheEnfant({ route, navigation }) {
  const { enfantId, enfant: enfantInitial } = route.params || {};

  const [loading, setLoading]       = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [enfant, setEnfant]         = useState(enfantInitial || null);
  const [vaccins, setVaccins]       = useState([]);
  const [onglet, setOnglet]         = useState('carnet');

  const charger = async () => {
    try {
      const token = await AsyncStorage.getItem('token');
      const h = { Authorization: `Bearer ${token}` };
      const id = enfantId || enfantInitial?.id;

      const [ficheRes, vaccinsRes] = await Promise.all([
        axios.get(`${API_URL}/api/enfants/${id}`, { headers: h }),
        axios.get(`${API_URL}/api/enfants/${id}/vaccinations`, { headers: h }),
      ]);

      setEnfant(ficheRes.data.data || ficheRes.data);

      const raw = vaccinsRes.data.data || vaccinsRes.data || [];
      raw.sort((a, b) => {
        const da = new Date(a.date_administration || a.date_prevue || 0);
        const db = new Date(b.date_administration || b.date_prevue || 0);
        return da - db;
      });
      setVaccins(raw);
    } catch (e) {
      console.error('Erreur fiche enfant:', e?.response?.data || e.message);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => { charger(); }, [enfantId]);
  const onRefresh = () => { setRefreshing(true); charger(); };

  // Couverture
  const nbFaits = vaccins.filter(v => v.date_administration).length;
  const nbTotal = vaccins.length;
  const pct     = nbTotal > 0 ? Math.round((nbFaits / nbTotal) * 100) : 0;

  if (loading) {
    return (
      <View style={S.loader}>
        <ActivityIndicator size="large" color="#2e7d32" />
        <Text style={S.loaderT}>Chargement de la fiche…</Text>
      </View>
    );
  }

  if (!enfant) {
    return (
      <SafeAreaView style={S.container}>
        <View style={S.erreurWrap}>
          <Text style={S.erreurT}>Impossible de charger la fiche.</Text>
          <TouchableOpacity style={S.btnRetour} onPress={() => navigation.goBack()}>
            <Text style={S.btnRetourT}>← Retour</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={S.container}>
      <StatusBar barStyle="light-content" backgroundColor="#2e7d32" />

      {/* ── Header ── */}
      <View style={S.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={S.btnBack}>
          <Text style={S.btnBackT}>←</Text>
        </TouchableOpacity>
        <View style={S.headerCenter}>
          <Text style={S.headerNom}>{enfant.prenom} {enfant.nom}</Text>
          <Text style={S.headerAge}>{calculerAge(enfant.date_naissance)}</Text>
        </View>
        {/* Déconnexion */}
        <TouchableOpacity
          style={S.btnDeco}
          onPress={() =>
            Alert.alert('Déconnexion', 'Voulez-vous vous déconnecter ?', [
              { text: 'Annuler', style: 'cancel' },
              { text: 'Déconnecter', style: 'destructive', onPress: () => deconnecter(navigation) },
            ])
          }
        >
          <Text style={S.btnDecoT}>⏻</Text>
        </TouchableOpacity>
      </View>

      {/* ── Progression ── */}
      <View style={S.progressionWrap}>
        <View style={S.progressionRow}>
          <Text style={S.progressionLabel}>Couverture vaccinale</Text>
          <Text style={S.progressionPct}>{pct}%</Text>
        </View>
        <View style={S.barreBg}>
          <View style={[S.barreF, { width: `${pct}%` }]} />
        </View>
        <Text style={S.progressionDetail}>{nbFaits} / {nbTotal} vaccins administrés</Text>
      </View>

      {/* ── Onglets ── */}
      <View style={S.ongletsWrap}>
        <View style={S.onglets}>
          {[{ key: 'carnet', label: 'Carnet vaccinal' }, { key: 'infos', label: 'Informations' }].map(o => (
            <TouchableOpacity
              key={o.key}
              style={[S.onglet, onglet === o.key && S.ongletActif]}
              onPress={() => setOnglet(o.key)}
            >
              <Text style={[S.ongletT, onglet === o.key && S.ongletTActif]}>{o.label}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      <ScrollView
        style={S.scroll}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#2e7d32']} />}
      >
        {/* ── Carnet ── */}
        {onglet === 'carnet' && (
          <View style={S.section}>
            {vaccins.length === 0 ? (
              <View style={S.vide}><Text style={S.videT}>Aucune vaccination enregistrée</Text></View>
            ) : (
              vaccins.map((v, i) => {
                const statut   = statutVaccin(v);
                const estFait  = statut === 'effectue';
                const estRetard = statut === 'retard';
                return (
                  <View key={i} style={[S.vaccinLigne, estRetard && S.vaccinLigneRetard]}>
                    <View style={[S.vaccinIcone, { backgroundColor: estFait ? '#e8f5e9' : estRetard ? '#fce4ec' : '#fff3e0' }]}>
                      <Text style={{ fontSize: 14 }}>{estFait ? '✓' : estRetard ? '!' : '◷'}</Text>
                    </View>
                    <View style={S.vaccinInfo}>
                      <Text style={S.vaccinNom}>{v.vaccin || v.nom_vaccin || '—'}</Text>
                      <Text style={S.vaccinMeta}>
                        {estFait
                          ? `${formatDateCourt(v.date_administration)} — ${v.centre_sante?.nom || '—'}`
                          : estRetard
                          ? `En retard · prévu le ${formatDateCourt(v.date_prevue)}`
                          : `À venir · ${formatDateCourt(v.date_prevue)}`
                        }
                      </Text>
                    </View>
                    <BadgeStatut statut={statut} />
                  </View>
                );
              })
            )}
          </View>
        )}

        {/* ── Informations ── */}
        {onglet === 'infos' && (
          <View style={S.section}>
            <View style={S.carteInfos}>
              <Text style={S.carteInfosTitre}>Enfant</Text>
              <LigneInfo label="Prénom & nom"        value={`${enfant.prenom} ${enfant.nom}`} />
              <LigneInfo label="Date de naissance"   value={formatDate(enfant.date_naissance)} />
              <LigneInfo label="Sexe"                value={enfant.sexe === 'M' ? 'Masculin' : enfant.sexe === 'F' ? 'Féminin' : enfant.sexe} />
              <LigneInfo label="Lieu de naissance"   value={enfant.lieu_naissance} />
              <LigneInfo label="Code"                value={enfant.code} />
            </View>

            {enfant.mere_tuteur && (
              <View style={S.carteInfos}>
                <Text style={S.carteInfosTitre}>Mère / Tuteur</Text>
                <LigneInfo label="Nom"       value={`${enfant.mere_tuteur.prenom || ''} ${enfant.mere_tuteur.nom || ''}`} />
                <LigneInfo label="Téléphone" value={enfant.mere_tuteur.telephone} />
                <LigneInfo label="Adresse"   value={enfant.mere_tuteur.adresse} />
              </View>
            )}

            <View style={S.carteInfos}>
              <Text style={S.carteInfosTitre}>Suivi médical</Text>
              <LigneInfo label="Centre de santé"    value={enfant.centre_sante?.nom} />
              <LigneInfo label="Agent responsable"  value={enfant.agent ? `${enfant.agent.prenom} ${enfant.agent.nom}` : null} />
              <LigneInfo label="Enregistré le"      value={formatDate(enfant.created_at)} />
            </View>
          </View>
        )}

        <View style={{ height: 40 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

// ─── Styles ──────────────────────────────────────────────────────────────────
const VERT = '#2e7d32';
const S = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f6f5' },
  loader:    { flex: 1, justifyContent: 'center', alignItems: 'center' },
  loaderT:   { marginTop: 12, color: VERT, fontSize: 14 },
  scroll:    { flex: 1 },

  erreurWrap: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 32 },
  erreurT:    { fontSize: 15, color: '#374151', marginBottom: 16 },
  btnRetour:  { backgroundColor: VERT, borderRadius: 10, paddingHorizontal: 20, paddingVertical: 10 },
  btnRetourT: { color: '#fff', fontWeight: '600' },

  // Header
  header: {
    backgroundColor: VERT,
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: 16, paddingVertical: 12,
  },
  btnBack:   { width: 36, justifyContent: 'center' },
  btnBackT:  { color: '#fff', fontSize: 22 },
  headerCenter: { flex: 1, alignItems: 'center' },
  headerNom:    { color: '#fff', fontSize: 17, fontWeight: '600' },
  headerAge:    { color: 'rgba(255,255,255,0.75)', fontSize: 12, marginTop: 2 },
  btnDeco: {
    width: 34, height: 34, borderRadius: 17,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center', alignItems: 'center',
  },
  btnDecoT: { color: '#fff', fontSize: 16 },

  // Progression
  progressionWrap: {
    backgroundColor: '#fff', padding: 14,
    borderBottomWidth: 0.5, borderBottomColor: '#e8e8e8',
  },
  progressionRow:   { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6 },
  progressionLabel: { fontSize: 12, color: '#555' },
  progressionPct:   { fontSize: 12, fontWeight: '600', color: VERT },
  barreBg: { height: 7, backgroundColor: '#e0e0e0', borderRadius: 4, overflow: 'hidden', marginBottom: 4 },
  barreF:  { height: '100%', backgroundColor: VERT, borderRadius: 4 },
  progressionDetail: { fontSize: 11, color: '#9e9e9e' },

  // Onglets
  ongletsWrap: { backgroundColor: '#fff', paddingHorizontal: 16, paddingBottom: 12, paddingTop: 8, borderBottomWidth: 0.5, borderBottomColor: '#e8e8e8' },
  onglets:     { flexDirection: 'row', backgroundColor: '#f0f0f0', borderRadius: 8, padding: 3 },
  onglet:      { flex: 1, paddingVertical: 7, borderRadius: 6, alignItems: 'center' },
  ongletActif: { backgroundColor: '#fff' },
  ongletT:     { fontSize: 13, color: '#888', fontWeight: '500' },
  ongletTActif:{ color: VERT, fontWeight: '600' },

  section: { padding: 12 },

  // Ligne vaccin
  vaccinLigne: {
    backgroundColor: '#fff', borderRadius: 10,
    flexDirection: 'row', alignItems: 'center',
    padding: 12, marginBottom: 8,
    borderWidth: 0.5, borderColor: '#e8e8e8',
  },
  vaccinLigneRetard: { borderLeftWidth: 3, borderLeftColor: '#c62828', borderRadius: 0 },
  vaccinIcone: {
    width: 34, height: 34, borderRadius: 17,
    justifyContent: 'center', alignItems: 'center', marginRight: 10,
  },
  vaccinInfo:  { flex: 1 },
  vaccinNom:   { fontSize: 14, fontWeight: '500', color: '#1a1a1a' },
  vaccinMeta:  { fontSize: 11, color: '#9e9e9e', marginTop: 2 },

  badge: { borderRadius: 20, paddingHorizontal: 9, paddingVertical: 3 },
  badgeT:{ fontSize: 11, fontWeight: '600' },

  // Infos
  carteInfos: {
    backgroundColor: '#fff', borderRadius: 10,
    padding: 14, marginBottom: 10,
    borderWidth: 0.5, borderColor: '#e8e8e8',
  },
  carteInfosTitre: {
    fontSize: 11, fontWeight: '700', color: VERT,
    textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 10,
  },
  ligneInfo: {
    flexDirection: 'row', justifyContent: 'space-between',
    paddingVertical: 7, borderBottomWidth: 0.5, borderBottomColor: '#f3f4f6',
  },
  ligneLabel:  { fontSize: 13, color: '#9e9e9e', flex: 1 },
  ligneValeur: { fontSize: 13, color: '#1a1a1a', fontWeight: '500', flex: 1, textAlign: 'right' },

  vide:  { alignItems: 'center', paddingVertical: 40 },
  videT: { color: '#9e9e9e', fontSize: 14 },
});