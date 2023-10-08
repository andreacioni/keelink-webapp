import { BsInfoCircle } from "react-icons/bs";

import styles from "./icon_with_tooltip.module.css";

interface IconWithTooltipProps {
  text: string;
}

export default function IconWithTooltip(props: IconWithTooltipProps) {
  return (
    <span className={styles.tooltip}>
      <span className={styles.tooltiptext}>{props.text}</span>
      <BsInfoCircle />
    </span>
  );
}
