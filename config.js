// config.js — Configuration centrale de l'application
// C'est ici que tu changes l'IP quand elle change
// Tape "ipconfig" dans le terminal pour trouver ton IP actuelle

const CONFIG = {
  // IP de ton PC sur le réseau local
  // À mettre à jour si l'IP change (quand tu changes de réseau)
  API_URL: 'http://192.168.56.1:8000/api',
};

export default CONFIG;