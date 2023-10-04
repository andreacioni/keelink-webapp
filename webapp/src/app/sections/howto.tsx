import styles from "../page.module.css";

export default function HowToSection() {
  return (
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
          <b>Open this page</b> on the device you want to send the credentials.
        </li>
        <li>
          Open Keepass2Android and click on{" "}
          <b>button &apos;Send with KeeLink&apos;</b> in the entry context menu
        </li>
        <li>
          On the opened window you can <b>scan the QR code on this page</b> and
          wait for credentials to be sent.
        </li>
      </ol>
      <p>Interested on details? Just go ahead!</p>
    </div>
  );
}
