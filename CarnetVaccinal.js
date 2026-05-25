import React, { useState, useEffect, useRef } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, StyleSheet,
  SafeAreaView, StatusBar, ActivityIndicator, Animated,
  Modal, Share, Platform, Dimensions,
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
  textLight: '#9ca3af',
  textMid:   '#6b7280',
  textDark:  '#111827',
};

// ─── ICÔNES SVG
const Icon = ({ name, size = 22, color = C.primary, sw = 1.8 }) => {
  const p = { stroke: color, strokeWidth: sw, fill: 'none', strokeLinecap: 'round', strokeLinejoin: 'round' };
  const map = {
    back:        <Svg width={size} height={size} viewBox="0 0 24 24"><Polyline {...p} points="15 18 9 12 15 6"/></Svg>,
    shield:      <Svg width={size} height={size} viewBox="0 0 24 24"><Path {...p} d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></Svg>,
    check:       <Svg width={size} height={size} viewBox="0 0 24 24"><Polyline {...p} points="20 6 9 17 4 12"/></Svg>,
    clock:       <Svg width={size} height={size} viewBox="0 0 24 24"><Circle {...p} cx="12" cy="12" r="10"/><Polyline {...p} points="12 6 12 12 16 14"/></Svg>,
    alert:       <Svg width={size} height={size} viewBox="0 0 24 24"><Path {...p} d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><Line {...p} x1="12" y1="9" x2="12" y2="13"/><Line {...p} x1="12" y1="17" x2="12.01" y2="17"/></Svg>,
    share:       <Svg width={size} height={size} viewBox="0 0 24 24"><Circle {...p} cx="18" cy="5" r="3"/><Circle {...p} cx="6" cy="12" r="3"/><Circle {...p} cx="18" cy="19" r="3"/><Line {...p} x1="8.59" y1="13.51" x2="15.42" y2="17.49"/><Line {...p} x1="15.41" y1="6.51" x2="8.59" y2="10.49"/></Svg>,
    syringe:     <Svg width={size} height={size} viewBox="0 0 24 24"><Line {...p} x1="3" y1="21" x2="7" y2="17"/><Line {...p} x1="7" y1="17" x2="16" y2="8"/><Line {...p} x1="16" y1="8" x2="20" y2="4"/><Line {...p} x1="18" y1="2" x2="22" y2="6"/><Line {...p} x1="6" y1="15" x2="15" y2="6"/><Line {...p} x1="9" y1="18" x2="18" y2="9"/></Svg>,
    mapPin:      <Svg width={size} height={size} viewBox="0 0 24 24"><Path {...p} d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><Circle {...p} cx="12" cy="10" r="3"/></Svg>,
    user:        <Svg width={size} height={size} viewBox="0 0 24 24"><Path {...p} d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><Circle {...p} cx="12" cy="7" r="4"/></Svg>,
    chevronDown: <Svg width={size} height={size} viewBox="0 0 24 24"><Polyline {...p} points="6 9 12 15 18 9"/></Svg>,
    chevronUp:   <Svg width={size} height={size} viewBox="0 0 24 24"><Polyline {...p} points="18 15 12 9 6 15"/></Svg>,
    calendar:    <Svg width={size} height={size} viewBox="0 0 24 24"><Rect {...p} x="3" y="4" width="18" height="18" rx="2" ry="2"/><Line {...p} x1="16" y1="2" x2="16" y2="6"/><Line {...p} x1="8" y1="2" x2="8" y2="6"/><Line {...p} x1="3" y1="10" x2="21" y2="10"/></Svg>,
    book:        <Svg width={size} height={size} viewBox="0 0 24 24"><Path {...p} d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/><Path {...p} d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/></Svg>,
  };
  return map[name] || null;
};

// ─── HELPERS
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
  const now = new Date(), naissance = new Date(dn);
  const jours = Math.floor((now - naissance) / 86400000);
  const mois  = Math.floor(jours / 30.4375);
  const ans   = Math.floor(jours / 365.25);
  if (jours < 1)  return "Aujourd'hui";
  if (jours < 30) return `${jours} jour${jours > 1 ? 's' : ''}`;
  if (mois < 12)  return `${mois} mois`;
  if (ans === 1)  { const r = mois - 12; return r > 0 ? `1 an et ${r} mois` : '1 an'; }
  const r = mois - ans * 12;
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

