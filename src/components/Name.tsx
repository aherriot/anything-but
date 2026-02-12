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
    await db.transact(db.tx.$users[user.id].update({ name: newName }));
  };

  return (
    <div className="flex flex-col gap-4 items-center sm:items-start">
      <Input
        label="What is your name or nickname?"
        type="text"
        value={newName}
        onChange={(e) => setNewName(e.target.value)}
        autoFocus
      />
      <Button
        variant="primary"
        disabled={!newName.trim()}
        onClick={() => {
          saveName(newName.trim());
          setChangeName(false);
        }}
      >
        Get Started
      </Button>
    </div>
  );
}
