import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios'; 

// !!! CRITIQUE : REMPLACEZ PAR L'URL DE VOTRE BACKEND RENDER OU LOCAL !!!
const BACKEND_URL = 'https://loto-backend-83zb.onrender.com'; 

const InscriptionPage = () => {
    const [formData, setFormData] = useState({
        nom: '',        
        prenom: '',     
        email: '',
        telephone: '',
        reference_cnib: '' // Nom du champ dans le formulaire
    });
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);

        // 1. Préparation des données pour le backend
        const dataToSend = {
            nom: formData.nom,
            prenom: formData.prenom,
            // S'assure que l'email est envoyé (même s'il est null)
            email: formData.email || null, 
            telephone: formData.telephone,
            // 🎯 Le backend déstructure 'reference_cni', donc on l'envoie sous ce nom.
            reference_cni: formData.reference_cnib 
        };

        try {
            // 2. Appel de la route sécurisée de votre backend Express
            const response = await axios.post(
                `${BACKEND_URL}/api/register-user`, 
                dataToSend
            );

            const userId = response.data.user.id;
            
            // 3. Redirige vers la page de paiement
            navigate(`/paiement/${userId}`);

        } catch (error) {
            
            console.error("Erreur d'inscription:", error.response ? error.response.data.error : error.message);
            
            const errorMessage = error.response ? error.response.data.error : "Échec de connexion au serveur. Vérifiez l'URL du backend.";
            
            alert(`Erreur lors de l'enregistrement : ${errorMessage}`);
            
        } finally {
            setLoading(false);
        }
    };
    
    // --- Styles CSS pour les Inputs et Boutons ---
    const inputStyle = { 
        width: '100%', 
        padding: '12px', 
        margin: '10px 0', 
        borderRadius: '4px', 
        border: '1px solid #ccc',
        boxSizing: 'border-box' 
    };

    const buttonStyle = {
        marginTop: '20px', 
        backgroundColor: loading ? '#6c757d' : '#28a745', // 🟢 Couleur Verte
        color: 'white',
        padding: '12px 20px',
        border: 'none',
        borderRadius: '4px',
        cursor: 'pointer',
        fontSize: '16px',
        width: '100%' 
    };
    // ---------------------------------------------


    return (
        <div className="card-container" style={{ maxWidth: '400px', margin: '50px auto', padding: '30px', boxShadow: '0 4px 8px rgba(0,0,0,0.1)', borderRadius: '8px' }}>
            <h2 style={{ color: '#343a40', borderBottom: '1px solid #ddd', paddingBottom: '10px', textAlign: 'center' }}>
                Votre Accès LotoEmploi
            </h2>
            <form onSubmit={handleSubmit}>
                
                <input
                    type="text"
                    name="prenom"
                    placeholder="Prénom(s)"
                    value={formData.prenom}
                    onChange={handleChange}
                    required
                    style={inputStyle}
                />
                
                <input
                    type="text"
                    name="nom"
                    placeholder="Nom de famille"
                    value={formData.nom}
                    onChange={handleChange}
                    required
                    style={inputStyle}
                />
                
                <input
                    type="email"
                    name="email"
                    placeholder="Adresse Email"
                    value={formData.email}
                    onChange={handleChange}
                    required
                    style={inputStyle}
                />
                
                <input
                    type="tel"
                    name="telephone"
                    // 📞 Texte mis à jour
                    placeholder="Téléphone (WhatsApp/Mobile Money)" 
                    value={formData.telephone}
                    onChange={handleChange}
                    required
                    style={inputStyle}
                />
                
                <input
                    type="text"
                    name="reference_cnib" 
                    placeholder="Référence CNIB (ou CNI)"
                    value={formData.reference_cnib}
                    onChange={handleChange}
                    required
                    style={inputStyle}
                />
                
                <button type="submit" disabled={loading} style={buttonStyle}>
                    {loading ? 'Enregistrement...' : 'Continuer vers le paiement'}
                </button>
            </form>
        </div>
    );
};

export default InscriptionPage;
