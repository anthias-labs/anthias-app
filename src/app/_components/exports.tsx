"use client";

import styles from "./exports.module.scss";
import watermarkURL from "@/app/_assets/images/watermark.png";
import html2canvas from "html2canvas";

export default function Exports({
  data,
  printRef,
  csvFileName = "anthias_data",
}) {
  async function exportImage() {
    try {
      const element = printRef.current;
      const canvas = await html2canvas(element);

      const resultCanvas = document.createElement("canvas");
      resultCanvas.width = canvas.width;
      resultCanvas.height = canvas.height;
      const ctx = resultCanvas.getContext("2d");

      ctx.drawImage(canvas, 0, 0);

      const watermarkImage = new Image();
      watermarkImage.src = "/images/watermark.png";
      watermarkImage.onload = () => {
        const watermarkX = (canvas.width - watermarkImage.width) / 2;
        const watermarkY = (canvas.height - watermarkImage.height) / 2;
        ctx.drawImage(watermarkImage, watermarkX, watermarkY);

        const data = resultCanvas.toDataURL("image/png");
        const link = document.createElement("a");

        if (typeof link.download === "string") {
          link.href = data;
          link.download = "anthias_image.png";

          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);
        } else {
          window.open(data);
        }
      };
    } catch (error) {
      console.error("Error occurred during image processing:", error);
    }
  }

  function exportCSV() {
    function objectToCSV(obj) {
      const header = Object.keys(obj[0]).join(",");
      const values = obj
        .map((row) =>
          Object.values(row)
            .map((value) => `"${value}"`)
            .join(",")
        )
        .join("\n");
      return header + "\n" + values;
    }

    const csvString = objectToCSV(data);

    const csvBlob = new Blob([csvString], {
      type: "text/csv;charset=utf-8;",
    });
    const csvUrl = URL.createObjectURL(csvBlob);
    const link = document.createElement("a");
    link.href = csvUrl;
    link.download = csvFileName + ".csv";
    link.style.display = "none";
    document.body.appendChild(link);
    link.click();
    setTimeout(() => {
      document.body.removeChild(link);
      URL.revokeObjectURL(csvUrl);
    }, 100);
  }

  return (
    <div className={styles.exports}>
      <div className={styles.export} onClick={exportImage}>
        <svg
          width="18"
          height="18"
          viewBox="0 0 18 18"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path d="M2 18C1.45 18 0.979002 17.804 0.587002 17.412C0.195002 17.02 -0.000664969 16.5493 1.69779e-06 16V2C1.69779e-06 1.45 0.196002 0.979002 0.588002 0.587002C0.980002 0.195002 1.45067 -0.000664969 2 1.69779e-06H16C16.55 1.69779e-06 17.021 0.196002 17.413 0.588002C17.805 0.980002 18.0007 1.45067 18 2V16C18 16.55 17.804 17.021 17.412 17.413C17.02 17.805 16.5493 18.0007 16 18H2ZM3 14H15L11.25 9L8.25 13L6 10L3 14Z" />
        </svg>
        Export Image
      </div>
      <div className={styles.export} onClick={exportCSV}>
        <svg
          width="18"
          height="20"
          viewBox="0 0 18 20"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path d="M18 7.05882H12.8571V0H5.14286V7.05882H0L9 15.2941L18 7.05882ZM0 17.6471V20H18V17.6471H0Z" />
        </svg>
        Export CSV
      </div>
    </div>
  );
}
