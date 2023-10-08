import Image from "next/image";

import styles from "./sections.module.css";

import flyIoLogo from "../images/flyio_logo.png";
import githubLogo from "../images/github_logo.png";

export default function Footer() {
  return (
    <div className="docs-section">
      <div className="container">
        <div className="row">
          <div className="six columns">
            <p>
              Brought to you by <b>Andrea Cioni</b>
            </p>
          </div>
          <div className="six columns">
            <div className={styles["image-text-alignment"]}>
              <p>Hosted for free on </p>
              <a href="https://fly.io/">
                <Image alt="Fly.io Logo" height={25} src={flyIoLogo} />
              </a>
            </div>
          </div>
        </div>
        <center className="row">
          <div className="twelve columns">
            <a href="https://github.com/andreacioni/KeeLink">
              <Image alt="Github Logo" height={50} src={githubLogo} />
            </a>
          </div>
        </center>
      </div>
    </div>
  );
}
