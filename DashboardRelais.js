import React, { useState, useEffect, useRef } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, StyleSheet,
  SafeAreaView, StatusBar, RefreshControl, ActivityIndicator,
  Linking, Animated, Modal, Dimensions, Platform,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
import { API_URL } from './config';
import Svg, { Path, Circle, Line, Polyline, Rect } from 'react-native-svg';

const { width: SW } = Dimensions.get('window');

// ─── PALETTE ─────────────────────────────────────────────────────────────────
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
  success:   '#059669',
};

// ─── ICÔNES SVG ──────────────────────────────────────────────────────────────
const Icon = ({ name, size = 22, color = C.primary, sw = 1.8 }) => {
  const p = {
    stroke: color, strokeWidth: sw, fill: 'none',
    strokeLinecap: 'round', strokeLinejoin: 'round',
  };
  const map = {
    home:     <Svg width={size} height={size} viewBox="0 0 24 24"><Path {...p} d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><Polyline {...p} points="9 22 9 12 15 12 15 22"/></Svg>,
    users:    <Svg width={size} height={size} viewBox="0 0 24 24"><Path {...p} d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><Circle {...p} cx="9" cy="7" r="4"/><Path {...p} d="M23 21v-2a4 4 0 0 0-3-3.87"/><Path {...p} d="M16 3.13a4 4 0 0 1 0 7.75"/></Svg>,
    bell:     <Svg width={size} height={size} viewBox="0 0 24 24"><Path {...p} d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><Path {...p} d="M13.73 21a2 2 0 0 1-3.46 0"/></Svg>,
    menu:     <Svg width={size} height={size} viewBox="0 0 24 24"><Line {...p} x1="3" y1="6" x2="21" y2="6"/><Line {...p} x1="3" y1="12" x2="21" y2="12"/><Line {...p} x1="3" y1="18" x2="21" y2="18"/></Svg>,
    calendar: <Svg width={size} height={size} viewBox="0 0 24 24"><Rect {...p} x="3" y="4" width="18" height="18" rx="2"/><Line {...p} x1="16" y1="2" x2="16" y2="6"/><Line {...p} x1="8" y1="2" x2="8" y2="6"/><Line {...p} x1="3" y1="10" x2="21" y2="10"/></Svg>,
    alert:    <Svg width={size} height={size} viewBox="0 0 24 24"><Path {...p} d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"/><Line {...p} x1="12" y1="9" x2="12" y2="13"/><Line {...p} x1="12" y1="17" x2="12.01" y2="17"/></Svg>,
    phone:    <Svg width={size} height={size} viewBox="0 0 24 24"><Path {...p} d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.69 12 19.79 19.79 0 0 1 1.61 3.4 2 2 0 0 1 3.6 1.22h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L7.91 8.82a16 16 0 0 0 6.29 6.29l.95-.95a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 22 16.92z"/></Svg>,
    mapPin:   <Svg width={size} height={size} viewBox="0 0 24 24"><Path {...p} d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><Circle {...p} cx="12" cy="10" r="3"/></Svg>,
    eye:      <Svg width={size} height={size} viewBox="0 0 24 24"><Path {...p} d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><Circle {...p} cx="12" cy="12" r="3"/></Svg>,
    plus:     <Svg width={size} height={size} viewBox="0 0 24 24"><Line {...p} x1="12" y1="5" x2="12" y2="19"/><Line {...p} x1="5" y1="12" x2="19" y2="12"/></Svg>,
    logout:   <Svg width={size} height={size} viewBox="0 0 24 24"><Path {...p} d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><Polyline {...p} points="16 17 21 12 16 7"/><Line {...p} x1="21" y1="12" x2="9" y2="12"/></Svg>,
    chevron:  <Svg width={size} height={size} viewBox="0 0 24 24"><Polyline {...p} points="9 18 15 12 9 6"/></Svg>,
    user:     <Svg width={size} height={size} viewBox="0 0 24 24"><Path {...p} d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><Circle {...p} cx="12" cy="7" r="4"/></Svg>,
    check:    <Svg width={size} height={size} viewBox="0 0 24 24"><Polyline {...p} points="20 6 9 17 4 12"/></Svg>,
  };
  return map[name] || null;
};

