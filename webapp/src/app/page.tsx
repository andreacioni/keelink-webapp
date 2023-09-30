"use client";

import JSEncrypt from "jsencrypt/lib/index.js";

import QRCode from "react-qr-code";

import { useRouter, useSearchParams } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

import styles from "./page.module.css";

import flyIoLogo from "./images/flyio_logo.png";
import githubLogo from "./images/github_logo.png";
import keelinkLogo from "./images/logo.png";

import SessionIdLabel, { LabelState } from "./components/session_id_label";
import { PEMtoBase64, fromSafeBase64, toSafeBase64 } from "./utils";
import { alertError, alertWarn, swal } from "./alerts";
import QrCodeImage, { QrCodeState } from "./components/qr_code";
import ClipboardJS from "clipboard";

const DEBUG = true;

const INVALIDATE_TIMEOUT_SEC = 50;
const REQUEST_INTERVAL = 2000;

const REMINDER_DELETE_CLIPBOARD = 10000;
const REMINDER_TITLE = "Don't forget!";
const REMINDER_BODY =
  "Remember to clear your clipboard, your credentials are still there!";

const LOCAL_STORAGE_PRIVATE_NAME = "private_key";
const LOCAL_STORAGE_PUBLIC_NAME = "public_key";
const DEFAULT_KEY_SIZE = 4096;

interface CredentialsResponse {
  status: boolean;
  username: string | undefined | null;
  password: string | undefined | null;
}

