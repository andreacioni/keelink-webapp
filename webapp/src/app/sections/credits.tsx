export interface CreditSectionProps {
  refs: any;
}

export default function CreditSection(props: CreditSectionProps) {
  return (
    <div ref={props.refs} className="docs-section">
      <h2>Credits</h2>
      <p>
        KeeLink is designed, developed and supported by <b>Andrea Cioni</b>. All
        source files used to build this service are hosted, and accessible to
        everyone on <a href="https://github.com/andreacioni/KeeLink">GitHub</a>.
      </p>
      <p>
        This project is totally open source, built with the support of a lot of
        wonderful works. Here the list:
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
              <a href="http://getskeleton.com/">http://getskeleton.com/</a>
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
  );
}
