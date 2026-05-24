import React, { useState, useEffect, useRef } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, StyleSheet,
  SafeAreaView, StatusBar, RefreshControl, ActivityIndicator,
  Modal, Animated, Dimensions, Platform,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
import { API_URL } from './config';
import Svg, { Path, Circle, Line, Polyline, Rect, Polygon } from 'react-native-svg';

const { width: SW } = Dimensions.get('window');

// ─── PALETTE 
const C = {
  primary:   '#065f46',
  bg:        '#f4f6f4',
  white:     '#ffffff',
  danger:    '#dc2626',
  warn:      '#d97706',
  success:   '#059669',
  teal:      '#0d9488',
  blue:      '#0369a1',
  violet:    '#7c3aed',
  amber:     '#b45309',
  textLight: '#9ca3af',
  textMid:   '#6b7280',
  textDark:  '#111827',
};

// ─── SVG ICONS ────────────────────────────────────────────────────────────────
const Icon = ({ name, size = 22, color = C.primary, sw = 1.8 }) => {
  const p = { stroke: color, strokeWidth: sw, fill: 'none', strokeLinecap: 'round', strokeLinejoin: 'round' };
  const map = {
    home:      <Svg width={size} height={size} viewBox="0 0 24 24"><Path {...p} d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><Polyline {...p} points="9 22 9 12 15 12 15 22"/></Svg>,
    mapPin:    <Svg width={size} height={size} viewBox="0 0 24 24"><Path {...p} d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><Circle {...p} cx="12" cy="10" r="3"/></Svg>,
    phone:     <Svg width={size} height={size} viewBox="0 0 24 24"><Path {...p} d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.69 12 19.79 19.79 0 0 1 1.61 3.4 2 2 0 0 1 3.6 1.22h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L7.91 8.82a16 16 0 0 0 6.29 6.29l.95-.95a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 22 16.92z"/></Svg>,
    user:      <Svg width={size} height={size} viewBox="0 0 24 24"><Path {...p} d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><Circle {...p} cx="12" cy="7" r="4"/></Svg>,
    menu:      <Svg width={size} height={size} viewBox="0 0 24 24"><Line {...p} x1="3" y1="6" x2="21" y2="6"/><Line {...p} x1="3" y1="12" x2="21" y2="12"/><Line {...p} x1="3" y1="18" x2="21" y2="18"/></Svg>,
    bell:      <Svg width={size} height={size} viewBox="0 0 24 24"><Path {...p} d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><Path {...p} d="M13.73 21a2 2 0 0 1-3.46 0"/></Svg>,
    logout:    <Svg width={size} height={size} viewBox="0 0 24 24"><Path {...p} d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><Polyline {...p} points="16 17 21 12 16 7"/><Line {...p} x1="21" y1="12" x2="9" y2="12"/></Svg>,
    settings:  <Svg width={size} height={size} viewBox="0 0 24 24"><Circle {...p} cx="12" cy="12" r="3"/><Path {...p} d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/></Svg>,
    chevron:   <Svg width={size} height={size} viewBox="0 0 24 24"><Polyline {...p} points="9 18 15 12 9 6"/></Svg>,
    syringe:   <Svg width={size} height={size} viewBox="0 0 24 24"><Line {...p} x1="3" y1="21" x2="7" y2="17"/><Line {...p} x1="7" y1="17" x2="16" y2="8"/><Line {...p} x1="16" y1="8" x2="20" y2="4"/><Line {...p} x1="18" y1="2" x2="22" y2="6"/><Line {...p} x1="6" y1="15" x2="15" y2="6"/><Line {...p} x1="9" y1="18" x2="18" y2="9"/></Svg>,
    clipboard: <Svg width={size} height={size} viewBox="0 0 24 24"><Path {...p} d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"/><Rect {...p} x="8" y="2" width="8" height="4" rx="1" ry="1"/><Line {...p} x1="9" y1="12" x2="15" y2="12"/><Line {...p} x1="9" y1="16" x2="12" y2="16"/></Svg>,
    // ── NOUVELLES ICÔNES ──
    calendar:  <Svg width={size} height={size} viewBox="0 0 24 24"><Rect {...p} x="3" y="4" width="18" height="18" rx="2" ry="2"/><Line {...p} x1="16" y1="2" x2="16" y2="6"/><Line {...p} x1="8" y1="2" x2="8" y2="6"/><Line {...p} x1="3" y1="10" x2="21" y2="10"/></Svg>,
    history:   <Svg width={size} height={size} viewBox="0 0 24 24"><Path {...p} d="M3 3v5h5"/><Path {...p} d="M3.05 13A9 9 0 1 0 6 5.3L3 8"/><Line {...p} x1="12" y1="7" x2="12" y2="12"/><Line {...p} x1="12" y1="12" x2="16" y2="14"/></Svg>,
    carnet:    <Svg width={size} height={size} viewBox="0 0 24 24"><Path {...p} d="M9 12h3.75M9 15h3.75M9 18h3.75m3 .75H18a2.25 2.25 0 002.25-2.25V6.108c0-1.135-.845-2.098-1.976-2.192a48.424 48.424 0 00-1.123-.08m-5.801 0c-.065.21-.1.433-.1.664 0 .414.336.75.75.75h4.5a.75.75 0 00.75-.75 2.25 2.25 0 00-.1-.664m-5.8 0A2.251 2.251 0 0113.5 2.25H15c1.012 0 1.867.668 2.15 1.586m-5.8 0c-.376.023-.75.05-1.124.08C9.095 4.01 8.25 4.973 8.25 6.108V8.25m0 0H4.875c-.621 0-1.125.504-1.125 1.125v11.25c0 .621.504 1.125 1.125 1.125h9.75c.621 0 1.125-.504 1.125-1.125V9.375c0-.621-.504-1.125-1.125-1.125H8.25z"/></Svg>,
  };
  return map[name] || null;
};

