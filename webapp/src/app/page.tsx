"use client";

import JSEncrypt from "jsencrypt/lib/index.js";

import { useSearchParams } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { use, useEffect, useMemo, useRef, useState } from "react";

import keelinkLogo from "./images/logo.png";

import SessionIdLabel, { LabelState } from "./components/session_id_label";
import {
  PEMtoBase64,
  base64ToArrayBuffer,
  fromSafeBase64,
  log,
  refreshPage,
  toSafeBase64,
  warn,
} from "./utils";
import { alertError, alertInfo, alertWarn, swal } from "./alerts";
import QrCodeImage, { QrCodeState } from "./components/qr_code";
import ClipboardJS from "clipboard";
import HowToSection from "./sections/howto";
import CreditSection from "./sections/credits";
import ContributeSection from "./sections/contribute";
import Footer from "./sections/footer";
import { CopyToClipboardButton } from "./components/button";
import HowItWorksSection from "./sections/how_it_works";
import { DEFAULT_KEY_SIZE, WEAK_KEY_SIZE } from "./constant";
import KeySizeSelector from "./components/key_size_selector";
import {
  clearKeyPair,
  getSavedKeySize,
  loadKeyPair,
  saveKeyPair,
  setSavedKeySize,
} from "./data";

const INVALIDATE_TIMEOUT_SEC = 50;
const REQUEST_INTERVAL = 2000;

const REMINDER_DELETE_CLIPBOARD = 10000;

const GENERATION_WAIT_TIME = 10 * 1000;

const BASE_HOST = "http://localhost:8080";

interface CredentialsResponse {
  status: boolean;
  username: string | undefined | null;
  password: string | undefined | null;
}

let didInitUseEffect1 = false;
let didInitUseEffect2 = false;

