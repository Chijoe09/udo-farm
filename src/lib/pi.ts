/**
 * Pi Network SDK wrapper.
 *
 * The Pi Browser injects `window.Pi`. Outside Pi Browser (regular desktop/mobile
 * chrome), `window.Pi` is undefined and we run in "mock mode" for development.
 *
 * To go live:
 *   1. Register the app on the Pi Developer Portal.
 *   2. Save PI_API_KEY as a Lovable Cloud secret.
 *   3. Set VITE_PI_SANDBOX to "false" for production.
 */

export type PiAuthResult = {
  accessToken: string;
  user: { uid: string; username: string };
};

export type PiPaymentData = {
  amount: number;
  memo: string;
  metadata: Record<string, unknown>;
};

export type PiPaymentCallbacks = {
  onReadyForServerApproval: (paymentId: string) => void | Promise<void>;
  onReadyForServerCompletion: (paymentId: string, txid: string) => void | Promise<void>;
  onCancel: (paymentId: string) => void;
  onError: (error: Error, payment?: unknown) => void;
};

type PiSDK = {
  init: (opts: { version: string; sandbox: boolean }) => void;
  authenticate: (
    scopes: string[],
    onIncompletePaymentFound: (payment: unknown) => void,
  ) => Promise<PiAuthResult>;
  createPayment: (data: PiPaymentData, callbacks: PiPaymentCallbacks) => void;
};

declare global {
  interface Window {
    Pi?: PiSDK;
  }
}

export const isPiBrowser = () =>
  typeof window !== "undefined" && typeof window.Pi !== "undefined";

let initialized = false;
export function initPi() {
  if (initialized || !isPiBrowser()) return;
  const sandbox = (import.meta.env.VITE_PI_SANDBOX ?? "true") !== "false";
  window.Pi!.init({ version: "2.0", sandbox });
  initialized = true;
}

export async function piAuthenticate(): Promise<PiAuthResult> {
  initPi();
  if (!isPiBrowser()) {
    throw new Error("Pi Browser required. Open UDO Farm inside the Pi Browser to sign in.");
  }
  return window.Pi!.authenticate(["username", "payments"], () => {
    // TODO: handle incomplete payments — recover on server via /api/public/pi/complete
  });
}

export function piCreatePayment(
  data: PiPaymentData,
  callbacks: PiPaymentCallbacks,
) {
  initPi();
  if (!isPiBrowser()) {
    throw new Error("Pi Browser required to complete Pi Payments.");
  }
  window.Pi!.createPayment(data, callbacks);
}
