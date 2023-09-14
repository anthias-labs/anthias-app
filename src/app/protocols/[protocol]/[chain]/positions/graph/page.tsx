"use server";

import BubbleGraph from "@/app/_components/bubbleGraph";
import fetchProtocolAddresses from "@/app/_api/fetchProtocolAddresses";

export default async function PositionsGraph({ params, searchParams }) {
  const protocol = params.chain;

  const urlSearchParams = new URLSearchParams(searchParams);
  const initialData = await fetchProtocolAddresses(protocol, urlSearchParams);

  return <BubbleGraph protocol={protocol} initialData={initialData} />;
}