// ─── HELPERS ─
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

// ── ÂGE : entier uniquement, jamais de virgule/décimale ──────────────────────
const calculerAge = (dn) => {
  if (!dn) return '';
  const now       = new Date();
  const naissance = new Date(dn);
  const diffMs    = now - naissance;
  const jours     = Math.floor(diffMs / (1000 * 60 * 60 * 24));
  const moisTotal = Math.floor(jours / 30.4375);   // moyenne plus précise
  const ans       = Math.floor(jours / 365.25);

  if (jours < 1)    return 'Aujourd\'hui';
  if (jours < 30)   return `${jours} jour${jours > 1 ? 's' : ''}`;
  if (moisTotal < 12) return `${moisTotal} mois`;
  if (ans === 1) {
    const moisReste = moisTotal - 12;
    return moisReste > 0 ? `1 an et ${moisReste} mois` : '1 an';
  }
  // Pour 2 ans et plus : afficher aussi les mois restants si < 6 mois de bonus
  const moisReste = moisTotal - (ans * 12);
  if (moisReste > 0 && moisReste < 6) return `${ans} ans et ${moisReste} mois`;
  return `${ans} ans`;
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

// ─── INITIALES ───────────────────────────────────────────────────────────────
const Initiales = ({ prenom = '', nom = '', size = 38, bg = C.primary, color = '#fff', fontSize = 15 }) => (
  <View style={{ width: size, height: size, borderRadius: size / 2, backgroundColor: bg, justifyContent: 'center', alignItems: 'center' }}>
    <Text style={{ color, fontSize, fontWeight: '700' }}>
      {(prenom[0] ?? '').toUpperCase()}{(nom[0] ?? '').toUpperCase()}
    </Text>
  </View>
);

// ─── COMPOSANT PRINCIPAL ─────────────────────────────────────────────────────
export default function DashboardParent({ navigation }) {
  const [loading, setLoading]         = useState(true);
  const [refreshing, setRefreshing]   = useState(false);
  const [parent, setParent]           = useState(null);
  const [enfants, setEnfants]         = useState([]);
  const [enfantActif, setEnfantActif] = useState(null);
  const [vaccins, setVaccins]         = useState([]);
  const [loadingVacc, setLoadingVacc] = useState(false);
  const [logoutModal, setLogoutModal] = useState(false);
  const [drawerOpen, setDrawerOpen]   = useState(false);
  const [activeNav, setActiveNav]     = useState('home');

  const fadeAnim    = useRef(new Animated.Value(0)).current;
  const drawerAnim  = useRef(new Animated.Value(-SW * 0.75)).current;
  const overlayAnim = useRef(new Animated.Value(0)).current;

  // ── Drawer ─
  const openDrawer = () => {
    setDrawerOpen(true);
    Animated.parallel([
      Animated.spring(drawerAnim,  { toValue: 0, useNativeDriver: true, tension: 65, friction: 11 }),
      Animated.timing(overlayAnim, { toValue: 1, duration: 250, useNativeDriver: true }),
    ]).start();
  };
  const closeDrawer = () => {
    Animated.parallel([
      Animated.spring(drawerAnim,  { toValue: -SW * 0.75, useNativeDriver: true, tension: 65, friction: 11 }),
      Animated.timing(overlayAnim, { toValue: 0, duration: 200, useNativeDriver: true }),
    ]).start(() => setDrawerOpen(false));
  };

  // ── Chargement vaccins ───────────────────────────────────────────────────────
  const chargerVaccins = async (enfantId, tokenParam) => {
    setLoadingVacc(true);
    try {
      const token     = tokenParam || await AsyncStorage.getItem('token');
      const typeUsers = await AsyncStorage.getItem('type_users') ?? 'mere';
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

  const handleLogout = async () => {
    setLogoutModal(false);
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
  const barColor       = pctCouv >= 90 ? C.primary : pctCouv >= 70 ? C.warn : C.danger;

  if (loading) return (
    <View style={S.loader}>
      <ActivityIndicator size="large" color={C.primary} />
      <Text style={S.loaderT}>Chargement…</Text>
    </View>
  );

  const prenom   = parent?.prenom ?? '';
  const nom      = parent?.nom    ?? '';
  const initiales = (prenom[0] ?? '').toUpperCase() + (nom[0] ?? '').toUpperCase();

  return (
    <SafeAreaView style={S.container}>
      <StatusBar barStyle="light-content" backgroundColor={C.primary} />

      {/* ══ HEADER ══════════════════════════════════════════════════════════ */}
      <View style={S.header}>
        <View style={S.headerTop}>
          <View style={{ flex: 1 }}>
            <Text style={S.hdrGreeting}>Bonjour</Text>
            <Text style={S.hdrName}>{prenom} {nom}</Text>
          </View>
          <View style={S.hdrActions}>
            <TouchableOpacity style={S.hdrBtn}>
              <Icon name="bell" size={20} color="#fff" />
              <View style={S.notifDot} />
            </TouchableOpacity>
            <TouchableOpacity style={S.hdrBtn} onPress={openDrawer}>
              <Icon name="menu" size={22} color="#fff" />
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

      {/* ══ CONTENU ═════════════════════════════════════════════════════════ */}
      <Animated.View style={{ flex: 1, opacity: fadeAnim }}>
        <ScrollView
          style={S.scroll}
          showsVerticalScrollIndicator={false}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[C.primary]} />}
        >
          {enfantActif ? (
            <>
              {/* ── Carte enfant ─────────────────────────────────────────── */}
              <View style={S.card}>
                <View style={S.ficheHead}>
                  
                  <View style={{ flex: 1 }}>
                    <Text style={S.ficheNom}>{enfantActif.prenom} {enfantActif.nom}</Text>
                    <Text style={S.ficheMeta}>
                      {enfantActif.sexe === 'F' ? 'Née' : 'Né'} le {formatDate(enfantActif.date_naissance)}
                    </Text>
                    {/* ÂGE — entier, jamais de décimale */}
                    <Text style={S.ficheAge}>{calculerAge(enfantActif.date_naissance)}</Text>
                  </View>
                  <View style={[S.badgeStatut, aUnRetard ? S.badgeRetard : S.badgeOk]}>
                    <View style={[S.badgeDot, { backgroundColor: aUnRetard ? C.danger : C.success }]} />
                    <Text style={[S.badgeStatutT, { color: aUnRetard ? C.danger : C.success }]}>
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

              {/* ── Prochain vaccin ──────────────────────────────────────── */}
              {prochainVaccin && (
                <View style={S.nextCard}>
                  <View style={S.nextLeft}>
                    <Text style={S.nextLabel}>Prochain vaccin</Text>
                    <Text style={S.nextNom}>{prochainVaccin.vaccin || prochainVaccin.nom_vaccin || '—'}</Text>
                    {prochainVaccin.date_prevue && (
                      <Text style={S.nextDate}>{formatDate(prochainVaccin.date_prevue)}</Text>
                    )}
                  </View>
                  <View style={S.nextBadge}>
                    <Text style={S.nextBadgeT}>{calculerAge(enfantActif.date_naissance)}</Text>
                  </View>
                </View>
              )}

              {/* ── Actions rapides — grille 2×2 ─────────────────────────── */}
              <View style={S.actionsGrid}>

                {/* Ligne 1 */}
                <View style={S.actionsRow}>
                  {/* Rendez-vous (remplace Carnet vaccinal) */}
                  <TouchableOpacity
                    style={[S.actionBtn, { backgroundColor: C.primary }]}
                    onPress={() => navigation.navigate('RendezVous', { enfantId: enfantActif.id, enfant: enfantActif })}
                    activeOpacity={0.85}
                  >
                    <Icon name="calendar" size={20} color="#fff" />
                    <Text style={S.actionBtnT}>Rendez-vous</Text>
                  </TouchableOpacity>

                  {/* Mon relais (remplace Centre proche) */}
                  <TouchableOpacity
                    style={[S.actionBtn, { backgroundColor: C.teal }]}
                    onPress={() => navigation.navigate('MonRelais')}
                    activeOpacity={0.85}
                  >
                    <Icon name="phone" size={20} color="#fff" />
                    <Text style={S.actionBtnT}>Mon relais</Text>
                  </TouchableOpacity>
                </View>

                {/* Ligne 2 */}
                <View style={S.actionsRow}>
                  {/* Rappels */}
                  <TouchableOpacity
                    style={[S.actionBtn, { backgroundColor: C.violet }]}
                    onPress={() => navigation.navigate('Rappels', { enfantId: enfantActif.id })}
                    activeOpacity={0.85}
                  >
                    <Icon name="bell" size={20} color="#fff" />
                    <Text style={S.actionBtnT}>Rappels</Text>
                  </TouchableOpacity>

                  {/* Historique */}
                  <TouchableOpacity
                    style={[S.actionBtn, { backgroundColor: C.amber }]}
                    onPress={() => navigation.navigate('HistoriqueVaccins', { enfantId: enfantActif.id, enfant: enfantActif })}
                    activeOpacity={0.85}
                  >
                    <Icon name="history" size={20} color="#fff" />
                    <Text style={S.actionBtnT}>Historique</Text>
                  </TouchableOpacity>
                </View>

              </View>

              {/* ── Carnet vaccinal inline ───────────────────────────────── */}
              <View style={[S.card, { marginTop: 8 }]}>
                <View style={S.secHead}>
                  <View style={S.secLine} />
                  <Text style={S.secHeadT}>CARNET VACCINAL — {enfantActif.prenom?.toUpperCase()}</Text>
                </View>

                <View style={S.legende}>
                  {[
                    { color: C.success, label: 'Fait' },
                    { color: C.danger,  label: 'En retard' },
                    { color: C.warn,    label: 'À venir' },
                  ].map(l => (
                    <View key={l.label} style={S.legendItem}>
                      <View style={[S.legendDot, { backgroundColor: l.color }]} />
                      <Text style={S.legendT}>{l.label}</Text>
                    </View>
                  ))}
                </View>

                {loadingVacc ? (
                  <View style={S.vide}><ActivityIndicator size="small" color={C.primary} /></View>
                ) : vaccins.length === 0 ? (
                  <View style={S.vide}><Text style={S.videT}>Aucune vaccination enregistrée</Text></View>
                ) : vaccins.map((v, i) => {
                  const statut       = statutVaccin(v);
                  const estFait      = statut === 'fait';
                  const estRetard    = statut === 'retard';
                  const chipBg       = estFait ? '#d1fae5' : estRetard ? '#fee2e2' : '#fef3c7';
                  const chipColor    = estFait ? C.success : estRetard ? C.danger : C.warn;
                  const bordureColor = chipColor;
                  return (
                    <View key={i} style={[S.vaccinLigne, { borderLeftColor: bordureColor }, i < vaccins.length - 1 && S.vaccinSep]}>
                      <View style={{ flex: 1 }}>
                        <Text style={S.vaccinNom}>{v.vaccin || v.nom_vaccin || '—'}</Text>
                        <Text style={S.vaccinMeta}>
                          {estFait
                            ? `Administré le ${formatDateCourt(v.date_administration)} · ${v.centre_sante?.nom ?? '—'}`
                            : estRetard
                            ? `En retard — prévu le ${formatDateCourt(v.date_prevue)}`
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
                })}
              </View>
            </>
          ) : (
            <View style={S.emptyState}>
              <Icon name="syringe" size={48} color={C.textLight} />
              <Text style={S.emptyTitle}>Aucun enfant enregistré</Text>
              <Text style={S.emptySub}>Vos enfants enregistrés dans le système apparaîtront ici.</Text>
            </View>
          )}
          <View style={{ height: 90 }} />
        </ScrollView>
      </Animated.View>

      {/* ══ NAVBAR BOTTOM ═══════════════════════════════════════════════════ */}
      {/* Centres → remplacé par Carnet */}
      <View style={S.navbar}>
        {[
          { key: 'home',   icon: 'home',    label: 'Accueil', action: () => setActiveNav('home') },
          { key: 'carnet', icon: 'carnet',  label: 'Carnet',  action: () => { setActiveNav('carnet'); navigation.navigate('CarnetVaccinal', { enfantId: enfantActif?.id, enfant: enfantActif }); } },
          { key: 'contact',icon: 'phone',   label: 'Contact', action: () => { setActiveNav('contact'); navigation.navigate('Contact'); } },
          { key: 'profil', icon: 'user',    label: 'Profil',  action: () => { setActiveNav('profil'); navigation.navigate('Profil'); } },
        ].map(item => (
          <TouchableOpacity key={item.key} style={S.navItem} onPress={item.action} activeOpacity={0.8}>
            <Icon
              name={item.icon}
              size={22}
              color={activeNav === item.key ? C.primary : C.textLight}
              sw={activeNav === item.key ? 2.2 : 1.6}
            />
            <Text style={[S.navLabel, activeNav === item.key && S.navLabelActif]}>{item.label}</Text>
            {activeNav === item.key && <View style={S.navDot} />}
          </TouchableOpacity>
        ))}
      </View>

      {/* ══ DRAWER ══════════════════════════════════════════════════════════ */}
      {drawerOpen && (
        <View style={StyleSheet.absoluteFill}>
          <Animated.View style={[S.drawerOverlay, { opacity: overlayAnim }]}>
            <TouchableOpacity style={StyleSheet.absoluteFill} onPress={closeDrawer} />
          </Animated.View>
          <Animated.View style={[S.drawer, { transform: [{ translateX: drawerAnim }] }]}>
            <View style={S.drawerHead}>
              <View style={S.drawerAvatarBox}>
                <Text style={S.drawerAvatarT}>{initiales || 'PA'}</Text>
              </View>
              <Text style={S.drawerNom}>{prenom} {nom}</Text>
              <Text style={S.drawerRole}>Parent</Text>
            </View>
            <View style={S.drawerMenu}>
              {[
                { label: 'Mon profil',  icon: 'user',     route: 'Profil'     },
                { label: 'Paramètres', icon: 'settings', route: 'Parametres' },
              ].map(item => (
                <TouchableOpacity key={item.route} style={S.drawerItem}
                  onPress={() => { closeDrawer(); navigation.navigate(item.route); }} activeOpacity={0.8}>
                  <Icon name={item.icon} size={20} color={C.primary} />
                  <Text style={S.drawerItemT}>{item.label}</Text>
                  <Icon name="chevron" size={16} color={C.textLight} />
                </TouchableOpacity>
              ))}
            </View>
            <TouchableOpacity style={S.drawerLogout}
              onPress={() => { closeDrawer(); setTimeout(() => setLogoutModal(true), 300); }} activeOpacity={0.8}>
              <Icon name="logout" size={20} color={C.danger} />
              <Text style={S.drawerLogoutT}>Déconnexion</Text>
            </TouchableOpacity>
          </Animated.View>
        </View>
      )}

      {/* ══ MODAL DÉCONNEXION ════════════════════════════════════════════════ */}
      <Modal visible={logoutModal} transparent animationType="fade" onRequestClose={() => setLogoutModal(false)}>
        <View style={S.modalOverlay}>
          <View style={S.modalCard}>
            <View style={S.modalIco}>
              <Icon name="logout" size={28} color={C.danger} />
            </View>
            <Text style={S.modalTitle}>Déconnexion</Text>
            <Text style={S.modalBody}>Voulez-vous vraiment vous déconnecter de VacciBénin ?</Text>
            <View style={S.modalBtns}>
              <TouchableOpacity style={[S.modalBtn, { backgroundColor: '#f3f4f6' }]} onPress={() => setLogoutModal(false)} activeOpacity={0.8}>
                <Text style={[S.modalBtnT, { color: C.textMid }]}>Annuler</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[S.modalBtn, { backgroundColor: C.danger }]} onPress={handleLogout} activeOpacity={0.8}>
                <Text style={[S.modalBtnT, { color: C.white }]}>Déconnexion</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

// ─── STYLES ─
const S = StyleSheet.create({
  container: { flex: 1, backgroundColor: C.bg },
  loader:    { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: C.bg },
  loaderT:   { marginTop: 12, color: C.primary, fontSize: 13, fontWeight: '500' },
  scroll:    { flex: 1 },

  // ── Header
  header:      { backgroundColor: C.primary, paddingHorizontal: 16, paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight + 12 : 14, paddingBottom: 14 },
  headerTop:   { flexDirection: 'row', alignItems: 'center' },
  hdrGreeting: { fontSize: 11, color: 'rgba(255,255,255,0.6)', letterSpacing: 0.3 },
  hdrName:     { fontSize: 18, fontWeight: '600', color: '#fff', marginTop: 1 },
  hdrActions:  { flexDirection: 'row', alignItems: 'center', gap: 8 },
  hdrBtn:      { padding: 8, position: 'relative' },
  notifDot:    { position: 'absolute', top: 6, right: 6, width: 7, height: 7, backgroundColor: '#f87171', borderRadius: 4, borderWidth: 1.5, borderColor: C.primary },

  chipEnfant:       { borderWidth: 1.5, borderColor: 'rgba(255,255,255,0.35)', borderRadius: 20, paddingHorizontal: 14, paddingVertical: 6, marginRight: 8 },
  chipEnfantActif:  { backgroundColor: '#fff', borderColor: '#fff' },
  chipEnfantT:      { fontSize: 12, fontWeight: '500', color: 'rgba(255,255,255,0.8)' },
  chipEnfantTActif: { color: C.primary, fontWeight: '700' },

  // ── Card générique
  card: { backgroundColor: C.white, borderRadius: 14, padding: 14, marginHorizontal: 12, marginTop: 12, borderWidth: 0.5, borderColor: '#e5e7eb', shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 4, elevation: 1 },

  // ── Fiche enfant
  ficheHead:   { flexDirection: 'row', alignItems: 'center', marginBottom: 14 },
  ficheAvatar: { marginRight: 12 },
  ficheNom:    { fontSize: 15, fontWeight: '600', color: C.textDark },
  ficheMeta:   { fontSize: 11, color: C.textLight, marginTop: 2 },
  ficheAge:    { fontSize: 12, fontWeight: '600', color: C.primary, marginTop: 3 },
  badgeStatut: { flexDirection: 'row', alignItems: 'center', gap: 4, borderRadius: 20, paddingHorizontal: 9, paddingVertical: 4, marginLeft: 6 },
  badgeOk:     { backgroundColor: '#ecfdf5' },
  badgeRetard: { backgroundColor: '#fef2f2' },
  badgeDot:    { width: 6, height: 6, borderRadius: 3 },
  badgeStatutT:{ fontSize: 10, fontWeight: '600' },

  // ── Barre progression
  progSection: { borderTopWidth: 0.5, borderTopColor: '#f3f4f6', paddingTop: 12 },
  progRow:     { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6 },
  progLabel:   { fontSize: 11, color: C.textMid },
  progPct:     { fontSize: 12, fontWeight: '700' },
  progBg:      { height: 6, backgroundColor: '#f3f4f6', borderRadius: 4, overflow: 'hidden', marginBottom: 5 },
  progFill:    { height: '100%', borderRadius: 4 },
  progSub:     { fontSize: 10, color: C.textLight },

  // ── Prochain vaccin
  nextCard:  { backgroundColor: '#ecfdf5', borderRadius: 14, padding: 14, marginHorizontal: 12, marginTop: 8, flexDirection: 'row', alignItems: 'center', borderLeftWidth: 3, borderLeftColor: C.success, borderWidth: 0.5, borderColor: '#a7f3d0' },
  nextLeft:  { flex: 1 },
  nextLabel: { fontSize: 10, color: C.textMid, textTransform: 'uppercase', letterSpacing: 0.4 },
  nextNom:   { fontSize: 14, fontWeight: '600', color: C.textDark, marginTop: 2 },
  nextDate:  { fontSize: 11, color: C.textMid, marginTop: 3 },
  nextBadge: { backgroundColor: C.primary, borderRadius: 20, paddingHorizontal: 10, paddingVertical: 5 },
  nextBadgeT:{ fontSize: 11, fontWeight: '600', color: '#fff' },

  // ── Actions rapides 2×2
  actionsGrid: { paddingHorizontal: 12, marginTop: 8, gap: 8 },
  actionsRow:  { flexDirection: 'row', gap: 8 },
  actionBtn:   { flex: 1, borderRadius: 12, paddingVertical: 14, alignItems: 'center', gap: 6, flexDirection: 'row', justifyContent: 'center' },
  actionBtnT:  { color: '#fff', fontSize: 12, fontWeight: '600' },

  // ── Section carnet inline
  secHead:  { flexDirection: 'row', alignItems: 'center', marginBottom: 10, gap: 8 },
  secLine:  { width: 3, height: 14, backgroundColor: C.primary, borderRadius: 2 },
  secHeadT: { fontSize: 10, fontWeight: '700', color: C.textDark, letterSpacing: 0.5 },

  legende:    { flexDirection: 'row', gap: 14, marginBottom: 10 },
  legendItem: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  legendDot:  { width: 7, height: 7, borderRadius: 4 },
  legendT:    { fontSize: 10, color: C.textMid },

  vaccinLigne: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 11, paddingLeft: 10, borderLeftWidth: 3 },
  vaccinSep:   { borderBottomWidth: 0.5, borderBottomColor: '#f3f4f6' },
  vaccinNom:   { fontSize: 13, fontWeight: '500', color: C.textDark },
  vaccinMeta:  { fontSize: 10, color: C.textLight, marginTop: 2 },
  chipVacc:    { borderRadius: 20, paddingHorizontal: 10, paddingVertical: 4, marginLeft: 8 },
  chipVaccT:   { fontSize: 10, fontWeight: '600' },

  emptyState: { alignItems: 'center', paddingVertical: 60, paddingHorizontal: 30, gap: 12 },
  emptyTitle: { fontSize: 16, fontWeight: '600', color: C.textDark },
  emptySub:   { fontSize: 12, color: C.textLight, textAlign: 'center', lineHeight: 18 },

  vide:  { alignItems: 'center', paddingVertical: 20 },
  videT: { color: C.textLight, fontSize: 12 },

  // ── Navbar
  navbar:        { flexDirection: 'row', backgroundColor: C.white, paddingBottom: Platform.OS === 'ios' ? 24 : 8, paddingTop: 8, borderTopWidth: 1, borderTopColor: '#f0f0f0', shadowColor: '#000', shadowOffset: { width: 0, height: -2 }, shadowOpacity: 0.04, shadowRadius: 8, elevation: 6 },
  navItem:       { flex: 1, alignItems: 'center', gap: 3, position: 'relative' },
  navLabel:      { fontSize: 10, color: C.textLight, fontWeight: '500' },
  navLabelActif: { color: C.primary, fontWeight: '700' },
  navDot:        { position: 'absolute', top: -8, width: 4, height: 4, borderRadius: 2, backgroundColor: C.primary },

  // ── Drawer
  drawerOverlay:   { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(6,95,70,0.25)' },
  drawer:          { position: 'absolute', top: 0, bottom: 0, left: 0, width: SW * 0.75, backgroundColor: C.white, shadowColor: '#000', shadowOffset: { width: 4, height: 0 }, shadowOpacity: 0.12, shadowRadius: 16, elevation: 12 },
  drawerHead:      { backgroundColor: C.primary, paddingTop: Platform.OS === 'ios' ? 56 : (StatusBar.currentHeight || 24) + 24, paddingBottom: 24, paddingHorizontal: 20 },
  drawerAvatarBox: { width: 56, height: 56, borderRadius: 28, backgroundColor: 'rgba(255,255,255,0.2)', justifyContent: 'center', alignItems: 'center', marginBottom: 12 },
  drawerAvatarT:   { fontSize: 22, fontWeight: '800', color: C.white },
  drawerNom:       { fontSize: 16, fontWeight: '700', color: C.white },
  drawerRole:      { fontSize: 13, color: 'rgba(255,255,255,0.75)', marginTop: 2 },
  drawerMenu:      { paddingTop: 8 },
  drawerItem:      { flexDirection: 'row', alignItems: 'center', gap: 14, paddingHorizontal: 20, paddingVertical: 16, borderBottomWidth: 1, borderBottomColor: '#f0f0f0' },
  drawerItemT:     { flex: 1, fontSize: 15, color: C.textDark, fontWeight: '500' },
  drawerLogout:    { flexDirection: 'row', alignItems: 'center', gap: 14, paddingHorizontal: 20, paddingVertical: 16, marginTop: 'auto', borderTopWidth: 1, borderTopColor: '#f0f0f0' },
  drawerLogoutT:   { fontSize: 15, color: C.danger, fontWeight: '600' },

  // ── Modal
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.45)', justifyContent: 'center', alignItems: 'center', padding: 24 },
  modalCard:    { backgroundColor: C.white, borderRadius: 20, padding: 28, width: '100%', maxWidth: 340, alignItems: 'center', shadowColor: '#000', shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.15, shadowRadius: 24, elevation: 12 },
  modalIco:     { width: 64, height: 64, borderRadius: 32, backgroundColor: '#fee2e2', justifyContent: 'center', alignItems: 'center', marginBottom: 16 },
  modalTitle:   { fontSize: 18, fontWeight: '800', color: C.textDark, marginBottom: 8 },
  modalBody:    { fontSize: 14, color: C.textMid, textAlign: 'center', lineHeight: 20, marginBottom: 24 },
  modalBtns:    { flexDirection: 'row', gap: 12, width: '100%' },
  modalBtn:     { flex: 1, paddingVertical: 13, borderRadius: 12, alignItems: 'center' },
  modalBtnT:    { fontSize: 14, fontWeight: '700' },
});