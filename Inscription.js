// Inscription.js — Parents uniquement (Mère / Père) — 3 étapes
// Étape 1 : Informations personnelles
// Étape 2 : Vérification OTP + Mot de passe
// Étape 3 : Succès + Code foyer (si mère)

import React, { useState, useRef } from 'react';
import {
  View, Text, TextInput, TouchableOpacity,
  StyleSheet, SafeAreaView, KeyboardAvoidingView,
  Platform, ScrollView, ActivityIndicator, Modal, FlatList,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';

// ⚠️ Remplace par l'IP de ton PC (même IP que dans App.js et les dashboards)
const API_URL = 'http://10.125.148.244:8000/api';

// ─── Données géographiques du Bénin ─────────────────────────────
// Clé = département, Valeur = liste des communes
const BENIN = {
  'Alibori':    ['Banikoara', 'Gogounou', 'Kandi', 'Karimama', 'Malanville', 'Ségbana'],
  'Atacora':    ['Boukoumbé', 'Cobly', 'Kérou', 'Kouandé', 'Matéri', 'Natitingou', 'Pehunco', 'Tanguiéta', 'Toukountouna'],
  'Atlantique': ['Abomey-Calavi', 'Allada', 'Kpomassè', 'Misérété', 'Ouidah', 'Sô-Ava', 'Toffo', 'Tori-Bossito', 'Zè'],
  'Borgou':     ['Bembèrèkè', 'Kalale', 'NDali', 'Nikki', 'Parakou', 'Pèrèrè', 'Sinendé', 'Tchaourou'],
  'Collines':   ['Bantè', 'Dassa-Zoumè', 'Glazoué', 'Ouèssè', 'Savalou', 'Savè'],
  'Couffo':     ['Aplahoué', 'Djakotomey', 'Dogbo', 'Klouékanmè', 'Lalo', 'Toviklin'],
  'Donga':      ['Bassila', 'Copargo', 'Djougou', 'Ouaké'],
  'Littoral':   ['Cotonou'],
  'Mono':       ['Athiémé', 'Bopa', 'Comè', 'Grand-Popo', 'Houéyogbé', 'Lokossa'],
  'Ouémé':      ['Adjarra', 'Adjohoun', 'Aguégués', 'Akpro-Missérété', 'Avrankou', 'Bonou', 'Dangbo', 'Porto-Novo', 'Sèmè-Kpodji'],
  'Plateau':    ['Adja-Ouèrè', 'Ifangni', 'Kétou', 'Pobè', 'Sakété'],
  'Zou':        ['Abomey', 'Agbangnizoun', 'Bohicon', 'Covè', 'Djidja', 'Ouinhi', 'Zagnanado', 'Za-Kpota', 'Zogbodomè'],
};

// Liste triée des départements pour le sélecteur
const DEPARTEMENTS = Object.keys(BENIN).sort();

// ─────────────────────────────────────────────
// COMPOSANT SÉLECTEUR — Menu déroulant avec Modal
// Réutilisé pour Département et Commune
// ─────────────────────────────────────────────
function Selecteur({ label, valeur, options, onSelect, placeholder, disabled }) {
  // Contrôle l'ouverture/fermeture du modal
  const [ouvert, setOuvert] = useState(false);

  return (
    <View style={stylesSelect.container}>
      <Text style={stylesSelect.label}>{label}</Text>

      {/* Bouton qui ouvre le modal */}
      <TouchableOpacity
        style={[stylesSelect.bouton, disabled && stylesSelect.boutonDisabled]}
        onPress={() => !disabled && setOuvert(true)}
        activeOpacity={disabled ? 1 : 0.7}
      >
        <Text style={[stylesSelect.boutonTexte, !valeur && stylesSelect.placeholder]}>
          {valeur || placeholder}
        </Text>
        <Text style={stylesSelect.fleche}>▾</Text>
      </TouchableOpacity>

      {/* Modal de sélection — glisse depuis le bas */}
      <Modal visible={ouvert} transparent animationType="slide">
        {/* Zone transparente en dehors du modal pour fermer en cliquant dehors */}
        <TouchableOpacity style={stylesSelect.overlay} onPress={() => setOuvert(false)} activeOpacity={1}>
          <View style={stylesSelect.modal}>
            {/* En-tête du modal */}
            <View style={stylesSelect.modalHeader}>
              <Text style={stylesSelect.modalTitre}>{label}</Text>
              <TouchableOpacity onPress={() => setOuvert(false)}>
                <Text style={stylesSelect.fermer}>✕</Text>
              </TouchableOpacity>
            </View>

            {/* Liste des options */}
            <FlatList
              data={options}
              keyExtractor={(item) => item}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={[stylesSelect.option, valeur === item && stylesSelect.optionActif]}
                  onPress={() => { onSelect(item); setOuvert(false); }}
                >
                  <Text style={[stylesSelect.optionTexte, valeur === item && stylesSelect.optionTexteActif]}>
                    {item}
                  </Text>
                  {/* Coche verte sur l'option sélectionnée */}
                  {valeur === item && <Text style={stylesSelect.optionCheck}>✓</Text>}
                </TouchableOpacity>
              )}
            />
          </View>
        </TouchableOpacity>
      </Modal>
    </View>
  );
}

