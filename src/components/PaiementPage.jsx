// src/components/PaiementPage.js

import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '../supabaseClient';
import axios from 'axios';

// **********************************************
// ********* URL DU SERVEUR BACKEND *************
// **********************************************
const BACKEND_URL = 'https://loto-backend-83zb.onrender.com';
const INIT_PAYMENT_URL = `${BACKEND_URL}/api/payments`;
const STATUS_CHECK_URL = `${BACKEND_URL}/api/payments/status`; // Nouvelle URL pour vérifier l'état
// **********************************************

// Prix unitaire du ticket : 2000 FCFA
const PRIX_TICKET_UNITAIRE = 2000;

// VARIABLES GLOBALES POUR LA GESTION DU MONITORING
let popupWindow = null; 
let checkInterval = null; 

const PaiementPage = () => {
    const { userId } = useParams();
    const navigate = useNavigate();

    const [clientInfo, setClientInfo] = useState(null);
    const [nbTickets, setNbTickets] = useState(1);
    const [plateforme, setPlateforme] = useState('Orange Money');    
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    
    // NOUVEAUX ÉTATS
    const [isMonitoring, setIsMonitoring] = useState(false); // État de surveillance
    const [currentPaymentToken, setCurrentPaymentToken] = useState(null); // Le token à suivre

    const totalMontant = nbTickets * PRIX_TICKET_UNITAIRE;
    const MIN_AMOUNT = PRIX_TICKET_UNITAIRE;    

    // --- NETTOYAGE DU MONITORING AU DÉMONTAGE DU COMPOSANT ---
    useEffect(() => {
        // ... (logique de chargement Supabase)
        // ... (votre logique fetchClientInfo)
        
        return () => {
            // S'assure de nettoyer l'intervalle si l'utilisateur quitte la page
            if (checkInterval) {
                clearInterval(checkInterval);
            }
        };
    }, [userId]); 

    // --- NOUVELLE FONCTION : SURVEILLANCE DE LA POP-UP ---
    const startPopupMonitor = (token) => {
        // Arrête toute surveillance précédente
        if (checkInterval) clearInterval(checkInterval);
        
        setIsMonitoring(true);
        setCurrentPaymentToken(token); // Stocke le token pour la vérification future

        // Définir la fonction de vérification
        checkInterval = setInterval(async () => {
            // 1. Vérification si l'utilisateur a fermé la pop-up
            if (popupWindow && popupWindow.closed) {
                console.log("Pop-up fermée. Redirection vers la page de statut.");
                
                clearInterval(checkInterval);
                setIsMonitoring(false);
                setLoading(false);

                // Redirige vers la page de reçu/statut avec le token obtenu
                navigate(`/status/${token}`);
                return;
            }
            
            // 2. Vérification proactive (Optionnel : si le webhook est lent)
            // Cette partie vérifie si le paiement a été validé même si la pop-up est toujours ouverte
            // REMARQUE: Nécessite une route /api/payments/status/:token dans votre backend
            //try {
                //const res = await axios.get(`${STATUS_CHECK_URL}/${token}`);
                //if (res.data.status === 'completed' || res.data.status === 'paid') {
                    //console.log("Statut détecté par polling. Fermeture du monitor et redirection.");
                    //popupWindow.close(); // Ferme la pop-up si elle est encore là
                    //clearInterval(checkInterval);
                    //setIsMonitoring(false);
                    //setLoading(false);
                    //navigate(`/status/${token}`);
                //}
            //} catch (e) {
                //console.log("Vérification de statut en attente...");
            //}

        }, 3000); // Vérifie toutes les 3 secondes
    };


    // --- LOGIQUE DE PAIEMENT VERS LE BACKEND ---
    const handleLaunchPayment = async () => {
        if (!clientInfo) return;
        if (totalMontant < MIN_AMOUNT) {
             setError(`Le montant minimum est de ${MIN_AMOUNT.toLocaleString('fr-FR')} XOF (1 ticket).`);
             return;
        }

        setLoading(true);
        setError(null);
        setIsMonitoring(false); // Réinitialise le monitoring

        try {
            const response = await axios.post(INIT_PAYMENT_URL, {
                userId: clientInfo.id,
                amount: totalMontant,
                numTickets: nbTickets,
                provider: plateforme,
            });

            // ⚠️ ASSUREZ-VOUS QUE VOTRE BACKEND RENVOIE LE TOKEN DE PAIEMENT ICI !
            const paymentToken = response.data.paymentToken; // J'assume cette propriété existe
            
            if (response.data && response.data.checkoutPageUrlWithPaymentToken && paymentToken) {
                const checkoutUrl = response.data.checkoutPageUrlWithPaymentToken;
                
                // Ouvre PayDunya dans une pop-up. Le 'name' doit être constant.
                popupWindow = window.open(checkoutUrl, 'PayDunyaPayment', 'width=800,height=700,resizable=yes,scrollbars=yes');
                
                if (popupWindow) {
                    startPopupMonitor(paymentToken); // Démarre la surveillance
                } else {
                    setError("Veuillez autoriser les fenêtres pop-up pour lancer le paiement.");
                    setLoading(false);
                }

            } else {
                setError('Erreur lors de l\'initialisation du paiement (token ou URL manquant).');
                setLoading(false);
            }

        } catch (err) {
            console.error('Erreur Serveur/Paiement:', err.response?.data?.error || err.message);
            setError(`Erreur de communication avec le service de paiement.`);
            setLoading(false);
        }
    };


    // --- RENDU D'ATTENTE LORSQUE LE MONITORING EST ACTIF ---
    if (isMonitoring) {
        return (
            <div style={{ textAlign: 'center', marginTop: '50px', padding: '30px', backgroundColor: '#e9f7ef', border: '1px solid #28a745', borderRadius: '8px', maxWidth: '600px', margin: '50px auto' }}>
                <h3 style={{ color: '#28a745' }}>💳 Paiement en cours (PayDunya)...</h3>
                <p>
                    Veuillez **terminer le paiement** dans la nouvelle fenêtre.
                </p>
                <p style={{ fontWeight: 'bold', color: '#007BFF' }}>
                    Dès que vous fermez la fenêtre PayDunya, cette page se rechargera automatiquement pour afficher votre reçu.
                </p>
                <div style={{ margin: '20px 0' }}>
                    {/* Placeholder for a spinning loading icon */}
                    <div style={{ border: '4px solid rgba(0,0,0,.1)', width: '36px', height: '36px', borderRadius: '50%', borderLeftColor: '#28a745', animation: 'spin 1s linear infinite', margin: '0 auto' }}></div>
                </div>
                <p style={{ fontSize: '0.9em', color: '#6c757d' }}>
                    Token de la transaction : {currentPaymentToken} (Gardez ce code en cas de problème technique).
                </p>
            </div>
        );
    }
    
    // --- Reste du rendu du formulaire de paiement (inchangé) ---
    // ... (votre code JSX original)
    if (loading && !clientInfo) return <div style={{ textAlign: 'center', marginTop: '50px' }}>Chargement de vos informations...</div>;
    if (error && !clientInfo) return <div style={{ color: 'red', textAlign: 'center', marginTop: '20px' }}>Erreur : {error}</div>;

    // ... (Code JSX du formulaire ci-dessous)
    return (
        <div className="card-container" style={cardStyle}>
            {/* ... (votre JSX de logo, infos, etc.) */}

            {error && (
                <p style={{ color: 'red', textAlign: 'center', fontWeight: 'bold' }}>
                    {error}
                </p>
            )}

            {/* Bouton de Paiement Final (VERT) */}
            <button 
                onClick={handleLaunchPayment} 
                disabled={loading || totalMontant < MIN_AMOUNT} 
                style={buttonStyle}
            >
                {loading ? 'Initialisation...' : `Payer ${totalMontant.toLocaleString('fr-FR')} XOF`}
            </button>
        </div>
    );
};

export default PaiementPage;
