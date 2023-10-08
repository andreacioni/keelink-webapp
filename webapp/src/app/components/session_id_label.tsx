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
}

interface WaitingCredentialsLabelProps {
  sid: String;
}

interface InvalidatedCredentialsLabelProps {
  sid: String;
}

export default function SessionIdLabel(props: SessionIdLabelProps) {
  switch (props.state) {
    case "init":
      return <InitLabel />;
    case "key_generation":
      return <GenerateKeyPairLabel />;
    case "slow_key_generation":
      return <GenerateLessSecureKeyPair />;
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

function GenerateKeyPairLabel() {
  return (
    <>
      <span>Generating your key pair ...</span>
      <br />
      <span>This process may take a while</span>
    </>
  );
}
function GenerateLessSecureKeyPair() {
  return (
    <>
      <span>Generating your key pair...</span>
      <br />
      <span>
        Tired of waiting? <a href="?key_size=1024">Switch</a> to less secure
        (1024 bit) key pair
      </span>
    </>
  );
}