// ─── HELPERS ─────────────────────────────────────────────────────────────────
const formatDate = (d) => {
  if (!d) return '—';
  return new Date(d).toLocaleDateString('fr-FR', {
    day: '2-digit', month: 'short', year: 'numeric',
  });
};

const joursRestants = (dateStr) => {
  if (!dateStr) return null;
  return Math.ceil((new Date(dateStr) - new Date()) / 86400000);
};

// ─── CHIP DÉLAI ──────────────────────────────────────────────────────────────
const ChipDelai = ({ dateStr }) => {
  const j = joursRestants(dateStr);
  if (j === null) return null;
  const [bg, tc, txt] =
    j < 0   ? ['#fee2e2', C.danger,  `${Math.abs(j)}j retard`] :
    j === 0 ? ['#fef3c7', C.warn,    "Aujourd'hui"]             :
              ['#d1fae5', C.success, `J-${j}`];
  return (
    <View style={[styles.chip, { backgroundColor: bg }]}>
      <Text style={[styles.chipT, { color: tc }]}>{txt}</Text>
    </View>
  );
};

// ─── CARTE ENFANT ─────────────────────────────────────────────────────────────
const CarteEnfant = ({ enfant, enRetard, onAddObservation }) => {
  const bordure = enRetard ? C.danger : C.primary;
  return (
    <View style={[styles.carteEnfant, { borderLeftColor: bordure }]}>
      {/* En-tête */}
      <View style={styles.carteHead}>
        <View style={{ flex: 1 }}>
          <Text style={styles.eNom}>{enfant.prenom} {enfant.nom}</Text>
          <Text style={styles.eCode}>
            {enfant.age_mois != null ? `${enfant.age_mois} mois` : '—'}
            {enfant.code ? `  ·  ${enfant.code}` : ''}
          </Text>
        </View>
        {enfant.prochain_vaccin?.vaccin && (
          <View style={styles.chipVaccin}>
            <Text style={styles.chipVaccinT}>{enfant.prochain_vaccin.vaccin}</Text>
          </View>
        )}
      </View>

      {/* Date RDV */}
      {enfant.prochain_vaccin?.date_prevue && (
        <View style={styles.eDate}>
          <Icon name="calendar" size={13} color={C.textLight} />
          <Text style={styles.eDateT}>{formatDate(enfant.prochain_vaccin.date_prevue)}</Text>
          <ChipDelai dateStr={enfant.prochain_vaccin.date_prevue} />
        </View>
      )}

      <View style={styles.eSep} />

      {/* Infos parent */}
      {enfant.mere_tuteur && (
        <View style={styles.eGrid}>
          <View style={styles.eCol}>
            <Text style={styles.eLabel}>MÈRE / TUTEUR</Text>
            <Text style={styles.eVal}>{enfant.mere_tuteur.nom || '—'}</Text>
          </View>
          {enfant.mere_tuteur.telephone && (
            <TouchableOpacity
              style={styles.eTelBtn}
              onPress={() => Linking.openURL(`tel:${enfant.mere_tuteur.telephone}`)}
            >
              <Icon name="phone" size={14} color={C.white} />
              <Text style={styles.eTelBtnT}>{enfant.mere_tuteur.telephone}</Text>
            </TouchableOpacity>
          )}
        </View>
      )}

      {enfant.mere_tuteur?.adresse && (
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 6 }}>
          <Icon name="mapPin" size={12} color={C.textLight} />
          <Text style={styles.eVal}>{enfant.mere_tuteur.adresse}</Text>
        </View>
      )}

      {/* Bouton observation */}
      <TouchableOpacity
        style={styles.obsBtn}
        onPress={() => onAddObservation(enfant)}
        activeOpacity={0.8}
      >
        <Icon name="plus" size={14} color={C.primary} />
        <Text style={styles.obsBtnT}>Ajouter une observation</Text>
      </TouchableOpacity>
    </View>
  );
};

