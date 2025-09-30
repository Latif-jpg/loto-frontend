// src/components/ConfirmationPage.jsx

import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom'; // 🚨 Correction : Utilisation de useParams
import axios from 'axios';

const BASE_SERVER_URL = 'https://loto-backend-83zb.onrender.com/api/payments';
const CHECK_STATUS_URL = `${BASE_SERVER_URL}/status/`;

const ConfirmationPage = () => {
    // 🚨 Correction : Lit le 'token' directement depuis le chemin (/status/TOKEN_A_LIRE)
    const { token: paymentToken } = useParams(); 

    const [statutPaiement, setStatutPaiement] = useState('loading');
    const [codesTickets, setCodesTickets] = useState(null);
    const [loading, setLoading] = useState(true);
    const [message, setMessage] = useState("Vérification du statut de votre paiement...");

    useEffect(() => {
        if (!paymentToken) {
            setMessage("Jeton de paiement manquant. Impossible de vérifier la transaction.");
            setStatutPaiement('error');
            setLoading(false);
            return;
        }

        const fetchStatus = async () => {
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
    }, [paymentToken]);

    const renderStatus = () => {
        switch (statutPaiement) {
            case 'loading':
                return <span style={{ color: '#007BFF', fontWeight: 'bold' }}>Vérification en cours...</span>;
            case 'pending':
                return <span style={{ color: '#ffc107', fontWeight: 'bold' }}>EN ATTENTE de confirmation</span>;
            case 'paid':
                return <span style={{ color: '#28a745', fontWeight: 'bold' }}>CONFIRMÉ et PAIÉ !</span>;
            case 'failed':
            case 'error':
                return <span style={{ color: '#dc3545', fontWeight: 'bold' }}>{statutPaiement === 'failed' ? 'ÉCHOUÉ' : 'ERREUR'}</span>;
            default:
                return <span>Statut inconnu</span>;
        }
    };

    return (
        <div className="card-container" style={{ padding: '30px' }}>
            <h2 style={{ color: '#343a40', borderBottom: '1px solid #ddd', paddingBottom: '10px' }}>
                Résultat de la Transaction
            </h2>

            <div style={{ marginBottom: '25px', padding: '15px', backgroundColor: '#f8f9fa', borderRadius: '8px', borderLeft: `5px solid ${statutPaiement === 'paid' ? '#28a745' : '#dc3545'}` }}>
                <p><strong>Statut:</strong> {renderStatus()}</p>
                <p><strong>Message:</strong> {message}</p>
            </div>

            {/* Affichage des codes de tickets si le paiement est confirmé */}
            {codesTickets && statutPaiement === 'paid' && (
                <div style={{ backgroundColor: '#d4edda', color: '#155724', padding: '20px', borderRadius: '8px', border: '1px solid #c3e6cb', marginTop: '30px' }}>
                    <h3 style={{ margin: '0 0 15px 0' }}>🎉 Codes de vos Tickets :</h3>
                    <ul style={{ listStyleType: 'none', padding: 0 }}>
                        {codesTickets.map((code, index) => (
                            <li key={index} style={{ padding: '8px 0', borderBottom: '1px dotted #c3e6cb', fontWeight: 'bold', fontSize: '1.1rem' }}>
                                Code #{index + 1}: <span style={{ color: '#007BFF' }}>{code}</span>
                            </li>
                        ))}
                    </ul>
                </div>
            )}

            {loading && statutPaiement === 'loading' && (
                <div style={{ textAlign: 'center', marginTop: '20px', color: '#6c757d' }}>
                    <p>Veuillez patienter...</p>
                </div>
            )}
        </div>
    );
};

export default ConfirmationPage;
