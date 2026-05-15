import React, { useState, useEffect } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, StyleSheet,
  SafeAreaView, StatusBar, RefreshControl, ActivityIndicator, Linking
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
import { API_URL } from './config';

const formatDateCourt = (dateStr) => {
  if (!dateStr) return '—';
  const d = new Date(dateStr);
  if (isNaN(d)) return dateStr;
  return d.toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit', year: 'numeric' });
};

const joursRestants = (dateStr) => {
  if (!dateStr) return null;
  return Math.ceil((new Date(dateStr) - new Date()) / (1000 * 60 * 60 * 24));
};

const extraireTableau = (response) => {
  if (!response) return [];
  const data = response.data ?? response;
  if (Array.isArray(data)) return data;
  if (data && Array.isArray(data.data)) return data.data;
  return [];
};

const ChipDelai = ({ dateStr }) => {
  const j = joursRestants(dateStr);
  if (j === null) return null;
  if (j < 0)   return <View style={[S.chip, S.chipR]}><Text style={S.chipRT}>{Math.abs(j)} jours de retard</Text></View>;
  if (j === 0) return <View style={[S.chip, S.chipA]}><Text style={S.chipAT}>Aujourd'hui</Text></View>;
  return <View style={[S.chip, S.chipV]}><Text style={S.chipVT}>Dans {j} jours</Text></View>;
};

const ChipVaccin = ({ nom }) => (
  <View style={S.chipVaccin}><Text style={S.chipVaccinT}>{nom}</Text></View>
);

