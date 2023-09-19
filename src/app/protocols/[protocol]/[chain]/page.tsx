"use server";

import walletImg from "@/assets/icons/wallet.svg";
import marketImg from "@/assets/icons/token.svg";
import fetchProtocolsUnique from "@/app/_api/fetchProtocolsUnique";
import fetchProtocolIcons from "@/app/_api/fetchProtocolIcons";
import Table from "@/app/_components/table";

export default async function ProtocolChainPage({ params }) {
  const tableProps = {
    title: "Select a Mode",

    columns: {
      labels: ["Mode"],
      keys: ["name"],
    },

    link: {
      base: `/protocols/${params.protocol}/${params.chain}`,
      key: "mode",
    },

    customData: {
      data: [
        {
          mode: "positions",
          name: "Positions",
        },
        {
          mode: "markets",
          name: "Markets",
        },
      ],

      icons: [walletImg, marketImg],
    },

    dataFetch: {
      function: fetchProtocolsUnique,
      args: [],
    },

    iconsFetch: {
      function: fetchProtocolIcons,
      args: [],
    },
  };

  const initialData = tableProps.customData.data;
  const initialIcons = tableProps.customData.icons;

  return (
    <Table
      tableProps={tableProps}
      initialData={initialData}
      initialIcons={initialIcons}
    />
  );
}
