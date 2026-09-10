// src/components/Tooltip.tsx
import React, { useState, useRef } from "react";

interface TooltipProps {
  children: React.ReactNode;
  content: {
    forca: number;
    vitalidade: number;
    agilidade: number;
    inteligencia: number;
    velocidade: number;
  };
  position?: "top" | "bottom" | "left" | "right";
}

const Tooltip: React.FC<TooltipProps> = ({
  children,
  content,
  position = "top",
}) => {
  const [isVisible, setIsVisible] = useState(false);

  const handleMouseEnter = () => {
    setIsVisible(true);
  };

  const handleMouseLeave = () => {
    setIsVisible(false);
  };

  const positionClasses = {
    top: "bottom-full left-1/2 -translate-x-1/2 mb-2",
    bottom: "top-full left-1/2 -translate-x-1/2 mt-2",
    left: "right-full top-1/2 -translate-y-1/2 mr-2",
    right: "left-full top-1/2 -translate-y-1/2 ml-2",
  };

  return (
    <div
      className="relative inline-block"
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      {children}
      {isVisible && (
        <div
          className={`
            absolute z-50
            px-3 py-2
            bg-[#F3B43F] text-white text-sm
            rounded-md shadow-lg
            whitespace-nowrap animate-fade-in
            ${positionClasses[position]}
          `}
        >
          <div className="text-left p-1 font-imFeel text-[#3a2f24]">
            {" "}
            <h4 className="font-bold text-lg mb-1">Atributos</h4>
            <p className="font-bold">
              Força: <span className="font-semibold">{content.forca}</span>
            </p>
            <p className="font-bold">
              Vitalidade:{" "}
              <span className="font-semibold">{content.vitalidade}</span>
            </p>
            <p className="font-bold">
              Agilidade:{" "}
              <span className="font-semibold">{content.agilidade}</span>
            </p>
            <p className="font-bold">
              Inteligência:{" "}
              <span className="font-semibold">{content.inteligencia}</span>
            </p>
            <p className="font-bold">
              Velocidade:{" "}
              <span className="font-semibold">{content.velocidade}</span>
            </p>
          </div>
        </div>
      )}
    </div>
  );
};

export default Tooltip;
