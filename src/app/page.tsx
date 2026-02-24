"use client";

import Link from "next/link";
import { useState, useEffect } from "react";

const EXCUSES = [
  "I don't like anything too spicy",
  "I'm not in the mood for pizza again",
  "I can't eat dairy right now",
  "I don't want anything with mushrooms",
  "I had Mexican food yesterday",
  "I don't want to spend too much",
  "I want something vegetarian",
  "I'm trying to eat healthier",
  "I don't want a heavy meal",
  "I need somewhere with parking",
  "I don't feel like driving far",
  "I want somewhere that's not too crowded",
];

export default function Home() {
  const [currentExcuseIndex, setCurrentExcuseIndex] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentExcuseIndex((prev) => (prev + 1) % EXCUSES.length);
    }, 2500); // Change every 2.5 seconds

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="min-h-screen bg-neutral-900 flex items-center justify-center p-6 mt-[-4rem]">
      <div className="max-w-3xl mx-auto text-center">
        {/* Main heading */}
        <h1 className="heading-xl text-gradient-warm mb-8">Anything, but...</h1>

        {/* Rotating excuses */}
        <div className="mb-8">
          <p className="body-lg text-neutral-300 min-h-[2rem] transition-all duration-500 italic">
            &ldquo;{EXCUSES[currentExcuseIndex]}&rdquo;
          </p>
        </div>

        {/* Description */}
        <p className="body-lg text-neutral-200 mb-10 max-w-xl mx-auto">
          Collaboratively choose a restaurant with your friends
        </p>

        {/* CTA Button */}
        <Link
          href="/start"
          className="inline-block bg-primary-500 text-white border-none rounded-md cursor-pointer transition-shadow duration-200 hover:shadow-lg px-6 py-3"
        >
          Find a restaurant →
        </Link>
      </div>
    </div>
  );
}
