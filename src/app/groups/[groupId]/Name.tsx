import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import type { GroupScreen } from "@/types";

type NameProps = {
  name: string;
  groupName: string;
  geoName: string;
  setName: (name: string) => void;
  setScreen: (screen: GroupScreen) => void;
};

export default function Name({
  setScreen,
  name,
  groupName,
  geoName,
  setName,
}: NameProps) {
  return (
    <main className="flex flex-col gap-4 items-center justify-center">
      <h1 className="text-4xl font-bold text-neutral-500 px-4 text-center max-w-2xl">
        Choose a restaurant
        <br />
        with <span className="text-neutral-100">{groupName}</span>
        <br />
        in <span className="text-neutral-100">{geoName}</span>
      </h1>
      <Input
        label="What is your name?"
        type="text"
        value={name}
        onChange={(e) => setName(e.target.value)}
        autoFocus
      />
      <Button onClick={() => setScreen("cuisine")} disabled={!name}>
        Get Started
      </Button>
    </main>
  );
}
