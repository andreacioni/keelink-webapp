import JSEncrypt from "jsencrypt";
import { log, warn } from "./utils";

const LOCAL_STORAGE_KEY_SIZE = "key_size";
const LOCAL_STORAGE_CREATED_AT = "created_at";
const LOCAL_STORAGE_PRIVATE_NAME = "private_key";
const LOCAL_STORAGE_PUBLIC_NAME = "public_key";

export function loadKeyPair(): Promise<JSEncrypt> {
  return new Promise<JSEncrypt>((resolve, reject) => {
    //check for presence of an already defined key pair in local storage

    if (hasSavedKeyPair()) {
      //load key from local storage
      const crypt = new JSEncrypt();
      crypt.setPublicKey(localStorage.getItem(LOCAL_STORAGE_PUBLIC_NAME)!);
      crypt.setPrivateKey(localStorage.getItem(LOCAL_STORAGE_PRIVATE_NAME)!);

      resolve(crypt);
    } else {
      reject();
    }
  });
}

export function saveKeyPair(public_key: string, private_key: string) {
  //save generated key pair on the browser internal storage
  if (supportLocalStorage()) {
    log("web storage available, saving generated keys...");

    localStorage.setItem(LOCAL_STORAGE_PUBLIC_NAME, public_key);
    localStorage.setItem(LOCAL_STORAGE_PRIVATE_NAME, private_key);

    log("saved!");
  } else {
    warn("web storage NOT available");
  }
}

export function supportLocalStorage() {
  return typeof Storage !== "undefined";
}

export function getSavedKeySize(): number | null {
  if (!supportLocalStorage()) {
    return null;
  }

  const keySize = localStorage.getItem(LOCAL_STORAGE_KEY_SIZE);

  if (keySize) {
    return Number.parseInt(keySize, 10);
  }

  return null;
}

export function setSavedKeySize(keySize: number): void {
  if (!supportLocalStorage() || isNaN(keySize)) {
    return;
  }

  const keySizeString = keySize.toFixed(0);

  localStorage.setItem(LOCAL_STORAGE_KEY_SIZE, keySizeString);
}

export function clearKeyPair(): void {
  localStorage.removeItem(LOCAL_STORAGE_PRIVATE_NAME);
  localStorage.removeItem(LOCAL_STORAGE_PUBLIC_NAME);
}

export function hasSavedKeyPair() {
  if (supportLocalStorage()) {
    var privateKey = localStorage.getItem(LOCAL_STORAGE_PRIVATE_NAME);
    var publicKey = localStorage.getItem(LOCAL_STORAGE_PUBLIC_NAME);
    if (
      privateKey !== undefined &&
      privateKey !== null &&
      publicKey !== undefined &&
      publicKey !== null
    ) {
      return true;
    }
  }

  return false;
}
