import config from "../config/index.js";

interface BkashTokenResponse {
  id_token: string;
  token_type: string;
  expires_in: number;
  refresh_token?: string;
  statusCode?: string;
  statusMessage?: string;
}

interface BkashCreatePaymentResponse {
  paymentID: string;
  bkashURL: string;
  paymentCreateTime?: string;
  transactionStatus: string;
  amount: string;
  currency: string;
  intent: string;
  merchantInvoiceNumber: string;
  statusCode?: string;
  statusMessage?: string;
}

interface BkashExecutePaymentResponse {
  paymentID: string;
  trxID: string;
  transactionStatus: string;
  amount: string;
  currency: string;
  intent: string;
  merchantInvoiceNumber: string;
  statusCode?: string;
  statusMessage?: string;
}

let bkashToken: string | null = null;
let tokenExpiresAt = 0;

/* =========================================
   GET BKASH TOKEN
========================================= */

export const getBkashToken = async (): Promise<string> => {
  // Reuse token if still valid
  if (bkashToken && Date.now() < tokenExpiresAt) {
    return bkashToken;
  }

  const url =
    `${config.bkash_base_url}/checkout/token/grant`;

  console.log("========== BKASH TOKEN REQUEST ==========");
  console.log("URL:", url);
  console.log("=========================================");

  const response = await fetch(url, {
    method: "POST",

    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",

      username: config.bkash_username,
      password: config.bkash_password,
    },

    body: JSON.stringify({
      app_key: config.bkash_app_key,
      app_secret: config.bkash_app_secret,
    }),
  });

  const responseText = await response.text();

  console.log("========== BKASH TOKEN RESPONSE ==========");
  console.log("Status:", response.status);
  console.log("Response:", responseText);
  console.log("==========================================");

  let data: BkashTokenResponse;

  try {
    data = JSON.parse(responseText);
  } catch {
    throw new Error(
      `Invalid JSON response from bKash token API: ${responseText}`,
    );
  }

  if (!response.ok || !data.id_token) {
    throw new Error(
      data.statusMessage ||
        `Failed to get bKash access token. Status: ${response.status}`,
    );
  }

  bkashToken = data.id_token;

  const expiresIn = data.expires_in || 3600;

  tokenExpiresAt =
    Date.now() + Math.max(expiresIn - 60, 60) * 1000;

  console.log("✅ bKash token received successfully");

  return bkashToken;
};


/* =========================================
   CREATE PAYMENT
========================================= */

export const createBkashPayment = async (
  amount: number,
  merchantInvoiceNumber: string,
) => {
  const token = await getBkashToken();

  const url =
    `${config.bkash_base_url}/checkout/create`;

  console.log("========== BKASH CREATE REQUEST ==========");
  console.log("URL:", url);
  console.log("==========================================");

  const response = await fetch(url, {
    method: "POST",

    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",

      Authorization: token,
      "X-APP-Key": config.bkash_app_key,
    },

    body: JSON.stringify({
      mode: "0011",

      payerReference: " ",
      
      callbackURL: config.bkash_callback_url,

      amount: amount.toFixed(2),

      currency: "BDT",

      intent: "sale",

      merchantInvoiceNumber,
    }),
  });

  const responseText = await response.text();

  console.log("========== BKASH CREATE RESPONSE ==========");
  console.log("Status:", response.status);
  console.log("Response:", responseText);
  console.log("===========================================");

  let data: BkashCreatePaymentResponse;

  try {
    data = JSON.parse(responseText);
  } catch {
    throw new Error(
      `Invalid JSON response from bKash create API: ${responseText}`,
    );
  }

  if (!response.ok || !data.paymentID) {
    throw new Error(
      data.statusMessage ||
        `Failed to create bKash payment. Status: ${response.status}`,
    );
  }

  console.log("✅ bKash payment created");
  console.log("Payment ID:", data.paymentID);
  console.log("bKash URL:", data.bkashURL);

  return data;
};


/* =========================================
   EXECUTE PAYMENT
========================================= */

export const executeBkashPayment = async (
  paymentID: string,
) => {
  const token = await getBkashToken();

  const url =
    `${config.bkash_base_url}/checkout/execute`;

  console.log("========== BKASH EXECUTE REQUEST ==========");
  console.log("URL:", url);
  console.log("===========================================");

  const response = await fetch(url, {
    method: "POST",

    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",

      Authorization: token,
      "X-APP-Key": config.bkash_app_key,
    },

    body: JSON.stringify({
      paymentID,
    }),
  });

  const responseText = await response.text();

  console.log("========== BKASH EXECUTE RESPONSE ==========");
  console.log("Status:", response.status);
  console.log("Response:", responseText);
  console.log("============================================");

  let data: BkashExecutePaymentResponse;

  try {
    data = JSON.parse(responseText);
  } catch {
    throw new Error(
      `Invalid JSON response from bKash execute API: ${responseText}`,
    );
  }

  if (!response.ok) {
    throw new Error(
      data.statusMessage ||
        `Failed to execute bKash payment. Status: ${response.status}`,
    );
  }

  console.log("✅ bKash payment executed");

  return data;
};