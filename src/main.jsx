import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import './styles/styles.css'

// Importez votre logo depuis le dossier assets (adaptez le nom du fichier)
import logoFavicon from './assets/logo.jpg'

// Injectez dynamiquement l'icône dans le <head> de la page
const link = document.querySelector("link[rel*='icon']") || document.createElement('link');
link.type = 'image/jpeg';
link.rel = 'icon';
link.href = logoFavicon;
document.getElementsByTagName('head')[0].appendChild(link);

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)