
import { SubscriptionStatus } from '../types';

// Hardcoded Nigerian Bank Details
export const BANK_DETAILS = {
  bankName: "Guaranty Trust Bank (GTB)",
  accountNumber: "0123456789",
  accountName: "FOREX BOT GLOBAL LTD",
  amountNGN: 50000,
  currency: "NGN"
};

const STORAGE_KEY = 'payment_status_v1';

export const getStoredSubscription = (): SubscriptionStatus => {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    return (stored as SubscriptionStatus) || SubscriptionStatus.FREE;
  } catch {
    return SubscriptionStatus.FREE;
  }
};

export const initiatePaymentVerification = (senderName: string) => {
  // Simulate sending data to backend
  // In a real app, this would POST to an API
  localStorage.setItem(STORAGE_KEY, SubscriptionStatus.PENDING);
  
  // SIMULATION ONLY: Automatically approve after 15 seconds for demonstration
  // In production, this would wait for a webhook from the bank
  setTimeout(() => {
    localStorage.setItem(STORAGE_KEY, SubscriptionStatus.PRO);
  }, 15000);

  return SubscriptionStatus.PENDING;
};

// Check if the backend has confirmed the payment
export const checkPaymentStatus = async (): Promise<SubscriptionStatus> => {
  // Simulate an API poll
  const status = getStoredSubscription();
  return status;
};

export const resetSubscription = () => {
    localStorage.setItem(STORAGE_KEY, SubscriptionStatus.FREE);
};
