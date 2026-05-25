import React, { useState, useEffect, useRef } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, StyleSheet,
  SafeAreaView, StatusBar, Animated, Modal,
  ActivityIndicator, Dimensions, Platform, Linking,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useNavigation } from '@react-navigation/native';
import axios from 'axios';
import { API_URL } from './config';
import Svg, { Path, Circle, Line, Polyline, Rect, Polygon } from 'react-native-svg';

const { width: SW } = Dimensions.get('window');

// ─── PALETTE (identique au Responsable) ──────────────────────────────────────
const C = {
  primary:   '#065f46',
  accent:    '#10b981',
  bg:        '#f0f4f3',
  white:     '#ffffff',
  textDark:  '#0f2d23',
  textMid:   '#3d6b58',
  textLight: '#6b9e87',
  danger:    '#dc2626',
  warn:      '#d97706',
  info:      '#0284c7',
  success:   '#059669',
};

// ─── SVG ICONS (identique au Responsable) ────────────────────────────────────
const Icon = ({ name, size = 22, color = C.primary, sw = 1.8 }) => {
  const p = { stroke: color, strokeWidth: sw, fill: 'none', strokeLinecap: 'round', strokeLinejoin: 'round' };
  const map = {
    syringe:   <Svg width={size} height={size} viewBox="0 0 24 24"><Line {...p} x1="3" y1="21" x2="7" y2="17"/><Line {...p} x1="7" y1="17" x2="16" y2="8"/><Line {...p} x1="16" y1="8" x2="20" y2="4"/><Line {...p} x1="18" y1="2" x2="22" y2="6"/><Line {...p} x1="6" y1="15" x2="15" y2="6"/><Line {...p} x1="9" y1="18" x2="18" y2="9"/><Line {...p} x1="10" y1="10" x2="12" y2="12"/><Line {...p} x1="12" y1="8" x2="14" y2="10"/></Svg>,
    bell:      <Svg width={size} height={size} viewBox="0 0 24 24"><Path {...p} d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><Path {...p} d="M13.73 21a2 2 0 0 1-3.46 0"/></Svg>,
    menu:      <Svg width={size} height={size} viewBox="0 0 24 24"><Line {...p} x1="3" y1="6" x2="21" y2="6"/><Line {...p} x1="3" y1="12" x2="21" y2="12"/><Line {...p} x1="3" y1="18" x2="21" y2="18"/></Svg>,
    home:      <Svg width={size} height={size} viewBox="0 0 24 24"><Path {...p} d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><Polyline {...p} points="9 22 9 12 15 12 15 22"/></Svg>,
    calendar:  <Svg width={size} height={size} viewBox="0 0 24 24"><Rect {...p} x="3" y="4" width="18" height="18" rx="2" ry="2"/><Line {...p} x1="16" y1="2" x2="16" y2="6"/><Line {...p} x1="8" y1="2" x2="8" y2="6"/><Line {...p} x1="3" y1="10" x2="21" y2="10"/></Svg>,
    alert:     <Svg width={size} height={size} viewBox="0 0 24 24"><Polygon {...p} points="10.29 3.86 1.82 18 22.18 18 13.71 3.86 10.29 3.86"/><Line {...p} x1="12" y1="9" x2="12" y2="13"/><Line {...p} x1="12" y1="17" x2="12.01" y2="17"/></Svg>,
    user:      <Svg width={size} height={size} viewBox="0 0 24 24"><Path {...p} d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><Circle {...p} cx="12" cy="7" r="4"/></Svg>,
    users:     <Svg width={size} height={size} viewBox="0 0 24 24"><Path {...p} d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><Circle {...p} cx="9" cy="7" r="4"/><Path {...p} d="M23 21v-2a4 4 0 0 0-3-3.87"/><Path {...p} d="M16 3.13a4 4 0 0 1 0 7.75"/></Svg>,
    logout:    <Svg width={size} height={size} viewBox="0 0 24 24"><Path {...p} d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><Polyline {...p} points="16 17 21 12 16 7"/><Line {...p} x1="21" y1="12" x2="9" y2="12"/></Svg>,
    settings:  <Svg width={size} height={size} viewBox="0 0 24 24"><Circle {...p} cx="12" cy="12" r="3"/><Path {...p} d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/></Svg>,
    addUser:   <Svg width={size} height={size} viewBox="0 0 24 24"><Path {...p} d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><Circle {...p} cx="9" cy="7" r="4"/><Line {...p} x1="19" y1="8" x2="19" y2="14"/><Line {...p} x1="22" y1="11" x2="16" y2="11"/></Svg>,
    clock:     <Svg width={size} height={size} viewBox="0 0 24 24"><Circle {...p} cx="12" cy="12" r="10"/><Polyline {...p} points="12 6 12 12 16 14"/></Svg>,
    chevron:   <Svg width={size} height={size} viewBox="0 0 24 24"><Polyline {...p} points="9 18 15 12 9 6"/></Svg>,
    phone:     <Svg width={size} height={size} viewBox="0 0 24 24"><Path {...p} d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.69 12 19.79 19.79 0 0 1 1.61 3.4 2 2 0 0 1 3.6 1.22h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L7.91 8.82a16 16 0 0 0 6.29 6.29l.95-.95a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 22 16.92z"/></Svg>,
    mapPin:    <Svg width={size} height={size} viewBox="0 0 24 24"><Path {...p} d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><Circle {...p} cx="12" cy="10" r="3"/></Svg>,
    clipboard: <Svg width={size} height={size} viewBox="0 0 24 24"><Path {...p} d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"/><Rect {...p} x="8" y="2" width="8" height="4" rx="1" ry="1"/><Line {...p} x1="9" y1="12" x2="15" y2="12"/><Line {...p} x1="9" y1="16" x2="12" y2="16"/></Svg>,
    check:     <Svg width={size} height={size} viewBox="0 0 24 24"><Polyline {...p} points="20 6 9 17 4 12"/></Svg>,
  };
  return map[name] || null;
};

