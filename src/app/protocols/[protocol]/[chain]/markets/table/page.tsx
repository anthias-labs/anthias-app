"use server";

import Table from "@/app/_components/table";
import fetchProtocolMarkets from "@/app/_api/fetchProtocolMarkets";
import fetchTokenIcons from "@/app/_api/fetchTokenIcons";

import { protocolToTitle } from "@/app/_utils/textHandling";

export default async function MarketsTable({ params, searchParams }) {
  const protocol = params.chain;
  const title = protocolToTitle(protocol) + " Markets";

  const tableProps = {
    title: title,

    defaultFilters: {
      sort: "total_borrowed",
      limit: 10,
      paginate: [1, 10],
    },

    columns: {
      labels: ["Token", "Total Supplied (USD)", "Total Borrowed (USD)"],
      keys: ["underlying_symbol", "total_supplied", "total_borrowed"],
    },

    link: {
      base: "https://etherscan.io/token",
      key: "token_address",
    },

    dataFetch: {
      function: fetchProtocolMarkets,
      args: [protocol],
    },

    iconsFetch: {
      function: fetchTokenIcons,
      args: [],
    },

    // filters: {
    //   protocol: protocol,
    // },

    // exports: true,
  };

  const urlSearchParams = new URLSearchParams(searchParams);
  const initialData = await fetchProtocolMarkets(protocol);

  return <Table tableProps={tableProps} initialData={initialData} />;
}
