"use server";

import Table from "@/app/_components/table";
import fetchProtocolLiquidations from "@/app/_api/fetchProtocolLiquidations";
import fetchProtocols from "@/app/_api/fetchProtocols";

import { protocolToTitle } from "@/app/_utils/textHandling";

export default async function PositionsLiquidations({ params, searchParams }) {
  const protocol = params.chain;
  const title = protocolToTitle(protocol) + " Liquidations";

  const urlSearchParams = new URLSearchParams(searchParams);
  const initialData = await fetchProtocolLiquidations(protocol, urlSearchParams);

  const protocols = await fetchProtocols();
  const thisProtocol = protocols.find((p) => p.protocol === params.chain);

  const tableProps = {
    title: title,

    defaultFilters: {
      sort: "total_borrowed",
      limit: 10,
      paginate: [1, 10],
    },

    columns: {
      labels: [
        "Tx id",
        "collateral",
        "debt",
        "borrow",
        "liquidator",
        "timestamp"
      ],
      keys: ["id", "collateral_asset_symbol", "debt_asset_symbol", "borrower", "liquidator", "timestamp"],
    },

    link: {
      base: thisProtocol.link,
      key: "address",
      newTab: true,
    },

    dataFetch: {
      function: fetchProtocolLiquidations,
      args: [protocol],
    },

    filters: {
      protocol: protocol,
      showTokens: false,
    },

    exports: false,
  };

  return <Table tableProps={tableProps} initialData={initialData} />;
}
