import React, { useState, useEffect, useRef } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, StyleSheet,
  SafeAreaView, StatusBar, ActivityIndicator, Animated,
  Platform, RefreshControl, Share,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
import { API_URL } from './config';
import Svg, { Path, Circle, Line, Polyline, Rect } from 'react-native-svg';

const C = {
  primary: '#065f46', bg: '#f4f6f4', white: '#ffffff',
  danger: '#dc2626', warn: '#d97706', success: '#059669',
  amber: '#0a48cf', textLight: '#9ca3af', textMid: '#6b7280', textDark: '#111827',
};

const Icon = ({ name, size = 22, color = C.primary, sw = 1.8 }) => {
  const p = { stroke: color, strokeWidth: sw, fill: 'none', strokeLinecap: 'round', strokeLinejoin: 'round' };
  const map = {
    back:     <Svg width={size} height={size} viewBox="0 0 24 24"><Polyline {...p} points="15 18 9 12 15 6"/></Svg>,
    history:  <Svg width={size} height={size} viewBox="0 0 24 24"><Path {...p} d="M3 3v5h5"/><Path {...p} d="M3.05 13A9 9 0 1 0 6 5.3L3 8"/><Line {...p} x1="12" y1="7" x2="12" y2="12"/><Line {...p} x1="12" y1="12" x2="16" y2="14"/></Svg>,
    check:    <Svg width={size} height={size} viewBox="0 0 24 24"><Polyline {...p} points="20 6 9 17 4 12"/></Svg>,
    syringe:  <Svg width={size} height={size} viewBox="0 0 24 24"><Line {...p} x1="3" y1="21" x2="7" y2="17"/><Line {...p} x1="7" y1="17" x2="16" y2="8"/><Line {...p} x1="16" y1="8" x2="20" y2="4"/><Line {...p} x1="18" y1="2" x2="22" y2="6"/><Line {...p} x1="6" y1="15" x2="15" y2="6"/><Line {...p} x1="9" y1="18" x2="18" y2="9"/></Svg>,
    mapPin:   <Svg width={size} height={size} viewBox="0 0 24 24"><Path {...p} d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><Circle {...p} cx="12" cy="10" r="3"/></Svg>,
    user:     <Svg width={size} height={size} viewBox="0 0 24 24"><Path {...p} d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><Circle {...p} cx="12" cy="7" r="4"/></Svg>,
    calendar: <Svg width={size} height={size} viewBox="0 0 24 24"><Rect {...p} x="3" y="4" width="18" height="18" rx="2"/><Line {...p} x1="16" y1="2" x2="16" y2="6"/><Line {...p} x1="8" y1="2" x2="8" y2="6"/><Line {...p} x1="3" y1="10" x2="21" y2="10"/></Svg>,
    share:    <Svg width={size} height={size} viewBox="0 0 24 24"><Circle {...p} cx="18" cy="5" r="3"/><Circle {...p} cx="6" cy="12" r="3"/><Circle {...p} cx="18" cy="19" r="3"/><Line {...p} x1="8.59" y1="13.51" x2="15.42" y2="17.49"/><Line {...p} x1="15.41" y1="6.51" x2="8.59" y2="10.49"/></Svg>,
    tag:      <Svg width={size} height={size} viewBox="0 0 24 24"><Path {...p} d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z"/><Line {...p} x1="7" y1="7" x2="7.01" y2="7"/></Svg>,
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
  return dt.toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit', year: 'numeric' });
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
const extraireTableau = (res) => {
  if (!res) return [];
  const d = res.data ?? res;
  if (Array.isArray(d)) return d;
  if (d && Array.isArray(d.data)) return d.data;
  return [];
};

export default function HistoriqueVaccins({ route, navigation }) {
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

      // Uniquement les vaccins administrés, triés du plus récent au plus ancien
      const raw = extraireTableau(vacRes)
        .filter(v => v.date_administration)
        .sort((a, b) => new Date(b.date_administration) - new Date(a.date_administration));
      setVaccins(raw);
    } catch (e) {
      console.error('HistoriqueVaccins:', e?.response?.data || e.message);
    } finally {
      setLoading(false);
      setRefreshing(false);
      Animated.timing(fadeAnim, { toValue: 1, duration: 350, useNativeDriver: true }).start();
    }
  };

  // Grouper par année/mois
  const groupes = vaccins.reduce((acc, v) => {
    const dt   = new Date(v.date_administration);
    const cle  = `${dt.getFullYear()}-${String(dt.getMonth() + 1).padStart(2, '0')}`;
    const label = dt.toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' });
    if (!acc[cle]) acc[cle] = { label, items: [] };
    acc[cle].items.push(v);
    return acc;
  }, {});

  const handlePartager = async () => {
    const lignes = vaccins.map(v =>
      `• ${v.vaccin || v.nom_vaccin} — ${formatDateCourt(v.date_administration)} — ${v.centre_sante?.nom ?? v.centre ?? 'Centre inconnu'}`
    ).join('\n');
    try {
      await Share.share({
        message: `📋 Historique vaccinal — ${enfant?.prenom ?? ''} ${enfant?.nom ?? ''}\n──────────────────\n${lignes}\n──────────────────\n${vaccins.length} vaccin(s) administré(s)\nGénéré via VacciBénin`,
        title: 'Historique vaccinal',
      });
    } catch {}
  };

  if (loading) return (
    <View style={S.loader}>
      <ActivityIndicator size="large" color={C.amber} />
      <Text style={S.loaderT}>Chargement de l'historique…</Text>
    </View>
  );

  return (
    <SafeAreaView style={S.container}>
      <StatusBar barStyle="light-content" backgroundColor={C.amber} />

      <View style={[S.header, { backgroundColor: C.amber }]}>
        <View style={S.headerTop}>
          <TouchableOpacity style={S.backBtn} onPress={() => navigation.goBack()} activeOpacity={0.8}>
            <Icon name="back" size={22} color="#fff" sw={2.2} />
          </TouchableOpacity>
          <View style={{ flex: 1 }}>
            <Text style={S.hdrTitle}>Historique des vaccinations</Text>
            {enfant && <Text style={S.hdrSub}>{enfant.prenom} {enfant.nom} · {calculerAge(enfant.date_naissance)}</Text>}
          </View>
          <TouchableOpacity style={S.hdrBtn} onPress={handlePartager} activeOpacity={0.8}>
            <Icon name="share" size={20} color="#fff" sw={2} />
          </TouchableOpacity>
        </View>

        {/* Résumé */}
        <View style={S.hdrResume}>
          <View style={S.hdrResumeIco}>
            <Icon name="syringe" size={20} color="#fff" sw={2} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={S.hdrResumeVal}>{vaccins.length} vaccination{vaccins.length > 1 ? 's' : ''} enregistrée{vaccins.length > 1 ? 's' : ''}</Text>
            {vaccins.length > 0 && (
              <Text style={S.hdrResumeSub}>
                Dernière : {formatDateCourt(vaccins[0]?.date_administration)} · {vaccins[0]?.centre_sante?.nom ?? vaccins[0]?.centre ?? '—'}
              </Text>
            )}
          </View>
        </View>
      </View>

      <Animated.View style={{ flex: 1, opacity: fadeAnim }}>
        <ScrollView style={S.scroll} showsVerticalScrollIndicator={false}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); charger(); }} colors={[C.amber]} />}>

          {vaccins.length === 0 ? (
            <View style={S.empty}>
              <Icon name="history" size={52} color={C.textLight} sw={1.5} />
              <Text style={S.emptyTitle}>Aucune vaccination enregistrée</Text>
              <Text style={S.emptySub}>L'historique des vaccins administrés à {enfant?.prenom ?? 'cet enfant'} apparaîtra ici.</Text>
            </View>
          ) : (
            <View style={{ padding: 12, gap: 16 }}>
              {Object.entries(groupes).map(([cle, groupe]) => (
                <View key={cle}>
                  {/* Entête mois */}
                  <View style={S.moisHead}>
                    <View style={S.moisLine} />
                    <Text style={S.moisLabel}>{groupe.label.toUpperCase()}</Text>
                    <View style={S.moisLine} />
                  </View>

                  {/* Vaccins du mois */}
                  <View style={S.moisCards}>
                    {groupe.items.map((v, i) => (
                      <View key={i} style={S.vaccCard}>
                        {/* Ligne gauche verte */}
                        <View style={S.vaccTimeline}>
                          <View style={S.vaccDot} />
                          {i < groupe.items.length - 1 && <View style={S.vaccLine} />}
                        </View>
                        <View style={S.vaccContent}>
                          {/* Nom + date */}
                          <View style={S.vaccHead}>
                            <Text style={S.vaccNom}>{v.vaccin || v.nom_vaccin || '—'}</Text>
                            <View style={S.vaccBadgeFait}>
                              <Icon name="check" size={10} color={C.success} sw={2.5} />
                              <Text style={S.vaccBadgeFaitT}>Fait</Text>
                            </View>
                          </View>
                          <Text style={S.vaccDate}>{formatDate(v.date_administration)}</Text>

                          {/* Infos */}
                          <View style={S.vaccInfos}>
                            {(v.centre_sante?.nom || v.centre) && (
                              <View style={S.vaccInfoRow}>
                                <Icon name="mapPin" size={12} color={C.textMid} sw={2} />
                                <Text style={S.vaccInfoT}>{v.centre_sante?.nom ?? v.centre}</Text>
                              </View>
                            )}
                            {v.agent && (
                              <View style={S.vaccInfoRow}>
                                <Icon name="user" size={12} color={C.textMid} sw={2} />
                                <Text style={S.vaccInfoT}>
                                  {`${v.agent.prenom ?? ''} ${v.agent.nom ?? ''}`.trim() || '—'}
                                </Text>
                              </View>
                            )}
                            {v.numero_lot && (
                              <View style={S.vaccInfoRow}>
                                <Icon name="tag" size={12} color={C.textMid} sw={2} />
                                <Text style={S.vaccInfoT}>Lot : {v.numero_lot}</Text>
                              </View>
                            )}
                          </View>
                        </View>
                      </View>
                    ))}
                  </View>
                </View>
              ))}
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
  loaderT:   { marginTop: 12, color: C.amber, fontSize: 13, fontWeight: '500' },
  scroll:    { flex: 1 },
  header:    { paddingHorizontal: 16, paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight + 12 : 14, paddingBottom: 16 },
  headerTop: { flexDirection: 'row', alignItems: 'center', marginBottom: 14 },
  backBtn:   { marginRight: 10, padding: 4 },
  hdrTitle:  { fontSize: 17, fontWeight: '700', color: '#fff' },
  hdrSub:    { fontSize: 11, color: 'rgba(255,255,255,0.7)', marginTop: 2 },
  hdrBtn:    { padding: 8 },
  hdrResume:    { flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: 'rgba(255,255,255,0.15)', borderRadius: 12, padding: 12 },
  hdrResumeIco: { width: 40, height: 40, borderRadius: 20, backgroundColor: 'rgba(255,255,255,0.2)', justifyContent: 'center', alignItems: 'center' },
  hdrResumeVal: { fontSize: 14, fontWeight: '700', color: '#fff' },
  hdrResumeSub: { fontSize: 11, color: 'rgba(255,255,255,0.75)', marginTop: 2 },
  moisHead:  { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 10 },
  moisLine:  { flex: 1, height: 1, backgroundColor: '#e5e7eb' },
  moisLabel: { fontSize: 10, fontWeight: '700', color: C.textMid, letterSpacing: 0.8 },
  moisCards: { gap: 0 },
  vaccCard:  { flexDirection: 'row', gap: 12 },
  vaccTimeline: { width: 20, alignItems: 'center', paddingTop: 14 },
  vaccDot:   { width: 10, height: 10, borderRadius: 5, backgroundColor: C.success, borderWidth: 2, borderColor: '#fff', shadowColor: C.success, shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.4, shadowRadius: 2 },
  vaccLine:  { flex: 1, width: 2, backgroundColor: '#d1fae5', marginTop: 4 },
  vaccContent: { flex: 1, backgroundColor: C.white, borderRadius: 12, padding: 12, marginBottom: 8, borderWidth: 0.5, borderColor: '#e5e7eb', elevation: 1 },
  vaccHead:  { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between', gap: 8, marginBottom: 3 },
  vaccNom:   { flex: 1, fontSize: 13, fontWeight: '700', color: C.textDark },
  vaccBadgeFait:  { flexDirection: 'row', alignItems: 'center', gap: 3, backgroundColor: '#d1fae5', borderRadius: 20, paddingHorizontal: 8, paddingVertical: 3 },
  vaccBadgeFaitT: { fontSize: 10, fontWeight: '700', color: C.success },
  vaccDate:  { fontSize: 11, color: C.textMid, marginBottom: 8 },
  vaccInfos: { gap: 5 },
  vaccInfoRow:{ flexDirection: 'row', alignItems: 'center', gap: 6 },
  vaccInfoT: { fontSize: 11, color: C.textMid, flex: 1 },
  empty:      { alignItems: 'center', paddingVertical: 80, gap: 14, paddingHorizontal: 30 },
  emptyTitle: { fontSize: 16, fontWeight: '700', color: C.textDark },
  emptySub:   { fontSize: 13, color: C.textLight, textAlign: 'center', lineHeight: 19 },
});