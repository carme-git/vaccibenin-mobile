import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  SafeAreaView, StatusBar, ScrollView, ActivityIndicator,
  Platform, KeyboardAvoidingView, Modal,
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
  success:   '#059669',
  textLight: '#9ca3af',
  textMid:   '#6b7280',
  textDark:  '#111827',
  border:    '#d1d5db',
};

const Icon = ({ name, size = 22, color = C.primary, sw = 1.8 }) => {
  const p = { stroke: color, strokeWidth: sw, fill: 'none', strokeLinecap: 'round', strokeLinejoin: 'round' };
  const map = {
    back:      <Svg width={size} height={size} viewBox="0 0 24 24"><Polyline {...p} points="15 18 9 12 15 6"/></Svg>,
    user:      <Svg width={size} height={size} viewBox="0 0 24 24"><Path {...p} d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><Circle {...p} cx="12" cy="7" r="4"/></Svg>,
    calendar:  <Svg width={size} height={size} viewBox="0 0 24 24"><Rect {...p} x="3" y="4" width="18" height="18" rx="2"/><Line {...p} x1="16" y1="2" x2="16" y2="6"/><Line {...p} x1="8" y1="2" x2="8" y2="6"/><Line {...p} x1="3" y1="10" x2="21" y2="10"/></Svg>,
    check:     <Svg width={size} height={size} viewBox="0 0 24 24"><Polyline {...p} points="20 6 9 17 4 12"/></Svg>,
    addChild:  <Svg width={size} height={size} viewBox="0 0 24 24"><Circle {...p} cx="12" cy="12" r="10"/><Line {...p} x1="12" y1="8" x2="12" y2="16"/><Line {...p} x1="8" y1="12" x2="16" y2="12"/></Svg>,
    info:      <Svg width={size} height={size} viewBox="0 0 24 24"><Circle {...p} cx="12" cy="12" r="10"/><Line {...p} x1="12" y1="8" x2="12" y2="12"/><Line {...p} x1="12" y1="16" x2="12.01" y2="16"/></Svg>,
  };
  return map[name] || null;
};

// ── Validation date (dd/mm/yyyy) ──────────────────────────────────────────────
const validerDate = (val) => {
  if (!val || val.length < 10) return false;
  const [j, m, a] = val.split('/').map(Number);
  if (!j || !m || !a || a < 1900 || a > new Date().getFullYear()) return false;
  const dt = new Date(a, m - 1, j);
  return dt instanceof Date && !isNaN(dt) && dt <= new Date();
};

const dateVersISO = (val) => {
  const [j, m, a] = val.split('/');
  return `${a}-${m.padStart(2,'0')}-${j.padStart(2,'0')}`;
};

// ── Formatage auto dd/mm/yyyy en saisie ──────────────────────────────────────
const formaterDate = (val, prev) => {
  // Supprimer tout sauf chiffres
  const chiffres = val.replace(/\D/g, '');
  // Si l'utilisateur efface, laisser passer
  if (val.length < prev.length) return val;
  let f = chiffres;
  if (chiffres.length >= 3) f = chiffres.slice(0,2) + '/' + chiffres.slice(2);
  if (chiffres.length >= 5) f = chiffres.slice(0,2) + '/' + chiffres.slice(2,4) + '/' + chiffres.slice(4,8);
  return f;
};