// Styles du composant Sélecteur
const stylesSelect = StyleSheet.create({
  container:        { marginBottom: 16 },
  label:            { fontSize: 14, fontWeight: '600', color: '#374151', marginBottom: 6 },
  bouton:           { flexDirection: 'row', alignItems: 'center', borderWidth: 1, borderColor: '#e5e7eb', borderRadius: 12, padding: 14, backgroundColor: '#f9fafb' },
  boutonDisabled:   { backgroundColor: '#f3f4f6', opacity: 0.6 },
  boutonTexte:      { flex: 1, fontSize: 16, color: '#1f2937' },
  placeholder:      { color: '#aaa' },
  fleche:           { fontSize: 16, color: '#6b7280' },
  overlay:          { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  modal:            { backgroundColor: 'white', borderTopLeftRadius: 20, borderTopRightRadius: 20, maxHeight: '60%' },
  modalHeader:      { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 20, borderBottomWidth: 1, borderBottomColor: '#f3f4f6' },
  modalTitre:       { fontSize: 16, fontWeight: 'bold', color: '#1a3c2e' },
  fermer:           { fontSize: 18, color: '#6b7280', padding: 4 },
  option:           { flexDirection: 'row', alignItems: 'center', padding: 16, borderBottomWidth: 1, borderBottomColor: '#f9fafb' },
  optionActif:      { backgroundColor: '#f0fdf4' },
  optionTexte:      { flex: 1, fontSize: 15, color: '#374151' },
  optionTexteActif: { color: '#1a6b3c', fontWeight: '600' },
  optionCheck:      { fontSize: 16, color: '#1a6b3c', fontWeight: 'bold' },
});

// ─────────────────────────────────────────────
// COMPOSANT PRINCIPAL — Écran d'inscription
// ─────────────────────────────────────────────
export default function Inscription({ navigation }) {

  // Étape actuelle : 1 (infos), 2 (sécurité), 3 (succès)
  const [etape, setEtape] = useState(1);

  // ── États Étape 1 — Informations personnelles ──
  const [typeParent, setTypeParent]   = useState('mere');   // 'mere' ou 'pere'
  const [prenom, setPrenom]           = useState('');
  const [nom, setNom]                 = useState('');
  const [telephone, setTelephone]     = useState('');
  const [email, setEmail]             = useState('');
  const [departement, setDepartement] = useState('');
  const [commune, setCommune]         = useState('');
  const [centre, setCentre]           = useState('');
  const [rejoindre, setRejoindre]     = useState(false);    // père rejoindre un foyer existant
  const [codeFoyer, setCodeFoyer]     = useState('');       // code foyer fourni par la mère

  // ── États Étape 2 — Sécurité ──
  const [otpEnvoye, setOtpEnvoye]       = useState(false);        // true après envoi SMS
  const [otp, setOtp]                   = useState(['', '', '', '']); // 4 cases OTP
  const [motDePasse, setMotDePasse]     = useState('');
  const [confirmation, setConfirmation] = useState('');
  const [voirMDP, setVoirMDP]           = useState(false);         // afficher/masquer MDP
  const [otpDev, setOtpDev]             = useState('');             // code OTP en mode dev

  // ── États UI ──
  const [loading, setLoading]           = useState(false);
  const [erreur, setErreur]             = useState('');
  const [donneesSucces, setDonneesSucces] = useState(null); // données retournées après succès

  // Références pour naviguer entre les cases OTP avec le clavier
  const otpRefs = [useRef(), useRef(), useRef(), useRef()];

  // ─── Calcul de la force du mot de passe ───
  // Retourne 'fort', 'moyen', 'faible' ou null si vide
  const forceMotDePasse = () => {
    if (motDePasse.length === 0) return null;
    const long  = motDePasse.length >= 8;       // au moins 8 caractères
    const maj   = /[A-Z]/.test(motDePasse);     // au moins une majuscule
    const chiff = /[0-9]/.test(motDePasse);     // au moins un chiffre
    if (long && maj && chiff) return 'fort';
    if (long) return 'moyen';
    return 'faible';
  };

  // ─── Validation Étape 1 ───
  // Vérifie tous les champs avant de passer à l'étape 2
  const validerEtape1 = () => {
    setErreur('');

    if (!prenom.trim() || !nom.trim()) {
      setErreur('Prénom et nom sont obligatoires.'); return;
    }
    if (!telephone.trim()) {
      setErreur('Le numéro de téléphone est obligatoire.'); return;
    }
    // Validation format téléphone béninois
    const telNettoye = telephone.replace(/[\s\-]/g, '');
    if (!/^(\+229|00229)?[0-9]{8}$/.test(telNettoye)) {
      setErreur('Numéro invalide. Format attendu : 97000000 ou +22997000000'); return;
    }
    // Email optionnel mais validé si fourni
    if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setErreur('Adresse email invalide.'); return;
    }
    if (!departement) {
      setErreur('Veuillez sélectionner votre département.'); return;
    }
    if (!commune) {
      setErreur('Veuillez sélectionner votre commune.'); return;
    }
    if (!centre.trim()) {
      setErreur('Veuillez indiquer le centre de santé de votre enfant.'); return;
    }
    // Si père avec code foyer → le code est obligatoire
    if (typeParent === 'pere' && rejoindre && !codeFoyer.trim()) {
      setErreur('Veuillez entrer le code foyer fourni par la mère.'); return;
    }

    setEtape(2); // Passer à l'étape suivante
  };

  // ─── Envoyer le code OTP par SMS ───
  // Appel API → POST /api/otp/envoyer
  const envoyerOtp = async () => {
    setLoading(true);
    setErreur('');
    try {
      const reponse = await fetch(`${API_URL}/otp/envoyer`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
        body: JSON.stringify({ telephone }),
      });
      const data = await reponse.json();

      if (data.success) {
        setOtpEnvoye(true);
        // En mode développement, Laravel retourne le code directement
        // À retirer en production (Africa's Talking enverra le vrai SMS)
        if (data.otp_dev) setOtpDev(data.otp_dev);
      } else {
        setErreur(data.message || "Erreur lors de l'envoi du code.");
      }
    } catch {
      setErreur('Impossible de contacter le serveur.');
    } finally {
      setLoading(false);
    }
  };

  // ─── Saisie OTP — navigation automatique entre les cases ───
  // Quand on tape un chiffre → passe à la case suivante
  // Quand on efface → revient à la case précédente
  const handleOtp = (valeur, index) => {
    const chiffre = valeur.replace(/[^0-9]/g, ''); // N'accepte que les chiffres
    const nouvelOtp = [...otp];
    nouvelOtp[index] = chiffre;
    setOtp(nouvelOtp);
    // Navigation automatique
    if (chiffre && index < 3) otpRefs[index + 1].current?.focus();
    if (!chiffre && index > 0) otpRefs[index - 1].current?.focus();
  };

  // ─── Inscription finale ───
  // Appel API → POST /api/register/mere ou /api/register/pere
  const handleInscription = async () => {
    setErreur('');
    const otpComplet = otp.join(''); // Concatène les 4 chiffres : ['1','2','3','4'] → '1234'

    // Validations avant envoi
    if (!otpEnvoye) {
      setErreur("Veuillez d'abord recevoir et entrer votre code OTP."); return;
    }
    if (otpComplet.length < 4) {
      setErreur('Veuillez entrer le code OTP à 4 chiffres.'); return;
    }
    if (motDePasse.length < 8) {
      setErreur('Le mot de passe doit faire minimum 8 caractères.'); return;
    }
    if (!/[A-Z]/.test(motDePasse) || !/[0-9]/.test(motDePasse)) {
      setErreur('Le mot de passe doit contenir au moins une majuscule et un chiffre.'); return;
    }
    if (motDePasse !== confirmation) {
      setErreur('Les mots de passe ne correspondent pas.'); return;
    }

    setLoading(true);
    try {
      // Endpoint différent selon mère ou père
      const endpoint = typeParent === 'mere'
        ? `${API_URL}/register/mere`
        : `${API_URL}/register/pere`;

      // Corps de la requête
      const corps = {
        nom, prenom, telephone,
        email:       email || null,  // null si non fourni
        password:    motDePasse,
        departement, commune,
        centre,
        otp:         otpComplet,
        // code_foyer ajouté seulement si père avec option "rejoindre"
        ...(typeParent === 'pere' && rejoindre && { code_foyer: codeFoyer.trim() }),
      };

      const reponse = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
        body: JSON.stringify(corps),
      });

      const data = await reponse.json();
      console.log('Réponse register:', data);

      if (!reponse.ok) {
        // Erreurs de validation Laravel (422)
        if (data.errors) {
          setErreur(Object.values(data.errors)[0][0]);
        } else {
          setErreur(data.message || 'Erreur lors de la création du compte.');
        }
        return;
      }

      // ✅ Succès → passer à l'étape 3 avec les données retournées
      setDonneesSucces(data);
      setEtape(3);

    } catch {
      setErreur('Impossible de contacter le serveur. Vérifiez que Laravel tourne.');
    } finally {
      setLoading(false);
    }
  };

  const force = forceMotDePasse();

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style="light" />
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
        <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">

          {/* EN-TÊTE VERT */}
          <View style={styles.header}>
            {/* Bouton retour — retour étape précédente ou vers connexion */}
            <TouchableOpacity
              style={styles.boutonRetour}
              onPress={() => {
                setErreur('');
                if (etape === 2) setEtape(1);
                else navigation.navigate('Connexion');
              }}
            >
              <Text style={styles.retourTexte}>← Retour</Text>
            </TouchableOpacity>

            <Text style={styles.titre}>Créer un compte</Text>

            {/* Indicateur de progression — visible seulement aux étapes 1 et 2 */}
            {etape < 3 && (
              <View style={styles.progressContainer}>
                {[1, 2].map((n) => (
                  <React.Fragment key={n}>
                    {/* Cercle de l'étape — vert si étape atteinte */}
                    <View style={[styles.progressEtape, etape >= n && styles.progressActif]}>
                      <Text style={[styles.progressNumero, etape >= n && styles.progressNumeroActif]}>
                        {n}
                      </Text>
                    </View>
                    {/* Ligne entre les cercles */}
                    {n < 2 && <View style={[styles.progressLigne, etape > n && styles.progressLigneActif]} />}
                  </React.Fragment>
                ))}
              </View>
            )}
          </View>

          {/* FORMULAIRE BLANC */}
          <View style={styles.formulaire}>

            {/* Message d'erreur — visible seulement si erreur !== '' */}
            {erreur !== '' && (
              <View style={styles.erreurBox}>
                <Text style={styles.erreurTexte}>⚠️ {erreur}</Text>
              </View>
            )}

            {/* ══════════════════════════════
                ÉTAPE 1 — Informations personnelles
            ══════════════════════════════ */}
            {etape === 1 && (
              <View>
                <Text style={styles.titreEtape}>Vos informations</Text>

                {/* Choix Mère / Père */}
                <View style={styles.champGroupe}>
                  <Text style={styles.label}>Vous êtes *</Text>
                  <View style={styles.toggleParent}>
                    <TouchableOpacity
                      style={[styles.toggleOption, typeParent === 'mere' && styles.toggleActif]}
                      onPress={() => { setTypeParent('mere'); setRejoindre(false); setCodeFoyer(''); }}
                    >
                      <Text style={[styles.toggleTexte, typeParent === 'mere' && styles.toggleTexteActif]}>
                        👩 Mère
                      </Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={[styles.toggleOption, typeParent === 'pere' && styles.toggleActif]}
                      onPress={() => setTypeParent('pere')}
                    >
                      <Text style={[styles.toggleTexte, typeParent === 'pere' && styles.toggleTexteActif]}>
                        👨 Père
                      </Text>
                    </TouchableOpacity>
                  </View>
                </View>

                {/* Section code foyer — visible seulement si type = père */}
                {typeParent === 'pere' && (
                  <View style={styles.foyerSection}>
                    {/* Checkbox pour activer la saisie du code foyer */}
                    <TouchableOpacity
                      style={styles.checkboxLigne}
                      onPress={() => { setRejoindre(!rejoindre); setCodeFoyer(''); }}
                    >
                      <View style={[styles.checkbox, rejoindre && styles.checkboxActif]}>
                        {rejoindre && <Text style={styles.checkboxCheck}>✓</Text>}
                      </View>
                      <Text style={styles.checkboxLabel}>
                        J'ai un code foyer (la mère me l'a partagé)
                      </Text>
                    </TouchableOpacity>

                    {/* Champ code foyer — visible seulement si checkbox cochée */}
                    {rejoindre && (
                      <View style={{ marginTop: 10 }}>
                        <Text style={styles.label}>Code foyer *</Text>
                        <TextInput
                          style={[styles.input, styles.inputCode]}
                          placeholder="Ex: BEN-A3F7"
                          placeholderTextColor="#aaa"
                          value={codeFoyer}
                          onChangeText={(t) => setCodeFoyer(t.toUpperCase())}
                          autoCapitalize="characters"
                          maxLength={8}
                        />
                      </View>
                    )}
                  </View>
                )}

                {/* Prénom et Nom côte à côte */}
                <View style={styles.rangee}>
                  <View style={[styles.champGroupe, { flex: 1, marginRight: 8 }]}>
                    <Text style={styles.label}>Prénom *</Text>
                    <TextInput style={styles.input} placeholder="Adjoua" placeholderTextColor="#aaa" value={prenom} onChangeText={setPrenom} autoCapitalize="words" />
                  </View>
                  <View style={[styles.champGroupe, { flex: 1, marginLeft: 8 }]}>
                    <Text style={styles.label}>Nom *</Text>
                    <TextInput style={styles.input} placeholder="Koffi" placeholderTextColor="#aaa" value={nom} onChangeText={setNom} autoCapitalize="words" />
                  </View>
                </View>

                {/* Téléphone — obligatoire, sert pour les rappels SMS */}
                <View style={styles.champGroupe}>
                  <Text style={styles.label}>Téléphone *</Text>
                  <TextInput
                    style={styles.input}
                    placeholder="+229 97 00 00 00"
                    placeholderTextColor="#aaa"
                    value={telephone}
                    onChangeText={setTelephone}
                    keyboardType="phone-pad"
                  />
                  <Text style={styles.infoTexte}>📱 Vous recevrez vos rappels de vaccination sur ce numéro.</Text>
                </View>

                {/* Email — optionnel */}
                <View style={styles.champGroupe}>
                  <Text style={styles.label}>Email <Text style={styles.optionnel}>(optionnel)</Text></Text>
                  <TextInput
                    style={styles.input}
                    placeholder="votre@email.com"
                    placeholderTextColor="#aaa"
                    value={email}
                    onChangeText={setEmail}
                    keyboardType="email-address"
                    autoCapitalize="none"
                  />
                </View>

                {/* Département — sélecteur avec modal */}
                <Selecteur
                  label="Département *"
                  valeur={departement}
                  options={DEPARTEMENTS}
                  placeholder="Sélectionnez votre département"
                  onSelect={(val) => { setDepartement(val); setCommune(''); }} // Reset commune si département change
                />

                {/* Commune — filtré selon département sélectionné */}
                <Selecteur
                  label="Commune *"
                  valeur={commune}
                  options={departement ? BENIN[departement] : []}
                  placeholder={departement ? 'Sélectionnez votre commune' : "Choisissez d'abord un département"}
                  onSelect={setCommune}
                  disabled={!departement} // Désactivé tant que département non choisi
                />

                {/* Centre de santé — champ libre */}
                <View style={styles.champGroupe}>
                  <Text style={styles.label}>Centre de santé de l'enfant *</Text>
                  <TextInput
                    style={styles.input}
                    placeholder="Ex: CSA Akpakpa, Centre de santé de Zogbo..."
                    placeholderTextColor="#aaa"
                    value={centre}
                    onChangeText={setCentre}
                  />
                  <Text style={styles.infoTexte}>
                    🏥 Indiquez le centre où votre enfant reçoit ses vaccins.
                  </Text>
                </View>

                {/* Bouton Suivant */}
                <TouchableOpacity style={styles.boutonPrincipal} onPress={validerEtape1}>
                  <Text style={styles.boutonTexte}>Suivant →</Text>
                </TouchableOpacity>
              </View>
            )}

            {/* ══════════════════════════════
                ÉTAPE 2 — Sécurité (OTP + MDP)
            ══════════════════════════════ */}
            {etape === 2 && (
              <View>
                <Text style={styles.titreEtape}>Sécurité</Text>

                {/* Section OTP */}
                <View style={styles.otpSection}>
                  <Text style={styles.label}>Vérification par SMS</Text>
                  <Text style={styles.infoTexte}>
                    Un code à 4 chiffres sera envoyé au {telephone}
                  </Text>

                  {/* Bouton envoyer OTP — visible avant envoi */}
                  {!otpEnvoye ? (
                    <TouchableOpacity
                      style={[styles.boutonOtp, loading && styles.boutonDisabled]}
                      onPress={envoyerOtp}
                      disabled={loading}
                    >
                      {loading
                        ? <ActivityIndicator color="white" size="small" />
                        : <Text style={styles.boutonTexte}>📱 Envoyer le code SMS</Text>
                      }
                    </TouchableOpacity>
                  ) : (
                    <View>
                      {/* Boîte dev — affiche le code OTP en mode développement */}
                      {/* ⚠️ À RETIRER en production */}
                      {otpDev !== '' && (
                        <View style={styles.otpDevBox}>
                          <Text style={styles.otpDevTexte}>
                            🛠️ Mode dev — Code : {otpDev}
                          </Text>
                        </View>
                      )}

                      {/* 4 cases OTP séparées */}
                      <View style={styles.otpCases}>
                        {otp.map((chiffre, i) => (
                          <TextInput
                            key={i}
                            ref={otpRefs[i]}           // Référence pour navigation clavier
                            style={[styles.otpCase, chiffre && styles.otpCaseRemplie]}
                            value={chiffre}
                            onChangeText={(v) => handleOtp(v, i)}
                            keyboardType="number-pad"
                            maxLength={1}              // Un seul chiffre par case
                            textAlign="center"
                          />
                        ))}
                      </View>

                      {/* Lien pour renvoyer le code */}
                      <TouchableOpacity onPress={() => { setOtpEnvoye(false); setOtp(['', '', '', '']); setOtpDev(''); }}>
                        <Text style={styles.renvoyer}>Renvoyer le code</Text>
                      </TouchableOpacity>
                    </View>
                  )}
                </View>

                {/* Mot de passe avec indicateur de force */}
                <View style={styles.champGroupe}>
                  <Text style={styles.label}>Mot de passe *</Text>
                  <View style={styles.inputAvecIcone}>
                    <TextInput
                      style={styles.inputMDP}
                      placeholder="Min. 8 car., 1 majuscule, 1 chiffre"
                      placeholderTextColor="#aaa"
                      value={motDePasse}
                      onChangeText={setMotDePasse}
                      secureTextEntry={!voirMDP}
                      editable={!loading}
                    />
                    {/* Bouton œil pour afficher/masquer */}
                    <TouchableOpacity onPress={() => setVoirMDP(!voirMDP)} style={styles.iconOeil}>
                      <Text>{voirMDP ? '🙈' : '👁️'}</Text>
                    </TouchableOpacity>
                  </View>

                  {/* Indicateur de force du mot de passe */}
                  {force && (
                    <View style={styles.forceMdp}>
                      {/* Barre colorée selon la force */}
                      <View style={[
                        styles.forceBarre,
                        force === 'fort'  ? styles.forceFort  :
                        force === 'moyen' ? styles.forceMoyen :
                        styles.forceFaible
                      ]} />
                      <Text style={styles.forceTexte}>
                        {force === 'fort'  ? '✅ Mot de passe fort' :
                         force === 'moyen' ? '⚠️ Moyen — ajoutez majuscule et chiffre' :
                         '❌ Trop court (minimum 8 caractères)'}
                      </Text>
                    </View>
                  )}
                </View>

                {/* Confirmation du mot de passe */}
                <View style={styles.champGroupe}>
                  <Text style={styles.label}>Confirmer le mot de passe *</Text>
                  <TextInput
                    style={[
                      styles.input,
                      // Bordure rouge si ne correspond pas, verte si correspond
                      confirmation.length > 0 && motDePasse !== confirmation && styles.inputErreur,
                      confirmation.length > 0 && motDePasse === confirmation && styles.inputSucces,
                    ]}
                    placeholder="Retapez votre mot de passe"
                    placeholderTextColor="#aaa"
                    value={confirmation}
                    onChangeText={setConfirmation}
                    secureTextEntry={!voirMDP}
                    editable={!loading}
                  />
                  {/* Message de confirmation si les MDP correspondent */}
                  {confirmation.length > 0 && motDePasse === confirmation && (
                    <Text style={styles.mdpOkTexte}>✅ Les mots de passe correspondent</Text>
                  )}
                </View>

                {/* Bouton créer le compte */}
                <TouchableOpacity
                  style={[styles.boutonPrincipal, loading && styles.boutonDisabled]}
                  onPress={handleInscription}
                  disabled={loading}
                >
                  {loading
                    ? <ActivityIndicator color="white" size="small" />
                    : <Text style={styles.boutonTexte}>Créer mon compte ✓</Text>
                  }
                </TouchableOpacity>
              </View>
            )}

            {/* ══════════════════════════════
                ÉTAPE 3 — Succès
            ══════════════════════════════ */}
            {etape === 3 && donneesSucces && (
              <View style={styles.succesContainer}>
                <Text style={styles.succesEmoji}>🎉</Text>
                <Text style={styles.succesTitle}>Bienvenue {prenom} !</Text>
                <Text style={styles.succesMessage}>
                  Votre compte {typeParent === 'mere' ? 'mère' : 'père'} a été créé avec succès.
                </Text>

                {/* Code foyer — affiché uniquement pour la mère */}
                {/* Elle devra partager ce code à son mari pour qu'il rejoigne le foyer */}
                {typeParent === 'mere' && donneesSucces?.user?.code_foyer && (
                  <View style={styles.codeFoyerBox}>
                    <Text style={styles.codeFoyerLabel}>🏠 Votre code foyer</Text>
                    <Text style={styles.codeFoyerCode}>{donneesSucces.user.code_foyer}</Text>
                    <Text style={styles.codeFoyerInfo}>
                      Partagez ce code au père pour qu'il rejoigne le dossier familial.
                    </Text>
                  </View>
                )}

                {/* Confirmation foyer rejoint — affiché pour le père */}
                {typeParent === 'pere' && donneesSucces?.foyer_trouve && (
                  <View style={styles.foyerTrouveBox}>
                    <Text style={styles.foyerTrouveTexte}>
                      ✅ Vous avez rejoint le foyer de{' '}
                      {donneesSucces.foyer_trouve.mere_prenom} {donneesSucces.foyer_trouve.mere_nom}.
                    </Text>
                  </View>
                )}

                {/* Bouton vers l'écran de connexion */}
                <TouchableOpacity
                  style={styles.boutonPrincipal}
                  onPress={() => navigation.navigate('Connexion')}
                >
                  <Text style={styles.boutonTexte}>Se connecter →</Text>
                </TouchableOpacity>
              </View>
            )}

            {/* Lien connexion — visible aux étapes 1 et 2 seulement */}
            {etape < 3 && (
              <TouchableOpacity style={styles.lienConnexion} onPress={() => navigation.navigate('Connexion')}>
                <Text style={styles.lienTexte}>
                  Déjà un compte ? <Text style={styles.lienVert}>Se connecter</Text>
                </Text>
              </TouchableOpacity>
            )}

          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

