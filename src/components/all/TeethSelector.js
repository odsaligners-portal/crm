"use client";

import React, { useRef, useState } from "react";
import Image from "next/image";

const TeethSelector = ({ onTeethSelect, selectedTeeth = [] }) => {
  const [tooltipPosition, setTooltipPosition] = useState({});
  const [hoveredTooth, setHoveredTooth] = useState(null);
  const containerRef = useRef(null);

  // Teeth numbers in the exact order shown in the image
  const upperTeeth = [
    18, 17, 16, 15, 14, 13, 12, 11, 21, 22, 23, 24, 25, 26, 27, 28,
  ];
  const lowerTeeth = [
    48, 47, 46, 45, 44, 43, 42, 41, 31, 32, 33, 34, 35, 36, 37, 38,
  ];

  const toggleTooth = (toothNumber) => {
    if (onTeethSelect) {
      onTeethSelect(toothNumber);
    }
  };

  const calculateTooltipPosition = (event) => {
    const rect = event.currentTarget.getBoundingClientRect();
    const tooltipWidth = 250 + 24; // 250px image + 24px padding
    const tooltipHeight = 250 + 80; // 250px image + 80px for title and padding

    let left = rect.left + rect.width / 2 - tooltipWidth / 2;
    let bottom = window.innerHeight - rect.top + 12; // 12px margin

    // Check if tooltip would go off the left edge
    if (left < 12) {
      left = 12;
    }

    // Check if tooltip would go off the right edge
    if (left + tooltipWidth > window.innerWidth - 12) {
      left = window.innerWidth - tooltipWidth - 12;
    }

    // Check if tooltip would go off the top edge (if positioned above)
    if (rect.top < tooltipHeight + 12 + 50) {
      // Position below instead
      bottom = "auto";
      const top = rect.bottom + 12;
      setTooltipPosition({ left, top, bottom: "auto", arrowDirection: "up" });
      return;
    }

    setTooltipPosition({ left, bottom, top: "auto", arrowDirection: "down" });
  };

  const handleMouseEnter = (event, toothNumber) => {
    setHoveredTooth(toothNumber);
    calculateTooltipPosition(event);
  };

  const handleMouseLeave = () => {
    setHoveredTooth(null);
  };

  const renderToothRow = (teeth, isUpper = true) => (
    <div
      className={`my-3 flex justify-center gap-2 ${isUpper ? "mb-5 items-end" : "mt-5 items-start"}`}
    >
      {teeth.map((toothNumber) => (
        <React.Fragment key={toothNumber}>
          <div
            className={`group relative flex cursor-pointer flex-col items-center rounded-lg border-2 border-transparent p-2 transition-all duration-300 hover:bg-blue-500 hover:text-white ${
              selectedTeeth.includes(toothNumber)
                ? "border-blue-700 bg-blue-500 shadow-lg shadow-blue-500/40"
                : ""
            } `}
            onClick={() => toggleTooth(toothNumber)}
            onMouseEnter={(e) => handleMouseEnter(e, toothNumber)}
            onMouseLeave={handleMouseLeave}
          >
            <div className="relative mb-1">
              <input
                type="checkbox"
                checked={selectedTeeth.includes(toothNumber)}
                onChange={() => toggleTooth(toothNumber)}
                className="hidden"
                aria-label={`Select tooth ${toothNumber}`}
              />
              <Image
                src={`/images/teeth/${toothNumber}.png`}
                alt={`Tooth ${toothNumber}`}
                width={100}
                height={100}
                className={`object-contain drop-shadow-sm ${
                  selectedTeeth.includes(toothNumber)
                    ? "brightness-110 drop-shadow-md"
                    : ""
                } `}
                priority={false}
              />
            </div>
            <span
              className={`text-xs font-medium transition-colors duration-300 group-hover:text-white ${
                selectedTeeth.includes(toothNumber)
                  ? "font-semibold text-white subpixel-antialiased"
                  : "text-gray-600"
              } `}
            >
              {toothNumber}
            </span>
          </div>
          {/* Add border after tooth 11 (index 7 in upper teeth) and tooth 41 (index 7 in lower teeth) */}
          {((isUpper && toothNumber === 11) ||
            (!isUpper && toothNumber === 41)) && (
            <div className="mx-2 h-20 w-0.5 bg-gray-400"></div>
          )}
        </React.Fragment>
      ))}
    </div>
  );

  return (
    <div
      className="flex flex-col items-center p-5 font-sans"
      ref={containerRef}
    >
      <div className="relative mb-5 rounded-3xl border-2 border-gray-300 bg-gray-50 p-8 shadow-lg">
        {/* Upper teeth */}
        {renderToothRow(upperTeeth, true)}

        {/* Divider line */}
        <div className="my-4 h-0.5 w-full bg-gradient-to-r from-transparent via-gray-300 to-transparent"></div>

        {/* Lower teeth */}
        {renderToothRow(lowerTeeth, false)}

        {/* Labels for molars */}
        <div className="mt-4 flex justify-between text-xs text-gray-600 italic">
          <span className="flex-1 text-center">
            dentes molares mandibulares
          </span>
          <span className="flex-1 text-center">
            dentes molares mandibulares
          </span>
        </div>
      </div>

      {/* Selected teeth display */}
      <div className="mt-5 min-w-80 rounded-lg border border-gray-300 bg-white p-4 text-center">
        <h3 className="m-0 mb-3 text-lg font-semibold text-blue-500 subpixel-antialiased">
          Selected Teeth: {selectedTeeth.length}
        </h3>
        <p className="m-0 font-mono text-sm text-gray-600">
          {selectedTeeth.length > 0
            ? selectedTeeth.sort((a, b) => a - b).join(", ")
            : "No teeth selected"}
        </p>
      </div>

      {/* Global Tooltip */}
      {hoveredTooth && (
        <div
          className="fixed z-50 rounded-xl border-2 border-gray-200 bg-white p-3 shadow-2xl"
          style={{
            left: tooltipPosition.left,
            top: tooltipPosition.top,
            bottom: tooltipPosition.bottom,
          }}
        >
          <div className="mb-2 text-center">
            <span className="text-sm font-semibold text-gray-700 subpixel-antialiased">
              Tooth {hoveredTooth}
            </span>
          </div>
          <div className="h-[250px] w-[250px] overflow-hidden rounded-lg">
            <Image
              src={`/images/teeth/${hoveredTooth}.png`}
              alt={`Tooth ${hoveredTooth} Preview`}
              width={250}
              height={250}
              className="h-full w-full object-contain"
              priority={false}
            />
          </div>
          {/* Arrow pointing in the appropriate direction */}
          {tooltipPosition.arrowDirection === "down" && (
            <>
              <div className="absolute top-full left-1/2 h-0 w-0 -translate-x-1/2 transform border-t-8 border-r-8 border-l-8 border-transparent border-t-white"></div>
              <div
                className="absolute top-full left-1/2 h-0 w-0 -translate-x-1/2 transform border-t-8 border-r-8 border-l-8 border-transparent border-t-gray-200"
                style={{ top: "calc(100% - 1px)" }}
              ></div>
            </>
          )}
          {tooltipPosition.arrowDirection === "up" && (
            <>
              <div className="absolute bottom-full left-1/2 h-0 w-0 -translate-x-1/2 transform border-r-8 border-b-8 border-l-8 border-transparent border-b-white"></div>
              <div
                className="absolute bottom-full left-1/2 h-0 w-0 -translate-x-1/2 transform border-r-8 border-b-8 border-l-8 border-transparent border-b-gray-200"
                style={{ bottom: "calc(100% - 1px)" }}
              ></div>
            </>
          )}
        </div>
      )}
    </div>
  );
};

export default TeethSelector;
