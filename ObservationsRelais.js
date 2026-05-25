import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, StyleSheet,
  SafeAreaView, StatusBar, RefreshControl, ActivityIndicator,
  Modal, Platform, TextInput,
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
    eye:       <Svg width={size} height={size} viewBox="0 0 24 24"><Path {...p} d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><Circle {...p} cx="12" cy="12" r="3"/></Svg>,
    plus:      <Svg width={size} height={size} viewBox="0 0 24 24"><Line {...p} x1="12" y1="5" x2="12" y2="19"/><Line {...p} x1="5" y1="12" x2="19" y2="12"/></Svg>,
    user:      <Svg width={size} height={size} viewBox="0 0 24 24"><Path {...p} d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><Circle {...p} cx="12" cy="7" r="4"/></Svg>,
    calendar:  <Svg width={size} height={size} viewBox="0 0 24 24"><Rect {...p} x="3" y="4" width="18" height="18" rx="2"/><Line {...p} x1="16" y1="2" x2="16" y2="6"/><Line {...p} x1="8" y1="2" x2="8" y2="6"/><Line {...p} x1="3" y1="10" x2="21" y2="10"/></Svg>,
    search:    <Svg width={size} height={size} viewBox="0 0 24 24"><Circle {...p} cx="11" cy="11" r="8"/><Line {...p} x1="21" y1="21" x2="16.65" y2="16.65"/></Svg>,
    x:         <Svg width={size} height={size} viewBox="0 0 24 24"><Line {...p} x1="18" y1="6" x2="6" y2="18"/><Line {...p} x1="6" y1="6" x2="18" y2="18"/></Svg>,
    check:     <Svg width={size} height={size} viewBox="0 0 24 24"><Polyline {...p} points="20 6 9 17 4 12"/></Svg>,
    users:     <Svg width={size} height={size} viewBox="0 0 24 24"><Path {...p} d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><Circle {...p} cx="9" cy="7" r="4"/><Path {...p} d="M23 21v-2a4 4 0 0 0-3-3.87"/><Path {...p} d="M16 3.13a4 4 0 0 1 0 7.75"/></Svg>,
  };
  return map[name] || null;
};

// ─── HELPERS
const formatDate = (d) => {
  if (!d) return '—';
  return new Date(d).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric' });
};

