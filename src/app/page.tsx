"use server";

import tokensImg from "@/assets/icons/token.svg";
import walletsImg from "@/assets/icons/wallet.svg";
import protocolsImg from "@/assets/icons/protocol.svg";
import fishImg from "@/assets/icons/fish.svg";

import fetchProtocolsUnique from "@/app/_api/fetchProtocolsUnique";
import fetchProtocolIcons from "@/app/_api/fetchProtocolIcons";
import Table from "@/app/_components/table";

export default async function HomePage() {
  const tableProps = {
    title: "Time to go Fishing",

    columns: {
      labels: ["Mode"],
      keys: ["name"],
    },

    link: {
      base: "",
      key: "mode",
    },

    customData: {
      data: [
        {
          name: "Protocols",
          mode: "protocols",
        },
        {
          name: "Position",
          mode: "position",
        },
        // {
        //   name: "Tokens",
        //   mode: "tokens",
        // },
        // {
        //   name: "Account",
        //   mode: "account",
        // },
      ],

      icons: [protocolsImg, walletsImg, fishImg],
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
