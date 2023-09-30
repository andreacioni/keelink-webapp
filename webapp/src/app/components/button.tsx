interface CopyToClipboardButtonProps {
  value?: string;
  className?: string;
}

export function CopyToClipboardButton(props: CopyToClipboardButtonProps) {
  return (
    <button data-clipboard-text={props.value ?? "no value"} hidden>
      Copy Username
    </button>
  );
}
