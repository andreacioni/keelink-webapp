import IconWithTooltip from "./icon_with_tooltip";
import styles from "./session_id_labels.module.css";

export type LabelState =
  | "init"
  | "key_generation"
  | "slow_key_generation"
  | "waiting_sid"
  | "waiting_credentials"
  | "invalidated";

export const LABEL_STATES: LabelState[] = [
  "init",
  "key_generation",
  "slow_key_generation",
  "waiting_sid",
  "waiting_credentials",
  "invalidated",
];

interface SessionIdLabelProps {
  state: LabelState;
  sid?: String;
  keySize?: number;
  weakKeySize?: number;
}

interface WaitingCredentialsLabelProps {
  sid: String;
}

interface InvalidatedCredentialsLabelProps {
  sid: String;
}

interface GenerateKeyPairLabelProps {
  keySize: number;
}

interface GenerateLessSecureKeyPairProps {
  weakKeySize: number;
}

export default function SessionIdLabel(props: SessionIdLabelProps) {
  switch (props.state) {
    case "init":
      return <InitLabel />;
    case "key_generation":
      return <GenerateKeyPairLabel keySize={props.keySize || 0} />;
    case "slow_key_generation":
      return <GenerateLessSecureKeyPair weakKeySize={props.weakKeySize || 0} />;
    case "waiting_sid":
      return <WaitingSidLabel />;
    case "waiting_credentials":
      if (props.sid) return <WaitingCredentialsLabel sid={props.sid} />;
    case "invalidated":
      if (props.sid) return <InvalidatedCredentialsLabel sid={props.sid} />;
  }
  return <></>;
}

function InitLabel() {
  return <p>Initializing ...</p>;
}

function InvalidatedCredentialsLabel(props: InvalidatedCredentialsLabelProps) {
  return <span className={styles.invalidated_sid}>{props.sid}</span>;
}

function WaitingCredentialsLabel(props: WaitingCredentialsLabelProps) {
  return <span>{props.sid}</span>;
}

function WaitingSidLabel() {
  return <span>Receiving...</span>;
}

function GenerateKeyPairLabel(props: GenerateKeyPairLabelProps) {
  return (
    <>
      <span>Generating your key pair ...</span>
      <br />
      <span>This process may take a while</span>
      <span style={{ paddingLeft: "5px" }}>
        <IconWithTooltip
          text={`Be patient. Key generation is done just once and aims to build a robust set of asymmetric secrets. This process could last even one minute in older devices.`}
        />
      </span>
    </>
  );
}
function GenerateLessSecureKeyPair(props: GenerateLessSecureKeyPairProps) {
  return (
    <>
      <span>Generating your key pair...</span>
      <br />
      <span>
        Tired of waiting? <a href={`?key_size=${props.weakKeySize}`}>Switch</a>{" "}
        to less secure ({props.weakKeySize} bit) key pair.
      </span>
      <span style={{ paddingLeft: "5px" }}>
        <IconWithTooltip
          text={`Hold on! A robust key pair is being built right now. However if this takes too much you can switch to a less secure key pair by clicking on the link.`}
        />
      </span>
    </>
  );
}
