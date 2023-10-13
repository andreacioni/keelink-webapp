import ClipboardJS from "clipboard";
import { useEffect, useRef, useState } from "react";
import { log } from "../utils";

const REMINDER_DELETE_CLIPBOARD = 10000;

interface CopyToClipboardButtonProps {
  id: string;
  text: string;
  value?: string;
  className?: string;
  onSuccessText?: string;
  onErrorText?: string;
  onSuccess?: () => void;
}

export function CopyToClipboardButton(props: CopyToClipboardButtonProps) {
  const [displayText, setDisplayText] = useState(props.text);
  const didInit = useRef(false);

  useEffect(() => {
    if (didInit.current) return;

    function copiedSuccess() {
      if (props.onSuccessText) {
        setDisplayText(props.onSuccessText);
        setTimeout(function () {
          setDisplayText(props.text);
        }, 1000);
      }
    }

    function copiedError() {
      if (props.onErrorText) {
        setDisplayText(props.onErrorText!);
        setTimeout(function () {
          setDisplayText(props.text!);
        }, 1000);
      }
    }

    const clipboard = new ClipboardJS("#" + props.id);
    clipboard.on("success", function () {
      log("copy to clipboard: done!");
      copiedSuccess();

      props.onSuccess?.();
    });
    clipboard.on("error", function (e) {
      console.error("failed to copy to clipboard", e);
      copiedError();
    });

    didInit.current = true;
  });
  return (
    <button id={props.id} data-clipboard-text={props.value || "no value"}>
      {displayText}
    </button>
  );
}
