import React, { useState, useEffect } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, StyleSheet,
  SafeAreaView, StatusBar, RefreshControl, ActivityIndicator, Linking
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
import { API_URL } from './config';

// ─── Helpers ────────────────────────────────────────────────────────────────
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

// ─── Utilitaire : extraire un tableau depuis n'importe quelle réponse API ────
const extraireTableau = (response) => {
  if (!response) return [];
  const data = response.data ?? response;
  if (Array.isArray(data)) return data;
  if (data && Array.isArray(data.data)) return data.data;
  return [];
};

// ─── Chips ──────────────────────────────────────────────────────────────────
const ChipDelai = ({ dateStr }) => {
  const j = joursRestants(dateStr);
  if (j === null) return null;
  if (j < 0)   return <View style={[S.chip, S.chipR]}><Text style={S.chipRT}>{Math.abs(j)} jours de retard</Text></View>;
  if (j === 0) return <View style={[S.chip, S.chipA]}><Text style={S.chipAT}>Aujourd'hui</Text></View>;
  return <View style={[S.chip, S.chipV]}><Text style={S.chipVT}>Dans {j} jours</Text></View>;
};

const ChipVaccin = ({ nom }) => (
  <View style={S.chipVaccin}><Text style={S.chipVaccinT}>{nom}</Text></View>
);

