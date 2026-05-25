import React, { useState, useEffect, useRef } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, StyleSheet,
  SafeAreaView, StatusBar, ActivityIndicator, Animated,
  Platform, RefreshControl,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
import { API_URL } from './config';
import Svg, { Path, Circle, Line, Polyline, Rect } from 'react-native-svg';

const C = {
  primary: '#065f46', bg: '#f4f6f4', white: '#ffffff',
  danger: '#dc2626', warn: '#d97706', success: '#059669',
  violet: '#7c3aed', textLight: '#9ca3af', textMid: '#6b7280', textDark: '#111827',
};

const Icon = ({ name, size = 22, color = C.primary, sw = 1.8 }) => {
  const p = { stroke: color, strokeWidth: sw, fill: 'none', strokeLinecap: 'round', strokeLinejoin: 'round' };
  const map = {
    back:     <Svg width={size} height={size} viewBox="0 0 24 24"><Polyline {...p} points="15 18 9 12 15 6"/></Svg>,
    bell:     <Svg width={size} height={size} viewBox="0 0 24 24"><Path {...p} d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><Path {...p} d="M13.73 21a2 2 0 0 1-3.46 0"/></Svg>,
    clock:    <Svg width={size} height={size} viewBox="0 0 24 24"><Circle {...p} cx="12" cy="12" r="10"/><Polyline {...p} points="12 6 12 12 16 14"/></Svg>,
    alert:    <Svg width={size} height={size} viewBox="0 0 24 24"><Path {...p} d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><Line {...p} x1="12" y1="9" x2="12" y2="13"/><Line {...p} x1="12" y1="17" x2="12.01" y2="17"/></Svg>,
    check:    <Svg width={size} height={size} viewBox="0 0 24 24"><Polyline {...p} points="20 6 9 17 4 12"/></Svg>,
    syringe:  <Svg width={size} height={size} viewBox="0 0 24 24"><Line {...p} x1="3" y1="21" x2="7" y2="17"/><Line {...p} x1="7" y1="17" x2="16" y2="8"/><Line {...p} x1="16" y1="8" x2="20" y2="4"/><Line {...p} x1="18" y1="2" x2="22" y2="6"/><Line {...p} x1="6" y1="15" x2="15" y2="6"/><Line {...p} x1="9" y1="18" x2="18" y2="9"/></Svg>,
    calendar: <Svg width={size} height={size} viewBox="0 0 24 24"><Rect {...p} x="3" y="4" width="18" height="18" rx="2"/><Line {...p} x1="16" y1="2" x2="16" y2="6"/><Line {...p} x1="8" y1="2" x2="8" y2="6"/><Line {...p} x1="3" y1="10" x2="21" y2="10"/></Svg>,
    info:     <Svg width={size} height={size} viewBox="0 0 24 24"><Circle {...p} cx="12" cy="12" r="10"/><Line {...p} x1="12" y1="8" x2="12" y2="12"/><Line {...p} x1="12" y1="16" x2="12.01" y2="16"/></Svg>,
  };
  return map[name] || null;
};

const formatDateCourt = (d) => {
  if (!d) return '—';
  const dt = new Date(d);
  if (isNaN(dt)) return d;
  return dt.toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit', year: 'numeric' });
};
const formatDate = (d) => {
  if (!d) return '—';
  const dt = new Date(d);
  if (isNaN(dt)) return d;
  return dt.toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' });
};
const calculerAge = (dn) => {
  if (!dn) return '';
  const jours = Math.floor((new Date() - new Date(dn)) / 86400000);
  const mois  = Math.floor(jours / 30.4375);
  const ans   = Math.floor(jours / 365.25);
  if (jours < 30) return `${jours}j`;
  if (mois < 12)  return `${mois} mois`;
  if (ans === 1)  { const r = mois - 12; return r > 0 ? `1 an et ${r} mois` : '1 an'; }
  const r = mois - ans * 12;
  return r > 0 && r < 6 ? `${ans} ans et ${r} mois` : `${ans} ans`;
};
const joursRestants = (d) => {
  if (!d) return null;
  return Math.ceil((new Date(d) - new Date()) / 86400000);
};
const extraireTableau = (res) => {
  if (!res) return [];
  const d = res.data ?? res;
  if (Array.isArray(d)) return d;
  if (d && Array.isArray(d.data)) return d.data;
  return [];
};

