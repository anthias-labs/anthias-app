"use client";

import styles from "./cards.module.scss";

import fetchAggregateData from "@/app/_api/fetchAggregateData";
import {
  snakeToTitleCase,
  roundedHealthFactor,
} from "@/app/_utils/textHandling";
import { Skeleton } from "@mantine/core";
import { useEffect, useState } from "react";
import { motion } from "framer-motion";

export default function Cards({ protocol, initialData = null }) {
  const [cardData, setCardData] = useState(initialData);

  const formatter = Intl.NumberFormat("en-US", { notation: "compact" });

  const desiredCards = [
    "total_supplied",
    "total_borrowed",
    "avg_health_factor",
    // "self_collateralized_count",
    "active_wallets",
    "wallets_at_risk",
  ];

  useEffect(() => {
    async function fetchData() {
      const cardData = await fetchAggregateData(protocol.protocol);
      setCardData(cardData);
    }

    fetchData();
  }, []);

  return (
    <div className={styles.cards}>
      <div className={styles.cardSection}>
        {desiredCards.map((key, index) => {
          return (
            <motion.div
              key={index}
              className={styles.card}
              initial={{ opacity: 0, y: 50 }}
              animate={{
                opacity: [0, 1],
                y: [50, 0],
              }}
              transition={{
                duration: 0.2,
                delay: index * 0.1,
              }}
            >
              <div className={styles.cardTitle}>{snakeToTitleCase(key)}</div>
              <div className={styles.cardValue}>
                {cardData ? (
                  key === "avg_health_factor" ? (
                    roundedHealthFactor(cardData[key])
                  ) : key === "total_supplied" || key === "total_borrowed" ? (
                    <>${formatter.format(cardData[key])}</>
                  ) : (
                    formatter.format(cardData[key])
                  )
                ) : (
                  <Skeleton
                    className={styles.skeleton}
                    height="1.5rem"
                    width="60%"
                    style={{ backgroundColor: "black", opacity: 0.1 }}
                  />
                )}
              </div>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}
