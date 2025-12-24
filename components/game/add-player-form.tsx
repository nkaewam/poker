"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Spinner } from "@/components/ui/spinner";

interface AddPlayerFormProps {
  onAdd: (name: string) => void;
  isLoading?: boolean;
}

export function AddPlayerForm({
  onAdd,
  isLoading = false,
}: AddPlayerFormProps) {
  const [name, setName] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (name.trim()) {
      onAdd(name);
      setName("");
    }
  };

  return (
    <form onSubmit={handleSubmit} className="flex gap-2">
      <Input
        type="text"
        placeholder="Add new player..."
        value={name}
        onChange={(e) => setName(e.target.value)}
        disabled={isLoading}
        className="flex-1"
      />
      <Button type="submit" disabled={isLoading || !name.trim()}>
        {isLoading && <Spinner className="mr-2" />}
        Add Player
      </Button>
    </form>
  );
}
