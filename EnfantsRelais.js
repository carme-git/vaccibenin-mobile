import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, StyleSheet,
  SafeAreaView, StatusBar, RefreshControl, ActivityIndicator,
  Modal, Platform, TextInput, Linking,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
import { API_URL } from './config';
import Svg, { Path, Circle, Line, Polyline, Rect } from 'react-native-svg';

// ─── PALETTE
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

// ─── ICÔNES SVG
const Icon = ({ name, size = 22, color = C.primary, sw = 1.8 }) => {
  const p = { stroke: color, strokeWidth: sw, fill: 'none', strokeLinecap: 'round', strokeLinejoin: 'round' };
  const map = {
    arrowLeft: <Svg width={size} height={size} viewBox="0 0 24 24"><Polyline {...p} points="15 18 9 12 15 6"/></Svg>,
    user:      <Svg width={size} height={size} viewBox="0 0 24 24"><Path {...p} d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><Circle {...p} cx="12" cy="7" r="4"/></Svg>,
    users:     <Svg width={size} height={size} viewBox="0 0 24 24"><Path {...p} d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><Circle {...p} cx="9" cy="7" r="4"/><Path {...p} d="M23 21v-2a4 4 0 0 0-3-3.87"/><Path {...p} d="M16 3.13a4 4 0 0 1 0 7.75"/></Svg>,
    search:    <Svg width={size} height={size} viewBox="0 0 24 24"><Circle {...p} cx="11" cy="11" r="8"/><Line {...p} x1="21" y1="21" x2="16.65" y2="16.65"/></Svg>,
    x:         <Svg width={size} height={size} viewBox="0 0 24 24"><Line {...p} x1="18" y1="6" x2="6" y2="18"/><Line {...p} x1="6" y1="6" x2="18" y2="18"/></Svg>,
    phone:     <Svg width={size} height={size} viewBox="0 0 24 24"><Path {...p} d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.69 12 19.79 19.79 0 0 1 1.61 3.4 2 2 0 0 1 3.6 1.22h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L7.91 8.82a16 16 0 0 0 6.29 6.29l.95-.95a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 22 16.92z"/></Svg>,
    mapPin:    <Svg width={size} height={size} viewBox="0 0 24 24"><Path {...p} d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><Circle {...p} cx="12" cy="10" r="3"/></Svg>,
    calendar:  <Svg width={size} height={size} viewBox="0 0 24 24"><Rect {...p} x="3" y="4" width="18" height="18" rx="2"/><Line {...p} x1="16" y1="2" x2="16" y2="6"/><Line {...p} x1="8" y1="2" x2="8" y2="6"/><Line {...p} x1="3" y1="10" x2="21" y2="10"/></Svg>,
    chevron:   <Svg width={size} height={size} viewBox="0 0 24 24"><Polyline {...p} points="9 18 15 12 9 6"/></Svg>,
    alert:     <Svg width={size} height={size} viewBox="0 0 24 24"><Path {...p} d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"/><Line {...p} x1="12" y1="9" x2="12" y2="13"/><Line {...p} x1="12" y1="17" x2="12.01" y2="17"/></Svg>,
    eye:       <Svg width={size} height={size} viewBox="0 0 24 24"><Path {...p} d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><Circle {...p} cx="12" cy="12" r="3"/></Svg>,
  };
  return map[name] || null;
};

// ─── HELPERS
const formatDate = (d) => {
  if (!d) return '—';
  return new Date(d).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric' });
};

const calcAgeMois = (dateNaissance) => {
  if (!dateNaissance) return null;
  return Math.floor((new Date() - new Date(dateNaissance)) / (1000 * 60 * 60 * 24 * 30.44));
};

const joursRetard = (dateStr) => {
  if (!dateStr) return null;
  return Math.ceil((new Date() - new Date(dateStr)) / 86400000);
};

// ─── BADGE SEXE (utilisé uniquement dans la modal détail)
const BadgeSexe = ({ sexe }) => {
  if (!sexe) return null;
  const isF = sexe.toLowerCase().startsWith('f');
  return (
    <View style={[styles.badgeSexe, { backgroundColor: isF ? '#fce7f3' : '#dbeafe' }]}>
      <Text style={[styles.badgeSexeT, { color: isF ? '#be185d' : '#1d4ed8' }]}>
        {isF ? 'Fille' : 'Garçon'}
      </Text>
    </View>
  );
};