export default function Rappels({ route, navigation }) {
  const { enfantId, enfant: enfantParam } = route?.params ?? {};

  const [loading, setLoading]     = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [enfant, setEnfant]       = useState(enfantParam ?? null);
  const [vaccins, setVaccins]     = useState([]);
  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => { charger(); }, []);

  const charger = async () => {
    try {
      const token     = await AsyncStorage.getItem('token');
      const typeUsers = await AsyncStorage.getItem('type_users') ?? 'mere';
      const h = { Authorization: `Bearer ${token}`, 'X-Type-Users': typeUsers };

      const [vacRes, enfRes] = await Promise.all([
        axios.get(`${API_URL}/parent/enfants/${enfantId}/vaccinations`, { headers: h }),
        !enfantParam ? axios.get(`${API_URL}/parent/enfants/${enfantId}`, { headers: h }) : Promise.resolve(null),
      ]);
      if (!enfantParam && enfRes) setEnfant(enfRes.data?.enfant ?? enfRes.data);

      // On garde uniquement les vaccins NON faits (rappels à faire)
      const raw = extraireTableau(vacRes).filter(v => !v.date_administration);
      raw.sort((a, b) => new Date(a.date_prevue || 0) - new Date(b.date_prevue || 0));
      setVaccins(raw);
    } catch (e) {
      console.error('Rappels:', e?.response?.data || e.message);
    } finally {
      setLoading(false);
      setRefreshing(false);
      Animated.timing(fadeAnim, { toValue: 1, duration: 350, useNativeDriver: true }).start();
    }
  };

  // Catégoriser
  const urgents   = vaccins.filter(v => { const j = joursRestants(v.date_prevue); return j !== null && j <= 7 && j >= 0; });
  const enRetard  = vaccins.filter(v => { const j = joursRestants(v.date_prevue); return j !== null && j < 0; });
  const aVenir    = vaccins.filter(v => { const j = joursRestants(v.date_prevue); return j === null || j > 7; });

  if (loading) return (
    <View style={S.loader}>
      <ActivityIndicator size="large" color={C.violet} />
      <Text style={S.loaderT}>Chargement des rappels…</Text>
    </View>
  );

  const Section = ({ titre, items, couleur, icone, bgCouleur }) => {
    if (items.length === 0) return null;
    return (
      <View style={S.section}>
        <View style={[S.secHead, { backgroundColor: bgCouleur }]}>
          <Icon name={icone} size={15} color={couleur} sw={2.2} />
          <Text style={[S.secTitle, { color: couleur }]}>{titre} ({items.length})</Text>
        </View>
        {items.map((v, i) => {
          const j = joursRestants(v.date_prevue);
          return (
            <View key={i} style={[S.rappelCard, { borderLeftColor: couleur }]}>
              <View style={S.rappelMain}>
                <View style={[S.rappelIco, { backgroundColor: bgCouleur }]}>
                  <Icon name="syringe" size={14} color={couleur} sw={2} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={S.rappelNom}>{v.vaccin || v.nom_vaccin || '—'}</Text>
                  {v.age_cible && <Text style={S.rappelAgeCible}>Âge cible : {v.age_cible}</Text>}
                </View>
                {v.date_prevue && (
                  <View style={[S.rappelBadge, { backgroundColor: bgCouleur }]}>
                    <Text style={[S.rappelBadgeT, { color: couleur }]}>
                      {j === null ? '—' : j < 0 ? `${Math.abs(j)}j de retard` : j === 0 ? 'Auj.' : `Dans ${j}j`}
                    </Text>
                  </View>
                )}
              </View>
              {v.date_prevue && (
                <View style={S.rappelDate}>
                  <Icon name="calendar" size={12} color={C.textLight} sw={2} />
                  <Text style={S.rappelDateT}>
                    {j !== null && j < 0 ? 'Était prévu le ' : 'Prévu le '}
                    {formatDate(v.date_prevue)}
                  </Text>
                </View>
              )}
            </View>
          );
        })}
      </View>
    );
  };

  return (
    <SafeAreaView style={S.container}>
      <StatusBar barStyle="light-content" backgroundColor={C.violet} />

      <View style={[S.header, { backgroundColor: C.violet }]}>
        <View style={S.headerTop}>
          <TouchableOpacity style={S.backBtn} onPress={() => navigation.goBack()} activeOpacity={0.8}>
            <Icon name="back" size={22} color="#fff" sw={2.2} />
          </TouchableOpacity>
          <View style={{ flex: 1 }}>
            <Text style={S.hdrTitle}>Rappels de vaccination</Text>
            {enfant && <Text style={S.hdrSub}>{enfant.prenom} {enfant.nom} · {calculerAge(enfant.date_naissance)}</Text>}
          </View>
          {vaccins.length > 0 && (
            <View style={S.hdrBadge}>
              <Text style={S.hdrBadgeT}>{vaccins.length}</Text>
            </View>
          )}
        </View>

        {/* Résumé */}
        <View style={S.hdrStats}>
          {[
            { val: enRetard.length,  label: 'En retard', warn: enRetard.length > 0, danger: true },
            { val: urgents.length,   label: '≤ 7 jours', warn: urgents.length > 0 },
            { val: aVenir.length,    label: 'À planifier' },
          ].map((s, i) => (
            <React.Fragment key={i}>
              {i > 0 && <View style={S.hdrStatSep} />}
              <View style={S.hdrStat}>
                <Text style={[S.hdrStatVal, s.danger && s.warn ? { color: '#fca5a5' } : s.warn ? { color: '#fcd34d' } : {}]}>{s.val}</Text>
                <Text style={S.hdrStatLabel}>{s.label}</Text>
              </View>
            </React.Fragment>
          ))}
        </View>
      </View>

      <Animated.View style={{ flex: 1, opacity: fadeAnim }}>
        <ScrollView style={S.scroll} showsVerticalScrollIndicator={false}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); charger(); }} colors={[C.violet]} />}>

          {vaccins.length === 0 ? (
            <View style={S.empty}>
              <Icon name="check" size={52} color={C.success} sw={1.5} />
              <Text style={S.emptyTitle}>Tout est à jour !</Text>
              <Text style={S.emptySub}>Aucun rappel de vaccination en attente pour {enfant?.prenom ?? 'cet enfant'}.</Text>
            </View>
          ) : (
            <View style={{ padding: 12, gap: 16 }}>
              {/* Alerte si retards */}
              {enRetard.length > 0 && (
                <View style={S.alerteBox}>
                  <Icon name="alert" size={18} color={C.danger} sw={2.2} />
                  <Text style={S.alerteT}>
                    {enRetard.length} vaccin{enRetard.length > 1 ? 's' : ''} en retard — consultez un agent de santé ou votre relais dès que possible.
                  </Text>
                </View>
              )}

              <Section
                titre="En retard"
                items={enRetard}
                couleur={C.danger}
                bgCouleur="#fef2f2"
                icone="alert"
              />
              <Section
                titre="Urgent (dans 7 jours)"
                items={urgents}
                couleur={C.warn}
                bgCouleur="#fffbeb"
                icone="clock"
              />
              <Section
                titre="À venir"
                items={aVenir}
                couleur={C.violet}
                bgCouleur="#f5f3ff"
                icone="bell"
              />
            </View>
          )}
          <View style={{ height: 40 }} />
        </ScrollView>
      </Animated.View>
    </SafeAreaView>
  );
}