// ─────────────────────────────────────────────
// STYLES
// ─────────────────────────────────────────────
const styles = StyleSheet.create({
  container:           { flex: 1, backgroundColor: '#1a6b3c' },
  scrollContent:       { flexGrow: 1 },
  header:              { paddingTop: 20, paddingHorizontal: 24, paddingBottom: 30 },
  boutonRetour:        { marginBottom: 16 },
  retourTexte:         { color: 'rgba(255,255,255,0.9)', fontSize: 16 },
  titre:               { fontSize: 28, fontWeight: 'bold', color: 'white', marginBottom: 20 },
  progressContainer:   { flexDirection: 'row', alignItems: 'center' },
  progressEtape:       { width: 36, height: 36, borderRadius: 18, backgroundColor: 'rgba(255,255,255,0.3)', alignItems: 'center', justifyContent: 'center' },
  progressActif:       { backgroundColor: 'white' },
  progressNumero:      { color: 'rgba(255,255,255,0.7)', fontWeight: 'bold', fontSize: 16 },
  progressNumeroActif: { color: '#1a6b3c' },
  progressLigne:       { flex: 1, height: 2, backgroundColor: 'rgba(255,255,255,0.3)', marginHorizontal: 8 },
  progressLigneActif:  { backgroundColor: 'white' },
  formulaire:          { flex: 1, backgroundColor: 'white', borderTopLeftRadius: 30, borderTopRightRadius: 30, paddingHorizontal: 24, paddingTop: 32, paddingBottom: 40 },
  titreEtape:          { fontSize: 20, fontWeight: 'bold', color: '#1a3c2e', marginBottom: 24 },
  erreurBox:           { backgroundColor: '#fef2f2', borderRadius: 10, padding: 12, marginBottom: 16, borderLeftWidth: 3, borderLeftColor: '#dc2626' },
  erreurTexte:         { fontSize: 13, color: '#dc2626', lineHeight: 20 },
  champGroupe:         { marginBottom: 16 },
  label:               { fontSize: 14, fontWeight: '600', color: '#374151', marginBottom: 6 },
  optionnel:           { fontWeight: '400', color: '#9ca3af', fontSize: 13 },
  rangee:              { flexDirection: 'row' },
  input:               { borderWidth: 1, borderColor: '#e5e7eb', borderRadius: 12, padding: 14, fontSize: 16, color: '#1f2937', backgroundColor: '#f9fafb' },
  inputErreur:         { borderColor: '#dc2626', backgroundColor: '#fef2f2' },
  inputSucces:         { borderColor: '#16a34a', backgroundColor: '#f0fdf4' },
  inputCode:           { letterSpacing: 6, fontSize: 20, fontWeight: 'bold', textAlign: 'center', color: '#1a6b3c' },
  inputAvecIcone:      { flexDirection: 'row', borderWidth: 1, borderColor: '#e5e7eb', borderRadius: 12, backgroundColor: '#f9fafb', alignItems: 'center' },
  inputMDP:            { flex: 1, padding: 14, fontSize: 16, color: '#1f2937' },
  iconOeil:            { padding: 14 },
  infoTexte:           { fontSize: 12, color: '#6b7280', marginTop: 4, lineHeight: 18 },
  toggleParent:        { flexDirection: 'row', borderRadius: 12, overflow: 'hidden', borderWidth: 1, borderColor: '#e5e7eb' },
  toggleOption:        { flex: 1, paddingVertical: 12, alignItems: 'center', backgroundColor: '#f9fafb' },
  toggleActif:         { backgroundColor: '#1a6b3c' },
  toggleTexte:         { fontSize: 15, fontWeight: '600', color: '#6b7280' },
  toggleTexteActif:    { color: 'white' },
  foyerSection:        { backgroundColor: '#f0fdf4', borderRadius: 12, padding: 14, marginBottom: 16 },
  checkboxLigne:       { flexDirection: 'row', alignItems: 'center' },
  checkbox:            { width: 22, height: 22, borderRadius: 6, borderWidth: 2, borderColor: '#d1d5db', marginRight: 10, alignItems: 'center', justifyContent: 'center' },
  checkboxActif:       { backgroundColor: '#1a6b3c', borderColor: '#1a6b3c' },
  checkboxCheck:       { color: 'white', fontSize: 13, fontWeight: 'bold' },
  checkboxLabel:       { fontSize: 13, color: '#374151', flex: 1, lineHeight: 18 },
  otpSection:          { marginBottom: 20, backgroundColor: '#f9fafb', borderRadius: 12, padding: 16 },
  boutonOtp:           { backgroundColor: '#065f46', borderRadius: 10, padding: 14, alignItems: 'center', marginTop: 12 },
  otpDevBox:           { backgroundColor: '#fef9c3', borderRadius: 8, padding: 10, marginVertical: 10 },
  otpDevTexte:         { fontSize: 13, color: '#92400e', fontWeight: 'bold', textAlign: 'center' },
  otpCases:            { flexDirection: 'row', justifyContent: 'center', gap: 12, marginVertical: 16 },
  otpCase:             { width: 56, height: 64, borderWidth: 2, borderColor: '#d1d5db', borderRadius: 12, fontSize: 24, fontWeight: 'bold', color: '#1a6b3c', backgroundColor: 'white' },
  otpCaseRemplie:      { borderColor: '#1a6b3c', backgroundColor: '#f0fdf4' },
  renvoyer:            { textAlign: 'center', color: '#1a6b3c', fontSize: 13, fontWeight: '600', marginBottom: 4 },
  forceMdp:            { marginTop: 8 },
  forceBarre:          { height: 4, borderRadius: 2, marginBottom: 4 },
  forceFaible:         { backgroundColor: '#dc2626', width: '30%' },
  forceMoyen:          { backgroundColor: '#f59e0b', width: '65%' },
  forceFort:           { backgroundColor: '#16a34a', width: '100%' },
  forceTexte:          { fontSize: 12, color: '#6b7280' },
  mdpOkTexte:          { fontSize: 12, color: '#16a34a', marginTop: 4 },
  boutonPrincipal:     { backgroundColor: '#1a6b3c', borderRadius: 12, padding: 16, alignItems: 'center', marginTop: 8, elevation: 4 },
  boutonDisabled:      { backgroundColor: '#9ca3af', elevation: 0 },
  boutonTexte:         { color: 'white', fontSize: 16, fontWeight: 'bold' },
  lienConnexion:       { alignItems: 'center', marginTop: 20 },
  lienTexte:           { fontSize: 14, color: '#6b7280' },
  lienVert:            { color: '#1a6b3c', fontWeight: 'bold' },
  succesContainer:     { alignItems: 'center', paddingVertical: 20 },
  succesEmoji:         { fontSize: 64, marginBottom: 16 },
  succesTitle:         { fontSize: 24, fontWeight: 'bold', color: '#1a3c2e', marginBottom: 8, textAlign: 'center' },
  succesMessage:       { fontSize: 15, color: '#6b7280', marginBottom: 24, textAlign: 'center' },
  codeFoyerBox:        { backgroundColor: '#f0fdf4', borderRadius: 14, padding: 20, marginBottom: 24, alignItems: 'center', borderWidth: 2, borderColor: '#1a6b3c', width: '100%' },
  codeFoyerLabel:      { fontSize: 13, color: '#6b7280', marginBottom: 8 },
  codeFoyerCode:       { fontSize: 32, fontWeight: 'bold', color: '#1a6b3c', letterSpacing: 4, marginBottom: 8 },
  codeFoyerInfo:       { fontSize: 12, color: '#6b7280', textAlign: 'center', lineHeight: 18 },
  foyerTrouveBox:      { backgroundColor: '#f0fdf4', borderRadius: 12, padding: 16, marginBottom: 24, borderLeftWidth: 3, borderLeftColor: '#16a34a', width: '100%' },
  foyerTrouveTexte:    { fontSize: 14, color: '#166534', lineHeight: 20 },
});