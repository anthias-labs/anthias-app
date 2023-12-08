"use server";

import BubbleGraph from "@/app/_components/bubbleGraph";
import fetchProtocolAddresses from "@/app/_api/fetchProtocolAddresses";
import fetchProtocols from "@/app/_api/fetchProtocols";

export default async function PositionsGraph({ params, searchParams }) {
  const protocol = params.chain;

  const urlSearchParams = new URLSearchParams(searchParams);
  const initialData = await fetchProtocolAddresses(protocol, urlSearchParams);

  const protocols = await fetchProtocols();
  const thisProtocol = protocols.find((p) => p.protocol === params.chain);

  return (
    <BubbleGraph
      protocol={protocol}
      initialData={initialData}
      thisProtocol={thisProtocol}
    />
  );
}
