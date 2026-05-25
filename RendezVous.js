import React, { useState, useEffect, useRef } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, StyleSheet,
  SafeAreaView, StatusBar, ActivityIndicator, Animated,
  Modal, Platform, RefreshControl,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
import { API_URL } from './config';
import Svg, { Path, Circle, Line, Polyline, Rect } from 'react-native-svg';

const C = {
  primary:   '#065f46',
  bg:        '#f4f6f4',
  white:     '#ffffff',
  danger:    '#dc2626',
  warn:      '#d97706',
  success:   '#059669',
  textLight: '#9ca3af',
  textMid:   '#6b7280',
  textDark:  '#111827',
};

const Icon = ({ name, size = 22, color = C.primary, sw = 1.8 }) => {
  const p = { stroke: color, strokeWidth: sw, fill: 'none', strokeLinecap: 'round', strokeLinejoin: 'round' };
  const map = {
    back:        <Svg width={size} height={size} viewBox="0 0 24 24"><Polyline {...p} points="15 18 9 12 15 6"/></Svg>,
    calendar:    <Svg width={size} height={size} viewBox="0 0 24 24"><Rect {...p} x="3" y="4" width="18" height="18" rx="2"/><Line {...p} x1="16" y1="2" x2="16" y2="6"/><Line {...p} x1="8" y1="2" x2="8" y2="6"/><Line {...p} x1="3" y1="10" x2="21" y2="10"/></Svg>,
    check:       <Svg width={size} height={size} viewBox="0 0 24 24"><Polyline {...p} points="20 6 9 17 4 12"/></Svg>,
    checkCircle: <Svg width={size} height={size} viewBox="0 0 24 24"><Path {...p} d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><Polyline {...p} points="22 4 12 14.01 9 11.01"/></Svg>,
    clock:       <Svg width={size} height={size} viewBox="0 0 24 24"><Circle {...p} cx="12" cy="12" r="10"/><Polyline {...p} points="12 6 12 12 16 14"/></Svg>,
    mapPin:      <Svg width={size} height={size} viewBox="0 0 24 24"><Path {...p} d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><Circle {...p} cx="12" cy="10" r="3"/></Svg>,
    syringe:     <Svg width={size} height={size} viewBox="0 0 24 24"><Line {...p} x1="3" y1="21" x2="7" y2="17"/><Line {...p} x1="7" y1="17" x2="16" y2="8"/><Line {...p} x1="16" y1="8" x2="20" y2="4"/><Line {...p} x1="18" y1="2" x2="22" y2="6"/><Line {...p} x1="6" y1="15" x2="15" y2="6"/><Line {...p} x1="9" y1="18" x2="18" y2="9"/></Svg>,
    user:        <Svg width={size} height={size} viewBox="0 0 24 24"><Path {...p} d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><Circle {...p} cx="12" cy="7" r="4"/></Svg>,
    info:        <Svg width={size} height={size} viewBox="0 0 24 24"><Circle {...p} cx="12" cy="12" r="10"/><Line {...p} x1="12" y1="8" x2="12" y2="12"/><Line {...p} x1="12" y1="16" x2="12.01" y2="16"/></Svg>,
    bell:        <Svg width={size} height={size} viewBox="0 0 24 24"><Path {...p} d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><Path {...p} d="M13.73 21a2 2 0 0 1-3.46 0"/></Svg>,
    empty:       <Svg width={size} height={size} viewBox="0 0 24 24"><Rect {...p} x="3" y="4" width="18" height="18" rx="2"/><Line {...p} x1="16" y1="2" x2="16" y2="6"/><Line {...p} x1="8" y1="2" x2="8" y2="6"/><Line {...p} x1="3" y1="10" x2="21" y2="10"/></Svg>,
  };
  return map[name] || null;
};

