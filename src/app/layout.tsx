import "../globals.scss";

import styles from "./layout.module.scss";
import Navbar from "./_components/navbar";
import { Analytics } from "@vercel/analytics/react";
import fetchProtocols from "./_api/fetchProtocols";
import Footer from "./_components/footer";
import getIsMobile from "./_utils/getIsMobile";

export const metadata = {
  title: "Anthias",
  description: "Democratizing blockchain data for all",
};

export const revalidate = 0;

export default async function RootLayout({ children }) {
  const protocols = await fetchProtocols();
  const isMobile = await getIsMobile();

  return (
    <html lang="en">
      <body className={styles.body}>
        {!isMobile && <Navbar protocols={protocols} />}
        <div className={styles.content}>{children}</div>
        {!isMobile && <Footer />}
      </body>
      <Analytics />
    </html>
  );
}
