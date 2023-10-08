"use client";

import JSEncrypt from "jsencrypt/lib/index.js";

import { useRouter, useSearchParams } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

import keelinkLogo from "./images/logo.png";

import SessionIdLabel, { LabelState } from "./components/session_id_label";
import { PEMtoBase64, fromSafeBase64, toSafeBase64 } from "./utils";
import { alertError, alertWarn, swal } from "./alerts";
import QrCodeImage, { QrCodeState } from "./components/qr_code";
import ClipboardJS from "clipboard";
import HowToSection from "./sections/howto";
import CreditSection from "./sections/credits";
import ContributeSection from "./sections/contribute";
import Footer from "./sections/footer";

const DEBUG = true;

const INVALIDATE_TIMEOUT_SEC = 50;
const REQUEST_INTERVAL = 2000;

const REMINDER_DELETE_CLIPBOARD = 10000;

const LOCAL_STORAGE_PRIVATE_NAME = "private_key";
const LOCAL_STORAGE_PUBLIC_NAME = "public_key";
const DEFAULT_KEY_SIZE = 4096;

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
  const keySizeStr = searchParams?.get("key_size");

  const keySize = keySizeStr ? parseInt(keySizeStr) : DEFAULT_KEY_SIZE;

  const [labelState, setLabelState] = useState<LabelState>("init");
  const [sessionId, setSessionId] = useState<string | undefined>();
  const [sessionToken, setSessionToken] = useState<string | undefined>();
  const [username, setUsername] = useState<string | undefined>();
  const [password, setPassword] = useState<string | undefined>();
  const [qrCodeState, setQrCodeState] = useState<QrCodeState>("generating");

  /*   const credentialsEventSource = useMemo(() => {
    if (sessionId && sessionToken) {
      return 
    }
  }, [sessionId, sessionToken]); */

  const jsEncrypt = useMemo(() => {
    return new JSEncrypt({ default_key_size: keySize.toString() });
  }, [keySize]);

  useEffect(() => {
    if (didInitUseEffect2) return;

    let credentialsEventSource: EventSource;
    let pollingInterval: NodeJS.Timeout;

    function initClipboardButtons(
      username: string,
      password: string,
      copyPassword: boolean
    ) {
      if (username !== undefined && username !== null) {
        setUsername(username);

        //Copy username to clipboard button
        var clipCopyUser = new ClipboardJS(".copyUserBtn");
        clipCopyUser.on("success", function () {
          log("copy username to clipboard: done!");
          //copiedSuccess("#copyUserBtn", false);
          remindDelete();
        });
        clipCopyUser.on("error", function (e) {
          console.error("failed to copy username", e);
          //copiedError("#copyUserBtn", false);
        });
      }

      setPassword(password);
      //Copy password to clipboard button
      var clipCopyPsw = new ClipboardJS(".copyPassBtn");
      clipCopyPsw.on("success", function () {
        log("copy password to clipboard: done!");
        //copiedSuccess("#copyPassBtn", false);
        remindDelete();
      });
      clipCopyPsw.on("error", function (e) {
        console.error("failed to copy password", e);
        //copiedError("#copyPassBtn", false);
      });

      //Copy password if needed
      //if (copyPassword) {
      //  $("#copyPassBtn").click();
      //}

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
          credentialsEventSource.close();
          setSessionId(undefined);
        };
        credentialsEventSource.onmessage = (event) => {
          log(`message received: ${event.data}`);
          let creds = JSON.parse(event.data);

          if (creds.status) {
            log("credentials received");
            onCredentialsReceived(creds);
          }
        };
        setTimeout(async function () {
          //Channel is not closed (2) means we did not receive the credentials from the server
          //This should never be true because we want the server to terminate the connection before
          //timeout expires.
          if (credentialsEventSource.readyState != 2) {
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
              .then((json) => onCredentialsReceived(json))
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

    function onCredentialsReceived(data: CredentialsResponse) {
      if (data != undefined && data.status === true) {
        let decryptedUsername: string, decryptedPsw: string;

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

          if (decryptedPsw) {
            //Username is not required for next steps
            swal
              .fire({
                title: "Credentials received!",
                text: "Would you copy your password on clipboard? (Also remember to clear your clipboard after usage!)",
                icon: "success",
                confirmButtonText: "Copy",
              })
              .then((value) => {
                initClipboardButtons(
                  decryptedUsername,
                  decryptedPsw,
                  value.isConfirmed
                );
                invalidateSession();
              });
          } else {
            alertError(
              "Error",
              "There was an error, can't decrypt your credentials. Try again..."
            );
            invalidateSession();
          }
        }
      }
    }

    if (sessionId && sessionToken) {
      initAsyncAjaxRequestSSE();
      didInitUseEffect2 = true;
    }
  });

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

    if (didInitUseEffect1) return;
    setLabelState("key_generation");
    //Check for presence of an already defined keypair in local storage
    if (!hasSavedKeyPair()) {
      log("no previous saved keypair available in web storage");

      //generate key pair
      saveKeyPair(jsEncrypt);
      setLabelState("waiting_sid");
      requestInit(jsEncrypt).then(onInitDone);
    } else {
      log("previous keypair found, using it");

      //load key from local storage
      const crypt = loadKeyPair();
      setLabelState("waiting_sid");
      requestInit(crypt).then(onInitDone);
    }

    didInitUseEffect1 = true;
  }, [jsEncrypt, keySize, sessionId]);

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
                <a className="navbar-link" href="#howto">
                  {" "}
                  How To
                </a>
              </li>
              <li className="navbar-item">
                <Link className="navbar-link" href="#howworks">
                  {" "}
                  How it works{" "}
                </Link>
              </li>
              <li className="navbar-item">
                <Link className="navbar-link" href="#credits">
                  Credits
                </Link>
              </li>
              <li className="navbar-item">
                <Link className="navbar-link" href="#contribute">
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
                      {<SessionIdLabel state={labelState} sid={sessionId} />}
                    </span>
                  </b>
                </center>
                <p className="content-font">
                  <button
                    id="copyUserBtn"
                    data-clipboard-text="no username"
                    hidden
                  >
                    Copy Username
                  </button>
                  <button
                    id="copyPassBtn"
                    data-clipboard-text="no password"
                    hidden
                  >
                    Copy Password
                  </button>
                  <br />
                  <button id="clearBtn" data-clipboard-text=" " hidden>
                    Clear clipboard
                  </button>
                  <button id="reloadBtn" hidden>
                    Reload
                  </button>
                </p>
              </div>
            </div>

            <div className="row">
              <div className="twelve columns">&nbsp;</div>
            </div>
          </div>
          <HowToSection />
          <CreditSection />
          <ContributeSection />
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
  log(PEMtoBase64(crypt.getPublicKey()));
  log(toSafeBase64(PEMtoBase64(crypt.getPublicKey())));

  const body = { PUBLIC_KEY: toSafeBase64(PEMtoBase64(crypt.getPublicKey())) };

  const res = await fetch(`${BASE_HOST}/init.php`, {
    method: "POST",
    body: JSON.stringify(body),
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

function loadKeyPair() {
  const crypt = new JSEncrypt();
  crypt.setPublicKey(localStorage.getItem(LOCAL_STORAGE_PUBLIC_NAME)!);
  crypt.setPrivateKey(localStorage.getItem(LOCAL_STORAGE_PRIVATE_NAME)!);

  return crypt;
}

function saveKeyPair(crypt: JSEncrypt) {
  //save generated key pair on the browser internal storage
  if (supportLocalStorage()) {
    log("web storage available, save generated key");

    localStorage.setItem(LOCAL_STORAGE_PUBLIC_NAME, crypt.getPublicKey());
    localStorage.setItem(LOCAL_STORAGE_PRIVATE_NAME, crypt.getPrivateKey());
  } else {
    warn("web storage NOT available");
  }
}

function supportLocalStorage() {
  return typeof Storage !== "undefined";
}

function hasSavedKeyPair() {
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

function log(str: any): void {
  if (DEBUG) console.log(str);
}

function warn(str: any): void {
  if (DEBUG) console.warn(str);
}

function refreshPage() {
  window.location.reload();
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
