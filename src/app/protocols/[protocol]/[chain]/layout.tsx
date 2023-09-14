import styles from "./layout.module.scss";
import fetchProtocols from "@/app/_api/fetchProtocols";
import Cards from "@/app/_components/cards";
import fetchAggregateData from "@/app/_api/fetchAggregateData";

export default async function ProtocolChainLayout({ params, children }) {
  const protocol = await fetchProtocols(params.chain);

  const initialCardData = await fetchAggregateData(protocol[0].protocol);

  return (
    <div className={styles.protocolChainLayout}>
      <Cards protocol={protocol[0]} initialData={initialCardData} />
      {children}
    </div>
  );
}
