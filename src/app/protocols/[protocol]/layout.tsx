"use client";

import styles from "./layout.module.scss";

import defaultImg from "@/assets/icons/defaultProtocol.svg";
import Image from "next/image";
import { useEffect, useState } from "react";
import {
  snakeToTitleCase,
  titleCase,
  protocolToTitle,
} from "@/app/_utils/textHandling";
import { usePathname } from "next/navigation";

export default function ProtocolLayout({ children }) {
  const [protocolIcon, setProtocolIcon] = useState(null);
  const [tokenIcon, setTokenIcon] = useState(null);

  const pathname = usePathname().split("/");

  const protocolName = pathname[2];
  const protocolFull = pathname[3];
  let protocolChain = protocolFull ? protocolToTitle(protocolFull) : null;

  if (protocolChain) {
    let protocolChainSplit = protocolChain.split(" ");
    protocolChainSplit.shift();
    protocolChain = protocolChainSplit.join(" ");
  }

  useEffect(() => {
    setProtocolIcon(`/protocolIcons/${protocolName}.svg`);
    if (protocolFull) {
      setTokenIcon(`/protocolTokenIcons/${protocolFull.split("_")[2]}.svg`);
    }
  }, [pathname]);

  return (
    <div className={styles.protocolLayout}>
      <span className={styles.title}>
        <Image
          src={protocolIcon || defaultImg}
          alt={"icon"}
          width={100}
          height={100}
        />
        {titleCase(protocolName)}
        {protocolChain && (
          <>
            <svg
              width="36"
              height="36"
              viewBox="0 0 36 36"
              fill="#fff"
              xmlns="http://www.w3.org/2000/svg"
            >
              <circle cx="18" cy="18" r="18" />
            </svg>
            <Image
              src={tokenIcon || defaultImg}
              alt={"icon"}
              width={100}
              height={100}
            />
            {protocolChain}
          </>
        )}
      </span>
      {children}
    </div>
  );
}
