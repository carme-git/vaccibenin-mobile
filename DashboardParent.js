import React, { useState, useEffect, useRef } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, StyleSheet,
  SafeAreaView, StatusBar, RefreshControl, ActivityIndicator,
  Modal, Animated, Dimensions, Platform,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
import { API_URL } from './config';
import Svg, { Path, Circle, Line, Polyline, Rect } from 'react-native-svg';

const { width: SW } = Dimensions.get('window');

const C = {
  primary:   '#065f46',
  bg:        '#f4f6f4',
  white:     '#ffffff',
  danger:    '#dc2626',
  warn:      '#d97706',
  success:   '#059669',
  teal:      '#0d9488',
  violet:    '#7c3aed',
  amber:     '#0a48cf',
  textLight: '#9ca3af',
  textMid:   '#6b7280',
  textDark:  '#111827',
};

const Icon = ({ name, size = 22, color = C.primary, sw = 1.8 }) => {
  const p = { stroke: color, strokeWidth: sw, fill: 'none', strokeLinecap: 'round', strokeLinejoin: 'round' };
  const map = {
    home:      <Svg width={size} height={size} viewBox="0 0 24 24"><Path {...p} d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><Polyline {...p} points="9 22 9 12 15 12 15 22"/></Svg>,
    phone:     <Svg width={size} height={size} viewBox="0 0 24 24"><Path {...p} d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.69 12 19.79 19.79 0 0 1 1.61 3.4 2 2 0 0 1 3.6 1.22h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L7.91 8.82a16 16 0 0 0 6.29 6.29l.95-.95a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 22 16.92z"/></Svg>,
    user:      <Svg width={size} height={size} viewBox="0 0 24 24"><Path {...p} d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><Circle {...p} cx="12" cy="7" r="4"/></Svg>,
    menu:      <Svg width={size} height={size} viewBox="0 0 24 24"><Line {...p} x1="3" y1="6" x2="21" y2="6"/><Line {...p} x1="3" y1="12" x2="21" y2="12"/><Line {...p} x1="3" y1="18" x2="21" y2="18"/></Svg>,
    bell:      <Svg width={size} height={size} viewBox="0 0 24 24"><Path {...p} d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><Path {...p} d="M13.73 21a2 2 0 0 1-3.46 0"/></Svg>,
    logout:    <Svg width={size} height={size} viewBox="0 0 24 24"><Path {...p} d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><Polyline {...p} points="16 17 21 12 16 7"/><Line {...p} x1="21" y1="12" x2="9" y2="12"/></Svg>,
    settings:  <Svg width={size} height={size} viewBox="0 0 24 24"><Circle {...p} cx="12" cy="12" r="3"/><Path {...p} d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/></Svg>,
    chevron:   <Svg width={size} height={size} viewBox="0 0 24 24"><Polyline {...p} points="9 18 15 12 9 6"/></Svg>,
    syringe:   <Svg width={size} height={size} viewBox="0 0 24 24"><Line {...p} x1="3" y1="21" x2="7" y2="17"/><Line {...p} x1="7" y1="17" x2="16" y2="8"/><Line {...p} x1="16" y1="8" x2="20" y2="4"/><Line {...p} x1="18" y1="2" x2="22" y2="6"/><Line {...p} x1="6" y1="15" x2="15" y2="6"/><Line {...p} x1="9" y1="18" x2="18" y2="9"/></Svg>,
    calendar:  <Svg width={size} height={size} viewBox="0 0 24 24"><Rect {...p} x="3" y="4" width="18" height="18" rx="2"/><Line {...p} x1="16" y1="2" x2="16" y2="6"/><Line {...p} x1="8" y1="2" x2="8" y2="6"/><Line {...p} x1="3" y1="10" x2="21" y2="10"/></Svg>,
    history:   <Svg width={size} height={size} viewBox="0 0 24 24"><Path {...p} d="M3 3v5h5"/><Path {...p} d="M3.05 13A9 9 0 1 0 6 5.3L3 8"/><Line {...p} x1="12" y1="7" x2="12" y2="12"/><Line {...p} x1="12" y1="12" x2="16" y2="14"/></Svg>,
    addChild:  <Svg width={size} height={size} viewBox="0 0 24 24"><Circle {...p} cx="12" cy="12" r="10"/><Line {...p} x1="12" y1="8" x2="12" y2="16"/><Line {...p} x1="8" y1="12" x2="16" y2="12"/></Svg>,
    carnet:    <Svg width={size} height={size} viewBox="0 0 24 24"><Path {...p} d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/><Path {...p} d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/></Svg>,
    check:     <Svg width={size} height={size} viewBox="0 0 24 24"><Polyline {...p} points="20 6 9 17 4 12"/></Svg>,
    alert:     <Svg width={size} height={size} viewBox="0 0 24 24"><Path {...p} d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><Line {...p} x1="12" y1="9" x2="12" y2="13"/><Line {...p} x1="12" y1="17" x2="12.01" y2="17"/></Svg>,
    clock:     <Svg width={size} height={size} viewBox="0 0 24 24"><Circle {...p} cx="12" cy="12" r="10"/><Polyline {...p} points="12 6 12 12 16 14"/></Svg>,
  };
  return map[name] || null;
};

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
  const jours     = Math.floor((new Date() - new Date(dn)) / 86400000);
  const moisTotal = Math.floor(jours / 30.4375);
  const ans       = Math.floor(jours / 365.25);
  if (jours < 1)      return "Aujourd'hui";
  if (jours < 30)     return `${jours} jour${jours > 1 ? 's' : ''}`;
  if (moisTotal < 12) return `${moisTotal} mois`;
  if (ans === 1)      { const r = moisTotal - 12; return r > 0 ? `1 an et ${r} mois` : '1 an'; }
  const r = moisTotal - ans * 12;
  return r > 0 && r < 6 ? `${ans} ans et ${r} mois` : `${ans} ans`;
};

