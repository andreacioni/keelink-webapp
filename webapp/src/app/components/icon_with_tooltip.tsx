import { BsInfoCircle } from "react-icons/bs";

import styles from "./icon_with_tooltip.module.css";
import { ComponentType, ReactNode } from "react";

interface IconWithTooltipProps {
  text: string;
}

interface TooltipProps {
  text: string;
  children: ReactNode;
}

export function IconWithTooltip(props: IconWithTooltipProps) {
  return (
    <Tooltip text={props.text}>
      <BsInfoCircle />
    </Tooltip>
  );
}

export default function Tooltip(props: TooltipProps) {
  return (
    <span className={styles.tooltip}>
      <span className={styles.tooltiptext}>{props.text}</span>
      {props.children}
    </span>
  );
}
