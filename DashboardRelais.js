import React, { useState, useEffect } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, StyleSheet,
  SafeAreaView, StatusBar, RefreshControl, ActivityIndicator, Linking
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
import { API_URL } from './config';

const formatDateCourt = (dateStr) => {
  if (!dateStr) return '—';
  const d = new Date(dateStr);
  if (isNaN(d)) return dateStr;
  return d.toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit', year: 'numeric' });
};

const joursRestants = (dateStr) => {
  if (!dateStr) return null;
  return Math.ceil((new Date(dateStr) - new Date()) / (1000 * 60 * 60 * 24));
};

const extraireTableau = (response) => {
  if (!response) return [];
  const data = response.data ?? response;
  if (Array.isArray(data)) return data;
  if (data && Array.isArray(data.data)) return data.data;
  return [];
};

const ChipDelai = ({ dateStr }) => {
  const j = joursRestants(dateStr);
  if (j === null) return null;
  if (j < 0)   return <View style={[S.chip, { backgroundColor: '#fee2e2' }]}><Text style={[S.chipT, { color: '#dc2626' }]}>{Math.abs(j)} jours de retard</Text></View>;
  if (j === 0) return <View style={[S.chip, { backgroundColor: '#fef3c7' }]}><Text style={[S.chipT, { color: '#92400e' }]}>Aujourd'hui</Text></View>;
  return <View style={[S.chip, { backgroundColor: '#d1fae5' }]}><Text style={[S.chipT, { color: '#065f46' }]}>Dans {j} jours</Text></View>;
};