const S = StyleSheet.create({
  container: { flex: 1, backgroundColor: C.bg },
  loader:    { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: C.bg },
  loaderT:   { marginTop: 12, color: C.violet, fontSize: 13, fontWeight: '500' },
  scroll:    { flex: 1 },
  header:    { paddingHorizontal: 16, paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight + 12 : 14, paddingBottom: 16 },
  headerTop: { flexDirection: 'row', alignItems: 'center', marginBottom: 14 },
  backBtn:   { marginRight: 10, padding: 4 },
  hdrTitle:  { fontSize: 17, fontWeight: '700', color: '#fff' },
  hdrSub:    { fontSize: 11, color: 'rgba(255,255,255,0.7)', marginTop: 2 },
  hdrBadge:  { backgroundColor: 'rgba(255,255,255,0.25)', borderRadius: 14, paddingHorizontal: 10, paddingVertical: 4 },
  hdrBadgeT: { fontSize: 13, fontWeight: '800', color: '#fff' },
  hdrStats:    { flexDirection: 'row', backgroundColor: 'rgba(255,255,255,0.12)', borderRadius: 12, padding: 12 },
  hdrStat:     { flex: 1, alignItems: 'center', gap: 2 },
  hdrStatVal:  { fontSize: 20, fontWeight: '800', color: '#fff' },
  hdrStatLabel:{ fontSize: 10, color: 'rgba(255,255,255,0.75)' },
  hdrStatSep:  { width: 1, backgroundColor: 'rgba(255,255,255,0.2)', marginVertical: 4 },
  alerteBox: { flexDirection: 'row', alignItems: 'flex-start', gap: 10, backgroundColor: '#fef2f2', borderLeftWidth: 3, borderLeftColor: C.danger, borderRadius: 12, padding: 14 },
  alerteT:   { flex: 1, fontSize: 12, color: C.danger, fontWeight: '500', lineHeight: 18 },
  section:      { borderRadius: 14, overflow: 'hidden', borderWidth: 0.5, borderColor: '#e5e7eb' },
  secHead:      { flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 14, paddingVertical: 11 },
  secTitle:     { fontSize: 11, fontWeight: '700', letterSpacing: 0.5 },
  rappelCard:   { backgroundColor: C.white, borderLeftWidth: 3, borderTopWidth: 0.5, borderTopColor: '#f3f4f6' },
  rappelMain:   { flexDirection: 'row', alignItems: 'center', padding: 12, gap: 10 },
  rappelIco:    { width: 30, height: 30, borderRadius: 15, justifyContent: 'center', alignItems: 'center' },
  rappelNom:    { fontSize: 13, fontWeight: '600', color: C.textDark },
  rappelAgeCible:{ fontSize: 10, color: C.textLight, marginTop: 2 },
  rappelBadge:  { borderRadius: 20, paddingHorizontal: 9, paddingVertical: 4 },
  rappelBadgeT: { fontSize: 10, fontWeight: '700' },
  rappelDate:   { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 12, paddingBottom: 10, marginTop: -6 },
  rappelDateT:  { fontSize: 11, color: C.textLight },
  empty:      { alignItems: 'center', paddingVertical: 80, gap: 14, paddingHorizontal: 30 },
  emptyTitle: { fontSize: 16, fontWeight: '700', color: C.textDark },
  emptySub:   { fontSize: 13, color: C.textLight, textAlign: 'center', lineHeight: 19 },
});