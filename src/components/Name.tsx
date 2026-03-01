import { useState } from "react";
import { Input } from "@/components/Input";
import { Button } from "@/components/Button";
import db from "@/utils/db";

type NameProps = {
  name: string;
  setChangeName: (change: boolean) => void;
};

export default function Name({ name, setChangeName }: NameProps) {
  const [newName, setNewName] = useState(name);
  const { user } = db.useAuth();

  const saveName = async (newName: string) => {
    if (!user) return;
    await db.transact(db.tx.$users[user.id].update({ name: newName.trim() }));
    setChangeName(false);
  };

  return (
    <form
      className="flex flex-col gap-4 items-start"
      onSubmit={(e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        // get form data and save name
        const formData = new FormData(e.currentTarget);
        const name = formData.get("name") as string;
        saveName(name);
      }}
    >
      <h1 className="text-neutral-200 text-xl">What is your name?</h1>
      <Input
        id="name"
        name="name"
        type="text"
        value={newName}
        maxLength={20}
        onChange={(e) => setNewName(e.target.value)}
        autoFocus
      />
      <div className="flex gap-2">
        <Button
          type="button"
          variant="ghost"
          semantic="negative"
          onClick={() => {
            setChangeName(false);
          }}
        >
          Back
        </Button>
        <Button type="submit" variant="primary" disabled={!newName.trim()}>
          Get Started
        </Button>
      </div>
    </form>
  );
}