const CarteEnfant = ({ enfant, enRetard }) => (
  <View style={[S.carteEnfant, enRetard && { borderLeftColor: '#dc2626' }]}>
    <View style={S.carteHead}>
      <Text style={S.eNom}>{enfant.prenom} {enfant.nom}</Text>
      {enfant.prochain_vaccin?.vaccin && (
        <View style={S.chipVaccin}><Text style={S.chipVaccinT}>{enfant.prochain_vaccin.vaccin}</Text></View>
      )}
    </View>
    <Text style={S.eCode}>{enfant.age_mois ? `${enfant.age_mois} mois` : '—'} · Code : {enfant.code || '—'}</Text>
    {enfant.prochain_vaccin?.date_prevue && (
      <View style={S.eDate}>
        <Text style={S.eDateT}>{formatDateCourt(enfant.prochain_vaccin.date_prevue)}</Text>
        <ChipDelai dateStr={enfant.prochain_vaccin.date_prevue} />
      </View>
    )}
    <View style={S.eSep} />
    <View style={S.eGrid}>
      <View style={S.eCol}>
        <Text style={S.eLabel}>MÈRE</Text>
        <Text style={S.eVal}>{enfant.mere_tuteur?.nom || 'Non renseigné'}</Text>
      </View>
      {enfant.mere_tuteur?.telephone && (
        <View style={S.eCol}>
          <Text style={S.eLabel}>TÉL. MÈRE</Text>
          <TouchableOpacity onPress={() => Linking.openURL(`tel:${enfant.mere_tuteur.telephone}`)}>
            <Text style={S.eTel}>{enfant.mere_tuteur.telephone}</Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
    {enfant.mere_tuteur?.adresse && (
      <View style={{ marginTop: 4 }}>
        <Text style={S.eLabel}>ADRESSE</Text>
        <Text style={S.eVal}>{enfant.mere_tuteur.adresse}</Text>
      </View>
    )}
  </View>
);

export default function DashboardRelais({ navigation }) {
  const [loading, setLoading]             = useState(true);
  const [refreshing, setRefreshing]       = useState(false);
  const [relais, setRelais]               = useState(null);
  const [stats, setStats]                 = useState({ centre_nom: '—', centre_ville: '—', enfants_suivis: 0 });
  const [rdvsAVenir, setRdvsAVenir]       = useState([]);
  const [enfantsRetard, setEnfantsRetard] = useState([]);
  const [onglet, setOnglet]               = useState('rdv');

  const charger = async () => {
    try {
      const token = await AsyncStorage.getItem('token');
      const h = { Authorization: `Bearer ${token}` };
      const [p, st, rdv, ret] = await Promise.all([
        axios.get(`${API_URL}/profil`,                     { headers: h }),
        axios.get(`${API_URL}/relais/stats`,               { headers: h }),
        axios.get(`${API_URL}/relais/enfants/rdv-a-venir`, { headers: h }),
        axios.get(`${API_URL}/relais/enfants/en-retard`,   { headers: h }),
      ]);
      setRelais(p.data?.user || p.data);
      setStats(st.data || { centre_nom: '—', centre_ville: '—', enfants_suivis: 0 });
      setRdvsAVenir(extraireTableau(rdv));
      setEnfantsRetard(extraireTableau(ret));
    } catch (e) {
      console.error('DashboardRelais:', e?.response?.data || e.message);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => { charger(); }, []);
  const onRefresh = () => { setRefreshing(true); charger(); };

  if (loading) return (
    <View style={S.loader}>
      <ActivityIndicator size="large" color="#00695c" />
      <Text style={S.loaderT}>Chargement…</Text>
    </View>
  );

  const liste = onglet === 'rdv' ? rdvsAVenir : enfantsRetard;

  return (
    <SafeAreaView style={S.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#fff" />

      {/* ── Topbar ── */}
      <View style={S.topbar}>
        <View>
          <Text style={S.topTitre}>Tableau de bord</Text>
          <Text style={S.topDate}>
            {new Date().toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
          </Text>
        </View>
        <TouchableOpacity style={[S.avatar, { backgroundColor: '#00695c' }]} onPress={() => navigation.navigate('Connexion')}>
          <Text style={S.avatarT}>{relais?.prenom?.charAt(0)}{relais?.nom?.charAt(0)}</Text>
        </TouchableOpacity>
      </View>

      {/* ── Identité ── */}
      <View style={S.identite}>
        <Text style={S.idNom}>{relais?.prenom} {relais?.nom}</Text>
        <Text style={S.idRole}>Relais Communautaire · {relais?.centre_sante?.nom || '—'}</Text>
      </View>

      <ScrollView style={S.scroll} showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#00695c']} />}>

        {/* ── Stats ── */}
        <View style={S.statsGrid}>
          {/* Mon centre */}
          <View style={S.stat}>
            <Text style={S.statLabel}>MON CENTRE</Text>
            <Text style={S.statCentreNom}>{stats.centre_nom || relais?.centre_sante?.nom || '—'}</Text>
            <Text style={S.statSub}>{stats.centre_ville || relais?.centre_sante?.ville || '—'}</Text>
            <View style={[S.statIco, { backgroundColor: '#d1fae5' }]}><Text style={S.statIcoE}>🏥</Text></View>
          </View>
          {/* Enfants suivis */}
          <View style={S.stat}>
            <Text style={S.statLabel}>ENFANTS{'\n'}SUIVIS</Text>
            <Text style={[S.statVal, { color: '#00695c' }]}>{stats.enfants_suivis ?? 0}</Text>
            <Text style={S.statSub}>Dans votre centre</Text>
            <View style={[S.statIco, { backgroundColor: '#dbeafe' }]}><Text style={S.statIcoE}>👤</Text></View>
          </View>
        </View>

        {/* ── Liste de terrain ── */}
        <View style={S.card}>
          <Text style={S.secHeadT}>LISTE DE TERRAIN — FAMILLES À CONTACTER</Text>
          <View style={S.tabsRow}>
            <TouchableOpacity style={[S.tab, onglet === 'rdv' && S.tabActif]} onPress={() => setOnglet('rdv')}>
              <Text style={[S.tabT, onglet === 'rdv' && S.tabActifT]}>RDV à venir  {rdvsAVenir.length}</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[S.tab, onglet === 'retard' && S.tabRetard]} onPress={() => setOnglet('retard')}>
              <Text style={[S.tabT, onglet === 'retard' && S.tabActifT]}>En retard  {enfantsRetard.length}</Text>
            </TouchableOpacity>
          </View>
          {liste.length === 0
            ? <View style={S.vide}><Text style={S.videT}>{onglet === 'rdv' ? 'Aucun rendez-vous à venir' : 'Aucun enfant en retard 🎉'}</Text></View>
            : liste.map((e, i) => <CarteEnfant key={i} enfant={e} enRetard={onglet === 'retard'} />)
          }
        </View>

        <View style={{ height: 20 }} />
      </ScrollView>

      {/* ── Navbar ── */}
      <View style={S.navbar}>
        <TouchableOpacity style={S.navItem}>
          <Text style={[S.navLabel, { color: '#00695c', fontWeight: '600' }]}>Accueil</Text>
        </TouchableOpacity>
        <TouchableOpacity style={S.navItem} onPress={() => navigation.navigate('Observations')}>
          <Text style={S.navLabel}>Observations</Text>
        </TouchableOpacity>
        <TouchableOpacity style={S.navItem} onPress={() => navigation.navigate('RendezVous')}>
          <Text style={S.navLabel}>Rendez-vous</Text>
        </TouchableOpacity>
        <TouchableOpacity style={S.navItem} onPress={() => navigation.navigate('Connexion')}>
          <Text style={S.navLabel}>Déco.</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const S = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f6f5' },
  loader:    { flex: 1, justifyContent: 'center', alignItems: 'center' },
  loaderT:   { marginTop: 12, color: '#00695c', fontSize: 14 },
  scroll:    { flex: 1 },

  topbar:   { backgroundColor: '#fff', paddingHorizontal: 16, paddingVertical: 13, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', borderBottomWidth: 0.5, borderBottomColor: '#d1d5db' },
  topTitre: { fontSize: 18, fontWeight: '600', color: '#111827' },
  topDate:  { fontSize: 11, color: '#6b7280', marginTop: 2 },
  avatar:   { width: 34, height: 34, borderRadius: 17, justifyContent: 'center', alignItems: 'center' },
  avatarT:  { color: '#fff', fontSize: 12, fontWeight: '600' },

  identite: { backgroundColor: '#fff', paddingHorizontal: 16, paddingVertical: 9, borderBottomWidth: 0.5, borderBottomColor: '#e5e7eb' },
  idNom:    { fontSize: 14, fontWeight: '500', color: '#111827' },
  idRole:   { fontSize: 11, color: '#6b7280', marginTop: 2 },

  statsGrid:     { flexDirection: 'row', paddingHorizontal: 10, paddingTop: 10, gap: 8 },
  stat:          { flex: 1, backgroundColor: '#fff', borderRadius: 10, padding: 11, borderWidth: 0.5, borderColor: '#e5e7eb', position: 'relative', overflow: 'hidden', elevation: 1 },
  statLabel:     { fontSize: 9, color: '#6b7280', fontWeight: '500', letterSpacing: 0.4, lineHeight: 13, textTransform: 'uppercase' },
  statVal:       { fontSize: 28, fontWeight: '400', marginTop: 3 },
  statCentreNom: { fontSize: 14, fontWeight: '500', color: '#111827', marginTop: 4 },
  statSub:       { fontSize: 10, color: '#9ca3af', marginTop: 2 },
  statIco:       { position: 'absolute', top: 9, right: 9, width: 28, height: 28, borderRadius: 7, justifyContent: 'center', alignItems: 'center' },
  statIcoE:      { fontSize: 14 },

  card:     { backgroundColor: '#fff', borderRadius: 12, padding: 13, marginHorizontal: 10, marginTop: 10, borderWidth: 0.5, borderColor: '#e5e7eb' },
  secHeadT: { fontSize: 10, fontWeight: '600', color: '#6b7280', letterSpacing: 0.5, textTransform: 'uppercase', marginBottom: 10 },

  tabsRow:  { flexDirection: 'row', gap: 8, marginBottom: 10 },
  tab:      { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20, borderWidth: 0.5, borderColor: '#d1d5db', backgroundColor: '#fff' },
  tabActif: { backgroundColor: '#00695c', borderColor: '#00695c' },
  tabRetard:{ backgroundColor: '#dc2626', borderColor: '#dc2626' },
  tabT:     { fontSize: 11, color: '#6b7280', fontWeight: '500' },
  tabActifT:{ color: '#fff', fontWeight: '600' },

  carteEnfant: { backgroundColor: '#fff', borderRadius: 10, padding: 11, marginBottom: 7, borderLeftWidth: 3, borderLeftColor: '#00695c', borderTopWidth: 0.5, borderTopColor: '#e5e7eb', borderRightWidth: 0.5, borderRightColor: '#e5e7eb', borderBottomWidth: 0.5, borderBottomColor: '#e5e7eb' },
  carteHead:   { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 3 },
  eNom:        { fontSize: 13, fontWeight: '500', color: '#111827', flex: 1 },
  eCode:       { fontSize: 10, color: '#9ca3af', marginBottom: 6 },
  eDate:       { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 8 },
  eDateT:      { fontSize: 11, color: '#6b7280' },
  eSep:        { height: 0.5, backgroundColor: '#e5e7eb', marginBottom: 7 },
  eGrid:       { flexDirection: 'row' },
  eCol:        { flex: 1 },
  eLabel:      { fontSize: 9, color: '#9ca3af', fontWeight: '500', letterSpacing: 0.3, textTransform: 'uppercase', marginBottom: 2 },
  eVal:        { fontSize: 11, color: '#374151' },
  eTel:        { fontSize: 11, color: '#00695c', fontWeight: '500' },

  chip:        { borderRadius: 20, paddingHorizontal: 8, paddingVertical: 2 },
  chipT:       { fontSize: 10, fontWeight: '500' },
  chipVaccin:  { backgroundColor: '#dbeafe', borderRadius: 20, paddingHorizontal: 8, paddingVertical: 2 },
  chipVaccinT: { fontSize: 10, fontWeight: '500', color: '#1d4ed8' },

  vide:  { alignItems: 'center', paddingVertical: 24 },
  videT: { color: '#9ca3af', fontSize: 13 },

  navbar:   { backgroundColor: '#fff', borderTopWidth: 0.5, borderTopColor: '#e5e7eb', flexDirection: 'row', paddingVertical: 9, paddingBottom: 10 },
  navItem:  { flex: 1, alignItems: 'center' },
  navLabel: { fontSize: 10, color: '#9ca3af' },
});