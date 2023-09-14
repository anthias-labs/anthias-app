"use client";

import styles from "./page.module.scss";
import Table from "@/app/_components/table";
import { useEffect, useState } from "react";
import fetchProtocolAddresses from "@/app/_api/fetchProtocolAddresses";
import { useRouter, usePathname, useSearchParams } from "next/navigation";
import {
  moneyToRoundedString,
  roundedHealthFactor,
  getHealthFactorClass,
} from "@/app/_utils/textHandling";
import Link from "next/link";
import { Loader } from "@mantine/core";

export default function Wallets() {
  const tableProps = {
    title: "Wallets",
    defaultFilters: {
      sort: "total_borrowed",
      limit: 10,
      paginate: [1, 10],
    },
  };

  return <Table tableProps={tableProps} />;
}
