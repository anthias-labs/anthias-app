"use server";

import Table from "@/app/_components/table";
import fetchProtocolLiquidations from "@/app/_api/fetchProtocolLiquidations";
import fetchProtocols from "@/app/_api/fetchProtocols";

import { protocolToTitle } from "@/app/_utils/textHandling";

export default async function LiquidationsTable({ params, searchParams }) {
  const protocol = params.chain;
  const title = protocolToTitle(protocol) + " Liquidations";

  const urlSearchParams = new URLSearchParams(searchParams);
  const initialData = await fetchProtocolLiquidations(
    protocol,
    urlSearchParams
  );

  const protocols = await fetchProtocols();
  const thisProtocol = protocols.find((p) => p.protocol === params.chain);

  const tableProps = {
    title: title,

    defaultFilters: {
      sort: "timestamp",
      limit: 10,
      paginate: [1, 10],
    },

    columns: {
      labels: [
        "Tx ID",
        "Supply Asset",
        "Borrow Asset",
        "Borrower",
        "Liquidator",
      ],
      keys: ["id", "supply_symbol", "borrow_symbol", "borrower", "liquidator"],
    },

    link: {
      base: thisProtocol.link,
      key: "id",
      newTab: true,
    },

    dataFetch: {
      function: fetchProtocolLiquidations,
      args: [protocol],
    },

    // filters: {
    //   protocol: protocol,
    //   showTokens: false,
    // },

    exports: false,
  };

  return <Table tableProps={tableProps} initialData={initialData} />;
}