// ─── COMPOSANT PRINCIPAL
export default function ObservationsRelais({ navigation }) {
  const [loading, setLoading]       = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [observations, setObs]      = useState([]);
  const [enfants, setEnfants]       = useState([]);
  const [recherche, setRecherche]   = useState('');
  const [modal, setModal]           = useState(false);
  const [obsLoading, setObsLoading] = useState(false);
  const [successMsg, setSuccessMsg] = useState(false);

  // Formulaire
  const [texte, setTexte]           = useState('');
  const [details, setDetails]       = useState('');
  const [enfantId, setEnfantId]     = useState(null);
  const [enfantNom, setEnfantNom]   = useState('');
  const [dropdownOpen, setDropdown] = useState(false);

  // ── Chargement
  const charger = useCallback(async () => {
    try {
      const token = await AsyncStorage.getItem('token');
      const h = { Authorization: `Bearer ${token}` };
      const [obsRes, enfRes] = await Promise.all([
        axios.get(`${API_URL}/relais/observations`, { headers: h }),
        axios.get(`${API_URL}/relais/enfants`,      { headers: h }),
      ]);
      if (obsRes.data?.success) setObs(obsRes.data.data || []);
      if (enfRes.data?.success) setEnfants(enfRes.data.data || []);
    } catch (e) {
      console.error('ObservationsRelais:', e?.response?.data || e.message);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => { charger(); }, []);
  const onRefresh = () => { setRefreshing(true); charger(); };

  // ── Soumettre observation
  const handleSubmit = async () => {
    if (!texte.trim() || !enfantId) return;
    setObsLoading(true);
    try {
      const token = await AsyncStorage.getItem('token');
      await axios.post(`${API_URL}/relais/observations`, { id_enfant: enfantId, observation: texte, details }, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setModal(false);
      setTexte('');
      setDetails('');
      setEnfantId(null);
      setEnfantNom('');
      setSuccessMsg(true);
      setTimeout(() => setSuccessMsg(false), 2500);
      charger();
    } catch (e) {
      console.error('Observation:', e?.response?.data || e.message);
    } finally {
      setObsLoading(false);
    }
  };

  // ── Filtrage
  const obsFiltrees = observations.filter(o => {
    const q = recherche.toLowerCase();
    const enfantNomComplet = o.enfant ? `${o.enfant.prenom} ${o.enfant.nom}`.toLowerCase() : '';
    return enfantNomComplet.includes(q) || (o.observation || '').toLowerCase().includes(q);
  });

  const enfantsFiltres = enfants.filter(e =>
    `${e.prenom} ${e.nom}`.toLowerCase().includes(recherche.toLowerCase())
  );

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
          <Text style={styles.hdrTitle}>Observations</Text>
          <Text style={styles.hdrSub}>{observations.length} enregistrée{observations.length > 1 ? 's' : ''}</Text>
        </View>
        <TouchableOpacity style={styles.addBtn} onPress={() => setModal(true)} activeOpacity={0.8}>
          <Icon name="plus" size={20} color={C.white} />
        </TouchableOpacity>
      </View>

      {/* ══ BARRE RECHERCHE */}
      <View style={styles.searchBar}>
        <Icon name="search" size={16} color={C.textLight} />
        <TextInput
          value={recherche}
          onChangeText={setRecherche}
          placeholder="Rechercher un enfant ou observation..."
          placeholderTextColor={C.textLight}
          style={styles.searchInput}
        />
        {recherche.length > 0 && (
          <TouchableOpacity onPress={() => setRecherche('')}>
            <Icon name="x" size={16} color={C.textLight} />
          </TouchableOpacity>
        )}
      </View>

      {/* ══ LISTE */}
      <ScrollView
        style={styles.scroll}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[C.primary]} />}
      >
        {obsFiltrees.length === 0 ? (
          <View style={styles.vide}>
            <Icon name="eye" size={40} color={C.textLight} />
            <Text style={styles.videT}>
              {recherche ? 'Aucun résultat trouvé' : 'Aucune observation enregistrée'}
            </Text>
            {!recherche && (
              <TouchableOpacity style={styles.videBtnAjouter} onPress={() => setModal(true)} activeOpacity={0.8}>
                <Icon name="plus" size={14} color={C.white} />
                <Text style={styles.videBtnAjouterT}>Ajouter une observation</Text>
              </TouchableOpacity>
            )}
          </View>
        ) : (
          <View style={styles.listePad}>
            {obsFiltrees.map((obs, i) => (
              <View key={obs.id || i} style={styles.carteObs}>
                {/* En-tête carte */}
                <View style={styles.carteObsHead}>
                  <View style={styles.carteObsAvatar}>
                    <Icon name="user" size={16} color={C.primary} />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.carteObsNom}>
                      {obs.enfant ? `${obs.enfant.prenom} ${obs.enfant.nom}` : '—'}
                    </Text>
                    <View style={styles.carteObsDateRow}>
                      <Icon name="calendar" size={11} color={C.textLight} />
                      <Text style={styles.carteObsDate}>{formatDate(obs.date)}</Text>
                    </View>
                  </View>
                </View>
                {/* Contenu */}
                <Text style={styles.carteObsTxt}>{obs.observation}</Text>
                {obs.details ? (
                  <View style={styles.carteObsDetails}>
                    <Text style={styles.carteObsDetailsT}>{obs.details}</Text>
                  </View>
                ) : null}
              </View>
            ))}
          </View>
        )}
        <View style={{ height: 30 }} />
      </ScrollView>

      {/* ══ TOAST SUCCÈS */}
      {successMsg && (
        <View style={styles.toast}>
          <Icon name="check" size={16} color={C.white} />
          <Text style={styles.toastT}>Observation enregistrée</Text>
        </View>
      )}

      {/* ══ FAB */}
      <TouchableOpacity style={styles.fab} onPress={() => setModal(true)} activeOpacity={0.85}>
        <Icon name="plus" size={24} color={C.white} />
      </TouchableOpacity>

      {/* ══ MODAL AJOUT */}
      <Modal visible={modal} transparent animationType="slide" onRequestClose={() => setModal(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            {/* Titre */}
            <View style={styles.modalHeadRow}>
              <Text style={styles.modalTitle}>Nouvelle observation</Text>
              <TouchableOpacity onPress={() => setModal(false)}>
                <Icon name="x" size={20} color={C.textMid} />
              </TouchableOpacity>
            </View>

            {/* Sélecteur enfant */}
            <Text style={styles.modalLabel}>Enfant *</Text>
            <TouchableOpacity
              style={[styles.selectorBtn, dropdownOpen && styles.selectorBtnOpen]}
              onPress={() => setDropdown(!dropdownOpen)}
              activeOpacity={0.8}
            >
              <Icon name="users" size={16} color={enfantId ? C.primary : C.textLight} />
              <Text style={[styles.selectorTxt, enfantId && { color: C.textDark }]}>
                {enfantNom || 'Sélectionner un enfant...'}
              </Text>
              <Icon name="arrowLeft" size={14} color={C.textLight} sw={2} />
            </TouchableOpacity>

            {/* Dropdown liste enfants */}
            {dropdownOpen && (
              <View style={styles.dropdown}>
                <View style={styles.dropdownSearch}>
                  <Icon name="search" size={14} color={C.textLight} />
                  <TextInput
                    value={recherche}
                    onChangeText={setRecherche}
                    placeholder="Chercher..."
                    placeholderTextColor={C.textLight}
                    style={styles.dropdownInput}
                  />
                </View>
                <ScrollView style={{ maxHeight: 180 }} nestedScrollEnabled>
                  {enfants
                    .filter(e => `${e.prenom} ${e.nom}`.toLowerCase().includes(recherche.toLowerCase()))
                    .map(e => (
                      <TouchableOpacity
                        key={e.id}
                        style={[styles.dropdownItem, enfantId === e.id && styles.dropdownItemActive]}
                        onPress={() => {
                          setEnfantId(e.id);
                          setEnfantNom(`${e.prenom} ${e.nom}`);
                          setDropdown(false);
                          setRecherche('');
                        }}
                      >
                        <Text style={[styles.dropdownItemT, enfantId === e.id && { color: C.primary, fontWeight: '700' }]}>
                          {e.prenom} {e.nom}
                        </Text>
                        {enfantId === e.id && <Icon name="check" size={14} color={C.primary} />}
                      </TouchableOpacity>
                    ))}
                </ScrollView>
              </View>
            )}

            {/* Observation */}
            <View style={{ marginTop: 14 }}>
              <Text style={styles.modalLabel}>Observation *</Text>
              <TextInput
                value={texte}
                onChangeText={setTexte}
                placeholder="Ex: La mère a été informée du prochain RDV..."
                multiline
                numberOfLines={3}
                style={styles.textInput}
                placeholderTextColor="#9ca3af"
              />
            </View>

            {/* Détails */}
            <View style={{ marginBottom: 20 }}>
              <Text style={styles.modalLabel}>Détails (optionnel)</Text>
              <TextInput
                value={details}
                onChangeText={setDetails}
                placeholder="Informations complémentaires..."
                multiline
                numberOfLines={2}
                style={styles.textInput}
                placeholderTextColor="#9ca3af"
              />
            </View>

            {/* Boutons */}
            <View style={styles.modalBtns}>
              <TouchableOpacity style={[styles.modalBtn, { backgroundColor: '#f3f4f6' }]} onPress={() => setModal(false)}>
                <Text style={[styles.modalBtnT, { color: C.textMid }]}>Annuler</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalBtn, { backgroundColor: C.primary }, (!texte.trim() || !enfantId) && { opacity: 0.5 }]}
                onPress={handleSubmit}
                disabled={!texte.trim() || !enfantId || obsLoading}
              >
                {obsLoading
                  ? <ActivityIndicator size="small" color={C.white} />
                  : <Text style={[styles.modalBtnT, { color: C.white }]}>Enregistrer</Text>
                }
              </TouchableOpacity>
            </View>
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
  header:    { backgroundColor: C.primary, flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight + 12 : 14, paddingBottom: 16, gap: 12 },
  backBtn:   { padding: 4 },
  hdrTitle:  { fontSize: 18, fontWeight: '700', color: C.white },
  hdrSub:    { fontSize: 11, color: 'rgba(255,255,255,0.7)', marginTop: 2 },
  addBtn:    { width: 36, height: 36, borderRadius: 18, backgroundColor: 'rgba(255,255,255,0.2)', justifyContent: 'center', alignItems: 'center' },

  // Recherche
  searchBar:   { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: C.white, marginHorizontal: 12, marginTop: 12, borderRadius: 12, paddingHorizontal: 14, paddingVertical: 10, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.04, elevation: 1 },
  searchInput: { flex: 1, fontSize: 14, color: C.textDark },

  // Vide
  vide:             { alignItems: 'center', paddingTop: 60, gap: 12 },
  videT:            { color: C.textLight, fontSize: 14 },
  videBtnAjouter:   { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: C.primary, borderRadius: 20, paddingHorizontal: 16, paddingVertical: 10, marginTop: 8 },
  videBtnAjouterT:  { fontSize: 14, color: C.white, fontWeight: '600' },

  // Liste
  listePad: { paddingHorizontal: 12, paddingTop: 12, gap: 10 },

  // Carte observation
  carteObs:         { backgroundColor: C.white, borderRadius: 14, padding: 14, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 4, elevation: 1 },
  carteObsHead:     { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 10 },
  carteObsAvatar:   { width: 36, height: 36, borderRadius: 18, backgroundColor: C.primary + '15', justifyContent: 'center', alignItems: 'center' },
  carteObsNom:      { fontSize: 14, fontWeight: '600', color: C.textDark },
  carteObsDateRow:  { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 2 },
  carteObsDate:     { fontSize: 11, color: C.textLight },
  carteObsTxt:      { fontSize: 13, color: C.textMid, lineHeight: 20 },
  carteObsDetails:  { marginTop: 8, backgroundColor: C.bg, borderRadius: 8, padding: 10 },
  carteObsDetailsT: { fontSize: 12, color: C.textLight, fontStyle: 'italic' },

  // Toast
  toast:  { position: 'absolute', bottom: 80, alignSelf: 'center', flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: C.success, borderRadius: 20, paddingHorizontal: 16, paddingVertical: 10 },
  toastT: { color: C.white, fontSize: 13, fontWeight: '600' },

  // FAB
  fab: { position: 'absolute', right: 20, bottom: 24, width: 54, height: 54, borderRadius: 27, backgroundColor: C.primary, justifyContent: 'center', alignItems: 'center', elevation: 6, shadowColor: C.primary, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.35, shadowRadius: 8 },

  // Modal
  modalOverlay:  { flex: 1, backgroundColor: 'rgba(0,0,0,0.45)', justifyContent: 'flex-end' },
  modalCard:     { backgroundColor: C.white, borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 24, paddingBottom: 36 },
  modalHeadRow:  { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 },
  modalTitle:    { fontSize: 18, fontWeight: '800', color: C.textDark },
  modalLabel:    { fontSize: 13, fontWeight: '600', color: C.textDark, marginBottom: 6 },
  textInput:     { borderWidth: 1.5, borderColor: '#e5e7eb', borderRadius: 10, padding: 12, fontSize: 14, color: C.textDark, backgroundColor: '#f9fafb', textAlignVertical: 'top', marginBottom: 4 },
  modalBtns:     { flexDirection: 'row', gap: 12 },
  modalBtn:      { flex: 1, paddingVertical: 13, borderRadius: 12, alignItems: 'center' },
  modalBtnT:     { fontSize: 14, fontWeight: '700' },

  // Selector enfant
  selectorBtn:     { flexDirection: 'row', alignItems: 'center', gap: 8, borderWidth: 1.5, borderColor: '#e5e7eb', borderRadius: 10, padding: 12, backgroundColor: '#f9fafb' },
  selectorBtnOpen: { borderColor: C.primary },
  selectorTxt:     { flex: 1, fontSize: 14, color: C.textLight },

  // Dropdown
  dropdown:       { borderWidth: 1, borderColor: '#e5e7eb', borderRadius: 10, backgroundColor: C.white, marginTop: 4, overflow: 'hidden' },
  dropdownSearch: { flexDirection: 'row', alignItems: 'center', gap: 8, padding: 10, borderBottomWidth: 1, borderBottomColor: '#f0f0f0' },
  dropdownInput:  { flex: 1, fontSize: 13, color: C.textDark },
  dropdownItem:   { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 14, paddingVertical: 12, borderBottomWidth: 0.5, borderBottomColor: '#f5f5f5' },
  dropdownItemActive: { backgroundColor: C.primary + '10' },
  dropdownItemT:  { fontSize: 14, color: C.textDark },
});