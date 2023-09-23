import Image from "next/image";

import flyIoLogo from "./images/flyio_logo.png";
import githubLogo from "./images/github_logo.png";
import keelinkLogo from "./images/logo.png";
import qrLoading from "./images/qr_code_loading.gif";
import qrReload from "./images/qr_code_reload.png";

export default function Home() {
  return (
    <main>
      <div className="container">
        {/* Navigation Bar */}
        <nav className="navbar">
          <div className="container">
            <ul className="navbar-list">
              <li className="navbar-item">
                <a className="navbar-link" href="#">
                  <u>KeeLink</u>
                </a>
              </li>
              <li className="navbar-item">
                <a className="navbar-link" href="#howto">
                  {" "}
                  How To
                </a>
              </li>
              <li className="navbar-item">
                <a className="navbar-link" href="#howworks">
                  {" "}
                  How it works{" "}
                </a>
              </li>
              <li className="navbar-item">
                <a className="navbar-link" href="#credits">
                  Credits
                </a>
              </li>
              <li className="navbar-item">
                <a className="navbar-link" href="#contribute">
                  Contribute
                </a>
              </li>
            </ul>
          </div>
        </nav>
        {/* Center */}
        <div id="content">
          <div className="row">
            <center className="twelve columns" id="logo-container">
              <Image alt="" src={keelinkLogo} width={100} height={100} />
            </center>
          </div>
          <div id="qrplaceholder" className="container">
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
              <div className="twelve columns">
                <div id="qrcode_loading" hidden>
                  <Image
                    alt="Landing QR Code"
                    src={qrLoading}
                    height={220}
                    width={30}
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
                <div id="qrcode" hidden></div>
              </div>
            </div>

            <div className="row">
              <div className="twelve columns">&nbsp;</div>
            </div>

            <div className="row">
              <div className="twelve columns">
                <p className="content-font">
                  <b>
                    Your Session ID: <br />{" "}
                    <span id="sidLabel">
                      Seems that your browser doesn&apos;t support JavaScript or
                      it is disabled
                    </span>
                  </b>
                </p>
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
          {/* How To */}
          <div id="howto" className="docs-section">
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
          <div id="howworks" className="docs-section">
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
          <div id="credits" className="docs-section">
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
          <div id="contribute" className="docs-section">
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
          <div className="docs-section">
            <div className="container">
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
