"use client";

import { useState, useEffect } from "react";

/**
 * A hook that works like useState but persists the value in localStorage.
 * Compatible with Next.js SSR - handles cases where window is not available.
 *
 * @param key The key to use for localStorage
 * @param initialValue The initial value to use if no value exists in localStorage
 * @returns A stateful value and a function to update it
 */
export default function useLocalStorageState<T>(
  key: string,
  initialValue: T,
): [T, React.Dispatch<React.SetStateAction<T>>] {
  // Initialize state with the initial value (will be hydrated from localStorage)
  const [value, setValue] = useState<T>(initialValue);
  const [isInitialized, setIsInitialized] = useState(false);

  // Load the value from localStorage after component mounts (client-side only)
  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    try {
      const item = window.localStorage.getItem(key);
      const storedValue = item ? JSON.parse(item) : initialValue;
      setValue(storedValue);
    } catch (error) {
      console.error("Error reading from localStorage", error);
    } finally {
      setIsInitialized(true);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key]);

  // Update localStorage when state changes (but not during initial hydration)
  useEffect(() => {
    if (!isInitialized || typeof window === "undefined") {
      return;
    }

    try {
      window.localStorage.setItem(key, JSON.stringify(value));
    } catch (error) {
      console.error("Error writing to localStorage", error);
    }
  }, [key, value, isInitialized]);

  return [value, setValue];
}