// ─── Carte Enfant ────────────────────────────────────────────────────────────
const CarteEnfant = ({ enfant, enRetard }) => (
  <View style={[S.carteEnfant, enRetard && S.carteEnfantR]}>
    <View style={S.carteHead}>
      <Text style={S.nomEnfant}>{enfant.prenom} {enfant.nom}</Text>
      {enfant.prochain_vaccin?.vaccin && <ChipVaccin nom={enfant.prochain_vaccin.vaccin} />}
    </View>
    <Text style={S.ageCode}>{enfant.age_mois ? `${enfant.age_mois} mois` : '—'} · Code : {enfant.code || '—'}</Text>
    {enfant.prochain_vaccin?.date_prevue && (
      <View style={S.dateLigne}>
        <Text style={S.dateI}>📅</Text>
        <Text style={S.dateT}>{formatDateCourt(enfant.prochain_vaccin.date_prevue)}</Text>
        <ChipDelai dateStr={enfant.prochain_vaccin.date_prevue} />
      </View>
    )}
    <View style={S.sep} />
    <View style={S.parentsGrid}>
      <View style={S.pCol}><Text style={S.pLabel}>MÈRE</Text><Text style={S.pVal}>{enfant.mere_tuteur?.nom || 'Non renseigné'}</Text></View>
      {enfant.mere_tuteur?.telephone && (
        <View style={S.pCol}>
          <Text style={S.pLabel}>TÉL. MÈRE</Text>
          <TouchableOpacity onPress={() => Linking.openURL(`tel:${enfant.mere_tuteur.telephone}`)}>
            <Text style={S.pTel}>{enfant.mere_tuteur.telephone}</Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
    {enfant.mere_tuteur?.adresse && (
      <View style={{ marginTop: 4 }}>
        <Text style={S.pLabel}>ADRESSE</Text>
        <Text style={S.pVal}>{enfant.mere_tuteur.adresse}</Text>
      </View>
    )}
  </View>
);

// ─── Carte Validation ────────────────────────────────────────────────────────
const CarteValidation = ({ compte, onValider, onRefuser }) => (
  <View style={S.carteValid}>
    <View style={S.carteValidInfo}>
      <Text style={S.validNom}>{compte.prenom} {compte.nom}</Text>
      <Text style={S.validRole}>{compte.role === 'agent_sante' ? 'Agent de Santé' : 'Relais Communautaire'}</Text>
      <Text style={S.validCentre}>{compte.centre_sante?.nom || '—'}</Text>
    </View>
    <View style={S.validActions}>
      <TouchableOpacity style={S.btnValider} onPress={() => onValider(compte.id)}>
        <Text style={S.btnValiderT}>✓ Valider</Text>
      </TouchableOpacity>
      <TouchableOpacity style={S.btnRefuser} onPress={() => onRefuser(compte.id)}>
        <Text style={S.btnRefuserT}>✗</Text>
      </TouchableOpacity>
    </View>
  </View>
);

// ─── Barre couverture ────────────────────────────────────────────────────────
const BarreCouverture = ({ vaccin, age, pct }) => {
  const c = pct >= 90 ? '#16a34a' : pct >= 70 ? '#d97706' : '#dc2626';
  return (
    <View style={S.barreLigne}>
      <View style={S.barreG}><Text style={S.barreNom}>{vaccin}</Text><Text style={S.barreAge}>{age}</Text></View>
      <View style={S.barreM}><View style={S.barreBg}><View style={[S.barreF, { width: `${pct}%`, backgroundColor: c }]} /></View></View>
      <Text style={[S.barrePct, { color: c }]}>{pct}%</Text>
    </View>
  );
};

// ─── Main ────────────────────────────────────────────────────────────────────
export default function DashboardResponsable({ navigation }) {
  const [loading, setLoading]             = useState(true);
  const [refreshing, setRefreshing]       = useState(false);
  const [responsable, setResponsable]     = useState(null);
  const [stats, setStats]                 = useState({
    enfants_enregistres: 0,
    vaccinations_ce_mois: 0,
    rdv_aujourd_hui: 0,
    enfants_en_retard: 0,
  });
  const [rdvsAVenir, setRdvsAVenir]       = useState([]);
  const [enfantsRetard, setEnfantsRetard] = useState([]);
  const [couverture, setCouverture]       = useState([]);
  const [validations, setValidations]     = useState([]);
  const [onglet, setOnglet]               = useState('rdv');

  const charger = async () => {
    try {
      const token = await AsyncStorage.getItem('token');
      const h = { Authorization: `Bearer ${token}` };
      const [p, st, rdv, ret, cov, val] = await Promise.all([
        axios.get(`${API_URL}/profil`, { headers: h }),
        axios.get(`${API_URL}/responsable/stats`, { headers: h }),
        axios.get(`${API_URL}/responsable/enfants/rdv-a-venir`, { headers: h }),
        axios.get(`${API_URL}/responsable/enfants/en-retard`, { headers: h }),
        axios.get(`${API_URL}/responsable/couverture-vaccinale`, { headers: h }),
        axios.get(`${API_URL}/responsable/validations/en-attente`, { headers: h }),
      ]);

      setResponsable(p.data?.user || p.data);
      setStats(st.data || {
        enfants_enregistres: 0,
        vaccinations_ce_mois: 0,
        rdv_aujourd_hui: 0,
        enfants_en_retard: 0,
      });

      // ✅ Extraction sécurisée
      setRdvsAVenir(extraireTableau(rdv));
      setEnfantsRetard(extraireTableau(ret));
      setCouverture(extraireTableau(cov));
      setValidations(extraireTableau(val));

    } catch (e) {
      console.error('Erreur DashboardResponsable:', e?.response?.data || e.message);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => { charger(); }, []);
  const onRefresh = () => { setRefreshing(true); charger(); };

  const validerCompte = async (id) => {
    try {
      const token = await AsyncStorage.getItem('token');
      // ✅ CORRIGÉ : suppression du /api en double
      await axios.post(
        `${API_URL}/responsable/validations/${id}/valider`, {},
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setValidations(v => (Array.isArray(v) ? v : []).filter(c => c.id !== id));
    } catch (e) {
      console.error('Erreur validation:', e?.response?.data || e.message);
    }
  };

  const refuserCompte = async (id) => {
    try {
      const token = await AsyncStorage.getItem('token');
      // ✅ CORRIGÉ : suppression du /api en double
      await axios.post(
        `${API_URL}/responsable/validations/${id}/refuser`, {},
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setValidations(v => (Array.isArray(v) ? v : []).filter(c => c.id !== id));
    } catch (e) {
      console.error('Erreur refus:', e?.response?.data || e.message);
    }
  };

  if (loading) return (
    <View style={S.loader}>
      <ActivityIndicator size="large" color="#065f46" />
      <Text style={S.loaderT}>Chargement…</Text>
    </View>
  );

  // ✅ Garde défensive avant le .map()
  const liste = onglet === 'rdv'
    ? (Array.isArray(rdvsAVenir) ? rdvsAVenir : [])
    : (Array.isArray(enfantsRetard) ? enfantsRetard : []);

  return (
    <SafeAreaView style={S.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#fff" />

      {/* Topbar */}
      <View style={S.topbar}>
        <View>
          <Text style={S.topTitre}>Tableau de bord</Text>
          <Text style={S.topDate}>
            {new Date().toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
          </Text>
        </View>
        {/* ✅ CORRIGÉ : Connexion au lieu de Login */}
        <TouchableOpacity style={S.avatar} onPress={() => navigation.navigate('Connexion')}>
          <Text style={S.avatarT}>{responsable?.prenom?.charAt(0)}{responsable?.nom?.charAt(0)}</Text>
        </TouchableOpacity>
      </View>

      {/* Identité */}
      <View style={S.identite}>
        <Text style={S.identiteNom}>{responsable?.prenom} {responsable?.nom}</Text>
        <Text style={S.identiteRole}>Responsable PEV · {responsable?.centre_sante?.nom || '—'}</Text>
      </View>

      <ScrollView
        style={S.scroll}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#065f46']} />}
      >
        {/* Stats 2×2 */}
        <View style={S.statsRow}>
          <View style={S.statCard}>
            <Text style={S.statL}>ENFANTS{'\n'}ENREGISTRÉS</Text>
            <Text style={S.statV}>{stats.enfants_enregistres ?? 0}</Text>
            <Text style={S.statS}>Dans votre centre</Text>
            <TouchableOpacity onPress={() => navigation.navigate('ListeEnfants')}>
              <Text style={S.statLien}>Voir la liste →</Text>
            </TouchableOpacity>
            <View style={[S.statIB, { backgroundColor: '#d1fae5' }]}><Text style={S.statI}>👶</Text></View>
          </View>
          <View style={S.statCard}>
            <Text style={S.statL}>VACCINATIONS{'\n'}CE MOIS</Text>
            <Text style={S.statV}>{stats.vaccinations_ce_mois ?? 0}</Text>
            <Text style={S.statS}>{moisActuel()}</Text>
            <TouchableOpacity onPress={() => navigation.navigate('Vaccinations')}>
              <Text style={S.statLien}>Voir le détail →</Text>
            </TouchableOpacity>
            <View style={[S.statIB, { backgroundColor: '#dbeafe' }]}><Text style={S.statI}>💉</Text></View>
          </View>
        </View>
        <View style={S.statsRow}>
          <View style={S.statCard}>
            <Text style={S.statL}>RDV{'\n'}AUJOURD'HUI</Text>
            <Text style={S.statV}>{stats.rdv_aujourd_hui ?? 0}</Text>
            <Text style={S.statS}>Rendez-vous planifiés</Text>
            <View style={[S.statIB, { backgroundColor: '#fef3c7' }]}><Text style={S.statI}>📅</Text></View>
          </View>
          <View style={S.statCard}>
            <Text style={S.statL}>ENFANTS{'\n'}EN RETARD</Text>
            <Text style={[S.statV, { color: '#dc2626' }]}>{stats.enfants_en_retard ?? 0}</Text>
            <Text style={S.statS}>Vaccination non effectuée</Text>
            {(stats.enfants_en_retard ?? 0) > 0 && (
              <View style={S.critBadge}><Text style={S.critT}>● Action requise</Text></View>
            )}
            <View style={[S.statIB, { backgroundColor: '#fee2e2' }]}><Text style={S.statI}>⚠️</Text></View>
          </View>
        </View>

        {/* Validations en attente */}
        {Array.isArray(validations) && validations.length > 0 && (
          <View style={S.section}>
            <View style={S.secTRow}>
              <Text style={S.secI}>✓</Text>
              <Text style={S.secT}>VALIDATIONS EN ATTENTE</Text>
              <View style={S.badgeCount}><Text style={S.badgeCountT}>{validations.length}</Text></View>
            </View>
            {validations.map((c, i) => (
              <CarteValidation key={i} compte={c} onValider={validerCompte} onRefuser={refuserCompte} />
            ))}
          </View>
        )}

        {/* Suivi enfants */}
        <View style={S.section}>
          <View style={S.secTRow}>
            <Text style={S.secI}>👤</Text>
            <Text style={S.secT}>SUIVI DES ENFANTS</Text>
          </View>
          <View style={S.ongletsRow}>
            <TouchableOpacity
              style={[S.ongletBtn, onglet === 'rdv' && S.ongActif]}
              onPress={() => setOnglet('rdv')}
            >
              <Text style={[S.ongT, onglet === 'rdv' && S.ongTA]}>
                📅 RDV à venir  {rdvsAVenir.length}
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[S.ongletBtn, onglet === 'retard' && S.ongRetActif]}
              onPress={() => setOnglet('retard')}
            >
              <Text style={[S.ongT, onglet === 'retard' && S.ongTA]}>
                ⚠️ En retard  {enfantsRetard.length}
              </Text>
            </TouchableOpacity>
          </View>
          {liste.length === 0
            ? <View style={S.vide}><Text style={S.videT}>{onglet === 'rdv' ? 'Aucun rendez-vous à venir' : 'Aucun enfant en retard 🎉'}</Text></View>
            : liste.map((e, i) => <CarteEnfant key={i} enfant={e} enRetard={onglet === 'retard'} />)
          }
        </View>

        {/* Couverture vaccinale */}
        {Array.isArray(couverture) && couverture.length > 0 && (
          <View style={S.section}>
            <View style={S.secTRow}>
              <Text style={S.secI}>🛡️</Text>
              <Text style={S.secT}>COUVERTURE VACCINALE</Text>
            </View>
            <View style={S.couvCard}>
              <Text style={S.couvTitre}>Vaccins clés — Calendrier PEV</Text>
              <Text style={S.couvSub}>{responsable?.centre_sante?.nom || 'Votre centre'}</Text>
              <View style={{ marginTop: 12 }}>
                {couverture.map((item, i) => (
                  <BarreCouverture key={i} vaccin={item.vaccin} age={item.age_cible} pct={item.taux || 0} />
                ))}
              </View>
              <View style={S.legende}>
                {[
                  ['#16a34a', '≥ 90% — Bonne couverture'],
                  ['#d97706', '70–89% — À améliorer'],
                  ['#dc2626', '< 70% — Critique'],
                ].map(([c, t], i) => (
                  <View key={i} style={S.legItem}>
                    <View style={[S.legDot, { backgroundColor: c }]} />
                    <Text style={S.legT}>{t}</Text>
                  </View>
                ))}
              </View>
            </View>
          </View>
        )}

        <View style={{ height: 40 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

// ─── Styles ──────────────────────────────────────────────────────────────────
const VERT = '#065f46';
const S = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f9fafb' },
  loader:    { flex: 1, justifyContent: 'center', alignItems: 'center' },
  loaderT:   { marginTop: 12, color: VERT, fontSize: 14 },
  scroll:    { flex: 1 },

  topbar:   { backgroundColor: '#fff', paddingHorizontal: 20, paddingVertical: 14, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', borderBottomWidth: 1, borderBottomColor: '#e5e7eb' },
  topTitre: { fontSize: 20, fontWeight: '700', color: '#111827' },
  topDate:  { fontSize: 12, color: '#6b7280', marginTop: 2 },
  avatar:   { width: 38, height: 38, borderRadius: 19, backgroundColor: VERT, justifyContent: 'center', alignItems: 'center' },
  avatarT:  { color: '#fff', fontSize: 13, fontWeight: '700' },

  identite:     { backgroundColor: '#fff', paddingHorizontal: 20, paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: '#f3f4f6' },
  identiteNom:  { fontSize: 15, fontWeight: '600', color: '#111827' },
  identiteRole: { fontSize: 12, color: '#6b7280', marginTop: 2 },

  statsRow: { flexDirection: 'row', paddingHorizontal: 12, paddingTop: 12, gap: 10 },
  statCard: { flex: 1, backgroundColor: '#fff', borderRadius: 14, padding: 14, position: 'relative', overflow: 'hidden', shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 6, elevation: 2 },
  statL:    { fontSize: 10, color: '#6b7280', fontWeight: '600', lineHeight: 14, letterSpacing: 0.3 },
  statV:    { fontSize: 32, fontWeight: '800', color: '#111827', marginTop: 4 },
  statS:    { fontSize: 11, color: '#9ca3af', marginTop: 2 },
  statLien: { fontSize: 11, color: VERT, fontWeight: '600', marginTop: 6 },
  statIB:   { position: 'absolute', top: 12, right: 12, width: 36, height: 36, borderRadius: 10, justifyContent: 'center', alignItems: 'center' },
  statI:    { fontSize: 18 },
  critBadge: { marginTop: 6, backgroundColor: '#dc2626', borderRadius: 10, paddingHorizontal: 8, paddingVertical: 3, alignSelf: 'flex-start' },
  critT:     { color: '#fff', fontSize: 10, fontWeight: '700' },

  section:    { paddingHorizontal: 12, marginTop: 16 },
  secTRow:    { flexDirection: 'row', alignItems: 'center', marginBottom: 12 },
  secI:       { fontSize: 14, marginRight: 6 },
  secT:       { fontSize: 12, fontWeight: '700', color: '#6b7280', letterSpacing: 0.5 },
  badgeCount: { marginLeft: 8, backgroundColor: '#dc2626', borderRadius: 10, paddingHorizontal: 7, paddingVertical: 2 },
  badgeCountT:{ color: '#fff', fontSize: 11, fontWeight: '700' },

  carteValid:     { backgroundColor: '#fff', borderRadius: 12, padding: 14, marginBottom: 8, flexDirection: 'row', alignItems: 'center', borderLeftWidth: 3, borderLeftColor: '#f59e0b', shadowColor: '#000', shadowOpacity: 0.04, elevation: 1 },
  carteValidInfo: { flex: 1 },
  validNom:       { fontSize: 14, fontWeight: '700', color: '#111827' },
  validRole:      { fontSize: 12, color: '#6b7280', marginTop: 2 },
  validCentre:    { fontSize: 11, color: '#9ca3af', marginTop: 1 },
  validActions:   { flexDirection: 'row', gap: 8, alignItems: 'center' },
  btnValider:     { backgroundColor: VERT, borderRadius: 8, paddingHorizontal: 12, paddingVertical: 7 },
  btnValiderT:    { color: '#fff', fontSize: 12, fontWeight: '700' },
  btnRefuser:     { backgroundColor: '#fee2e2', borderRadius: 8, paddingHorizontal: 10, paddingVertical: 7 },
  btnRefuserT:    { color: '#dc2626', fontSize: 14, fontWeight: '700' },

  ongletsRow:  { flexDirection: 'row', gap: 10, marginBottom: 12 },
  ongletBtn:   { paddingHorizontal: 16, paddingVertical: 10, borderRadius: 20, borderWidth: 1, borderColor: '#d1d5db', backgroundColor: '#fff' },
  ongActif:    { backgroundColor: VERT, borderColor: VERT },
  ongRetActif: { backgroundColor: '#dc2626', borderColor: '#dc2626' },
  ongT:        { fontSize: 13, color: '#374151', fontWeight: '500' },
  ongTA:       { color: '#fff', fontWeight: '700' },

  carteEnfant:  { backgroundColor: '#fff', borderRadius: 14, padding: 16, marginBottom: 10, borderLeftWidth: 3, borderLeftColor: VERT, shadowColor: '#000', shadowOpacity: 0.04, elevation: 1 },
  carteEnfantR: { borderLeftColor: '#dc2626' },
  carteHead:    { flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap', gap: 8, marginBottom: 4 },
  nomEnfant:    { fontSize: 16, fontWeight: '700', color: '#111827' },
  ageCode:      { fontSize: 12, color: '#6b7280', marginBottom: 8 },
  dateLigne:    { flexDirection: 'row', alignItems: 'center', marginBottom: 10, gap: 6 },
  dateI:        { fontSize: 13 },
  dateT:        { fontSize: 13, color: '#374151' },
  sep:          { height: 1, backgroundColor: '#f3f4f6', marginBottom: 10 },
  parentsGrid:  { flexDirection: 'row', marginBottom: 6 },
  pCol:         { flex: 1 },
  pLabel:       { fontSize: 10, color: '#9ca3af', fontWeight: '600', letterSpacing: 0.3, marginBottom: 2 },
  pVal:         { fontSize: 13, color: '#374151' },
  pTel:         { fontSize: 13, color: VERT, fontWeight: '600' },

  chip:    { borderRadius: 10, paddingHorizontal: 8, paddingVertical: 3 },
  chipV:   { backgroundColor: '#d1fae5' }, chipVT: { fontSize: 11, color: VERT, fontWeight: '600' },
  chipR:   { backgroundColor: '#fee2e2' }, chipRT: { fontSize: 11, color: '#dc2626', fontWeight: '600' },
  chipA:   { backgroundColor: '#fef3c7' }, chipAT: { fontSize: 11, color: '#92400e', fontWeight: '600' },
  chipVaccin:  { backgroundColor: '#f0fdf4', borderWidth: 1, borderColor: '#86efac', borderRadius: 6, paddingHorizontal: 7, paddingVertical: 2 },
  chipVaccinT: { fontSize: 11, color: VERT, fontWeight: '600' },

  vide:  { alignItems: 'center', paddingVertical: 30 },
  videT: { color: '#9ca3af', fontSize: 14 },

  couvCard:   { backgroundColor: '#fff', borderRadius: 14, padding: 16, shadowColor: '#000', shadowOpacity: 0.04, elevation: 1 },
  couvTitre:  { fontSize: 15, fontWeight: '700', color: '#111827' },
  couvSub:    { fontSize: 12, color: '#6b7280', marginTop: 2 },
  barreLigne: { flexDirection: 'row', alignItems: 'center', marginBottom: 12 },
  barreG:     { width: 80 },
  barreNom:   { fontSize: 13, fontWeight: '600', color: '#111827' },
  barreAge:   { fontSize: 10, color: '#9ca3af' },
  barreM:     { flex: 1, marginHorizontal: 10 },
  barreBg:    { height: 8, backgroundColor: '#f3f4f6', borderRadius: 4, overflow: 'hidden' },
  barreF:     { height: '100%', borderRadius: 4 },
  barrePct:   { fontSize: 13, fontWeight: '700', width: 40, textAlign: 'right' },
  legende:    { marginTop: 12, paddingTop: 12, borderTopWidth: 1, borderTopColor: '#f3f4f6', gap: 4 },
  legItem:    { flexDirection: 'row', alignItems: 'center', gap: 6 },
  legDot:     { width: 8, height: 8, borderRadius: 4 },
  legT:       { fontSize: 11, color: '#6b7280' },
});