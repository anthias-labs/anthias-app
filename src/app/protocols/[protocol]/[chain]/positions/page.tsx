"use server";

import tableImg from "@/assets/icons/table.svg";
import graphImg from "@/assets/icons/graph.svg";
import liquidationsImg from "@/assets/icons/liquidations.svg";

import fetchProtocolsUnique from "@/app/_api/fetchProtocolsUnique";
import fetchProtocolIcons from "@/app/_api/fetchProtocolIcons";
import Table from "@/app/_components/table";

export default async function PositionsPage({ params }) {
  const directory =
    params.chain === "ionic_v1_mode"
      ? [
          {
            view: "table",
            name: "Table",
          },
          {
            view: "graph",
            name: "Graph",
          },
          {
            view: "liquidations",
            name: "Liquidations",
          },
        ]
      : [
          {
            view: "table",
            name: "Table",
          },
          {
            view: "graph",
            name: "Graph",
          },
        ];

  const tableProps = {
    title: "Select a View",

    columns: {
      labels: ["View"],
      keys: ["view"],
    },

    link: {
      base: `/protocols/${params.protocol}/${params.chain}/positions`,
      key: "view",
    },

    customData: {
      data: directory,

      icons: [tableImg, graphImg, liquidationsImg],
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
