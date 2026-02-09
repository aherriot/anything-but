import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

import type { StartScreen } from "@/types";

type NameProps = {
  name: string;
  setName: (name: string) => void;
  setScreen: (screen: StartScreen) => void;
};

export default function Name({ setScreen, name, setName }: NameProps) {
  return (
    <main className="flex flex-col gap-4 items-center sm:items-start">
      <h1 className="text-4xl text-gradient-warm font-bold">
        I&apos;m easy, but...
      </h1>
      <Input
        label="What is your name?"
        type="text"
        value={name}
        onChange={(e) => setName(e.target.value)}
        autoFocus
      />
      <Button
        variant="primary"
        onClick={() => setScreen("location")}
        disabled={!name}
      >
        Get Started
      </Button>
    </main>
  );
}
