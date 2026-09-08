import config from "../config/index.js";

interface BkashTokenResponse {
  id_token: string;
  token_type: string;
  expires_in: number;
  statusCode?: string;
  statusMessage?: string;
}

let bkashToken: string | null = null;
let tokenExpiresAt = 0;

export const getBkashToken = async (): Promise<string> => {
  if (bkashToken && Date.now() < tokenExpiresAt) {
    return bkashToken;
  }

  const response = await fetch(
    `${config.bkash_base_url}/checkout/token/grant`,
    {
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
    },
  );

  const data =
    (await response.json()) as BkashTokenResponse;

  if (!response.ok || !data.id_token) {
    throw new Error(
      data.statusMessage || "Failed to get bKash token",
    );
  }

  bkashToken = data.id_token;

  tokenExpiresAt =
    Date.now() + (data.expires_in - 60) * 1000;

  return bkashToken;
};


interface CreatePaymentResponse {
  paymentID: string;
  bkashURL: string;
  transactionStatus: string;
  amount: string;
  merchantInvoiceNumber: string;
  statusCode?: string;
  statusMessage?: string;
}

export const createBkashPayment = async (
  amount: number,
  merchantInvoiceNumber: string,
) => {
  const token = await getBkashToken();

  const response = await fetch(
    `${config.bkash_base_url}/checkout/payment/create`,
    {
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
    },
  );

  // এখানে debugging করছি
  const responseText = await response.text();

  console.log(
    "========== BKASH CREATE PAYMENT ==========",
  );
  console.log("Status:", response.status);
  console.log(
    "Content-Type:",
    response.headers.get("content-type"),
  );
  console.log("Raw Response:", responseText);
  console.log(
    "==========================================",
  );

  let data: CreatePaymentResponse;

  try {
    data = JSON.parse(responseText);
  } catch (error) {
    console.error("bKash JSON parse error:", error);

    throw new Error(
      `Invalid response from bKash: ${responseText}`,
    );
  }

  if (!response.ok || !data.paymentID) {
    throw new Error(
      data.statusMessage ||
        "Failed to create bKash payment",
    );
  }

  return data;
};


interface ExecutePaymentResponse {
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

export const executeBkashPayment = async (
  paymentID: string,
) => {
  const token = await getBkashToken();

  const response = await fetch(
    `${config.bkash_base_url}/checkout/payment/execute/${paymentID}`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
        Authorization: token,
        "X-APP-Key": config.bkash_app_key,
      },
    },
  );

  const data =
    (await response.json()) as ExecutePaymentResponse;

  if (!response.ok) {
    throw new Error(
      data.statusMessage ||
        "Failed to execute bKash payment",
    );
  }

  return data;
};