// ─── MODAL OBSERVATION ───────────────────────────────────────────────────────
const ModalObservation = ({ visible, enfant, onClose, onSubmit, loading }) => {
  const [texte, setTexte] = React.useState('');
  const [details, setDetails] = React.useState('');

  const handleSubmit = () => {
    if (!texte.trim()) return;
    onSubmit(enfant?.id, texte, details);
    setTexte('');
    setDetails('');
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.modalOverlay}>
        <View style={styles.modalCard}>
          <Text style={styles.modalTitle}>Observation</Text>
          {enfant && (
            <Text style={styles.modalSub}>{enfant.prenom} {enfant.nom}</Text>
          )}

          <Text style={styles.modalLabel}>Observation *</Text>
          <View style={styles.modalInput}>
            <Text
              style={styles.modalTextarea}
              onPress={() => {}}
            />
          </View>

          {/* Utilise TextInput natif */}
          <View style={{ marginBottom: 12 }}>
            <Text style={styles.modalLabel}>Observation *</Text>
            <TextInputComp
              value={texte}
              onChangeText={setTexte}
              placeholder="Ex: La mère a été informée du prochain RDV..."
              multiline
              numberOfLines={3}
              style={styles.textInput}
              placeholderTextColor="#9ca3af"
            />
          </View>

          <View style={{ marginBottom: 20 }}>
            <Text style={styles.modalLabel}>Détails (optionnel)</Text>
            <TextInputComp
              value={details}
              onChangeText={setDetails}
              placeholder="Informations complémentaires..."
              multiline
              numberOfLines={2}
              style={styles.textInput}
              placeholderTextColor="#9ca3af"
            />
          </View>

          <View style={styles.modalBtns}>
            <TouchableOpacity
              style={[styles.modalBtn, { backgroundColor: '#f3f4f6' }]}
              onPress={onClose}
            >
              <Text style={[styles.modalBtnT, { color: C.textMid }]}>Annuler</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.modalBtn, { backgroundColor: C.primary }, !texte.trim() && { opacity: 0.5 }]}
              onPress={handleSubmit}
              disabled={!texte.trim() || loading}
            >
              {loading
                ? <ActivityIndicator size="small" color={C.white} />
                : <Text style={[styles.modalBtnT, { color: C.white }]}>Enregistrer</Text>
              }
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

// Import TextInput séparé pour éviter conflit de nom
import { TextInput as TextInputComp } from 'react-native';

