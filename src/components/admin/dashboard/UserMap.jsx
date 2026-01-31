"use client";
import React, { useCallback, useState } from "react";
import { worldMill } from "@react-jvectormap/world";
import dynamic from "next/dynamic";

const VectorMap = dynamic(
  () => import("@react-jvectormap/core").then((mod) => mod.VectorMap),
  { ssr: false },
);

const UserMap = ({ markers = [] }) => {
  const [tooltip, setTooltip] = useState({ show: false, text: "" });

  const onMarkerOver = useCallback(
    (event, code) => {
      const index = parseInt(code, 10);
      const marker = markers[index];
      if (marker?.name) {
        setTooltip({ show: true, text: marker.name });
      }
    },
    [markers]
  );

  const onMarkerOut = useCallback(() => {
    setTooltip((prev) => ({ ...prev, show: false }));
  }, []);

  const onMarkerTipShow = useCallback((event) => {
    event?.preventDefault?.();
  }, []);

  return (
    <div className="rounded-2xl bg-white p-6 shadow-lg transition-all duration-300 hover:shadow-2xl dark:bg-gray-800">
      <h3 className="mb-4 text-xl font-semibold text-gray-800 subpixel-antialiased dark:text-white">
        Global User Distribution
      </h3>
      <div style={{ height: 400, position: "relative" }}>
        <VectorMap
          key={JSON.stringify(markers)}
          map={worldMill}
          backgroundColor="transparent"
          onMarkerOver={onMarkerOver}
          onMarkerOut={onMarkerOut}
          onMarkerTipShow={onMarkerTipShow}
          markerStyle={{
            initial: {
              fill: "#4f46e5",
              stroke: "#ffffff",
              "fill-opacity": 1,
              "stroke-width": 1,
              "stroke-opacity": 1,
              r: 6,
            },
            hover: {
              fill: "#3b82f6",
              stroke: "#ffffff",
              "stroke-width": 1.5,
            },
          }}
          markers={markers}
          zoomAnimate={true}
          regionStyle={{
            initial: {
              fill: "#e5e7eb", // Light gray for countries
              "fill-opacity": 1,
              stroke: "none",
            },
            hover: {
              "fill-opacity": 0.7,
              cursor: "pointer",
              fill: "#d1d5db",
            },
          }}
          containerStyle={{
            width: "100%",
            height: "100%",
          }}
        />
        {tooltip.show && tooltip.text && (
          <div
            className="pointer-events-none absolute left-1/2 top-1/2 z-[9999] -translate-x-1/2 -translate-y-1/2 rounded border border-gray-200 bg-gray-900 px-2 py-1.5 text-xs text-white shadow-lg dark:border-gray-600"
          >
            {tooltip.text}
          </div>
        )}
      </div>
    </div>
  );
};

export default UserMap;