// ─── BADGE ───
const Badge = ({ count }) => {
  if (!count) return null;
  return (
    <View style={S.badge}>
      <Text style={S.badgeT}>{count > 9 ? '9+' : count}</Text>
    </View>
  );
};

// ─── HELPERS ─
const joursJ = (d) => {
  if (!d) return null;
  return Math.ceil((new Date(d) - new Date()) / 86400000);
};

// ─── CHIP DÉLAI ───────────────────────────────────────────────────────────────
const ChipJ = ({ dateStr }) => {
  const j = joursJ(dateStr);
  if (j === null) return null;
  const [bg, tc, txt] =
    j < 0   ? [C.danger  + '18', C.danger,  `${Math.abs(j)}j retard`] :
    j === 0 ? [C.warn    + '18', C.warn,    "Aujourd'hui"]             :
              [C.success + '18', C.success, `J-${j}`];
  return (
    <View style={[S.chip, { backgroundColor: bg }]}>
      <Text style={[S.chipT, { color: tc }]}>{txt}</Text>
    </View>
  );
};

// ─── CARTE ENFANT ─────────────────────────────────────────────────────────────
const CarteEnfant = ({ enfant, mode, onPress }) => {
  const isRetard = mode === 'retard';
  const accent   = isRetard ? C.warn : C.info;

  return (
    <TouchableOpacity
      style={[S.enfantRow, { borderLeftColor: accent }]}
      onPress={onPress}
      activeOpacity={0.8}
    >
      <View style={[S.enfantDot, { backgroundColor: accent }]} />
      <View style={S.enfantInfo}>
        <Text style={S.enfantNom}>{enfant.prenom} {enfant.nom}</Text>
        <Text style={S.enfantSub}>
          {enfant.age || '—'}
          {enfant.prochainVaccin ? `  ·  ${enfant.prochainVaccin}` : ''}
        </Text>
      </View>

      {isRetard ? (
        <View style={[S.enfantBadge, { backgroundColor: C.warn + '18' }]}>
          <Text style={[S.enfantBadgeT, { color: C.warn }]}>
            {enfant.joursRetard ? `${enfant.joursRetard}j` : 'Retard'}
          </Text>
        </View>
      ) : (
        <ChipJ dateStr={enfant.dateRdv} />
      )}

      {enfant.telephoneMere ? (
        <TouchableOpacity
          onPress={() => Linking.openURL(`tel:${enfant.telephoneMere}`)}
          style={S.telBtn}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        >
          <Icon name="phone" size={16} color={C.primary} />
        </TouchableOpacity>
      ) : (
        <Icon name="chevron" size={15} color={C.textLight} />
      )}
    </TouchableOpacity>
  );
};