export default function AjouterEnfant({ route, navigation }) {
  const { onSuccess } = route?.params ?? {};

  const [form, setForm] = useState({
    nom:            '',
    prenom:         '',
    date_naissance: '',
    sexe:           '',
  });
  const [erreurs, setErreurs]   = useState({});
  const [loading, setLoading]   = useState(false);
  const [succes, setSucces]     = useState(false);
  const [errAPI, setErrAPI]     = useState('');

  const set = (champ, val) => {
    setForm(f => ({ ...f, [champ]: val }));
    if (erreurs[champ]) setErreurs(e => ({ ...e, [champ]: '' }));
    if (errAPI) setErrAPI('');
  };

  const valider = () => {
    const e = {};
    if (!form.prenom.trim()) e.prenom = 'Le prénom est requis.';
    if (!form.nom.trim())    e.nom    = 'Le nom est requis.';
    if (!form.sexe)          e.sexe   = 'Veuillez sélectionner le sexe.';
    if (!validerDate(form.date_naissance))
      e.date_naissance = 'Date invalide. Format attendu : jj/mm/aaaa';
    setErreurs(e);
    return Object.keys(e).length === 0;
  };

  const soumettre = async () => {
    if (!valider()) return;
    setLoading(true);
    setErrAPI('');
    try {
      const token     = await AsyncStorage.getItem('token');
      const typeUsers = await AsyncStorage.getItem('type_users') ?? 'mere';
      await axios.post(
        `${API_URL}/parent/enfants`,
        {
          nom:            form.nom.trim(),
          prenom:         form.prenom.trim(),
          date_naissance: dateVersISO(form.date_naissance),
          sexe:           form.sexe,
        },
        { headers: { Authorization: `Bearer ${token}`, 'X-Type-Users': typeUsers } }
      );
      setSucces(true);
    } catch (e) {
      const msg = e?.response?.data?.message
        ?? e?.response?.data?.error
        ?? 'Une erreur est survenue. Veuillez réessayer.';
      setErrAPI(msg);
    } finally {
      setLoading(false);
    }
  };

  const handleSucces = () => {
    if (onSuccess) onSuccess();
    navigation.goBack();
  };

  // ── Champ générique ──────────────────────────────────────────────────────
  const Champ = ({ label, champ, placeholder, keyboardType = 'default', hint }) => (
    <View style={S.champ}>
      <Text style={S.champLabel}>{label}</Text>
      <TextInput
        style={[S.input, erreurs[champ] && S.inputErreur, form[champ] && S.inputRempli]}
        placeholder={placeholder}
        placeholderTextColor={C.textLight}
        value={form[champ]}
        onChangeText={v => {
          if (champ === 'date_naissance') {
            set(champ, formaterDate(v, form[champ]));
          } else {
            set(champ, v);
          }
        }}
        keyboardType={keyboardType}
        maxLength={champ === 'date_naissance' ? 10 : 100}
        autoCapitalize={champ === 'date_naissance' ? 'none' : 'words'}
      />
      {hint && !erreurs[champ] && <Text style={S.champHint}>{hint}</Text>}
      {erreurs[champ] && <Text style={S.champErreur}>{erreurs[champ]}</Text>}
    </View>
  );

  return (
    <SafeAreaView style={S.container}>
      <StatusBar barStyle="light-content" backgroundColor={C.primary} />

      {/* Header */}
      <View style={S.header}>
        <TouchableOpacity style={S.backBtn} onPress={() => navigation.goBack()} activeOpacity={0.8}>
          <Icon name="back" size={22} color="#fff" sw={2.2} />
        </TouchableOpacity>
        <View style={{ flex: 1 }}>
          <Text style={S.hdrTitle}>Ajouter un enfant</Text>
          <Text style={S.hdrSub}>Renseignez les informations de l'enfant</Text>
        </View>
        <View style={S.hdrIco}>
          <Icon name="addChild" size={22} color="#fff" sw={2} />
        </View>
      </View>

      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView style={S.scroll} showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingBottom: 40 }}>

          {/* Info */}
          

          <View style={S.formCard}>

            {/* Prénom */}
            <Champ label="Prénom *" champ="prenom" placeholder="Ex : Kofi" />

            {/* Nom */}
            <Champ label="Nom de famille *" champ="nom" placeholder="Ex : AGOSSOU" />

            {/* Date de naissance */}
            <Champ
              label="Date de naissance *"
              champ="date_naissance"
              placeholder="jj/mm/aaaa"
              keyboardType="numeric"
              
            />

            {/* Sexe */}
            <View style={S.champ}>
              <Text style={S.champLabel}>Sexe *</Text>
              <View style={S.sexeRow}>
                {[
                  { val: 'M', label: 'Garçon', emoji: '' },
                  { val: 'F', label: 'Fille',  emoji: '' },
                ].map(opt => (
                  <TouchableOpacity key={opt.val}
                    style={[S.sexeBtn, form.sexe === opt.val && S.sexeBtnActif]}
                    onPress={() => set('sexe', opt.val)} activeOpacity={0.8}>
                    <Text style={S.sexeEmoji}>{opt.emoji}</Text>
                    <Text style={[S.sexeBtnT, form.sexe === opt.val && S.sexeBtnTActif]}>
                      {opt.label}
                    </Text>
                    {form.sexe === opt.val && (
                      <View style={S.sexeCheck}>
                        <Icon name="check" size={10} color="#fff" sw={2.5} />
                      </View>
                    )}
                  </TouchableOpacity>
                ))}
              </View>
              {erreurs.sexe && <Text style={S.champErreur}>{erreurs.sexe}</Text>}
            </View>

          </View>

          {/* Erreur API */}
          {errAPI !== '' && (
            <View style={S.errAPIBox}>
              <Icon name="info" size={16} color={C.danger} sw={2} />
              <Text style={S.errAPIText}>{errAPI}</Text>
            </View>
          )}

          {/* Bouton soumettre */}
          <TouchableOpacity style={[S.submitBtn, loading && S.submitBtnDisabled]}
            onPress={soumettre} disabled={loading} activeOpacity={0.85}>
            {loading
              ? <ActivityIndicator size="small" color="#fff" />
              : <>
                  <Icon name="addChild" size={18} color="#fff" sw={2} />
                  <Text style={S.submitBtnT}>Enregistrer l'enfant</Text>
                </>
            }
          </TouchableOpacity>

        </ScrollView>
      </KeyboardAvoidingView>

      {/* Modal succès */}
      <Modal visible={succes} transparent animationType="fade">
        <View style={S.modalOverlay}>
          <View style={S.modalCard}>
            <View style={S.modalIco}>
              <Icon name="check" size={32} color={C.success} sw={2.5} />
            </View>
            <Text style={S.modalTitle}>Enfant ajouté !</Text>
            <Text style={S.modalBody}>
              <Text style={{ fontWeight: '700' }}>{form.prenom} {form.nom}</Text> a bien été ajouté à votre compte. Vous pouvez maintenant suivre son calendrier vaccinal.
            </Text>
            <TouchableOpacity style={[S.modalBtn, { backgroundColor: C.primary, width: '100%' }]}
              onPress={handleSucces} activeOpacity={0.85}>
              <Text style={[S.modalBtnT, { color: '#fff' }]}>Voir le tableau de bord</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const S = StyleSheet.create({
  container: { flex: 1, backgroundColor: C.bg },
  scroll:    { flex: 1 },

  header:    { backgroundColor: C.primary, paddingHorizontal: 16, paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight + 12 : 14, paddingBottom: 18, flexDirection: 'row', alignItems: 'center', gap: 12 },
  backBtn:   { padding: 4 },
  hdrTitle:  { fontSize: 17, fontWeight: '700', color: '#fff' },
  hdrSub:    { fontSize: 11, color: 'rgba(255,255,255,0.7)', marginTop: 2 },
  hdrIco:    { width: 40, height: 40, borderRadius: 20, backgroundColor: 'rgba(255,255,255,0.2)', justifyContent: 'center', alignItems: 'center' },

  infoCard: { flexDirection: 'row', alignItems: 'flex-start', gap: 10, backgroundColor: '#f0fdf4', borderLeftWidth: 3, borderLeftColor: C.primary, borderRadius: 12, margin: 16, marginBottom: 0, padding: 12 },
  infoT:    { flex: 1, fontSize: 12, color: C.primary, lineHeight: 18 },

  formCard: { backgroundColor: C.white, borderRadius: 16, margin: 16, padding: 16, borderWidth: 0.5, borderColor: '#e5e7eb', elevation: 1, gap: 4 },

  champ:       { marginBottom: 16 },
  champLabel:  { fontSize: 13, fontWeight: '600', color: C.textDark, marginBottom: 7 },
  champHint:   { fontSize: 11, color: C.textLight, marginTop: 5 },
  champErreur: { fontSize: 11, color: C.danger, marginTop: 5, fontWeight: '500' },

  input:        { borderWidth: 1.5, borderColor: C.border, borderRadius: 12, paddingHorizontal: 14, paddingVertical: 12, fontSize: 14, color: C.textDark, backgroundColor: '#fafafa' },
  inputErreur:  { borderColor: C.danger, backgroundColor: '#fef2f2' },
  inputRempli:  { borderColor: C.primary, backgroundColor: C.white },

  sexeRow:      { flexDirection: 'row', gap: 12 },
  sexeBtn:      { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, borderWidth: 1.5, borderColor: C.border, borderRadius: 12, paddingVertical: 14, backgroundColor: '#fafafa', position: 'relative' },
  sexeBtnActif: { borderColor: C.primary, backgroundColor: '#f0fdf4' },
  sexeEmoji:    { fontSize: 20 },
  sexeBtnT:     { fontSize: 14, fontWeight: '600', color: C.textMid },
  sexeBtnTActif:{ color: C.primary },
  sexeCheck:    { position: 'absolute', top: 6, right: 8, width: 18, height: 18, borderRadius: 9, backgroundColor: C.primary, justifyContent: 'center', alignItems: 'center' },

  errAPIBox:  { flexDirection: 'row', alignItems: 'flex-start', gap: 8, backgroundColor: '#fef2f2', borderRadius: 12, marginHorizontal: 16, marginBottom: 8, padding: 12 },
  errAPIText: { flex: 1, fontSize: 13, color: C.danger, lineHeight: 18 },

  submitBtn:         { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10, backgroundColor: C.primary, borderRadius: 14, marginHorizontal: 16, paddingVertical: 16 },
  submitBtnDisabled: { opacity: 0.6 },
  submitBtnT:        { fontSize: 15, fontWeight: '700', color: '#fff' },

  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.45)', justifyContent: 'center', alignItems: 'center', padding: 24 },
  modalCard:    { backgroundColor: C.white, borderRadius: 24, padding: 28, width: '100%', maxWidth: 360, alignItems: 'center', gap: 12, elevation: 12 },
  modalIco:     { width: 72, height: 72, borderRadius: 36, backgroundColor: '#ecfdf5', justifyContent: 'center', alignItems: 'center' },
  modalTitle:   { fontSize: 20, fontWeight: '800', color: C.textDark },
  modalBody:    { fontSize: 13, color: C.textMid, textAlign: 'center', lineHeight: 20 },
  modalBtn:     { borderRadius: 12, paddingVertical: 14, alignItems: 'center' },
  modalBtnT:    { fontSize: 15, fontWeight: '700' },
});