import React, { useState, useEffect, useRef } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, StyleSheet,
  SafeAreaView, StatusBar, RefreshControl, ActivityIndicator,
  Modal, Animated, Dimensions,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
import { API_URL } from './config';

const { width: SCREEN_W } = Dimensions.get('window');

// ─── Helpers ────────────────────────────────────────────────────────────────
const formatDate = (d) => {
  if (!d) return '—';
  const dt = new Date(d);
  if (isNaN(dt)) return d;
  return dt.toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' });
};
const formatDateCourt = (d) => {
  if (!d) return '—';
  const dt = new Date(d);
  if (isNaN(dt)) return d;
  return dt.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' });
};
const calculerAge = (dn) => {
  if (!dn) return '';
  const mois =
    (new Date().getFullYear() - new Date(dn).getFullYear()) * 12 +
    (new Date().getMonth() - new Date(dn).getMonth());
  if (mois < 1) return "< 1 mois";
  if (mois < 24) return `${mois} mois`;
  return `${Math.floor(mois / 12)} ans`;
};
const statutVaccin = (v) => {
  if (v.date_administration) return 'fait';
  if (!v.date_prevue) return 'a_venir';
  return new Date(v.date_prevue) < new Date() ? 'retard' : 'a_venir';
};
const extraireTableau = (res) => {
  if (!res) return [];
  const d = res.data ?? res;
  if (Array.isArray(d)) return d;
  if (d && Array.isArray(d.data)) return d.data;
  return [];
};

// ─── Initiales avatar ────────────────────────────────────────────────────────
const Initiales = ({ prenom = '', nom = '', size = 38, bg = '#065f46', color = '#fff', fontSize = 15 }) => (
  <View style={{ width: size, height: size, borderRadius: size / 2, backgroundColor: bg, justifyContent: 'center', alignItems: 'center' }}>
    <Text style={{ color, fontSize, fontWeight: '700', letterSpacing: 0.5 }}>
      {(prenom[0] ?? '').toUpperCase()}{(nom[0] ?? '').toUpperCase()}
    </Text>
  </View>
);

// ─── Modal déconnexion ───────────────────────────────────────────────────────
const ModalDeconnexion = ({ visible, onConfirm, onCancel }) => {
  const scale = useRef(new Animated.Value(0.85)).current;
  const opacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible) {
      Animated.parallel([
        Animated.spring(scale, { toValue: 1, useNativeDriver: true, tension: 120, friction: 8 }),
        Animated.timing(opacity, { toValue: 1, duration: 180, useNativeDriver: true }),
      ]).start();
    } else {
      scale.setValue(0.85);
      opacity.setValue(0);
    }
  }, [visible]);

  return (
    <Modal visible={visible} transparent animationType="none" onRequestClose={onCancel}>
      <Animated.View style={[S.modalOverlay, { opacity }]}>
        <Animated.View style={[S.modalCard, { transform: [{ scale }] }]}>
          {/* Icône */}
          <View style={S.modalIconBox}>
            <Text style={S.modalIconText}>⬡</Text>
            <View style={S.modalIconInner}>
              <Text style={{ fontSize: 22 }}>🚪</Text>
            </View>
          </View>
          <Text style={S.modalTitle}>Déconnexion</Text>
          <Text style={S.modalSub}>Voulez-vous vraiment quitter votre session VacciBénin ?</Text>
          <View style={S.modalBtns}>
            <TouchableOpacity style={S.modalBtnCancel} onPress={onCancel}>
              <Text style={S.modalBtnCancelT}>Annuler</Text>
            </TouchableOpacity>
            <TouchableOpacity style={S.modalBtnConfirm} onPress={onConfirm}>
              <Text style={S.modalBtnConfirmT}>Se déconnecter</Text>
            </TouchableOpacity>
          </View>
        </Animated.View>
      </Animated.View>
    </Modal>
  );
};

