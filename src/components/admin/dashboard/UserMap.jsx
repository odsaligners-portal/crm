"use client";
import React from 'react';
import { worldMill } from "@react-jvectormap/world";
import dynamic from "next/dynamic";

const VectorMap = dynamic(
  () => import("@react-jvectormap/core").then((mod) => mod.VectorMap),
  { ssr: false }
);

const UserMap = ({ markers = [] }) => {
  return (
    <div className="p-6 bg-white rounded-2xl shadow-lg dark:bg-gray-800 transition-all duration-300 hover:shadow-2xl">
        <h3 className="text-xl font-bold text-gray-800 dark:text-white mb-4">Global User Distribution</h3>
        <div style={{ height: 400 }}>
            <VectorMap
                map={worldMill}
                backgroundColor="transparent"
                markerStyle={{
                    initial: {
                        fill: "#4f46e5",
                        stroke: "#ffffff",
                        "fill-opacity": 1,
                        "stroke-width": 1,
                        "stroke-opacity": 1,
                        r: 6
                    },
                    hover: {
                        fill: "#3b82f6",
                        stroke: "#ffffff",
                        "stroke-width": 1.5
                    }
                }}
                markers={markers}
                zoomOnScroll={false}
                zoomAnimate={true}
                regionStyle={{
                    initial: {
                        fill: "#e5e7eb", // Light gray for countries
                        "fill-opacity": 1,
                        stroke: 'none',
                    },
                    hover: {
                        "fill-opacity": 0.7,
                        cursor: 'pointer',
                        fill: "#d1d5db",
                    },
                }}
                containerStyle={{
                    width: '100%',
                    height: '100%',
                }}
            />
        </div>
    </div>
  );
};

export default UserMap; 