"use client";
import React, { useEffect, useState, useRef } from "react";
import dynamic from "next/dynamic";
import { ApexOptions } from "apexcharts";

const Chart = dynamic(() => import("react-apexcharts"), { ssr: false });

interface DataPoint {
  x: number;
  y: number;
}

export default function RealTimeAreaChart() {
  const [data, setData] = useState<DataPoint[]>([]);
  const seriesRef = useRef<{ data: DataPoint[] }>({ data: [] });

  const generateRandomPoint = () => {
    const timestamp = new Date().getTime();
    const value = Math.random() * 2;
    return { x: timestamp, y: value };
  };

  useEffect(() => {
    const interval = setInterval(() => {
      const newPoint = generateRandomPoint();
      seriesRef.current.data = [...seriesRef.current.data, newPoint];

      if (seriesRef.current.data.length > 30) {
        seriesRef.current.data.shift();
      }

      setData([...seriesRef.current.data]);
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  const options: ApexOptions = {
    chart: {
      id: "realtime",
      type: "area",
      animations: {
        enabled: true,
        dynamicAnimation: {
          enabled: true,
          speed: 1000, // velocidad de animación en ms
        },
      },
      toolbar: { show: false },
      zoom: { enabled: false },
    },
    stroke: { curve: "smooth" },
    xaxis: {
      type: "datetime",
      labels: { datetimeUTC: false },
      max: new Date().getTime(),
      tickAmount: 0,
    },
    yaxis: { max: 10, decimalsInFloat: 2 },
    fill: {
      type: "gradient",
      colors: ["#008FFB"],
      gradient: { shadeIntensity: 1, opacityFrom: 0.4, opacityTo: 0 },
    },
    dataLabels: { enabled: false },
  };

  return (
    <div className="w-1/3 h-32">
      <Chart
        options={options}
        series={[{ name: "Valor", data }]}
        type="area"
        height={250}
      />
    </div>
  );
}
