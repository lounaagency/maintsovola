import axios from "axios";

const apiClientMvola = axios.create({
  baseURL: import.meta.env.VITE_MVOLA_API_URL, // Ex: https://devapi.mvola.mg (pour le dev) puis changer l'url par https://api.mvola.mg (pour la production) qu'on dois mettre dans le dossier .env
  headers: {
    "Content-Type": "application/json",
    Accept: "application/json",
  },
});

// Ajouter un intercepteur pour ajouter le token dynamiquement
apiClientMvola.interceptors.request.use((config) => {
  const token = localStorage.getItem("mvola_token"); // ou depuis un état global
  if (token) {
    config.headers["Authorization"] = `Bearer ${token}`;
  }
  return config;
});

export default apiClientMvola;