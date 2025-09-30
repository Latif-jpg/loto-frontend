// src/App.jsx

import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';

import InscriptionPage from './components/InscriptionPage';
import PaiementPage from './components/PaiementPage';
import ConfirmationPage from './components/ConfirmationPage';

// Styles CSS de base pour un look moderne et pour éviter le débordement
const globalStyles = {
    fontFamily: 'Inter, Arial, sans-serif', 
    maxWidth: '800px',
    margin: '0 auto',
    padding: '20px', 
    backgroundColor: '#F8F9FA', 
    minHeight: '100vh',
};

const headerStyles = {
    borderBottom: '1px solid #dee2e6',
    paddingBottom: '15px',
    marginBottom: '0', // Éviter les marges externes dans le header
};

const titleLotoStyle = {
    color: '#007BFF', 
    fontWeight: '800',
    fontSize: '2.5rem',
};

const titleEmploiStyle = {
    color: '#343A40', 
    fontWeight: '300',
    fontSize: '2.5rem',
    marginLeft: '5px', 
};


const App = () => {
    return (
        <Router>
            <div style={globalStyles}>
                <header style={headerStyles}>
                    <h1>
                        <span style={titleLotoStyle}>Loto</span>
                        <span style={titleEmploiStyle}>Emploi</span>
                    </h1>
                </header>
                
                {/* Conteneur pour séparer le Header du contenu des pages */}
                <div style={{ paddingTop: '35px' }}>
                    <Routes>
                        <Route path="/" element={<Navigate to="/inscription" replace />} />
                        <Route path="/inscription" element={<InscriptionPage />} />
                        <Route path="/paiement/:userId" element={<PaiementPage />} />
                        
                        {/* Route de confirmation correcte */}
                        <Route path="/status/:token" element={<ConfirmationPage />} />
                        
                        <Route path="*" element={<h2>Page Non Trouvée</h2>} />
                    </Routes>
                </div>
            </div>
        </Router>
    );
};

export default App;
