import React, { useState, useEffect, useRef } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, StyleSheet,
  SafeAreaView, StatusBar, ActivityIndicator, Animated,
  Platform, Linking,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
import { API_URL } from './config';
import Svg, { Path, Circle, Line, Polyline, Rect } from 'react-native-svg';

const C = {
  primary: '#065f46', teal: '#0d9488', bg: '#f4f6f4', white: '#ffffff',
  danger: '#dc2626', warn: '#d97706', success: '#059669',
  textLight: '#9ca3af', textMid: '#6b7280', textDark: '#111827',
};

const Icon = ({ name, size = 22, color = C.primary, sw = 1.8 }) => {
  const p = { stroke: color, strokeWidth: sw, fill: 'none', strokeLinecap: 'round', strokeLinejoin: 'round' };
  const map = {
    back:     <Svg width={size} height={size} viewBox="0 0 24 24"><Polyline {...p} points="15 18 9 12 15 6"/></Svg>,
    phone:    <Svg width={size} height={size} viewBox="0 0 24 24"><Path {...p} d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.69 12 19.79 19.79 0 0 1 1.61 3.4 2 2 0 0 1 3.6 1.22h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L7.91 8.82a16 16 0 0 0 6.29 6.29l.95-.95a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 22 16.92z"/></Svg>,
    mapPin:   <Svg width={size} height={size} viewBox="0 0 24 24"><Path {...p} d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><Circle {...p} cx="12" cy="10" r="3"/></Svg>,
    user:     <Svg width={size} height={size} viewBox="0 0 24 24"><Path {...p} d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><Circle {...p} cx="12" cy="7" r="4"/></Svg>,
    mail:     <Svg width={size} height={size} viewBox="0 0 24 24"><Rect {...p} x="2" y="4" width="20" height="16" rx="2"/><Path {...p} d="M22 7l-10 7L2 7"/></Svg>,
    info:     <Svg width={size} height={size} viewBox="0 0 24 24"><Circle {...p} cx="12" cy="12" r="10"/><Line {...p} x1="12" y1="8" x2="12" y2="12"/><Line {...p} x1="12" y1="16" x2="12.01" y2="16"/></Svg>,
    calendar: <Svg width={size} height={size} viewBox="0 0 24 24"><Rect {...p} x="3" y="4" width="18" height="18" rx="2"/><Line {...p} x1="16" y1="2" x2="16" y2="6"/><Line {...p} x1="8" y1="2" x2="8" y2="6"/><Line {...p} x1="3" y1="10" x2="21" y2="10"/></Svg>,
    shield:   <Svg width={size} height={size} viewBox="0 0 24 24"><Path {...p} d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></Svg>,
    check:    <Svg width={size} height={size} viewBox="0 0 24 24"><Polyline {...p} points="20 6 9 17 4 12"/></Svg>,
    syringe:  <Svg width={size} height={size} viewBox="0 0 24 24"><Line {...p} x1="3" y1="21" x2="7" y2="17"/><Line {...p} x1="7" y1="17" x2="16" y2="8"/><Line {...p} x1="16" y1="8" x2="20" y2="4"/><Line {...p} x1="18" y1="2" x2="22" y2="6"/><Line {...p} x1="6" y1="15" x2="15" y2="6"/><Line {...p} x1="9" y1="18" x2="18" y2="9"/></Svg>,
  };
  return map[name] || null;
};

const extraireTableau = (res) => {
  if (!res) return [];
  const d = res.data ?? res;
  if (Array.isArray(d)) return d;
  if (d && Array.isArray(d.data)) return d.data;
  return [];
};

