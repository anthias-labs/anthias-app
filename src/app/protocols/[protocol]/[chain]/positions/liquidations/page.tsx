"use server";

import Table from "@/app/_components/table";
import fetchProtocolLiquidations from "@/app/_api/fetchProtocolLiquidations";
import fetchProtocols from "@/app/_api/fetchProtocols";

import { protocolToTitle } from "@/app/_utils/textHandling";

export default async function LiquidationsTable({ params, searchParams }) {
  const protocol = params.chain;
  const title = protocolToTitle(protocol) + " Liquidations (Last 30)";

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
      // sort: "timestamp",
      limit: 30,
      paginate: [1, 30],
    },

    columns: {
      labels: [
        "Transaction",
        "Supply Asset",
        "Borrow Asset",
        "Borrower",
        "Liquidator",
        "Amount Repaid",
        "Timestamp (Unix)"
      ],
      keys: ["id", "supply_symbol", "borrow_symbol", "borrower", "liquidator", "debt_repaid", "timestamp"],
    },

    link: {
      base: 'https://explorer.mode.network/tx/',
      key: "id",
      newTab: true,
    },

    dataFetch: {
      function: fetchProtocolLiquidations,
      args: [protocol],
    },

    // filters: {
    //   showProtocol: false,
    //   // protocol: protocol,
    //   showTokens: false,
    // },

    exports: false,
  };

  return <Table tableProps={tableProps} initialData={initialData} />;
}
