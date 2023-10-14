import Image from "next/image";

import styles from "./sections.module.css";

export interface ContributeSectionProps {
  refs: any;
}

export default function ContributeSection(props: ContributeSectionProps) {
  return (
    <div ref={props.refs} className="docs-section">
      <h2>Contribute</h2>
      <p>
        KeeLink is a <b>free and no-profit application</b>. If you like and use
        this application consider to support me by sharing it with other people.
        Remember that is also possible to <b>donate something</b> in order to
        support the development and maintenance of all its parts.
      </p>
      <center>
        <form
          className={styles["contribute-form"]}
          action="https://www.paypal.com/cgi-bin/webscr"
          method="post"
          target="_top"
        >
          <input type="hidden" name="cmd" value="_s-xclick" />
          <input type="hidden" name="hosted_button_id" value="P4B9MDV9WYDS2" />
          <input
            type="image"
            src="https://www.paypalobjects.com/en_US/GB/i/btn/btn_donateCC_LG.gif"
            name="submit"
            alt="PayPal – The safer, easier way to pay online!"
          />
          <Image
            alt=""
            src="https://www.paypalobjects.com/it_IT/i/scr/pixel.gif"
            width="1"
            height="1"
          />
        </form>
      </center>
    </div>
  );
}
