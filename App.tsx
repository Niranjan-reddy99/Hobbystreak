import React, { useState } from "react";
import { ViewState } from "./types";
import {
  HomeIcon,
  CompassIcon,
  UserIcon,
  HeartIcon,
} from "./Icons";

export default function App() {
  const [activeView, setActiveView] = useState<ViewState>("home");

  return (
    <div className="min-h-screen bg-slate-50 p-6">
      <h1 className="text-3xl font-bold mb-6">
        🚀 Hobbystreak
      </h1>

      <div className="mb-6 text-lg">
        Active view: <b>{activeView}</b>
      </div>

      <div className="flex gap-4">
        <button
          className="px-4 py-2 rounded bg-white shadow"
          onClick={() => setActiveView("home")}
        >
          <HomeIcon />
        </button>

        <button
          className="px-4 py-2 rounded bg-white shadow"
          onClick={() => setActiveView("communities")}
        >
          <CompassIcon />
        </button>

        <button
          className="px-4 py-2 rounded bg-white shadow"
          onClick={() => setActiveView("profile")}
        >
          <UserIcon />
        </button>

        <button
          className="px-4 py-2 rounded bg-white shadow"
          onClick={() => setActiveView("challenges")}
        >
          <HeartIcon />
        </button>
      </div>
    </div>
  );
}

  


