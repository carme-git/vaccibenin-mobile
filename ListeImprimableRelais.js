import React, { useState, useEffect } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, StyleSheet,
  ActivityIndicator, Alert, SafeAreaView, StatusBar, Share, Platform,
} from 'react-native';

const API_BASE = 'http://192.168.1.100/VacciBenin/public/api';

const formatDate = (d) => {
  if (!d) return '—';
  return new Date(d).toLocaleDateString('fr-FR', {
    day: '2-digit', month: '2-digit', year: 'numeric',
  });
};

const formatAge = (mois) => {
  if (mois === null || mois === undefined) return '—';
  if (mois < 1) return '< 1 m';
  if (mois < 24) return `${mois} m`;
  return `${Math.floor(mois / 12)} an${Math.floor(mois / 12) > 1 ? 's' : ''}`;
};

const joursRestants = (dateRdv) => {
  if (!dateRdv) return null;
  return Math.ceil((new Date(dateRdv) - new Date()) / (1000 * 60 * 60 * 24));
};

const dateAujourdhui = () => {
  return new Date().toLocaleDateString('fr-FR', {
    weekday: 'long', day: 'numeric', month: 'long', year: 'numeric',
  });
};

// ── Génération HTML pour impression ──────────────────────────────────────────
const genererHTML = (rdvAVenir, enfantsRetard, centreNom) => {
  const lignesRdv = rdvAVenir.map((e, i) => {
    const jours = joursRestants(e.prochain_vaccin?.date_prevue);
    const urgence = jours !== null && jours <= 7 ? ' style="background:#FFF3E0"' : '';
    return `
      <tr${urgence}>
        <td>${i + 1}</td>
        <td><strong>${e.prenom ?? ''} ${e.nom ?? ''}</strong></td>
        <td>${e.code ?? e.code_unique ?? '—'}</td>
        <td>${formatAge(e.age_mois)}</td>
        <td>${e.prochain_vaccin?.vaccin ?? '—'}</td>
        <td>${formatDate(e.prochain_vaccin?.date_prevue)}</td>
        <td>${e.mere_tuteur?.nom ?? '—'}</td>
        <td>${e.mere_tuteur?.telephone ?? '—'}</td>
        <td>${e.mere_tuteur?.adresse ?? '—'}</td>
        <td>☐</td>
      </tr>
    `;
  }).join('');

  const lignesRetard = enfantsRetard.map((e, i) => `
    <tr style="background:#FFF1F0">
      <td>${i + 1}</td>
      <td><strong>${e.prenom ?? ''} ${e.nom ?? ''}</strong></td>
      <td>${e.code ?? e.code_unique ?? '—'}</td>
      <td>${formatAge(e.age_mois)}</td>
      <td>${e.prochain_vaccin?.vaccin ?? '—'}</td>
      <td style="color:#B71C1C;font-weight:bold">${formatDate(e.prochain_vaccin?.date_prevue)}</td>
      <td>${e.mere_tuteur?.nom ?? '—'}</td>
      <td>${e.mere_tuteur?.telephone ?? '—'}</td>
      <td>${e.mere_tuteur?.adresse ?? '—'}</td>
      <td>☐</td>
    </tr>
  `).join('');

  return `
<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Liste de vaccination - ${centreNom ?? 'Centre'}</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: Arial, sans-serif; font-size: 11px; color: #1a1a1a; padding: 20px; }
    
    /* En-tête */
    .header { border-bottom: 3px solid #065f46; padding-bottom: 12px; margin-bottom: 20px; }
    .header-top { display: flex; justify-content: space-between; align-items: flex-start; }
    .logo-zone h1 { font-size: 20px; color: #065f46; font-weight: 800; }
    .logo-zone p { font-size: 12px; color: #6B7280; margin-top: 2px; }
    .meta-zone { text-align: right; }
    .meta-zone .date { font-size: 12px; color: #6B7280; }
    .meta-zone .centre { font-size: 14px; font-weight: 700; color: #065f46; margin-top: 4px; }
    
    /* Section titre */
    .section-title {
      background: #065f46;
      color: #fff;
      padding: 8px 14px;
      font-size: 13px;
      font-weight: 700;
      margin: 20px 0 8px;
      border-radius: 4px;
    }
    .section-title.danger { background: #B71C1C; }
    
    /* Tableau */
    table { width: 100%; border-collapse: collapse; margin-bottom: 24px; }
    th {
      background: #F0FDF4;
      border: 1px solid #D1FAE5;
      padding: 6px 8px;
      text-align: left;
      font-size: 10px;
      color: #065f46;
      font-weight: 700;
    }
    td {
      border: 1px solid #E5E7EB;
      padding: 6px 8px;
      vertical-align: top;
    }
    tr:nth-child(even) { background: #FAFAFA; }
    
    /* Stats */
    .stats { display: flex; gap: 16px; margin-bottom: 20px; flex-wrap: wrap; }
    .stat-box {
      border: 1px solid #D1FAE5;
      border-radius: 8px;
      padding: 10px 16px;
      min-width: 120px;
      text-align: center;
    }
    .stat-num { font-size: 28px; font-weight: 800; color: #065f46; }
    .stat-num.danger { color: #B71C1C; }
    .stat-lbl { font-size: 10px; color: #6B7280; margin-top: 2px; }
    
    /* Pied de page */
    .footer {
      margin-top: 30px;
      border-top: 1px solid #E5E7EB;
      padding-top: 16px;
      display: flex;
      justify-content: space-between;
      font-size: 10px;
      color: #9CA3AF;
    }
    .signature-box {
      border: 1px solid #E5E7EB;
      border-radius: 4px;
      padding: 10px 20px;
      text-align: center;
      min-width: 200px;
    }
    .signature-line { border-top: 1px solid #333; margin-top: 40px; }
    
    /* Légende */
    .legend { font-size: 10px; color: #6B7280; margin-bottom: 16px; }
    .legend span { display: inline-block; width: 12px; height: 12px; border-radius: 2px; vertical-align: middle; margin-right: 4px; }
    
    @media print {
      body { padding: 10px; }
      .no-print { display: none; }
      .section-title { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
      th { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
    }
  </style>
</head>
<body>
  <div class="header">
    <div class="header-top">
      <div class="logo-zone">
        <h1>🏥 VacciBenin</h1>
        <p>Système national de vaccination — Bénin</p>
      </div>
      <div class="meta-zone">
        <div class="date">Généré le ${dateAujourdhui()}</div>
        <div class="centre">📍 ${centreNom ?? 'Centre de santé'}</div>
      </div>
    </div>
  </div>

  <p style="font-size:13px; font-weight:700; margin-bottom:12px;">
    Liste de vaccination — Relais communautaire
  </p>

  <div class="stats">
    <div class="stat-box">
      <div class="stat-num">${rdvAVenir.length}</div>
      <div class="stat-lbl">RDV dans les 14 jours</div>
    </div>
    <div class="stat-box">
      <div class="stat-num danger">${enfantsRetard.length}</div>
      <div class="stat-lbl">Enfants en retard</div>
    </div>
    <div class="stat-box">
      <div class="stat-num">${rdvAVenir.length + enfantsRetard.length}</div>
      <div class="stat-lbl">Total à mobiliser</div>
    </div>
  </div>

  <div class="legend">
    <span style="background:#FFF3E0"></span> RDV urgent (≤ 7 jours)
    &nbsp;&nbsp;
    <span style="background:#FFF1F0"></span> Enfant en retard
    &nbsp;&nbsp;
    ☐ Case à cocher (mobilisation effectuée)
  </div>

  <!-- Section 1 : RDV à venir -->
  <div class="section-title">📅 Rendez-vous à venir (14 prochains jours) — ${rdvAVenir.length} enfant(s)</div>
  ${rdvAVenir.length === 0
    ? '<p style="color:#6B7280;padding:10px">Aucun rendez-vous dans les 14 prochains jours.</p>'
    : `<table>
      <thead>
        <tr>
          <th>#</th><th>Enfant</th><th>Code</th><th>Âge</th>
          <th>Vaccin</th><th>Date prévue</th>
          <th>Mère / Tuteur</th><th>Téléphone</th><th>Adresse</th>
          <th>✓</th>
        </tr>
      </thead>
      <tbody>${lignesRdv}</tbody>
    </table>`
  }

  <!-- Section 2 : En retard -->
  <div class="section-title danger">⚠️ Enfants en retard de vaccination — ${enfantsRetard.length} enfant(s)</div>
  ${enfantsRetard.length === 0
    ? '<p style="color:#6B7280;padding:10px">Aucun enfant en retard — tout est à jour !</p>'
    : `<table>
      <thead>
        <tr>
          <th>#</th><th>Enfant</th><th>Code</th><th>Âge</th>
          <th>Vaccin manqué</th><th>Date prévue</th>
          <th>Mère / Tuteur</th><th>Téléphone</th><th>Adresse</th>
          <th>✓</th>
        </tr>
      </thead>
      <tbody>${lignesRetard}</tbody>
    </table>`
  }

  <!-- Pied de page -->
  <div class="footer">
    <div>
      <p>VacciBenin — Système de suivi vaccinal</p>
      <p>Document généré automatiquement — Ne pas altérer</p>
    </div>
    <div style="display:flex; gap:20px">
      <div class="signature-box">
        <div>Signature du relais</div>
        <div class="signature-line"></div>
      </div>
      <div class="signature-box">
        <div>Cachet du centre</div>
        <div class="signature-line"></div>
      </div>
    </div>
  </div>
</body>
</html>
  `;
};

