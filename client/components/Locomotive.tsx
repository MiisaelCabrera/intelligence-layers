"use client";
import React from "react";
import "./Locomotive.css"; // Aquí estará nuestro CSS
export default function Locomotive() {
  return (
    <div className="train-track">
      <div className="train">
        <div className="engine">
          <div className="smoke"></div>
        </div>
        <div className="wagon"></div>
        <div className="wagon"></div>
      </div>
    </div>
  );
}
