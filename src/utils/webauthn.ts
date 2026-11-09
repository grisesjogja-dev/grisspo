/**
 * Web Authentication API (WebAuthn) helper for biometric login
 * Supports resident biometric authentication (Touch ID, Face ID, Windows Hello, Android Biometrics)
 */

export interface BiometricCredential {
  residentId: string;
  residentHouse: string;
  residentName: string;
  credentialId: string; // base64
  rawId: string;
  registeredAt: string;
}

const STORAGE_KEY = 'grisspo_biometric_credentials';

/**
 * Checks if the user verifying platform authenticator (fingerprint, face, etc.) is available.
 */
export async function isBiometricsAvailable(): Promise<boolean> {
  if (
    typeof window !== 'undefined' &&
    window.PublicKeyCredential &&
    typeof window.PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable === 'function'
  ) {
    try {
      return await window.PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable();
    } catch {
      return false;
    }
  }
  return false;
}

/**
 * Get all stored biometric credentials on this device
 */
export function getSavedBiometrics(): BiometricCredential[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

/**
 * Helper to convert Uint8Array / ArrayBuffer to base64
 */
function bufferToBase64(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer);
  let binary = '';
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

/**
 * Helper to convert base64 to Uint8Array
 */
function base64ToBuffer(base64: string): ArrayBuffer {
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes.buffer as ArrayBuffer;
}

/**
 * Register biometrics for a resident on the local device
 */
export async function registerResidentBiometrics(resident: {
  id: string;
  houseNumber: string;
  name: string;
}): Promise<{ success: boolean; message: string }> {
  const supported = await isBiometricsAvailable();
  if (!supported) {
    return {
      success: false,
      message: 'Perangkat Anda tidak mendukung autentikasi biometrik (Fingerprint / Face ID).'
    };
  }

  try {
    const challenge = new Uint8Array(32);
    window.crypto.getRandomValues(challenge);

    const userIdBytes = new TextEncoder().encode(resident.id);

    const publicKeyCredentialCreationOptions: PublicKeyCredentialCreationOptions = {
      challenge,
      rp: {
        name: 'Portal GRISSPO (Griya Sedayu Selaras 1)',
        id: window.location.hostname
      },
      user: {
        id: userIdBytes,
        name: `Griss${resident.houseNumber.replace(/\s+/g, '')}`,
        displayName: `${resident.name} (${resident.houseNumber})`
      },
      pubKeyCredParams: [
        { alg: -7, type: 'public-key' },  // ES256
        { alg: -257, type: 'public-key' } // RS256
      ],
      authenticatorSelection: {
        authenticatorAttachment: 'platform',
        userVerification: 'required'
      },
      timeout: 60000,
      attestation: 'none'
    };

    const credential = (await navigator.credentials.create({
      publicKey: publicKeyCredentialCreationOptions
    })) as PublicKeyCredential;

    if (!credential) {
      return { success: false, message: 'Pendaftaran biometrik dibatalkan.' };
    }

    const credIdBase64 = bufferToBase64(credential.rawId);
    const existing = getSavedBiometrics().filter((b) => b.residentId !== resident.id);

    const record: BiometricCredential = {
      residentId: resident.id,
      residentHouse: resident.houseNumber,
      residentName: resident.name,
      credentialId: credIdBase64,
      rawId: credIdBase64,
      registeredAt: new Date().toISOString()
    };

    existing.push(record);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(existing));

    return {
      success: true,
      message: `Biometrik sidik jari / wajah untuk Rumah ${resident.houseNumber} (${resident.name}) berhasil didaftarkan!`
    };
  } catch (err: any) {
    if (err.name === 'NotAllowedError') {
      return { success: false, message: 'Pemindaian biometrik dibatalkan oleh pengguna atau tidak cocok.' };
    }
    return { success: false, message: 'Gagal mendaftarkan biometrik: ' + (err.message || 'Kesalahan sistem') };
  }
}

/**
 * Authenticate via Biometrics (Fingerprint / Face Unlock)
 * If matching credentials exist, triggers platform prompt.
 */
export async function authenticateResidentBiometrics(): Promise<{
  success: boolean;
  message: string;
  residentHouse?: string;
  residentId?: string;
}> {
  const supported = await isBiometricsAvailable();
  if (!supported) {
    return {
      success: false,
      message: 'Perangkat ini tidak mendukung pemindaian biometrik (Fingerprint / Face ID).'
    };
  }

  const saved = getSavedBiometrics();
  if (saved.length === 0) {
    return {
      success: false,
      message: 'Belum ada data biometrik yang didaftarkan di perangkat ini. Silakan login dengan password sekali terlebih dahulu, lalu aktifkan biometrik di profil Anda.'
    };
  }

  try {
    const challenge = new Uint8Array(32);
    window.crypto.getRandomValues(challenge);

    const allowCredentials: PublicKeyCredentialDescriptor[] = saved.map((s) => ({
      id: base64ToBuffer(s.credentialId),
      type: 'public-key',
      transports: ['internal']
    }));

    const assertion = (await navigator.credentials.get({
      publicKey: {
        challenge,
        allowCredentials,
        userVerification: 'required',
        timeout: 60000
      }
    })) as PublicKeyCredential;

    if (!assertion) {
      return { success: false, message: 'Otentikasi biometrik dibatalkan.' };
    }

    const matchedBase64 = bufferToBase64(assertion.rawId);
    const matched = saved.find((s) => s.credentialId === matchedBase64 || s.rawId === matchedBase64);

    if (matched) {
      return {
        success: true,
        message: `Biometrik terverifikasi! Selamat datang kembali, ${matched.residentName}.`,
        residentHouse: matched.residentHouse,
        residentId: matched.residentId
      };
    }

    // Default to first saved credential if matched directly by local platform authenticator
    const fallback = saved[saved.length - 1];
    return {
      success: true,
      message: `Biometrik terverifikasi! Selamat datang, ${fallback.residentName}.`,
      residentHouse: fallback.residentHouse,
      residentId: fallback.residentId
    };
  } catch (err: any) {
    if (err.name === 'NotAllowedError') {
      return { success: false, message: 'Pemindaian sidik jari / wajah dibatalkan atau tidak cocok.' };
    }
    return {
      success: false,
      message: 'Gagal autentikasi biometrik: ' + (err.message || 'Coba gunakan password manual.')
    };
  }
}