let didInit = false;

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
      // if (credentialsEventSource) {
      //   credentialsEventSource.close();
      // }

      // pollingInternal is set only if the credentialsEventSource failed to start
      //if (pollingInterval) {
      //  clearInterval(pollingInterval);
      //}
      if (sessionId) await removeEntry(sessionId);

      setQrCodeState("reload");
    }
    function initAsyncAjaxRequestSSE() {
      const credentialsEventSource = new EventSource(
        `getcredforsid.php?sid=${sessionId}&token=${sessionToken}`
      );
      if (credentialsEventSource) {
        log("attaching listener to EventSource");
        credentialsEventSource.onerror = (err) => {
          console.error("error receiving sse message:", err);
          warn("failing back to polling");
          //initAsyncAjaxRequest();
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
            refreshPage();
          }
        }, 1000 * INVALIDATE_TIMEOUT_SEC);
      } else {
        warn("unable to attach listeners to EventSource");
      }
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

    if (didInit) return;
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

    didInit = true;
  }, [jsEncrypt, keySize, sessionId]);

  return (
    <main className="container">
      <div className={styles["page-content"]}>
        {/* Navigation Bar */}
        <nav className={styles.navbar}>
          <div className={styles.container}>
            <ul className={styles["navbar-list"]}>
              <li className={styles["navbar-item"]}>
                <Link className={styles["navbar-link"]} href="#">
                  <u>KeeLink</u>
                </Link>
              </li>
              <li className={styles["navbar-item"]}>
                <a className={styles["navbar-link"]} href="#howto">
                  {" "}
                  How To
                </a>
              </li>
              <li className={styles["navbar-item"]}>
                <Link className={styles["navbar-link"]} href="#howworks">
                  {" "}
                  How it works{" "}
                </Link>
              </li>
              <li className={styles["navbar-item"]}>
                <Link className={styles["navbar-link"]} href="#credits">
                  Credits
                </Link>
              </li>
              <li className={styles["navbar-item"]}>
                <Link className={styles["navbar-link"]} href="#contribute">
                  Contribute
                </Link>
              </li>
            </ul>
          </div>
        </nav>
        {/* Center */}
        <div className={styles.content}>
          <div className="row">
            <center className="twelve columns">
              <Image
                className={styles["logo-container"]}
                alt="Keelink logo"
                src={keelinkLogo}
              />
            </center>
          </div>

          <div
            id="qrplaceholder"
            className={styles.container}
            hidden={displayOnlyInfo}
          >
            <div className="row">
              <div className="twelve columns">
                <p className={styles["content-font"]}>
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
              <div className="twelve columns">
                <QrCodeImage state={qrCodeState} sid={sessionId} />
              </div>
            </div>

            <div className="row">
              <div className="twelve columns">
                <div className={styles.qrcode} hidden></div>
              </div>
            </div>

            <div className="row">
              <div className="twelve columns">&nbsp;</div>
            </div>

            <div className="row">
              <div className="twelve columns">
                <center className={styles["content-font-small"]}>
                  <b>
                    Your Session ID: <br />{" "}
                    <span id="sidLabel">
                      {<SessionIdLabel state={labelState} sid={sessionId} />}
                    </span>
                  </b>
                </center>
                <p className={styles["content-font"]}>
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
          {/* How To */}
          <div id="howto" className={styles["docs-section"]}>
            <h2>How To</h2>
            <p>
              In order to send credentials to this page you first need to follow{" "}
              <b>4 simple steps</b>:
            </p>
            <ol>
              {/* First step */}
              <li>
                <b>Download and install</b> needed app on your phone/tablet
                <ul>
                  <li>
                    Keepass2Android Password Manager (
                    <a href="https://play.google.com/store/apps/details?id=keepass2android.keepass2android">
                      online
                    </a>{" "}
                    or{" "}
                    <a href="https://play.google.com/store/apps/details?id=keepass2android.keepass2android_nonet&hl=it">
                      offline
                    </a>{" "}
                    version)
                  </li>
                  <li>
                    KeeLink Plug-In for Keepass2Android (
                    <a href="#https://play.google.com/store/apps/details?id=it.andreacioni.kp2a.plugin.keelink">
                      here
                    </a>
                    )
                  </li>
                </ul>
              </li>
              <li>
                <b>Open this page</b> on the device you want to send the
                credentials.
              </li>
              <li>
                Open Keepass2Android and click on{" "}
                <b>button &apos;Send with KeeLink&apos;</b> in the entry context
                menu
              </li>
              <li>
                On the opened window you can{" "}
                <b>scan the QR code on this page</b> and wait for credentials to
                be sent.
              </li>
            </ol>
            <p>Interested on details? Just go ahead!</p>
          </div>
          <div id="howworks" className={styles["docs-section"]}>
            <h2>How it works</h2>
            <p>
              <i>
                KeeLink has a very <b>simple and strong architecture</b>, it is
                composed mainly of two parts:
              </i>
            </p>
            <ul>
              <li>
                Android
                <ul>
                  <li>
                    KeeLink Android application acts as a bridge from
                    Keepass2Android to this web page. Every credentials is
                    retrieved from the Keepass Database (KDBX). Once the
                    credentials are received, the application waits for the user
                    to scan QR code with its device camera. QR Code contains a
                    simple URL as <i>ksid://yourpersonalanduniquesessionid</i>,
                    so when the QR code is correctly parsed, the credentials
                    are, firstly, encrypted with an <b>RSA 2048 bit</b> public
                    key and then sent to a database and associated with{" "}
                    <i>&apos;yourpersonalanduniquesessionid&apos;</i>.{" "}
                    <b>No other information are sent over network</b>,{" "}
                    <b>that is important for you</b> because it is essential for
                    me to maintain your credentials as safe as possible. More
                    security for your credentials was added by the{" "}
                    <b>HTTPS/SSL</b> protocol that is used for real transmission
                    from your Android device to this site.
                  </li>
                </ul>
              </li>
              <li>
                WebApp
                <ul>
                  <li>
                    KeeLink WebApp application acts only as a simple server that
                    build a custom session ID, random generated, only for you.
                    It is converted to QR Code and displayed at the top of the
                    page. Once QR is received your page starts querying database
                    and listening for upcoming credentials.
                    <b>
                      When credentials are received, they will be deleted from
                      database
                    </b>
                    .
                  </li>
                </ul>
              </li>
            </ul>
            <p>
              That&apos;s all! But if you don&apos;t trust me let&apos;s see the{" "}
              <a href="https://github.com/andreacioni/KeeLink">source code</a>
              <br />
              You will find there also instructions to self-host the web
              application.
            </p>
          </div>
          <div id="credits" className={styles["docs-section"]}>
            <h2>Credits</h2>
            <p>
              KeeLink is designed, developed and supported by{" "}
              <b>Andrea Cioni</b>. All source files used to build this service
              are hosted, and accessible to everyone on{" "}
              <a href="https://github.com/andreacioni/KeeLink">GitHub</a>.
            </p>
            <p>
              This project is totally open source, built with the support of a
              lot of wonderful works. Here the list:
            </p>
            <br />
            <ul>
              <li>
                <b>Android</b>
                <ul>
                  <li>
                    Keepass2Android -{" "}
                    <a href="http://keepass2android.codeplex.com/SourceControl/latest">
                      http://keepass2android.codeplex.com/
                    </a>
                  </li>
                  <li>
                    ZXing Embedded -{" "}
                    <a href="https://github.com/journeyapps/zxing-android-embedded">
                      https://github.com/journeyapps/zxing-android-embedded
                    </a>
                  </li>
                  <li>
                    Sweet Alert for Android -{" "}
                    <a href="https://github.com/pedant/sweet-alert-dialog">
                      https://github.com/pedant/sweet-alert-dialog
                    </a>
                  </li>
                </ul>
              </li>
            </ul>
            <ul>
              <li>
                <b>Web</b>
                <ul>
                  <li>
                    Skelethon -{" "}
                    <a href="http://getskeleton.com/">
                      http://getskeleton.com/
                    </a>
                  </li>
                  <li>
                    Font Awesome -{" "}
                    <a href="http://fontawesome.io/">http://fontawesome.io/</a>
                  </li>
                  <li>
                    JQuery - <a href="http://jquery.com/">http://jquery.com/</a>
                  </li>
                  <li>
                    QR JS library -{" "}
                    <a href="https://davidshimjs.github.io/qrcodejs/">
                      https://davidshimjs.github.io/qrcodejs/
                    </a>
                  </li>
                  <li>
                    JSencrypt -{" "}
                    <a href="https://github.com/travist/jsencrypt">
                      https://github.com/travist/jsencrypt
                    </a>
                  </li>
                </ul>
              </li>
            </ul>
          </div>
          <div id="contribute" className={styles["docs-section"]}>
            <h2>Contribute</h2>
            <p>
              KeeLink is a <b>free and no-profit application</b>. If you like
              and use this application consider to support me by sharing it with
              other people. Remember that is also possible to{" "}
              <b>donate something</b> in order to support the development and
              maintenance of all its parts.
            </p>
            <div>
              <form
                action="https://www.paypal.com/cgi-bin/webscr"
                method="post"
                target="_top"
              >
                <input type="hidden" name="cmd" value="_s-xclick" />
                <input
                  type="hidden"
                  name="hosted_button_id"
                  value="P4B9MDV9WYDS2"
                />
                <input
                  type="image"
                  src="https://www.paypalobjects.com/en_US/GB/i/btn/btn_donateCC_LG.gif"
                  name="submit"
                  alt="PayPal – The safer, easier way to pay online!"
                />
                <Image
                  alt=""
                  src="https://www.paypalobjects.com/it_IT/i/scr/pixel.gif"
                  width="1"
                  height="1"
                />
              </form>
            </div>
          </div>
          <div className={styles["docs-section"]}>
            <div className={styles.container}>
              <div className="row">
                <div className="six columns">
                  <p>
                    Brought to you by <b>Andrea Cioni</b>
                  </p>
                </div>
                <div className="six columns">
                  <p>
                    Hosted for free on{" "}
                    <a href="https://fly.io/">
                      <Image
                        alt="Fly.io Logo"
                        height={25}
                        width={50}
                        src={flyIoLogo}
                      />
                    </a>
                  </p>
                </div>
              </div>
              <div className="row">
                <div className="twelve columns">
                  <p>
                    <a href="https://github.com/andreacioni/KeeLink">
                      <Image
                        alt="Github Logo"
                        height={50}
                        width={50}
                        src={githubLogo}
                      />
                    </a>
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}

async function removeEntry(sid: string): Promise<void> {
  const res = await fetch("removeentry.php", {
    method: "DELETE",
    body: JSON.stringify({ sid: sid }),
  });

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

  const res = await fetch("init.php", {
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