// ── Composant 
export default function ListeImprimableRelais({ route, navigation }) {
  const { token, centreNom } = route.params ?? {};
  const [loading, setLoading]   = useState(true);
  const [rdvAVenir, setRdvAVenir]         = useState([]);
  const [enfantsRetard, setEnfantsRetard] = useState([]);
  const [filtre, setFiltre]     = useState('tous'); // 'tous' | 'rdv' | 'retard'
  const [exportLoading, setExportLoading] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const res  = await fetch(`${API_BASE}/relais/dashboard`, {
        headers: { Authorization: `Bearer ${token}`, Accept: 'application/json' },
      });
      const json = await res.json();
      if (json.success) {
        setRdvAVenir(json.rdvAVenir ?? []);
        setEnfantsRetard(json.enfantsRetard ?? []);
      }
    } catch {
      Alert.alert('Erreur', 'Impossible de charger les données');
    } finally {
      setLoading(false);
    }
  };

  // Partager / exporter le HTML
  const partagerListe = async () => {
    setExportLoading(true);
    try {
      const html = genererHTML(rdvAVenir, enfantsRetard, centreNom);

      // Sur mobile : partager en texte/HTML via Share
      await Share.share({
        title: `Liste vaccination - ${centreNom ?? 'Centre'}`,
        message: `Liste de vaccination VacciBenin\nCentre : ${centreNom ?? '—'}\nDate : ${dateAujourdhui()}\n\nRDV à venir : ${rdvAVenir.length}\nEn retard : ${enfantsRetard.length}`,
      });
    } catch (e) {
      if (e.message !== 'User did not share') {
        Alert.alert('Erreur', 'Impossible de partager la liste');
      }
    } finally {
      setExportLoading(false);
    }
  };

  const listeAffichee = filtre === 'tous'
    ? [...rdvAVenir.map(e => ({ ...e, type: 'rdv' })),
       ...enfantsRetard.map(e => ({ ...e, type: 'retard' }))]
    : filtre === 'rdv'
      ? rdvAVenir.map(e => ({ ...e, type: 'rdv' }))
      : enfantsRetard.map(e => ({ ...e, type: 'retard' }));

  const renderItem = ({ item, index }) => {
    const isRetard   = item.type === 'retard';
    const couleurGauche = isRetard ? '#B71C1C' : '#1565C0';
    const jours = joursRestants(item.prochain_vaccin?.date_prevue);

    return (
      <View style={[styles.row, { borderLeftColor: couleurGauche }]}>
        <View style={styles.rowNum}>
          <Text style={styles.numTxt}>{index + 1}</Text>
        </View>
        <View style={styles.rowBody}>
          <View style={styles.rowTop}>
            <Text style={styles.rowNom}>{item.prenom} {item.nom}</Text>
            {isRetard && (
              <View style={styles.retardBadge}>
                <Text style={styles.retardBadgeTxt}>EN RETARD</Text>
              </View>
            )}
          </View>
          <Text style={styles.rowCode}>{item.code ?? item.code_unique ?? '—'} · {formatAge(item.age_mois)}</Text>
          {item.prochain_vaccin && (
            <Text style={styles.rowVaccin}>
              💉 {item.prochain_vaccin.vaccin ?? '—'} —{' '}
              <Text style={{ color: isRetard ? '#B71C1C' : '#1565C0', fontWeight: '600' }}>
                {formatDate(item.prochain_vaccin.date_prevue)}
                {jours !== null && !isRetard && jours <= 7 ? ` (J-${jours})` : ''}
              </Text>
            </Text>
          )}
          {item.mere_tuteur?.nom && (
            <Text style={styles.rowTuteur}>👩 {item.mere_tuteur.nom}</Text>
          )}
          {item.mere_tuteur?.telephone && (
            <Text style={styles.rowTel}>📞 {item.mere_tuteur.telephone}</Text>
          )}
          {item.mere_tuteur?.adresse && (
            <Text style={styles.rowAdresse}>📍 {item.mere_tuteur.adresse}</Text>
          )}
        </View>
        <View style={styles.rowCheck}>
          <View style={styles.checkbox} />
        </View>
      </View>
    );
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.loadingScreen}>
        <ActivityIndicator color="#065f46" size="large" />
        <Text style={styles.loadingTxt}>Préparation de la liste…</Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.root}>
      <StatusBar barStyle="light-content" backgroundColor="#065f46" />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Text style={styles.backArrow}>←</Text>
        </TouchableOpacity>
        <View style={{ flex: 1 }}>
          <Text style={styles.headerTitle}>Liste imprimable</Text>
          <Text style={styles.headerSub}>{centreNom ?? 'Centre de santé'}</Text>
        </View>
        <TouchableOpacity style={styles.shareBtn} onPress={partagerListe} disabled={exportLoading}>
          {exportLoading
            ? <ActivityIndicator color="#fff" size="small" />
            : <Text style={styles.shareBtnTxt}>⬆️ Partager</Text>
          }
        </TouchableOpacity>
      </View>

      {/* Info banner */}
      <View style={styles.infoBanner}>
        <View style={styles.infoStat}>
          <Text style={styles.infoNum}>{rdvAVenir.length}</Text>
          <Text style={styles.infoLbl}>RDV à venir</Text>
        </View>
        <View style={[styles.infoStat, { borderColor: '#B71C1C' }]}>
          <Text style={[styles.infoNum, { color: '#B71C1C' }]}>{enfantsRetard.length}</Text>
          <Text style={styles.infoLbl}>En retard</Text>
        </View>
        <View style={styles.infoStat}>
          <Text style={styles.infoNum}>{rdvAVenir.length + enfantsRetard.length}</Text>
          <Text style={styles.infoLbl}>Total</Text>
        </View>
        <Text style={styles.infoDate}>📅 {new Date().toLocaleDateString('fr-FR')}</Text>
      </View>

      {/* Filtres */}
      <View style={styles.filtres}>
        {[
          { key: 'tous',   label: `Tous (${rdvAVenir.length + enfantsRetard.length})` },
          { key: 'rdv',    label: `RDV (${rdvAVenir.length})` },
          { key: 'retard', label: `Retard (${enfantsRetard.length})` },
        ].map(f => (
          <TouchableOpacity
            key={f.key}
            style={[styles.filtreBtn, filtre === f.key && styles.filtreBtnActive]}
            onPress={() => setFiltre(f.key)}
          >
            <Text style={[styles.filtreTxt, filtre === f.key && styles.filtreTxtActive]}>
              {f.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Liste */}
      {listeAffichee.length === 0 ? (
        <View style={styles.emptyBox}>
          <Text style={styles.emptyIcon}>✅</Text>
          <Text style={styles.emptyTxt}>Aucun enfant dans cette catégorie</Text>
        </View>
      ) : (
        <ScrollView contentContainerStyle={{ padding: 16 }} showsVerticalScrollIndicator={false}>
          {/* Entête liste */}
          <View style={styles.listeHeader}>
            <Text style={styles.listeHeaderTxt}>
              📋 {listeAffichee.length} enfant(s) à mobiliser
            </Text>
          </View>

          {listeAffichee.map((item, i) => (
            <View key={item.id ?? i}>
              {renderItem({ item, index: i })}
            </View>
          ))}

          {/* Espace signature */}
          <View style={styles.signatureZone}>
            <Text style={styles.signatureTitle}>Zone de validation</Text>
            <View style={styles.signatureRow}>
              <View style={styles.signatureBox}>
                <Text style={styles.signatureLabel}>Signature du relais</Text>
                <View style={styles.signatureLine} />
              </View>
              <View style={styles.signatureBox}>
                <Text style={styles.signatureLabel}>Cachet du centre</Text>
                <View style={styles.signatureLine} />
              </View>
            </View>
          </View>

          {/* Bouton export */}
          <TouchableOpacity style={styles.exportBtn} onPress={partagerListe} disabled={exportLoading}>
            {exportLoading
              ? <ActivityIndicator color="#fff" size="small" />
              : <Text style={styles.exportBtnTxt}>🖨️ Exporter / Partager la liste</Text>
            }
          </TouchableOpacity>
        </ScrollView>
      )}
    </SafeAreaView>
  );
}

// ── Styles ───
const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#F5F7F6' },
  loadingScreen: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#fff' },
  loadingTxt: { marginTop: 12, color: '#065f46', fontSize: 15 },

  header: {
    backgroundColor: '#065f46',
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  backBtn:    { width: 36, height: 36, borderRadius: 18, backgroundColor: 'rgba(255,255,255,0.2)', justifyContent: 'center', alignItems: 'center' },
  backArrow:  { fontSize: 20, color: '#fff' },
  headerTitle: { fontSize: 18, fontWeight: '700', color: '#fff' },
  headerSub:   { fontSize: 13, color: '#A7F3D0', marginTop: 2 },
  shareBtn:    { backgroundColor: 'rgba(255,255,255,0.2)', paddingHorizontal: 12, paddingVertical: 8, borderRadius: 8 },
  shareBtnTxt: { color: '#fff', fontSize: 13, fontWeight: '700' },

  infoBanner: {
    backgroundColor: '#fff',
    margin: 16,
    borderRadius: 12,
    padding: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    elevation: 1,
  },
  infoStat:  { alignItems: 'center', borderWidth: 1, borderColor: '#D1FAE5', borderRadius: 8, paddingHorizontal: 12, paddingVertical: 6 },
  infoNum:   { fontSize: 24, fontWeight: '800', color: '#065f46' },
  infoLbl:   { fontSize: 10, color: '#6B7280', marginTop: 2 },
  infoDate:  { fontSize: 11, color: '#6B7280' },

  filtres: {
    flexDirection: 'row',
    marginHorizontal: 16,
    marginBottom: 8,
    backgroundColor: '#fff',
    borderRadius: 10,
    padding: 4,
    elevation: 1,
    gap: 4,
  },
  filtreBtn:       { flex: 1, paddingVertical: 8, alignItems: 'center', borderRadius: 8 },
  filtreBtnActive: { backgroundColor: '#065f46' },
  filtreTxt:       { fontSize: 12, color: '#6B7280', fontWeight: '500' },
  filtreTxtActive: { color: '#fff', fontWeight: '700' },

  listeHeader: {
    marginBottom: 12,
    paddingBottom: 8,
    borderBottomWidth: 2,
    borderBottomColor: '#065f46',
  },
  listeHeaderTxt: { fontSize: 15, fontWeight: '700', color: '#065f46' },

  row: {
    backgroundColor: '#fff',
    borderRadius: 10,
    marginBottom: 10,
    borderLeftWidth: 4,
    flexDirection: 'row',
    overflow: 'hidden',
    elevation: 1,
  },
  rowNum: {
    width: 32,
    backgroundColor: '#F9FAFB',
    justifyContent: 'center',
    alignItems: 'center',
    borderRightWidth: 1,
    borderRightColor: '#F3F4F6',
  },
  numTxt:  { fontSize: 12, color: '#9CA3AF', fontWeight: '700' },
  rowBody: { flex: 1, padding: 12 },
  rowTop:  { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 },
  rowNom:  { fontSize: 15, fontWeight: '700', color: '#111827', flex: 1 },
  retardBadge: { backgroundColor: '#FFEBEE', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4 },
  retardBadgeTxt: { fontSize: 9, fontWeight: '800', color: '#B71C1C' },
  rowCode:    { fontSize: 11, color: '#6B7280', marginBottom: 4 },
  rowVaccin:  { fontSize: 13, color: '#374151', marginBottom: 3 },
  rowTuteur:  { fontSize: 12, color: '#6B7280', marginTop: 2 },
  rowTel:     { fontSize: 12, color: '#1565C0' },
  rowAdresse: { fontSize: 11, color: '#9CA3AF', marginTop: 1 },
  rowCheck: {
    width: 36,
    justifyContent: 'center',
    alignItems: 'center',
    borderLeftWidth: 1,
    borderLeftColor: '#F3F4F6',
  },
  checkbox: {
    width: 20, height: 20, borderWidth: 2, borderColor: '#D1D5DB', borderRadius: 4,
  },

  signatureZone: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginTop: 20,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderStyle: 'dashed',
  },
  signatureTitle: { fontSize: 13, fontWeight: '700', color: '#065f46', marginBottom: 16, textAlign: 'center' },
  signatureRow:   { flexDirection: 'row', gap: 16 },
  signatureBox:   { flex: 1, alignItems: 'center' },
  signatureLabel: { fontSize: 11, color: '#6B7280', marginBottom: 30 },
  signatureLine:  { width: '100%', height: 1, backgroundColor: '#374151' },

  exportBtn: {
    backgroundColor: '#065f46',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    marginBottom: 32,
  },
  exportBtnTxt: { color: '#fff', fontWeight: '700', fontSize: 16 },

  emptyBox:  { alignItems: 'center', paddingVertical: 60 },
  emptyIcon: { fontSize: 50, marginBottom: 16 },
  emptyTxt:  { fontSize: 15, color: '#9CA3AF' },
});