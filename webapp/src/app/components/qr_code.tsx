import Image from "next/image";
import QRCode from "react-qr-code";

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
  return <QRCode value={sidUrl} href={sidUrl}></QRCode>;
}

function WaitingSidLabel() {
  return <span>Receiving...</span>;
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
    <div id="qrcode_reload" hidden>
      <a href="#">
        <Image alt="Reload QR Code" src={qrReload} height="220" width={30} />
      </a>
    </div>
  );
}
