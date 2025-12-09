import React from "react";
import {
  HomeIcon,
  CompassIcon,
  UserIcon,
  HeartIcon,
} from "./Icons";

export default function App() {
  return (
    <div style={{ padding: 20 }}>
      <h1>🚀 Hobbystreak UI</h1>
      <p>Your interface is slowly coming back online.</p>

      <div style={{ display: "flex", gap: "12px", marginTop: "20px" }}>
        <HomeIcon />
        <CompassIcon />
        <UserIcon />
        <HeartIcon />
      </div>
    </div>
  );
}