// ─── COMPOSANT PRINCIPAL ──────────────────────────────────────────────────────
export default function DashboardAgent() {
  const navigation = useNavigation();

  const [userData, setUserData]       = useState(null);
  const [agentData, setAgentData]     = useState(null);
  const [loading, setLoading]         = useState(true);
  const [activeTab, setActiveTab]     = useState('dashboard');
  const [drawerOpen, setDrawerOpen]   = useState(false);
  const [logoutModal, setLogoutModal] = useState(false);
  const [suiviOnglet, setSuiviOnglet] = useState('rdv');

  const [stats, setStats]                     = useState({});
  const [rdvProchains, setRdvProchains]       = useState([]);
  const [enfantsEnRetard, setEnfantsEnRetard] = useState([]);

  const drawerAnim  = useRef(new Animated.Value(-SW * 0.75)).current;
  const overlayAnim = useRef(new Animated.Value(0)).current;

  // ── Chargement ───────────────────────────────────────────────────────────────
  useEffect(() => { loadData(); }, []);

  const loadData = async () => {
    try {
      const token = await AsyncStorage.getItem('token');
      const user  = JSON.parse(await AsyncStorage.getItem('user') || '{}');
      setUserData(user);

      const h = { Authorization: `Bearer ${token}` };
      const res = await axios.get(`${API_URL}/agent/dashboard`, { headers: h });

      if (res.data?.success) {
        const d = res.data;
        setAgentData(d.agent || null);
        setStats(d.stats || {});
        setRdvProchains(d.rdvProchains || []);
        setEnfantsEnRetard(d.enfantsEnRetard || []);
      }
    } catch (e) {
      console.error('DashboardAgent:', e?.response?.data || e.message);
    } finally {
      setLoading(false);
    }
  };

  // ── Drawer ──
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

  // ── Déconnexion ──────────────────────────────────────────────────────────────
  const handleLogout = async () => {
    try {
      const token = await AsyncStorage.getItem('token');
      await axios.post(`${API_URL}/logout`, {}, { headers: { Authorization: `Bearer ${token}` } });
    } catch (_) {}
    await AsyncStorage.multiRemove(['token', 'user']);
    navigation.reset({ index: 0, routes: [{ name: 'Login' }] });
  };

  if (loading) return (
    <View style={S.loader}>
      <Icon name="syringe" size={36} color={C.primary} />
      <ActivityIndicator color={C.primary} size="large" style={{ marginTop: 16 }} />
      <Text style={S.loaderT}>Chargement…</Text>
    </View>
  );

  const prenom   = agentData?.prenom || userData?.prenom || 'Agent';
  const nom      = agentData?.nom    || userData?.nom    || '';
  const centre   = agentData?.centre || userData?.centre || '';
  const initiales = (prenom[0] || '').toUpperCase() + (nom[0] || '').toUpperCase();
  const suiviListe = suiviOnglet === 'rdv' ? rdvProchains : enfantsEnRetard;

  // ── Onglet Dashboard ─────────────────────────────────────────────────────────
  const renderDashboard = () => (
    <View style={S.page}>

      {/* Salutation */}
      <View style={S.greetRow}>
        <View>
          <Text style={S.greetName}>Bonjour, {prenom}</Text>
          <Text style={S.greetDate}>
            {new Date().toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' })}
          </Text>
        </View>
        {centre ? (
          <View style={S.centreChip}>
            <Icon name="mapPin" size={13} color={C.primary} />
            <Text style={S.centreChipT}>{centre}</Text>
          </View>
        ) : null}
      </View>

      {/* Stats 2×2 */}
      <View style={S.statsGrid}>
        {[
          { label: 'Vaccinations\naujourd\'hui', value: stats.vaccinesAujourdhui ?? 0, icon: 'syringe',   color: C.primary },
          { label: 'RDV\naujourd\'hui',          value: stats.rdvAujourdhui      ?? 0, icon: 'calendar',  color: C.info    },
          { label: 'Enfants\nen retard',          value: stats.enfantsEnRetard   ?? 0, icon: 'alert',     color: (stats.enfantsEnRetard ?? 0) > 0 ? C.warn : C.textLight },
          { label: 'Vaccinations\nce mois',       value: stats.vaccinationsMois  ?? 0, icon: 'clipboard', color: C.success },
        ].map((s, i) => (
          <View key={i} style={S.statCard}>
            <View style={[S.statIco, { backgroundColor: s.color + '18' }]}>
              <Icon name={s.icon} size={20} color={s.color} />
            </View>
            <Text style={[S.statVal, i === 2 && (stats.enfantsEnRetard ?? 0) > 0 && { color: C.warn }]}>
              {s.value}
            </Text>
            <Text style={S.statLbl}>{s.label}</Text>
          </View>
        ))}
      </View>

      {/* Suivi des enfants — toggle */}
      <View style={S.suiviHead}>
        <Icon name="users" size={15} color={C.textLight} />
        <Text style={S.suiviHeadT}>SUIVI DES ENFANTS</Text>
      </View>

      <View style={S.toggleRow}>
        <TouchableOpacity
          style={[S.toggleBtn, suiviOnglet === 'rdv' && S.toggleBtnActive]}
          onPress={() => setSuiviOnglet('rdv')}
          activeOpacity={0.8}
        >
          <Icon name="clock" size={14} color={suiviOnglet === 'rdv' ? C.white : C.textMid} />
          <Text style={[S.toggleT, suiviOnglet === 'rdv' && S.toggleTA]}>RDV à venir</Text>
          <View style={[S.toggleBadge, suiviOnglet === 'rdv' && { backgroundColor: 'rgba(255,255,255,0.25)' }]}>
            <Text style={[S.toggleBadgeT, suiviOnglet === 'rdv' && { color: C.white }]}>{rdvProchains.length}</Text>
          </View>
        </TouchableOpacity>

        <TouchableOpacity
          style={[S.toggleBtn, suiviOnglet === 'retard' && S.toggleBtnRetard]}
          onPress={() => setSuiviOnglet('retard')}
          activeOpacity={0.8}
        >
          <Icon name="alert" size={14} color={suiviOnglet === 'retard' ? C.white : C.textMid} />
          <Text style={[S.toggleT, suiviOnglet === 'retard' && S.toggleTA]}>En retard</Text>
          <View style={[S.toggleBadge, suiviOnglet === 'retard' && { backgroundColor: 'rgba(255,255,255,0.25)' }]}>
            <Text style={[S.toggleBadgeT, suiviOnglet === 'retard' && { color: C.white }]}>{enfantsEnRetard.length}</Text>
          </View>
        </TouchableOpacity>
      </View>

      {suiviListe.length === 0 ? (
        <View style={S.vide}>
          <Icon name={suiviOnglet === 'rdv' ? 'calendar' : 'check'} size={32} color={C.textLight} />
          <Text style={S.videT}>
            {suiviOnglet === 'rdv' ? 'Aucun RDV dans les 14 prochains jours' : 'Aucun enfant en retard'}
          </Text>
        </View>
      ) : suiviListe.map((e, i) => (
        <CarteEnfant
          key={e.id ?? i}
          enfant={e}
          mode={suiviOnglet}
          onPress={() => navigation.navigate('EnfantDetail', { enfantId: e.id })}
        />
      ))}

      {/* Actions rapides — 2 boutons larges */}
      <Text style={[S.secTitle, { marginTop: 24 }]}>Actions rapides</Text>
      <TouchableOpacity
        style={[S.actionBtn, { backgroundColor: C.primary }]}
        onPress={() => navigation.navigate('EnregistrerEnfant')}
        activeOpacity={0.85}
      >
        <Icon name="addUser" size={22} color={C.white} />
        <Text style={S.actionBtnT}>Enregistrer un enfant</Text>
      </TouchableOpacity>
      <TouchableOpacity
        style={[S.actionBtn, { backgroundColor: C.info, marginTop: 10 }]}
        onPress={() => navigation.navigate('SaisirVaccination')}
        activeOpacity={0.85}
      >
        <Icon name="clipboard" size={22} color={C.white} />
        <Text style={S.actionBtnT}>Saisir une vaccination</Text>
      </TouchableOpacity>

      <View style={{ height: 24 }} />
    </View>
  );

  // ── Onglet RDV ───────────────────────────────────────────────────────────────
  const renderRdv = () => (
    <View style={S.page}>
      <Text style={S.secTitle}>RDV dans les 14 prochains jours ({rdvProchains.length})</Text>
      {rdvProchains.length === 0 ? (
        <View style={S.vide}>
          <Icon name="calendar" size={36} color={C.textLight} />
          <Text style={S.videT}>Aucun RDV dans les 14 prochains jours</Text>
        </View>
      ) : rdvProchains.map((e, i) => (
        <CarteEnfant key={e.id ?? i} enfant={e} mode="rdv"
          onPress={() => navigation.navigate('EnfantDetail', { enfantId: e.id })} />
      ))}
      <View style={{ height: 24 }} />
    </View>
  );

  // ── Onglet Retard ────────────────────────────────────────────────────────────
  const renderRetard = () => (
    <View style={S.page}>
      <Text style={S.secTitle}>Enfants en retard ({enfantsEnRetard.length})</Text>
      {enfantsEnRetard.length === 0 ? (
        <View style={S.vide}>
          <Icon name="alert" size={36} color={C.textLight} />
          <Text style={S.videT}>Aucun enfant en retard</Text>
        </View>
      ) : enfantsEnRetard.map((e, i) => (
        <CarteEnfant key={e.id ?? i} enfant={e} mode="retard"
          onPress={() => navigation.navigate('EnfantDetail', { enfantId: e.id })} />
      ))}
      <View style={{ height: 24 }} />
    </View>
  );

  // ── RENDER ──
  return (
    <SafeAreaView style={S.safe}>
      <StatusBar barStyle="light-content" backgroundColor={C.primary} />

      {/* HEADER */}
      <View style={S.header}>
        <View style={S.headerLogo}>
          <Icon name="syringe" size={20} color={C.white} />
          <Text style={S.headerLogoT}>VacciBénin</Text>
        </View>
        <View style={S.headerR}>
          <TouchableOpacity style={S.headerBtn} activeOpacity={0.7}>
            <Icon name="bell" size={20} color={C.white} />
            <Badge count={stats.enfantsEnRetard} />
          </TouchableOpacity>
          <TouchableOpacity style={S.headerBtn} onPress={openDrawer} activeOpacity={0.7}>
            <Icon name="menu" size={22} color={C.white} />
          </TouchableOpacity>
        </View>
      </View>

      {/* ONGLETS */}
      <View style={S.tabs}>
        {[
          { key: 'dashboard', label: 'Tableau de bord' },
          { key: 'rdv',       label: 'RDV à venir'     },
          { key: 'retard',    label: 'En retard'        },
        ].map(t => (
          <TouchableOpacity key={t.key} style={S.tab} onPress={() => setActiveTab(t.key)} activeOpacity={0.8}>
            <Text style={[S.tabT, activeTab === t.key && S.tabTA]}>{t.label}</Text>
            {activeTab === t.key && <View style={S.tabBar} />}
          </TouchableOpacity>
        ))}
      </View>

      {/* CONTENU */}
      <ScrollView style={S.scroll} showsVerticalScrollIndicator={false}>
        {activeTab === 'dashboard' && renderDashboard()}
        {activeTab === 'rdv'       && renderRdv()}
        {activeTab === 'retard'    && renderRetard()}
        <View style={{ height: 80 }} />
      </ScrollView>

      {/* NAVBAR */}
      <View style={S.navbar}>
        {[
          { key: 'dashboard', icon: 'home',     label: 'Accueil' },
          { key: 'rdv',       icon: 'calendar', label: 'RDV'     },
          { key: 'retard',    icon: 'alert',    label: 'Retards' },
          { key: 'profil',    icon: 'user',     label: 'Profil'  },
        ].map(item => (
          <TouchableOpacity
            key={item.key}
            style={S.navItem}
            onPress={() => item.key === 'profil' ? navigation.navigate('Profil') : setActiveTab(item.key)}
            activeOpacity={0.8}
          >
            <Icon name={item.icon} size={22}
              color={activeTab === item.key ? C.primary : C.textLight}
              sw={activeTab === item.key ? 2.2 : 1.6}
            />
            <Text style={[S.navLbl, activeTab === item.key && S.navLblA]}>{item.label}</Text>
            {activeTab === item.key && <View style={S.navDot} />}
          </TouchableOpacity>
        ))}
      </View>

      {/* DRAWER */}
      {drawerOpen && (
        <View style={StyleSheet.absoluteFill}>
          <Animated.View style={[S.drawerOverlay, { opacity: overlayAnim }]}>
            <TouchableOpacity style={StyleSheet.absoluteFill} onPress={closeDrawer} />
          </Animated.View>
          <Animated.View style={[S.drawer, { transform: [{ translateX: drawerAnim }] }]}>
            <View style={S.drawerHead}>
              <View style={S.drawerAvatarBox}>
                <Text style={S.drawerAvatarT}>{initiales || 'AG'}</Text>
              </View>
              <Text style={S.drawerNom}>{prenom} {nom}</Text>
              <Text style={S.drawerRole}>Agent PEV</Text>
              {centre ? (
                <View style={S.drawerCentreChip}>
                  <Icon name="mapPin" size={12} color={C.accent} />
                  <Text style={S.drawerCentreT}>{centre}</Text>
                </View>
              ) : null}
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

      {/* MODAL DÉCONNEXION */}
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

// ─── STYLES (calqués sur DashboardResponsable) ────────────────────────────────
const S = StyleSheet.create({
  safe:    { flex: 1, backgroundColor: C.primary },
  loader:  { flex: 1, backgroundColor: C.bg, justifyContent: 'center', alignItems: 'center' },
  loaderT: { marginTop: 12, color: C.textMid, fontSize: 14, fontWeight: '500' },
  scroll:  { flex: 1, backgroundColor: C.bg },
  page:    { paddingHorizontal: 16, paddingTop: 16 },

  header:      { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: C.primary, paddingHorizontal: 16, paddingVertical: 12, paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight + 12 : 12 },
  headerLogo:  { flexDirection: 'row', alignItems: 'center', gap: 8 },
  headerLogoT: { color: C.white, fontSize: 17, fontWeight: '700', letterSpacing: 0.3 },
  headerR:     { flexDirection: 'row', alignItems: 'center', gap: 4 },
  headerBtn:   { padding: 8, position: 'relative' },
  badge:       { position: 'absolute', top: 4, right: 4, backgroundColor: '#ef4444', borderRadius: 8, minWidth: 16, height: 16, justifyContent: 'center', alignItems: 'center', paddingHorizontal: 3 },
  badgeT:      { color: C.white, fontSize: 9, fontWeight: '700' },

  tabs:  { flexDirection: 'row', backgroundColor: C.white, borderBottomWidth: 1, borderBottomColor: '#e5e7eb' },
  tab:   { flex: 1, alignItems: 'center', paddingVertical: 12, position: 'relative' },
  tabT:  { fontSize: 12, color: C.textLight, fontWeight: '500' },
  tabTA: { color: C.primary, fontWeight: '700' },
  tabBar:{ position: 'absolute', bottom: 0, left: '15%', right: '15%', height: 3, backgroundColor: C.primary, borderRadius: 2 },

  greetRow:    { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 20 },
  greetName:   { fontSize: 18, fontWeight: '700', color: C.textDark },
  greetDate:   { fontSize: 13, color: C.textLight, marginTop: 2 },
  centreChip:  { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: C.primary + '12', paddingHorizontal: 10, paddingVertical: 5, borderRadius: 20 },
  centreChipT: { fontSize: 12, color: C.primary, fontWeight: '600' },

  statsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginBottom: 20 },
  statCard:  { width: (SW - 52) / 2, backgroundColor: C.white, borderRadius: 14, padding: 14, alignItems: 'flex-start', shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 6, elevation: 2 },
  statIco:   { borderRadius: 10, padding: 8, marginBottom: 10 },
  statVal:   { fontSize: 24, fontWeight: '800', color: C.textDark },
  statLbl:   { fontSize: 12, color: C.textLight, marginTop: 2, fontWeight: '500' },

  secTitle: { fontSize: 15, fontWeight: '700', color: C.textDark, marginBottom: 12, marginTop: 4 },

  suiviHead:       { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 10 },
  suiviHeadT:      { fontSize: 10, fontWeight: '700', color: C.textLight, letterSpacing: 0.6, textTransform: 'uppercase' },
  toggleRow:       { flexDirection: 'row', gap: 8, marginBottom: 12 },
  toggleBtn:       { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 14, paddingVertical: 9, borderRadius: 30, borderWidth: 1, borderColor: '#d1d5db', backgroundColor: C.white },
  toggleBtnActive: { backgroundColor: C.primary, borderColor: C.primary },
  toggleBtnRetard: { backgroundColor: C.warn, borderColor: C.warn },
  toggleT:         { fontSize: 13, color: C.textMid, fontWeight: '500' },
  toggleTA:        { color: C.white, fontWeight: '600' },
  toggleBadge:     { backgroundColor: '#f3f4f6', borderRadius: 12, paddingHorizontal: 7, paddingVertical: 1 },
  toggleBadgeT:    { fontSize: 11, color: C.textMid, fontWeight: '600' },

  enfantRow:    { flexDirection: 'row', alignItems: 'center', gap: 10, backgroundColor: C.white, borderRadius: 12, paddingHorizontal: 14, paddingVertical: 13, marginBottom: 8, borderLeftWidth: 3, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.04, shadowRadius: 4, elevation: 1 },
  enfantDot:    { width: 8, height: 8, borderRadius: 4 },
  enfantInfo:   { flex: 1 },
  enfantNom:    { fontSize: 14, fontWeight: '700', color: C.textDark },
  enfantSub:    { fontSize: 12, color: C.textLight, marginTop: 1 },
  enfantBadge:  { paddingHorizontal: 9, paddingVertical: 4, borderRadius: 20 },
  enfantBadgeT: { fontSize: 11, fontWeight: '700' },
  telBtn:       { padding: 6, backgroundColor: C.primary + '12', borderRadius: 20 },

  chip:  { borderRadius: 20, paddingHorizontal: 8, paddingVertical: 3 },
  chipT: { fontSize: 10, fontWeight: '600' },

  vide:  { alignItems: 'center', paddingVertical: 36, gap: 10 },
  videT: { color: C.textLight, fontSize: 13 },

  actionBtn:  { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 12, paddingVertical: 16, borderRadius: 14, shadowColor: '#000', shadowOffset: { width: 0, height: 3 }, shadowOpacity: 0.12, shadowRadius: 8, elevation: 4 },
  actionBtnT: { fontSize: 15, color: C.white, fontWeight: '700' },

  navbar:  { flexDirection: 'row', backgroundColor: C.white, paddingBottom: Platform.OS === 'ios' ? 24 : 8, paddingTop: 8, borderTopWidth: 1, borderTopColor: '#f0f0f0', shadowColor: '#000', shadowOffset: { width: 0, height: -2 }, shadowOpacity: 0.04, shadowRadius: 8, elevation: 6 },
  navItem: { flex: 1, alignItems: 'center', gap: 3, position: 'relative' },
  navLbl:  { fontSize: 10, color: C.textLight, fontWeight: '500' },
  navLblA: { color: C.primary, fontWeight: '700' },
  navDot:  { position: 'absolute', top: -8, width: 4, height: 4, borderRadius: 2, backgroundColor: C.primary },

  drawerOverlay:   { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(6,95,70,0.25)' },
  drawer:          { position: 'absolute', top: 0, bottom: 0, left: 0, width: SW * 0.75, backgroundColor: C.white, shadowColor: '#000', shadowOffset: { width: 4, height: 0 }, shadowOpacity: 0.12, shadowRadius: 16, elevation: 12 },
  drawerHead:      { backgroundColor: C.primary, paddingTop: Platform.OS === 'ios' ? 56 : (StatusBar.currentHeight || 24) + 24, paddingBottom: 24, paddingHorizontal: 20 },
  drawerAvatarBox: { width: 56, height: 56, borderRadius: 28, backgroundColor: 'rgba(255,255,255,0.2)', justifyContent: 'center', alignItems: 'center', marginBottom: 12 },
  drawerAvatarT:   { fontSize: 22, fontWeight: '800', color: C.white },
  drawerNom:       { fontSize: 16, fontWeight: '700', color: C.white },
  drawerRole:      { fontSize: 13, color: 'rgba(255,255,255,0.75)', marginTop: 2 },
  drawerCentreChip:{ flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: 'rgba(255,255,255,0.15)', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20, marginTop: 10 },
  drawerCentreT:   { fontSize: 12, color: C.white, fontWeight: '600' },
  drawerMenu:      { paddingTop: 8 },
  drawerItem:      { flexDirection: 'row', alignItems: 'center', gap: 14, paddingHorizontal: 20, paddingVertical: 16, borderBottomWidth: 1, borderBottomColor: '#f0f0f0' },
  drawerItemT:     { flex: 1, fontSize: 15, color: C.textDark, fontWeight: '500' },
  drawerLogout:    { flexDirection: 'row', alignItems: 'center', gap: 14, paddingHorizontal: 20, paddingVertical: 16, marginTop: 'auto', borderTopWidth: 1, borderTopColor: '#f0f0f0' },
  drawerLogoutT:   { fontSize: 15, color: C.danger, fontWeight: '600' },

  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.45)', justifyContent: 'center', alignItems: 'center', padding: 24 },
  modalCard:    { backgroundColor: C.white, borderRadius: 20, padding: 28, width: '100%', maxWidth: 340, alignItems: 'center', shadowColor: '#000', shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.15, shadowRadius: 24, elevation: 12 },
  modalIco:     { width: 64, height: 64, borderRadius: 32, backgroundColor: '#fee2e2', justifyContent: 'center', alignItems: 'center', marginBottom: 16 },
  modalTitle:   { fontSize: 18, fontWeight: '800', color: C.textDark, marginBottom: 8 },
  modalBody:    { fontSize: 14, color: C.textMid, textAlign: 'center', lineHeight: 20, marginBottom: 24 },
  modalBtns:    { flexDirection: 'row', gap: 12, width: '100%' },
  modalBtn:     { flex: 1, paddingVertical: 13, borderRadius: 12, alignItems: 'center' },
  modalBtnT:    { fontSize: 14, fontWeight: '700' },
});