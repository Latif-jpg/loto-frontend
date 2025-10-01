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
// **********************************************

// Prix unitaire du ticket : 2000 FCFA
const PRIX_TICKET_UNITAIRE = 2000;

const PaiementPage = () => {
    const { userId } = useParams();
    const navigate = useNavigate();

    const [clientInfo, setClientInfo] = useState(null);
    const [nbTickets, setNbTickets] = useState(1);
    const [plateforme, setPlateforme] = useState('Orange Money');
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    // DÉCLARATION DE L'ÉTAT CRITIQUE POUR LA REDIRECTION 
    // Assure la portée de 'redirectionData' dans tout le composant.
    const [redirectionData, setRedirectionData] = useState(null);
    // -------------------------------------------------------------

    const totalMontant = nbTickets * PRIX_TICKET_UNITAIRE;
    const MIN_AMOUNT = PRIX_TICKET_UNITAIRE;    

    // --- LOGIQUE DE CHARGEMENT DES INFOS UTILISATEUR ---
    useEffect(() => {
        const fetchClientInfo = async () => {
            try {
                const { data, error } = await supabase
                    .from('utilisateurs')
                    .select('*')
                    .eq('id', userId)
                    .single();

                if (error) throw error;
                setClientInfo(data);
            } catch (err) {
                setError('Impossible de trouver vos informations utilisateur.');
            } finally {
                setLoading(false);
            }
        };

        if (userId) {
            fetchClientInfo();
        } else {
            setError("L'ID utilisateur est manquant.");
            setLoading(false);
        }
    }, [userId]);

    // --- LOGIQUE DE PAIEMENT VERS LE BACKEND ---
    const handleLaunchPayment = async () => {
        if (!clientInfo) return;
        if (totalMontant < MIN_AMOUNT) {
              setError(`Le montant minimum est de ${MIN_AMOUNT.toLocaleString('fr-FR')} XOF (1 ticket).`);
              return;
        }

        setLoading(true);
        setError(null);
        setRedirectionData(null); // Réinitialise l'état de redirection

        try {
            const response = await axios.post(INIT_PAYMENT_URL, {
                userId: clientInfo.id,
                amount: totalMontant,
                numTickets: nbTickets,
                provider: plateforme,
            });

            // Assurez-vous que le backend renvoie 'paymentToken' et 'checkoutPageUrlWithPaymentToken'
            const paymentToken = response.data.paymentToken;    
            const checkoutUrl = response.data.checkoutPageUrlWithPaymentToken;
            
            if (response.data && checkoutUrl && paymentToken) {
                
                // 1. Sauvegarde des infos et déclenche le rendu d'urgence
                setRedirectionData({ paymentToken, checkoutUrl }); 
                
                // 2. Lancement de la redirection après un délai pour que l'utilisateur lise le message
                setTimeout(() => {
                    window.location.href = checkoutUrl;  
                }, 8000);   

            } else {
                setError('Erreur lors de l\'initialisation du paiement (token ou URL manquant).');
                setLoading(false);
            }

        } catch (err) {
            console.error('Erreur Serveur/Paiement:', err.response?.data?.error || err.message);
            setError(`Erreur de communication avec le service de paiement: ${err.response?.data?.error || err.message}.`);
            setLoading(false);
        }
    };
    
    // --- Styles CSS Intégrés ---
    const cardStyle = {     
        maxWidth: '450px',      
        margin: '50px auto',        
        padding: '30px',        
        boxShadow: '0 6px 12px rgba(0,0,0,0.15)',       
        borderRadius: '10px',
        backgroundColor: '#fff'
    };
    const buttonStyle = {
        backgroundColor: loading ? '#6c757d' : '#28a745',        
        color: 'white',
        padding: '15px 25px',
        border: 'none',
        borderRadius: '5px',
        cursor: 'pointer',
        fontSize: '18px',
        width: '100%',
        marginTop: '20px',
        transition: 'background-color 0.3s'
    };
    const infoStyle = {     
        margin: '5px 0',        
        padding: '8px 0',
        fontWeight: 'normal',
        color: '#343a40',
        display: 'flex',        
        justifyContent: 'space-between',        
        borderBottom: '1px dotted #eee',
    };
    const infoLabelStyle = {
        fontWeight: 'bold',
        minWidth: '120px',      
        color: '#555',
    };
    const logoContainerStyle = {
        textAlign: 'center',        
        marginBottom: '25px',
        overflow: 'hidden',     
    };
    // ----------------------------


    // RENDU D'URGENCE (Si la redirection est en cours)
    // NOTE : Ce bloc DOIT être DANS le composant PaiementPage
    if (redirectionData) {
        // window.location.origin donne 'https://loto-frontend.onrender.com'
        const RECEIPT_URL = window.location.origin + "/status/"; 
        const fullReceiptUrl = RECEIPT_URL + redirectionData.paymentToken;

        return (
            <div style={{ textAlign: 'center', marginTop: '50px', padding: '30px', backgroundColor: '#fff3cd', border: '1px solid #ffc107', borderRadius: '8px', maxWidth: '600px', margin: '50px auto' }}>
                <h3 style={{ color: '#856404' }}>⚠️ Redirection Imminente vers PayDunya...</h3>
                
                <p style={{ margin: '15px 0' }}>
                    Vous serez redirigé(e) automatiquement d'ici **quelques secondes** pour effectuer le paiement.
                </p>
                
                {/* INSTRUCTION DE SECOURS CLAIRE */}
                <p style={{ fontWeight: 'bold' }}>
                    🚨 ACTION CRITIQUE : Si vous payez avec succès mais **n'êtes pas redirigé(e)** automatiquement, ou si vous revenez manuellement sur cette page, <br/>
                    **CLIQUEZ IMMÉDIATEMENT** sur ce lien pour accéder à votre reçu et valider vos tickets :
                </p>
                
                <a 
                    href={fullReceiptUrl} 
                    rel="noopener noreferrer" 
                    style={{ 
                        display: 'block', 
                        margin: '15px auto', 
                        padding: '10px', 
                        backgroundColor: '#f9f9f9', 
                        border: '1px solid #ddd', 
                        wordBreak: 'break-all',
                        color: '#007BFF',
                        fontSize: '1.1em',
                        textDecoration: 'none',
                        boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
                    }}
                >
                    🔗 Lien de Mon Reçu de Transaction (À Conserver)
                </a>

                <p style={{ marginTop: '20px', fontSize: '0.9em' }}>
                    Le statut de votre reçu sera mis à jour en temps réel à cette adresse, grâce à notre serveur.
                </p>
            </div>
        );
    }

    // RENDU NORMAL DU FORMULAIRE
    if (loading && !clientInfo) return <div style={{ textAlign: 'center', marginTop: '50px' }}>Chargement de vos informations...</div>;
    if (error && !clientInfo) return <div style={{ color: 'red', textAlign: 'center', marginTop: '20px' }}>Erreur : {error}</div>;

    return (
        <div className="card-container" style={cardStyle}>
            
            {/* LOGO TEXTE STYLISÉ */}
            <div style={logoContainerStyle}>
                <h1 style={{ fontSize: '2.5rem', margin: '0', textTransform: 'uppercase' }}>
                    <span style={{ color: '#dc3545', fontWeight: 'bold' }}>Loto</span>
                    <span style={{ color: '#007bff', fontWeight: 'bold' }}>Emploi</span>
                </h1>
            </div>
            
            <h2 style={{ color: '#343a40', borderBottom: '1px solid #ddd', paddingBottom: '10px', textAlign: 'center' }}>
                Résumé & Paiement du Ticket
            </h2>

            {/* Bloc d'Informations Client */}
            <div style={{ border: '1px solid #dee2e6', backgroundColor: '#f8f9fa', padding: '15px', borderRadius: '8px', marginBottom: '25px' }}>
                <h4 style={{ margin: '0 0 15px 0', color: '#007BFF', borderBottom: '1px solid #dee2e6' }}>Vos Infos Identitaires :</h4>
                
                {clientInfo && (
                    <>
                        <div style={infoStyle}>
                            <span style={infoLabelStyle}>Nom/Prénom:</span>
                            <span>{clientInfo.nom} {clientInfo.prenom}</span>
                        </div>
                        <div style={infoStyle}>
                            <span style={infoLabelStyle}>Téléphone:</span>
                            <span>{clientInfo.telephone}</span>
                        </div>
                        <div style={infoStyle}>
                            <span style={infoLabelStyle}>CNIB/CNI:</span>
                            <span>{clientInfo.reference_cnib}</span>
                        </div>
                    </>
                )}
            </div>

            <div style={{ marginBottom: '20px' }}>
                <label style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold' }}>
                    Nombre de tickets ({PRIX_TICKET_UNITAIRE.toLocaleString('fr-FR')} XOF l'unité) :
                </label>
                <input
                    type="number"
                    value={nbTickets}
                    min="1"
                    onChange={(e) => setNbTickets(Math.max(1, parseInt(e.target.value) || 1))}
                    style={{ width: '25%', padding: '10px', borderRadius: '4px', border: '1px solid #ccc' }}
                />
            </div>

            <h3 style={{ fontSize: '1.8rem', color: '#dc3545', marginBottom: '25px', padding: '15px', border: '2px solid #dc3545', backgroundColor: '#fefefe', borderRadius: '4px', textAlign: 'center' }}>
                Montant Total : {totalMontant.toLocaleString('fr-FR')} XOF
            </h3>

            <div style={{ marginBottom: '30px' }}>
                <label style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold' }}>
                    Plateforme de paiement (Mobile Money) :
                </label>
                <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                    {['Orange Money', 'Moov Money', 'Sank Money', 'Coris Money'].map((name) => (
                        <button
                            key={name}
                            onClick={() => setPlateforme(name)}
                            style={{      
                                padding: '10px 15px',      
                                border: '1px solid #28a745',      
                                borderRadius: '5px',
                                cursor: 'pointer',
                                backgroundColor: plateforme === name ? '#28a745' : '#e9ecef',
                                color: plateforme === name ? 'white' : '#495057',
                                fontWeight: plateforme === name ? 'bold' : 'normal',
                                transition: 'all 0.2s'
                            }}
                            disabled={loading}
                        >
                            {name}
                        </button>
                    ))}
                </div>
            </div>
            
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