export default function Home() {
  const searchParams = useSearchParams();
  const displayOnlyInfo = searchParams?.get("onlyinfo") === "true";

  const jsEncryptRef = useRef<JSEncrypt>();
  const workerRef = useRef<Worker>();
  const [keySize, setKeySize] = useState<number>();

  const [labelState, setLabelState] = useState<LabelState>("init");
  const [sessionId, setSessionId] = useState<string>();
  const [sessionToken, setSessionToken] = useState<string>();
  const [username, setUsername] = useState<string>();
  const [password, setPassword] = useState<string>();
  const [qrCodeState, setQrCodeState] = useState<QrCodeState>("generating");

  const howToRef = useRef<any>();
  const howItWorksRef = useRef<any>();
  const creditsRef = useRef<any>();
  const contributeRef = useRef<any>();

  const clickRef = useRef<any>();

  /*   const credentialsEventSource = useMemo(() => {
    if (sessionId && sessionToken) {
      return 
    }
  }, [sessionId, sessionToken]); */

  /*   const jsEncrypt = useMemo(() => {
    return new JSEncrypt({ default_key_size: keySize.toString() });
  }, [keySize]); */

  /*useEffect(() => {
    const clip = new ClipboardJS("#testBtn");
    clip.on("success", (e) => console.log(e));
    clip.on("error", (e) => console.error(e));
  });*/

  useEffect(() => {
    const keySizeSaved = getSavedKeySize() || DEFAULT_KEY_SIZE;
    const keySizeInput = searchParams?.get("key_size")
      ? parseInt(searchParams?.get("key_size")!)
      : null;

    if (keySizeInput && keySizeInput != keySizeSaved) {
      log(
        `input key size present, that size is different from saved one (${keySizeInput} != ${keySizeSaved}), generate a new one`
      );
      setSavedKeySize(keySizeInput);
      setKeySize(keySizeInput);
      clearKeyPair();
      refreshPage();
      return;
    }

    setKeySize(keySizeSaved);
  }, [searchParams]);

  // Once the key has been loaded/generated, initialize and wait for credentials to arrive
  useEffect(() => {
    if (didInitUseEffect2) return;

    let credentialsEventSource: EventSource | undefined;
    let pollingInterval: NodeJS.Timeout;

    function initClipboardButtons(password: string, username?: string) {
      if (username !== undefined && username !== null) {
        setUsername(username);
      }

      setPassword(password);

      //Clear clipboard button
      var clipClear = new ClipboardJS("#clearBtn");
      clipClear.on("success", function () {
        log("clipboard cleared");
        //copiedSuccess("#clearBtn", true);
      });
      clipClear.on("error", function (e) {
        console.error("failed clear clipboard", e);
        //copiedError("#clearBtn", true);
      });
    }

    async function invalidateSession() {
      if (credentialsEventSource) {
        credentialsEventSource.close();
      }

      // pollingInternal is set only if the credentialsEventSource failed to start
      if (pollingInterval) {
        clearInterval(pollingInterval);
      }
      if (sessionId && sessionToken) await removeEntry(sessionId, sessionToken);

      setQrCodeState("reload");
      setLabelState("invalidated");
    }

    async function onCredentialsReceived(creds: string[]) {
      const [decryptedUsername, decryptedPsw] = creds;
      initClipboardButtons(decryptedUsername, decryptedPsw);

      const copyPsw = await swal.fire({
        title: "Credentials received!",
        text: "Would you copy your password on clipboard? (Also remember to clear your clipboard after usage!)",
        icon: "success",
        confirmButtonText: "Copy",
      });

      if (copyPsw) {
        log("copy directly on clipboard");
        const el = clickRef?.current;
        log("element: " + el);
        el?.click();
      }

      invalidateSession();
    }

    function initAsyncAjaxRequestSSE() {
      credentialsEventSource = new EventSource(
        `${BASE_HOST}/getcredforsid.php?sid=${sessionId}&token=${sessionToken}`
      );
      if (credentialsEventSource) {
        log("attaching listener to EventSource");
        credentialsEventSource.onerror = (err) => {
          console.error("error receiving sse message:", err);
          warn("failing back to polling");
          initAsyncAjaxRequest();
          credentialsEventSource?.close();
          setSessionId(undefined);
        };
        credentialsEventSource.onmessage = (event) => {
          log(`message received: ${event.data}`);
          let creds = checkForCredentials(
            jsEncryptRef.current!,
            JSON.parse(event.data)
          );

          if (creds && creds.length > 0) {
            onCredentialsReceived(creds);
          }
        };
        setTimeout(async function () {
          //Channel is not closed (2) means we did not receive the credentials from the server
          //This should never be true because we want the server to terminate the connection before
          //timeout expires.
          if (
            credentialsEventSource &&
            credentialsEventSource.readyState != 2
          ) {
            warn("credentials NOT received before timeout");
            invalidateSession();
            await alertWarn(
              "No credentials received...",
              "No credential was received in the last minute, reload page to start a new session"
            );
          }
        }, 1000 * INVALIDATE_TIMEOUT_SEC);
      } else {
        warn("unable to attach listeners to EventSource");
      }
    }

    function initAsyncAjaxRequest() {
      console.log("starting legacy credentials retrieve method");

      let invalidateSid = false;
      let requestFinished = true;

      function credentialPolling() {
        if (!invalidateSid) {
          if (requestFinished) {
            requestFinished = false;
            fetch(
              `${BASE_HOST}/getcredforsid.php?sid=${sessionId}&token=${sessionToken}`
            )
              .then((res) => res.json())
              .then((json) => checkForCredentials(jsEncryptRef.current!, json))
              .finally(() => (requestFinished = true));
          } else {
            log("backoff!");
          }
        } else {
          invalidateSession();
          alertWarn(
            "No credentials received...",
            "No credential was received in the last minute, reload page to start a new session"
          );
        }
      }

      pollingInterval = setInterval(credentialPolling, REQUEST_INTERVAL);
      setTimeout(function () {
        invalidateSid = true;
      }, 1000 * INVALIDATE_TIMEOUT_SEC);
    }

    function checkForCredentials(
      jsEncrypt: JSEncrypt,
      data: CredentialsResponse
    ): string[] {
      if (data != undefined && data.status === true) {
        let decryptedUsername: string | undefined,
          decryptedPsw: string | undefined;

        if (data.username === undefined || data.username === null) {
          log("Username was not received");
        } else {
          log("Encoded username: " + data.username);
          data.username = fromSafeBase64(data.username);
          log("Decoded username: " + data.username);
          decryptedUsername = jsEncrypt.decrypt(data.username) || "";
          log("Decrypted username: " + decryptedUsername);
        }

        if (data.password) {
          log("Encoded password: " + data.password);
          data.password = fromSafeBase64(data.password);
          log("Decoded password: " + data.password);
          decryptedPsw = jsEncrypt.decrypt(data.password) || "";
          log("Decrypted password: " + decryptedPsw);

          invalidateSession();

          if (decryptedUsername) {
            return [decryptedPsw, decryptedUsername];
          } else if (decryptedPsw) {
            return [decryptedPsw];
          } else {
            alertError(
              "Error",
              "There was an error, can't decrypt your credentials. Try again..."
            );
          }
        }
      }
      return [];
    }

    if (sessionId && sessionToken && jsEncryptRef) {
      initAsyncAjaxRequestSSE();
      didInitUseEffect2 = true;
    }
  }, [sessionId, sessionToken, jsEncryptRef]);

  // Load/Generate the key pair.
  useEffect(() => {
    function onInitDone(res: [string, string] | undefined) {
      if (res) {
        const [sid, token] = res;
        setSessionId(sid);
        setSessionToken(token);
        setLabelState("waiting_credentials");
        setQrCodeState("valid_session_id");
      } else {
        log("session id and token not available");
      }
    }

    function generateKeyPair(): Promise<JSEncrypt> {
      return new Promise<JSEncrypt>((resolve) => {
        workerRef.current = new Worker(
          new URL("./key_generator.worker.ts", import.meta.url)
        );
        workerRef.current.postMessage(keySize);
        workerRef.current.onmessage = (event: MessageEvent<string[]>) => {
          const [pub_key, prv_key] = event.data;
          const jsEncrypt = new JSEncrypt({});
          jsEncrypt.setPublicKey(pub_key);
          jsEncrypt.setPrivateKey(prv_key);
          resolve(jsEncrypt);
        };
        workerRef.current.onerror = (ev: ErrorEvent) => {
          console.error("web worker error:", ev);
        };
        workerRef.current.onmessageerror = (ev: MessageEvent<any>) => {
          console.error("web worker message error:", ev);
        };
      });
    }

    if (didInitUseEffect1 || !keySize) return;

    setLabelState("key_generation");
    setQrCodeState("generating");

    loadKeyPair()
      .then(
        (jsEncrypt) => {
          log("previous keypair found, using it");
          return jsEncrypt;
        },
        async () => {
          log("no previous saved key pair available in web storage");
          const jsEncrypt = await generateKeyPair();
          saveKeyPair(jsEncrypt.getPublicKey(), jsEncrypt.getPrivateKey());
          return jsEncrypt;
        }
      )
      .then((jsEncrypt) => {
        jsEncryptRef.current = jsEncrypt;
        setLabelState("waiting_sid");
        requestInit(jsEncrypt).then(onInitDone);
      });

    didInitUseEffect1 = true;

    return () => {
      workerRef.current?.terminate();
    };
  }, [keySize, sessionId]);

  useEffect(() => {
    if (labelState == "key_generation") {
      const startTs = new Date();
      const int = setInterval(() => {
        const now = new Date();
        if (now.getTime() > startTs.getTime() + GENERATION_WAIT_TIME) {
          setLabelState("slow_key_generation");
        }
      }, 1000);

      return () => clearInterval(int);
    }
  }, [labelState, keySize]);

  return (
    <main className="container">
      <div className="page-content">
        {/* Navigation Bar */}
        <nav className="navbar">
          <div className="container">
            <ul className="navbar-list">
              <li className="navbar-item">
                <Link className="navbar-link" href="#">
                  <u>KeeLink</u>
                </Link>
              </li>
              <li className="navbar-item">
                <Link
                  className="navbar-link"
                  onClick={(e) => scrollToRef(e, howToRef)}
                  href="#howto"
                >
                  {" "}
                  How To
                </Link>
              </li>
              <li className="navbar-item">
                <Link
                  className="navbar-link"
                  onClick={(e) => scrollToRef(e, howItWorksRef)}
                  href="#howworks"
                >
                  {" "}
                  How it works{" "}
                </Link>
              </li>
              <li className="navbar-item">
                <Link
                  className="navbar-link"
                  onClick={(e) => scrollToRef(e, creditsRef)}
                  href="#credits"
                >
                  Credits
                </Link>
              </li>
              <li className="navbar-item">
                <Link
                  className="navbar-link"
                  onClick={(e) => scrollToRef(e, contributeRef)}
                  href="#contribute"
                >
                  Contribute
                </Link>
              </li>
            </ul>
          </div>
        </nav>
        {/* Center */}
        <div className="content">
          <div className="row">
            <center className="twelve columns">
              <Image
                className="logo-container"
                alt="Keelink logo"
                src={keelinkLogo}
              />
            </center>
          </div>

          <div
            id="qrplaceholder"
            className="container"
            hidden={displayOnlyInfo}
          >
            <div className="row">
              <div className="twelve columns">
                <p className="content-font">
                  <b>
                    Use this QR code to share a credential from Keepass to this
                    device
                  </b>
                </p>
              </div>
            </div>

            <div className="row">
              <div className="twelve columns">&nbsp;</div>
            </div>

            <div className="row">
              <center className="twelve columns">
                <QrCodeImage state={qrCodeState} sid={sessionId} />
              </center>
            </div>

            <div className="row">
              <center className="twelve columns">
                <div className="qrcode" hidden></div>
              </center>
            </div>

            <div className="row">
              <div className="twelve columns">&nbsp;</div>
            </div>

            <div className="row">
              <div className="twelve columns">
                <center className="content-font-small">
                  <b>
                    Your Session ID: <br />{" "}
                    <span id="sidLabel">
                      {
                        <SessionIdLabel
                          state={labelState}
                          sid={sessionId}
                          keySize={keySize || 0}
                          weakKeySize={WEAK_KEY_SIZE}
                        />
                      }
                    </span>
                  </b>
                </center>
                <p className="content-font">
                  {/* Username */}
                  {username && (
                    <CopyToClipboardButton
                      id="copyUserBtn"
                      text="Copy Username"
                      value={username}
                      onSuccess={remindDelete}
                      onSuccessText="Copied!"
                      onErrorText="Error!"
                    />
                  )}

                  {/* Password */}

                  {password && (
                    <CopyToClipboardButton
                      id="copyPassBtn"
                      text="Copy Password"
                      value={password}
                      refs={clickRef}
                      onSuccess={remindDelete}
                      onSuccessText="Copied!"
                      onErrorText="Error!"
                    />
                  )}

                  {/* Clear & Reload button if password received */}
                  {password && (
                    <>
                      <br />
                      <CopyToClipboardButton
                        id="clearBtn"
                        text="Clear clipboard"
                        value=" "
                        onSuccessText="Cleared!"
                        onErrorText="Error!"
                      />
                      <button id="reloadBtn" onClick={refreshPage}>
                        Reload
                      </button>
                    </>
                  )}
                </p>
              </div>
            </div>

            <div className="row">
              <div className="twelve columns">
                <center>
                  {keySize && (
                    <KeySizeSelector
                      currentSize={keySize!}
                      onSelect={(ks) => {
                        clearKeyPair();
                        setSavedKeySize(ks);
                        refreshPage();
                      }}
                    />
                  )}
                </center>
              </div>
            </div>

            <div className="row">
              <div className="twelve columns">&nbsp;</div>
            </div>
          </div>
          <HowToSection refs={howToRef} />
          <HowItWorksSection refs={howItWorksRef} />
          <CreditSection refs={creditsRef} />
          <ContributeSection refs={contributeRef} />
          <Footer />
        </div>
      </div>
    </main>
  );
}

