"use server";

import Table from "@/app/_components/table";
import fetchProtocolAddresses from "@/app/_api/fetchProtocolAddresses";
import fetchProtocols from "@/app/_api/fetchProtocols";

import { protocolToTitle } from "@/app/_utils/textHandling";

export default async function PositionsTable({ params, searchParams }) {
  const protocol = params.chain;
  const title = protocolToTitle(protocol) + " Positions";

  const urlSearchParams = new URLSearchParams(searchParams);
  const initialData = await fetchProtocolAddresses(protocol, urlSearchParams);

  const protocols = await fetchProtocols();
  const thisProtocol = protocols.find((p) => p.protocol === params.chain);
  console.log("thisProtocol", thisProtocol.name);

  const tableProps = {
    title: title,

    defaultFilters: {
      sort: "total_borrowed",
      limit: 10,
      paginate: [1, 10],
    },

    columns: {
      labels: [
        "Wallet",
        "Total Supplied (USD)",
        "Total Borrowed (USD)",
        "Health Factor",
      ],
      keys: ["address", "total_supplied", "total_borrowed", "health_factor"],
    },

    link: {
      base: thisProtocol.link,
      key: "address",
    },

    dataFetch: {
      function: fetchProtocolAddresses,
      args: [protocol],
    },

    filters: {
      protocol: protocol,
    },

    exports: true,
  };

  return <Table tableProps={tableProps} initialData={initialData} />;
}
