import JSEncrypt from "jsencrypt";

addEventListener("message", (event) => {
  const jsEncrypt = new JSEncrypt({ default_key_size: event.data.toString() });

  postMessage([jsEncrypt.getPublicKey(), jsEncrypt.getPrivateKey()]);
});
