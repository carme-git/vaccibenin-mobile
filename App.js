// App.js — Navigation complète VacciBenin — tous rôles + AsyncStorage
import React, { useState, useEffect } from 'react';
import {
  View, Text, TextInput, TouchableOpacity,
  StyleSheet, SafeAreaView, KeyboardAvoidingView,
  Platform, ScrollView, ActivityIndicator,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Svg, { Path, Circle, Line, Polyline, Rect } from 'react-native-svg';

// ── Écrans
import ActivationCompte from './ActivationCompte';
import DashboardParent from './DashboardParent';
import DashboardAgent from './DashboardAgent';
import DashboardResponsable from './DashboardResponsable';
import DashboardRelais from './DashboardRelais';
import FicheEnfant from './FicheEnfant';
import CarnetVaccinal from './CarnetVaccinal';
import RendezVous from './RendezVous';
import Rappels from './Rappels';
import HistoriqueVaccins from './HistoriqueVaccins';
import AjouterEnfant from './AjouterEnfant';
import ObservationsRelais from './ObservationsRelais';
import EnfantsRelais from './EnfantsRelais';
import { API_URL } from './config';

const Stack = createNativeStackNavigator();

// ─── Icônes SVG ──────────────────────────────────────────────────────────────
const IcoSyringe = ({ size = 22, color = 'white' }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <Path d="M3 21 L7 17 L16 8 L20 4" />
    <Path d="M18 2 L22 6" />
    <Path d="M6 15 L15 6" />
    <Path d="M9 18 L18 9" />
    <Path d="M10 10 L12 12" />
    <Path d="M12 8 L14 10" />
  </Svg>
);

const IcoStethoscope = ({ size = 22, color = 'white' }) => (
 <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <Path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2" />
    <Circle cx="9" cy="7" r="4" />
    <Path d="M23 21v-2a4 4 0 00-3-3.87" />
    <Path d="M16 3.13a4 4 0 010 7.75" />
  </Svg> 
);

const IcoFamily = ({ size = 22, color = 'white' }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <Path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2" />
    <Circle cx="9" cy="7" r="4" />
    <Path d="M23 21v-2a4 4 0 00-3-3.87" />
    <Path d="M16 3.13a4 4 0 010 7.75" />
  </Svg>
);

const IcoEyeOpen = ({ size = 20, color = '#6b7280' }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <Path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
    <Circle cx="12" cy="12" r="3" />
  </Svg>
);

const IcoEyeOff = ({ size = 20, color = '#6b7280' }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <Path d="M17.94 17.94A10.07 10.07 0 0112 20c-7 0-11-8-11-8a18.45 18.45 0 015.06-5.94" />
    <Path d="M9.9 4.24A9.12 9.12 0 0112 4c7 0 11 8 11 8a18.5 18.5 0 01-2.16 3.19" />
    <Line x1="1" y1="1" x2="23" y2="23" />
  </Svg>
);

const IcoMail = ({ size = 18, color = '#9ca3af' }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <Rect x="2" y="4" width="20" height="16" rx="2" />
    <Path d="M22 7l-10 7L2 7" />
  </Svg>
);

const IcoLock = ({ size = 18, color = '#9ca3af' }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <Rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
    <Path d="M7 11V7a5 5 0 0110 0v4" />
  </Svg>
);

const IcoAlert = ({ size = 16, color = '#dc2626' }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <Path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
    <Line x1="12" y1="9" x2="12" y2="13" />
    <Line x1="12" y1="17" x2="12.01" y2="17" />
  </Svg>
);

const IcoPhone = ({ size = 18, color = '#9ca3af' }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <Path d="M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07A19.5 19.5 0 013.07 9.8a19.79 19.79 0 01-3.07-8.67A2 2 0 012 1h3a2 2 0 012 1.72 12.84 12.84 0 00.7 2.81 2 2 0 01-.45 2.11L6.09 8.91a16 16 0 006 6l1.27-1.27a2 2 0 012.11-.45 12.84 12.84 0 002.81.7A2 2 0 0122 16.92z" />
  </Svg>
);

// ─── Composant Principal ─────────────────────────────────────────────────────
export default function App() {
  const [sessionChargee, setSessionChargee] = useState(false);
  const [sessionInitiale, setSessionInitiale] = useState(null);

  useEffect(() => { verifierSession(); }, []);

  const verifierSession = async () => {
    try {
      const token        = await AsyncStorage.getItem('token');
      const role         = await AsyncStorage.getItem('role');
      const user         = await AsyncStorage.getItem('user');
      const typeUsers    = await AsyncStorage.getItem('type_users');
      const compteActive = await AsyncStorage.getItem('compte_active');

      // ── Guard : on ne restaure la session QUE si le compte est activé ──
      if (token && role && user && compteActive === 'true') {
        setSessionInitiale({ token, role, typeUsers, user: JSON.parse(user) });
      }
      // Sinon → sessionInitiale reste null → écran Connexion
    } catch (e) {
      console.log('Pas de session sauvegardée');
    } finally {
      setSessionChargee(true);
    }
  };

  if (!sessionChargee) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#1a6b3c' }}>
        <ActivityIndicator size="large" color="white" />
      </View>
    );
  }

  const ecranInitial = () => {
    if (!sessionInitiale) return 'Connexion';
    const role = sessionInitiale.role;
    if (role === 'mere' || role === 'pere')                                return 'DashboardParent';
    if (role === 'agent_sante')                                            return 'DashboardAgent';
    if (role === 'relais')                                                 return 'DashboardRelais';
    if (role === 'responsable_pev' || role === 'direction_departementale') return 'DashboardResponsable';
    return 'Connexion';
  };

  return (
    <NavigationContainer>
      <Stack.Navigator initialRouteName={ecranInitial()} screenOptions={{ headerShown: false }}>
        <Stack.Screen name="Connexion">
          {(props) => <EcranConnexion {...props} apiUrl={API_URL} />}
        </Stack.Screen>
        <Stack.Screen name="ActivationCompte" component={ActivationCompte} />
        <Stack.Screen name="DashboardParent"      component={DashboardParent} />
        <Stack.Screen name="DashboardAgent"       component={DashboardAgent} />
        <Stack.Screen name="DashboardRelais"      component={DashboardRelais} />
        <Stack.Screen name="DashboardResponsable" component={DashboardResponsable} />
        <Stack.Screen name="FicheEnfant"          component={FicheEnfant} />
        <Stack.Screen name="CarnetVaccinal"       component={CarnetVaccinal} />
        <Stack.Screen name="RendezVous"           component={RendezVous} />
        <Stack.Screen name="Rappels"              component={Rappels} />
        <Stack.Screen name="HistoriqueVaccins"    component={HistoriqueVaccins} />
        <Stack.Screen name="AjouterEnfant"        component={AjouterEnfant}/>
        <Stack.Screen name="ObservationsRelais"   component={ObservationsRelais} />
        <Stack.Screen name="EnfantsRelais"        component={EnfantsRelais} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}

