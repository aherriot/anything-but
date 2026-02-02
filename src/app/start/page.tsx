"use client";

import { useState } from "react";
import Name from "./name";
import Location from "./location";
import useLocalStorageState from "@/hooks/useLocalStorageState";

type Screen = "start" | "location";

export default function Start() {
  const [screen, setScreen] = useState<Screen>("start");
  const [name, setName] = useLocalStorageState<string>("name", "");

  return (
    <div className="min-h-screen max-w-2xl m-auto p-8 bg-neutral-50">
      {screen === "start" && (
        <Name setScreen={setScreen} name={name} setName={setName} />
      )}
      {screen === "location" && <Location setScreen={setScreen} name={name} />}
    </div>
  );
}
