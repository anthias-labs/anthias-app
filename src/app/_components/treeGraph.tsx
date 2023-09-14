"use client";

import styles from "./treeGraph.module.scss";

import defaultImg from "@/assets/icons/defaultProtocol.svg";
import { Treemap, ResponsiveContainer, Tooltip } from "recharts";
import { protocolToTitle } from "../_utils/textHandling";
import Filters from "@/app/_components/filters";
import Exports from "@/app/_components/exports";
import { useEffect, useRef, useState } from "react";
import { moneyToRoundedString } from "../_utils/textHandling";
import fetchTokenIcons from "../_api/fetchTokenIcons";
import Image from "next/image";

export default function TreeGraph({
  protocol,
  initialData = null,
  initialIcons = null,
}) {
  const icons = initialIcons;
  const title = protocolToTitle(protocol) + " Markets";
  const [data, setData] = useState(initialData);
  const graphRef = useRef();

  const colors = [
    "#1FCFCF",
    "#98DA8B",
    "#F5CB39",
    "#F2516A",
    "#EE40BD",
    "#73A2D5",
  ];

  // const colors = [
  //   "#1fcfcf", // Original Colors
  //   "#ee40bd",
  //   "#1A78D1",
  //   "#CF4334",
  //   "#CF840A",
  //   "#15CF6E",

  //   "#0da7a7", // Variations & Complements
  //   "#d720a2",
  //   "#0f64b8",
  //   "#b8372a",
  //   "#b86908",
  //   "#12a859",

  //   "#ee89c7", // Tints & Shades
  //   "#3389ab",
  //   "#e35b89",
  //   "#e8a267",
  //   "#3cdb99",
  //   "#0e94a5",
  // ];

  function CustomizedContent(props) {
    return (
      <>
        <rect
          x={props.x}
          y={props.y}
          width={props.width}
          height={props.height}
          style={{
            fill: colors[props.index % colors.length],
          }}
        />
        {props.width > 100 && props.height > 100 && (
          <text
            x={props.x + 4}
            y={props.y + 18}
            fill="#fff"
            fontSize={16}
            fillOpacity={1}
          >
            {props.name}
          </text>
        )}
      </>
    );
  }

  function CustomTooltip(props) {
    if (props.active && props.payload && props.payload.length) {
      const payload = props.payload[0].payload;

      return (
        <div className={styles.tooltip}>
          <h1>
            <Image
              src={icons[payload.name] || defaultImg}
              alt={payload.name}
              width={24}
              height={24}
            />
            {payload.name}
          </h1>
          <div className={styles.content}>
            <p>
              {`Total Borrowed: $${moneyToRoundedString(
                payload.total_borrowed
              )}`}
            </p>
            <p>
              {`Total Supplied: $${moneyToRoundedString(
                payload.total_supplied
              )}`}
            </p>
          </div>
        </div>
      );
    }
    return null;
  }

  return (
    <div
      className={styles.graphContainer}
      id={styles.printContainer}
      ref={graphRef}
    >
      <div className={styles.titleBar}>
        <div className={styles.left}>
          {title}
          {/* <Exports
            data={data}
            printRef={graphRef}
            csvFileName={protocol + "_markets_data"}
          /> */}
        </div>
        <div className={styles.right}>
          {/* <Filters protocol={protocol} /> */}
        </div>
      </div>
      <div className={styles.treemapContainer}>
        <ResponsiveContainer height={550} width="100%">
          <Treemap
            data={data}
            dataKey="total_borrowed"
            animationDuration={500}
            aspectRatio={4 / 3}
            content={<CustomizedContent />}
          >
            <Tooltip content={<CustomTooltip />} />
          </Treemap>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
