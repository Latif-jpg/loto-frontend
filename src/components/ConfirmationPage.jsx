// src/components/ConfirmationPage.jsx

import React, { useState, useEffect } from 'react';
// 🟢 Ajout de useNavigate et useLocation (useLocation est utilisé pour la sécurité)
import { useParams, useNavigate, useLocation } from 'react-router-dom'; 
import axios from 'axios';

const BASE_SERVER_URL = 'https://loto-backend-83zb.onrender.com/api/payments';
const CHECK_STATUS_URL = `${BASE_SERVER_URL}/status/`;

const ConfirmationPage = () => {
    // Lit le 'token' depuis le chemin (/status/TOKEN_A_LIRE)
    const { token: paymentToken } = useParams(); 
    // 🟢 Injection des fonctions de navigation
    const navigate = useNavigate();
    const location = useLocation();

    const [statutPaiement, setStatutPaiement] = useState('loading');
    const [codesTickets, setCodesTickets] = useState(null);
    const [loading, setLoading] = useState(true);
    const [message, setMessage] = useState("Vérification du statut de votre paiement...");

    useEffect(() => {
        // 🎯 LOGIQUE DE NETTOYAGE DE L'HISTORIQUE (CORRECTION CRITIQUE)
        // On remplace l'entrée de l'historique (polluée par la redirection du Backend)
        // par l'URL actuelle et propre de la page de statut.
        // Cela garantit que le bouton "Retour" fonctionne correctement, sans revenir à l'URL du Backend.
        
        // La condition `location.key === 'default'` est une technique courante
        // pour s'assurer que le remplacement n'est fait qu'au premier chargement (après la redirection).
        if (location.key === 'default' && paymentToken) {
            navigate(location.pathname, { replace: true });
            // Note: Le code d'API ci-dessous s'exécutera juste après, ce qui est normal.
        }
        
        if (!paymentToken) {
            setMessage("Jeton de paiement manquant. Impossible de vérifier la transaction.");
            setStatutPaiement('error');
            setLoading(false);
            return;
        }

        const fetchStatus = async () => {
            // ... (Le reste de votre logique d'appel API est inchangée)
            try {
                const response = await axios.get(`${CHECK_STATUS_URL}${paymentToken}`);

                const data = response.data;
                setStatutPaiement(data.status);

                if (data.status === 'paid') {
                    setCodesTickets(data.tickets);
                    setMessage("Votre paiement a été confirmé avec succès !");
                } else if (data.status === 'pending') {
                    setMessage("Le paiement est en attente. Si vous venez de payer, attendez quelques secondes puis rafraîchissez.");
                } else if (data.status === 'failed') {
                    setMessage("Le paiement a échoué. Veuillez recommencer le processus d'inscription.");
                }
            } catch (err) {
                console.error("Erreur de vérification du statut:", err);
                setMessage("Erreur de communication avec le serveur pour vérifier la transaction.");
                setStatutPaiement('error');
            } finally {
                setLoading(false);
            }
        };

        fetchStatus();
    }, [paymentToken, navigate, location.pathname, location.key]); // 🟢 Ajout des dépendances de navigation

    // ... (Le reste du code de rendu est inchangé)
    // ... (renderStatus function)
    
    return (
        // ... (JSX du rendu)
        <div className="card-container" style={{ padding: '30px' }}>
            {/* ... */}
        </div>
    );
};

export default ConfirmationPage;
