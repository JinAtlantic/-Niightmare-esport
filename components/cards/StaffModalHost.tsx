"use client";

import React from "react";
import { AnimatePresence } from "framer-motion";
import StaffModal from "@/components/cards/StaffModal";
import type { StaffMember } from "@/lib/types";

/**
 * Thin host that owns the AnimatePresence + modal. Loaded via next/dynamic from
 * StaffCard only after the first open, so Framer-Motion and the modal code stay
 * out of the roster grid's initial bundle.
 */
export default function StaffModalHost({
  member,
  open,
  onClose,
}: {
  member: StaffMember;
  open: boolean;
  onClose: () => void;
}) {
  return (
    <AnimatePresence>
      {open && <StaffModal key={`sm-${member.id}`} member={member} onClose={onClose} />}
    </AnimatePresence>
  );
}