// ─── Écran de Connexion ───────────────────────────────────────────────────────
function EcranConnexion({ navigation, apiUrl }) {
  const [identifiant, setIdentifiant] = useState('');
  const [motDePasse,  setMotDePasse]  = useState('');
  const [voirMDP,     setVoirMDP]     = useState(false);
  const [ongletActif, setOngletActif] = useState('personnel');
  const [loading,     setLoading]     = useState(false);
  const [erreur,      setErreur]      = useState('');

  const handleConnexion = async () => {
    if (!identifiant || !motDePasse) {
      setErreur('Veuillez remplir tous les champs.');
      return;
    }
    setLoading(true);
    setErreur('');

    try {
      const typesAEssayer = ongletActif === 'personnel' ? ['personnel'] : ['mere', 'pere'];
      let data      = null;
      let succes    = false;
      let typeFinal = '';

      for (const type of typesAEssayer) {
        const reponse = await fetch(`${apiUrl}/login`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
          body: JSON.stringify({ identifiant, password: motDePasse, type_users: type }),
        });
        data = await reponse.json();
        if (data.success) {
          succes    = true;
          typeFinal = type;
          break;
        }
      }

      if (!succes) {
        setErreur(data?.message || 'Identifiant ou mot de passe incorrect.');
        return;
      }

      // ── Sauvegarde de la session ──
      await AsyncStorage.setItem('token',        data.token);
      await AsyncStorage.setItem('role',         data.role);
      await AsyncStorage.setItem('user',         JSON.stringify(data.user));
      await AsyncStorage.setItem('type_users',   typeFinal);
      await AsyncStorage.setItem('compte_active', 'true'); // ← AJOUT : marque le compte comme actif

      // ── Routage selon le rôle ──
      const role = data.role;
      if (role === 'agent_sante')
        navigation.replace('DashboardAgent');
      else if (role === 'responsable_pev' || role === 'direction_departementale')
        navigation.replace('DashboardResponsable');
      else if (role === 'mere' || role === 'pere')
        navigation.replace('DashboardParent');
      else if (role === 'relais')
        navigation.replace('DashboardRelais');
      else
        navigation.replace('Connexion');

    } catch (err) {
      console.error('Erreur réseau:', err);
      setErreur('Impossible de joindre le serveur. Vérifiez la connexion ou votre serveur Laravel.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style="light" />
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
        <ScrollView contentContainerStyle={styles.scrollContent}>

          {/* En-tête */}
          <View style={styles.header}>
            <View style={styles.logoWrap}>
              <IcoSyringe size={36} color="white" />
            </View>
            <Text style={styles.titre}>VacciBenin</Text>
            <Text style={styles.sousTitre}>Suivi vaccinal numérique</Text>
          </View>

          {/* Formulaire */}
          <View style={styles.formulaire}>
            <Text style={styles.titreFormulaire}>Connexion</Text>

            {erreur !== '' && (
              <View style={styles.erreurBox}>
                <IcoAlert size={16} color="#dc2626" />
                <Text style={styles.erreurTexte}>{erreur}</Text>
              </View>
            )}

            {/* Toggle Personnel / Parent */}
            <View style={styles.champGroupe}>
              <Text style={styles.label}>Je suis</Text>
              <View style={styles.toggleContainer}>
                <TouchableOpacity
                  style={[styles.toggleOption, ongletActif === 'personnel' && styles.toggleActif]}
                  onPress={() => { setOngletActif('personnel'); setErreur(''); }}
                  disabled={loading}
                >
                  <IcoStethoscope size={16} color={ongletActif === 'personnel' ? 'white' : '#6b7280'} />
                  <Text style={[styles.toggleTexte, ongletActif === 'personnel' && styles.toggleTexteActif]}>
                    Personnel
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.toggleOption, ongletActif === 'parent' && styles.toggleActif]}
                  onPress={() => { setOngletActif('parent'); setErreur(''); }}
                  disabled={loading}
                >
                  <IcoFamily size={16} color={ongletActif === 'parent' ? 'white' : '#6b7280'} />
                  <Text style={[styles.toggleTexte, ongletActif === 'parent' && styles.toggleTexteActif]}>
                    Parent
                  </Text>
                </TouchableOpacity>
              </View>
            </View>

            {/* Identifiant */}
            <View style={styles.champGroupe}>
              <Text style={styles.label}>
                {ongletActif === 'personnel' ? 'Adresse email' : 'Email ou téléphone'}
              </Text>
              <View style={styles.inputAvecIcone}>
                <View style={styles.inputIconeGauche}>
                  {ongletActif === 'personnel'
                    ? <IcoMail  size={18} color="#9ca3af" />
                    : <IcoPhone size={18} color="#9ca3af" />
                  }
                </View>
                <TextInput
                  style={styles.inputAvecPadding}
                  placeholder={ongletActif === 'personnel' ? 'exemple@email.com' : 'email@... ou numéro de téléphone'}
                  placeholderTextColor="#aaa"
                  value={identifiant}
                  onChangeText={setIdentifiant}
                  keyboardType={ongletActif === 'personnel' ? 'email-address' : 'default'}
                  autoCapitalize="none"
                  editable={!loading}
                />
              </View>
            </View>

            {/* Mot de passe */}
            <View style={styles.champGroupe}>
              <Text style={styles.label}>Mot de passe</Text>
              <View style={styles.inputAvecIcone}>
                <View style={styles.inputIconeGauche}>
                  <IcoLock size={18} color="#9ca3af" />
                </View>
                <TextInput
                  style={styles.inputMDP}
                  placeholder="Votre mot de passe"
                  placeholderTextColor="#aaa"
                  value={motDePasse}
                  onChangeText={setMotDePasse}
                  secureTextEntry={!voirMDP}
                  editable={!loading}
                />
                <TouchableOpacity onPress={() => setVoirMDP(!voirMDP)} style={styles.iconOeil}>
                  {voirMDP
                    ? <IcoEyeOff  size={20} color="#6b7280" />
                    : <IcoEyeOpen size={20} color="#6b7280" />
                  }
                </TouchableOpacity>
              </View>
            </View>

            {/* Mot de passe oublié */}
            <TouchableOpacity style={styles.mdpOublie} disabled={loading}>
              <Text style={styles.mdpOublieTexte}>Mot de passe oublié ?</Text>
            </TouchableOpacity>

            {/* Bouton connexion */}
            <TouchableOpacity
              style={[styles.boutonConnexion, loading && styles.boutonDisabled]}
              onPress={handleConnexion}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color="white" size="small" />
              ) : (
                <Text style={styles.boutonTexte}>Se connecter</Text>
              )}
            </TouchableOpacity>

            {/* Activation compte parent */}
            {ongletActif === 'parent' && (
              <>
                <View style={styles.separateur}>
                  <View style={styles.ligne} />
                  <Text style={styles.separateurTexte}>ou</Text>
                  <View style={styles.ligne} />
                </View>
                <TouchableOpacity
                  style={styles.boutonInscription}
                  onPress={() => navigation.navigate('ActivationCompte')}
                  disabled={loading}
                >
                  <Text style={styles.inscriptionTexte}>
                    Première connexion ?{' '}
                    <Text style={styles.inscriptionLien}>Activer mon compte</Text>
                  </Text>
                </TouchableOpacity>
              </>
            )}
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  container:          { flex: 1, backgroundColor: '#1a6b3c' },
  scrollContent:      { flexGrow: 1 },
  header:             { alignItems: 'center', paddingTop: 60, paddingBottom: 40 },
  logoWrap:           {
    width: 72, height: 72, borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.15)',
    borderWidth: 1.5, borderColor: 'rgba(255,255,255,0.3)',
    alignItems: 'center', justifyContent: 'center',
    marginBottom: 14,
  },
  titre:              { fontSize: 30, fontWeight: 'bold', color: 'white', letterSpacing: 0.5 },
  sousTitre:          { fontSize: 13, color: 'rgba(255,255,255,0.75)', marginTop: 4 },
  formulaire:         {
    flex: 1, backgroundColor: 'white',
    borderTopLeftRadius: 30, borderTopRightRadius: 30,
    paddingHorizontal: 24, paddingTop: 32, paddingBottom: 40,
  },
  titreFormulaire:    { fontSize: 22, fontWeight: 'bold', color: '#1a3c2e', marginBottom: 16 },
  erreurBox:          {
    flexDirection: 'row', alignItems: 'flex-start', gap: 8,
    backgroundColor: '#fef2f2', borderRadius: 10,
    padding: 12, marginBottom: 16,
    borderLeftWidth: 3, borderLeftColor: '#dc2626',
  },
  erreurTexte:        { flex: 1, fontSize: 13, color: '#dc2626', lineHeight: 20 },
  champGroupe:        { marginBottom: 16 },
  label:              { fontSize: 14, fontWeight: '600', color: '#374151', marginBottom: 6 },
  inputAvecIcone:     {
    flexDirection: 'row', alignItems: 'center',
    borderWidth: 1.5, borderColor: '#e5e7eb',
    borderRadius: 12, backgroundColor: '#f9fafb',
  },
  inputIconeGauche:   { paddingLeft: 14, paddingRight: 4 },
  inputAvecPadding:   { flex: 1, paddingVertical: 13, paddingRight: 14, fontSize: 15, color: '#1f2937' },
  inputMDP:           { flex: 1, paddingVertical: 13, paddingLeft: 4, fontSize: 15, color: '#1f2937' },
  iconOeil:           { padding: 13 },
  toggleContainer:    {
    flexDirection: 'row', borderRadius: 12,
    overflow: 'hidden', borderWidth: 1.5, borderColor: '#e5e7eb',
  },
  toggleOption:       {
    flex: 1, paddingVertical: 12,
    alignItems: 'center', justifyContent: 'center',
    flexDirection: 'row', gap: 6,
    backgroundColor: '#f9fafb',
  },
  toggleActif:        { backgroundColor: '#1a6b3c' },
  toggleTexte:        { fontSize: 14, fontWeight: '600', color: '#6b7280' },
  toggleTexteActif:   { color: 'white' },
  mdpOublie:          { alignSelf: 'flex-end', marginBottom: 20, marginTop: 2 },
  mdpOublieTexte:     { color: '#1a6b3c', fontSize: 14, fontWeight: '500' },
  boutonConnexion:    {
    backgroundColor: '#1a6b3c', borderRadius: 12,
    padding: 16, alignItems: 'center', elevation: 4,
  },
  boutonDisabled:     { backgroundColor: '#6b9e85', elevation: 0 },
  boutonTexte:        { color: 'white', fontSize: 16, fontWeight: 'bold' },
  separateur:         { flexDirection: 'row', alignItems: 'center', marginVertical: 20 },
  ligne:              { flex: 1, height: 1, backgroundColor: '#e5e7eb' },
  separateurTexte:    { marginHorizontal: 12, color: '#9ca3af', fontSize: 14 },
  boutonInscription:  { alignItems: 'center' },
  inscriptionTexte:   { fontSize: 14, color: '#6b7280' },
  inscriptionLien:    { color: '#1a6b3c', fontWeight: 'bold' },
});