"use server";

import fetchProtocolMarkets from "@/app/_api/fetchProtocolMarkets";
import fetchTokenIcons from "@/app/_api/fetchTokenIcons";
import TreeGraph from "@/app/_components/treeGraph";

export default async function MarketsGraph({ params, searchParams }) {
  const protocol = params.chain;

  const urlSearchParams = new URLSearchParams(searchParams);
  const initialData = await fetchProtocolMarkets(protocol, urlSearchParams);

  const token_symbols = initialData.map((market) => market.token_symbol);
  const initialIcons = await fetchTokenIcons(token_symbols);

  return (
    <TreeGraph
      protocol={protocol}
      initialData={initialData}
      initialIcons={initialIcons}
    />
  );
}
