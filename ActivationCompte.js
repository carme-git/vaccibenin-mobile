import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity,
  StyleSheet, Alert, ActivityIndicator,
  KeyboardAvoidingView, Platform, ScrollView,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { API_URL } from './config';
import Svg, { Path, Circle, Rect, Line } from 'react-native-svg';

const VERT       = '#1a6b3c';
const VERT_CLAIR = '#e8f5f0';

// ── Icônes SVG ───────────────────────────────────────────────
const IconoSeringue = ({ size = 32 }) => {
  const p = { stroke: '#fff', strokeWidth: 1.8, strokeLinecap: 'round', strokeLinejoin: 'round' };
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Line {...p} x1="3"  y1="21" x2="7"  y2="17"/>
      <Line {...p} x1="7"  y1="17" x2="16" y2="8"/>
      <Line {...p} x1="16" y1="8"  x2="20" y2="4"/>
      <Line {...p} x1="18" y1="2"  x2="22" y2="6"/>
      <Line {...p} x1="6"  y1="15" x2="15" y2="6"/>
      <Line {...p} x1="9"  y1="18" x2="18" y2="9"/>
    </Svg>
  );
};
const IconoEmail = ({ size = 24, color = VERT }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Rect x="2" y="4" width="20" height="16" rx="2" stroke={color} strokeWidth="1.8" fill="none"/>
    <Path d="M2 7l10 7 10-7" stroke={color} strokeWidth="1.8" fill="none"/>
  </Svg>
);
const IconoSms = ({ size = 24, color = VERT }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Rect x="2" y="4" width="20" height="14" rx="3" stroke={color} strokeWidth="1.8" fill="none"/>
    <Line x1="7" y1="10" x2="17" y2="10" stroke={color} strokeWidth="1.8" strokeLinecap="round"/>
    <Line x1="7" y1="14" x2="13" y2="14" stroke={color} strokeWidth="1.8" strokeLinecap="round"/>
  </Svg>
);
const IconoTel = ({ size = 20, color = VERT }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Path d="M6.6 10.8c1.4 2.8 3.8 5.1 6.6 6.6l2.2-2.2c.3-.3.7-.4 1-.2 1.1.4 2.3.6 3.6.6.6 0 1 .4 1 1V20c0 .6-.4 1-1 1C10.6 21 3 13.4 3 4c0-.6.4-1 1-1h3.5c.6 0 1 .4 1 1 0 1.3.2 2.5.6 3.6.1.3 0 .7-.2 1L6.6 10.8z"
      fill={color}/>
  </Svg>
);
const IconoCadenas = ({ size = 20, color = VERT }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Rect x="5" y="11" width="14" height="10" rx="2" stroke={color} strokeWidth="1.8" fill="none"/>
    <Path d="M8 11V7a4 4 0 018 0v4" stroke={color} strokeWidth="1.8" fill="none"/>
    <Circle cx="12" cy="16" r="1.5" fill={color}/>
  </Svg>
);
const IconoOeilOuvert = ({ size = 20, color = '#888' }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"
      stroke={color} strokeWidth="1.8" strokeLinecap="round" fill="none"/>
    <Circle cx="12" cy="12" r="3" stroke={color} strokeWidth="1.8" fill="none"/>
  </Svg>
);
const IconoOeilFerme = ({ size = 20, color = '#888' }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Path d="M17.94 17.94A10.07 10.07 0 0112 20c-7 0-11-8-11-8a18.45 18.45 0 015.06-5.94"
      stroke={color} strokeWidth="1.8" strokeLinecap="round" fill="none"/>
    <Path d="M9.9 4.24A9.12 9.12 0 0112 4c7 0 11 8 11 8a18.5 18.5 0 01-2.16 3.19"
      stroke={color} strokeWidth="1.8" strokeLinecap="round" fill="none"/>
    <Line x1="1" y1="1" x2="23" y2="23" stroke={color} strokeWidth="1.8" strokeLinecap="round"/>
  </Svg>
);
const IconoCheck = ({ size = 14, color = VERT }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Path d="M5 12l5 5L20 7" stroke={color} strokeWidth="2.5"
      strokeLinecap="round" strokeLinejoin="round"/>
  </Svg>
);
const IconoCheckCercle = ({ size = 56 }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Circle cx="12" cy="12" r="11" fill={VERT} />
    <Path d="M6 12l4 4 8-8" stroke="#fff" strokeWidth="2.2"
      strokeLinecap="round" strokeLinejoin="round"/>
  </Svg>
);

