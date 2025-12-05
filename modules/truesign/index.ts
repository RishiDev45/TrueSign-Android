import { requireNativeModule } from 'expo-modules-core';

// WE FIXED THE NAME HERE: It must be 'TrueSign', not 'TrueSignModule'
const TrueSign = requireNativeModule('TrueSign');

export function initializeKeys() {
  return TrueSign.initializeKeys();
}

export function signData(data: string) {
  return TrueSign.signData(data);
}

export function getPublicKey() {
  return TrueSign.getPublicKey();
}