// ─── LIGNE VACCIN EXPANDABLE
const LigneVaccin = ({ v }) => {
  const [open, setOpen] = useState(false);
  const anim = useRef(new Animated.Value(0)).current;
  const statut    = statutVaccin(v);
  const estFait   = statut === 'fait';
  const estRetard = statut === 'retard';

  const chipBg    = estFait ? '#d1fae5' : estRetard ? '#fee2e2' : '#fef3c7';
  const chipColor = estFait ? C.success  : estRetard ? C.danger  : C.warn;

  const toggle = () => {
    if (!estFait) return;
    setOpen(o => {
      Animated.timing(anim, { toValue: o ? 0 : 1, duration: 220, useNativeDriver: false }).start();
      return !o;
    });
  };

  const detailH = anim.interpolate({ inputRange: [0, 1], outputRange: [0, 120] });

  return (
    <View style={[S.vaccinCard, { borderLeftColor: chipColor }]}>

      {/* Ligne principale */}
      <TouchableOpacity style={S.vaccinMain} onPress={toggle} activeOpacity={estFait ? 0.75 : 1}>
        <View style={[S.vaccinIcoBg, { backgroundColor: chipBg }]}>
          <Icon
            name={estFait ? 'check' : estRetard ? 'alert' : 'clock'}
            size={14} color={chipColor} sw={2.5}
          />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={S.vaccinNom}>{v.vaccin || v.nom_vaccin || '—'}</Text>
          {v.age_cible && <Text style={S.vaccinAgeCible}>{v.age_cible}</Text>}
        </View>
        <View style={{ alignItems: 'flex-end', gap: 4 }}>
          <View style={[S.chipStatut, { backgroundColor: chipBg }]}>
            <Text style={[S.chipStatutT, { color: chipColor }]}>
              {estFait ? '✓ Reçu' : estRetard ? 'En retard' : 'À venir'}
            </Text>
          </View>
          {estFait && (
            <Icon name={open ? 'chevronUp' : 'chevronDown'} size={14} color={C.textLight} sw={2} />
          )}
        </View>
      </TouchableOpacity>

      {/* Date reçue (si fait) visible en dehors du détail */}
      {estFait && (
        <View style={S.vaccinDateRecu}>
          <Icon name="calendar" size={12} color={C.success} sw={2} />
          <Text style={[S.vaccinDateRecuT, { color: C.success }]}>
            Reçu le {formatDateCourt(v.date_administration)}
          </Text>
        </View>
      )}

      {/* Date prévue (si pas encore fait) */}
      {!estFait && v.date_prevue && (
        <View style={S.vaccinDateRecu}>
          <Icon name={estRetard ? 'alert' : 'calendar'} size={12} color={chipColor} sw={2} />
          <Text style={[S.vaccinDateRecuT, { color: chipColor }]}>
            {estRetard ? 'Prévu le (à rattraper) : ' : 'Prévu le : '}
            {formatDateCourt(v.date_prevue)}
          </Text>
        </View>
      )}

      {/* Détails expandables (uniquement si fait) — centre + agent + lot */}
      {estFait && (
        <Animated.View style={[{ overflow: 'hidden', maxHeight: detailH }]}>
          <View style={S.vaccinDetailInner}>
            <View style={S.detailRow}>
              <Icon name="mapPin" size={13} color={C.primary} sw={2} />
              <Text style={S.detailLabel}>Centre</Text>
              <Text style={S.detailVal}>{v.centre_sante?.nom ?? v.centre ?? '—'}</Text>
            </View>
            <View style={S.detailRow}>
              <Icon name="user" size={13} color={C.primary} sw={2} />
              <Text style={S.detailLabel}>Agent</Text>
              <Text style={S.detailVal}>
                {v.agent
                  ? `${v.agent.prenom ?? ''} ${v.agent.nom ?? ''}`.trim() || '—'
                  : '—'}
              </Text>
            </View>
            {v.numero_lot && (
              <View style={S.detailRow}>
                <Icon name="syringe" size={13} color={C.primary} sw={2} />
                <Text style={S.detailLabel}>N° lot</Text>
                <Text style={S.detailVal}>{v.numero_lot}</Text>
              </View>
            )}
          </View>
        </Animated.View>
      )}
    </View>
  );
};

