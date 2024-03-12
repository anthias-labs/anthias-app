"use client";

import styles from "./bubbleGraph.module.scss";

import { useEffect, useRef, useState } from "react";
import fetchProtocolAddresses from "@/app/_api/fetchProtocolAddresses";
import fetchAggregateData from "@/app/_api/fetchAggregateData";
import { useRouter, useSearchParams } from "next/navigation";

import {
  Chart as ChartJS,
  LinearScale,
  LogarithmicScale,
  PointElement,
  Tooltip,
  Legend,
} from "chart.js";
import annotationPlugin from "chartjs-plugin-annotation";

import { Bubble } from "react-chartjs-2";
ChartJS.register(
  LinearScale,
  LogarithmicScale,
  PointElement,
  Tooltip,
  Legend,
  annotationPlugin
);

import {
  moneyToRoundedString,
  roundedHealthFactor,
  formatAddress,
  protocolToTitle,
} from "@/app/_utils/textHandling";

import Filters from "@/app/_components/filters";
import Exports from "@/app/_components/exports";

export default function BubbleGraph({ protocol, initialData, thisProtocol }) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const title = protocolToTitle(protocol) + " Positions";

  const graphRef = useRef();

  const defaultGraphInfo = {
    xMin: Number.POSITIVE_INFINITY,
    xMax: 0,
    displayXMin: 0,
    displayXMax: 0,
    rMin: Number.POSITIVE_INFINITY,
    rMax: 0,
  };

  const [graphInfo, setGraphInfo] = useState(defaultGraphInfo);

  const [dataSet, setDataSet] = useState(initialData);
  const [aggregateHealthFactor, setAggregateHealthFactor] = useState("");

  const graphData = {
    datasets: [
      {
        data: dataSet,
        backgroundColor: (context) => {
          if (context.raw) {
            const index = context.dataIndex;
            const value = context.dataset.data[index];

            if (value.z === 1) {
              return "#1fcfcf";
            }
            if (value.z === 2) {
              return "#ee40bd";
            }

            if (value.z === 3) {
              return "#1fc73b";
            } else if (value.z === 4) {
              return "#ffa323";
            } else if (value.z === 5) {
              return "#ff2d2d";
            }

            return "transparent";
          }
        },
        borderColor: "transparent",
        radius: (context) => {
          if (context.raw) {
            const index = context.dataIndex;
            const value = context.dataset.data[index];

            if (value.isStakingAddress) {
              return 15;
            }

            return scaleRadius(context.raw.supplied, graphInfo, 5, 15);
          }
        },
        pointStyle: (context) => {
          if (context.raw) {
            // const index = context.dataIndex;
            // const value = context.dataset.data[index];
            // if (value.isStakingAddress) {
            //   return bankImage;
            // } else {
            return "circle";
            // }
          }
        },
      },
    ],
  };

  const options = {
    onClick: (e, i) => {
      if (i[0]) {
        const dataIndex = i[0].index;
        const address = dataSet[dataIndex].address;
        window.open(`${thisProtocol.link}/?address=${address}`, "_blank");
      }
    },
    onHover: (event, chartElement) => {
      const target = event.native ? event.native.target : event.target;
      target.style.cursor = chartElement[0] ? "pointer" : "default";
    },
    layout: {
      padding: {
        bottom: 0,
      },
    },
    plugins: {
      legend: {
        display: false,
      },
      tooltip: {
        backgroundColor: "#0f4646",
        callbacks: {
          label: getTooltipLabel,
          afterLabel: getTooltipBody,
        },
      },
      annotation: {
        annotations: {
          xAxis: {
            type: "line",
            yMin: 0,
            yMax: 0,
            borderColor: "white",
            borderWidth: 2,
          },
          yAxis: {
            type: "line",
            xMin: graphInfo.displayXMin,
            xMax: graphInfo.displayXMin,
            borderColor: "white",
            borderWidth: 2,
          },
          healthFactor0: {
            type: "line",
            borderColor: "white",
            xMin: 0,
            xMax: 0,
            borderDash: [10, 10],
            borderWidth: 2,
            label: {
              display: true,
              content: "Health Factor = 0",
              position: "start",
              color: "white",
              backgroundColor: "#0f4646",
              borderWidth: 0,
            },
          },
          healthFactor1: {
            type: "line",
            borderColor: "red",
            xMin: 1,
            xMax: 1,
            borderDash: [10, 10],
            borderWidth: 2,
            label: {
              display: true,
              content: "Health Factor = 1",
              position: "center",
              color: "white",
              backgroundColor: "#0f4646",
              borderWidth: 0,
            },
          },
          aggregateHealthFactor: {
            type: "line",
            borderColor: "#1fc73b",
            xMin: Number(aggregateHealthFactor),
            xMax: Number(aggregateHealthFactor),
            // yMax: yMax,
            borderDash: [10, 10],
            borderWidth: 3,
            label: {
              display: true,
              content: `Avg Health Factor = ${aggregateHealthFactor}`,
              position: "end",
              color: "white",
              backgroundColor: "#0f4646",
              borderWidth: 0,
            },
          },
        },
      },
    },
    scales: {
      x: {
        type: "linear",
        title: {
          display: true,
          text: "Health Factor",
          color: "white",
          padding: 20,
          font: {
            size: 16,
            weight: 400,
          },
        },
        min: graphInfo.displayXMin,
        max: graphInfo.displayXMax,
        grid: {
          display: false,
          color: "transparent",
        },
        ticks: {
          display: false,
        },
      },
      y: {
        type: "logarithmic",
        title: {
          display: true,
          text: "Total Borrowed",
          color: "white",
          padding: 20,
          font: {
            size: 16,
            weight: 400,
          },
        },
        grid: {
          display: false,
          color: "transparent",
        },
        ticks: {
          display: false,
        },
      },
    },
  };

  useEffect(() => {
    async function fetchData(params) {
      const addresses = await fetchProtocolAddresses(protocol, params);

      let { newDataSet, newGraphInfo } = addresses
        ? addressesToDataSet(addresses)
        : { newDataSet: [], newGraphInfo: defaultGraphInfo };

      newGraphInfo = setDisplayRange(newGraphInfo);

      let newOptions = { ...options };

      newOptions.scales.x.min = newGraphInfo.displayXMin;
      newOptions.scales.x.max = newGraphInfo.displayXMax;

      let newGraphData = { ...graphData };
      newGraphData.datasets[0].data = newDataSet;

      setDataSet(newDataSet);
      setGraphInfo(newGraphInfo);
    }

    async function fetchAggregateHealthFactor() {
      const aggregateData = await fetchAggregateData(protocol);
      setAggregateHealthFactor(
        roundedHealthFactor(aggregateData["avg_health_factor"])
      );
    }

    fetchData(searchParams);
    fetchAggregateHealthFactor();
  }, [searchParams]);

  function addressesToDataSet(addresses) {
    let newDataSet = [];
    let newGraphInfo = { ...defaultGraphInfo };

    addresses.forEach((address) => {
      if (address.health_factor > newGraphInfo.xMax)
        newGraphInfo.xMax = address.health_factor;
      if (address.health_factor < newGraphInfo.xMin)
        newGraphInfo.xMin = address.health_factor;
      if (address.total_supplied > newGraphInfo.rMax)
        newGraphInfo.rMax = address.total_supplied;
      if (address.total_supplied < newGraphInfo.rMin)
        newGraphInfo.rMin = address.total_supplied;

      let zIndex;

      if (address.health_factor === -1 || address.health_factor > 1.3) {
        zIndex = 3;
      } else if (address.health_factor > 1.1 && address.health_factor <= 1.3) {
        zIndex = 4;
      } else {
        zIndex = 5;
      }

      // if (address.self_collateralized) {
      //   zIndex = 1;
      // }
      // if (address.staking_address) {
      //   zIndex = 2;
      // }

      const dataPoint = {
        x: address.health_factor,
        y: address.total_borrowed,
        z: zIndex,
        address: address.address,
        supplied: address.total_supplied,
        selfCollateralized: false,
        stakingAddress: false,
      };

      if (dataPoint.x > -1) {
        newDataSet.push(dataPoint);
      }
    });

    newDataSet.sort((a, b) => {
      return a.z - b.z;
    });

    return { newDataSet, newGraphInfo };
  }

  function setDisplayRange(graphInfo) {
    let newGraphInfo = { ...graphInfo };

    if (newGraphInfo.xMax > 9) {
      newGraphInfo.displayXMax = 10;
    } else if (newGraphInfo.xMax < 1) {
      newGraphInfo.displayXMax = 5;
    } else {
      newGraphInfo.displayXMax =
        newGraphInfo.xMax * 1.1 < 5 ? 5 : newGraphInfo.xMax * 1.1;
    }

    newGraphInfo.displayXMin = -0.25;

    return newGraphInfo;
  }

  function scaleRadius(number, graphInfo, min, max) {
    return (
      ((number - graphInfo.rMin) * (max - min)) /
        (graphInfo.rMax - graphInfo.rMin) +
      min
    );
  }

  function getTooltipLabel(tooltipItem) {
    return " " + formatAddress(tooltipItem.raw.address);
  }

  function getTooltipBody(tooltipItem) {
    let totalBorrowed = tooltipItem.raw.y.toFixed(2);
    totalBorrowed = "$" + moneyToRoundedString(Number(totalBorrowed));

    let totalSupplied = tooltipItem.raw.supplied.toFixed(2);
    totalSupplied = "$" + moneyToRoundedString(Number(totalSupplied));

    const healthFactor = roundedHealthFactor(tooltipItem.raw.x);

    const retString =
      "Total Supplied: " +
      totalSupplied +
      "\nTotal Borrowed: " +
      totalBorrowed +
      "\nHealth Factor: " +
      healthFactor;

    return retString;
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
          <Exports
            data={dataSet}
            printRef={graphRef}
            csvFileName={protocol + "_positions_data"}
          />
        </div>
        <div className={styles.right}>
          <Filters protocol={protocol} showTokens={true} />
        </div>
      </div>
      <Graph data={graphData} options={options} />
    </div>
  );
}

function Graph({ data, options }) {
  return (
    <Bubble
      className={styles.graph}
      id={styles.bubbleChart}
      data={data}
      options={options}
    />
  );
}
