import React, { useState } from "react";
import { ViewState } from "./types";
import {
  HomeIcon,
  CompassIcon,
  UserIcon,
  HeartIcon,
} from "./Icons";

export default function App() {
  const [view, setView] = useState<ViewState>("home");

  return (
    <div style={{ padding: 20 }}>
      <h1>🚀 Hobbystreak</h1>
      <p>Active view: {view}</p>

      <div style={{ display: "flex", gap: 12, marginTop: 20 }}>
        <button onClick={() => setView("home")}>
          <HomeIcon />
        </button>
        <button onClick={() => setView("communities")}>
          <CompassIcon />
        </button>
        <button onClick={() => setView("profile")}>
          <UserIcon />
        </button>
        <button onClick={() => setView("challenges")}>
          <HeartIcon />
        </button>
      </div>
    </div>
  );
}


