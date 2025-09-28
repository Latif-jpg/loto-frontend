export const PAYMENT_PROVIDERS = [
  { id: "orange", name: "Orange Money" },
  { id: "mtn", name: "MTN Mobile Money" },
];

// Fonction pour créer un paiement
export const createPayment = async ({ userId, amount, provider, numTickets }) => {
  const response = await fetch("http://localhost:5000/api/payments", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ userId, amount, provider, numTickets }),
  });

  if (!response.ok) {
    throw new Error("Erreur lors de la création du paiement");
  }

  const data = await response.json();
  return data.checkoutPageUrlWithPaymentToken;
};
