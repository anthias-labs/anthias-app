"use server";

import Position from "./position";
import styles from "./page.module.scss";

import fetchPosition from "../_api/fetchPosition";
import fetchProtocols from "../_api/fetchProtocols";

export default async function PositionPage({ searchParams }) {
  const protocols = await fetchProtocols();
  const trimmedProtocols = protocols.filter(
    (protocol) => protocol.name === "compound"
  );

  const position = await fetchPosition(searchParams.address, trimmedProtocols);

  return (
    <div>
      <Position searchParams={searchParams} defaultPosition={position} />
    </div>
  );
}
