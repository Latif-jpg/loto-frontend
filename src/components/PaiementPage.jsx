// src/components/PaiementPage.js

import React, { useState, useEffect } from 'react';
// ... (imports inchangés)

// **********************************************
// ********* URL DU SERVEUR BACKEND *************
// **********************************************
const BACKEND_URL = 'https://loto-backend-83zb.onrender.com';
const INIT_PAYMENT_URL = `${BACKEND_URL}/api/payments`;
// **********************************************

// Prix unitaire du ticket : 2000 FCFA
const PRIX_TICKET_UNITAIRE = 2000;

const PaiementPage = () => {
    // ... (Hooks et états inchangés)

    // --- LOGIQUE DE CHARGEMENT DES INFOS UTILISATEUR ---
    // ... (useEffect inchangé)

    // --- LOGIQUE DE PAIEMENT VERS LE BACKEND ---
    // ... (handleLaunchPayment inchangé)
    
    // --- Styles CSS Intégrés ---
    // ... (Styles inchangés)

    // RENDU D'URGENCE (Si la redirection est en cours)
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
                
                {/* 🎯 MESSAGE CLAIR POUR LE RETOUR ARRIÈRE/BLOCAGE */}
                <p style={{ fontWeight: 'bold' }}>
                    🚨 ACTION CRITIQUE : Si vous payez avec succès mais **n'êtes pas redirigé(e)** automatiquement, ou si vous revenez manuellement sur cette page, <br/>
                    **CLIQUEZ IMMÉDIATEMENT** sur ce lien pour accéder à votre reçu et valider vos tickets :
                </p>
                
                <a 
                    href={fullReceiptUrl} 
                    // target="_blank" est retiré pour encourager le retour sur la même fenêtre si PayDunya ne fait pas son travail.
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
                {/* FIN DE LA MODIFICATION */}

                <p style={{ marginTop: '20px', fontSize: '0.9em' }}>
                    Le statut de votre reçu sera mis à jour en temps réel à cette adresse, grâce à notre serveur.
                </p>
            </div>
        );
    }

    // RENDU NORMAL DU FORMULAIRE
    // ... (Reste inchangé)
};

export default PaiementPage;