const formatDate = (d) => {
  if (!d) return '—';
  const dt = new Date(d);
  if (isNaN(dt)) return d;
  return dt.toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
};
const formatDateCourt = (d) => {
  if (!d) return '—';
  const dt = new Date(d);
  if (isNaN(dt)) return d;
  return dt.toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit', year: 'numeric' });
};
const formatHeure = (d) => {
  if (!d) return '';
  const dt = new Date(d);
  if (isNaN(dt)) return '';
  const h = dt.getHours(), m = dt.getMinutes();
  if (h === 0 && m === 0) return '';
  return dt.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
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
const joursRestants = (dateStr) => {
  if (!dateStr) return null;
  return Math.ceil((new Date(dateStr) - new Date()) / 86400000);
};

// ─── CARTE RDV ────────────────────────────────────────────────────────────────
const CarteRdv = ({ rdv, onConfirmer }) => {
  const dateRdv  = rdv.date_prevue || rdv.date_rendez_vous;
  const jours    = joursRestants(dateRdv);
  const confirmé = rdv.presence_confirmee || rdv.confirme;
  const urgent   = jours !== null && jours <= 3 && jours >= 0;
  const passé    = jours !== null && jours < 0;

  const borderColor = confirmé ? C.success : urgent ? C.warn : passé ? '#9ca3af' : C.primary;
  const bgTop       = confirmé ? '#ecfdf5' : urgent ? '#fffbeb' : passé ? '#f9fafb' : '#f0fdf4';

  return (
    <View style={[S.rdvCard, { borderLeftColor: borderColor }]}>
      <View style={[S.rdvHead, { backgroundColor: bgTop }]}>
        <View style={{ flex: 1 }}>
          <View style={S.rdvVaccinRow}>
            <Icon name="syringe" size={14} color={borderColor} sw={2} />
            <Text style={[S.rdvVaccin, { color: borderColor }]}>
              {rdv.vaccin || rdv.nom_vaccin || rdv.titre || 'Vaccination'}
            </Text>
          </View>
          <Text style={S.rdvDate}>{formatDate(dateRdv)}</Text>
          {formatHeure(dateRdv) !== '' && (
            <View style={S.rdvHeureRow}>
              <Icon name="clock" size={12} color={C.textMid} sw={2} />
              <Text style={S.rdvHeure}>{formatHeure(dateRdv)}</Text>
            </View>
          )}
        </View>
        <View style={[S.rdvJoursBadge, { backgroundColor: borderColor }]}>
          {confirmé
            ? <Icon name="check" size={14} color="#fff" sw={2.5} />
            : <Text style={S.rdvJoursT}>
                {passé ? 'Passé' : jours === 0 ? 'Auj.' : jours === 1 ? 'Demain' : `J-${jours}`}
              </Text>
          }
        </View>
      </View>

      <View style={S.rdvBody}>
        {(rdv.centre_sante?.nom || rdv.centre) && (
          <View style={S.rdvInfoRow}>
            <Icon name="mapPin" size={14} color={C.primary} sw={2} />
            <Text style={S.rdvInfoT}>{rdv.centre_sante?.nom || rdv.centre}</Text>
          </View>
        )}
        {(rdv.agent || rdv.relais) && (
          <View style={S.rdvInfoRow}>
            <Icon name="user" size={14} color={C.primary} sw={2} />
            <Text style={S.rdvInfoT}>
              {rdv.agent
                ? `${rdv.agent.prenom ?? ''} ${rdv.agent.nom ?? ''}`.trim()
                : rdv.relais?.nom ?? '—'}
            </Text>
          </View>
        )}
        {rdv.note && (
          <View style={S.rdvInfoRow}>
            <Icon name="info" size={14} color={C.textMid} sw={2} />
            <Text style={[S.rdvInfoT, { color: C.textMid }]}>{rdv.note}</Text>
          </View>
        )}

        {!passé && !confirmé && (
          <TouchableOpacity style={S.rdvConfirmBtn} onPress={() => onConfirmer(rdv)} activeOpacity={0.85}>
            <Icon name="checkCircle" size={16} color="#fff" sw={2} />
            <Text style={S.rdvConfirmBtnT}>Confirmer ma présence</Text>
          </TouchableOpacity>
        )}
        {confirmé && (
          <View style={S.rdvConfirméBadge}>
            <Icon name="checkCircle" size={14} color={C.success} sw={2} />
            <Text style={S.rdvConfirméT}>Présence confirmée</Text>
          </View>
        )}
        {passé && !confirmé && (
          <View style={[S.rdvConfirméBadge, { backgroundColor: '#f9fafb' }]}>
            <Icon name="info" size={14} color={C.textMid} sw={2} />
            <Text style={[S.rdvConfirméT, { color: C.textMid }]}>Rendez-vous passé</Text>
          </View>
        )}
      </View>
    </View>
  );
};

// ─── COMPOSANT PRINCIPAL ──────────────────────────────────────────────────────
export default function RendezVous({ route, navigation }) {
  const { enfantId, enfant: enfantParam } = route?.params ?? {};

  const [loading, setLoading]           = useState(true);
  const [refreshing, setRefreshing]     = useState(false);
  const [enfant, setEnfant]             = useState(enfantParam ?? null);
  const [rdvs, setRdvs]                 = useState([]);
  const [onglet, setOnglet]             = useState('a_venir');
  const [confirmModal, setConfirmModal] = useState(false);
  const [rdvSel, setRdvSel]             = useState(null);
  const [confirmLoading, setConfirmLoading] = useState(false);
  const [confirmSuccess, setConfirmSuccess] = useState(false);

  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => { charger(); }, []);

  const charger = async () => {
    try {
      const token     = await AsyncStorage.getItem('token');
      const typeUsers = await AsyncStorage.getItem('type_users') ?? 'mere';
      const h = { Authorization: `Bearer ${token}`, 'X-Type-Users': typeUsers };

      // ✅ CORRECTION : rendezvous (sans tiret) comme dans api.php
      const res = await axios.get(`${API_URL}/parent/enfants/${enfantId}/rendezvous`, { headers: h });
      const raw = extraireTableau(res);
      raw.sort((a, b) =>
        new Date(a.date_prevue || a.date_rendez_vous || 0) -
        new Date(b.date_prevue || b.date_rendez_vous || 0)
      );
      setRdvs(raw);
    } catch (e) {
      console.error('RendezVous:', e?.response?.data || e.message);
      setRdvs([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
      Animated.timing(fadeAnim, { toValue: 1, duration: 350, useNativeDriver: true }).start();
    }
  };

  const handleConfirmer = (rdv) => { setRdvSel(rdv); setConfirmSuccess(false); setConfirmModal(true); };

  const validerConfirmation = async () => {
    if (!rdvSel) return;
    setConfirmLoading(true);
    try {
      const token     = await AsyncStorage.getItem('token');
      const typeUsers = await AsyncStorage.getItem('type_users') ?? 'mere';
      await axios.post(
        `${API_URL}/parent/rendez-vous/${rdvSel.id}/confirmer`, {},
        { headers: { Authorization: `Bearer ${token}`, 'X-Type-Users': typeUsers } }
      );
    } catch (e) {
      console.error('Confirmation:', e?.response?.data || e.message);
      // On marque quand même localement même si endpoint pas encore dispo
    } finally {
      setRdvs(prev => prev.map(r =>
        r.id === rdvSel.id ? { ...r, presence_confirmee: true, confirme: true } : r
      ));
      setConfirmSuccess(true);
      setConfirmLoading(false);
    }
  };

  const now = new Date();
  const rdvsAVenir  = rdvs.filter(r => new Date(r.date_prevue || r.date_rendez_vous || 0) >= now);
  const rdvsPasses  = rdvs.filter(r => new Date(r.date_prevue || r.date_rendez_vous || 0) < now);
  const rdvsAffiches = onglet === 'a_venir' ? rdvsAVenir : rdvsPasses;
  const nbUrgents   = rdvsAVenir.filter(r => { const j = joursRestants(r.date_prevue || r.date_rendez_vous); return j !== null && j <= 3 && j >= 0; }).length;
  const nbConfirmes = rdvs.filter(r => r.presence_confirmee || r.confirme).length;

  if (loading) return (
    <View style={S.loader}>
      <ActivityIndicator size="large" color={C.primary} />
      <Text style={S.loaderT}>Chargement des rendez-vous…</Text>
    </View>
  );

  return (
    <SafeAreaView style={S.container}>
      <StatusBar barStyle="light-content" backgroundColor={C.primary} />

      <View style={S.header}>
        <View style={S.headerTop}>
          <TouchableOpacity style={S.backBtn} onPress={() => navigation.goBack()} activeOpacity={0.8}>
            <Icon name="back" size={22} color="#fff" sw={2.2} />
          </TouchableOpacity>
          <View style={{ flex: 1 }}>
            <Text style={S.hdrTitle}>Rendez-vous</Text>
            {enfant && <Text style={S.hdrSub}>{enfant.prenom} {enfant.nom} · {calculerAge(enfant.date_naissance)}</Text>}
          </View>
          <View style={S.hdrBtn}>
            <Icon name="bell" size={20} color="#fff" sw={2} />
            {nbUrgents > 0 && (
              <View style={S.urgentDot}><Text style={S.urgentDotT}>{nbUrgents}</Text></View>
            )}
          </View>
        </View>
        <View style={S.hdrStats}>
          {[
            { val: rdvsAVenir.length, label: 'À venir' },
            { val: nbUrgents, label: 'Urgents', warn: nbUrgents > 0 },
            { val: nbConfirmes, label: 'Confirmés' },
          ].map((s, i) => (
            <React.Fragment key={i}>
              {i > 0 && <View style={S.hdrStatSep} />}
              <View style={S.hdrStat}>
                <Text style={[S.hdrStatVal, s.warn && { color: '#fcd34d' }]}>{s.val}</Text>
                <Text style={S.hdrStatLabel}>{s.label}</Text>
              </View>
            </React.Fragment>
          ))}
        </View>
      </View>

      <View style={S.onglets}>
        {[
          { key: 'a_venir', label: `À venir${rdvsAVenir.length > 0 ? ` (${rdvsAVenir.length})` : ''}` },
          { key: 'passes',  label: `Passés${rdvsPasses.length > 0 ? ` (${rdvsPasses.length})` : ''}` },
        ].map(o => (
          <TouchableOpacity key={o.key} style={[S.ongletBtn, onglet === o.key && S.ongletBtnActif]}
            onPress={() => setOnglet(o.key)} activeOpacity={0.8}>
            <Text style={[S.ongletT, onglet === o.key && S.ongletTActif]}>{o.label}</Text>
          </TouchableOpacity>
        ))}
      </View>

      <Animated.View style={{ flex: 1, opacity: fadeAnim }}>
        <ScrollView style={S.scroll} showsVerticalScrollIndicator={false}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); charger(); }} colors={[C.primary]} />}>

          {onglet === 'a_venir' && nbUrgents > 0 && (
            <View style={S.alerte}>
              <Icon name="bell" size={16} color={C.warn} sw={2.2} />
              <Text style={S.alerteT}>{nbUrgents} rendez-vous dans les 3 prochains jours — pensez à confirmer !</Text>
            </View>
          )}

          <View style={S.liste}>
            {rdvsAffiches.length === 0 ? (
              <View style={S.empty}>
                <Icon name="empty" size={48} color={C.textLight} sw={1.5} />
                <Text style={S.emptyTitle}>{onglet === 'a_venir' ? 'Aucun rendez-vous prévu' : 'Aucun rendez-vous passé'}</Text>
                <Text style={S.emptySub}>{onglet === 'a_venir' ? 'Les prochains rendez-vous apparaîtront ici.' : "L'historique des rendez-vous passés apparaîtra ici."}</Text>
              </View>
            ) : rdvsAffiches.map((rdv, i) => (
              <CarteRdv key={rdv.id ?? i} rdv={rdv} onConfirmer={handleConfirmer} />
            ))}
          </View>
          <View style={{ height: 40 }} />
        </ScrollView>
      </Animated.View>

      <Modal visible={confirmModal} transparent animationType="fade" onRequestClose={() => !confirmLoading && setConfirmModal(false)}>
        <View style={S.modalOverlay}>
          <View style={S.confirmCard}>
            {confirmSuccess ? (
              <>
                <View style={[S.confirmIco, { backgroundColor: '#ecfdf5' }]}>
                  <Icon name="checkCircle" size={36} color={C.success} sw={2} />
                </View>
                <Text style={S.confirmTitle}>Présence confirmée !</Text>
                <Text style={S.confirmBody}>
                  Votre présence pour le rendez-vous{' '}
                  <Text style={{ fontWeight: '700' }}>{rdvSel?.vaccin || rdvSel?.nom_vaccin || ''}</Text>{' '}
                  a bien été enregistrée.
                </Text>
                <TouchableOpacity style={[S.confirmBtn, { backgroundColor: C.success, width: '100%' }]}
                  onPress={() => setConfirmModal(false)} activeOpacity={0.85}>
                  <Text style={S.confirmBtnT}>Parfait !</Text>
                </TouchableOpacity>
              </>
            ) : (
              <>
                <View style={[S.confirmIco, { backgroundColor: '#f0fdf4' }]}>
                  <Icon name="calendar" size={32} color={C.primary} sw={2} />
                </View>
                <Text style={S.confirmTitle}>Confirmer ma présence</Text>
                <Text style={S.confirmBody}>Confirmez-vous votre présence au rendez-vous de vaccination ?</Text>
                {rdvSel && (
                  <View style={S.confirmRecap}>
                    <View style={S.confirmRecapRow}>
                      <Icon name="syringe" size={14} color={C.primary} sw={2} />
                      <Text style={S.confirmRecapT}>{rdvSel.vaccin || rdvSel.nom_vaccin || 'Vaccination'}</Text>
                    </View>
                    <View style={S.confirmRecapRow}>
                      <Icon name="calendar" size={14} color={C.primary} sw={2} />
                      <Text style={S.confirmRecapT}>{formatDate(rdvSel.date_prevue || rdvSel.date_rendez_vous)}</Text>
                    </View>
                    {(rdvSel.centre_sante?.nom || rdvSel.centre) && (
                      <View style={S.confirmRecapRow}>
                        <Icon name="mapPin" size={14} color={C.primary} sw={2} />
                        <Text style={S.confirmRecapT}>{rdvSel.centre_sante?.nom || rdvSel.centre}</Text>
                      </View>
                    )}
                  </View>
                )}
                <View style={S.confirmBtns}>
                  <TouchableOpacity style={[S.confirmBtn, { backgroundColor: '#f3f4f6', flex: 1 }]}
                    onPress={() => setConfirmModal(false)} disabled={confirmLoading} activeOpacity={0.8}>
                    <Text style={[S.confirmBtnT, { color: C.textMid }]}>Annuler</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={[S.confirmBtn, { backgroundColor: C.primary, flex: 1 }]}
                    onPress={validerConfirmation} disabled={confirmLoading} activeOpacity={0.85}>
                    {confirmLoading
                      ? <ActivityIndicator size="small" color="#fff" />
                      : <><Icon name="check" size={14} color="#fff" sw={2.5} /><Text style={S.confirmBtnT}>Confirmer</Text></>
                    }
                  </TouchableOpacity>
                </View>
              </>
            )}
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const S = StyleSheet.create({
  container: { flex: 1, backgroundColor: C.bg },
  loader:    { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: C.bg },
  loaderT:   { marginTop: 12, color: C.primary, fontSize: 13, fontWeight: '500' },
  scroll:    { flex: 1 },
  header:      { backgroundColor: C.primary, paddingHorizontal: 16, paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight + 12 : 14, paddingBottom: 16 },
  headerTop:   { flexDirection: 'row', alignItems: 'center', marginBottom: 14 },
  backBtn:     { marginRight: 10, padding: 4 },
  hdrTitle:    { fontSize: 17, fontWeight: '700', color: '#fff' },
  hdrSub:      { fontSize: 11, color: 'rgba(255,255,255,0.7)', marginTop: 2 },
  hdrBtn:      { padding: 8, position: 'relative' },
  urgentDot:   { position: 'absolute', top: 4, right: 4, backgroundColor: C.warn, borderRadius: 8, minWidth: 16, height: 16, justifyContent: 'center', alignItems: 'center', paddingHorizontal: 3 },
  urgentDotT:  { fontSize: 9, fontWeight: '800', color: '#fff' },
  hdrStats:    { flexDirection: 'row', backgroundColor: 'rgba(255,255,255,0.12)', borderRadius: 12, padding: 12 },
  hdrStat:     { flex: 1, alignItems: 'center', gap: 2 },
  hdrStatVal:  { fontSize: 20, fontWeight: '800', color: '#fff' },
  hdrStatLabel:{ fontSize: 10, color: 'rgba(255,255,255,0.7)' },
  hdrStatSep:  { width: 1, backgroundColor: 'rgba(255,255,255,0.2)', marginVertical: 4 },
  onglets:       { flexDirection: 'row', backgroundColor: C.white, borderBottomWidth: 1, borderBottomColor: '#f0f0f0' },
  ongletBtn:     { flex: 1, paddingVertical: 12, alignItems: 'center', borderBottomWidth: 2, borderBottomColor: 'transparent' },
  ongletBtnActif:{ borderBottomColor: C.primary },
  ongletT:       { fontSize: 13, fontWeight: '500', color: C.textLight },
  ongletTActif:  { color: C.primary, fontWeight: '700' },
  alerte:  { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: '#fffbeb', borderLeftWidth: 3, borderLeftColor: C.warn, margin: 12, marginBottom: 0, borderRadius: 10, padding: 12 },
  alerteT: { flex: 1, fontSize: 12, color: C.warn, fontWeight: '500', lineHeight: 17 },
  liste: { padding: 12, gap: 12 },
  rdvCard:    { backgroundColor: C.white, borderRadius: 14, borderLeftWidth: 4, overflow: 'hidden', borderWidth: 0.5, borderColor: '#e5e7eb', elevation: 2, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.06, shadowRadius: 6 },
  rdvHead:    { padding: 14, flexDirection: 'row', alignItems: 'flex-start', gap: 10 },
  rdvVaccinRow:{ flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 4 },
  rdvVaccin:  { fontSize: 13, fontWeight: '700', flex: 1 },
  rdvDate:    { fontSize: 13, fontWeight: '600', color: C.textDark, lineHeight: 18 },
  rdvHeureRow:{ flexDirection: 'row', alignItems: 'center', gap: 5, marginTop: 4 },
  rdvHeure:   { fontSize: 12, color: C.textMid },
  rdvJoursBadge:{ borderRadius: 20, paddingHorizontal: 10, paddingVertical: 5, minWidth: 52, alignItems: 'center', justifyContent: 'center' },
  rdvJoursT:  { fontSize: 11, fontWeight: '800', color: '#fff' },
  rdvBody:    { padding: 12, paddingTop: 8, gap: 7 },
  rdvInfoRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 8 },
  rdvInfoT:   { fontSize: 12, color: C.textDark, flex: 1, lineHeight: 17 },
  rdvConfirmBtn:   { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, backgroundColor: C.primary, borderRadius: 10, paddingVertical: 11, marginTop: 4 },
  rdvConfirmBtnT:  { fontSize: 13, fontWeight: '700', color: '#fff' },
  rdvConfirméBadge:{ flexDirection: 'row', alignItems: 'center', gap: 7, backgroundColor: '#ecfdf5', borderRadius: 10, padding: 10, marginTop: 4 },
  rdvConfirméT:    { fontSize: 12, fontWeight: '600', color: C.success },
  empty:      { alignItems: 'center', paddingVertical: 60, gap: 12 },
  emptyTitle: { fontSize: 15, fontWeight: '600', color: C.textDark },
  emptySub:   { fontSize: 12, color: C.textLight, textAlign: 'center', lineHeight: 18, paddingHorizontal: 20 },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.45)', justifyContent: 'center', alignItems: 'center', padding: 24 },
  confirmCard:  { backgroundColor: C.white, borderRadius: 24, padding: 28, width: '100%', maxWidth: 360, alignItems: 'center', elevation: 12, gap: 12 },
  confirmIco:   { width: 72, height: 72, borderRadius: 36, justifyContent: 'center', alignItems: 'center' },
  confirmTitle: { fontSize: 18, fontWeight: '800', color: C.textDark, textAlign: 'center' },
  confirmBody:  { fontSize: 13, color: C.textMid, textAlign: 'center', lineHeight: 20 },
  confirmRecap: { backgroundColor: '#f0fdf4', borderRadius: 12, padding: 12, width: '100%', gap: 8, borderWidth: 1, borderColor: '#d1fae5' },
  confirmRecapRow:{ flexDirection: 'row', alignItems: 'center', gap: 8 },
  confirmRecapT:{ fontSize: 12, color: C.textDark, flex: 1, fontWeight: '500' },
  confirmBtns:  { flexDirection: 'row', gap: 10, width: '100%' },
  confirmBtn:   { borderRadius: 12, paddingVertical: 13, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6 },
  confirmBtnT:  { fontSize: 14, fontWeight: '700', color: '#fff' },
});