// ─── COMPOSANT PRINCIPAL
export default function EnfantsRelais({ navigation }) {
  const [loading, setLoading]             = useState(true);
  const [refreshing, setRefreshing]       = useState(false);
  const [enfants, setEnfants]             = useState([]);
  const [recherche, setRecherche]         = useState('');
  const [filtre, setFiltre]               = useState('tous');
  const [enfantDetail, setDetail]         = useState(null);
  const [detailModal, setDetailModal]     = useState(false);
  const [detailData, setDetailData]       = useState(null);
  const [detailLoading, setDetailLoading] = useState(false);

  // ── Chargement
  const charger = useCallback(async () => {
    try {
      const token = await AsyncStorage.getItem('token');
      const res = await axios.get(`${API_URL}/relais/enfants`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.data?.success) setEnfants(res.data.data || []);
    } catch (e) {
      console.error('EnfantsRelais:', e?.response?.data || e.message);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => { charger(); }, []);
  const onRefresh = () => { setRefreshing(true); charger(); };

  // ── Ouvrir détail
  const ouvrirDetail = async (enfant) => {
    setDetail(enfant);
    setDetailModal(true);
    setDetailLoading(true);
    try {
      const token = await AsyncStorage.getItem('token');
      const res = await axios.get(`${API_URL}/relais/enfants/${enfant.id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.data?.success) setDetailData(res.data.data);
    } catch (e) {
      console.error('Détail enfant:', e?.response?.data || e.message);
    } finally {
      setDetailLoading(false);
    }
  };

  // ── Filtrage
  const enfantsFiltres = enfants.filter(e => {
    const q      = recherche.toLowerCase();
    const nom    = `${e.prenom} ${e.nom}`.toLowerCase();
    const matchQ = nom.includes(q) || (e.code_unique || '').toLowerCase().includes(q);
    const matchF =
      filtre === 'tous'   ? true :
      filtre === 'fille'  ? (e.sexe || '').toLowerCase().startsWith('f') :
      !(e.sexe || '').toLowerCase().startsWith('f');
    return matchQ && matchF;
  });

  // ── Regrouper par initiale
  const groupes = enfantsFiltres.reduce((acc, e) => {
    const lettre = (e.nom?.[0] || '?').toUpperCase();
    if (!acc[lettre]) acc[lettre] = [];
    acc[lettre].push(e);
    return acc;
  }, {});
  const lettres = Object.keys(groupes).sort();

  if (loading) return (
    <View style={styles.loader}>
      <ActivityIndicator size="large" color={C.primary} />
      <Text style={styles.loaderT}>Chargement...</Text>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={C.primary} />

      {/* ══ HEADER */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()} activeOpacity={0.8}>
          <Icon name="arrowLeft" size={22} color={C.white} />
        </TouchableOpacity>
        <View style={{ flex: 1 }}>
          <Text style={styles.hdrTitle}>Enfants suivis</Text>
          <Text style={styles.hdrSub}>{enfants.length} enfant{enfants.length > 1 ? 's' : ''} au total</Text>
        </View>
      </View>

      {/* ══ BARRE RECHERCHE */}
      <View style={styles.searchBar}>
        <Icon name="search" size={16} color={C.textLight} />
        <TextInput
          value={recherche}
          onChangeText={setRecherche}
          placeholder="Nom, prénom ou code..."
          placeholderTextColor={C.textLight}
          style={styles.searchInput}
        />
        {recherche.length > 0 && (
          <TouchableOpacity onPress={() => setRecherche('')}>
            <Icon name="x" size={16} color={C.textLight} />
          </TouchableOpacity>
        )}
      </View>

      {/* ══ FILTRES SEXE */}
      <View style={styles.filtresRow}>
        {[
          { key: 'tous',   label: `Tous (${enfants.length})` },
          { key: 'fille',  label: `Filles (${enfants.filter(e => (e.sexe||'').toLowerCase().startsWith('f')).length})` },
          { key: 'garcon', label: `Garçons (${enfants.filter(e => !(e.sexe||'').toLowerCase().startsWith('f')).length})` },
        ].map(f => (
          <TouchableOpacity
            key={f.key}
            style={[styles.filtrePill, filtre === f.key && styles.filtrePillActive]}
            onPress={() => setFiltre(f.key)}
            activeOpacity={0.8}
          >
            <Text style={[styles.filtrePillT, filtre === f.key && styles.filtrePillTActive]}>
              {f.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* ══ LISTE */}
      <ScrollView
        style={styles.scroll}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[C.primary]} />}
      >
        {enfantsFiltres.length === 0 ? (
          <View style={styles.vide}>
            <Icon name="users" size={40} color={C.textLight} />
            <Text style={styles.videT}>
              {recherche ? 'Aucun résultat trouvé' : 'Aucun enfant enregistré'}
            </Text>
          </View>
        ) : (
          lettres.map(lettre => (
            <View key={lettre}>
              {/* Séparateur alphabétique */}
              

              {groupes[lettre].map((enfant, i) => {
                const ageMois = calcAgeMois(enfant.date_naissance);
                const isFille = (enfant.sexe || '').toLowerCase().startsWith('f');
                return (
                  <TouchableOpacity
                    key={enfant.id || i}
                    style={[
                      styles.carteEnfant,
                      { backgroundColor: isFille ? '#fce7f3' : '#dbeafe' },
                    ]}
                    onPress={() => ouvrirDetail(enfant)}
                    activeOpacity={0.8}
                  >
                    <View style={{ flex: 1 }}>
                      <Text style={styles.enfantNom}>{enfant.prenom} {enfant.nom}</Text>
                      <View style={styles.enfantMeta}>
                        {ageMois != null && (
                          <Text style={styles.enfantAge}>{ageMois} mois</Text>
                        )}
                        {enfant.code_unique && (
                          <Text style={styles.enfantCode}>· {enfant.code_unique}</Text>
                        )}
                      </View>
                    </View>
                    <Icon name="chevron" size={16} color={C.textLight} />
                  </TouchableOpacity>
                );
              })}
            </View>
          ))
        )}
        <View style={{ height: 30 }} />
      </ScrollView>

      {/* ══ MODAL DÉTAIL ENFANT */}
      <Modal visible={detailModal} transparent animationType="slide" onRequestClose={() => setDetailModal(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <View style={styles.modalHandle} />

            {detailLoading ? (
              <View style={{ padding: 40, alignItems: 'center' }}>
                <ActivityIndicator size="large" color={C.primary} />
                <Text style={styles.loaderT}>Chargement...</Text>
              </View>
            ) : detailData ? (
              <ScrollView showsVerticalScrollIndicator={false}>
                {/* En-tête enfant */}
                <View style={styles.detailHead}>
                  <View style={styles.detailAvatar}>
                    <Text style={styles.detailAvatarT}>
                      {(detailData.prenom?.[0] || '').toUpperCase()}{(detailData.nom?.[0] || '').toUpperCase()}
                    </Text>
                  </View>
                  <Text style={styles.detailNom}>{detailData.prenom} {detailData.nom}</Text>
                  <View style={styles.detailMetaRow}>
                    {detailData.code_unique && (
                      <View style={styles.detailChip}>
                        <Text style={styles.detailChipT}>{detailData.code_unique}</Text>
                      </View>
                    )}
                    <BadgeSexe sexe={detailData.sexe} />
                  </View>
                </View>

                {/* Infos naissance */}
                <View style={styles.detailSection}>
                  <Text style={styles.detailSectionT}>INFORMATIONS</Text>
                  <View style={styles.detailRow}>
                    <Text style={styles.detailLbl}>Date de naissance</Text>
                    <Text style={styles.detailVal}>{formatDate(detailData.date_naissance)}</Text>
                  </View>
                  <View style={styles.detailRow}>
                    <Text style={styles.detailLbl}>Âge</Text>
                    <Text style={styles.detailVal}>{calcAgeMois(detailData.date_naissance)} mois</Text>
                  </View>
                  {detailData.lieu_naissance && (
                    <View style={styles.detailRow}>
                      <Text style={styles.detailLbl}>Lieu de naissance</Text>
                      <Text style={styles.detailVal}>{detailData.lieu_naissance}</Text>
                    </View>
                  )}
                </View>

                {/* Mère */}
                {detailData.mere && (
                  <View style={styles.detailSection}>
                    <Text style={styles.detailSectionT}>MÈRE / TUTEUR</Text>
                    <View style={styles.detailRow}>
                      <Text style={styles.detailLbl}>Nom</Text>
                      <Text style={styles.detailVal}>{detailData.mere.prenom} {detailData.mere.nom}</Text>
                    </View>
                    {detailData.mere.telephone && (
                      <View style={[styles.detailRow, { alignItems: 'center' }]}>
                        <Text style={styles.detailLbl}>Téléphone</Text>
                        <TouchableOpacity
                          style={styles.telBtn}
                          onPress={() => Linking.openURL(`tel:${detailData.mere.telephone}`)}
                        >
                          <Icon name="phone" size={13} color={C.white} />
                          <Text style={styles.telBtnT}>{detailData.mere.telephone}</Text>
                        </TouchableOpacity>
                      </View>
                    )}
                    {detailData.mere.adresse && (
                      <View style={styles.detailRow}>
                        <Text style={styles.detailLbl}>Adresse</Text>
                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                          <Icon name="mapPin" size={12} color={C.textLight} />
                          <Text style={styles.detailVal}>{detailData.mere.adresse}</Text>
                        </View>
                      </View>
                    )}
                  </View>
                )}

                {/* Prochains RDV */}
                {detailData.rendezvous?.length > 0 && (
                  <View style={styles.detailSection}>
                    <Text style={styles.detailSectionT}>PROCHAINS RDV VACCINS</Text>
                    {detailData.rendezvous
                      .filter(r => r.statut === 'a_venir')
                      .slice(0, 4)
                      .map((r, i) => {
                        const j = joursRetard(r.date_rdv);
                        const enRetard = j > 0;
                        return (
                          <View key={i} style={styles.rdvItem}>
                            <View style={[styles.rdvDot, { backgroundColor: enRetard ? C.danger : C.success }]} />
                            <View style={{ flex: 1 }}>
                              <Text style={styles.rdvVaccin}>{r.vaccin?.nom_vaccin || '—'}</Text>
                              <Text style={styles.rdvDate}>{formatDate(r.date_rdv)}</Text>
                            </View>
                            {enRetard && (
                              <View style={styles.rdvRetardChip}>
                                <Text style={styles.rdvRetardChipT}>{j}j retard</Text>
                              </View>
                            )}
                          </View>
                        );
                      })}
                  </View>
                )}

                <View style={{ height: 20 }} />
              </ScrollView>
            ) : (
              <View style={{ padding: 40, alignItems: 'center' }}>
                <Text style={{ color: C.textLight }}>Données non disponibles</Text>
              </View>
            )}

            {/* Bouton fermer */}
            <TouchableOpacity style={styles.fermerBtn} onPress={() => setDetailModal(false)} activeOpacity={0.8}>
              <Text style={styles.fermerBtnT}>Fermer</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

// ─── STYLES
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: C.bg },
  loader:    { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: C.bg },
  loaderT:   { marginTop: 12, color: C.primary, fontSize: 13, fontWeight: '500' },
  scroll:    { flex: 1 },

  // Header
  header:   { backgroundColor: C.primary, flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight + 12 : 14, paddingBottom: 16, gap: 12 },
  backBtn:  { padding: 4 },
  hdrTitle: { fontSize: 18, fontWeight: '700', color: C.white },
  hdrSub:   { fontSize: 11, color: 'rgba(255,255,255,0.7)', marginTop: 2 },

  // Recherche
  searchBar:   { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: C.white, marginHorizontal: 12, marginTop: 12, borderRadius: 12, paddingHorizontal: 14, paddingVertical: 10, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.04, elevation: 1 },
  searchInput: { flex: 1, fontSize: 14, color: C.textDark },

  // Filtres
  filtresRow:       { flexDirection: 'row', gap: 8, paddingHorizontal: 12, marginTop: 10 },
  filtrePill:       { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20, borderWidth: 1, borderColor: '#d1d5db', backgroundColor: C.white },
  filtrePillActive: { backgroundColor: C.primary, borderColor: C.primary },
  filtrePillT:      { fontSize: 12, color: C.textMid, fontWeight: '500' },
  filtrePillTActive:{ color: C.white, fontWeight: '600' },

  // Vide
  vide:  { alignItems: 'center', paddingTop: 60, gap: 12 },
  videT: { color: C.textLight, fontSize: 14 },

  // Séparateur
  separateur:  { paddingHorizontal: 16, paddingVertical: 6, backgroundColor: C.bg },
  separateurT: { fontSize: 12, fontWeight: '700', color: C.primary, letterSpacing: 1 },

  // Carte enfant — backgroundColor écrasé dynamiquement (rose fille / bleu garçon)
  carteEnfant: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 16, paddingVertical: 14, borderBottomWidth: 0.5, borderBottomColor: '#f0f0f0' },
  enfantNom:   { fontSize: 14, fontWeight: '600', color: C.textDark },
  enfantMeta:  { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 2 },
  enfantAge:   { fontSize: 11, color: C.textLight },
  enfantCode:  { fontSize: 11, color: C.textLight },

  // Badge sexe (modal détail uniquement)
  badgeSexe:  { borderRadius: 12, paddingHorizontal: 8, paddingVertical: 3 },
  badgeSexeT: { fontSize: 10, fontWeight: '600' },

  // Modal détail
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.45)', justifyContent: 'flex-end' },
  modalCard:    { backgroundColor: C.white, borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 20, paddingBottom: 36, maxHeight: '85%' },
  modalHandle:  { width: 40, height: 4, backgroundColor: '#e5e7eb', borderRadius: 2, alignSelf: 'center', marginBottom: 16 },

  // Détail enfant
  detailHead:    { alignItems: 'center', marginBottom: 20 },
  detailAvatar:  { width: 64, height: 64, borderRadius: 32, backgroundColor: C.primary + '20', justifyContent: 'center', alignItems: 'center', marginBottom: 10 },
  detailAvatarT: { fontSize: 24, fontWeight: '800', color: C.primary },
  detailNom:     { fontSize: 20, fontWeight: '800', color: C.textDark, marginBottom: 8 },
  detailMetaRow: { flexDirection: 'row', gap: 8 },
  detailChip:    { backgroundColor: C.primary + '15', borderRadius: 12, paddingHorizontal: 10, paddingVertical: 4 },
  detailChipT:   { fontSize: 12, color: C.primary, fontWeight: '600' },

  detailSection:  { marginBottom: 16, borderRadius: 12, backgroundColor: '#f9fafb', padding: 14 },
  detailSectionT: { fontSize: 10, fontWeight: '700', color: C.textLight, letterSpacing: 0.8, textTransform: 'uppercase', marginBottom: 10 },
  detailRow:      { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', paddingVertical: 6, borderBottomWidth: 0.5, borderBottomColor: '#f0f0f0' },
  detailLbl:      { fontSize: 12, color: C.textLight, flex: 1 },
  detailVal:      { fontSize: 13, color: C.textDark, fontWeight: '500', flex: 1, textAlign: 'right' },

  telBtn:  { flexDirection: 'row', alignItems: 'center', gap: 5, backgroundColor: C.primary, borderRadius: 16, paddingHorizontal: 10, paddingVertical: 5 },
  telBtnT: { fontSize: 12, color: C.white, fontWeight: '600' },

  rdvItem:        { flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 8, borderBottomWidth: 0.5, borderBottomColor: '#f0f0f0' },
  rdvDot:         { width: 8, height: 8, borderRadius: 4 },
  rdvVaccin:      { fontSize: 13, fontWeight: '600', color: C.textDark },
  rdvDate:        { fontSize: 11, color: C.textLight, marginTop: 2 },
  rdvRetardChip:  { backgroundColor: '#fee2e2', borderRadius: 12, paddingHorizontal: 8, paddingVertical: 3 },
  rdvRetardChipT: { fontSize: 10, color: C.danger, fontWeight: '600' },

  fermerBtn:  { backgroundColor: C.bg, borderRadius: 12, paddingVertical: 13, alignItems: 'center', marginTop: 12 },
  fermerBtnT: { fontSize: 14, fontWeight: '700', color: C.textMid },
});