import { DEFAULT_KEY_SIZE } from "../constant";

export interface HowItWorksSectionProps {
  refs: any;
}

export default function HowItWorksSection(props: HowItWorksSectionProps) {
  return (
    <div ref={props.refs} className="docs-section">
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
              KeeLink Android application acts as a bridge from Keepass2Android
              to this web page. Every credentials is retrieved from the Keepass
              Database (KDBX). Once the credentials are received, the
              application waits for the user to scan QR code with its device
              camera. QR Code contains a simple URL as{" "}
              <i>ksid://yourpersonalanduniquesessionid</i>, so when the QR code
              is correctly parsed, the credentials are, firstly, encrypted with
              an <b>RSA {DEFAULT_KEY_SIZE} bit</b> public key and then sent to a
              database and associated with{" "}
              <i>`&apos;`yourpersonalanduniquesessionid`&apos;`</i>.{" "}
              <b>No other information are sent over network</b>,{" "}
              <b>that is important for you</b> because it is essential for me to
              maintain your credentials as safe as possible. More security for
              your credentials was added by the <b>HTTPS/SSL</b> protocol that
              is used for real transmission from your Android device to this
              site.
            </li>
          </ul>
        </li>
        <li>
          WebApp
          <ul>
            <li>
              KeeLink WebApp application acts only as a simple server that build
              a custom session ID, random generated, only for you. It is
              converted to QR Code and displayed at the top of the page. Once QR
              is received your page starts querying database and listening for
              upcoming credentials.
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
        That`&apos;`s all! But if you don`&apos;`t trust me let`&apos;`s see the{" "}
        <a href="https://github.com/andreacioni/KeeLink">source code</a>
        <br />
        You will find there also instructions to self-host the web application.
      </p>
    </div>
  );
}
