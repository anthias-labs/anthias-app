import fetchTokensUnique from "@/app/_api/fetchTokensUnique";
import fetchTokenIcons from "@/app/_api/fetchTokenIcons";
import fetchProtocolIcons from "../_api/fetchProtocolIcons";
import Table from "@/app/_components/table";
import tokensToProtocolNames from "../_utils/tokensToProtocolNames";

export default async function Tokens({ searchParams }) {
  const urlSearchParams = new URLSearchParams(searchParams);
  const initialData = await fetchTokensUnique(urlSearchParams);

  console.log("initialData", initialData);

  const protocolNames = tokensToProtocolNames(initialData);
  const protocolIcons = await fetchProtocolIcons(protocolNames, true);

  const protocolIconsObject = protocolNames.reduce((acc, name, idx) => {
    acc[name] = protocolIcons[idx];
    return acc;
  }, {});

  const tableProps = {
    title: "Select a Token",

    defaultFilters: {
      limit: 10,
      paginate: [1, 10],
    },

    columns: {
      labels: ["Token", "Price", "Protocols", "Best Collateral Factor"],
      keys: [
        "underlying_symbol",
        "price",
        "protocol_names",
        "highest_collateral_factor",
      ],
    },

    link: {
      base: "https://etherscan.io/token",
      key: "underlying_address",
    },

    dataFetch: {
      function: fetchTokensUnique,
      args: [],
    },

    iconsFetch: {
      function: fetchTokenIcons,
      args: [],
      protocolIconsObject: protocolIconsObject,
    },

    filters: {
      protocol: "tokens",
    },

    exports: true,
  };

  return <Table tableProps={tableProps} initialData={initialData} />;
}
