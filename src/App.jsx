// src/App.jsx - Mise à jour du Header avec style typographique moderne

import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';

import InscriptionPage from './components/InscriptionPage';
import PaiementPage from './components/PaiementPage';
import ConfirmationPage from './components/ConfirmationPage';

// Styles CSS de base pour un look moderne (peuvent être déplacés dans un fichier CSS global)
const globalStyles = {
  fontFamily: 'Inter, Arial, sans-serif', // Police moderne sans serif
  maxWidth: '800px',
  margin: '0 auto',
  padding: '20px',
  backgroundColor: '#F8F9FA', // Fond léger
  minHeight: '100vh',
};

const headerStyles = {
  borderBottom: '1px solid #dee2e6', // Ligne de séparation subtile
  paddingBottom: '15px',
  marginBottom: '35px',
};

const titleLotoStyle = {
  color: '#007BFF', // Bleu primaire
  fontWeight: '800',
  fontSize: '2.5rem',
};

const titleEmploiStyle = {
  color: '#343A40', // Gris neutre
  fontWeight: '300',
  fontSize: '2.5rem',
  marginLeft: '5px', // Espace subtil
};

const App = () => {
  return (
    <Router>
      <div style={globalStyles}>
        <header style={headerStyles}>
          {/* Le titre stylisé remplace le logo */}
          <h1>
            <span style={titleLotoStyle}>Loto</span>
            <span style={titleEmploiStyle}>Emploi</span>
          </h1>
        </header>
        <Routes>
          <Route path="/" element={<Navigate to="/inscription" replace />} />
          <Route path="/inscription" element={<InscriptionPage />} />
          <Route path="/paiement/:userId" element={<PaiementPage />} />
          <Route path="/confirmation/:userId" element={<ConfirmationPage />} />
          <Route path="*" element={<h2>Page Non Trouvée</h2>} />
        </Routes>
      </div>
    </Router>
  );
};

export default App;
