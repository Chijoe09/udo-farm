/**
 * Pi Network SDK wrapper.
 *
 * The Pi Browser injects `window.Pi` via the SDK script loaded in __root.tsx.
 * Outside Pi Browser, `window.Pi` never appears and calls throw.
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
  init: (opts: { version: string; sandbox: boolean }) => void | Promise<void>;
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

/** Wait for the Pi SDK script (loaded async in __root.tsx) to attach window.Pi. */
async function waitForPiSDK(timeoutMs = 4000): Promise<PiSDK | null> {
  if (typeof window === "undefined") return null;
  if (window.Pi) return window.Pi;
  const start = Date.now();
  return new Promise((resolve) => {
    const tick = () => {
      if (window.Pi) return resolve(window.Pi);
      if (Date.now() - start > timeoutMs) return resolve(null);
      setTimeout(tick, 100);
    };
    tick();
  });
}

export async function isPiBrowser(): Promise<boolean> {
  const sdk = await waitForPiSDK();
  return sdk !== null;
}

export function isPiBrowserSync(): boolean {
  return typeof window !== "undefined" && typeof window.Pi !== "undefined";
}

export const PI_SCOPES = ["username", "payments"];

let initPromise: Promise<void> | null = null;
export function initPi(): Promise<void> {
  if (initPromise) return initPromise;
  initPromise = (async () => {
    const sdk = await waitForPiSDK();
    if (!sdk) throw new Error("Pi SDK not available. Open UDO Farm inside the Pi Browser.");
    await Promise.resolve(sdk.init({ version: "2.0", sandbox: false }));
  })();
  return initPromise;
}

export async function piAuthenticate(): Promise<PiAuthResult> {
  await initPi();
  return window.Pi!.authenticate(PI_SCOPES, () => {
    // The buyer can safely retry checkout; incomplete payments are not auto-completed.
  });
}

export async function piCreatePayment(
  data: PiPaymentData,
  callbacks: PiPaymentCallbacks,
) {
  await initPi();
  window.Pi!.createPayment(data, callbacks);
}