// ── Composant principal ───────────────────────────────────────
export default function ActivationCompte({ navigation }) {
  const [etape,        setEtape]        = useState('choix');
  const [canal,        setCanal]        = useState(null);
  const [contact,      setContact]      = useState('');
  const [mereId,       setMereId]       = useState(null);
  const [prenom,       setPrenom]       = useState('');
  const [otp,          setOtp]          = useState('');
  const [codeAffiche,  setCodeAffiche]  = useState('');
  const [password,     setPassword]     = useState('');
  const [confirm,      setConfirm]      = useState('');
  const [voirPassword, setVoirPassword] = useState(false);
  const [voirConfirm,  setVoirConfirm]  = useState(false);
  const [loading,      setLoading]      = useState(false);

  // ── ÉTAPE 2 — Vérifier contact PUIS envoyer OTP ──────────
  const verifierEtEnvoyerOtp = async () => {
    if (!contact.trim()) {
      Alert.alert(
        'Champ requis',
        canal === 'sms' ? 'Entrez votre numéro de téléphone.' : 'Entrez votre adresse email.'
      );
      return;
    }
    setLoading(true);
    try {
      const bodyVerif = canal === 'sms'
        ? { telephone: contact.trim() }
        : { email: contact.trim() };

      const resVerif = await fetch(`${API_URL}/verifier-mere`, {
        method:  'POST',
        headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
        body:    JSON.stringify(bodyVerif),
      });
      const dataVerif = await resVerif.json();

      // ── Compte déjà activé → rediriger vers connexion ────
      if (dataVerif.deja_active) {
        Alert.alert(
          'Compte déjà activé',
          'Votre compte est déjà activé. Connectez-vous normalement ou utilisez "Mot de passe oublié" si vous l\'avez oublié.',
          [
            { text: 'Se connecter', onPress: () => navigation.replace('Connexion') },
            { text: 'Annuler', style: 'cancel' },
          ]
        );
        return;
      }

      if (!resVerif.ok) {
        Alert.alert(
          'Compte introuvable',
          dataVerif.message || 'Aucun compte trouvé. Contactez votre centre de santé.'
        );
        return;
      }

      const idMere     = dataVerif.mere_id;
      const prenomMere = dataVerif.prenom;
      setMereId(idMere);
      setPrenom(prenomMere);

      // ── Envoyer le code OTP ───────────────────────────────
      const resOtp = await fetch(`${API_URL}/otp/activation`, {
        method:  'POST',
        headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
        body:    JSON.stringify({ mere_id: idMere, canal }),
      });
      const dataOtp = await resOtp.json();

      if (dataOtp.deja_active) {
        Alert.alert(
          'Compte déjà activé',
          dataOtp.message,
          [{ text: 'Se connecter', onPress: () => navigation.replace('Connexion') }]
        );
        return;
      }

      if (!resOtp.ok) {
        Alert.alert('Erreur', dataOtp.message || "Impossible d'envoyer le code. Réessayez.");
        return;
      }

      // ── Afficher le code pour SMS, alerte pour email ──────
      if (canal === 'sms') {
        setCodeAffiche(dataOtp.otp_dev || '');
      } else {
        setCodeAffiche('');
        Alert.alert(
          'Email envoyé ✉️',
          `Un code a été envoyé à ${contact.trim()}. Vérifiez votre boîte mail (et vos spams).`
        );
      }

      setEtape('saisie_otp');

    } catch (e) {
      console.error('verifierEtEnvoyerOtp:', e);
      Alert.alert('Erreur réseau', 'Impossible de joindre le serveur. Vérifiez votre connexion.');
    } finally {
      setLoading(false);
    }
  };

  // ── Renvoyer OTP ─────────────────────────────────────────
  const renvoyerOtp = async () => {
    if (!mereId) return;
    setLoading(true);
    try {
      const res  = await fetch(`${API_URL}/otp/activation`, {
        method:  'POST',
        headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
        body:    JSON.stringify({ mere_id: mereId, canal }),
      });
      const data = await res.json();

      if (!res.ok) {
        Alert.alert('Erreur', data.message || 'Impossible de renvoyer le code.');
        return;
      }

      if (canal === 'sms') {
        setCodeAffiche(data.otp_dev || '');
        Alert.alert('Code renouvelé', 'Un nouveau code est affiché ci-dessous.');
      } else {
        Alert.alert('Code renvoyé ✉️', `Un nouveau code a été envoyé à ${contact.trim()}.`);
      }
    } catch (e) {
      Alert.alert('Erreur réseau', 'Vérifiez votre connexion.');
    } finally {
      setLoading(false);
    }
  };

  // ── ÉTAPE 3 — Valider OTP ────────────────────────────────
  const validerOtp = async () => {
    if (otp.length !== 4) {
      Alert.alert('Code invalide', 'Le code doit contenir exactement 4 chiffres.');
      return;
    }
    setLoading(true);
    try {
      const res  = await fetch(`${API_URL}/verifier-code-activation`, {
        method:  'POST',
        headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
        body:    JSON.stringify({ mere_id: mereId, otp }),
      });
      const data = await res.json();

      if (!res.ok) {
        Alert.alert('Code incorrect', data.message || 'Code invalide ou expiré.');
        return;
      }

      setEtape('mot_de_passe');
    } catch (e) {
      Alert.alert('Erreur réseau', 'Impossible de joindre le serveur.');
    } finally {
      setLoading(false);
    }
  };

  // ── ÉTAPE 4 — Activer le compte ──────────────────────────
  const activerCompte = async () => {
    if (password.length < 8) {
      Alert.alert('Trop court', 'Le mot de passe doit contenir au minimum 8 caractères.');
      return;
    }
    if (password !== confirm) {
      Alert.alert('Erreur', 'Les deux mots de passe ne correspondent pas.');
      return;
    }
    setLoading(true);
    try {
      const res  = await fetch(`${API_URL}/activer-compte`, {
        method:  'POST',
        headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
        body:    JSON.stringify({ mere_id: mereId, otp, password }),
      });
      const data = await res.json();

      // ── Compte déjà activé ────────────────────────────────
      if (data.deja_active) {
        Alert.alert(
          'Compte déjà activé',
          'Ce compte a déjà été activé. Connectez-vous directement.',
          [{ text: 'Se connecter', onPress: () => navigation.replace('Connexion') }]
        );
        return;
      }

      if (!res.ok) {
        if (res.status === 422) {
          Alert.alert(
            'Code expiré',
            data.message || "Le code n'est plus valable.",
            [
              { text: 'Nouveau code', onPress: () => { setOtp(''); setCodeAffiche(''); setEtape('saisie_otp'); } },
              { text: 'Réessayer', style: 'cancel' },
            ]
          );
        } else {
          Alert.alert('Erreur', data.message || 'Activation échouée. Réessayez.');
        }
        return;
      }

      // ── Sauvegarde session + flag compte_active ───────────
      await AsyncStorage.setItem('token',         data.token);
      await AsyncStorage.setItem('type_users',    data.type_users);
      await AsyncStorage.setItem('role',          data.role ?? data.type_users);
      await AsyncStorage.setItem('user',          JSON.stringify(data.user));
      await AsyncStorage.setItem('compte_active', 'true'); // ← guard App.js

      setEtape('succes');

    } catch (e) {
      console.error('activerCompte:', e);
      Alert.alert('Erreur réseau', 'Impossible de joindre le serveur. Vérifiez votre connexion.');
    } finally {
      setLoading(false);
    }
  };

  // ── Stepper ──────────────────────────────────────────────
  const etapes   = ['choix', 'saisie_contact', 'saisie_otp', 'mot_de_passe'];
  const etapeNum = etape === 'succes' ? 5 : etapes.indexOf(etape) + 1;

  const Stepper = () => (
    <View style={styles.stepper}>
      {[1, 2, 3, 4].map((n) => (
        <View key={n} style={styles.stepItem}>
          <View style={[styles.stepCircle, etapeNum >= n && styles.stepCircleActive]}>
            {etapeNum > n
              ? <IconoCheck size={13} color={VERT} />
              : <Text style={[styles.stepNum, etapeNum >= n && styles.stepNumActive]}>{n}</Text>
            }
          </View>
          {n < 4 && (
            <View style={[styles.stepLine, etapeNum > n && styles.stepLineActive]} />
          )}
        </View>
      ))}
    </View>
  );

  // ── Rendu par étape ──────────────────────────────────────
  const renderContenu = () => {

    // ÉTAPE 1 — Choix du canal
    if (etape === 'choix') return (
      <View style={styles.card}>
        <Text style={styles.cardTitre}>Bienvenue sur VacciBénin</Text>
        <Text style={styles.cardDesc}>
          Comment souhaitez-vous recevoir votre code d'activation ?
        </Text>

        <TouchableOpacity
          style={[styles.choixBtn, canal === 'email' && styles.choixBtnActive]}
          onPress={() => { setCanal('email'); setEtape('saisie_contact'); }}
        >
          <View style={[styles.choixIcone, canal === 'email' && styles.choixIconeActive]}>
            <IconoEmail size={26} color={canal === 'email' ? '#fff' : VERT} />
          </View>
          <View style={styles.choixTextes}>
            <Text style={[styles.choixTitre, canal === 'email' && styles.choixTitreActive]}>
              Par Email
            </Text>
            <Text style={[styles.choixDesc, canal === 'email' && styles.choixDescActive]}>
              Recevez le code sur votre adresse email
            </Text>
          </View>
          {canal === 'email' && (
            <View style={styles.badge}><IconoCheck size={13} color="#fff" /></View>
          )}
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.choixBtn, canal === 'sms' && styles.choixBtnActive]}
          onPress={() => { setCanal('sms'); setEtape('saisie_contact'); }}
        >
          <View style={[styles.choixIcone, canal === 'sms' && styles.choixIconeActive]}>
            <IconoSms size={26} color={canal === 'sms' ? '#fff' : VERT} />
          </View>
          <View style={styles.choixTextes}>
            <Text style={[styles.choixTitre, canal === 'sms' && styles.choixTitreActive]}>
              Par SMS / Notification
            </Text>
            <Text style={[styles.choixDesc, canal === 'sms' && styles.choixDescActive]}>
              Recevez le code directement sur votre numéro
            </Text>
          </View>
          {canal === 'sms' && (
            <View style={styles.badge}><IconoCheck size={13} color="#fff" /></View>
          )}
        </TouchableOpacity>

        <TouchableOpacity onPress={() => navigation.navigate('Connexion')}>
          <Text style={styles.lien}>J'ai déjà un compte : Se connecter</Text>
        </TouchableOpacity>
      </View>
    );

    // ÉTAPE 2 — Saisie du contact
    if (etape === 'saisie_contact') return (
      <View style={styles.card}>
        <Text style={styles.cardTitre}>
          {canal === 'email' ? 'Votre adresse email' : 'Votre numéro de téléphone'}
        </Text>
        <Text style={styles.cardDesc}>
          {canal === 'email'
            ? "Entrez l'email enregistré par votre centre de santé."
            : 'Entrez le numéro enregistré par votre centre de santé.'}
        </Text>

        <View style={styles.inputWrap}>
          {canal === 'email'
            ? <IconoEmail size={20} color={VERT} />
            : <IconoTel   size={20} color={VERT} />
          }
          <TextInput
            style={styles.input}
            placeholder={canal === 'email' ? 'exemple@email.com' : 'Ex : 97000000'}
            placeholderTextColor="#aaa"
            keyboardType={canal === 'email' ? 'email-address' : 'phone-pad'}
            autoCapitalize="none"
            autoCorrect={false}
            value={contact}
            onChangeText={setContact}
            editable={!loading}
          />
        </View>

        <TouchableOpacity
          style={[styles.btn, loading && styles.btnDisabled]}
          onPress={verifierEtEnvoyerOtp}
          disabled={loading}
        >
          {loading
            ? <ActivityIndicator color="#fff" />
            : <Text style={styles.btnText}>Envoyer le code</Text>
          }
        </TouchableOpacity>

        <TouchableOpacity
          onPress={() => { setEtape('choix'); setContact(''); setCanal(null); }}
          disabled={loading}
        >
          <Text style={styles.lien}>Changer de méthode</Text>
        </TouchableOpacity>
      </View>
    );

    // ÉTAPE 3 — Saisie OTP
    if (etape === 'saisie_otp') return (
      <View style={styles.card}>
        <Text style={styles.cardTitre}>Bonjour {prenom?.trim() || ''} 👋</Text>
        <Text style={styles.cardDesc}>
          {canal === 'email'
            ? `Entrez le code à 4 chiffres reçu à ${contact.trim()}.`
            : 'Entrez le code à 4 chiffres affiché ci-dessous.'}
        </Text>

        {/* Code affiché directement pour SMS */}
        {canal === 'sms' && codeAffiche ? (
          <View style={styles.codeBadge}>
            <Text style={styles.codeBadgeLabel}>Votre code d'activation</Text>
            <Text style={styles.codeBadgeCode}>{codeAffiche}</Text>
          </View>
        ) : null}

        <View style={[styles.inputWrap, { justifyContent: 'center' }]}>
          <Text style={styles.otpHash}>#</Text>
          <TextInput
            style={[styles.input, styles.otpInput]}
            placeholder="_ _ _ _"
            placeholderTextColor="#bbb"
            keyboardType="number-pad"
            maxLength={4}
            value={otp}
            onChangeText={setOtp}
            autoFocus={true}
            editable={!loading}
          />
        </View>

        <TouchableOpacity
          style={[styles.btn, (otp.length !== 4 || loading) && styles.btnDisabled]}
          onPress={validerOtp}
          disabled={otp.length !== 4 || loading}
        >
          {loading
            ? <ActivityIndicator color="#fff" />
            : <Text style={styles.btnText}>Valider le code</Text>
          }
        </TouchableOpacity>

        <TouchableOpacity onPress={renvoyerOtp} disabled={loading}>
          <Text style={styles.lien}>
            {loading ? 'Envoi en cours...' : 'Renvoyer le code'}
          </Text>
        </TouchableOpacity>
      </View>
    );

    // ÉTAPE 4 — Mot de passe
    if (etape === 'mot_de_passe') return (
      <View style={styles.card}>
        <Text style={styles.cardTitre}>Choisissez un mot de passe</Text>
        <Text style={styles.cardDesc}>
          Minimum 8 caractères. Vous l'utiliserez à chaque connexion.
        </Text>

        <View style={styles.inputWrap}>
          <IconoCadenas />
          <TextInput
            style={styles.input}
            placeholder="Mot de passe"
            placeholderTextColor="#aaa"
            secureTextEntry={!voirPassword}
            value={password}
            onChangeText={setPassword}
            editable={!loading}
          />
          <TouchableOpacity onPress={() => setVoirPassword(!voirPassword)}>
            {voirPassword
              ? <IconoOeilOuvert size={20} color="#888" />
              : <IconoOeilFerme  size={20} color="#888" />
            }
          </TouchableOpacity>
        </View>

        <View style={styles.inputWrap}>
          <IconoCadenas />
          <TextInput
            style={styles.input}
            placeholder="Confirmer le mot de passe"
            placeholderTextColor="#aaa"
            secureTextEntry={!voirConfirm}
            value={confirm}
            onChangeText={setConfirm}
            editable={!loading}
          />
          <TouchableOpacity onPress={() => setVoirConfirm(!voirConfirm)}>
            {voirConfirm
              ? <IconoOeilOuvert size={20} color="#888" />
              : <IconoOeilFerme  size={20} color="#888" />
            }
          </TouchableOpacity>
        </View>

        <TouchableOpacity
          style={[styles.btn, loading && styles.btnDisabled]}
          onPress={activerCompte}
          disabled={loading}
        >
          {loading
            ? <ActivityIndicator color="#fff" />
            : <Text style={styles.btnText}>Activer mon compte ✓</Text>
          }
        </TouchableOpacity>
      </View>
    );

    // ÉTAPE SUCCÈS
    if (etape === 'succes') return (
      <View style={styles.card}>
        <View style={styles.successIcone}>
          <IconoCheckCercle size={72} />
        </View>

        <Text style={styles.successTitre}>Compte activé !</Text>
        <Text style={styles.successDesc}>
          Bienvenue {prenom?.trim() || ''} ! Votre compte VacciBénin est maintenant actif et prêt à l'emploi.
        </Text>

        <View style={styles.successRecap}>
          {[
            'Identité vérifiée',
            'Code OTP validé',
            'Mot de passe créé',
            'Compte activé avec succès',
          ].map((ligne, i, arr) => (
            <View key={i}>
              <View style={styles.successRecapLigne}>
                <View style={styles.successCheckIcon}>
                  <IconoCheck size={12} color="#fff" />
                </View>
                <Text style={styles.successRecapText}>{ligne}</Text>
              </View>
              {i < arr.length - 1 && <View style={styles.successDivider} />}
            </View>
          ))}
        </View>

        <Text style={styles.successHint}>
          Vous pouvez maintenant vous connecter pour accéder à votre tableau de bord et suivre le calendrier vaccinal de votre enfant.
        </Text>

        <TouchableOpacity
          style={styles.btn}
          onPress={() => navigation.replace('Connexion')}
        >
          <Text style={styles.btnText}>Se connecter</Text>
        </TouchableOpacity>
      </View>
    );
  };

  return (
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: VERT }}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
        <View style={styles.logoZone}>
          <View style={styles.logoCircle}>
            <IconoSeringue size={32} />
          </View>
          <Text style={styles.logoTitre}>VacciBenin</Text>
          <Text style={styles.logoSous}>SUIVI VACCINAL</Text>
        </View>

        <Text style={styles.pageTitre}>
          {etape === 'succes' ? 'Activation réussie' : 'Activation de compte'}
        </Text>
        <Stepper />
        {renderContenu()}
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

