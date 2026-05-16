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

// ── Écrans (tous dans le même dossier que App.js)
import Inscription from './Inscription';
import DashboardParent from './DashboardParent';
import DashboardAgent from './DashboardAgent';
import DashboardResponsable from './DashboardResponsable';
import DashboardRelais from './DashboardRelais';
import FicheEnfant from './FicheEnfant';

// ✅ Import config unifié
import { API_URL } from './config';

const Stack = createNativeStackNavigator();

// ─── Composant Principal ─────────────────────────────────────────────────────
export default function App() {
  const [sessionChargee, setSessionChargee] = useState(false);
  const [sessionInitiale, setSessionInitiale] = useState(null);

  useEffect(() => { verifierSession(); }, []);

  const verifierSession = async () => {
    try {
      const token = await AsyncStorage.getItem('token');
      const role = await AsyncStorage.getItem('role');
      const user = await AsyncStorage.getItem('user');
      if (token && role && user) {
        setSessionInitiale({ token, role, user: JSON.parse(user) });
      }
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
    if (role === 'mere' || role === 'pere') return 'DashboardParent';
    if (role === 'agent_sante') return 'DashboardAgent';
    if (role === 'relais') return 'DashboardRelais';
    if (role === 'responsable_pev' || role === 'direction_departementale') return 'DashboardResponsable';
    return 'Connexion';
  };

  return (
    <NavigationContainer>
      <Stack.Navigator initialRouteName={ecranInitial()} screenOptions={{ headerShown: false }}>
        {/* ── Auth ── */}
        <Stack.Screen name="Connexion">
          {(props) => <EcranConnexion {...props} apiUrl={API_URL} />}
        </Stack.Screen>
        <Stack.Screen name="Inscription" component={Inscription} />

        {/* ── Dashboards ── */}
        <Stack.Screen name="DashboardParent" component={DashboardParent} />
        <Stack.Screen name="DashboardAgent" component={DashboardAgent} />
        <Stack.Screen name="DashboardRelais" component={DashboardRelais} />
        <Stack.Screen name="DashboardResponsable" component={DashboardResponsable} />

        {/* ── Écrans enfants ── */}
        <Stack.Screen name="FicheEnfant" component={FicheEnfant} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}

// ─── Écran de Connexion ───────────────────────────────────────────────────────
function EcranConnexion({ navigation, apiUrl }) {
  const [identifiant, setIdentifiant] = useState('');
  const [motDePasse, setMotDePasse] = useState('');
  const [voirMDP, setVoirMDP] = useState(false);
  const [typeUsers, setTypeUsers] = useState('personnel');
  const [loading, setLoading] = useState(false);
  const [erreur, setErreur] = useState('');

  const handleConnexion = async () => {
    if (!identifiant || !motDePasse) {
      setErreur('Veuillez remplir tous les champs.');
      return;
    }
    setLoading(true);
    setErreur('');

    try {
      const typesAEssayer = typeUsers === 'personnel' ? ['personnel'] : ['mere', 'pere'];
      let data = null;
      let succes = false;

      for (const type of typesAEssayer) {
        const reponse = await fetch(`${apiUrl}/login`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
          body: JSON.stringify({ identifiant, password: motDePasse, type_users: type }),
        });
        data = await reponse.json();
        console.log(`Essai ${type}:`, data);
        if (data.success) { succes = true; break; }
      }

      if (!succes) {
        setErreur(data?.message || 'Identifiant ou mot de passe incorrect.');
        return;
      }

      await AsyncStorage.setItem('token', data.token);
      await AsyncStorage.setItem('role', data.role);
      await AsyncStorage.setItem('user', JSON.stringify(data.user));

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
      setErreur('Impossible de joindre le serveur. Vérifiez que Laravel tourne.');
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
            <Text style={styles.titre}>💉 VacciBenin</Text>
            <Text style={styles.sousTitre}>Suivi vaccinal numérique</Text>
          </View>

          {/* Formulaire */}
          <View style={styles.formulaire}>
            <Text style={styles.titreFormulaire}>Connexion</Text>

            {erreur !== '' && (
              <View style={styles.erreurBox}>
                <Text style={styles.erreurTexte}>⚠️ {erreur}</Text>
              </View>
            )}

            {/* Toggle Personnel / Parent */}
            <View style={styles.champGroupe}>
              <Text style={styles.label}>Je suis</Text>
              <View style={styles.toggleContainer}>
                <TouchableOpacity
                  style={[styles.toggleOption, typeUsers === 'personnel' && styles.toggleActif]}
                  onPress={() => { setTypeUsers('personnel'); setErreur(''); }}
                  disabled={loading}
                >
                  <Text style={[styles.toggleTexte, typeUsers === 'personnel' && styles.toggleTexteActif]}>
                    👨‍⚕️ Personnel
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.toggleOption, typeUsers === 'parent' && styles.toggleActif]}
                  onPress={() => { setTypeUsers('parent'); setErreur(''); }}
                  disabled={loading}
                >
                  <Text style={[styles.toggleTexte, typeUsers === 'parent' && styles.toggleTexteActif]}>
                    👨‍👩‍👧 Parent
                  </Text>
                </TouchableOpacity>
              </View>
            </View>

            {/* Identifiant */}
            <View style={styles.champGroupe}>
              <Text style={styles.label}>
                {typeUsers === 'personnel' ? 'Adresse email' : 'Email ou téléphone'}
              </Text>
              <TextInput
                style={styles.input}
                placeholder={typeUsers === 'personnel' ? 'exemple@email.com' : 'email@... ou 0097000000'}
                placeholderTextColor="#aaa"
                value={identifiant}
                onChangeText={setIdentifiant}
                keyboardType={typeUsers === 'personnel' ? 'email-address' : 'default'}
                autoCapitalize="none"
                editable={!loading}
              />
            </View>

            {/* Mot de passe */}
            <View style={styles.champGroupe}>
              <Text style={styles.label}>Mot de passe</Text>
              <View style={styles.inputAvecIcone}>
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
                  <Text>{voirMDP ? '🙈' : '👁️'}</Text>
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
              {loading
                ? <ActivityIndicator color="white" size="small" />
                : <Text style={styles.boutonTexte}>Se connecter</Text>
              }
            </TouchableOpacity>

            {/* Inscription parent */}
            {typeUsers === 'parent' && (
              <>
                <View style={styles.separateur}>
                  <View style={styles.ligne} />
                  <Text style={styles.separateurTexte}>ou</Text>
                  <View style={styles.ligne} />
                </View>
                <TouchableOpacity
                  style={styles.boutonInscription}
                  onPress={() => navigation.navigate('Inscription')}
                  disabled={loading}
                >
                  <Text style={styles.inscriptionTexte}>
                    Pas encore de compte ? <Text style={styles.inscriptionLien}>S'inscrire</Text>
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

// ─── Styles ──────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#1a6b3c' },
  scrollContent: { flexGrow: 1 },
  header: { alignItems: 'center', paddingTop: 60, paddingBottom: 40 },
  titre: { fontSize: 32, fontWeight: 'bold', color: 'white', letterSpacing: 1 },
  sousTitre: { fontSize: 14, color: 'rgba(255,255,255,0.8)', marginTop: 4 },
  formulaire: { flex: 1, backgroundColor: 'white', borderTopLeftRadius: 30, borderTopRightRadius: 30, paddingHorizontal: 24, paddingTop: 32, paddingBottom: 40 },
  titreFormulaire: { fontSize: 24, fontWeight: 'bold', color: '#1a3c2e', marginBottom: 16 },
  erreurBox: { backgroundColor: '#fef2f2', borderRadius: 10, padding: 12, marginBottom: 16, borderLeftWidth: 3, borderLeftColor: '#dc2626' },
  erreurTexte: { fontSize: 13, color: '#dc2626', lineHeight: 20 },
  champGroupe: { marginBottom: 16 },
  label: { fontSize: 14, fontWeight: '600', color: '#374151', marginBottom: 6 },
  input: { borderWidth: 1, borderColor: '#e5e7eb', borderRadius: 12, padding: 14, fontSize: 16, color: '#1f2937', backgroundColor: '#f9fafb' },
  inputAvecIcone: { flexDirection: 'row', borderWidth: 1, borderColor: '#e5e7eb', borderRadius: 12, backgroundColor: '#f9fafb', alignItems: 'center' },
  inputMDP: { flex: 1, padding: 14, fontSize: 16, color: '#1f2937' },
  iconOeil: { padding: 14 },
  mdpOublie: { alignSelf: 'flex-end', marginBottom: 20 },
  mdpOublieTexte: { color: '#1a6b3c', fontSize: 14, fontWeight: '500' },
  toggleContainer: { flexDirection: 'row', borderRadius: 12, overflow: 'hidden', borderWidth: 1, borderColor: '#e5e7eb' },
  toggleOption: { flex: 1, paddingVertical: 12, alignItems: 'center', backgroundColor: '#f9fafb' },
  toggleActif: { backgroundColor: '#1a6b3c' },
  toggleTexte: { fontSize: 14, fontWeight: '600', color: '#6b7280' },
  toggleTexteActif: { color: 'white' },
  boutonConnexion: { backgroundColor: '#1a6b3c', borderRadius: 12, padding: 16, alignItems: 'center', elevation: 4 },
  boutonDisabled: { backgroundColor: '#6b9e85', elevation: 0 },
  boutonTexte: { color: 'white', fontSize: 16, fontWeight: 'bold' },
  separateur: { flexDirection: 'row', alignItems: 'center', marginVertical: 20 },
  ligne: { flex: 1, height: 1, backgroundColor: '#e5e7eb' },
  separateurTexte: { marginHorizontal: 12, color: '#9ca3af', fontSize: 14 },
  boutonInscription: { alignItems: 'center' },
  inscriptionTexte: { fontSize: 14, color: '#6b7280' },
  inscriptionLien: { color: '#1a6b3c', fontWeight: 'bold' },
});