const CarteEnfant = ({ enfant, enRetard }) => (
  <View style={[S.carteEnfant, enRetard && S.carteEnfantR]}>
    <View style={S.carteHead}>
      <Text style={S.nomEnfant}>{enfant.prenom} {enfant.nom}</Text>
      {enfant.prochain_vaccin?.vaccin && <ChipVaccin nom={enfant.prochain_vaccin.vaccin} />}
    </View>
    <Text style={S.ageCode}>{enfant.age_mois ? `${enfant.age_mois} mois` : '—'} · Code : {enfant.code || '—'}</Text>
    {enfant.prochain_vaccin?.date_prevue && (
      <View style={S.dateLigne}>
        <Text style={S.dateI}>📅</Text>
        <Text style={S.dateT}>{formatDateCourt(enfant.prochain_vaccin.date_prevue)}</Text>
        <ChipDelai dateStr={enfant.prochain_vaccin.date_prevue} />
      </View>
    )}
    <View style={S.sep} />
    <View style={S.parentsGrid}>
      <View style={S.pCol}>
        <Text style={S.pLabel}>MÈRE</Text>
        <Text style={S.pVal}>{enfant.mere_tuteur?.nom || 'Non renseigné'}</Text>
      </View>
      {enfant.mere_tuteur?.telephone && (
        <View style={S.pCol}>
          <Text style={S.pLabel}>TÉL. MÈRE</Text>
          <TouchableOpacity onPress={() => Linking.openURL(`tel:${enfant.mere_tuteur.telephone}`)}>
            <Text style={S.pTel}>{enfant.mere_tuteur.telephone}</Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
    {enfant.mere_tuteur?.adresse && (
      <View style={{ marginTop: 4 }}>
        <Text style={S.pLabel}>ADRESSE</Text>
        <Text style={S.pVal}>{enfant.mere_tuteur.adresse}</Text>
      </View>
    )}
  </View>
);

export default function DashboardRelais({ navigation }) {
  const [loading, setLoading]             = useState(true);
  const [refreshing, setRefreshing]       = useState(false);
  const [relais, setRelais]               = useState(null);
  const [stats, setStats]                 = useState({ centre_nom: '—', centre_ville: '—', enfants_suivis: 0 });
  const [rdvsAVenir, setRdvsAVenir]       = useState([]);
  const [enfantsRetard, setEnfantsRetard] = useState([]);
  const [onglet, setOnglet]               = useState('rdv');

  const charger = async () => {
    try {
      const token = await AsyncStorage.getItem('token');
      const h = { Authorization: `Bearer ${token}` };
      const [p, st, rdv, ret] = await Promise.all([
        axios.get(`${API_URL}/profil`,                        { headers: h }),
        axios.get(`${API_URL}/relais/stats`,                  { headers: h }),
        axios.get(`${API_URL}/relais/enfants/rdv-a-venir`,   { headers: h }),
        axios.get(`${API_URL}/relais/enfants/en-retard`,      { headers: h }),
      ]);
      setRelais(p.data?.user || p.data);
      setStats(st.data || { centre_nom: '—', centre_ville: '—', enfants_suivis: 0 });
      setRdvsAVenir(extraireTableau(rdv));
      setEnfantsRetard(extraireTableau(ret));
    } catch (e) {
      console.error('Erreur DashboardRelais:', e?.response?.data || e.message);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => { charger(); }, []);
  const onRefresh = () => { setRefreshing(true); charger(); };

  if (loading) return (
    <View style={S.loader}>
      <ActivityIndicator size="large" color="#065f46" />
      <Text style={S.loaderT}>Chargement…</Text>
    </View>
  );

  const liste = onglet === 'rdv'
    ? (Array.isArray(rdvsAVenir) ? rdvsAVenir : [])
    : (Array.isArray(enfantsRetard) ? enfantsRetard : []);

  return (
    <SafeAreaView style={S.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#fff" />
      <View style={S.topbar}>
        <View>
          <Text style={S.topTitre}>Tableau de bord</Text>
          <Text style={S.topDate}>{new Date().toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}</Text>
        </View>
        <TouchableOpacity style={S.avatar} onPress={() => navigation.navigate('Connexion')}>
          <Text style={S.avatarT}>{relais?.prenom?.charAt(0)}{relais?.nom?.charAt(0)}</Text>
        </TouchableOpacity>
      </View>
      <View style={S.identite}>
        <Text style={S.identiteNom}>{relais?.prenom} {relais?.nom}</Text>
        <Text style={S.identiteRole}>Relais Communautaire · {relais?.centre_sante?.nom || '—'}</Text>
      </View>
      <ScrollView style={S.scroll} showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#065f46']} />}>
        <View style={S.statsRow}>
          <View style={S.statCard}>
            <Text style={S.statL}>MON CENTRE</Text>
            <Text style={S.statCentreNom}>{stats.centre_nom || relais?.centre_sante?.nom || '—'}</Text>
            <Text style={S.statS}>{stats.centre_ville || relais?.centre_sante?.ville || '—'}</Text>
            <View style={[S.statIB, { backgroundColor: '#d1fae5' }]}><Text style={S.statI}>🏥</Text></View>
          </View>
          <View style={S.statCard}>
            <Text style={S.statL}>ENFANTS{'\n'}SUIVIS</Text>
            <Text style={S.statV}>{stats.enfants_suivis ?? 0}</Text>
            <Text style={S.statS}>Dans votre centre</Text>
            <View style={[S.statIB, { backgroundColor: '#dbeafe' }]}><Text style={S.statI}>👶</Text></View>
          </View>
        </View>
        <View style={S.section}>
          <View style={S.secTRow}><Text style={S.secTitre}>Liste de terrain</Text></View>
          <Text style={S.secSub}>Familles à contacter</Text>
          <View style={S.ongletsRow}>
            <TouchableOpacity style={[S.ongletBtn, onglet === 'rdv' && S.ongActif]} onPress={() => setOnglet('rdv')}>
              <Text style={[S.ongT, onglet === 'rdv' && S.ongTA]}>📅 RDV à venir  {rdvsAVenir.length}</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[S.ongletBtn, onglet === 'retard' && S.ongRetActif]} onPress={() => setOnglet('retard')}>
              <Text style={[S.ongT, onglet === 'retard' && S.ongTA]}>⚠️ En retard  {enfantsRetard.length}</Text>
            </TouchableOpacity>
          </View>
          {liste.length === 0
            ? <View style={S.vide}><Text style={S.videT}>{onglet === 'rdv' ? 'Aucun rendez-vous à venir' : 'Aucun enfant en retard 🎉'}</Text></View>
            : liste.map((e, i) => <CarteEnfant key={i} enfant={e} enRetard={onglet === 'retard'} />)
          }
        </View>
        <View style={{ height: 40 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const VERT = '#065f46';
const S = StyleSheet.create({
  container:{flex:1,backgroundColor:'#f9fafb'},
  loader:{flex:1,justifyContent:'center',alignItems:'center'},
  loaderT:{marginTop:12,color:VERT,fontSize:14},
  scroll:{flex:1},
  topbar:{backgroundColor:'#fff',paddingHorizontal:20,paddingVertical:14,flexDirection:'row',justifyContent:'space-between',alignItems:'center',borderBottomWidth:1,borderBottomColor:'#e5e7eb'},
  topTitre:{fontSize:20,fontWeight:'700',color:'#111827'},
  topDate:{fontSize:12,color:'#6b7280',marginTop:2},
  avatar:{width:38,height:38,borderRadius:19,backgroundColor:VERT,justifyContent:'center',alignItems:'center'},
  avatarT:{color:'#fff',fontSize:13,fontWeight:'700'},
  identite:{backgroundColor:'#fff',paddingHorizontal:20,paddingVertical:10,borderBottomWidth:1,borderBottomColor:'#f3f4f6'},
  identiteNom:{fontSize:15,fontWeight:'600',color:'#111827'},
  identiteRole:{fontSize:12,color:'#6b7280',marginTop:2},
  statsRow:{flexDirection:'row',paddingHorizontal:12,paddingTop:12,gap:10},
  statCard:{flex:1,backgroundColor:'#fff',borderRadius:14,padding:14,position:'relative',overflow:'hidden',shadowColor:'#000',shadowOpacity:0.05,shadowRadius:6,elevation:2},
  statL:{fontSize:10,color:'#6b7280',fontWeight:'600',lineHeight:14,letterSpacing:0.3},
  statV:{fontSize:32,fontWeight:'800',color:'#111827',marginTop:4},
  statCentreNom:{fontSize:15,fontWeight:'700',color:'#111827',marginTop:4},
  statS:{fontSize:11,color:'#9ca3af',marginTop:2},
  statIB:{position:'absolute',top:12,right:12,width:36,height:36,borderRadius:10,justifyContent:'center',alignItems:'center'},
  statI:{fontSize:18},
  section:{paddingHorizontal:12,marginTop:20},
  secTRow:{flexDirection:'row',alignItems:'center'},
  secTitre:{fontSize:18,fontWeight:'700',color:'#111827'},
  secSub:{fontSize:13,color:'#6b7280',marginBottom:14,marginTop:2},
  ongletsRow:{flexDirection:'row',gap:10,marginBottom:12},
  ongletBtn:{paddingHorizontal:16,paddingVertical:10,borderRadius:20,borderWidth:1,borderColor:'#d1d5db',backgroundColor:'#fff'},
  ongActif:{backgroundColor:VERT,borderColor:VERT},
  ongRetActif:{backgroundColor:'#dc2626',borderColor:'#dc2626'},
  ongT:{fontSize:13,color:'#374151',fontWeight:'500'},
  ongTA:{color:'#fff',fontWeight:'700'},
  carteEnfant:{backgroundColor:'#fff',borderRadius:14,padding:16,marginBottom:10,borderLeftWidth:3,borderLeftColor:VERT,shadowColor:'#000',shadowOpacity:0.04,elevation:1},
  carteEnfantR:{borderLeftColor:'#dc2626'},
  carteHead:{flexDirection:'row',alignItems:'center',flexWrap:'wrap',gap:8,marginBottom:4},
  nomEnfant:{fontSize:16,fontWeight:'700',color:'#111827'},
  ageCode:{fontSize:12,color:'#6b7280',marginBottom:8},
  dateLigne:{flexDirection:'row',alignItems:'center',marginBottom:10,gap:6},
  dateI:{fontSize:13},
  dateT:{fontSize:13,color:'#374151'},
  sep:{height:1,backgroundColor:'#f3f4f6',marginBottom:10},
  parentsGrid:{flexDirection:'row',marginBottom:6},
  pCol:{flex:1},
  pLabel:{fontSize:10,color:'#9ca3af',fontWeight:'600',letterSpacing:0.3,marginBottom:2},
  pVal:{fontSize:13,color:'#374151'},
  pTel:{fontSize:13,color:VERT,fontWeight:'600'},
  chip:{borderRadius:10,paddingHorizontal:8,paddingVertical:3},
  chipV:{backgroundColor:'#d1fae5'},chipVT:{fontSize:11,color:VERT,fontWeight:'600'},
  chipR:{backgroundColor:'#fee2e2'},chipRT:{fontSize:11,color:'#dc2626',fontWeight:'600'},
  chipA:{backgroundColor:'#fef3c7'},chipAT:{fontSize:11,color:'#92400e',fontWeight:'600'},
  chipVaccin:{backgroundColor:'#f0fdf4',borderWidth:1,borderColor:'#86efac',borderRadius:6,paddingHorizontal:7,paddingVertical:2},
  chipVaccinT:{fontSize:11,color:VERT,fontWeight:'600'},
  vide:{alignItems:'center',paddingVertical:30},
  videT:{color:'#9ca3af',fontSize:14},
});