// ─── COMPOSANT PRINCIPAL ──────────────────────────────────────────────────────
export default function DashboardRelais({ navigation }) {
  const [loading, setLoading]           = useState(true);
  const [refreshing, setRefreshing]     = useState(false);
  const [relaisUser, setRelaisUser]     = useState(null);
  const [stats, setStats]               = useState({});
  const [rdvAVenir, setRdvAVenir]       = useState([]);
  const [enfantsRetard, setEnfantsRetard] = useState([]);
  const [onglet, setOnglet]             = useState('rdv');
  const [activeNav, setActiveNav]       = useState('home');
  const [drawerOpen, setDrawerOpen]     = useState(false);
  const [logoutModal, setLogoutModal]   = useState(false);
  const [obsModal, setObsModal]         = useState(false);
  const [enfantSelectionne, setEnfantSelectionne] = useState(null);
  const [obsLoading, setObsLoading]     = useState(false);

  const fadeAnim    = useRef(new Animated.Value(0)).current;
  const drawerAnim  = useRef(new Animated.Value(-SW * 0.75)).current;
  const overlayAnim = useRef(new Animated.Value(0)).current;

  // ── Drawer ────────────────────────────────────────
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

  // ── Chargement ────────────────────────────────────
  const charger = async () => {
    try {
      const token = await AsyncStorage.getItem('token');
      const h = { Authorization: `Bearer ${token}` };

      const [profilRes, dashRes] = await Promise.all([
        axios.get(`${API_URL}/profil`,           { headers: h }),
        axios.get(`${API_URL}/relais/dashboard`, { headers: h }),
      ]);

      setRelaisUser(profilRes.data?.user || profilRes.data);

      if (dashRes.data?.success) {
        const d = dashRes.data;
        setStats(d.stats || {});
        setRdvAVenir(d.rdvAVenir || []);
        setEnfantsRetard(d.enfantsRetard || []);
      }
    } catch (e) {
      console.error('DashboardRelais:', e?.response?.data || e.message);
    } finally {
      setLoading(false);
      setRefreshing(false);
      Animated.timing(fadeAnim, { toValue: 1, duration: 400, useNativeDriver: true }).start();
    }
  };

  useEffect(() => { charger(); }, []);
  const onRefresh = () => { setRefreshing(true); charger(); };

  // ── Ajouter observation ────────────────────────────
  const handleAddObservation = (enfant) => {
    setEnfantSelectionne(enfant);
    setObsModal(true);
  };

  const handleSubmitObservation = async (idEnfant, observation, details) => {
    setObsLoading(true);
    try {
      const token = await AsyncStorage.getItem('token');
      await axios.post(`${API_URL}/relais/observations`, {
        id_enfant: idEnfant,
        observation,
        details,
      }, { headers: { Authorization: `Bearer ${token}` } });
      setObsModal(false);
      setEnfantSelectionne(null);
    } catch (e) {
      console.error('Observation:', e?.response?.data || e.message);
    } finally {
      setObsLoading(false);
    }
  };

  // ── Déconnexion ────────────────────────────────────
  const handleLogout = async () => {
    setLogoutModal(false);
    await AsyncStorage.multiRemove(['token', 'role', 'user', 'type_users']);
    navigation.replace('Connexion');
  };

  if (loading) return (
    <View style={styles.loader}>
      <ActivityIndicator size="large" color={C.primary} />
      <Text style={styles.loaderT}>Chargement…</Text>
    </View>
  );

  const liste    = onglet === 'rdv' ? rdvAVenir : enfantsRetard;
  const prenom   = relaisUser?.prenom ?? '';
  const nom      = relaisUser?.nom    ?? '';
  const initiales = (prenom[0] ?? '').toUpperCase() + (nom[0] ?? '').toUpperCase();

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={C.primary} />

      {/* ══ HEADER ════════════════════════════════════ */}
      <View style={styles.header}>
        <View style={{ flex: 1 }}>
          <Text style={styles.hdrGreeting}>Bonjour</Text>
          <Text style={styles.hdrName}>{prenom} {nom}</Text>
          {(stats.centre_nom) && (
            <View style={styles.centreRow}>
              <Icon name="mapPin" size={11} color="rgba(255,255,255,0.7)" />
              <Text style={styles.centreTxt}>{stats.centre_nom}</Text>
            </View>
          )}
        </View>
        <View style={styles.hdrActions}>
          <TouchableOpacity style={styles.hdrBtn}>
            <Icon name="bell" size={20} color={C.white} />
            {(stats.enRetard > 0) && <View style={styles.notifDot} />}
          </TouchableOpacity>
          <TouchableOpacity style={styles.hdrBtn} onPress={openDrawer}>
            <Icon name="menu" size={22} color={C.white} />
          </TouchableOpacity>
        </View>
      </View>

      {/* ══ CONTENU ═══════════════════════════════════ */}
      <Animated.View style={{ flex: 1, opacity: fadeAnim }}>
        <ScrollView
          style={styles.scroll}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[C.primary]} />
          }
        >
          {/* Stats 3 cartes */}
          <View style={styles.statsRow}>
            {[
              { label: 'Enfants\nsuivis',  value: stats.totalEnfants ?? 0, icon: 'users',    color: C.primary },
              { label: 'RDV\nà venir',     value: stats.rdvAVenir    ?? 0, icon: 'calendar', color: '#0284c7' },
              { label: 'En\nretard',       value: stats.enRetard     ?? 0, icon: 'alert',    color: stats.enRetard > 0 ? C.danger : C.success },
            ].map((s, i) => (
              <View key={i} style={styles.statCard}>
                <View style={[styles.statIco, { backgroundColor: s.color + '18' }]}>
                  <Icon name={s.icon} size={18} color={s.color} />
                </View>
                <Text style={[styles.statVal, { color: s.color }]}>{s.value}</Text>
                <Text style={styles.statLbl}>{s.label}</Text>
              </View>
            ))}
          </View>

          {/* Observations aujourd'hui */}
          <View style={styles.obsRow}>
            <View style={[styles.obsCard, { backgroundColor: C.primary + '12' }]}>
              <Icon name="eye" size={16} color={C.primary} />
              <Text style={styles.obsCardT}>
                {stats.observations ?? 0} observation{(stats.observations ?? 0) > 1 ? 's' : ''} enregistrée{(stats.observations ?? 0) > 1 ? 's' : ''}
              </Text>
            </View>
          </View>

          {/* Toggle RDV / En retard */}
          <View style={styles.card}>
            <View style={styles.secHead}>
              <View style={styles.secLine} />
              <Text style={styles.secHeadT}>LISTE DE TERRAIN</Text>
            </View>

            <View style={styles.toggleRow}>
              <TouchableOpacity
                style={[styles.toggleBtn, onglet === 'rdv' && styles.toggleBtnActive]}
                onPress={() => setOnglet('rdv')}
                activeOpacity={0.8}
              >
                <Icon name="calendar" size={14} color={onglet === 'rdv' ? C.white : C.textMid} />
                <Text style={[styles.toggleT, onglet === 'rdv' && styles.toggleTA]}>
                  RDV à venir
                </Text>
                <View style={[styles.toggleBadge, onglet === 'rdv' && { backgroundColor: 'rgba(255,255,255,0.25)' }]}>
                  <Text style={[styles.toggleBadgeT, onglet === 'rdv' && { color: C.white }]}>
                    {rdvAVenir.length}
                  </Text>
                </View>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.toggleBtn, onglet === 'retard' && styles.toggleBtnRetard]}
                onPress={() => setOnglet('retard')}
                activeOpacity={0.8}
              >
                <Icon name="alert" size={14} color={onglet === 'retard' ? C.white : C.textMid} />
                <Text style={[styles.toggleT, onglet === 'retard' && styles.toggleTA]}>
                  En retard
                </Text>
                <View style={[styles.toggleBadge, onglet === 'retard' && { backgroundColor: 'rgba(255,255,255,0.25)' }]}>
                  <Text style={[styles.toggleBadgeT, onglet === 'retard' && { color: C.white }]}>
                    {enfantsRetard.length}
                  </Text>
                </View>
              </TouchableOpacity>
            </View>

            {liste.length === 0 ? (
              <View style={styles.vide}>
                <Icon
                  name={onglet === 'rdv' ? 'calendar' : 'check'}
                  size={36}
                  color={C.textLight}
                />
                <Text style={styles.videT}>
                  {onglet === 'rdv'
                    ? 'Aucun RDV dans les 14 prochains jours'
                    : 'Aucun enfant en retard 🎉'}
                </Text>
              </View>
            ) : (
              liste.map((e, i) => (
                <CarteEnfant
                  key={i}
                  enfant={e}
                  enRetard={onglet === 'retard'}
                  onAddObservation={handleAddObservation}
                />
              ))
            )}
          </View>

          <View style={{ height: 90 }} />
        </ScrollView>
      </Animated.View>

      {/* ══ NAVBAR ════════════════════════════════════ */}
      <View style={styles.navbar}>
        {[
          { key: 'home',    icon: 'home',     label: 'Accueil' },
          { key: 'enfants', icon: 'users',    label: 'Enfants' },
          { key: 'obs',     icon: 'eye',      label: 'Observations' },
          { key: 'profil',  icon: 'user',     label: 'Profil' },
        ].map(item => (
          <TouchableOpacity
            key={item.key}
            style={styles.navItem}
            onPress={() => setActiveNav(item.key)}
            activeOpacity={0.8}
          >
            <Icon
              name={item.icon}
              size={22}
              color={activeNav === item.key ? C.primary : C.textLight}
              sw={activeNav === item.key ? 2.2 : 1.6}
            />
            <Text style={[styles.navLabel, activeNav === item.key && styles.navLabelActif]}>
              {item.label}
            </Text>
            {activeNav === item.key && <View style={styles.navDot} />}
          </TouchableOpacity>
        ))}
      </View>

      {/* ══ DRAWER ════════════════════════════════════ */}
      {drawerOpen && (
        <View style={StyleSheet.absoluteFill}>
          <Animated.View style={[styles.drawerOverlay, { opacity: overlayAnim }]}>
            <TouchableOpacity style={StyleSheet.absoluteFill} onPress={closeDrawer} />
          </Animated.View>
          <Animated.View style={[styles.drawer, { transform: [{ translateX: drawerAnim }] }]}>
            <View style={styles.drawerHead}>
              <View style={styles.drawerAvatarBox}>
                <Text style={styles.drawerAvatarT}>{initiales || 'RL'}</Text>
              </View>
              <Text style={styles.drawerNom}>{prenom} {nom}</Text>
              <Text style={styles.drawerRole}>Relais Communautaire</Text>
              {stats.centre_nom && (
                <View style={styles.drawerCentreChip}>
                  <Icon name="mapPin" size={12} color={C.accent} />
                  <Text style={styles.drawerCentreT}>{stats.centre_nom}</Text>
                </View>
              )}
            </View>
            <View style={styles.drawerMenu}>
              {[
                { label: 'Mon profil',    icon: 'user',  route: 'Profil' },
                { label: 'Observations',  icon: 'eye',   route: 'Observations' },
              ].map(item => (
                <TouchableOpacity
                  key={item.label}
                  style={styles.drawerItem}
                  onPress={() => { closeDrawer(); navigation.navigate(item.route); }}
                  activeOpacity={0.8}
                >
                  <Icon name={item.icon} size={20} color={C.primary} />
                  <Text style={styles.drawerItemT}>{item.label}</Text>
                  <Icon name="chevron" size={16} color={C.textLight} />
                </TouchableOpacity>
              ))}
            </View>
            <TouchableOpacity
              style={styles.drawerLogout}
              onPress={() => { closeDrawer(); setTimeout(() => setLogoutModal(true), 300); }}
              activeOpacity={0.8}
            >
              <Icon name="logout" size={20} color={C.danger} />
              <Text style={styles.drawerLogoutT}>Déconnexion</Text>
            </TouchableOpacity>
          </Animated.View>
        </View>
      )}

      {/* ══ MODAL DÉCONNEXION ═════════════════════════ */}
      <Modal visible={logoutModal} transparent animationType="fade" onRequestClose={() => setLogoutModal(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <View style={styles.modalIco}>
              <Icon name="logout" size={28} color={C.danger} />
            </View>
            <Text style={styles.modalTitle}>Déconnexion</Text>
            <Text style={styles.modalBody}>Voulez-vous vraiment vous déconnecter ?</Text>
            <View style={styles.modalBtns}>
              <TouchableOpacity
                style={[styles.modalBtn, { backgroundColor: '#f3f4f6' }]}
                onPress={() => setLogoutModal(false)}
              >
                <Text style={[styles.modalBtnT, { color: C.textMid }]}>Annuler</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalBtn, { backgroundColor: C.danger }]}
                onPress={handleLogout}
              >
                <Text style={[styles.modalBtnT, { color: C.white }]}>Déconnexion</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* ══ MODAL OBSERVATION ════════════════════════ */}
      <ModalObservation
        visible={obsModal}
        enfant={enfantSelectionne}
        onClose={() => { setObsModal(false); setEnfantSelectionne(null); }}
        onSubmit={handleSubmitObservation}
        loading={obsLoading}
      />
    </SafeAreaView>
  );
}

