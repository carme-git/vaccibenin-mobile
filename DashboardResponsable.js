import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  StatusBar,
  Animated,
  Modal,
  FlatList,
  ActivityIndicator,
  Dimensions,
  Platform,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useNavigation } from '@react-navigation/native';
import axios from 'axios';
import { API_URL } from './config';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

//  PALETTE 
const C = {
  primary:   '#065f46',
  primary2:  '#047857',
  accent:    '#10b981',
  bg:        '#f0f4f3',
  white:     '#ffffff',
  card:      '#ffffff',
  border:    '#d1fae5',
  textDark:  '#0f2d23',
  textMid:   '#3d6b58',
  textLight: '#6b9e87',
  danger:    '#dc2626',
  warn:      '#d97706',
  info:      '#0284c7',
  success:   '#059669',
  overlay:   'rgba(6,95,70,0.18)',
};

//  SVG ICONS 
import Svg, { Path, Circle, Rect, Line, Polyline, Polygon } from 'react-native-svg';

const Icon = ({ name, size = 22, color = C.primary, strokeWidth = 1.8 }) => {
  const p = { stroke: color, strokeWidth, fill: 'none', strokeLinecap: 'round', strokeLinejoin: 'round' };
  const icons = {
    syringe: (
  <Svg width={size} height={size} viewBox="0 0 24 24">
    <Line {...p} x1="3"  y1="21" x2="7"  y2="17"/>
    <Line {...p} x1="7"  y1="17" x2="16" y2="8"/>
    <Line {...p} x1="16" y1="8"  x2="20" y2="4"/>
    <Line {...p} x1="18" y1="2"  x2="22" y2="6"/>
    <Line {...p} x1="6"  y1="15" x2="15" y2="6"/>
    <Line {...p} x1="9"  y1="18" x2="18" y2="9"/>
    <Line {...p} x1="10" y1="10" x2="12" y2="12"/>
    <Line {...p} x1="12" y1="8"  x2="14" y2="10"/>
  </Svg>
),
    bell: (
      <Svg width={size} height={size} viewBox="0 0 24 24">
        <Path {...p} d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/>
        <Path {...p} d="M13.73 21a2 2 0 0 1-3.46 0"/>
      </Svg>
    ),
    menu: (
      <Svg width={size} height={size} viewBox="0 0 24 24">
        <Line {...p} x1="3" y1="6" x2="21" y2="6"/>
        <Line {...p} x1="3" y1="12" x2="21" y2="12"/>
        <Line {...p} x1="3" y1="18" x2="21" y2="18"/>
      </Svg>
    ),
    home: (
      <Svg width={size} height={size} viewBox="0 0 24 24">
        <Path {...p} d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>
        <Polyline {...p} points="9 22 9 12 15 12 15 22"/>
      </Svg>
    ),
    users: (
      <Svg width={size} height={size} viewBox="0 0 24 24">
        <Path {...p} d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
        <Circle {...p} cx="9" cy="7" r="4"/>
        <Path {...p} d="M23 21v-2a4 4 0 0 0-3-3.87"/>
        <Path {...p} d="M16 3.13a4 4 0 0 1 0 7.75"/>
      </Svg>
    ),
    chart: (
      <Svg width={size} height={size} viewBox="0 0 24 24">
        <Line {...p} x1="18" y1="20" x2="18" y2="10"/>
        <Line {...p} x1="12" y1="20" x2="12" y2="4"/>
        <Line {...p} x1="6" y1="20" x2="6" y2="14"/>
      </Svg>
    ),
    logout: (
      <Svg width={size} height={size} viewBox="0 0 24 24">
        <Path {...p} d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/>
        <Polyline {...p} points="16 17 21 12 16 7"/>
        <Line {...p} x1="21" y1="12" x2="9" y2="12"/>
      </Svg>
    ),
    user: (
      <Svg width={size} height={size} viewBox="0 0 24 24">
        <Path {...p} d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
        <Circle {...p} cx="12" cy="7" r="4"/>
      </Svg>
    ),
    check: (
      <Svg width={size} height={size} viewBox="0 0 24 24">
        <Polyline {...p} points="20 6 9 17 4 12"/>
      </Svg>
    ),
    x: (
      <Svg width={size} height={size} viewBox="0 0 24 24">
        <Line {...p} x1="18" y1="6" x2="6" y2="18"/>
        <Line {...p} x1="6" y1="6" x2="18" y2="18"/>
      </Svg>
    ),
    chevronRight: (
      <Svg width={size} height={size} viewBox="0 0 24 24">
        <Polyline {...p} points="9 18 15 12 9 6"/>
      </Svg>
    ),
    calendar: (
      <Svg width={size} height={size} viewBox="0 0 24 24">
        <Rect {...p} x="3" y="4" width="18" height="18" rx="2" ry="2"/>
        <Line {...p} x1="16" y1="2" x2="16" y2="6"/>
        <Line {...p} x1="8" y1="2" x2="8" y2="6"/>
        <Line {...p} x1="3" y1="10" x2="21" y2="10"/>
      </Svg>
    ),
    clock: (
      <Svg width={size} height={size} viewBox="0 0 24 24">
        <Circle {...p} cx="12" cy="12" r="10"/>
        <Polyline {...p} points="12 6 12 12 16 14"/>
      </Svg>
    ),
    settings: (
      <Svg width={size} height={size} viewBox="0 0 24 24">
        <Circle {...p} cx="12" cy="12" r="3"/>
        <Path {...p} d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/>
      </Svg>
    ),
    addUser: (
      <Svg width={size} height={size} viewBox="0 0 24 24">
        <Path {...p} d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/>
        <Circle {...p} cx="9" cy="7" r="4"/>
        <Line {...p} x1="19" y1="8" x2="19" y2="14"/>
        <Line {...p} x1="22" y1="11" x2="16" y2="11"/>
      </Svg>
    ),
    alert: (
      <Svg width={size} height={size} viewBox="0 0 24 24">
        <Polygon {...p} points="10.29 3.86 1.82 18 22.18 18 13.71 3.86 10.29 3.86"/>
        <Line {...p} x1="12" y1="9" x2="12" y2="13"/>
        <Line {...p} x1="12" y1="17" x2="12.01" y2="17"/>
      </Svg>
    ),
    mapPin: (
      <Svg width={size} height={size} viewBox="0 0 24 24">
        <Path {...p} d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/>
        <Circle {...p} cx="12" cy="10" r="3"/>
      </Svg>
    ),
  };
  return icons[name] || null;
};

