"use client";

import React from "react";
import { AnimatePresence } from "framer-motion";
import PlayerModal from "@/components/cards/PlayerModal";
import type { Player } from "@/lib/types";

/**
 * Thin host that owns the AnimatePresence + modal. Loaded via next/dynamic from
 * PlayerCard only after the first open, so Framer-Motion and the modal code stay
 * out of the roster grid's initial bundle.
 */
export default function PlayerModalHost({
  player,
  open,
  onClose,
}: {
  player: Player;
  open: boolean;
  onClose: () => void;
}) {
  return (
    <AnimatePresence>
      {open && <PlayerModal key={`pm-${player.id}`} player={player} onClose={onClose} />}
    </AnimatePresence>
  );
}