// ─── STYLES ──────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: C.bg },
  loader:    { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: C.bg },
  loaderT:   { marginTop: 12, color: C.primary, fontSize: 13, fontWeight: '500' },
  scroll:    { flex: 1 },

  // Header
  header:      { backgroundColor: C.primary, paddingHorizontal: 16, paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight + 12 : 14, paddingBottom: 16 },
  hdrGreeting: { fontSize: 11, color: 'rgba(255,255,255,0.6)' },
  hdrName:     { fontSize: 18, fontWeight: '700', color: C.white, marginTop: 1 },
  centreRow:   { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 4 },
  centreTxt:   { fontSize: 11, color: 'rgba(255,255,255,0.7)' },
  hdrActions:  { flexDirection: 'row', alignItems: 'center', gap: 6 },
  hdrBtn:      { padding: 8, position: 'relative' },
  notifDot:    { position: 'absolute', top: 6, right: 6, width: 7, height: 7, backgroundColor: '#f87171', borderRadius: 4, borderWidth: 1.5, borderColor: C.primary },

  // Stats
  statsRow: { flexDirection: 'row', gap: 8, paddingHorizontal: 12, paddingTop: 12 },
  statCard: { flex: 1, backgroundColor: C.white, borderRadius: 14, padding: 12, alignItems: 'center', shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 4, elevation: 1 },
  statIco:  { borderRadius: 10, padding: 8, marginBottom: 8 },
  statVal:  { fontSize: 22, fontWeight: '800', color: C.textDark },
  statLbl:  { fontSize: 9, color: C.textLight, textAlign: 'center', marginTop: 2, fontWeight: '500', textTransform: 'uppercase', letterSpacing: 0.3 },

  // Obs row
  obsRow:    { paddingHorizontal: 12, marginTop: 8 },
  obsCard:   { flexDirection: 'row', alignItems: 'center', gap: 8, borderRadius: 10, paddingHorizontal: 14, paddingVertical: 10 },
  obsCardT:  { fontSize: 13, color: C.primary, fontWeight: '500' },

  // Card section
  card:     { backgroundColor: C.white, borderRadius: 14, padding: 14, marginHorizontal: 12, marginTop: 10, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 4, elevation: 1 },
  secHead:  { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 12 },
  secLine:  { width: 3, height: 14, backgroundColor: C.primary, borderRadius: 2 },
  secHeadT: { fontSize: 10, fontWeight: '700', color: C.textDark, letterSpacing: 0.5 },

  // Toggle
  toggleRow:       { flexDirection: 'row', gap: 8, marginBottom: 12 },
  toggleBtn:       { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 14, paddingVertical: 9, borderRadius: 30, borderWidth: 1, borderColor: '#d1d5db', backgroundColor: C.white },
  toggleBtnActive: { backgroundColor: C.primary, borderColor: C.primary },
  toggleBtnRetard: { backgroundColor: C.danger,  borderColor: C.danger  },
  toggleT:         { fontSize: 13, color: C.textMid, fontWeight: '500' },
  toggleTA:        { color: C.white, fontWeight: '600' },
  toggleBadge:     { backgroundColor: '#f3f4f6', borderRadius: 12, paddingHorizontal: 7, paddingVertical: 1 },
  toggleBadgeT:    { fontSize: 11, color: C.textMid, fontWeight: '600' },

  // Carte enfant
  carteEnfant: { backgroundColor: C.white, borderRadius: 10, padding: 12, marginBottom: 8, borderLeftWidth: 3, borderWidth: 0.5, borderColor: '#e5e7eb', shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.03, shadowRadius: 3, elevation: 1 },
  carteHead:   { flexDirection: 'row', alignItems: 'flex-start', marginBottom: 4 },
  eNom:        { fontSize: 14, fontWeight: '600', color: C.textDark },
  eCode:       { fontSize: 11, color: C.textLight, marginTop: 1 },
  eDate:       { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 6, marginBottom: 8 },
  eDateT:      { fontSize: 11, color: C.textMid },
  eSep:        { height: 0.5, backgroundColor: '#f0f0f0', marginBottom: 8 },
  eGrid:       { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  eCol:        { flex: 1 },
  eLabel:      { fontSize: 9, color: C.textLight, fontWeight: '600', textTransform: 'uppercase', letterSpacing: 0.4, marginBottom: 2 },
  eVal:        { fontSize: 12, color: C.textMid },
  eTelBtn:     { flexDirection: 'row', alignItems: 'center', gap: 5, backgroundColor: C.primary, borderRadius: 20, paddingHorizontal: 10, paddingVertical: 6 },
  eTelBtnT:    { fontSize: 11, color: C.white, fontWeight: '600' },
  obsBtn:      { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 10, paddingTop: 8, borderTopWidth: 0.5, borderTopColor: '#f0f0f0' },
  obsBtnT:     { fontSize: 12, color: C.primary, fontWeight: '500' },

  // Chip
  chip:        { borderRadius: 20, paddingHorizontal: 8, paddingVertical: 3 },
  chipT:       { fontSize: 10, fontWeight: '600' },
  chipVaccin:  { backgroundColor: '#dbeafe', borderRadius: 20, paddingHorizontal: 8, paddingVertical: 3 },
  chipVaccinT: { fontSize: 10, fontWeight: '600', color: '#1d4ed8' },

  // Vide
  vide:  { alignItems: 'center', paddingVertical: 36, gap: 10 },
  videT: { color: C.textLight, fontSize: 13 },

  // Navbar
  navbar:       { flexDirection: 'row', backgroundColor: C.white, paddingBottom: Platform.OS === 'ios' ? 24 : 8, paddingTop: 8, borderTopWidth: 1, borderTopColor: '#f0f0f0', elevation: 6 },
  navItem:      { flex: 1, alignItems: 'center', gap: 3, position: 'relative' },
  navLabel:     { fontSize: 10, color: C.textLight, fontWeight: '500' },
  navLabelActif:{ color: C.primary, fontWeight: '700' },
  navDot:       { position: 'absolute', top: -8, width: 4, height: 4, borderRadius: 2, backgroundColor: C.primary },

  // Drawer
  drawerOverlay:   { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(6,95,70,0.25)' },
  drawer:          { position: 'absolute', top: 0, bottom: 0, left: 0, width: SW * 0.75, backgroundColor: C.white, elevation: 12 },
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

  // Modal
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.45)', justifyContent: 'flex-end' },
  modalCard:    { backgroundColor: C.white, borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 24, paddingBottom: 36 },
  modalIco:     { width: 56, height: 56, borderRadius: 28, backgroundColor: '#fee2e2', justifyContent: 'center', alignItems: 'center', alignSelf: 'center', marginBottom: 12 },
  modalTitle:   { fontSize: 18, fontWeight: '800', color: C.textDark, marginBottom: 4, textAlign: 'center' },
  modalSub:     { fontSize: 13, color: C.textMid, textAlign: 'center', marginBottom: 20 },
  modalBody:    { fontSize: 14, color: C.textMid, textAlign: 'center', marginBottom: 24 },
  modalLabel:   { fontSize: 13, fontWeight: '600', color: C.textDark, marginBottom: 6 },
  modalInput:   { display: 'none' },
  textInput:    { borderWidth: 1.5, borderColor: '#e5e7eb', borderRadius: 10, padding: 12, fontSize: 14, color: C.textDark, backgroundColor: '#f9fafb', textAlignVertical: 'top', marginBottom: 4 },
  modalBtns:    { flexDirection: 'row', gap: 12 },
  modalBtn:     { flex: 1, paddingVertical: 13, borderRadius: 12, alignItems: 'center' },
  modalBtnT:    { fontSize: 14, fontWeight: '700' },
});