// ─── COMPOSANT PRINCIPAL
export default function CarnetVaccinal({ route, navigation }) {
  const { enfantId, enfant: enfantParam } = route?.params ?? {};

  const [loading, setLoading]     = useState(true);
  const [enfant, setEnfant]       = useState(enfantParam ?? null);
  const [vaccins, setVaccins]     = useState([]);
  const [filtre, setFiltre]       = useState('tous');
  const [carnetModal, setCarnetModal] = useState(false);

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

      const raw = extraireTableau(vacRes);
      // Trier : faits d'abord (par date admin), puis retard, puis à venir
      raw.sort((a, b) => {
        const sA = statutVaccin(a), sB = statutVaccin(b);
        const ordre = { fait: 0, retard: 1, a_venir: 2 };
        if (ordre[sA] !== ordre[sB]) return ordre[sA] - ordre[sB];
        const dA = new Date(a.date_administration || a.date_prevue || 0);
        const dB = new Date(b.date_administration || b.date_prevue || 0);
        return dB - dA; // plus récent en premier dans chaque groupe
      });
      setVaccins(raw);
    } catch (e) {
      console.error('CarnetVaccinal:', e?.response?.data || e.message);
    } finally {
      setLoading(false);
      Animated.timing(fadeAnim, { toValue: 1, duration: 350, useNativeDriver: true }).start();
    }
  };

  // Stats
  const nbFaits  = vaccins.filter(v => v.date_administration).length;
  const nbRetard = vaccins.filter(v => statutVaccin(v) === 'retard').length;
  const nbAVenir = vaccins.filter(v => statutVaccin(v) === 'a_venir').length;
  const nbTotal  = vaccins.length;
  const pctCouv  = nbTotal > 0 ? Math.round((nbFaits / nbTotal) * 100) : 0;

  const vaccinsFiltrés = filtre === 'tous'    ? vaccins
                       : filtre === 'fait'    ? vaccins.filter(v => v.date_administration)
                       : filtre === 'retard'  ? vaccins.filter(v => statutVaccin(v) === 'retard')
                       :                        vaccins.filter(v => statutVaccin(v) === 'a_venir');

  // Prépare le texte à partager
  const handlePartager = async () => {
    const lignesFaits = vaccins
      .filter(v => v.date_administration)
      .map(v => `  ✓ ${v.vaccin || v.nom_vaccin} — ${formatDateCourt(v.date_administration)} (${v.centre_sante?.nom ?? v.centre ?? 'Centre inconnu'})`)
      .join('\n');

    const lignesRetard = vaccins
      .filter(v => statutVaccin(v) === 'retard')
      .map(v => `  ⚠ ${v.vaccin || v.nom_vaccin} — prévu le ${formatDateCourt(v.date_prevue)} (à rattraper)`)
      .join('\n');

    const lignesAVenir = vaccins
      .filter(v => statutVaccin(v) === 'a_venir')
      .map(v => `  🕐 ${v.vaccin || v.nom_vaccin}${v.date_prevue ? ` — prévu le ${formatDateCourt(v.date_prevue)}` : ''}`)
      .join('\n');

    const texte = [
      `📋 CARNET VACCINAL — VacciBénin`,
      `─────────────────────────`,
      `Enfant : ${enfant?.prenom ?? ''} ${enfant?.nom ?? ''}`,
      `Âge    : ${calculerAge(enfant?.date_naissance)}`,
      `─────────────────────────`,
      `✅ VACCINS REÇUS (${nbFaits}/${nbTotal})`,
      lignesFaits || '  Aucun',
      nbRetard > 0 ? `\n⚠️  EN RETARD (${nbRetard})` : '',
      nbRetard > 0 ? lignesRetard : '',
      nbAVenir > 0 ? `\n🔜 À VENIR (${nbAVenir})` : '',
      nbAVenir > 0 ? lignesAVenir : '',
      `─────────────────────────`,
      `Couverture : ${pctCouv}%`,
      `Généré le ${formatDateCourt(new Date())} via VacciBénin`,
    ].filter(l => l !== '').join('\n');

    try {
      await Share.share({ message: texte, title: 'Carnet vaccinal VacciBénin' });
    } catch {}
  };

  if (loading) return (
    <View style={S.loader}>
      <ActivityIndicator size="large" color={C.primary} />
      <Text style={S.loaderT}>Chargement du carnet…</Text>
    </View>
  );

  const FILTRES = [
    { key: 'tous',    label: `Tous (${nbTotal})` },
    { key: 'fait',    label: `Reçus (${nbFaits})` },
    { key: 'retard',  label: `Retard (${nbRetard})` },
    { key: 'a_venir', label: `À venir (${nbAVenir})` },
  ];

  return (
    <SafeAreaView style={S.container}>
      <StatusBar barStyle="light-content" backgroundColor={C.primary} />

      {/* ══ HEADER ══ */}
      <View style={S.header}>
        <View style={S.headerTop}>
          <TouchableOpacity style={S.backBtn} onPress={() => navigation.goBack()} activeOpacity={0.8}>
            <Icon name="back" size={22} color="#fff" sw={2.2} />
          </TouchableOpacity>
          <View style={{ flex: 1 }}>
            <Text style={S.hdrTitle}>Carnet Vaccinal</Text>
            {enfant && (
              <Text style={S.hdrSub}>{enfant.prenom} {enfant.nom} · {calculerAge(enfant.date_naissance)}</Text>
            )}
          </View>
          <TouchableOpacity style={S.hdrBtn} onPress={() => setCarnetModal(true)} activeOpacity={0.8}>
            <Icon name="book" size={20} color="#fff" sw={2} />
          </TouchableOpacity>
        </View>

        {/* Barre couverture */}
        <View style={S.hdrProgress}>
          <View style={S.hdrProgRow}>
            <Text style={S.hdrProgLabel}>Couverture vaccinale</Text>
            <Text style={[S.hdrProgPct, {
              color: pctCouv >= 90 ? '#6ee7b7' : pctCouv >= 70 ? '#fcd34d' : '#fca5a5'
            }]}>{pctCouv}%</Text>
          </View>
          <View style={S.hdrProgBg}>
            <View style={[S.hdrProgFill, {
              width: `${pctCouv}%`,
              backgroundColor: pctCouv >= 90 ? '#6ee7b7' : pctCouv >= 70 ? '#fcd34d' : '#fca5a5',
            }]} />
          </View>
        </View>
      </View>

      <Animated.View style={{ flex: 1, opacity: fadeAnim }}>
        <ScrollView style={S.scroll} showsVerticalScrollIndicator={false}>

          {/* ── Cartes stats ── */}
          <View style={S.statsRow}>
            {[
              { key: 'fait',    label: 'Reçus',      val: nbFaits,  bg: '#ecfdf5', color: C.success, icon: 'check' },
              { key: 'retard',  label: 'En retard',  val: nbRetard, bg: '#fef2f2', color: C.danger,  icon: 'alert' },
              { key: 'a_venir', label: 'À venir',    val: nbAVenir, bg: '#fffbeb', color: C.warn,    icon: 'clock' },
            ].map(s => (
              <TouchableOpacity key={s.key}
                style={[S.statCard, { backgroundColor: s.bg }, filtre === s.key && S.statCardActif]}
                onPress={() => setFiltre(filtre === s.key ? 'tous' : s.key)}
                activeOpacity={0.8}
              >
                <Icon name={s.icon} size={18} color={s.color} sw={2.2} />
                <Text style={[S.statVal, { color: s.color }]}>{s.val}</Text>
                <Text style={[S.statLabel, { color: s.color + 'cc' }]}>{s.label}</Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* ── Filtres ── */}
          <ScrollView horizontal showsHorizontalScrollIndicator={false}
            style={S.filtresScroll} contentContainerStyle={S.filtresCont}>
            {FILTRES.map(f => (
              <TouchableOpacity key={f.key}
                style={[S.filtreChip, filtre === f.key && S.filtreChipActif]}
                onPress={() => setFiltre(f.key)} activeOpacity={0.8}>
                <Text style={[S.filtreChipT, filtre === f.key && S.filtreChipTActif]}>
                  {f.label}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>

          {/* ── Section titre ── */}
          <View style={S.listeSection}>
            <View style={S.secHead}>
              <View style={S.secLine} />
              <Text style={S.secHeadT}>
                {filtre === 'tous'    ? 'TOUS LES VACCINS'
                 : filtre === 'fait'  ? 'VACCINS REÇUS'
                 : filtre === 'retard'? 'VACCINS EN RETARD (À RATTRAPER)'
                 :                     'VACCINS À VENIR'}
              </Text>
            </View>

            {vaccinsFiltrés.length === 0 ? (
              <View style={S.vide}>
                <Icon name="syringe" size={36} color={C.textLight} />
                <Text style={S.videT}>Aucun vaccin dans cette catégorie</Text>
              </View>
            ) : vaccinsFiltrés.map((v, i) => (
              <LigneVaccin key={i} v={v} />
            ))}
          </View>

          <View style={{ height: 40 }} />
        </ScrollView>
      </Animated.View>

      {/* ══ MODAL CARNET COMPLET ══ */}
      <Modal visible={carnetModal} transparent animationType="slide" onRequestClose={() => setCarnetModal(false)}>
        <View style={S.modalOverlay}>
          <View style={S.carnetModal}>

            {/* En-tête */}
            <View style={S.carnetModalHead}>
              <View style={S.carnetModalLogo}>
                <Icon name="book" size={28} color="#fff" sw={2} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={S.carnetModalTitle}>Carnet Vaccinal</Text>
                <Text style={S.carnetModalSub}>{enfant?.prenom} {enfant?.nom} · {calculerAge(enfant?.date_naissance)}</Text>
              </View>
              <TouchableOpacity onPress={() => setCarnetModal(false)} style={{ padding: 8 }}>
                <Text style={{ color: 'rgba(255,255,255,0.8)', fontSize: 20 }}>✕</Text>
              </TouchableOpacity>
            </View>

            <ScrollView style={{ maxHeight: '75%' }} showsVerticalScrollIndicator={false}>
              <View style={S.carnetModalBody}>

                {/* Infos enfant */}
                <View style={S.carnetEnfantBox}>
                  <View style={S.carnetEnfantRow}>
                    <Text style={S.carnetEnfantLabel}>Nom complet</Text>
                    <Text style={S.carnetEnfantVal}>{enfant?.prenom} {enfant?.nom}</Text>
                  </View>
                  <View style={S.carnetEnfantRow}>
                    <Text style={S.carnetEnfantLabel}>Date de naissance</Text>
                    <Text style={S.carnetEnfantVal}>{formatDate(enfant?.date_naissance)}</Text>
                  </View>
                  <View style={S.carnetEnfantRow}>
                    <Text style={S.carnetEnfantLabel}>Âge</Text>
                    <Text style={S.carnetEnfantVal}>{calculerAge(enfant?.date_naissance)}</Text>
                  </View>
                  <View style={[S.carnetEnfantRow, { borderBottomWidth: 0 }]}>
                    <Text style={S.carnetEnfantLabel}>Couverture</Text>
                    <Text style={[S.carnetEnfantVal, {
                      color: pctCouv >= 90 ? C.success : pctCouv >= 70 ? C.warn : C.danger,
                      fontWeight: '700'
                    }]}>{pctCouv}% ({nbFaits}/{nbTotal})</Text>
                  </View>
                </View>

                {/* ── SECTION : VACCINS REÇUS ── */}
                {nbFaits > 0 && (
                  <View style={S.carnetSection}>
                    <View style={[S.carnetSecHead, { backgroundColor: '#ecfdf5' }]}>
                      <Icon name="check" size={14} color={C.success} sw={2.5} />
                      <Text style={[S.carnetSecTitle, { color: C.success }]}>
                        VACCINS REÇUS ({nbFaits})
                      </Text>
                    </View>
                    {vaccins.filter(v => v.date_administration).map((v, i) => (
                      <View key={i} style={S.carnetLigne}>
                        <View style={S.carnetLigneDot} />
                        <View style={{ flex: 1 }}>
                          <Text style={S.carnetLigneNom}>{v.vaccin || v.nom_vaccin}</Text>
                          <Text style={S.carnetLigneMeta}>
                            {formatDateCourt(v.date_administration)}
                            {(v.centre_sante?.nom || v.centre) ? `  ·  ${v.centre_sante?.nom ?? v.centre}` : ''}
                          </Text>
                        </View>
                        <View style={[S.carnetChip, { backgroundColor: '#d1fae5' }]}>
                          <Text style={[S.carnetChipT, { color: C.success }]}>✓</Text>
                        </View>
                      </View>
                    ))}
                  </View>
                )}

                {/* ── SECTION : EN RETARD ── */}
                {nbRetard > 0 && (
                  <View style={S.carnetSection}>
                    <View style={[S.carnetSecHead, { backgroundColor: '#fef2f2' }]}>
                      <Icon name="alert" size={14} color={C.danger} sw={2.5} />
                      <Text style={[S.carnetSecTitle, { color: C.danger }]}>
                        EN RETARD — À RATTRAPER ({nbRetard})
                      </Text>
                    </View>
                    {vaccins.filter(v => statutVaccin(v) === 'retard').map((v, i) => (
                      <View key={i} style={S.carnetLigne}>
                        <View style={[S.carnetLigneDot, { backgroundColor: C.danger }]} />
                        <View style={{ flex: 1 }}>
                          <Text style={S.carnetLigneNom}>{v.vaccin || v.nom_vaccin}</Text>
                          <Text style={[S.carnetLigneMeta, { color: C.danger }]}>
                            Prévu le {formatDateCourt(v.date_prevue)}
                          </Text>
                        </View>
                        <View style={[S.carnetChip, { backgroundColor: '#fee2e2' }]}>
                          <Text style={[S.carnetChipT, { color: C.danger }]}>!</Text>
                        </View>
                      </View>
                    ))}
                  </View>
                )}

                {/* ── SECTION : À VENIR ── */}
                {nbAVenir > 0 && (
                  <View style={S.carnetSection}>
                    <View style={[S.carnetSecHead, { backgroundColor: '#fffbeb' }]}>
                      <Icon name="clock" size={14} color={C.warn} sw={2.5} />
                      <Text style={[S.carnetSecTitle, { color: C.warn }]}>
                        À VENIR ({nbAVenir})
                      </Text>
                    </View>
                    {vaccins.filter(v => statutVaccin(v) === 'a_venir').map((v, i) => (
                      <View key={i} style={S.carnetLigne}>
                        <View style={[S.carnetLigneDot, { backgroundColor: C.warn }]} />
                        <View style={{ flex: 1 }}>
                          <Text style={S.carnetLigneNom}>{v.vaccin || v.nom_vaccin}</Text>
                          {v.date_prevue
                            ? <Text style={[S.carnetLigneMeta, { color: C.warn }]}>Prévu le {formatDateCourt(v.date_prevue)}</Text>
                            : <Text style={S.carnetLigneMeta}>Date non planifiée</Text>
                          }
                        </View>
                        <View style={[S.carnetChip, { backgroundColor: '#fef3c7' }]}>
                          <Text style={[S.carnetChipT, { color: C.warn }]}>→</Text>
                        </View>
                      </View>
                    ))}
                  </View>
                )}

                <Text style={S.carnetFooter}>
                  Généré le {formatDateCourt(new Date())} via VacciBénin
                </Text>
              </View>
            </ScrollView>

            {/* Bouton partager */}
            <View style={S.carnetModalBtns}>
              <TouchableOpacity style={[S.carnetBtn, { backgroundColor: C.primary, flex: 2 }]}
                onPress={() => { setCarnetModal(false); setTimeout(handlePartager, 400); }}
                activeOpacity={0.85}>
                <Icon name="share" size={16} color="#fff" sw={2} />
                <Text style={S.carnetBtnT}>Partager ce carnet</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[S.carnetBtn, { backgroundColor: '#f3f4f6', flex: 1 }]}
                onPress={() => setCarnetModal(false)} activeOpacity={0.85}>
                <Text style={[S.carnetBtnT, { color: C.textMid }]}>Fermer</Text>
              </TouchableOpacity>
            </View>

          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

// ─── STYLES
const S = StyleSheet.create({
  container: { flex: 1, backgroundColor: C.bg },
  loader:    { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: C.bg },
  loaderT:   { marginTop: 12, color: C.primary, fontSize: 13, fontWeight: '500' },
  scroll:    { flex: 1 },

  header:       { backgroundColor: C.primary, paddingHorizontal: 16, paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight + 12 : 14, paddingBottom: 16 },
  headerTop:    { flexDirection: 'row', alignItems: 'center', marginBottom: 14 },
  backBtn:      { marginRight: 10, padding: 4 },
  hdrTitle:     { fontSize: 17, fontWeight: '700', color: '#fff' },
  hdrSub:       { fontSize: 11, color: 'rgba(255,255,255,0.7)', marginTop: 2 },
  hdrBtn:       { padding: 8 },
  hdrProgress:  { gap: 6 },
  hdrProgRow:   { flexDirection: 'row', justifyContent: 'space-between' },
  hdrProgLabel: { fontSize: 11, color: 'rgba(255,255,255,0.75)' },
  hdrProgPct:   { fontSize: 12, fontWeight: '700' },
  hdrProgBg:    { height: 6, backgroundColor: 'rgba(255,255,255,0.2)', borderRadius: 4, overflow: 'hidden' },
  hdrProgFill:  { height: '100%', borderRadius: 4 },

  statsRow:     { flexDirection: 'row', gap: 8, paddingHorizontal: 12, marginTop: 12 },
  statCard:     { flex: 1, borderRadius: 12, paddingVertical: 12, alignItems: 'center', gap: 4 },
  statCardActif:{ borderWidth: 2, borderColor: C.primary },
  statVal:      { fontSize: 20, fontWeight: '800' },
  statLabel:    { fontSize: 10, fontWeight: '500' },

  filtresScroll: { marginTop: 10 },
  filtresCont:   { paddingHorizontal: 12, gap: 8, flexDirection: 'row' },
  filtreChip:    { borderWidth: 1.5, borderColor: '#d1d5db', borderRadius: 20, paddingHorizontal: 14, paddingVertical: 7 },
  filtreChipActif:{ backgroundColor: C.primary, borderColor: C.primary },
  filtreChipT:   { fontSize: 12, fontWeight: '500', color: C.textMid },
  filtreChipTActif:{ color: '#fff', fontWeight: '700' },

  listeSection:  { paddingHorizontal: 12, marginTop: 14 },
  secHead:       { flexDirection: 'row', alignItems: 'center', marginBottom: 10, gap: 8 },
  secLine:       { width: 3, height: 14, backgroundColor: C.primary, borderRadius: 2 },
  secHeadT:      { fontSize: 10, fontWeight: '700', color: C.textDark, letterSpacing: 0.5 },

  vaccinCard:    { backgroundColor: C.white, borderRadius: 12, marginBottom: 8, borderLeftWidth: 4, borderWidth: 0.5, borderColor: '#e5e7eb', elevation: 1, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.04, shadowRadius: 3 },
  vaccinMain:    { flexDirection: 'row', alignItems: 'center', padding: 12, gap: 10 },
  vaccinIcoBg:   { width: 28, height: 28, borderRadius: 14, justifyContent: 'center', alignItems: 'center' },
  vaccinNom:     { fontSize: 13, fontWeight: '600', color: C.textDark },
  vaccinAgeCible:{ fontSize: 10, color: C.textLight, marginTop: 2 },
  chipStatut:    { borderRadius: 20, paddingHorizontal: 9, paddingVertical: 3 },
  chipStatutT:   { fontSize: 10, fontWeight: '700' },

  vaccinDateRecu:  { flexDirection: 'row', alignItems: 'center', gap: 5, paddingHorizontal: 12, paddingBottom: 10, marginTop: -4 },
  vaccinDateRecuT: { fontSize: 11 },

  vaccinDetailInner: { padding: 12, gap: 8, borderTopWidth: 0.5, borderTopColor: '#f3f4f6' },
  detailRow:   { flexDirection: 'row', alignItems: 'center', gap: 8 },
  detailLabel: { fontSize: 11, color: C.textMid, width: 80 },
  detailVal:   { fontSize: 11, fontWeight: '600', color: C.textDark, flex: 1 },

  vide:  { alignItems: 'center', paddingVertical: 40, gap: 10 },
  videT: { color: C.textLight, fontSize: 13 },

  // Modal carnet
  modalOverlay:     { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  carnetModal:      { backgroundColor: C.white, borderTopLeftRadius: 24, borderTopRightRadius: 24, overflow: 'hidden', maxHeight: '92%' },
  carnetModalHead:  { backgroundColor: C.primary, paddingHorizontal: 16, paddingTop: 20, paddingBottom: 16, flexDirection: 'row', alignItems: 'center', gap: 12 },
  carnetModalLogo:  { width: 44, height: 44, borderRadius: 22, backgroundColor: 'rgba(255,255,255,0.2)', justifyContent: 'center', alignItems: 'center' },
  carnetModalTitle: { fontSize: 16, fontWeight: '800', color: '#fff' },
  carnetModalSub:   { fontSize: 11, color: 'rgba(255,255,255,0.75)', marginTop: 2 },

  carnetModalBody:  { padding: 16, gap: 14 },

  carnetEnfantBox:  { backgroundColor: '#f9fafb', borderRadius: 12, borderWidth: 1, borderColor: '#e5e7eb', overflow: 'hidden' },
  carnetEnfantRow:  { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 14, paddingVertical: 10, borderBottomWidth: 0.5, borderBottomColor: '#e5e7eb' },
  carnetEnfantLabel:{ fontSize: 12, color: C.textMid },
  carnetEnfantVal:  { fontSize: 12, fontWeight: '600', color: C.textDark },

  carnetSection:    { borderRadius: 12, overflow: 'hidden', borderWidth: 1, borderColor: '#e5e7eb' },
  carnetSecHead:    { flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 12, paddingVertical: 10 },
  carnetSecTitle:   { fontSize: 10, fontWeight: '700', letterSpacing: 0.5 },

  carnetLigne:      { flexDirection: 'row', alignItems: 'center', gap: 10, paddingHorizontal: 12, paddingVertical: 10, borderTopWidth: 0.5, borderTopColor: '#f3f4f6', backgroundColor: C.white },
  carnetLigneDot:   { width: 7, height: 7, borderRadius: 4, backgroundColor: C.success },
  carnetLigneNom:   { fontSize: 12, fontWeight: '600', color: C.textDark },
  carnetLigneMeta:  { fontSize: 11, color: C.textMid, marginTop: 2 },
  carnetChip:       { width: 24, height: 24, borderRadius: 12, justifyContent: 'center', alignItems: 'center' },
  carnetChipT:      { fontSize: 13, fontWeight: '800' },

  carnetFooter:     { fontSize: 10, color: C.textLight, textAlign: 'center', marginTop: 4 },

  carnetModalBtns:  { flexDirection: 'row', gap: 10, padding: 14 },
  carnetBtn:        { borderRadius: 12, paddingVertical: 13, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8 },
  carnetBtnT:       { fontSize: 14, fontWeight: '700', color: '#fff' },
});