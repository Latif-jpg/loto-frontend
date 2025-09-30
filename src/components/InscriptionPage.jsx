import express from "express";
import cors from "cors";
import { createClient } from "@supabase/supabase-js";
import 'dotenv/config'; 
import axios from 'axios'; 
import twilio from 'twilio'; 

// --- CONFIGURATION INITIALE & CLÉS ---

const app = express();

// --- CONFIGURATION DU BODY PARSER ET CORS ---
app.use(express.json()); 
app.use(express.urlencoded({ extended: true }));

// --- CONFIGURATION PAYDUNYA (Vos clés sont dans .env) ---
const PAYDUNYA_MASTER_KEY = process.env.PAYDUNYA_MASTER_KEY; 
const PAYDUNYA_PRIVATE_KEY = process.env.PAYDUNYA_PRIVATE_KEY; 
const PAYDUNYA_TOKEN = process.env.PAYDUNYA_TOKEN; 
const PAYDUNYA_PUBLIC_KEY = process.env.PAYDUNYA_PUBLIC_KEY; 

const PAYDUNYA_API_URL = `https://app.paydunya.com/sandbox-api/v1/checkout-invoice/create`;
const PAYDUNYA_VERIFY_URL = `https://app.paydunya.com/sandbox-api/v1/checkout-invoice/confirm/`;

// --- CONFIGURATION TWILIO (Vos clés sont dans .env) ---
const TWILIO_ACCOUNT_SID = process.env.TWILIO_ACCOUNT_SID;
const TWILIO_AUTH_TOKEN = process.env.TWILIO_AUTH_TOKEN;
const TWILIO_TEST_TEMPLATE_SID = process.env.TWILIO_TEMPLATE_SID || 'HX350d429d32e64a552466cafecbe95f3c'; 
const TWILIO_WHATSAPP_NUMBER = TWILIO_ACCOUNT_SID ? 'whatsapp:' + process.env.TWILIO_WHATSAPP_NUMBER : null; 
const twilioClient = TWILIO_ACCOUNT_SID && TWILIO_AUTH_TOKEN ? twilio(TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN) : null;


// 🌐 CONFIGURATION CORS 
const allowedOrigins = [
    'http://localhost:5173', 
    'http://localhost:4000', 
    'https://loto-frontend.onrender.com' 
];

const corsOptions = {
    origin: function (origin, callback) {
        if (!origin || allowedOrigins.indexOf(origin) !== -1) {
            callback(null, true);
        } else {
            console.error(`CORS: Origin ${origin} not allowed.`);
            callback(new Error('Not allowed by CORS'), false); 
        }
    },
    methods: "GET,HEAD,PUT,PATCH,POST,DELETE",
    credentials: true,
    optionsSuccessStatus: 204,
    allowedHeaders: ['Content-Type', 'Authorization', 'PAYDUNYA-MASTER-KEY', 'PAYDUNYA-PRIVATE-KEY', 'PAYDUNYA-TOKEN'] 
};

app.use(cors(corsOptions)); 


// ⚡ Config Supabase - SÉCURITÉ CRITIQUE
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY; 

if (!supabaseUrl || !supabaseKey) {
    console.error("ERREUR CRITIQUE: Clés Supabase manquantes.");
    process.exit(1); 
}

const supabase = createClient(supabaseUrl, supabaseKey);


// --- FONCTIONS UTILITAIRES ---

/**
 * Crée une clé unique et normalisée à partir des informations principales.
 * Utilisé pour détecter les doublons.
 */
const createUniqueKey = (nom, prenom, telephone, reference_cnib) => {
    // Fonction utilitaire pour normaliser
    const normalize = (str) => {
        // Le OR logique (|| '') garantit que si str est null/undefined, il devient une chaîne vide.
        const safeStr = String(str || ''); 
        
        return safeStr
               .toLowerCase()
               .replace(/\s/g, '') // Supprime tous les espaces
               .normalize("NFD").replace(/[\u0300-\u036f]/g, ""); // Supprime les accents
    };

    // Concaténer les champs normalisés
    const key = 
        normalize(nom) + 
        '|' + 
        normalize(prenom) + 
        '|' + 
        normalize(telephone) + 
        '|' + 
        normalize(reference_cnib);

    return key;
};