export default function MonRelais({ route, navigation }) {
  const [loading, setLoading]   = useState(true);
  const [relais, setRelais]     = useState(null);
  const [enfants, setEnfants]   = useState([]);
  const [erreur, setErreur]     = useState(null);
  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => { charger(); }, []);

  const charger = async () => {
    try {
      const token     = await AsyncStorage.getItem('token');
      const typeUsers = await AsyncStorage.getItem('type_users') ?? 'mere';
      const h = { Authorization: `Bearer ${token}`, 'X-Type-Users': typeUsers };

      const [profilRes, enfantsRes] = await Promise.all([
        axios.get(`${API_URL}/profil`, { headers: h }),
        axios.get(`${API_URL}/parent/enfants`, { headers: h }),
      ]);

      // Le relais est souvent lié au parent ou au premier enfant
      const profil   = profilRes.data?.user ?? profilRes.data;
      const listeEnf = extraireTableau(enfantsRes);
      setEnfants(listeEnf);

      // Chercher le relais dans : profil.relais, profil.relais_communautaire, ou enfant.relais
      const relaisTrouve =
        profil?.relais ??
        profil?.relais_communautaire ??
        listeEnf[0]?.relais ??
        listeEnf[0]?.relais_communautaire ??
        null;

      setRelais(relaisTrouve);
    } catch (e) {
      console.error('MonRelais:', e?.response?.data || e.message);
      setErreur('Impossible de charger les informations du relais.');
    } finally {
      setLoading(false);
      Animated.timing(fadeAnim, { toValue: 1, duration: 350, useNativeDriver: true }).start();
    }
  };

  const appelerRelais = () => {
    const tel = relais?.telephone || relais?.phone || relais?.contact;
    if (tel) Linking.openURL(`tel:${tel}`);
  };

  if (loading) return (
    <View style={S.loader}>
      <ActivityIndicator size="large" color={C.teal} />
      <Text style={S.loaderT}>Chargement du relais…</Text>
    </View>
  );

  return (
    <SafeAreaView style={S.container}>
      <StatusBar barStyle="light-content" backgroundColor={C.teal} />

      <View style={[S.header, { backgroundColor: C.teal }]}>
        <View style={S.headerTop}>
          <TouchableOpacity style={S.backBtn} onPress={() => navigation.goBack()} activeOpacity={0.8}>
            <Icon name="back" size={22} color="#fff" sw={2.2} />
          </TouchableOpacity>
          <View style={{ flex: 1 }}>
            <Text style={S.hdrTitle}>Mon relais communautaire</Text>
            <Text style={S.hdrSub}>Votre point de contact vaccination</Text>
          </View>
          <View style={S.hdrIco}>
            <Icon name="shield" size={22} color="#fff" sw={2} />
          </View>
        </View>
      </View>

      <Animated.View style={{ flex: 1, opacity: fadeAnim }}>
        <ScrollView style={S.scroll} showsVerticalScrollIndicator={false}>

          {erreur ? (
            <View style={S.empty}>
              <Icon name="info" size={48} color={C.textLight} sw={1.5} />
              <Text style={S.emptyTitle}>Erreur de chargement</Text>
              <Text style={S.emptySub}>{erreur}</Text>
              <TouchableOpacity style={S.retryBtn} onPress={() => { setLoading(true); setErreur(null); charger(); }}>
                <Text style={S.retryBtnT}>Réessayer</Text>
              </TouchableOpacity>
            </View>
          ) : !relais ? (
            <View style={S.empty}>
              <View style={S.emptyIco}>
                <Icon name="user" size={36} color={C.teal} sw={1.8} />
              </View>
              <Text style={S.emptyTitle}>Aucun relais assigné</Text>
              <Text style={S.emptySub}>
                Vous n'avez pas encore de relais communautaire assigné.{'\n'}
                Contactez votre centre de santé pour en obtenir un.
              </Text>

              {/* Carte informative */}
              <View style={S.infoCard}>
                <View style={S.infoRow}>
                  <Icon name="info" size={16} color={C.teal} sw={2} />
                  <Text style={S.infoT}>Le relais communautaire vous aide à suivre le calendrier vaccinal de votre enfant et vous rappelle les rendez-vous.</Text>
                </View>
              </View>
            </View>
          ) : (
            <View style={{ padding: 16, gap: 14 }}>

              {/* Carte principale relais */}
              <View style={S.relaisCard}>
                {/* Avatar + nom */}
                <View style={S.relaisHead}>
                  <View style={S.relaisAvatar}>
                    <Text style={S.relaisAvatarT}>
                      {(relais.prenom?.[0] ?? relais.nom?.[0] ?? 'R').toUpperCase()}
                      {(relais.nom?.[0] ?? '').toUpperCase()}
                    </Text>
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={S.relaisNom}>
                      {relais.prenom ?? ''} {relais.nom ?? relais.name ?? 'Relais communautaire'}
                    </Text>
                    <View style={S.relaisRoleBadge}>
                      <Icon name="shield" size={11} color={C.teal} sw={2} />
                      <Text style={S.relaisRoleT}>Relais communautaire</Text>
                    </View>
                  </View>
                  <View style={S.relaisActifBadge}>
                    <View style={S.relaisActifDot} />
                    <Text style={S.relaisActifT}>Actif</Text>
                  </View>
                </View>

                {/* Infos */}
                <View style={S.relaisInfos}>
                  {(relais.telephone || relais.phone || relais.contact) && (
                    <View style={S.relaisInfoRow}>
                      <View style={S.relaisInfoIco}><Icon name="phone" size={15} color={C.teal} sw={2} /></View>
                      <View style={{ flex: 1 }}>
                        <Text style={S.relaisInfoLabel}>Téléphone</Text>
                        <Text style={S.relaisInfoVal}>{relais.telephone ?? relais.phone ?? relais.contact}</Text>
                      </View>
                    </View>
                  )}
                  {(relais.email) && (
                    <View style={S.relaisInfoRow}>
                      <View style={S.relaisInfoIco}><Icon name="mail" size={15} color={C.teal} sw={2} /></View>
                      <View style={{ flex: 1 }}>
                        <Text style={S.relaisInfoLabel}>Email</Text>
                        <Text style={S.relaisInfoVal}>{relais.email}</Text>
                      </View>
                    </View>
                  )}
                  {(relais.zone || relais.quartier || relais.village) && (
                    <View style={S.relaisInfoRow}>
                      <View style={S.relaisInfoIco}><Icon name="mapPin" size={15} color={C.teal} sw={2} /></View>
                      <View style={{ flex: 1 }}>
                        <Text style={S.relaisInfoLabel}>Zone</Text>
                        <Text style={S.relaisInfoVal}>{relais.zone ?? relais.quartier ?? relais.village}</Text>
                      </View>
                    </View>
                  )}
                  {relais.centre_sante && (
                    <View style={[S.relaisInfoRow, { borderBottomWidth: 0 }]}>
                      <View style={S.relaisInfoIco}><Icon name="syringe" size={15} color={C.teal} sw={2} /></View>
                      <View style={{ flex: 1 }}>
                        <Text style={S.relaisInfoLabel}>Centre de santé rattaché</Text>
                        <Text style={S.relaisInfoVal}>{relais.centre_sante?.nom ?? relais.centre_sante}</Text>
                      </View>
                    </View>
                  )}
                </View>

                {/* Bouton appeler */}
                {(relais.telephone || relais.phone || relais.contact) && (
                  <TouchableOpacity style={S.appelBtn} onPress={appelerRelais} activeOpacity={0.85}>
                    <Icon name="phone" size={18} color="#fff" sw={2.2} />
                    <Text style={S.appelBtnT}>Appeler mon relais</Text>
                  </TouchableOpacity>
                )}
              </View>

              {/* Enfants liés */}
              {enfants.length > 0 && (
                <View style={S.section}>
                  <View style={S.secHead}>
                    <View style={S.secLine} />
                    <Text style={S.secTitle}>ENFANTS SUIVIS</Text>
                  </View>
                  {enfants.map((e, i) => (
                    <View key={e.id ?? i} style={[S.enfantRow, i < enfants.length - 1 && { borderBottomWidth: 0.5, borderBottomColor: '#f3f4f6' }]}>
                      <View style={S.enfantAvatar}>
                        <Text style={S.enfantAvatarT}>{(e.prenom?.[0] ?? '').toUpperCase()}</Text>
                      </View>
                      <View style={{ flex: 1 }}>
                        <Text style={S.enfantNom}>{e.prenom} {e.nom}</Text>
                        <Text style={S.enfantMeta}>
                          {e.sexe === 'F' ? 'Fille' : 'Garçon'}
                          {e.date_naissance ? ` · Né${e.sexe === 'F' ? 'e' : ''} le ${new Date(e.date_naissance).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' })}` : ''}
                        </Text>
                      </View>
                      <Icon name="check" size={14} color={C.success} sw={2.5} />
                    </View>
                  ))}
                </View>
              )}

              {/* Info rôle relais */}
              <View style={S.roleCard}>
                <Text style={S.roleTitle}>Rôle du relais communautaire</Text>
                {[
                  'Vous rappeler les dates de vaccination',
                  'Vous orienter vers le centre de santé',
                  'Suivre le carnet vaccinal de votre enfant',
                  'Répondre à vos questions sur les vaccins',
                ].map((item, i) => (
                  <View key={i} style={S.roleItem}>
                    <View style={S.roleDot} />
                    <Text style={S.roleItemT}>{item}</Text>
                  </View>
                ))}
              </View>

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
  loaderT:   { marginTop: 12, color: C.teal, fontSize: 13, fontWeight: '500' },
  scroll:    { flex: 1 },
  header:    { paddingHorizontal: 16, paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight + 12 : 14, paddingBottom: 20 },
  headerTop: { flexDirection: 'row', alignItems: 'center' },
  backBtn:   { marginRight: 10, padding: 4 },
  hdrTitle:  { fontSize: 17, fontWeight: '700', color: '#fff' },
  hdrSub:    { fontSize: 11, color: 'rgba(255,255,255,0.7)', marginTop: 2 },
  hdrIco:    { width: 40, height: 40, borderRadius: 20, backgroundColor: 'rgba(255,255,255,0.2)', justifyContent: 'center', alignItems: 'center' },

  // Carte relais
  relaisCard:   { backgroundColor: C.white, borderRadius: 16, overflow: 'hidden', borderWidth: 0.5, borderColor: '#e5e7eb', elevation: 2 },
  relaisHead:   { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 16, backgroundColor: '#f0fdfa' },
  relaisAvatar: { width: 52, height: 52, borderRadius: 26, backgroundColor: C.teal, justifyContent: 'center', alignItems: 'center' },
  relaisAvatarT:{ fontSize: 18, fontWeight: '800', color: '#fff' },
  relaisNom:    { fontSize: 15, fontWeight: '700', color: C.textDark },
  relaisRoleBadge:{ flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 3 },
  relaisRoleT:  { fontSize: 11, color: C.teal, fontWeight: '500' },
  relaisActifBadge:{ flexDirection: 'row', alignItems: 'center', gap: 5, backgroundColor: '#d1fae5', borderRadius: 20, paddingHorizontal: 9, paddingVertical: 4 },
  relaisActifDot:  { width: 6, height: 6, borderRadius: 3, backgroundColor: C.success },
  relaisActifT:    { fontSize: 10, fontWeight: '600', color: C.success },
  relaisInfos:  { paddingHorizontal: 16, paddingVertical: 4 },
  relaisInfoRow:{ flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 10, borderTopWidth: 0.5, borderTopColor: '#f3f4f6' },
  relaisInfoIco:{ width: 32, height: 32, borderRadius: 16, backgroundColor: '#f0fdfa', justifyContent: 'center', alignItems: 'center' },
  relaisInfoLabel:{ fontSize: 10, color: C.textLight },
  relaisInfoVal:  { fontSize: 13, fontWeight: '600', color: C.textDark, marginTop: 1 },
  appelBtn:  { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10, backgroundColor: C.teal, margin: 14, marginTop: 4, borderRadius: 12, paddingVertical: 14 },
  appelBtnT: { fontSize: 15, fontWeight: '700', color: '#fff' },

  // Section enfants
  section:   { backgroundColor: C.white, borderRadius: 14, borderWidth: 0.5, borderColor: '#e5e7eb', overflow: 'hidden' },
  secHead:   { flexDirection: 'row', alignItems: 'center', gap: 8, padding: 14, borderBottomWidth: 0.5, borderBottomColor: '#f3f4f6' },
  secLine:   { width: 3, height: 14, backgroundColor: C.teal, borderRadius: 2 },
  secTitle:  { fontSize: 10, fontWeight: '700', color: C.textDark, letterSpacing: 0.5 },
  enfantRow: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 12 },
  enfantAvatar:  { width: 36, height: 36, borderRadius: 18, backgroundColor: '#f0fdfa', justifyContent: 'center', alignItems: 'center' },
  enfantAvatarT: { fontSize: 14, fontWeight: '700', color: C.teal },
  enfantNom:  { fontSize: 13, fontWeight: '600', color: C.textDark },
  enfantMeta: { fontSize: 11, color: C.textLight, marginTop: 1 },

  // Rôle
  roleCard:   { backgroundColor: C.white, borderRadius: 14, padding: 16, borderWidth: 0.5, borderColor: '#e5e7eb' },
  roleTitle:  { fontSize: 13, fontWeight: '700', color: C.textDark, marginBottom: 12 },
  roleItem:   { flexDirection: 'row', alignItems: 'flex-start', gap: 10, marginBottom: 8 },
  roleDot:    { width: 6, height: 6, borderRadius: 3, backgroundColor: C.teal, marginTop: 5 },
  roleItemT:  { fontSize: 13, color: C.textMid, flex: 1, lineHeight: 18 },

  // Empty
  empty:     { alignItems: 'center', paddingVertical: 60, gap: 14, paddingHorizontal: 30 },
  emptyIco:  { width: 80, height: 80, borderRadius: 40, backgroundColor: '#f0fdfa', justifyContent: 'center', alignItems: 'center', marginBottom: 6 },
  emptyTitle:{ fontSize: 16, fontWeight: '700', color: C.textDark },
  emptySub:  { fontSize: 13, color: C.textLight, textAlign: 'center', lineHeight: 20 },
  infoCard:  { backgroundColor: '#f0fdfa', borderRadius: 12, padding: 14, borderWidth: 1, borderColor: '#99f6e4', width: '100%', marginTop: 6 },
  infoRow:   { flexDirection: 'row', alignItems: 'flex-start', gap: 10 },
  infoT:     { flex: 1, fontSize: 12, color: C.teal, lineHeight: 18 },
  retryBtn:  { backgroundColor: C.teal, borderRadius: 12, paddingHorizontal: 24, paddingVertical: 12, marginTop: 6 },
  retryBtnT: { fontSize: 14, fontWeight: '700', color: '#fff' },
});