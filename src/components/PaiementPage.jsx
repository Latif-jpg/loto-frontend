import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '../supabaseClient';
import axios from 'axios';

// **********************************************
// ********* CORRECTION FINALE DE L'URL *********
// **********************************************
// Le serveur Express attend POST /api/payments, pas /api/payments/initier
const BASE_SERVER_URL = 'https://loto-backend-83zb.onrender.com/api/payments';
const INIT_PAYMENT_URL = BASE_SERVER_URL; // <= C'est la ligne CRITIQUE !
// **********************************************

const PRIX_TICKET_UNITAIRE = 5000;

const PaiementPage = () => {
  const { userId } = useParams();
  const navigate = useNavigate();

  const [clientInfo, setClientInfo] = useState(null);
  const [nbTickets, setNbTickets] = useState(1);
  const [plateforme, setPlateforme] = useState('MTN');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const totalMontant = nbTickets * PRIX_TICKET_UNITAIRE;

  // 1. Chargement des informations utilisateur
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
        setError('Impossible de trouver vos informations utilisateur. Veuillez recommencer l\'inscription.');
      } finally {
        setLoading(false);
      }
    };

    if (userId) {
        fetchClientInfo();
    } else {
        setError("L'ID utilisateur est manquant. Veuillez retourner à l'inscription.");
        setLoading(false);
    }

  }, [userId]);

  // 2. Lancement de la procédure de paiement via le Serveur Render
  const handleLaunchPayment = async () => {
    if (!clientInfo) return;
    setLoading(true);
    setError(null);

    try {
      // Requête sécurisée au Serveur Render (POST vers /api/payments)
      const response = await axios.post(INIT_PAYMENT_URL, {
        userId: clientInfo.id,
        amount: totalMontant,
        numTickets: nbTickets,
        provider: plateforme,
      });

      if (response.data && response.data.checkoutPageUrlWithPaymentToken) {
        // Rediriger l'utilisateur vers la page de paiement Yengapay
        window.location.href = response.data.checkoutPageUrlWithPaymentToken;
      } else {
        setError('Erreur lors de l\'initialisation du paiement (réponse serveur invalide).');
      }

    } catch (err) {
      console.error('Erreur Yengapay/Serveur:', err.response?.data?.error || err.message);
      setError(`Erreur de communication avec le service de paiement: ${err.response?.data?.error || err.message}.`);
    } finally {
      setLoading(false);
    }
  };

  if (loading && !clientInfo) return <div style={{ textAlign: 'center', marginTop: '50px' }}>Chargement de vos informations...</div>;
  if (error) return <div style={{ color: 'red', textAlign: 'center', marginTop: '20px' }}>Erreur : {error}</div>;

  return (
    <div className="card-container" style={{ padding: '30px' }}>
      <h2 style={{ color: '#343a40', borderBottom: '1px solid #ddd', paddingBottom: '10px' }}>
        Résumé & Paiement du Ticket
      </h2>

      <div style={{ border: '1px solid #007BFF', backgroundColor: '#e9f5ff', padding: '15px', borderRadius: '8px', marginBottom: '25px' }}>
        <h4 style={{ margin: '0 0 10px 0', color: '#007BFF' }}>Vérifiez vos informations :</h4>
        <p style={{ margin: '5px 0' }}>**Nom:** {clientInfo.nom} {clientInfo.prenom}</p>
        <p style={{ margin: '5px 0' }}>**Téléphone:** {clientInfo.telephone}</p>
        <p style={{ margin: '5px 0' }}>**CNIB/CNI:** {clientInfo.reference_cnib}</p>
      </div>

      <div style={{ marginBottom: '20px' }}>
        <label style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold' }}>
          Nombre de tickets :
        </label>
        <input
          type="number"
          value={nbTickets}
          min="1"
          onChange={(e) => setNbTickets(Math.max(1, parseInt(e.target.value) || 1))}
          style={{ width: '20%', padding: '10px', borderRadius: '4px', border: '1px solid #ccc' }}
        />
      </div>

      <h3 style={{ fontSize: '1.8rem', color: '#007BFF', marginBottom: '25px', padding: '10px', border: '1px dashed #007BFF', borderRadius: '4px' }}>
        Montant Total : {totalMontant} XOF
      </h3>

      <div style={{ marginBottom: '30px' }}>
        <label style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold' }}>
          Plateforme de paiement :
        </label>
        <select
          value={plateforme}
          onChange={(e) => setPlateforme(e.target.value)}
          style={{ width: '97%', padding: '10px', borderRadius: '4px', border: '1px solid #ccc' }}
        >
          <option value="MTN">MTN Mobile Money</option>
          <option value="ORANGE">Orange Money</option>
        </select>
      </div>

      <button onClick={handleLaunchPayment} disabled={loading} style={{ backgroundColor: '#007BFF' }}>
        {loading ? 'Redirection vers le paiement...' : `Payer ${totalMontant} XOF`}
      </button>
    </div>
  );
};

export default PaiementPage;