// Logique pour obtenir le code suivant (ex: A000 -> A001)
const getNextCode = (currentCode) => {
    let letter = currentCode.charAt(0);
    let number = parseInt(currentCode.substring(1), 10);

    number++;

    if (number > 999) {
        number = 0; 
        if (letter === 'Z') {
            console.warn("ATTENTION: La limite de tickets (Z999) est atteinte ! Le compteur redémarre à A000.");
            letter = 'A'; 
        } else {
            letter = String.fromCharCode(letter.charCodeAt(0) + 1);
        }
    }

    const paddedNumber = String(number).padStart(3, '0');
    
    return `${letter}${paddedNumber}`;
};

// Fonction asynchrone pour générer un code en toute sécurité via la DB
async function generateAndStoreTicketCode() {
    let newCode;
    let oldCode;

    // 1. Lire le dernier code utilisé
    const { data: configData, error: configError } = await supabase
        .from('configuration')
        .select('value')
        .eq('key', 'last_ticket_code')
        .maybeSingle(); 
    
    if (configError && configError.code !== 'PGRST116') { 
        console.error("Erreur de lecture du compteur de tickets:", configError);
        return null; 
    }
    
    oldCode = configData ? configData.value : 'A000'; 

    // 2. Calculer le nouveau code
    newCode = getNextCode(oldCode);

    // 3. Mettre à jour dans la DB (upsert pour gérer la création si la ligne n'existe pas)
    const { error: updateError } = await supabase
        .from('configuration')
        .upsert([{ key: 'last_ticket_code', value: newCode }], { onConflict: 'key' }); 
        
    if (updateError) {
        console.error("Erreur critique lors de la mise à jour du compteur de tickets:", updateError);
        return null; 
    }

    return newCode;
}


// Fonction d'envoi des tickets par WhatsApp
async function sendWhatsAppTicket(recipientNumber, ticketList, paymentToken) {
    if (!twilioClient || !TWILIO_WHATSAPP_NUMBER || !TWILIO_TEST_TEMPLATE_SID) {
        console.error("Erreur Twilio: Client/Numéro/SID de Template manquant.");
        return;
    }

    // Assurez-vous que le numéro est au format WhatsApp (ex: whatsapp:+226xxxxxxx)
    const whatsappRecipient = 'whatsapp:+226' + recipientNumber.replace(/\s/g, ''); 
    
    const tickets = ticketList.join(', ');
    const frontendUrl = `https://loto-frontend.onrender.com/status/${paymentToken}`;

    try {
        await twilioClient.messages.create({
            from: TWILIO_WHATSAPP_NUMBER, 
            to: whatsappRecipient, 
            contentSid: TWILIO_TEST_TEMPLATE_SID,
            contentVariables: JSON.stringify({
                "1": `la confirmation de vos tickets: ${tickets}`,
                "2": `Consultez votre reçu: ${frontendUrl}`     
            })
        });
        console.log(`WhatsApp template envoyé avec succès au numéro: ${recipientNumber}`);
    } catch (error) {
        console.error(`Erreur d'envoi WhatsApp à ${recipientNumber}:`, error.message);
    }
}


// --- ROUTES API ---

app.get("/", (req, res) => res.send("Backend LotoEmploi fonctionne ! Version V23 (Correction Front/Back)."));