// ─── Composant principal ─────────────────────────────────────────────────────
export default function DashboardParent({ navigation }) {
  const [loading, setLoading]           = useState(true);
  const [refreshing, setRefreshing]     = useState(false);
  const [parent, setParent]             = useState(null);
  const [enfants, setEnfants]           = useState([]);
  const [enfantActif, setEnfantActif]   = useState(null);
  const [vaccins, setVaccins]           = useState([]);
  const [loadingVacc, setLoadingVacc]   = useState(false);
  const [showDecoModal, setShowDecoModal] = useState(false);

  const fadeAnim = useRef(new Animated.Value(0)).current;

  const chargerVaccins = async (enfantId, tokenParam) => {
    setLoadingVacc(true);
    try {
      const token      = tokenParam || await AsyncStorage.getItem('token');
      const typeUsers  = await AsyncStorage.getItem('type_users') ?? 'mere';
      const res = await axios.get(`${API_URL}/parent/enfants/${enfantId}/vaccinations`, {
        headers: { Authorization: `Bearer ${token}`, 'X-Type-Users': typeUsers },
      });
      const raw = extraireTableau(res);
      raw.sort((a, b) =>
        new Date(a.date_prevue || a.date_administration || 0) -
        new Date(b.date_prevue || b.date_administration || 0)
      );
      setVaccins(raw);
    } catch {
      setVaccins([]);
    } finally {
      setLoadingVacc(false);
    }
  };

  const charger = async () => {
    try {
      const token     = await AsyncStorage.getItem('token');
      const typeUsers = await AsyncStorage.getItem('type_users') ?? 'mere';
      const h = { Authorization: `Bearer ${token}`, 'X-Type-Users': typeUsers };

      const [profilRes, enfantsRes] = await Promise.all([
        axios.get(`${API_URL}/profil`,         { headers: h }),
        axios.get(`${API_URL}/parent/enfants`, { headers: h }),
      ]);
      setParent(profilRes.data?.user || profilRes.data);
      const liste = extraireTableau(enfantsRes);
      setEnfants(liste);
      if (liste.length > 0) {
        setEnfantActif(liste[0]);
        await chargerVaccins(liste[0].id, token);
      }
    } catch (e) {
      console.error('DashboardParent:', e?.response?.data || e.message);
    } finally {
      setLoading(false);
      setRefreshing(false);
      Animated.timing(fadeAnim, { toValue: 1, duration: 400, useNativeDriver: true }).start();
    }
  };

  const selectionnerEnfant = async (e) => {
    setEnfantActif(e);
    await chargerVaccins(e.id);
  };

  const confirmerDeconnexion = async () => {
    setShowDecoModal(false);
    await AsyncStorage.multiRemove(['token', 'type_users', 'user']);
    navigation.replace('Connexion');
  };

  useEffect(() => { charger(); }, []);
  const onRefresh = () => { setRefreshing(true); charger(); };

  // Stats vaccins
  const nbFaits        = vaccins.filter(v => v.date_administration).length;
  const nbTotal        = vaccins.length;
  const pctCouv        = nbTotal > 0 ? Math.round((nbFaits / nbTotal) * 100) : 0;
  const prochainVaccin = vaccins.find(v => !v.date_administration);
  const aUnRetard      = vaccins.some(v => statutVaccin(v) === 'retard');

  const barColor = pctCouv >= 90 ? '#065f46' : pctCouv >= 70 ? '#d97706' : '#dc2626';

  if (loading) return (
    <View style={S.loader}>
      <ActivityIndicator size="large" color="#065f46" />
      <Text style={S.loaderT}>Chargement…</Text>
    </View>
  );

  return (
    <SafeAreaView style={S.container}>
      <StatusBar barStyle="light-content" backgroundColor="#065f46" />
      <ModalDeconnexion
        visible={showDecoModal}
        onConfirm={confirmerDeconnexion}
        onCancel={() => setShowDecoModal(false)}
      />

      {/* ══════════════ HEADER ══════════════ */}
      <View style={S.header}>
        {/* Ligne du haut */}
        <View style={S.headerTop}>
          <View style={{ flex: 1 }}>
            <Text style={S.hdrGreeting}>Bonjour </Text>
            <Text style={S.hdrName}>
              {parent?.prenom ?? ''} {parent?.nom ?? ''}
            </Text>
          </View>
          <View style={S.hdrActions}>
            {/* Cloche notif */}
            <TouchableOpacity style={S.hdrBtn}>
              <Text style={S.hdrBtnIcon}>🔔</Text>
              <View style={S.notifDot} />
            </TouchableOpacity>
            {/* Avatar + menu déco */}
            <TouchableOpacity style={S.avatarBtn} onPress={() => setShowDecoModal(true)}>
              <Initiales prenom={parent?.prenom} nom={parent?.nom} size={36} bg="rgba(255,255,255,0.22)" color="#fff" fontSize={13} />
              <View style={S.avatarChevron}>
                <Text style={{ color: '#fff', fontSize: 8 }}>▼</Text>
              </View>
            </TouchableOpacity>
          </View>
        </View>

        {/* Chips enfants */}
        {enfants.length > 0 && (
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginTop: 12 }} contentContainerStyle={{ paddingRight: 6 }}>
            {enfants.map((e) => (
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
        )}
      </View>

      {/* ══════════════ CONTENU ══════════════ */}
      <Animated.View style={{ flex: 1, opacity: fadeAnim }}>
        <ScrollView
          style={S.scroll}
          showsVerticalScrollIndicator={false}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#065f46']} />}
        >
          {enfantActif ? (
            <>
              {/* ── Carte enfant ── */}
              <View style={S.card}>
                <View style={S.ficheHead}>
                  <View style={S.ficheAvatar}>
                    <Initiales
                      prenom={enfantActif.prenom}
                      nom={enfantActif.nom}
                      size={44}
                      bg="#ecfdf5"
                      color="#065f46"
                      fontSize={15}
                    />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={S.ficheNom}>{enfantActif.prenom} {enfantActif.nom}</Text>
                    <Text style={S.ficheMeta}>
                      {enfantActif.sexe === 'F' ? 'Née' : 'Né'} le {formatDate(enfantActif.date_naissance)}
                    </Text>
                    <Text style={S.ficheAge}>{calculerAge(enfantActif.date_naissance)}</Text>
                  </View>
                  <View style={[S.badgeStatut, aUnRetard ? S.badgeRetard : S.badgeOk]}>
                    <View style={[S.badgeDot, { backgroundColor: aUnRetard ? '#dc2626' : '#059669' }]} />
                    <Text style={[S.badgeStatutT, { color: aUnRetard ? '#dc2626' : '#059669' }]}>
                      {aUnRetard ? 'En retard' : 'À jour'}
                    </Text>
                  </View>
                </View>

                {/* Barre couverture */}
                <View style={S.progSection}>
                  <View style={S.progRow}>
                    <Text style={S.progLabel}>Couverture vaccinale</Text>
                    <Text style={[S.progPct, { color: barColor }]}>{pctCouv}%</Text>
                  </View>
                  <View style={S.progBg}>
                    <View style={[S.progFill, { width: `${pctCouv}%`, backgroundColor: barColor }]} />
                  </View>
                  <Text style={S.progSub}>{nbFaits} vaccin{nbFaits > 1 ? 's' : ''} administré{nbFaits > 1 ? 's' : ''} sur {nbTotal}</Text>
                </View>
              </View>

              {/* ── Prochain vaccin ── */}
              {prochainVaccin && (
                <View style={S.nextCard}>
                  <View style={S.nextLeft}>
                    <Text style={S.nextLabel}>Prochain vaccin</Text>
                    <Text style={S.nextNom}>
                      {prochainVaccin.vaccin || prochainVaccin.nom_vaccin || '—'}
                    </Text>
                    {prochainVaccin.date_prevue && (
                      <Text style={S.nextDate}>📅 {formatDate(prochainVaccin.date_prevue)}</Text>
                    )}
                  </View>
                  <View style={S.nextBadge}>
                    <Text style={S.nextBadgeT}>{calculerAge(enfantActif.date_naissance)}</Text>
                  </View>
                </View>
              )}

              {/* ── Actions rapides ── */}
              <View style={S.actionsRow}>
                <TouchableOpacity
                  style={[S.actionBtn, { backgroundColor: '#065f46' }]}
                  onPress={() => navigation.navigate('CarnetVaccinal', { enfantId: enfantActif.id, enfant: enfantActif })}
                >
                  <Text style={S.actionIcon}>📋</Text>
                  <Text style={S.actionBtnT}>Carnet vaccinal</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[S.actionBtn, { backgroundColor: '#0369a1' }]}
                  onPress={() => navigation.navigate('CentresProches')}
                >
                  <Text style={S.actionIcon}>📍</Text>
                  <Text style={S.actionBtnT}>Centre proche</Text>
                </TouchableOpacity>
              </View>

              {/* ── Carnet vaccinal ── */}
              <View style={[S.card, { marginTop: 8 }]}>
                <View style={S.secHead}>
                  <View style={S.secLine} />
                  <Text style={S.secHeadT}>CARNET VACCINAL  {enfantActif.prenom?.toUpperCase()}</Text>
                </View>

                {/* Légende */}
                <View style={S.legende}>
                  {[
                    { color: '#059669', bg: '#d1fae5', label: 'Fait' },
                    { color: '#dc2626', bg: '#fee2e2', label: 'En retard' },
                    { color: '#d97706', bg: '#fef3c7', label: 'À venir' },
                  ].map((l) => (
                    <View key={l.label} style={S.legendItem}>
                      <View style={[S.legendDot, { backgroundColor: l.color }]} />
                      <Text style={S.legendT}>{l.label}</Text>
                    </View>
                  ))}
                </View>

                {loadingVacc ? (
                  <View style={S.vide}><ActivityIndicator size="small" color="#065f46" /></View>
                ) : vaccins.length === 0 ? (
                  <View style={S.vide}><Text style={S.videT}>Aucune vaccination enregistrée</Text></View>
                ) : (
                  vaccins.map((v, i) => {
                    const statut    = statutVaccin(v);
                    const estFait   = statut === 'fait';
                    const estRetard = statut === 'retard';
                    const chipBg    = estFait ? '#d1fae5' : estRetard ? '#fee2e2' : '#fef3c7';
                    const chipColor = estFait ? '#059669' : estRetard ? '#dc2626' : '#d97706';
                    const bordureColor = estFait ? '#059669' : estRetard ? '#dc2626' : '#d97706';

                    return (
                      <View key={i} style={[
                        S.vaccinLigne,
                        { borderLeftColor: bordureColor },
                        i < vaccins.length - 1 && S.vaccinSep,
                      ]}>
                        <View style={{ flex: 1 }}>
                          <Text style={S.vaccinNom}>{v.vaccin || v.nom_vaccin || '—'}</Text>
                          <Text style={S.vaccinMeta}>
                            {estFait
                              ? `✓ Administré le ${formatDateCourt(v.date_administration)} · ${v.centre_sante?.nom ?? '—'}`
                              : estRetard
                              ? `⚠ En retard — prévu le ${formatDateCourt(v.date_prevue)}`
                              : `Prévu le ${formatDateCourt(v.date_prevue)}${v.age_cible ? ` · ${v.age_cible}` : ''}`}
                          </Text>
                        </View>
                        <View style={[S.chipVacc, { backgroundColor: chipBg }]}>
                          <Text style={[S.chipVaccT, { color: chipColor }]}>
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
            <View style={S.emptyState}>
              <Text style={S.emptyIcon}>👶</Text>
              <Text style={S.emptyTitle}>Aucun enfant enregistré</Text>
              <Text style={S.emptySub}>Vos enfants enregistrés dans le système apparaîtront ici.</Text>
            </View>
          )}

          <View style={{ height: 90 }} />
        </ScrollView>
      </Animated.View>

      {/* ══════════════ NAVBAR ══════════════ */}
      <View style={S.navbar}>
        {[
          { label: 'Accueil', screen: null, actif: true },
          { label: 'Centres', screen: 'CentresProches' },
          { label: 'Contact', screen: 'Contact' },
        ].map((item) => (
          <TouchableOpacity
            key={item.label}
            style={S.navItem}
            onPress={() => item.screen && navigation.navigate(item.screen)}
          >
            <Text style={[S.navLabel, item.actif && S.navLabelActif]}>{item.label}</Text>
            {item.actif && <View style={S.navIndicator} />}
          </TouchableOpacity>
        ))}
        {/* Déconnexion dans la navbar — icône standard */}
        <TouchableOpacity style={S.navItem} onPress={() => setShowDecoModal(true)}>
          <Text style={[S.navLabel, { color: '#dc2626' }]}>Déco.</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

// ─── Styles ──────────────────────────────────────────────────────────────────
const S = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f4f6f4' },
  loader:    { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#f4f6f4' },
  loaderT:   { marginTop: 12, color: '#065f46', fontSize: 13, fontWeight: '500' },
  scroll:    { flex: 1 },

  // ── Header
  header:    { backgroundColor: '#065f46', paddingHorizontal: 16, paddingTop: 14, paddingBottom: 14 },
  headerTop: { flexDirection: 'row', alignItems: 'center' },
  hdrGreeting:{ fontSize: 11, color: 'rgba(255,255,255,0.6)', letterSpacing: 0.3 },
  hdrName:   { fontSize: 18, fontWeight: '600', color: '#fff', marginTop: 1 },
  hdrActions:{ flexDirection: 'row', alignItems: 'center', gap: 10 },
  hdrBtn:    { width: 34, height: 34, borderRadius: 17, backgroundColor: 'rgba(255,255,255,0.15)', justifyContent: 'center', alignItems: 'center', position: 'relative' },
  hdrBtnIcon:{ fontSize: 15 },
  notifDot:  { position: 'absolute', top: 4, right: 4, width: 7, height: 7, backgroundColor: '#f87171', borderRadius: 4, borderWidth: 1.5, borderColor: '#065f46' },
  avatarBtn: { position: 'relative' },
  avatarChevron:{ position: 'absolute', bottom: -2, right: -2, backgroundColor: '#065f46', borderRadius: 6, paddingHorizontal: 2, paddingVertical: 1 },

  chipEnfant:      { borderWidth: 1.5, borderColor: 'rgba(255,255,255,0.35)', borderRadius: 20, paddingHorizontal: 14, paddingVertical: 6, marginRight: 8 },
  chipEnfantActif: { backgroundColor: '#fff', borderColor: '#fff' },
  chipEnfantT:     { fontSize: 12, fontWeight: '500', color: 'rgba(255,255,255,0.8)' },
  chipEnfantTActif:{ color: '#065f46', fontWeight: '700' },

  // ── Cards
  card: { backgroundColor: '#fff', borderRadius: 14, padding: 14, marginHorizontal: 12, marginTop: 12, borderWidth: 0.5, borderColor: '#e5e7eb', shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 4, elevation: 1 },

  // ── Fiche enfant
  ficheHead:  { flexDirection: 'row', alignItems: 'center', marginBottom: 14 },
  ficheAvatar:{ marginRight: 12 },
  ficheNom:   { fontSize: 15, fontWeight: '600', color: '#111827' },
  ficheMeta:  { fontSize: 11, color: '#9ca3af', marginTop: 2 },
  ficheAge:   { fontSize: 12, fontWeight: '500', color: '#065f46', marginTop: 2 },
  badgeStatut:{ flexDirection: 'row', alignItems: 'center', gap: 4, borderRadius: 20, paddingHorizontal: 9, paddingVertical: 4, marginLeft: 6 },
  badgeOk:    { backgroundColor: '#ecfdf5' },
  badgeRetard:{ backgroundColor: '#fef2f2' },
  badgeDot:   { width: 6, height: 6, borderRadius: 3 },
  badgeStatutT:{ fontSize: 10, fontWeight: '600' },

  // ── Barre progression
  progSection:{ borderTopWidth: 0.5, borderTopColor: '#f3f4f6', paddingTop: 12 },
  progRow:    { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6 },
  progLabel:  { fontSize: 11, color: '#6b7280' },
  progPct:    { fontSize: 12, fontWeight: '700' },
  progBg:     { height: 6, backgroundColor: '#f3f4f6', borderRadius: 4, overflow: 'hidden', marginBottom: 5 },
  progFill:   { height: '100%', borderRadius: 4 },
  progSub:    { fontSize: 10, color: '#9ca3af' },

  // ── Prochain vaccin
  nextCard:  { backgroundColor: '#ecfdf5', borderRadius: 14, padding: 14, marginHorizontal: 12, marginTop: 8, flexDirection: 'row', alignItems: 'center', borderLeftWidth: 3, borderLeftColor: '#059669', borderWidth: 0.5, borderColor: '#a7f3d0' },
  nextLeft:  { flex: 1 },
  nextLabel: { fontSize: 10, color: '#6b7280', textTransform: 'uppercase', letterSpacing: 0.4 },
  nextNom:   { fontSize: 14, fontWeight: '600', color: '#111827', marginTop: 2 },
  nextDate:  { fontSize: 11, color: '#6b7280', marginTop: 3 },
  nextBadge: { backgroundColor: '#065f46', borderRadius: 20, paddingHorizontal: 10, paddingVertical: 5 },
  nextBadgeT:{ fontSize: 11, fontWeight: '600', color: '#fff' },

  // ── Actions
  actionsRow: { flexDirection: 'row', gap: 8, paddingHorizontal: 12, marginTop: 8 },
  actionBtn:  { flex: 1, borderRadius: 12, paddingVertical: 14, alignItems: 'center', gap: 4 },
  actionIcon: { fontSize: 18 },
  actionBtnT: { color: '#fff', fontSize: 12, fontWeight: '600' },

  // ── Section head carnet
  secHead:  { flexDirection: 'row', alignItems: 'center', marginBottom: 10, gap: 8 },
  secLine:  { width: 3, height: 14, backgroundColor: '#065f46', borderRadius: 2 },
  secHeadT: { fontSize: 10, fontWeight: '700', color: '#374151', letterSpacing: 0.5 },

  // ── Légende
  legende:    { flexDirection: 'row', gap: 14, marginBottom: 10 },
  legendItem: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  legendDot:  { width: 7, height: 7, borderRadius: 4 },
  legendT:    { fontSize: 10, color: '#6b7280' },

  // ── Lignes vaccin
  vaccinLigne:{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 11, paddingLeft: 10, borderLeftWidth: 3 },
  vaccinSep:  { borderBottomWidth: 0.5, borderBottomColor: '#f3f4f6' },
  vaccinNom:  { fontSize: 13, fontWeight: '500', color: '#111827' },
  vaccinMeta: { fontSize: 10, color: '#9ca3af', marginTop: 2 },
  chipVacc:   { borderRadius: 20, paddingHorizontal: 10, paddingVertical: 4, marginLeft: 8 },
  chipVaccT:  { fontSize: 10, fontWeight: '600' },

  // ── Empty state
  emptyState:{ alignItems: 'center', paddingVertical: 60, paddingHorizontal: 30 },
  emptyIcon: { fontSize: 48, marginBottom: 12 },
  emptyTitle:{ fontSize: 16, fontWeight: '600', color: '#374151', marginBottom: 6 },
  emptySub:  { fontSize: 12, color: '#9ca3af', textAlign: 'center', lineHeight: 18 },

  // ── Vide inline
  vide:  { alignItems: 'center', paddingVertical: 20 },
  videT: { color: '#9ca3af', fontSize: 12 },

  // ── Navbar
  navbar:      { backgroundColor: '#fff', borderTopWidth: 0.5, borderTopColor: '#e5e7eb', flexDirection: 'row', paddingVertical: 10, paddingBottom: 12, shadowColor: '#000', shadowOffset: { width: 0, height: -1 }, shadowOpacity: 0.04, shadowRadius: 4, elevation: 2 },
  navItem:     { flex: 1, alignItems: 'center', gap: 3 },
  navLabel:    { fontSize: 11, color: '#9ca3af', fontWeight: '500' },
  navLabelActif:{ color: '#065f46', fontWeight: '700' },
  navIndicator:{ width: 4, height: 4, borderRadius: 2, backgroundColor: '#065f46' },

  // ── Modal déconnexion
  modalOverlay:  { flex: 1, backgroundColor: 'rgba(0,0,0,0.45)', justifyContent: 'center', alignItems: 'center', paddingHorizontal: 30 },
  modalCard:     { backgroundColor: '#fff', borderRadius: 20, padding: 24, width: '100%', alignItems: 'center', shadowColor: '#000', shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.15, shadowRadius: 24, elevation: 10 },
  modalIconBox:  { width: 64, height: 64, justifyContent: 'center', alignItems: 'center', marginBottom: 16, position: 'relative' },
  modalIconText: { fontSize: 64, color: '#fee2e2', position: 'absolute' },
  modalIconInner:{ zIndex: 1 },
  modalTitle:    { fontSize: 18, fontWeight: '700', color: '#111827', marginBottom: 8 },
  modalSub:      { fontSize: 13, color: '#6b7280', textAlign: 'center', lineHeight: 20, marginBottom: 22 },
  modalBtns:     { flexDirection: 'row', gap: 10, width: '100%' },
  modalBtnCancel:{ flex: 1, borderWidth: 1.5, borderColor: '#e5e7eb', borderRadius: 12, paddingVertical: 13, alignItems: 'center' },
  modalBtnCancelT:{ fontSize: 13, fontWeight: '600', color: '#374151' },
  modalBtnConfirm:{ flex: 1, backgroundColor: '#dc2626', borderRadius: 12, paddingVertical: 13, alignItems: 'center' },
  modalBtnConfirmT:{ fontSize: 13, fontWeight: '600', color: '#fff' },
});