import config from "../config/index.js";

export interface BkashTokenResponse {
  id_token: string;
  token_type: string;
  expires_in: number;
  refresh_token?: string;
  statusCode?: string;
  statusMessage?: string;
}

export interface BkashCreatePaymentResponse {
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

export interface BkashExecutePaymentResponse {
  paymentID: string;
  trxID?: string;
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

const BKASH_SUCCESS_CODE = "0000";

const bkashBaseUrl = () => config.bkash_base_url.replace(/\/+$/, "");

const parseJson = <T>(responseText: string, context: string): T => {
  try {
    return JSON.parse(responseText) as T;
  } catch {
    throw new Error(
      `Invalid JSON response from bKash ${context} API: ${responseText}`,
    );
  }
};

const isSuccess = (statusCode?: string) =>
  !statusCode || statusCode === BKASH_SUCCESS_CODE;

const bkashHeaders = (token?: string) => {
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    Accept: "application/json",
    "X-APP-Key": config.bkash_app_key,
  };

  if (token) {
    headers.Authorization = token;
  }

  return headers;
};

export const getBkashToken = async (forceRefresh = false): Promise<string> => {
  if (!forceRefresh && bkashToken && Date.now() < tokenExpiresAt) {
    return bkashToken;
  }

  const url = `${bkashBaseUrl()}/checkout/token/grant`;

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
  const data = parseJson<BkashTokenResponse>(responseText, "token");

  if (!response.ok || !data.id_token || !isSuccess(data.statusCode)) {
    bkashToken = null;
    tokenExpiresAt = 0;
    throw new Error(
      data.statusMessage ||
        `Failed to get bKash access token. Status: ${response.status}`,
    );
  }

  bkashToken = data.id_token;
  const expiresIn = data.expires_in || 3600;
  tokenExpiresAt = Date.now() + Math.max(expiresIn - 60, 60) * 1000;

  return bkashToken;
};

const authorizedRequest = async (
  path: string,
  body: Record<string, string>,
  context: string,
) => {
  const send = async (forceRefresh: boolean) => {
    const token = await getBkashToken(forceRefresh);
    return fetch(`${bkashBaseUrl()}${path}`, {
      method: "POST",
      headers: bkashHeaders(token),
      body: JSON.stringify(body),
    });
  };

  let response = await send(false);

  if (response.status === 401) {
    response = await send(true);
  }

  const responseText = await response.text();
  return {
    response,
    data: parseJson<Record<string, string>>(responseText, context),
    responseText,
  };
};

export const createBkashPayment = async (
  amount: number,
  merchantInvoiceNumber: string,
  payerReference: string,
): Promise<BkashCreatePaymentResponse> => {
  const { response, data } = await authorizedRequest(
    "/checkout/create",
    {
      mode: "0011",
      payerReference: payerReference || "01XXXXXXXXX",
      callbackURL: config.bkash_callback_url,
      amount: amount.toFixed(2),
      currency: "BDT",
      intent: "sale",
      merchantInvoiceNumber,
    },
    "create",
  );

  const payment = data as unknown as BkashCreatePaymentResponse;

  if (!response.ok || !payment.paymentID || !isSuccess(payment.statusCode)) {
    throw new Error(
      payment.statusMessage ||
        `Failed to create bKash payment. Status: ${response.status}`,
    );
  }

  return payment;
};

export const queryBkashPayment = async (
  paymentID: string,
): Promise<BkashExecutePaymentResponse> => {
  const { response, data } = await authorizedRequest(
    "/checkout/payment/status",
    { paymentID },
    "query",
  );

  const result = data as unknown as BkashExecutePaymentResponse;

  if (!response.ok) {
    throw new Error(
      result.statusMessage ||
        `Failed to query bKash payment. Status: ${response.status}`,
    );
  }

  return result;
};

export const executeBkashPayment = async (
  paymentID: string,
): Promise<BkashExecutePaymentResponse> => {
  const { response, data } = await authorizedRequest(
    "/checkout/execute",
    { paymentID },
    "execute",
  );

  const result = data as unknown as BkashExecutePaymentResponse;
  const alreadyExecuted =
    result.statusCode === "2062" ||
    /already executed|already completed/i.test(result.statusMessage || "");

  if (alreadyExecuted) {
    return queryBkashPayment(paymentID);
  }

  if (isSuccess(result.statusCode) || result.trxID) {
    return result;
  }

  if (!response.ok || !result.statusCode) {
    return queryBkashPayment(paymentID);
  }

  throw new Error(
    result.statusMessage ||
      `Failed to execute bKash payment. Status: ${response.status}`,
  );
};
