import "./css/normalize.css";
import "./css/pace.css";
import "./css/skeleton.css";

import type { Metadata } from "next";
import Script from "next/script";
import { Raleway } from "next/font/google";

const inter = Raleway({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "KeeLink",
  description: "Generated by create next app",
  authors: [{ name: "Andrea Cioni", url: "https://github.com/andreacioni" }],
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <head>
        {/* SEO */}
        <meta
          name="description"
          content="KeeLink is a Keepass2Android plug-in that allows everyone to safely share credentials between the smartphone and every other device."
        />

        {/* Mobile Specific Metas */}
        <meta name="viewport" content="width=device-width, initial-scale=1" />

        {/* Favicon */}
        <link rel="icon" type="image/ico" href="images/favicon.ico" />

        {/* JS Library */}
        <Script
          src="https://kit.fontawesome.com/992540661e.js"
          crossOrigin="anonymous"
        />
        <Script
          type="text/javascript"
          src="lib/pace/pace.js"
          data-pace-options='{ "ajax": false }'
        />
        <Script type="text/javascript" src="libs/jsencrypt/jsencrypt.min.js" />
        <Script type="text/javascript" src="libs/qrcode/qrcode.min.js" />
        <Script
          type="text/javascript"
          src="libs/sweetalert/sweetalert.min.js"
        />
        <Script type="text/javascript" src="libs/clipboard/clipboard.min.js" />
      </head>
      <body className={inter.className}>{children}</body>
    </html>
  );
}
