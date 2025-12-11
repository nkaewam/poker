import { useState, useMemo } from "react";
import { useQueryState } from "nuqs";

type Tab = "players" | "finals" | "results";

export function useGameUI() {
  const [tab, setTab] = useQueryState("tab", {
    defaultValue: "players",
    parse: (value) => {
      const valid: Tab[] = ["players", "finals", "results"];
      return valid.includes(value as Tab) ? (value as Tab) : "players";
    },
    serialize: (value) => value,
  });

  const [isQrCodeOpen, setIsQrCodeOpen] = useState(false);
  const [isLeaveDialogOpen, setIsLeaveDialogOpen] = useState(false);

  const tabs: Array<{ id: Tab; label: string }> = useMemo(
    () => [
      { id: "players", label: "Players & Buy-ins" },
      { id: "finals", label: "Finals" },
      { id: "results", label: "Results" },
    ],
    []
  );

  return {
    tab,
    setTab,
    tabs,
    isQrCodeOpen,
    setIsQrCodeOpen,
    isLeaveDialogOpen,
    setIsLeaveDialogOpen,
  };
}
