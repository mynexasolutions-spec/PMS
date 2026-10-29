"use client";

import { useState } from "react";
import { ChevronDown, KeyRound, LogOut } from "lucide-react";
import { useApp } from "@/components/AppProvider";
import Avatar from "@/components/ui/Avatar";
import { useCloseOnOutsideClick } from "@/components/ui/useCloseOnOutsideClick";
import { roleLabel } from "@/lib/permissions";
import PasswordModal from "./PasswordModal";

export default function ProfileMenu() {
  const { currentUser, signOut } = useApp();
  const [open, setOpen] = useState(false);
  const [passwordOpen, setPasswordOpen] = useState(false);
  useCloseOnOutsideClick(open, () => setOpen(false));

  return (
    <div className="relative border-l border-line pl-5">
      <button
        className="flex items-center gap-3 rounded-xl py-1 pr-1 text-left transition hover:bg-black/[0.03]"
        aria-haspopup="menu"
        aria-expanded={open}
        onClick={(event) => {
          event.stopPropagation();
          setOpen((isOpen) => !isOpen);
        }}
      >
        <Avatar user={currentUser} size={46} />
        <span className="hidden leading-tight sm:block">
          <span className="block text-[16px] font-semibold">{currentUser.name}</span>
          <span className="block text-[13px] text-muted">{roleLabel[currentUser.role]}</span>
        </span>
        <ChevronDown size={18} className="ml-1 hidden text-ink/70 sm:block" />
      </button>

      {open && (
        <div className="menu-popover min-w-[240px]">
          <div className="px-3 pb-2 pt-1.5">
            <p className="text-[14.5px] font-semibold">{currentUser.name}</p>
            <p className="break-all text-[12.5px] text-muted">{currentUser.email}</p>
          </div>
          <hr />
          <button
            onClick={() => {
              setOpen(false);
              setPasswordOpen(true);
            }}
          >
            <KeyRound size={16} /> Change password
          </button>
          <button className="danger" onClick={signOut}>
            <LogOut size={16} /> Sign out
          </button>
        </div>
      )}

      {passwordOpen && <PasswordModal onClose={() => setPasswordOpen(false)} />}
    </div>
  );
}
