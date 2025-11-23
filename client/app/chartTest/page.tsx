"use client";
import React, { useEffect, useState, useRef } from "react";
import dynamic from "next/dynamic";
import { ApexOptions } from "apexcharts";

const Chart = dynamic(() => import("react-apexcharts"), { ssr: false });

interface DataPoint {
  x: number;
  y: number;
}

interface SeriesData {
  [label: string]: DataPoint[];
}

// Colores predefinidos para cada serie
const COLORS = [
  "#008FFB",
  "#00E396",
  "#FEB019",
  "#FF4560",
  "#775DD0",
  "#3F51B5",
  "#546E7A",
  "#D4526E",
  "#8D5B4C",
  "#F86624",
];

export default function RealTimeCharts() {
  const [seriesData, setSeriesData] = useState<SeriesData>({});
  const seriesRef = useRef<SeriesData>({});

  useEffect(() => {
    const ws = new WebSocket(
      (process.env.NEXT_PUBLIC_WS_URL ?? "ws://localhost:4000") + "/ws/alerts"
    );

    ws.onmessage = (event) => {
      const parsed = JSON.parse(event.data);
      const label = parsed.alert?.label || parsed.label;
      if (!label) return;

      const timestamp = new Date().getTime();
      const value = parsed.alert?.value ?? 0;

      if (!seriesRef.current[label]) seriesRef.current[label] = [];

      seriesRef.current[label].push({ x: timestamp, y: value });

      if (seriesRef.current[label].length > 30) {
        seriesRef.current[label].shift();
      }

      setSeriesData({ ...seriesRef.current });
    };

    return () => ws.close();
  }, []);

  const labels = Object.keys(seriesData);

  return (
    <div className="flex flex-wrap gap-4">
      {labels.map((label, index) => {
        const data = seriesData[label];
        const color = COLORS[index % COLORS.length]; // ciclo de colores

        const options: ApexOptions = {
          chart: {
            id: label,
            type: "area",
            animations: {
              enabled: true,
              dynamicAnimation: { enabled: true, speed: 400 },
            },
            toolbar: { show: false },
            zoom: { enabled: false },
          },
          stroke: { curve: "smooth" },
          xaxis: {
            type: "datetime",
            labels: { datetimeUTC: false },
          },
          fill: {
            type: "gradient",
            colors: [color],
            gradient: { shadeIntensity: 1, opacityFrom: 0.4, opacityTo: 0 },
          },
          dataLabels: { enabled: false },
          title: { text: label },
          tooltip: { x: { format: "HH:mm:ss" } },
        };

        return (
          <div key={label} className="w-1/3 h-64">
            <Chart
              options={options}
              series={[{ name: label, data }]}
              type="area"
              height={250}
            />
          </div>
        );
      })}
    </div>
  );
}