//  BADGE NOTIFICATION 
const NotifBadge = ({ count }) => {
  if (!count) return null;
  return (
    <View style={styles.badge}>
      <Text style={styles.badgeText}>{count > 9 ? '9+' : count}</Text>
    </View>
  );
};

//  COMPOSANT PRINCIPAL 
export default function DashboardResponsable() {
  const navigation = useNavigation();

  const [userData, setUserData]       = useState(null);
  const [dashData, setDashData]       = useState(null);
  const [loading, setLoading]         = useState(true);
  const [activeTab, setActiveTab]     = useState('dashboard');
  const [drawerOpen, setDrawerOpen]   = useState(false);
  const [logoutModal, setLogoutModal] = useState(false);
  const [actionLoading, setActionLoading] = useState({});

  const drawerAnim = useRef(new Animated.Value(-SCREEN_WIDTH * 0.75)).current;
  const overlayAnim = useRef(new Animated.Value(0)).current;

  //  Chargement 
  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const token = await AsyncStorage.getItem('token');
      const user  = JSON.parse(await AsyncStorage.getItem('user') || '{}');
      setUserData(user);

      const res = await axios.get(`${API_URL}/responsable/dashboard`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.data?.success) setDashData(res.data);
    } catch (e) {
      console.error('DashboardResponsable:', e?.response?.data || e.message);
    } finally {
      setLoading(false);
    }
  };

  //  Drawer 
  const openDrawer = () => {
    setDrawerOpen(true);
    Animated.parallel([
      Animated.spring(drawerAnim, { toValue: 0, useNativeDriver: true, tension: 65, friction: 11 }),
      Animated.timing(overlayAnim, { toValue: 1, duration: 250, useNativeDriver: true }),
    ]).start();
  };

  const closeDrawer = () => {
    Animated.parallel([
      Animated.spring(drawerAnim, { toValue: -SCREEN_WIDTH * 0.75, useNativeDriver: true, tension: 65, friction: 11 }),
      Animated.timing(overlayAnim, { toValue: 0, duration: 200, useNativeDriver: true }),
    ]).start(() => setDrawerOpen(false));
  };

  //  Déconnexion 
  const handleLogout = async () => {
    try {
      const token = await AsyncStorage.getItem('token');
      await axios.post(`${API_URL}/logout`, {}, {
        headers: { Authorization: `Bearer ${token}` },
      });
    } catch (_) {}
    await AsyncStorage.multiRemove(['token', 'user']);
    navigation.reset({ index: 0, routes: [{ name: 'Login' }] });
  };

  // ── Validation compte 
  const handleValidation = async (agentId, action) => {
    setActionLoading(prev => ({ ...prev, [agentId]: action }));
    try {
      const token = await AsyncStorage.getItem('token');
      const res = await axios.post(`${API_URL}/responsable/valider-compte`,
        { agentId, action },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      if (res.data?.success) {
        setDashData(prev => ({
          ...prev,
          comptesEnAttente: prev.comptesEnAttente.filter(a => a.id !== agentId),
        }));
      }
    } catch (e) {
      console.error('Validation:', e?.response?.data || e.message);
    } finally {
      setActionLoading(prev => ({ ...prev, [agentId]: null }));
    }
  };

  //  Rendu loading 
  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <Icon name="syringe" size={36} color={C.primary} />
        <ActivityIndicator color={C.primary} size="large" style={{ marginTop: 16 }} />
        <Text style={styles.loadingText}>Chargement…</Text>
      </View>
    );
  }

  const stats           = dashData?.stats            || {};
  const agents          = dashData?.agents            || [];
  const enAttente       = dashData?.comptesEnAttente  || [];
  const seances         = dashData?.seances           || [];
  const rdvProches      = dashData?.rdvProches        || [];
  const enfantsEnRetard = dashData?.enfantsEnRetard   || [];
  const initiales = userData
    ? (userData.prenom?.[0] || '') + (userData.nom?.[0] || '')
    : 'RP';

  //  RENDER 
  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="light-content" backgroundColor={C.primary} />

      {/*  HEADER  */}
      <View style={styles.header}>
        {/* Logo */}
        <View style={styles.headerLogo}>
          <Icon name="syringe" size={20} color={C.white} />
          <Text style={styles.headerLogoText}>VacciBénin</Text>
        </View>

        {/* Droite */}
        <View style={styles.headerRight}>
          {/* Cloche */}
          <TouchableOpacity style={styles.headerIconBtn} activeOpacity={0.7}>
            <Icon name="bell" size={20} color={C.white} />
            <NotifBadge count={enAttente.length} />
          </TouchableOpacity>

          {/* Hamburger */}
          <TouchableOpacity style={styles.headerIconBtn} onPress={openDrawer} activeOpacity={0.7}>
            <Icon name="menu" size={22} color={C.white} />
          </TouchableOpacity>
        </View>
      </View>

      {/*  ONGLETS  */}
      <View style={styles.tabs}>
        {[
          { key: 'dashboard', label: 'Tableau de bord' },
          { key: 'agents',    label: 'Agents' },
          { key: 'seances',   label: 'Rendez-vous' },
        ].map(tab => (
          <TouchableOpacity
            key={tab.key}
            style={styles.tabBtn}
            onPress={() => setActiveTab(tab.key)}
            activeOpacity={0.8}
          >
            <Text style={[styles.tabLabel, activeTab === tab.key && styles.tabLabelActive]}>
              {tab.label}
            </Text>
            {activeTab === tab.key && <View style={styles.tabIndicator} />}
          </TouchableOpacity>
        ))}
      </View>

      {/*  CONTENU  */}
      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>

        {/*  ONGLET DASHBOARD  */}
        {activeTab === 'dashboard' && (
          <View>
            {/* Salutation */}
            <View style={styles.greetingRow}>
              <View>
                <Text style={styles.greetingName}>
                  Bonjour, {userData?.prenom || 'Responsable'} 
                </Text>
                <Text style={styles.greetingDate}>
                  {new Date().toLocaleDateString('fr-FR', {
                    weekday: 'long', day: 'numeric', month: 'long',
                  })}
                </Text>
              </View>
              {userData?.centre && (
                <View style={styles.centreChip}>
                  <Icon name="mapPin" size={13} color={C.primary} />
                  <Text style={styles.centreChipText}>{userData.centre}</Text>
                </View>
              )}
            </View>

            {/* Stats 2×2 */}
            <View style={styles.statsGrid}>
              {[
                { label: 'Enfants suivis',  value: stats.enfantsSuivis  ?? 0, icon: 'users',    color: C.primary },
                { label: 'Agents actifs',   value: stats.totalAgents    ?? 0, icon: 'addUser',  color: C.info },
                { label: 'Rendez-vous ce mois', value: stats.seancesCeMois  ?? 0, icon: 'calendar', color: C.success },
                { label: 'En attente',      value: enAttente.length,          icon: 'alert',    color: enAttente.length > 0 ? C.warn : C.textLight },
              ].map((s, i) => (
                <View key={i} style={styles.statCard}>
                  <View style={[styles.statIconWrap, { backgroundColor: s.color + '18' }]}>
                    <Icon name={s.icon} size={20} color={s.color} />
                  </View>
                  <Text style={styles.statValue}>{s.value}</Text>
                  <Text style={styles.statLabel}>{s.label}</Text>
                </View>
              ))}
            </View>

            {/* Actions rapides */}
            <Text style={styles.sectionTitle}>Actions rapides</Text>
            <View style={styles.actionsRow}>
              {[
                { label: 'Valider un compte', icon: 'check',    color: C.success, badge: enAttente.length },
                { label: 'Voir les rapports',  icon: 'chart',   color: C.primary },
                { label: 'Planifier un rendez-vous',   icon: 'calendar',color: C.info },
                { label: 'Gérer les agents',   icon: 'users',   color: C.warn },
              ].map((a, i) => (
                <TouchableOpacity
                  key={i}
                  style={styles.actionCard}
                  onPress={() => a.icon === 'check'
                    ? setActiveTab('dashboard')
                    : a.icon === 'users'
                    ? setActiveTab('agents')
                    : a.icon === 'calendar'
                    ? setActiveTab('seances')
                    : null
                  }
                  activeOpacity={0.8}
                >
                  <View style={[styles.actionIconWrap, { backgroundColor: a.color + '15' }]}>
                    <Icon name={a.icon} size={22} color={a.color} />
                    {a.badge > 0 && <NotifBadge count={a.badge} />}
                  </View>
                  <Text style={styles.actionLabel}>{a.label}</Text>
                </TouchableOpacity>
              ))}
            </View>

            {/* Validations en attente */}
            {enAttente.length > 0 && (
              <>
                <Text style={styles.sectionTitle}>Validations en attente</Text>
                {enAttente.map(agent => (
                  <View key={agent.id} style={styles.validationCard}>
                    <View style={styles.validationAvatar}>
                      <Icon name="user" size={18} color={C.primary} />
                    </View>
                    <View style={styles.validationInfo}>
                      <Text style={styles.validationName}>{agent.nom}</Text>
                      <Text style={styles.validationEmail}>{agent.email}</Text>
                      <Text style={styles.validationDate}>Inscrit le {agent.date}</Text>
                    </View>
                    <View style={styles.validationBtns}>
                      <TouchableOpacity
                        style={[styles.validBtn, styles.validBtnAccept]}
                        onPress={() => handleValidation(agent.id, 'valider')}
                        disabled={!!actionLoading[agent.id]}
                        activeOpacity={0.8}
                      >
                        {actionLoading[agent.id] === 'valider'
                          ? <ActivityIndicator size="small" color={C.white} />
                          : <Icon name="check" size={16} color={C.white} />}
                      </TouchableOpacity>
                      <TouchableOpacity
                        style={[styles.validBtn, styles.validBtnRefuse]}
                        onPress={() => handleValidation(agent.id, 'refuser')}
                        disabled={!!actionLoading[agent.id]}
                        activeOpacity={0.8}
                      >
                        {actionLoading[agent.id] === 'refuser'
                          ? <ActivityIndicator size="small" color={C.white} />
                          : <Icon name="x" size={16} color={C.white} />}
                      </TouchableOpacity>
                    </View>
                  </View>
                ))}
              </>
            )}

            {/* ── RDV Proches ── */}
            {rdvProches.length > 0 && (
              <>
                <Text style={styles.sectionTitle}>RDV dans les 7 jours</Text>
                {rdvProches.map((enfant, i) => (
                  <TouchableOpacity
                    key={i}
                    style={styles.alertListItem}
                    activeOpacity={0.8}
                    onPress={() => navigation.navigate('EnfantDetail', { enfantId: enfant.id })}
                  >
                    <View style={[styles.alertDot, { backgroundColor: C.info }]} />
                    <View style={styles.alertListInfo}>
                      <Text style={styles.alertListName}>{enfant.nom}</Text>
                      <Text style={styles.alertListSub}>RDV le {enfant.date_rdv}</Text>
                    </View>
                    <View style={[styles.alertBadge, { backgroundColor: C.info + '18' }]}>
                      <Text style={[styles.alertBadgeText, { color: C.info }]}>
                        J-{enfant.jours}
                      </Text>
                    </View>
                    <Icon name="chevronRight" size={15} color={C.textLight} />
                  </TouchableOpacity>
                ))}
              </>
            )}

            {/* ── Enfants en retard ── */}
            {enfantsEnRetard.length > 0 && (
              <>
                <Text style={styles.sectionTitle}>Enfants en retard</Text>
                {enfantsEnRetard.map((enfant, i) => (
                  <TouchableOpacity
                    key={i}
                    style={styles.alertListItem}
                    activeOpacity={0.8}
                    onPress={() => navigation.navigate('EnfantDetail', { enfantId: enfant.id })}
                  >
                    <View style={[styles.alertDot, { backgroundColor: C.warn }]} />
                    <View style={styles.alertListInfo}>
                      <Text style={styles.alertListName}>{enfant.nom}</Text>
                      <Text style={styles.alertListSub}>{enfant.age}</Text>
                    </View>
                    <View style={[styles.alertBadge, { backgroundColor: C.warn + '18' }]}>
                      <Text style={[styles.alertBadgeText, { color: C.warn }]}>Retard</Text>
                    </View>
                    <Icon name="chevronRight" size={15} color={C.textLight} />
                  </TouchableOpacity>
                ))}
              </>
            )}

            <View style={{ height: 24 }} />
          </View>
        )}

        {/* ─── ONGLET AGENTS ─── */}
        {activeTab === 'agents' && (
          <View>
            <Text style={styles.sectionTitle}>
              Agents du centre ({agents.length})
            </Text>
            {agents.length === 0 ? (
              <View style={styles.emptyState}>
                <Icon name="users" size={36} color={C.textLight} />
                <Text style={styles.emptyText}>Aucun agent enregistré</Text>
              </View>
            ) : (
              agents.map(agent => (
                <TouchableOpacity
                  key={agent.id}
                  style={styles.agentCard}
                  activeOpacity={0.85}
                  onPress={() => navigation.navigate('AgentDetail', { agentId: agent.id })}
                >
                  <View style={styles.agentAvatar}>
                    <Icon name="user" size={20} color={C.primary} />
                  </View>
                  <View style={styles.agentInfo}>
                    <Text style={styles.agentName}>{agent.nom}</Text>
                    <Text style={styles.agentRole}>{agent.role}</Text>
                    <Text style={styles.agentEmail}>{agent.email}</Text>
                  </View>
                  <View style={[
                    styles.agentStatusChip,
                    { backgroundColor: agent.statut === 'actif' ? C.success + '18' : C.warn + '18' },
                  ]}>
                    <Text style={[
                      styles.agentStatusText,
                      { color: agent.statut === 'actif' ? C.success : C.warn },
                    ]}>
                      {agent.statut === 'actif' ? 'Actif' : 'En attente'}
                    </Text>
                  </View>
                  <Icon name="chevronRight" size={16} color={C.textLight} />
                </TouchableOpacity>
              ))
            )}
          </View>
        )}

        {/*  ONGLET SÉANCES  */}
        {activeTab === 'seances' && (
          <View>
            <Text style={styles.sectionTitle}>
              Séances planifiées ({seances.length})
            </Text>
            {seances.length === 0 ? (
              <View style={styles.emptyState}>
                <Icon name="calendar" size={36} color={C.textLight} />
                <Text style={styles.emptyText}>Aucune rendez-vous planifiée</Text>
              </View>
            ) : (
              seances.map(s => (
                <TouchableOpacity
                  key={s.id}
                  style={styles.seanceCard}
                  activeOpacity={0.85}
                  onPress={() => navigation.navigate('SeanceDetail', { seanceId: s.id })}
                >
                  <View style={styles.seanceDateBox}>
                    <Text style={styles.seanceDateDay}>
                      {new Date(s.date).toLocaleDateString('fr-FR', { day: '2-digit' })}
                    </Text>
                    <Text style={styles.seanceDateMonth}>
                      {new Date(s.date).toLocaleDateString('fr-FR', { month: 'short' })}
                    </Text>
                  </View>
                  <View style={styles.seanceInfo}>
                    <Text style={styles.seanceTitre}>{s.titre}</Text>
                    <View style={styles.seanceMetaRow}>
                      <Icon name="clock" size={13} color={C.textLight} />
                      <Text style={styles.seanceMeta}>{s.heure}</Text>
                    </View>
                    <View style={styles.seanceMetaRow}>
                      <Icon name="mapPin" size={13} color={C.textLight} />
                      <Text style={styles.seanceMeta}>{s.lieu}</Text>
                    </View>
                  </View>
                  <Icon name="chevronRight" size={16} color={C.textLight} />
                </TouchableOpacity>
              ))
            )}
          </View>
        )}

        <View style={{ height: 90 }} />
      </ScrollView>

      {/*  NAVBAR BOTTOM  */}
      <View style={styles.navbar}>
        {[
          { key: 'dashboard', icon: 'home',     label: 'Accueil' },
          { key: 'agents',    icon: 'users',    label: 'Agents' },
          { key: 'seances',   icon: 'calendar', label: 'Séances' },
          { key: 'rapports',  icon: 'chart',    label: 'Rapports' },
        ].map(item => (
          <TouchableOpacity
            key={item.key}
            style={styles.navItem}
            onPress={() => item.key === 'rapports'
              ? navigation.navigate('Rapports')
              : setActiveTab(item.key)
            }
            activeOpacity={0.8}
          >
            <Icon
              name={item.icon}
              size={22}
              color={activeTab === item.key ? C.primary : C.textLight}
              strokeWidth={activeTab === item.key ? 2.2 : 1.6}
            />
            <Text style={[
              styles.navLabel,
              activeTab === item.key && styles.navLabelActive,
            ]}>
              {item.label}
            </Text>
            {activeTab === item.key && <View style={styles.navDot} />}
          </TouchableOpacity>
        ))}
      </View>

      {/*  DRAWER  */}
      {drawerOpen && (
        <View style={StyleSheet.absoluteFill}>
          {/* Overlay */}
          <Animated.View
            style={[styles.drawerOverlay, { opacity: overlayAnim }]}
          >
            <TouchableOpacity style={StyleSheet.absoluteFill} onPress={closeDrawer} />
          </Animated.View>

          {/* Panneau */}
          <Animated.View style={[styles.drawer, { transform: [{ translateX: drawerAnim }] }]}>
            {/* En-tête drawer */}
            <View style={styles.drawerHeader}>
              <View style={styles.drawerAvatar}>
                <Text style={styles.drawerAvatarText}>{initiales.toUpperCase()}</Text>
              </View>
              <Text style={styles.drawerName}>
                {userData ? `${userData.prenom} ${userData.nom}` : 'Responsable'}
              </Text>
              <Text style={styles.drawerRole}>Responsable PEV</Text>
              {userData?.centre && (
                <View style={styles.drawerCentreChip}>
                  <Icon name="mapPin" size={12} color={C.accent} />
                  <Text style={styles.drawerCentreText}>{userData.centre}</Text>
                </View>
              )}
            </View>

            {/* Menu items */}
            <View style={styles.drawerMenu}>
              {[
                { label: 'Mon profil',    icon: 'user',     route: 'Profil' },
                { label: 'Paramètres',    icon: 'settings', route: 'Parametres' },
                { label: 'Rapports',      icon: 'chart',    route: 'Rapports' },
              ].map(item => (
                <TouchableOpacity
                  key={item.route}
                  style={styles.drawerItem}
                  onPress={() => { closeDrawer(); navigation.navigate(item.route); }}
                  activeOpacity={0.8}
                >
                  <Icon name={item.icon} size={20} color={C.primary} />
                  <Text style={styles.drawerItemText}>{item.label}</Text>
                  <Icon name="chevronRight" size={16} color={C.textLight} />
                </TouchableOpacity>
              ))}
            </View>

            {/* Déconnexion */}
            <TouchableOpacity
              style={styles.drawerLogout}
              onPress={() => { closeDrawer(); setTimeout(() => setLogoutModal(true), 300); }}
              activeOpacity={0.8}
            >
              <Icon name="logout" size={20} color={C.danger} />
              <Text style={styles.drawerLogoutText}>Déconnexion</Text>
            </TouchableOpacity>
          </Animated.View>
        </View>
      )}

      {/*  MODAL DÉCONNEXION  */}
      <Modal
        visible={logoutModal}
        transparent
        animationType="fade"
        onRequestClose={() => setLogoutModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <View style={styles.modalIconWrap}>
              <Icon name="logout" size={28} color={C.danger} />
            </View>
            <Text style={styles.modalTitle}>Déconnexion</Text>
            <Text style={styles.modalBody}>
              Voulez-vous vraiment vous déconnecter de VacciBénin ?
            </Text>
            <View style={styles.modalBtns}>
              <TouchableOpacity
                style={[styles.modalBtn, styles.modalBtnCancel]}
                onPress={() => setLogoutModal(false)}
                activeOpacity={0.8}
              >
                <Text style={styles.modalBtnCancelText}>Annuler</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalBtn, styles.modalBtnConfirm]}
                onPress={handleLogout}
                activeOpacity={0.8}
              >
                <Text style={styles.modalBtnConfirmText}>Déconnexion</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