// 0. Route d'Inscription Utilisateur (Table: utilisateurs) - FIND OR CREATE CORRIGÉE
app.post("/api/register-user", async (req, res) => {
    // NOTE : Le frontend envoie reference_cni dans la requête, 
    // qui est ensuite affecté à la variable reference_cnib pour le code interne.
    const { nom, prenom, telephone, reference_cni, email } = req.body;
    
    // Le nom de la colonne DB est reference_cnib, nous utilisons cette variable pour la cohérence.
    const reference_cnib = reference_cni; 

    // 0. Vérification des données critiques
    if (!nom || !prenom || !telephone || !reference_cnib)
        return res.status(400).json({ error: "Les champs Nom, Prénom, Téléphone et Référence CNI sont obligatoires." });
        
    // 1. Création de la clé unique normalisée (maintenant robuste aux NULLs/undefined)
    const uniqueKey = createUniqueKey(nom, prenom, telephone, reference_cnib);

    // 2. Chercher un utilisateur existant en utilisant la clé unique
    let { data: existingUsers, error: searchError } = await supabase
        .from("utilisateurs")
        .select("id")
        .eq("unique_key", uniqueKey); 

    if (searchError) { 
        console.error("Erreur Supabase Recherche:", searchError.message);
        return res.status(500).json({ error: "Erreur lors de la recherche de l'utilisateur existant." });
    }

    if (existingUsers && existingUsers.length > 0) {
        // 3. Utilisateur trouvé. On retourne l'ID existant et on arrête le processus.
        const existingUser = existingUsers[0];
        console.log(`Utilisateur existant trouvé via unique_key: ID ${existingUser.id}. Insertion évitée.`);
        return res.json({ success: true, user: existingUser }); 
    }

    // 4. Utilisateur non trouvé, on insère un nouveau
    const { data, error: insertError } = await supabase
        .from("utilisateurs")
        .insert([{ 
            nom, 
            prenom, 
            telephone, 
            reference_cni: reference_cnib, // Utilisation du nom de colonne correct si c'est 'reference_cni'
            // Si la colonne DB est 'reference_cnib', utilisez reference_cnib: reference_cnib,
            email,
            unique_key: uniqueKey // <-- Clé unique insérée
        }])
        .select("id, nom, prenom, telephone, reference_cni"); 

    if (insertError) {
        console.error("Erreur Supabase Inscription:", insertError.message);
        return res.status(500).json({ 
            error: "Erreur lors de l'inscription. Un conflit non géré a été détecté.", 
            details: insertError.message
        });
    }
    
    // 5. Retourner le nouvel utilisateur inséré
    res.json({ success: true, user: data[0] });
});


