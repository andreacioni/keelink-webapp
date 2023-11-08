import { IoIosArrowDown } from "react-icons/io";
import { MdVpnKey } from "react-icons/md";

import styles from "./key_size_selector.module.css";
import { DEFAULT_KEY_SIZE, STRONG_KEY_SIZE, WEAK_KEY_SIZE } from "../constant";

export interface KeySizeSelectorProps {
  currentSize: number;
  onSelect: (newValue: number) => void;
}

export default function KeySizeSelector(props: KeySizeSelectorProps) {
  return (
    <div className={styles["container"]}>
      <button className={styles["button"]}>
        <div className={styles["dropdown"]}>
          <span className={styles["dropicon"]}>
            <MdVpnKey size="1.5rem" />
          </span>
          <span className={styles["dropval"]}>
            <span>{props.currentSize}</span>
            <span className={styles["small-font"]}> bit</span>
          </span>
          <span className={styles["dropbtn"]}>
            <IoIosArrowDown size="1.5rem" />
          </span>
        </div>
      </button>
      <div className={styles["dropdown-content"]}>
        <a href="#" onClick={() => props.onSelect(WEAK_KEY_SIZE)}>
          <span className={styles["medium-font"]}>{WEAK_KEY_SIZE}bit </span>
          <br></br>
          <span className={styles["small-font"]}>(WEAK)</span>
        </a>
        <a href="#" onClick={() => props.onSelect(DEFAULT_KEY_SIZE)}>
          <span className={styles["medium-font"]}>{DEFAULT_KEY_SIZE}bit </span>
          <br></br>
          <span className={styles["small-font"]}>(GOOD)</span>
        </a>
        <a href="#" onClick={() => props.onSelect(STRONG_KEY_SIZE)}>
          <span className={styles["medium-font"]}>{STRONG_KEY_SIZE}bit </span>
          <br></br>
          <span className={styles["small-font"]}>(RECOMMENDED)</span>
        </a>
      </div>
    </div>
  );
}
