"use client";

import { useState } from "react";
import { Check, UserPlus } from "lucide-react";
import { useApp } from "@/components/AppProvider";
import Avatar from "./Avatar";
import { useCloseOnOutsideClick } from "./useCloseOnOutsideClick";

/** A round avatar button: click it to hand the task or to-do to anyone on the team (or nobody). */
export default function AssigneePicker({ value, onChange, size = 26, className = "", align = "left" }) {
  const { users } = useApp();
  const [open, setOpen] = useState(false);
  useCloseOnOutsideClick(open, () => setOpen(false));
  const person = users.find((user) => user.id === value);
  const pick = (id) => {
    setOpen(false);
    if (id !== value) onChange(id);
  };

  return (
    <div className={`relative ${className}`}>
      <button
        type="button"
        aria-haspopup="menu"
        aria-expanded={open}
        aria-label={person ? `Assigned to ${person.name}. Change` : "Unassigned. Assign"}
        title={person ? `Assigned to ${person.name}` : "Unassigned"}
        onClick={(event) => {
          event.stopPropagation();
          setOpen((isOpen) => !isOpen);
        }}
        className="grid place-items-center rounded-full transition hover:ring-2 hover:ring-brand-300"
      >
        {person ? (
          <Avatar user={person} size={size} />
        ) : (
          <span className="grid place-items-center rounded-full border border-dashed border-ink/35 text-ink/55" style={{ width: size, height: size }}>
            <UserPlus size={Math.round(size * 0.55)} />
          </span>
        )}
      </button>

      {open && (
        <div className={`menu-popover max-h-[300px] min-w-[230px] overflow-y-auto ${align === "right" ? "right-0 left-auto" : "left-0 right-auto"}`} role="menu">
          <p className="px-3 pb-1 pt-1.5 text-[11.5px] font-semibold uppercase tracking-wider text-muted">Assign to</p>
          {users
            .filter((user) => user.active)
            .map((user) => (
              <button key={user.id} role="menuitem" onClick={() => pick(user.id)}>
                <Avatar user={user} size={24} />
                <span className="min-w-0">{user.name}</span>
                {user.id === value && <Check size={16} className="ml-auto" />}
              </button>
            ))}
          <hr />
          <button role="menuitem" onClick={() => pick(null)}>
            <UserPlus size={16} /> Unassigned
            {value == null && <Check size={16} className="ml-auto" />}
          </button>
        </div>
      )}
    </div>
  );
}
