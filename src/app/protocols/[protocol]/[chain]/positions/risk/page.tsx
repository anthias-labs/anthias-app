"use server";

import Table from "@/app/_components/table";
import fetchProtocolLiquidations from "@/app/_api/fetchProtocolLiquidations";
import fetchProtocolMarketState from "@/app/_api/fetchProtocolMarketState";
import fetchProtocols from "@/app/_api/fetchProtocols";

import { protocolToTitle } from "@/app/_utils/textHandling";

export default async function MarketStateTable({ params, searchParams }) {
  const protocol = params.chain;
  const title = protocolToTitle(protocol) + " Market State";

  const urlSearchParams = new URLSearchParams(searchParams);
  const initialData = await fetchProtocolMarketState(protocol, urlSearchParams);

  const protocols = await fetchProtocols();
  const thisProtocol = protocols.find((p) => p.protocol === params.chain);

  const tableProps = {
    title: title,

    defaultFilters: {
      // sort: "timestamp",
      limit: 30,
      paginate: [1, 30],
    },

    // columns: {
    //   labels: [
    //     "Transaction",
    //     "Supply Asset",
    //     "Borrow Asset",
    //     "Borrower",
    //     "Liquidator",
    //     "Amount Repaid",
    //     "Timestamp (Unix)"
    //   ],
    //   keys: ["id", "supply_symbol", "borrow_symbol", "borrower", "liquidator", "debt_repaid", "timestamp"],
    // },

    columns: {
      labels: [
        "Market",
        "Collateral-at-risk",
        "Liquiduidation Capacity",
        "Price Volatility",
        "Risk Level",
      ],
      keys: [
        "supply_symbol",
        "collateral_at_risk",
        "dex_liquidity",
        "price_volatility",
        "risk_level",
      ],
    },

    link: {
      // base: 'https://explorer.mode.network/tx/',
      // key: "id",
      // newTab: true,
    },

    dataFetch: {
      function: fetchProtocolMarketState,
      args: [protocol],
    },

    // filters: {
    //   showProtocol: false,
    //   // protocol: protocol,
    //   showTokens: false,
    // },

    exports: false,
  };

  return <Table tableProps={tableProps} initialData={initialData} />;
}
