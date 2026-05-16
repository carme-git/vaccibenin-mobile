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

const moisActuel = () =>
  new Date().toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' });

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
  if (j < 0)  return <View style={[styles.chip, styles.chipR]}><Text style={styles.chipRT}>{Math.abs(j)} jours de retard</Text></View>;
  if (j === 0) return <View style={[styles.chip, styles.chipA]}><Text style={styles.chipAT}>Aujourd'hui</Text></View>;
  return <View style={[styles.chip, styles.chipV]}><Text style={styles.chipVT}>Dans {j} jours</Text></View>;
};

const ChipVaccin = ({ nom }) => (
  <View style={styles.chipVaccin}><Text style={styles.chipVaccinT}>{nom}</Text></View>
);

const CarteEnfant = ({ enfant, enRetard }) => (
  <View style={[styles.carteEnfant, enRetard && styles.carteEnfantR]}>
    <View style={styles.carteHead}>
      <Text style={styles.nomEnfant}>{enfant.prenom} {enfant.nom}</Text>
      {enfant.prochain_vaccin?.vaccin && <ChipVaccin nom={enfant.prochain_vaccin.vaccin} />}
    </View>
    <Text style={styles.ageCode}>{enfant.age_mois ? `${enfant.age_mois} mois` : '—'} · Code : {enfant.code || '—'}</Text>
    {enfant.prochain_vaccin?.date_prevue && (
      <View style={styles.dateLigne}>
        <Text style={styles.dateIcone}>📅</Text>
        <Text style={styles.dateTexte}>{formatDateCourt(enfant.prochain_vaccin.date_prevue)}</Text>
        <ChipDelai dateStr={enfant.prochain_vaccin.date_prevue} />
      </View>
    )}
    <View style={styles.sep} />
    <View style={styles.parentsGrid}>
      <View style={styles.pCol}>
        <Text style={styles.pLabel}>MÈRE</Text>
        <Text style={styles.pVal}>{enfant.mere_tuteur?.nom || 'Non renseigné'}</Text>
      </View>
      {enfant.mere_tuteur?.telephone && (
        <View style={styles.pCol}>
          <Text style={styles.pLabel}>TÉL. MÈRE</Text>
          <TouchableOpacity onPress={() => Linking.openURL(`tel:${enfant.mere_tuteur.telephone}`)}>
            <Text style={styles.pTel}>{enfant.mere_tuteur.telephone}</Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
    <View style={styles.parentsGrid}>
      <View style={styles.pCol}>
        <Text style={styles.pLabel}>PÈRE</Text>
        <Text style={styles.pVal}>{enfant.pere?.nom || 'Non renseigné'}</Text>
      </View>
      {enfant.pere?.telephone && (
        <View style={styles.pCol}>
          <Text style={styles.pLabel}>TÉL. PÈRE</Text>
          <Text style={styles.pVal}>{enfant.pere.telephone}</Text>
        </View>
      )}
    </View>
    {enfant.mere_tuteur?.adresse && (
      <View style={{ marginTop: 4 }}>
        <Text style={styles.pLabel}>ADRESSE / LOCALISATION</Text>
        <Text style={styles.pVal}>{enfant.mere_tuteur.adresse}</Text>
      </View>
    )}
  </View>
);

const BarreCouverture = ({ vaccin, age, pct }) => {
  const c = pct >= 90 ? '#16a34a' : pct >= 70 ? '#d97706' : '#dc2626';
  return (
    <View style={styles.barreLigne}>
      <View style={styles.barreG}><Text style={styles.barreNom}>{vaccin}</Text><Text style={styles.barreAge}>{age}</Text></View>
      <View style={styles.barreM}>
        <View style={styles.barreBg}><View style={[styles.barreF, { width: `${pct}%`, backgroundColor: c }]} /></View>
      </View>
      <Text style={[styles.barrePct, { color: c }]}>{pct}%</Text>
    </View>
  );
};

export default function DashboardAgent({ navigation }) {
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [agent, setAgent] = useState(null);
  const [stats, setStats] = useState({ vaccinations_aujourd_hui: 0, rdv_aujourd_hui: 0, enfants_en_retard: 0, vaccinations_ce_mois: 0 });
  const [rdvsAVenir, setRdvsAVenir] = useState([]);
  const [enfantsRetard, setEnfantsRetard] = useState([]);
  const [couverture, setCouverture] = useState([]);
  const [onglet, setOnglet] = useState('rdv');

  const charger = async () => {
    try {
      const token = await AsyncStorage.getItem('token');
      const h = { Authorization: `Bearer ${token}` };
      const [p, st, rdv, ret, cov] = await Promise.all([
        axios.get(`${API_URL}/profil`, { headers: h }),
        axios.get(`${API_URL}/agent/stats`, { headers: h }),
        axios.get(`${API_URL}/agent/enfants/rdv-a-venir`, { headers: h }),
        axios.get(`${API_URL}/agent/enfants/en-retard`, { headers: h }),
        axios.get(`${API_URL}/agent/couverture-vaccinale`, { headers: h }),
      ]);
      setAgent(p.data?.user || p.data);
      setStats(st.data || { vaccinations_aujourd_hui: 0, rdv_aujourd_hui: 0, enfants_en_retard: 0, vaccinations_ce_mois: 0 });
      setRdvsAVenir(extraireTableau(rdv));
      setEnfantsRetard(extraireTableau(ret));
      setCouverture(extraireTableau(cov));
    } catch (e) {
      console.error('Erreur DashboardAgent:', e?.response?.data || e.message);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => { charger(); }, []);
  const onRefresh = () => { setRefreshing(true); charger(); };

  if (loading) return (
    <View style={styles.loader}>
      <ActivityIndicator size="large" color="#065f46" />
      <Text style={styles.loaderT}>Chargement…</Text>
    </View>
  );

  const liste = onglet === 'rdv'
    ? (Array.isArray(rdvsAVenir) ? rdvsAVenir : [])
    : (Array.isArray(enfantsRetard) ? enfantsRetard : []);

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#fff" />
      
      <View style={styles.topbar}>
        <View>
          <Text style={styles.topTitre}>Tableau de bord</Text>
          <Text style={styles.topDate}>Vendredi 15 mai 2026</Text>
        </View>
        <TouchableOpacity style={styles.avatar} onPress={() => navigation.navigate('Connexion')}>
          <Text style={styles.avatarT}>{agent?.prenom?.charAt(0)}{agent?.nom?.charAt(0)}</Text>
        </TouchableOpacity>
      </View>
      
      <View style={styles.identite}>
        <Text style={styles.identiteNom}>{agent?.prenom} {agent?.nom}</Text>
        <Text style={styles.identiteRole}>Agent de Santé · {agent?.centre_sante?.nom || '—'}</Text>
      </View>
      
      <ScrollView style={styles.scroll} showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#065f46']} />}>
        
        <View style={styles.statsRow}>
          <View style={styles.statCard}>
            <Text style={styles.statL}>Vaccinations{'\n'}aujourd'hui</Text>
            <Text style={styles.statV}>{stats.vaccinations_aujourd_hui ?? 0}</Text>
            <Text style={styles.statS}>Effectuées par vous</Text>
            <TouchableOpacity onPress={() => navigation.navigate('MarquerVaccination')}>
              <Text style={styles.statLien}>Saisir →</Text>
            </TouchableOpacity>
            <View style={[styles.statIB, { backgroundColor: '#dbeafe' }]}><Text style={styles.statI}>💉</Text></View>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statL}>RDV{'\n'}aujourd'hui</Text>
            <Text style={styles.statV}>{stats.rdv_aujourd_hui ?? 0}</Text>
            <Text style={styles.statS}>Dans votre centre</Text>
            <View style={[styles.statIB, { backgroundColor: '#fef3c7' }]}><Text style={styles.statI}>📅</Text></View>
          </View>
        </View>
        
        <View style={styles.statsRow}>
          <View style={styles.statCard}>
            <Text style={styles.statL}>Enfants{'\n'}en retard</Text>
            <Text style={[styles.statV, { color: '#dc2626' }]}>{stats.enfants_en_retard ?? 0}</Text>
            <Text style={styles.statS}>Vaccination non effectuée</Text>
            {(stats.enfants_en_retard ?? 0) > 0 && (
              <View style={styles.critBadge}><Text style={styles.critT}>● Critique</Text></View>
            )}
            <View style={[styles.statIB, { backgroundColor: '#fee2e2' }]}><Text style={styles.statI}>⚠️</Text></View>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statL}>Vaccinations{'\n'}ce mois</Text>
            <Text style={styles.statV}>{stats.vaccinations_ce_mois ?? 0}</Text>
            <Text style={styles.statS}>{moisActuel()}</Text>
            <View style={[styles.statIB, { backgroundColor: '#d1fae5' }]}><Text style={styles.statI}>📊</Text></View>
          </View>
        </View>

        <View style={styles.section}>
          <View style={styles.secTRow}>
            <Text style={styles.secI}>👤</Text>
            <Text style={styles.secT}>SUIVI DES ENFANTS</Text>
          </View>
          <View style={styles.ongletsRow}>
            <TouchableOpacity style={[styles.ongletBtn, onglet === 'rdv' && styles.ongActif]} onPress={() => setOnglet('rdv')}>
              <Text style={[styles.ongT, onglet === 'rdv' && styles.ongTA]}>📅 RDV à venir  {rdvsAVenir.length}</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.ongletBtn, onglet === 'retard' && styles.ongRetActif]} onPress={() => setOnglet('retard')}>
              <Text style={[styles.ongT, onglet === 'retard' && styles.ongTA]}>⚠️ En retard  {enfantsRetard.length}</Text>
            </TouchableOpacity>
          </View>
          {liste.length === 0
            ? <View style={styles.vide}><Text style={styles.videT}>{onglet === 'rdv' ? 'Aucun rendez-vous à venir' : 'Aucun enfant en retard 🎉'}</Text></View>
            : liste.map((e, i) => <CarteEnfant key={i} enfant={e} enRetard={onglet === 'retard'} />)
          }
        </View>

        {couverture.length > 0 && (
          <View style={styles.section}>
            <View style={styles.secTRow}>
              <Text style={styles.secI}>🛡️</Text>
              <Text style={styles.secT}>COUVERTURE VACCINALE</Text>
            </View>
            <View style={styles.couvCard}>
              <Text style={styles.couvTitre}>Vaccins clés — Calendrier PEV</Text>
              <Text style={styles.couvSub}>{agent?.centre_sante?.nom || 'Centre de Gbégamey'}</Text>
              <View style={{ marginTop: 12 }}>
                {couverture.map((item, i) => <BarreCouverture key={i} vaccin={item.vaccin} age={item.age_cible} pct={item.taux || 0} />)}
              </View>
              <View style={styles.legende}>
                <View style={styles.legItem}><View style={[styles.legDot, { backgroundColor: '#16a34a' }]} /><Text style={styles.legT}>≥ 90% — Bonne couverture</Text></View>
                <View style={styles.legItem}><View style={[styles.legDot, { backgroundColor: '#d97706' }]} /><Text style={styles.legT}>70–89% — À améliorer</Text></View>
                <View style={styles.legItem}><View style={[styles.legDot, { backgroundColor: '#dc2626' }]} /><Text style={styles.legT}>&lt; 70% — Critique</Text></View>
              </View>
            </View>
          </View>
        )}

        <View style={styles.section}>
          <TouchableOpacity style={[styles.actionBtn, { backgroundColor: '#065f46', marginBottom: 10 }]} onPress={() => navigation.navigate('EnregistrerEnfant')}>
            <Text style={styles.actionT}>+ Enregistrer un enfant</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.actionBtn, { backgroundColor: '#1565c0' }]} onPress={() => navigation.navigate('MarquerVaccination')}>
            <Text style={styles.actionT}>💉 Saisir une vaccination</Text>
          </TouchableOpacity>
        </View>
        
        <View style={{ height: 40 }} />
      </ScrollView>

      <View style={styles.navbar}>
        <TouchableOpacity style={[styles.navItem, styles.navItemActif]}>
          <Text style={styles.navIcon}>🏠</Text>
          <Text style={[styles.navLabel, styles.navLabelActif]}>Accueil</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.navItem} onPress={() => navigation.navigate('ListeEnfants')}>
          <Text style={styles.navIcon}>👥</Text>
          <Text style={styles.navLabel}>Enfants</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.navItem} onPress={() => navigation.navigate('MarquerVaccination')}>
          <Text style={styles.navIcon}>💉</Text>
          <Text style={styles.navLabel}>Vacciner</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.navItem} onPress={() => navigation.navigate('Connexion')}>
          <Text style={styles.navIcon}>↩️</Text>
          <Text style={styles.navLabel}>Déco.</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f9fafb' },
  loader: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  loaderT: { marginTop: 12, color: '#065f46', fontSize: 14 },
  scroll: { flex: 1 },
  topbar: { backgroundColor: '#fff', paddingHorizontal: 20, paddingVertical: 14, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', borderBottomWidth: 1, borderBottomColor: '#e5e7eb' },
  topTitre: { fontSize: 20, fontWeight: '700', color: '#111827' },
  topDate: { fontSize: 12, color: '#6b7280', marginTop: 2 },
  avatar: { width: 38, height: 38, borderRadius: 19, backgroundColor: '#065f46', justifyContent: 'center', alignItems: 'center' },
  avatarT: { color: '#fff', fontSize: 13, fontWeight: '700' },
  identite: { backgroundColor: '#fff', paddingHorizontal: 20, paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: '#f3f4f6' },
  identiteNom: { fontSize: 15, fontWeight: '600', color: '#111827' },
  identiteRole: { fontSize: 12, color: '#6b7280', marginTop: 2 },
  statsRow: { flexDirection: 'row', paddingHorizontal: 12, paddingTop: 12, gap: 10 },
  statCard: { flex: 1, backgroundColor: '#fff', borderRadius: 14, padding: 14, position: 'relative', overflow: 'hidden', shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 6, elevation: 2 },
  statL: { fontSize: 10, color: '#6b7280', fontWeight: '600', lineHeight: 14, letterSpacing: 0.3 },
  statV: { fontSize: 32, fontWeight: '800', color: '#111827', marginTop: 4 },
  statS: { fontSize: 11, color: '#9ca3af', marginTop: 2 },
  statLien: { fontSize: 11, color: '#065f46', fontWeight: '600', marginTop: 6 },
  statIB: { position: 'absolute', top: 12, right: 12, width: 36, height: 36, borderRadius: 10, justifyContent: 'center', alignItems: 'center' },
  statI: { fontSize: 18 },
  critBadge: { marginTop: 6, backgroundColor: '#dc2626', borderRadius: 10, paddingHorizontal: 8, paddingVertical: 3, alignSelf: 'flex-start' },
  critT: { color: '#fff', fontSize: 10, fontWeight: '700' },
  section: { paddingHorizontal: 12, marginTop: 16 },
  secTRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 12 },
  secI: { fontSize: 14, marginRight: 6 },
  secT: { fontSize: 12, fontWeight: '700', color: '#6b7280', letterSpacing: 0.5 },
  ongletsRow: { flexDirection: 'row', gap: 10, marginBottom: 12 },
  ongletBtn: { paddingHorizontal: 16, paddingVertical: 10, borderRadius: 20, borderWidth: 1, borderColor: '#d1d5db', backgroundColor: '#fff' },
  ongActif: { backgroundColor: '#065f46', borderColor: '#065f46' },
  ongRetActif: { backgroundColor: '#dc2626', borderColor: '#dc2626' },
  ongT: { fontSize: 13, color: '#374151', fontWeight: '500' },
  ongTA: { color: '#fff', fontWeight: '700' },
  carteEnfant: { backgroundColor: '#fff', borderRadius: 14, padding: 16, marginBottom: 10, borderLeftWidth: 3, borderLeftColor: '#065f46', shadowColor: '#000', shadowOpacity: 0.04, elevation: 1 },
  carteEnfantR: { borderLeftColor: '#dc2626' },
  carteHead: { flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap', gap: 8, marginBottom: 4 },
  nomEnfant: { fontSize: 16, fontWeight: '700', color: '#111827' },
  ageCode: { fontSize: 12, color: '#6b7280', marginBottom: 8 },
  dateLigne: { flexDirection: 'row', alignItems: 'center', marginBottom: 10, gap: 6 },
  dateIcone: { fontSize: 13 },
  dateTexte: { fontSize: 13, color: '#374151' },
  sep: { height: 1, backgroundColor: '#f3f4f6', marginBottom: 10 },
  parentsGrid: { flexDirection: 'row', marginBottom: 6 },
  pCol: { flex: 1 },
  pLabel: { fontSize: 10, color: '#9ca3af', fontWeight: '600', letterSpacing: 0.3, marginBottom: 2 },
  pVal: { fontSize: 13, color: '#374151' },
  pTel: { fontSize: 13, color: '#065f46', fontWeight: '600' },
  chip: { borderRadius: 10, paddingHorizontal: 8, paddingVertical: 3 },
  chipV: { backgroundColor: '#d1fae5' }, chipVT: { fontSize: 11, color: '#065f46', fontWeight: '600' },
  chipR: { backgroundColor: '#fee2e2' }, chipRT: { fontSize: 11, color: '#dc2626', fontWeight: '600' },
  chipA: { backgroundColor: '#fef3c7' }, chipAT: { fontSize: 11, color: '#92400e', fontWeight: '600' },
  chipVaccin: { backgroundColor: '#f0fdf4', borderWidth: 1, borderColor: '#86efac', borderRadius: 6, paddingHorizontal: 7, paddingVertical: 2 },
  chipVaccinT: { fontSize: 11, color: '#065f46', fontWeight: '600' },
  vide: { alignItems: 'center', paddingVertical: 30 },
  videT: { color: '#9ca3af', fontSize: 14 },
  couvCard: { backgroundColor: '#fff', borderRadius: 14, padding: 16, shadowColor: '#000', shadowOpacity: 0.04, elevation: 1 },
  couvTitre: { fontSize: 15, fontWeight: '700', color: '#111827' },
  couvSub: { fontSize: 12, color: '#6b7280', marginTop: 2 },
  barreLigne: { flexDirection: 'row', alignItems: 'center', marginBottom: 12 },
  barreG: { width: 80 },
  barreNom: { fontSize: 13, fontWeight: '600', color: '#111827' },
  barreAge: { fontSize: 10, color: '#9ca3af' },
  barreM: { flex: 1, marginHorizontal: 10 },
  barreBg: { height: 8, backgroundColor: '#f3f4f6', borderRadius: 4, overflow: 'hidden' },
  barreF: { height: '100%', borderRadius: 4 },
  barrePct: { fontSize: 13, fontWeight: '700', width: 40, textAlign: 'right' },
  legende: { marginTop: 12, paddingTop: 12, borderTopWidth: 1, borderTopColor: '#f3f4f6', gap: 4 },
  legItem: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  legDot: { width: 8, height: 8, borderRadius: 4 },
  legT: { fontSize: 11, color: '#6b7280' },
  actionBtn: { borderRadius: 12, paddingVertical: 14, alignItems: 'center', shadowColor: '#000', shadowOpacity: 0.1, elevation: 2 },
  actionT: { color: '#fff', fontSize: 14, fontWeight: '600' },
  navbar: { backgroundColor: '#fff', borderTopWidth: 0.5, borderTopColor: '#e0e0e0', flexDirection: 'row', paddingVertical: 8, paddingBottom: 12 },
  navItem: { flex: 1, alignItems: 'center', gap: 2 },
  navItemActif: {},
  navIcon: { fontSize: 18 },
  navLabel: { fontSize: 10, color: '#bdbdbd' },
  navLabelActif: { color: '#065f46', fontWeight: '600' },
});