//  STYLES 
const styles = StyleSheet.create({
  safeArea:         { flex: 1, backgroundColor: C.primary },
  loadingContainer: { flex: 1, backgroundColor: C.bg, justifyContent: 'center', alignItems: 'center' },
  loadingText:      { marginTop: 12, color: C.textMid, fontSize: 14, fontWeight: '500' },

  // Header
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: C.primary,
    paddingHorizontal: 16,
    paddingVertical: 12,
    paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight + 12 : 12,
  },
  headerLogo:     { flexDirection: 'row', alignItems: 'center', gap: 8 },
  headerLogoText: { color: C.white, fontSize: 17, fontWeight: '700', letterSpacing: 0.3 },
  headerRight:    { flexDirection: 'row', alignItems: 'center', gap: 4 },
  headerIconBtn:  { padding: 8, position: 'relative' },

  // Badge
  badge: {
    position: 'absolute', top: 4, right: 4,
    backgroundColor: '#ef4444',
    borderRadius: 8, minWidth: 16, height: 16,
    justifyContent: 'center', alignItems: 'center',
    paddingHorizontal: 3,
  },
  badgeText: { color: C.white, fontSize: 9, fontWeight: '700' },

  // Tabs
  tabs: {
    flexDirection: 'row',
    backgroundColor: C.white,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  tabBtn: {
    flex: 1, alignItems: 'center', paddingVertical: 12,
    position: 'relative',
  },
  tabLabel:       { fontSize: 13, color: C.textLight, fontWeight: '500' },
  tabLabelActive: { color: C.primary, fontWeight: '700' },
  tabIndicator: {
    position: 'absolute', bottom: 0, left: '15%', right: '15%',
    height: 3, backgroundColor: C.primary, borderRadius: 2,
  },

  // Content
  content: { flex: 1, backgroundColor: C.bg, paddingHorizontal: 16, paddingTop: 16 },

  // Greeting
  greetingRow: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start',
    marginBottom: 20,
  },
  greetingName: { fontSize: 18, fontWeight: '700', color: C.textDark },
  greetingDate: { fontSize: 13, color: C.textLight, marginTop: 2 },
  centreChip: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    backgroundColor: C.primary + '12', paddingHorizontal: 10, paddingVertical: 5,
    borderRadius: 20,
  },
  centreChipText: { fontSize: 12, color: C.primary, fontWeight: '600' },

  // Stats
  statsGrid:    { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginBottom: 24 },
  statCard: {
    width: (SCREEN_WIDTH - 52) / 2,
    backgroundColor: C.card, borderRadius: 14,
    padding: 14, alignItems: 'flex-start',
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05, shadowRadius: 6, elevation: 2,
  },
  statIconWrap: { borderRadius: 10, padding: 8, marginBottom: 10 },
  statValue:    { fontSize: 24, fontWeight: '800', color: C.textDark },
  statLabel:    { fontSize: 12, color: C.textLight, marginTop: 2, fontWeight: '500' },

  // Section title
  sectionTitle: {
    fontSize: 15, fontWeight: '700', color: C.textDark,
    marginBottom: 12, marginTop: 4,
  },

  // Actions
  actionsRow:   { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginBottom: 24 },
  actionCard: {
    width: (SCREEN_WIDTH - 52) / 2,
    backgroundColor: C.card, borderRadius: 14,
    padding: 14, alignItems: 'center',
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05, shadowRadius: 6, elevation: 2,
  },
  actionIconWrap: {
    borderRadius: 12, padding: 12, marginBottom: 10, position: 'relative',
  },
  actionLabel: { fontSize: 12, color: C.textMid, fontWeight: '600', textAlign: 'center' },

  // Validation
  validationCard: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    backgroundColor: C.card, borderRadius: 14,
    padding: 14, marginBottom: 10,
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04, shadowRadius: 5, elevation: 2,
  },
  validationAvatar: {
    width: 44, height: 44, borderRadius: 22,
    backgroundColor: C.primary + '15',
    justifyContent: 'center', alignItems: 'center',
  },
  validationInfo: { flex: 1 },
  validationName:  { fontSize: 14, fontWeight: '700', color: C.textDark },
  validationEmail: { fontSize: 12, color: C.textLight, marginTop: 1 },
  validationDate:  { fontSize: 11, color: C.textLight, marginTop: 1 },
  validationBtns:  { flexDirection: 'row', gap: 6 },
  validBtn: {
    width: 36, height: 36, borderRadius: 18,
    justifyContent: 'center', alignItems: 'center',
  },
  validBtnAccept: { backgroundColor: C.success },
  validBtnRefuse: { backgroundColor: C.danger },

  // Agent card
  agentCard: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    backgroundColor: C.card, borderRadius: 14,
    padding: 14, marginBottom: 10,
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04, shadowRadius: 5, elevation: 2,
  },
  agentAvatar: {
    width: 44, height: 44, borderRadius: 22,
    backgroundColor: C.primary + '15',
    justifyContent: 'center', alignItems: 'center',
  },
  agentInfo:       { flex: 1 },
  agentName:       { fontSize: 14, fontWeight: '700', color: C.textDark },
  agentRole:       { fontSize: 12, color: C.textMid, marginTop: 1 },
  agentEmail:      { fontSize: 11, color: C.textLight, marginTop: 1 },
  agentStatusChip: { borderRadius: 20, paddingHorizontal: 8, paddingVertical: 4 },
  agentStatusText: { fontSize: 11, fontWeight: '700' },

  // Séance card
  seanceCard: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    backgroundColor: C.card, borderRadius: 14,
    padding: 14, marginBottom: 10,
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04, shadowRadius: 5, elevation: 2,
  },
  seanceDateBox: {
    width: 46, height: 52, borderRadius: 10,
    backgroundColor: C.primary + '12',
    justifyContent: 'center', alignItems: 'center',
  },
  seanceDateDay:   { fontSize: 18, fontWeight: '800', color: C.primary },
  seanceDateMonth: { fontSize: 11, color: C.primary, fontWeight: '600', textTransform: 'uppercase' },
  seanceInfo:      { flex: 1 },
  seanceTitre:     { fontSize: 14, fontWeight: '700', color: C.textDark, marginBottom: 4 },
  seanceMetaRow:   { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 2 },
  seanceMeta:      { fontSize: 12, color: C.textLight },

  // Empty state
  emptyState: { alignItems: 'center', paddingVertical: 40, gap: 12 },
  emptyText:  { fontSize: 14, color: C.textLight, fontWeight: '500' },

  // Navbar
  navbar: {
    flexDirection: 'row',
    backgroundColor: C.white,
    paddingBottom: Platform.OS === 'ios' ? 24 : 8,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
    shadowColor: '#000', shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.04, shadowRadius: 8, elevation: 6,
  },
  navItem:       { flex: 1, alignItems: 'center', gap: 3, position: 'relative' },
  navLabel:      { fontSize: 10, color: C.textLight, fontWeight: '500' },
  navLabelActive:{ color: C.primary, fontWeight: '700' },
  navDot: {
    position: 'absolute', top: -8,
    width: 4, height: 4, borderRadius: 2,
    backgroundColor: C.primary,
  },

  // Drawer overlay
  drawerOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(6,95,70,0.25)',
  },

  // Drawer
  drawer: {
    position: 'absolute', top: 0, bottom: 0, left: 0,
    width: SCREEN_WIDTH * 0.75,
    backgroundColor: C.white,
    shadowColor: '#000', shadowOffset: { width: 4, height: 0 },
    shadowOpacity: 0.12, shadowRadius: 16, elevation: 12,
  },
  drawerHeader: {
    backgroundColor: C.primary,
    paddingTop: Platform.OS === 'ios' ? 56 : (StatusBar.currentHeight || 24) + 24,
    paddingBottom: 24,
    paddingHorizontal: 20,
    alignItems: 'flex-start',
  },
  drawerAvatar: {
    width: 56, height: 56, borderRadius: 28,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center', alignItems: 'center',
    marginBottom: 12,
  },
  drawerAvatarText: { fontSize: 22, fontWeight: '800', color: C.white },
  drawerName:       { fontSize: 16, fontWeight: '700', color: C.white },
  drawerRole:       { fontSize: 13, color: 'rgba(255,255,255,0.75)', marginTop: 2 },
  drawerCentreChip: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    backgroundColor: 'rgba(255,255,255,0.15)',
    paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20,
    marginTop: 10,
  },
  drawerCentreText: { fontSize: 12, color: C.white, fontWeight: '600' },

  drawerMenu: { paddingTop: 8 },
  drawerItem: {
    flexDirection: 'row', alignItems: 'center', gap: 14,
    paddingHorizontal: 20, paddingVertical: 16,
    borderBottomWidth: 1, borderBottomColor: '#f0f0f0',
  },
  drawerItemText: { flex: 1, fontSize: 15, color: C.textDark, fontWeight: '500' },

  drawerLogout: {
    flexDirection: 'row', alignItems: 'center', gap: 14,
    paddingHorizontal: 20, paddingVertical: 16,
    marginTop: 'auto',
    borderTopWidth: 1, borderTopColor: '#f0f0f0',
  },
  drawerLogoutText: { fontSize: 15, color: C.danger, fontWeight: '600' },

  // Modal déconnexion
  modalOverlay: {
    flex: 1, backgroundColor: 'rgba(0,0,0,0.45)',
    justifyContent: 'center', alignItems: 'center', padding: 24,
  },
  modalCard: {
    backgroundColor: C.white, borderRadius: 20,
    padding: 28, width: '100%', maxWidth: 340, alignItems: 'center',
    shadowColor: '#000', shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.15, shadowRadius: 24, elevation: 12,
  },
  modalIconWrap: {
    width: 64, height: 64, borderRadius: 32,
    backgroundColor: '#fee2e2',
    justifyContent: 'center', alignItems: 'center',
    marginBottom: 16,
  },
  modalTitle:  { fontSize: 18, fontWeight: '800', color: C.textDark, marginBottom: 8 },
  modalBody:   { fontSize: 14, color: C.textMid, textAlign: 'center', lineHeight: 20, marginBottom: 24 },
  modalBtns:   { flexDirection: 'row', gap: 12, width: '100%' },
  modalBtn:    { flex: 1, paddingVertical: 13, borderRadius: 12, alignItems: 'center' },
  modalBtnCancel:       { backgroundColor: '#f3f4f6' },
  modalBtnCancelText:   { fontSize: 14, color: C.textMid, fontWeight: '600' },
  modalBtnConfirm:      { backgroundColor: C.danger },
  modalBtnConfirmText:  { fontSize: 14, color: C.white, fontWeight: '700' },

  // Listes alertes (RDV proches / retards)
  alertListItem: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    backgroundColor: C.white, borderRadius: 12,
    paddingHorizontal: 14, paddingVertical: 13, marginBottom: 8,
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04, shadowRadius: 4, elevation: 1,
  },
  alertDot:       { width: 8, height: 8, borderRadius: 4 },
  alertListInfo:  { flex: 1 },
  alertListName:  { fontSize: 14, fontWeight: '700', color: C.textDark },
  alertListSub:   { fontSize: 12, color: C.textLight, marginTop: 1 },
  alertBadge:     { paddingHorizontal: 9, paddingVertical: 4, borderRadius: 20 },
  alertBadgeText: { fontSize: 11, fontWeight: '700' },
});