// 1. Route d'Initialisation de Paiement (Passage à PayDunya)
app.post("/api/payments", async (req, res) => {
    const { userId, amount, provider, numTickets } = req.body; 
    
    // --- ÉTAPE 1 : RÉCUPÉRER LES INFOS CLIENT DE SUPABASE ---
    const { data: userData, error: userError } = await supabase
        .from("utilisateurs")
        .select("telephone, email, nom, prenom") 
        .eq("id", userId)
        .single();
        
    if (userError || !userData) {
        console.error("Erreur Supabase: Utilisateur non trouvé pour le paiement:", userError?.message);
        return res.status(404).json({ error: "Informations utilisateur requises non trouvées." });
    }

    const customerPhone = userData.telephone;
    const customerEmail = userData.email || "noreply@lotoemploi.com"; 
    const customerName = `${userData.prenom} ${userData.nom}`;
    
    if (!userId || !amount || !numTickets || !PAYDUNYA_MASTER_KEY || !PAYDUNYA_PRIVATE_KEY || !PAYDUNYA_TOKEN || !PAYDUNYA_PUBLIC_KEY) 
        return res.status(500).json({ error: "Erreur de communication avec le service de paiement: Clés PayDunya non définies." });

    const paymentToken = `${Date.now()}-${userId}`;

    // Les URLs de retour et de callback sont désormais sécurisées pour le Render
    const BACKEND_URL = `https://loto-backend-83zb.onrender.com`; // Remplacez par votre URL Render
    const RETURN_URL = `${BACKEND_URL}/api/payment-return/${paymentToken}`; 
    const CALLBACK_URL = `${BACKEND_URL}/api/confirm-payment`; 

    try {
        // ÉTAPE 2 : APPEL À L'API PAYDUNYA POUR CRÉER LA FACTURE
        const payDuniaResponse = await axios.post(
            PAYDUNYA_API_URL, 
            {
                "invoice": {
                    "total_amount": amount, 
                    "description": `${numTickets} Tickets Loto Emploi`,
                    "items": [
                        {
                            "name": `${numTickets} Tickets Loto Emploi`,
                            "quantity": 1, 
                            "unit_price": amount,
                            "total_price": amount,
                            "description": "Achat de tickets de tombola pour l'emploi"
                        }
                    ],
                    "customer": {
                        "name": customerName, 
                        "email": customerEmail,
                        "phone": customerPhone 
                    },
                    "actions": {
                        "cancel_url": RETURN_URL,
                        "return_url": RETURN_URL, 
                        "callback_url": CALLBACK_URL 
                    }
                },
                "store": { 
                    "name": "Loto Emploi Test" 
                },
                "public_key": PAYDUNYA_PUBLIC_KEY,
                "custom_data": { 
                    "payment_token": paymentToken, 
                    "user_id": userId 
                }
            },
            {
                headers: {
                    'PAYDUNYA-MASTER-KEY': PAYDUNYA_MASTER_KEY, 
                    'PAYDUNYA-PRIVATE-KEY': PAYDUNYA_PRIVATE_KEY, 
                    'PAYDUNYA-TOKEN': PAYDUNYA_TOKEN, 
                    'Content-Type': 'application/json'
                }
            }
        );

        const responseData = payDuniaResponse.data;

        if (responseData.response_code !== '00') {
             console.error("Erreur PayDunia:", responseData);
             throw new Error(`PayDunia Rejet (${responseData.response_text || responseData.message || 'Erreur inconnue'})`);
        }

        const checkoutUrl = responseData.response_text; 

        // ÉTAPE 3 : ENREGISTREMENT DANS SUPABASE
        const { data, error } = await supabase
            .from("payments") 
            .insert([{ 
                user_id: userId, 
                status: "pending",
                totalamount: amount, 
                platform: provider, 
                numtickets: numTickets, 
                payment_token: paymentToken,
                invoice_token: responseData.token 
            }])
            .select();

        if (error) {
            console.error("Erreur Supabase à l'insertion (Critique):", error.message); 
        }

        // ÉTAPE 4 : RENVOI DE L'URL AU FRONTEND
        res.json({ success: true, checkoutPageUrlWithPaymentToken: checkoutUrl });

    } catch (apiError) {
        console.error("Erreur API PayDunya (Requête POST échouée):", apiError.response ? apiError.response.data : apiError.message);
        
        let errorMessage = "Échec de l'initialisation du paiement PayDunya.";
        if (apiError.response && apiError.response.data && apiError.response.data.response_text) {
             errorMessage += ` Détails: ${apiError.response.data.response_text}`;
        } else if (apiError.message) {
             errorMessage += ` Détails techniques: ${apiError.message}`;
        }
        
        return res.status(500).json({ error: errorMessage });
    }
});


// 2. Route de Vérification de Statut (Consultée par le Frontend)
app.get("/api/payments/status/:token", async (req, res) => {
    const { token } = req.params;
    
    const { data: txData, error: txError } = await supabase
        .from("payments")
        .select("status, tickets, numtickets, totalamount, user_id") 
        .eq("payment_token", token)
        .single();

    if (txError) {
        return res.status(404).json({ status: "error", message: "Transaction introuvable ou erreur DB." });
    }

    res.json({
        status: txData.status,
        tickets: txData.tickets,
        nbTickets: txData.numtickets,
        amount: txData.totalamount 
    });
});


