"use client";

import { useRouter, useSearchParams } from "next/navigation";
import Image from "next/image";

import styles from "./page.module.css";

import flyIoLogo from "./images/flyio_logo.png";
import githubLogo from "./images/github_logo.png";
import keelinkLogo from "./images/logo.png";
import qrLoading from "./images/qr_code_loading.gif";
import qrReload from "./images/qr_code_reload.png";
import Link from "next/link";
import { JSEncrypt } from "jsencrypt";
import { useEffect, useState } from "react";
import SessionIdLabel, { LabelState } from "./components/session_id_label";
import { PEMtoBase64, toSafeBase64 } from "./utils";
import { alertError } from "./alerts";

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

export default function Home() {
  const searchParams = useSearchParams();

  let keySize = DEFAULT_KEY_SIZE;

  const [isKeyPairLoading, setKeyPairLoading] = useState(true);
  const [labelState, setLabelState] = useState<LabelState>("init");
  const [sid, setSid] = useState<String | undefined>();
  const [isDisplayOnlyInfo, setDisplayOnlyInfo] = useState(true);

  // Change default key size
  if (searchParams && searchParams.get("key_size")) {
    const ks = parseInt(searchParams.get("key_size")!);
    if (ks && !isNaN(ks)) {
      keySize = ks;
    }
  }

  useEffect(() => {
    if (searchParams && searchParams.get("onlyinfo")) {
      // Do not initialize a session, just display information
      return;
    }
    setDisplayOnlyInfo(false);
    setLabelState("key_generation");
    //Check for presence of an already defined keypair in local storage
    if (!hasSavedKeyPair()) {
      log("no previous saved keypair available in web storage");

      //generate key pair
      generateKeyPair(keySize).then((crypt) => {
        setLabelState("waiting_sid");
        requestInit(crypt);
      });
    } else {
      log("previous keypair found, using it");
      //load key from local storage
      const crypt = loadKeyPair();
      setLabelState("waiting_sid");
      requestInit(crypt);
    }
  }, [keySize, searchParams]);

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
            hidden={isDisplayOnlyInfo}
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
                <div id="qrcode_loading">
                  <Image
                    alt="Loading QR Code"
                    src={qrLoading}
                    height={220}
                    width={220}
                  />
                </div>
                <div id="qrcode_reload" hidden>
                  <a href="#">
                    <Image
                      alt="Reload QR Code"
                      src={qrReload}
                      height="220"
                      width={30}
                    />
                  </a>
                </div>
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
                      {<SessionIdLabel state={labelState} />}
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

async function requestInit(
  crypt: JSEncrypt
): Promise<[String, String] | undefined> {
  log(PEMtoBase64(crypt.getPublicKey()));
  log(toSafeBase64(PEMtoBase64(crypt.getPublicKey())));

  const body = { PUBLIC_KEY: toSafeBase64(PEMtoBase64(crypt.getPublicKey())) };

  const res = await fetch("http://localhost:8080/init.php", {
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

function generateKeyPair(keySize: number): Promise<JSEncrypt> {
  return new Promise<JSEncrypt>((resolve) => {
    const crypt = new JSEncrypt({ default_key_size: keySize.toString() });
    crypt.getKey(() => {
      //save generated key pair on the browser internal storage
      if (supportLocalStorage()) {
        log("web storage available, save generated key");

        localStorage.setItem(LOCAL_STORAGE_PUBLIC_NAME, crypt.getPublicKey());
        localStorage.setItem(LOCAL_STORAGE_PRIVATE_NAME, crypt.getPrivateKey());
      } else {
        warn("web storage NOT available");
      }

      log(crypt.getPublicKey());
      resolve(crypt);
    });
  });
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

function log(str: String): void {
  if (DEBUG) console.log(str);
}

function warn(str: String): void {
  if (DEBUG) console.log(str);
}
