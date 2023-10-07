import Image from "next/image";
import QRCode from "react-qr-code";

import styles from "./qr_code.module.css";
import qrLoading from "../images/qr_code_loading.gif";
import qrReload from "../images/qr_code_reload.png";

export type QrCodeState = "generating" | "reload" | "valid_session_id";

export const QRCODE_STATES: QrCodeState[] = [
  "generating",
  "reload",
  "valid_session_id",
];

interface QrCodeProps {
  state: QrCodeState;
  sid?: string;
}

interface QrCodeValidSessionIdProps {
  sid?: string;
}

export default function QrCodeImage(props: QrCodeProps) {
  switch (props.state) {
    case "generating":
      return <QrCodeGenerating />;
    case "reload":
      return <QrCodeReload />;
    case "valid_session_id":
      if (props.sid) return <QrCodeValidSessionId sid={props.sid} />;
  }
  return <></>;
}

function QrCodeValidSessionId(props: QrCodeValidSessionIdProps) {
  const sidUrl = "ksin://" + props.sid!;
  return (
    <div className={styles.fadeIn}>
      <QRCode value={sidUrl} size={170} href={sidUrl}></QRCode>
    </div>
  );
}

function QrCodeGenerating() {
  return (
    <div id="qrcode_loading">
      <Image alt="Loading QR Code" src={qrLoading} height={220} width={220} />
    </div>
  );
}

function QrCodeReload() {
  return (
    <div id="qrcode_reload">
      <a href="#" onClick={() => location.reload()}>
        <Image alt="Reload QR Code" src={qrReload} height={220} width={220} />
      </a>
    </div>
  );
}
