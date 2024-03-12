"use server";

import Table from "@/app/_components/table";
import fetchProtocolTokenIcons from "@/app/_api/fetchProtocolTokenIcons";
import fetchProtocol from "@/app/_api/fetchProtocolByName";
import { redirect } from "next/navigation";

export default async function Protocol({ params }) {
  const name = params.protocol;

  const tableProps = {
    title: "Select a Chain",

    columns: {
      labels: ["Protocol"],
      keys: ["chain"],
    },

    link: {
      base: `/protocols/${name}`,
      key: "protocol",
    },

    dataFetch: {
      function: fetchProtocol,
      args: [name],
    },

    iconsFetch: {
      function: fetchProtocolTokenIcons,
      args: [],
    },
  };

  const initialData = await fetchProtocol(name);
  const initialIcons = await fetchProtocolTokenIcons(initialData);

  if (initialData.length === 1 && tableProps.link) {
    redirect(`${tableProps.link.base}/${initialData[0][tableProps.link.key]}`);
  }

  return (
    <Table
      tableProps={tableProps}
      initialData={initialData}
      initialIcons={initialIcons}
    />
  );
}