// ── Styles ───────────────────────────────────────────────────
const styles = StyleSheet.create({
  scroll:     { flexGrow: 1, paddingBottom: 48, alignItems: 'center' },
  logoZone:   { alignItems: 'center', paddingTop: 52, paddingBottom: 20 },
  logoCircle: {
    width: 68, height: 68, borderRadius: 16,
    backgroundColor: 'rgba(255,255,255,0.15)',
    justifyContent: 'center', alignItems: 'center', marginBottom: 10,
  },
  logoTitre:  { color: '#fff', fontSize: 26, fontWeight: '900', letterSpacing: 0.5 },
  logoSous:   { color: 'rgba(255,255,255,0.6)', fontSize: 11, letterSpacing: 3, marginTop: 2 },
  pageTitre:  { color: '#fff', fontSize: 16, fontWeight: '600', marginBottom: 16 },

  stepper:          { flexDirection: 'row', alignItems: 'center', marginBottom: 24 },
  stepItem:         { flexDirection: 'row', alignItems: 'center' },
  stepCircle:       {
    width: 30, height: 30, borderRadius: 15,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center', alignItems: 'center',
  },
  stepCircleActive: { backgroundColor: '#fff' },
  stepNum:          { color: 'rgba(255,255,255,0.6)', fontWeight: '700', fontSize: 13 },
  stepNumActive:    { color: VERT },
  stepLine:         { width: 32, height: 2, backgroundColor: 'rgba(255,255,255,0.2)', marginHorizontal: 3 },
  stepLineActive:   { backgroundColor: '#fff' },

  card: {
    backgroundColor: '#fff', borderRadius: 20,
    padding: 24, width: '90%',
    shadowColor: '#000', shadowOpacity: 0.1, shadowRadius: 16, elevation: 6,
  },
  cardTitre:  { fontSize: 18, fontWeight: '700', color: '#1a1a1a', marginBottom: 6 },
  cardDesc:   { fontSize: 13, color: '#666', marginBottom: 20, lineHeight: 19 },

  choixBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 14,
    borderWidth: 2, borderColor: '#e5e7eb', borderRadius: 14,
    padding: 16, marginBottom: 12, backgroundColor: '#fafafa',
  },
  choixBtnActive:   { borderColor: VERT, backgroundColor: VERT },
  choixIcone:       {
    width: 48, height: 48, borderRadius: 12,
    backgroundColor: VERT_CLAIR,
    justifyContent: 'center', alignItems: 'center',
  },
  choixIconeActive: { backgroundColor: 'rgba(255,255,255,0.2)' },
  choixTextes:      { flex: 1 },
  choixTitre:       { fontSize: 15, fontWeight: '700', color: '#1a1a1a' },
  choixTitreActive: { color: '#fff' },
  choixDesc:        { fontSize: 12, color: '#888', marginTop: 2 },
  choixDescActive:  { color: 'rgba(255,255,255,0.8)' },
  badge:            {
    width: 24, height: 24, borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.25)',
    justifyContent: 'center', alignItems: 'center',
  },

  codeBadge: {
    backgroundColor: VERT_CLAIR, borderRadius: 12,
    borderWidth: 2, borderColor: VERT,
    padding: 16, alignItems: 'center', marginBottom: 16,
  },
  codeBadgeLabel: {
    fontSize: 11, color: VERT, fontWeight: '600',
    marginBottom: 8, textTransform: 'uppercase', letterSpacing: 1,
  },
  codeBadgeCode: {
    fontSize: 38, fontWeight: '900', color: VERT, letterSpacing: 14,
  },

  inputWrap: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: VERT_CLAIR, borderRadius: 12,
    paddingHorizontal: 14, paddingVertical: 12,
    marginBottom: 14, gap: 10,
  },
  input:    { flex: 1, fontSize: 15, color: '#1a1a1a' },
  otpHash:  { fontSize: 20, fontWeight: '700', color: VERT },
  otpInput: { fontSize: 24, fontWeight: '700', letterSpacing: 10, textAlign: 'center' },

  btn:         {
    backgroundColor: VERT, borderRadius: 12,
    paddingVertical: 14, alignItems: 'center', marginTop: 4,
  },
  btnDisabled: { opacity: 0.5 },
  btnText:     { color: '#fff', fontWeight: '700', fontSize: 15 },

  lien: {
    textAlign: 'center', color: VERT,
    fontSize: 13, marginTop: 16, textDecorationLine: 'underline',
  },

  successIcone:      { alignItems: 'center', marginBottom: 18, marginTop: 4 },
  successTitre:      { fontSize: 22, fontWeight: '800', color: '#1a1a1a', textAlign: 'center', marginBottom: 10 },
  successDesc:       { fontSize: 13, color: '#555', textAlign: 'center', lineHeight: 20, marginBottom: 20 },
  successRecap:      { backgroundColor: VERT_CLAIR, borderRadius: 14, padding: 16, marginBottom: 16 },
  successRecapLigne: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 4 },
  successCheckIcon:  {
    width: 22, height: 22, borderRadius: 11,
    backgroundColor: VERT, justifyContent: 'center', alignItems: 'center',
  },
  successRecapText:  { fontSize: 13, color: '#1a1a1a', fontWeight: '500' },
  successDivider:    { height: 1, backgroundColor: '#d1ead9', marginVertical: 6, marginLeft: 34 },
  successHint:       { fontSize: 12, color: '#888', textAlign: 'center', lineHeight: 18, marginBottom: 20 },
});