const statutVaccin = (v) => {
  if (v.date_administration) return 'fait';
  if (!v.date_prevue)        return 'a_venir';
  return new Date(v.date_prevue) < new Date() ? 'retard' : 'a_venir';
};

const extraireTableau = (res) => {
  if (!res) return [];
  const d = res.data ?? res;
  if (Array.isArray(d)) return d;
  if (d && Array.isArray(d.data)) return d.data;
  return [];
};

// ─── COMPOSANT PRINCIPAL ─────────────────────────────────────────────────────
export default function DashboardParent({ navigation }) {
  const [loading, setLoading]         = useState(true);
  const [refreshing, setRefreshing]   = useState(false);
  const [parent, setParent]           = useState(null);
  const [enfants, setEnfants]         = useState([]);
  const [enfantActif, setEnfantActif] = useState(null);
  const [vaccins, setVaccins]         = useState([]);
  const [rdvs, setRdvs]               = useState([]);
  const [loadingVacc, setLoadingVacc] = useState(false);
  const [logoutModal, setLogoutModal] = useState(false);
  const [drawerOpen, setDrawerOpen]   = useState(false);
  const [activeNav, setActiveNav]     = useState('home');

  // ── NOUVEAU : états notifications ─────────────────────────────────────────
  const [notifications, setNotifications]     = useState([]);
  const [nbNotifsNonLues, setNbNotifsNonLues] = useState(0);

  const fadeAnim    = useRef(new Animated.Value(0)).current;
  const drawerAnim  = useRef(new Animated.Value(-SW * 0.75)).current;
  const overlayAnim = useRef(new Animated.Value(0)).current;

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

  // ── NOUVEAU : charger les notifications de la mère depuis l'API ──────────
  const chargerNotifications = async () => {
    try {
      const token     = await AsyncStorage.getItem('token');
      const typeUsers = await AsyncStorage.getItem('type_users') ?? 'mere';
      const h = { Authorization: `Bearer ${token}`, 'X-Type-Users': typeUsers };
      const res = await axios.get(`${API_URL}/mere/notifications`, { headers: h });
      setNotifications(res.data.notifications ?? []);
      setNbNotifsNonLues(res.data.nb_non_lues ?? 0);
    } catch (e) {
      console.error('chargerNotifications:', e?.response?.data || e.message);
    }
  };

  // ── NOUVEAU : marquer toutes les notifications comme lues ─────────────────
  const marquerNotificationsLues = async () => {
    try {
      const token     = await AsyncStorage.getItem('token');
      const typeUsers = await AsyncStorage.getItem('type_users') ?? 'mere';
      const h = { Authorization: `Bearer ${token}`, 'X-Type-Users': typeUsers };
      await axios.post(`${API_URL}/mere/notifications/tout-lire`, {}, { headers: h });
      setNbNotifsNonLues(0);
    } catch (e) {
      console.error('marquerNotificationsLues:', e?.response?.data || e.message);
    }
  };

  // ── Charge vaccinations + rendez-vous pour un enfant ─────────────────────
  const chargerDonneesEnfant = async (enfantId, token) => {
    setLoadingVacc(true);
    try {
      const typeUsers = await AsyncStorage.getItem('type_users') ?? 'mere';
      const h = { Authorization: `Bearer ${token}`, 'X-Type-Users': typeUsers };

      const [vacRes, rdvRes] = await Promise.all([
        axios.get(`${API_URL}/parent/enfants/${enfantId}/vaccinations`, { headers: h }),
        axios.get(`${API_URL}/parent/enfants/${enfantId}/rendezvous`,   { headers: h }),
      ]);

      const rawVacc = extraireTableau(vacRes);
      rawVacc.sort((a, b) => {
        const ordre = { fait: 0, retard: 1, a_venir: 2 };
        const sA = statutVaccin(a), sB = statutVaccin(b);
        if (ordre[sA] !== ordre[sB]) return ordre[sA] - ordre[sB];
        const dA = new Date(a.date_administration || a.date_prevue || 0);
        const dB = new Date(b.date_administration || b.date_prevue || 0);
        return dB - dA;
      });
      setVaccins(rawVacc);

      const rawRdv = extraireTableau(rdvRes).map(r => ({
        ...r,
        date_prevue: r.date_prevue ?? r.date_rdv ?? null,
        vaccin:      r.vaccin      ?? r.nom_vaccin ?? null,
      }));
      rawRdv.sort((a, b) => new Date(a.date_prevue || 0) - new Date(b.date_prevue || 0));
      setRdvs(rawRdv);

    } catch (e) {
      console.error('chargerDonneesEnfant:', e?.response?.data || e.message);
      setVaccins([]);
      setRdvs([]);
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

      setParent(profilRes.data?.user ?? profilRes.data);
      const liste = extraireTableau(enfantsRes);
      setEnfants(liste);

      if (liste.length > 0) {
        setEnfantActif(liste[0]);
        await chargerDonneesEnfant(liste[0].id, token);
      }

      // ── NOUVEAU : charger les notifications après les données enfant ──
      await chargerNotifications();

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
    const token = await AsyncStorage.getItem('token');
    await chargerDonneesEnfant(e.id, token);
  };

  const handleLogout = async () => {
    setLogoutModal(false);
    await AsyncStorage.multiRemove(['token', 'type_users', 'user']);
    navigation.replace('Connexion');
  };

  useEffect(() => { charger(); }, []);
  const onRefresh = () => { setRefreshing(true); charger(); };

  // ── Stats calculées ──────────────────────────────────────────────────────
  const nbFaits   = vaccins.filter(v => v.date_administration).length;
  const nbTotal   = vaccins.length;
  const nbRetard  = vaccins.filter(v => statutVaccin(v) === 'retard').length;
  const nbAVenir  = vaccins.filter(v => statutVaccin(v) === 'a_venir').length;
  const pctCouv   = nbTotal > 0 ? Math.round((nbFaits / nbTotal) * 100) : 0;
  const barColor  = pctCouv >= 90 ? C.primary : pctCouv >= 70 ? C.warn : C.danger;
  const aUnRetard = nbRetard > 0;

  const now = new Date();
  const prochainRdv = rdvs.find(r => r.date_prevue && new Date(r.date_prevue) >= now);
  const prochainVaccin = prochainRdv ?? vaccins.find(v => !v.date_administration);

  // Rappels urgents locaux (≤ 7 jours ou en retard)
  const nbUrgentsLocal = rdvs.filter(r => {
    if (!r.date_prevue) return false;
    const j = Math.ceil((new Date(r.date_prevue) - now) / 86400000);
    return j <= 7;
  }).length + nbRetard;

  // ── NOUVEAU : badge total = notifications API + urgents locaux ───────────
  const nbBadgeTotal = nbNotifsNonLues + nbUrgentsLocal;

  if (loading) return (
    <View style={S.loader}>
      <ActivityIndicator size="large" color={C.primary} />
      <Text style={S.loaderT}>Chargement…</Text>
    </View>
  );

  const prenom    = parent?.prenom ?? '';
  const nom       = parent?.nom    ?? '';
  const initiales = (prenom[0] ?? '').toUpperCase() + (nom[0] ?? '').toUpperCase();

  const goTo = (screen, params = {}) => {
    if (!enfantActif && (screen !== 'AjouterEnfant')) return;
    navigation.navigate(screen, params);
  };

  // ── NOUVEAU : navigation vers Rappels avec les notifications passées ──────
  const allerAuxRappels = () => {
    if (!enfantActif) return;
    // Marquer comme lues quand la mère ouvre les rappels
    marquerNotificationsLues();
    navigation.navigate('Rappels', {
      enfantId:      enfantActif.id,
      enfant:        enfantActif,
      notifications: notifications,   // ← on passe les notifs API
    });
  };

  return (
    <SafeAreaView style={S.container}>
      <StatusBar barStyle="light-content" backgroundColor={C.primary} />

      {/* ══ HEADER ══ */}
      <View style={S.header}>
        <View style={S.headerTop}>
          <View style={{ flex: 1 }}>
            <Text style={S.hdrGreeting}>Bonjour</Text>
            <Text style={S.hdrName}>{prenom} {nom}</Text>
          </View>
          <View style={S.hdrActions}>
            {/* ── NOUVEAU : cloche avec badge combiné (API + local) ── */}
            <TouchableOpacity style={S.hdrBtn} onPress={allerAuxRappels}>
              <Icon name="bell" size={20} color="#fff" />
              {nbBadgeTotal > 0 && (
                <View style={S.notifDot}>
                  <Text style={S.notifDotT}>{nbBadgeTotal > 9 ? '9+' : nbBadgeTotal}</Text>
                </View>
              )}
            </TouchableOpacity>
            <TouchableOpacity style={S.hdrBtn} onPress={openDrawer}>
              <Icon name="menu" size={22} color="#fff" />
            </TouchableOpacity>
          </View>
        </View>

        {/* Chips enfants */}
        {enfants.length > 0 && (
          <ScrollView horizontal showsHorizontalScrollIndicator={false}
            style={{ marginTop: 12 }} contentContainerStyle={{ paddingRight: 6 }}>
            {enfants.map((e) => (
              <TouchableOpacity key={e.id}
                style={[S.chipEnfant, enfantActif?.id === e.id && S.chipEnfantActif]}
                onPress={() => selectionnerEnfant(e)}>
                <Text style={[S.chipEnfantT, enfantActif?.id === e.id && S.chipEnfantTActif]}>
                  {e.prenom}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        )}
      </View>

      {/* ══ CONTENU ══ */}
      <Animated.View style={{ flex: 1, opacity: fadeAnim }}>
        <ScrollView style={S.scroll} showsVerticalScrollIndicator={false}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[C.primary]} />}>

          {enfantActif ? (
            <>
              {/* ── Carte enfant + couverture ─── */}
              <View style={S.card}>
                <View style={S.ficheHead}>
                  <View style={{ flex: 1 }}>
                    <Text style={S.ficheNom}>{enfantActif.prenom} {enfantActif.nom}</Text>
                    <Text style={S.ficheMeta}>
                      {enfantActif.sexe === 'F' ? 'Née' : 'Né'} le {formatDate(enfantActif.date_naissance)}
                    </Text>
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
                  <Text style={S.progSub}>
                    {nbFaits} vaccin{nbFaits !== 1 ? 's' : ''} administré{nbFaits !== 1 ? 's' : ''} sur {nbTotal}
                    {nbRetard > 0 ? `  ·  ⚠ ${nbRetard} en retard` : ''}
                  </Text>
                </View>

                {/* Mini stats inline */}
                <View style={S.miniStats}>
                  {[
                    { val: nbFaits,  label: 'Reçus',     color: C.success, icon: 'check' },
                    { val: nbRetard, label: 'En retard',  color: C.danger,  icon: 'alert' },
                    { val: nbAVenir, label: 'À venir',    color: C.warn,    icon: 'clock' },
                  ].map((s, i) => (
                    <React.Fragment key={i}>
                      {i > 0 && <View style={S.miniStatSep} />}
                      <View style={S.miniStat}>
                        <Icon name={s.icon} size={13} color={s.color} sw={2.2} />
                        <Text style={[S.miniStatVal, { color: s.color }]}>{s.val}</Text>
                        <Text style={S.miniStatLabel}>{s.label}</Text>
                      </View>
                    </React.Fragment>
                  ))}
                </View>
              </View>

              {/* ── NOUVEAU : Bannière notifications non lues ─── */}
              {nbNotifsNonLues > 0 && (
                <TouchableOpacity style={S.notifBanner} activeOpacity={0.85} onPress={allerAuxRappels}>
                  <View style={S.notifBannerIco}>
                    <Icon name="bell" size={16} color={C.violet} sw={2} />
                  </View>
                  <Text style={S.notifBannerT}>
                    {nbNotifsNonLues} nouveau{nbNotifsNonLues > 1 ? 'x' : ''} rappel{nbNotifsNonLues > 1 ? 's' : ''} vaccinal{nbNotifsNonLues > 1 ? 'aux' : ''}
                  </Text>
                  <Icon name="chevron" size={14} color={C.violet} sw={2} />
                </TouchableOpacity>
              )}

              {/* ── Prochain rendez-vous / vaccin ─── */}
              {prochainVaccin && (
                <TouchableOpacity style={S.nextCard} activeOpacity={0.85}
                  onPress={() => goTo('RendezVous', { enfantId: enfantActif.id, enfant: enfantActif })}>
                  <View style={S.nextLeft}>
                    <Text style={S.nextLabel}>
                      {prochainRdv ? 'Prochain rendez-vous' : 'Prochain vaccin à prévoir'}
                    </Text>
                    <Text style={S.nextNom}>
                      {prochainVaccin.vaccin || prochainVaccin.nom_vaccin || '—'}
                    </Text>
                    {prochainVaccin.date_prevue && (
                      <Text style={S.nextDate}>{formatDate(prochainVaccin.date_prevue)}</Text>
                    )}
                  </View>
                  <View style={{ alignItems: 'flex-end', gap: 6 }}>
                    <View style={S.nextBadge}>
                      <Text style={S.nextBadgeT}>{calculerAge(enfantActif.date_naissance)}</Text>
                    </View>
                    <Icon name="chevron" size={16} color={C.success} sw={2} />
                  </View>
                </TouchableOpacity>
              )}

              {/* ── Alerte retard ─── */}
              {nbRetard > 0 && (
                <TouchableOpacity style={S.alerteCard} activeOpacity={0.85} onPress={allerAuxRappels}>
                  <Icon name="alert" size={18} color={C.danger} sw={2.2} />
                  <Text style={S.alerteT}>
                    {nbRetard} vaccin{nbRetard > 1 ? 's' : ''} en retard — appuyez pour voir les rappels
                  </Text>
                  <Icon name="chevron" size={14} color={C.danger} sw={2} />
                </TouchableOpacity>
              )}

              {/* ── Grille actions 2×2 ─── */}
              <View style={S.actionsGrid}>
                <View style={S.actionsRow}>
                  <TouchableOpacity style={[S.actionBtn, { backgroundColor: C.primary }]}
                    onPress={() => goTo('RendezVous', { enfantId: enfantActif.id, enfant: enfantActif })}
                    activeOpacity={0.85}>
                    <Icon name="calendar" size={20} color="#fff" />
                    <Text style={S.actionBtnT}>Rendez-vous</Text>
                    {rdvs.filter(r => r.date_prevue && new Date(r.date_prevue) >= now).length > 0 && (
                      <View style={S.actionBadge}>
                        <Text style={S.actionBadgeT}>
                          {rdvs.filter(r => r.date_prevue && new Date(r.date_prevue) >= now).length}
                        </Text>
                      </View>
                    )}
                  </TouchableOpacity>

                  {/* ── NOUVEAU : bouton Rappels avec badge combiné ── */}
                  <TouchableOpacity style={[S.actionBtn, { backgroundColor: C.violet }]}
                    onPress={allerAuxRappels}
                    activeOpacity={0.85}>
                    <Icon name="bell" size={20} color="#fff" />
                    <Text style={S.actionBtnT}>Rappels</Text>
                    {nbBadgeTotal > 0 && (
                      <View style={S.actionBadge}>
                        <Text style={S.actionBadgeT}>{nbBadgeTotal}</Text>
                      </View>
                    )}
                  </TouchableOpacity>
                </View>

                <View style={S.actionsRow}>
                  <TouchableOpacity style={[S.actionBtn, { backgroundColor: C.amber }]}
                    onPress={() => goTo('HistoriqueVaccins', { enfantId: enfantActif.id, enfant: enfantActif })}
                    activeOpacity={0.85}>
                    <Icon name="history" size={20} color="#fff" />
                    <Text style={S.actionBtnT}>Historique</Text>
                    {nbFaits > 0 && (
                      <View style={S.actionBadge}>
                        <Text style={S.actionBadgeT}>{nbFaits}</Text>
                      </View>
                    )}
                  </TouchableOpacity>

                  <TouchableOpacity style={[S.actionBtn, { backgroundColor: C.success }]}
                    onPress={() => navigation.navigate('AjouterEnfant', { onSuccess: charger })}
                    activeOpacity={0.85}>
                    <Icon name="addChild" size={20} color="#fff" />
                    <Text style={S.actionBtnT}>Ajouter enfant</Text>
                  </TouchableOpacity>
                </View>
              </View>

              {/* ── Carnet vaccinal inline ─── */}
              <View style={[S.card, { marginTop: 8 }]}>
                <View style={S.secHead}>
                  <View style={S.secLine} />
                  <Text style={S.secHeadT}>CARNET VACCINAL — {enfantActif.prenom?.toUpperCase()}</Text>
                  <TouchableOpacity style={S.voirToutBtn}
                    onPress={() => goTo('CarnetVaccinal', { enfantId: enfantActif.id, enfant: enfantActif })}>
                    <Text style={S.voirToutT}>Voir tout</Text>
                    <Icon name="chevron" size={13} color={C.primary} sw={2} />
                  </TouchableOpacity>
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
                  <View style={S.vide}>
                    <Icon name="syringe" size={32} color={C.textLight} sw={1.5} />
                    <Text style={S.videT}>Aucune vaccination enregistrée</Text>
                    <Text style={S.videSubT}>
                      Les vaccins apparaîtront ici une fois enregistrés dans le système.
                    </Text>
                  </View>
                ) : vaccins.slice(0, 6).map((v, i) => {
                  const statut    = statutVaccin(v);
                  const estFait   = statut === 'fait';
                  const estRetard = statut === 'retard';
                  const chipBg    = estFait ? '#d1fae5' : estRetard ? '#fee2e2' : '#fef3c7';
                  const chipColor = estFait ? C.success  : estRetard ? C.danger  : C.warn;
                  return (
                    <View key={i} style={[S.vaccinLigne, { borderLeftColor: chipColor },
                      i < Math.min(vaccins.length, 6) - 1 && S.vaccinSep]}>
                      <View style={{ flex: 1 }}>
                        <Text style={S.vaccinNom}>{v.vaccin || v.nom_vaccin || '—'}</Text>
                        <Text style={S.vaccinMeta}>
                          {estFait
                            ? `Administré le ${formatDateCourt(v.date_administration)}${v.centre_sante?.nom ? ` · ${v.centre_sante.nom}` : ''}`
                            : estRetard
                            ? `⚠ En retard — prévu le ${formatDateCourt(v.date_prevue)}`
                            : v.date_prevue
                              ? `Prévu le ${formatDateCourt(v.date_prevue)}`
                              : 'Date non planifiée'}
                        </Text>
                      </View>
                      <View style={[S.chipVacc, { backgroundColor: chipBg }]}>
                        <Text style={[S.chipVaccT, { color: chipColor }]}>
                          {estFait ? 'Fait' : estRetard ? 'Retard' : 'À venir'}
                        </Text>
                      </View>
                    </View>
                  );
                })}

                {vaccins.length > 6 && (
                  <TouchableOpacity style={S.voirPlusBtn}
                    onPress={() => goTo('CarnetVaccinal', { enfantId: enfantActif.id, enfant: enfantActif })}>
                    <Text style={S.voirPlusBtnT}>
                      Voir les {vaccins.length - 6} autres vaccins →
                    </Text>
                  </TouchableOpacity>
                )}
              </View>
            </>
          ) : (
            /* ── Aucun enfant ─── */
            <View style={S.emptyState}>
              <View style={S.emptyIco}>
                <Icon name="addChild" size={36} color={C.primary} sw={1.8} />
              </View>
              <Text style={S.emptyTitle}>Aucun enfant enregistré</Text>
              <Text style={S.emptySub}>
                Ajoutez votre premier enfant pour commencer le suivi vaccinal.
              </Text>
              <TouchableOpacity style={S.emptyBtn}
                onPress={() => navigation.navigate('AjouterEnfant', { onSuccess: charger })}>
                <Icon name="addChild" size={16} color="#fff" sw={2} />
                <Text style={S.emptyBtnT}>Ajouter un enfant</Text>
              </TouchableOpacity>
            </View>
          )}

          <View style={{ height: 90 }} />
        </ScrollView>
      </Animated.View>

      {/* ══ NAVBAR BOTTOM ══ */}
      <View style={S.navbar}>
        {[
          { key: 'home',    icon: 'home',   label: 'Accueil', action: () => setActiveNav('home') },
          { key: 'carnet',  icon: 'carnet', label: 'Carnet',  action: () => { setActiveNav('carnet');  navigation.navigate('CarnetVaccinal', { enfantId: enfantActif?.id, enfant: enfantActif }); } },
          { key: 'contact', icon: 'phone',  label: 'Contact', action: () => { setActiveNav('contact'); navigation.navigate('Contact'); } },
          { key: 'profil',  icon: 'user',   label: 'Profil',  action: () => { setActiveNav('profil');  navigation.navigate('Profil'); } },
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

      {/* ══ DRAWER ══ */}
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
              <Text style={S.drawerRole}>Parent · {enfants.length} enfant{enfants.length !== 1 ? 's' : ''}</Text>
            </View>
            <View style={S.drawerMenu}>
              {[
                { label: 'Mon profil',     icon: 'user',     route: 'Profil'        },
                { label: 'Ajouter enfant', icon: 'addChild', route: 'AjouterEnfant', params: { onSuccess: charger } },
                { label: 'Mon relais',     icon: 'phone',    route: 'MonRelais'     },
                { label: 'Paramètres',     icon: 'settings', route: 'Parametres'    },
              ].map(item => (
                <TouchableOpacity key={item.route} style={S.drawerItem}
                  onPress={() => { closeDrawer(); navigation.navigate(item.route, item.params ?? {}); }}
                  activeOpacity={0.8}>
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

      {/* ══ MODAL DÉCONNEXION ══ */}
      <Modal visible={logoutModal} transparent animationType="fade" onRequestClose={() => setLogoutModal(false)}>
        <View style={S.modalOverlay}>
          <View style={S.modalCard}>
            <View style={S.modalIco}>
              <Icon name="logout" size={28} color={C.danger} />
            </View>
            <Text style={S.modalTitle}>Déconnexion</Text>
            <Text style={S.modalBody}>Voulez-vous vraiment vous déconnecter de VacciBénin ?</Text>
            <View style={S.modalBtns}>
              <TouchableOpacity style={[S.modalBtn, { backgroundColor: '#f3f4f6' }]}
                onPress={() => setLogoutModal(false)} activeOpacity={0.8}>
                <Text style={[S.modalBtnT, { color: C.textMid }]}>Annuler</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[S.modalBtn, { backgroundColor: C.danger }]}
                onPress={handleLogout} activeOpacity={0.8}>
                <Text style={[S.modalBtnT, { color: C.white }]}>Déconnexion</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

// ─── STYLES ──────────────────────────────────────────────────────────────────
const S = StyleSheet.create({
  container: { flex: 1, backgroundColor: C.bg },
  loader:    { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: C.bg },
  loaderT:   { marginTop: 12, color: C.primary, fontSize: 13, fontWeight: '500' },
  scroll:    { flex: 1 },

  header:      { backgroundColor: C.primary, paddingHorizontal: 16, paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight + 12 : 14, paddingBottom: 14 },
  headerTop:   { flexDirection: 'row', alignItems: 'center' },
  hdrGreeting: { fontSize: 11, color: 'rgba(255,255,255,0.6)', letterSpacing: 0.3 },
  hdrName:     { fontSize: 18, fontWeight: '600', color: '#fff', marginTop: 1 },
  hdrActions:  { flexDirection: 'row', alignItems: 'center', gap: 8 },
  hdrBtn:      { padding: 8, position: 'relative' },
  notifDot:    { position: 'absolute', top: 4, right: 4, backgroundColor: C.danger, borderRadius: 8, minWidth: 16, height: 16, justifyContent: 'center', alignItems: 'center', paddingHorizontal: 3, borderWidth: 1.5, borderColor: C.primary },
  notifDotT:   { fontSize: 8, fontWeight: '800', color: '#fff' },

  chipEnfant:       { borderWidth: 1.5, borderColor: 'rgba(255,255,255,0.35)', borderRadius: 20, paddingHorizontal: 14, paddingVertical: 6, marginRight: 8 },
  chipEnfantActif:  { backgroundColor: '#fff', borderColor: '#fff' },
  chipEnfantT:      { fontSize: 12, fontWeight: '500', color: 'rgba(255,255,255,0.8)' },
  chipEnfantTActif: { color: C.primary, fontWeight: '700' },

  // NOUVEAU : bannière notifications
  notifBanner:    { flexDirection: 'row', alignItems: 'center', gap: 10, backgroundColor: '#f5f3ff', borderLeftWidth: 3, borderLeftColor: C.violet, borderRadius: 12, marginHorizontal: 12, marginTop: 10, padding: 12 },
  notifBannerIco: { width: 30, height: 30, borderRadius: 15, backgroundColor: '#ede9fe', justifyContent: 'center', alignItems: 'center' },
  notifBannerT:   { flex: 1, fontSize: 13, color: C.violet, fontWeight: '600' },

  card: { backgroundColor: C.white, borderRadius: 14, padding: 14, marginHorizontal: 12, marginTop: 12, borderWidth: 0.5, borderColor: '#e5e7eb', elevation: 1, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 4 },

  ficheHead:   { flexDirection: 'row', alignItems: 'center', marginBottom: 14 },
  ficheNom:    { fontSize: 15, fontWeight: '600', color: C.textDark },
  ficheMeta:   { fontSize: 11, color: C.textLight, marginTop: 2 },
  ficheAge:    { fontSize: 12, fontWeight: '600', color: C.primary, marginTop: 3 },
  badgeStatut: { flexDirection: 'row', alignItems: 'center', gap: 4, borderRadius: 20, paddingHorizontal: 9, paddingVertical: 4 },
  badgeOk:     { backgroundColor: '#ecfdf5' },
  badgeRetard: { backgroundColor: '#fef2f2' },
  badgeDot:    { width: 6, height: 6, borderRadius: 3 },
  badgeStatutT:{ fontSize: 10, fontWeight: '600' },

  progSection: { borderTopWidth: 0.5, borderTopColor: '#f3f4f6', paddingTop: 12 },
  progRow:     { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6 },
  progLabel:   { fontSize: 11, color: C.textMid },
  progPct:     { fontSize: 12, fontWeight: '700' },
  progBg:      { height: 6, backgroundColor: '#f3f4f6', borderRadius: 4, overflow: 'hidden', marginBottom: 5 },
  progFill:    { height: '100%', borderRadius: 4 },
  progSub:     { fontSize: 10, color: C.textLight },

  miniStats:    { flexDirection: 'row', marginTop: 12, backgroundColor: '#f9fafb', borderRadius: 10, padding: 10 },
  miniStat:     { flex: 1, alignItems: 'center', gap: 2 },
  miniStatVal:  { fontSize: 16, fontWeight: '800' },
  miniStatLabel:{ fontSize: 9, color: C.textLight },
  miniStatSep:  { width: 1, backgroundColor: '#e5e7eb', marginVertical: 2 },

  nextCard:  { backgroundColor: '#ecfdf5', borderRadius: 14, padding: 14, marginHorizontal: 12, marginTop: 8, flexDirection: 'row', alignItems: 'center', borderLeftWidth: 3, borderLeftColor: C.success, borderWidth: 0.5, borderColor: '#a7f3d0' },
  nextLeft:  { flex: 1 },
  nextLabel: { fontSize: 10, color: C.textMid, textTransform: 'uppercase', letterSpacing: 0.4 },
  nextNom:   { fontSize: 14, fontWeight: '600', color: C.textDark, marginTop: 2 },
  nextDate:  { fontSize: 11, color: C.textMid, marginTop: 3 },
  nextBadge: { backgroundColor: C.primary, borderRadius: 20, paddingHorizontal: 10, paddingVertical: 5, marginBottom: 4 },
  nextBadgeT:{ fontSize: 11, fontWeight: '600', color: '#fff' },

  alerteCard: { flexDirection: 'row', alignItems: 'center', gap: 10, backgroundColor: '#fef2f2', borderLeftWidth: 3, borderLeftColor: C.danger, borderRadius: 12, marginHorizontal: 12, marginTop: 8, padding: 12 },
  alerteT:    { flex: 1, fontSize: 12, color: C.danger, fontWeight: '500', lineHeight: 17 },

  actionsGrid:  { paddingHorizontal: 12, marginTop: 8, gap: 8 },
  actionsRow:   { flexDirection: 'row', gap: 8 },
  actionBtn:    { flex: 1, borderRadius: 12, paddingVertical: 14, alignItems: 'center', gap: 6, flexDirection: 'row', justifyContent: 'center', position: 'relative' },
  actionBtnT:   { color: '#fff', fontSize: 12, fontWeight: '600' },
  actionBadge:  { position: 'absolute', top: 6, right: 8, backgroundColor: 'rgba(255,255,255,0.3)', borderRadius: 10, minWidth: 18, height: 18, justifyContent: 'center', alignItems: 'center', paddingHorizontal: 4 },
  actionBadgeT: { fontSize: 9, fontWeight: '800', color: '#fff' },

  secHead:     { flexDirection: 'row', alignItems: 'center', marginBottom: 10, gap: 8 },
  secLine:     { width: 3, height: 14, backgroundColor: C.primary, borderRadius: 2 },
  secHeadT:    { flex: 1, fontSize: 10, fontWeight: '700', color: C.textDark, letterSpacing: 0.5 },
  voirToutBtn: { flexDirection: 'row', alignItems: 'center', gap: 2 },
  voirToutT:   { fontSize: 11, color: C.primary, fontWeight: '600' },

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

  voirPlusBtn:  { alignItems: 'center', paddingVertical: 12, borderTopWidth: 0.5, borderTopColor: '#f3f4f6', marginTop: 4 },
  voirPlusBtnT: { fontSize: 12, color: C.primary, fontWeight: '600' },

  vide:     { alignItems: 'center', paddingVertical: 24, gap: 8 },
  videT:    { color: C.textLight, fontSize: 13, fontWeight: '500' },
  videSubT: { color: C.textLight, fontSize: 11, textAlign: 'center', lineHeight: 16, paddingHorizontal: 20 },

  emptyState: { alignItems: 'center', paddingVertical: 60, paddingHorizontal: 30, gap: 14 },
  emptyIco:   { width: 80, height: 80, borderRadius: 40, backgroundColor: '#f0fdf4', justifyContent: 'center', alignItems: 'center', marginBottom: 4 },
  emptyTitle: { fontSize: 16, fontWeight: '600', color: C.textDark },
  emptySub:   { fontSize: 13, color: C.textLight, textAlign: 'center', lineHeight: 19 },
  emptyBtn:   { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: C.primary, borderRadius: 12, paddingHorizontal: 20, paddingVertical: 12, marginTop: 6 },
  emptyBtnT:  { fontSize: 14, fontWeight: '700', color: '#fff' },

  navbar:        { flexDirection: 'row', backgroundColor: C.white, paddingBottom: Platform.OS === 'ios' ? 24 : 8, paddingTop: 8, borderTopWidth: 1, borderTopColor: '#f0f0f0', shadowColor: '#000', shadowOffset: { width: 0, height: -2 }, shadowOpacity: 0.04, shadowRadius: 8, elevation: 6 },
  navItem:       { flex: 1, alignItems: 'center', gap: 3, position: 'relative' },
  navLabel:      { fontSize: 10, color: C.textLight, fontWeight: '500' },
  navLabelActif: { color: C.primary, fontWeight: '700' },
  navDot:        { position: 'absolute', top: -8, width: 4, height: 4, borderRadius: 2, backgroundColor: C.primary },

  drawerOverlay:   { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(6,95,70,0.25)' },
  drawer:          { position: 'absolute', top: 0, bottom: 0, left: 0, width: SW * 0.75, backgroundColor: C.white, elevation: 12, shadowColor: '#000', shadowOffset: { width: 4, height: 0 }, shadowOpacity: 0.12, shadowRadius: 16 },
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

  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.45)', justifyContent: 'center', alignItems: 'center', padding: 24 },
  modalCard:    { backgroundColor: C.white, borderRadius: 20, padding: 28, width: '100%', maxWidth: 340, alignItems: 'center', elevation: 12 },
  modalIco:     { width: 64, height: 64, borderRadius: 32, backgroundColor: '#fee2e2', justifyContent: 'center', alignItems: 'center', marginBottom: 16 },
  modalTitle:   { fontSize: 18, fontWeight: '800', color: C.textDark, marginBottom: 8 },
  modalBody:    { fontSize: 14, color: C.textMid, textAlign: 'center', lineHeight: 20, marginBottom: 24 },
  modalBtns:    { flexDirection: 'row', gap: 12, width: '100%' },
  modalBtn:     { flex: 1, paddingVertical: 13, borderRadius: 12, alignItems: 'center' },
  modalBtnT:    { fontSize: 14, fontWeight: '700' },
});