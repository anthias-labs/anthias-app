import fetchProtocolsUnique from "@/app/_api/fetchProtocolsUnique";
import fetchProtocolIcons from "@/app/_api/fetchProtocolIcons";
import Table from "@/app/_components/table";

export default async function Protocols() {
  const tableProps = {
    title: "Select a Protocol",

    columns: {
      labels: ["Protocol"],
      keys: ["name"],
    },

    link: {
      base: "/protocols",
      key: "name",
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

  const initialData = await fetchProtocolsUnique();
  const initialIcons = await fetchProtocolIcons(initialData);

  return (
    <Table
      tableProps={tableProps}
      initialData={initialData}
      initialIcons={initialIcons}
    />
  );
}
