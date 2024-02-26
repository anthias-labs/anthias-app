"use server";

import Position from "./position";

import fetchPosition from "../_api/fetchPosition";
import fetchProtocols from "../_api/fetchProtocols";
import fetchTokenPrices from "../_api/fetchTokenPrices";
import fetchCovarianceMatrices from "../_api/fetchCovarianceMatrices";

export default async function PositionPage({ searchParams }) {
  const protocols = await fetchProtocols();
  const trimmedProtocols = protocols.filter(
    (protocol) => protocol.name === "compound"
  );

  const position = await fetchPosition(searchParams.address, trimmedProtocols);

  const positionProtocols = trimmedProtocols.filter((protocol) =>
    position.some((p) => p.protocol.protocol === protocol.protocol)
  );

  const tokenPrices = await fetchTokenPrices();
  const covarianceMatrices = await fetchCovarianceMatrices(
    positionProtocols,
    180
  );

  return (
    <div>
      <Position
        searchParams={searchParams}
        defaultPosition={position}
        tokenPrices={tokenPrices}
        covarianceMatrices={covarianceMatrices}
      />
    </div>
  );
}