async function removeEntry(sid: string, token: string): Promise<void> {
  const res = await fetch(
    `${BASE_HOST}/removeentry.php?sid=${sid}&token=${token}`,
    {
      method: "POST",
    }
  );

  if (!res.ok) {
    throw `failed to delete the entry for sid: ${sid} (status code: ${res.status})`;
  }
}

async function requestInit(
  crypt: JSEncrypt
): Promise<[string, string] | undefined> {
  log("PEMtoBase64: " + PEMtoBase64(crypt.getPublicKey()));
  log("toSafeBase64: " + toSafeBase64(PEMtoBase64(crypt.getPublicKey())));

  const formData = new FormData();
  formData.append(
    "PUBLIC_KEY",
    toSafeBase64(PEMtoBase64(crypt.getPublicKey()))
  );

  const res = await fetch(`${BASE_HOST}/init.php`, {
    method: "POST",
    body: formData,
  });

  if (res.status === 200) {
    const data = await res.json();

    if (data.status === true) {
      const sid = data["message"].split("###")[0];
      const token = data["message"].split("###")[1];

      return [sid, token];
    } else {
      alertError("Cannot initialize KeeLink", data.message);
    }
  } else {
    alertError(
      "Failed to initialize the service",
      `Error code: ${res.status} (${res.statusText})`
    );
  }
}

function remindDelete() {
  const REMINDER_TITLE = "Don't forget!";
  const REMINDER_BODY =
    "Remember to clear your clipboard, your credentials are still there!";
  setTimeout(function () {
    if (Notification.permission === "granted") {
      var notification = new Notification(REMINDER_TITLE, {
        body: REMINDER_BODY,
      });
    } else if (Notification.permission !== "denied") {
      Notification.requestPermission(function (permission) {
        if (permission === "granted") {
          var notification = new Notification(REMINDER_TITLE, {
            body: REMINDER_BODY,
          });
        }
      });
    }
  }, REMINDER_DELETE_CLIPBOARD);
}

function scrollToRef(evt?: any, refs?: any) {
  evt?.preventDefault();
  refs?.current?.scrollIntoView({ behavior: "smooth" });
}