// 3. Webhook PayDunya (IPN) - Pour la mise à jour asynchrone ET l'envoi WhatsApp
app.post("/api/confirm-payment", async (req, res) => {
    const payDuniaIPN = req.body || {}; 
    
    const invoiceToken = (payDuniaIPN.data && payDuniaIPN.data.invoice && payDuniaIPN.data.invoice.token) 
                       || payDuniaIPN.invoice_token; 
    
    if (!invoiceToken) {
        console.error("Webhook Erreur: Invoice Token manquant.", payDuniaIPN);
        return res.status(200).send("Invoice Token manquant.");
    }

    const { data: txData, error: txError } = await supabase
        .from("payments")
        .select("id, status, numtickets, user_id, payment_token") 
        .eq("invoice_token", invoiceToken) 
        .single();
    
    if (txError || !txData) {
        console.error("Webhook Erreur: Transaction non trouvée avec l'Invoice Token.", invoiceToken);
        return res.status(200).send("Transaction DB non trouvée.");
    }

    // VÉRIFICATION DU STATUT DE LA TRANSACTION VIA L'API DE VÉRIFICATION PAYDUNYA
    try {
        const verificationResponse = await axios.get(
            `${PAYDUNYA_VERIFY_URL}${invoiceToken}`,
            {
                headers: {
                    'PAYDUNYA-MASTER-KEY': PAYDUNYA_MASTER_KEY,
                    'PAYDUNYA-PRIVATE-KEY': PAYDUNYA_PRIVATE_KEY, 
                    'PAYDUNYA-TOKEN': PAYDUNYA_TOKEN,
                    'Content-Type': 'application/json'
                }
            }
        );

        const verifiedData = verificationResponse.data;
        
        if (verifiedData.status === "completed" && verifiedData.response_code === '00') {
            
            if (txData.status === "pending") {
                let tickets = [];
                for (let i = 0; i < txData.numtickets; i++) { 
                    const ticketCode = await generateAndStoreTicketCode(); 
                    if (ticketCode) {
                        tickets.push(ticketCode);
                    } else {
                        console.error("CRITIQUE: Échec de la génération du code de ticket séquentiel.");
                    }
                }
                
                // Mettre à jour le statut et générer les tickets
                const { error: updateError } = await supabase.from("payments").update({ 
                    status: "paid", 
                    tickets: tickets 
                }).eq("id", txData.id);

                if (updateError) {
                    console.error("Erreur Supabase lors de la mise à jour du statut:", updateError.message);
                } else {
                    console.log(`Webhook Succès: Paiement ID ${txData.id} mis à jour à 'paid'.`);
                    
                    // ENVOI WHATSAPP 
                    const { data: userData, error: userErr } = await supabase
                        .from("utilisateurs")
                        .select("telephone")
                        .eq("id", txData.user_id)
                        .single();
                        
                    if (userData?.telephone) {
                        sendWhatsAppTicket(userData.telephone, tickets, txData.payment_token);
                    } else {
                        console.warn("Impossible d'envoyer le WhatsApp: Données utilisateur manquantes.");
                    }
                }
            }
        } else {
             console.log(`Webhook Info: Paiement ID ${txData.id} a un statut vérifié: ${verifiedData.status}`);
        }
    } catch (error) {
         console.error("Erreur Webhook lors de la vérification de statut PayDunia:", error.message);
    }
    
    res.status(200).send("Webhook PayDunya reçu et traité.");
});


// 4. Route de Redirection Sécurisée (RETURN_URL PayDunya)
app.get("/api/payment-return/:token", async (req, res) => {
    const { token } = req.params; 
    
    const { data: txData, error: txError } = await supabase
        .from("payments")
        .select("status") 
        .eq("payment_token", token)
        .single();
        
    if (txError || !txData) {
        console.error(`Erreur Redirection : Transaction introuvable pour le token ${token}`);
        // Redirige vers une page d'erreur en cas de problème critique
        return res.redirect(302, `https://loto-frontend.onrender.com/status/error?msg=TX_NOT_FOUND`);
    }

    const finalFrontendUrl = `https://loto-frontend.onrender.com/status/${token}`;

    console.log(`✅ Redirection vers la page de tickets pour le token: ${token}. Statut: ${txData.status}`);
    
    // Redirection finale vers l'URL du frontend
    return res.redirect(302, finalFrontendUrl); 
});


// --- DÉMARRAGE DU SERVEUR ---

const PORT = process.env.PORT || 10000; 
app.listen(PORT, () => console.log(`🚀 Serveur démarré sur le port ${PORT}`));
