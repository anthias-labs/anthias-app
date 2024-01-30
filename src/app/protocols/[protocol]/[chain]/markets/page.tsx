"use server";

import tableImg from "@/assets/icons/table.svg";
import graphImg from "@/assets/icons/graph.svg";

import fetchProtocolsUnique from "@/app/_api/fetchProtocolsUnique";
import fetchProtocolIcons from "@/app/_api/fetchProtocolIcons";
import Table from "@/app/_components/table";

import { redirect } from "next/navigation";

export default async function MarketsPage({ params }) {
  redirect(`/protocols/${params.protocol}/${params.chain}/markets/table`);

  const tableProps = {
    title: "Select a View",

    columns: {
      labels: ["View"],
      keys: ["view"],
    },

    link: {
      base: `/protocols/${params.protocol}/${params.chain}/markets`,
      key: "view",
    },

    customData: {
      data: [
        {
          view: "table",
          name: "Table",
        },
        // {
        //   view: "graph",
        //   name: "Graph",
        // },
      ],

      icons: [
        tableImg,
        // graphImg
      ],
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
