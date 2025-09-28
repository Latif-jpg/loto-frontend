import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../supabaseClient';

const InscriptionPage = () => {
  const [formData, setFormData] = useState({
    // Mise à jour de l'état pour séparer nom et prenom
    nom: '',        // Nom de famille
    prenom: '',     // Prénom(s)
    email: '',
    telephone: '',
    reference_cnib: ''
  });
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      // 1. Insertion dans la table 'utilisateurs'
      // Tous les champs OBLIGATOIRES (nom, prenom, email, telephone, reference_cnib) sont envoyés.
      // La colonne 'created_at' (ou 'date_inscription') est gérée par Supabase.
      const { data, error } = await supabase
        .from('utilisateurs')
        .insert([{
            ...formData
        }])
        .select();

      if (error) throw error;

      const userId = data[0].id;

      // Redirige vers la page de paiement avec l'ID de l'utilisateur
      navigate(`/paiement/${userId}`);

    } catch (error) {
      console.error("Erreur d'inscription:", error.message);
      // Afficher un message d'erreur plus clair à l'utilisateur
      alert(`Erreur lors de l'enregistrement : ${error.message.includes('null value') ? "Un champ obligatoire est manquant (vérifiez Prénom)." : error.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="card-container" style={{ padding: '30px' }}>
      <h2 style={{ color: '#343a40', borderBottom: '1px solid #ddd', paddingBottom: '10px' }}>
        Votre Accès LotoEmploi
      </h2>
      <form onSubmit={handleSubmit}>
        {/* NOUVEAU CHAMP: Prénom */}
        <input
          type="text"
          name="prenom"
          placeholder="Prénom(s)"
          value={formData.prenom}
          onChange={handleChange}
          required
          style={{ width: '95%', padding: '12px', margin: '10px 0', borderRadius: '4px', border: '1px solid #ccc' }}
        />
        {/* CHAMP EXISTANT: Nom (de famille) */}
        <input
          type="text"
          name="nom"
          placeholder="Nom de famille"
          value={formData.nom}
          onChange={handleChange}
          required
          style={{ width: '95%', padding: '12px', margin: '10px 0', borderRadius: '4px', border: '1px solid #ccc' }}
        />
        <input
          type="email"
          name="email"
          placeholder="Email"
          value={formData.email}
          onChange={handleChange}
          required
          style={{ width: '95%', padding: '12px', margin: '10px 0', borderRadius: '4px', border: '1px solid #ccc' }}
        />
        <input
          type="tel"
          name="telephone"
          placeholder="Téléphone (Mobile Money)"
          value={formData.telephone}
          onChange={handleChange}
          required
          style={{ width: '95%', padding: '12px', margin: '10px 0', borderRadius: '4px', border: '1px solid #ccc' }}
        />
        <input
          type="text"
          name="reference_cnib"
          placeholder="Référence CNIB (ou CNI)"
          value={formData.reference_cnib}
          onChange={handleChange}
          required
          style={{ width: '95%', padding: '12px', margin: '10px 0', borderRadius: '4px', border: '1px solid #ccc' }}
        />
        <button type="submit" disabled={loading} style={{ marginTop: '20px', backgroundColor: '#007BFF' }}>
          {loading ? 'Enregistrement...' : 'Continuer vers le paiement'}
        </button>
      </form>
    </div>
  );
};

export default InscriptionPage;
