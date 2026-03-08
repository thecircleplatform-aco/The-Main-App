"use client";

import * as React from "react";
import { createPortal } from "react-dom";
import {
  UserPen,
  Mail,
  KeyRound,
  Ban,
  Trash2,
  Globe,
  Activity,
  MoreVertical,
} from "lucide-react";
import { cn } from "@/lib/utils";

export type UserRow = {
  id: string;
  email: string;
  name: string | null;
  status?: string | null;
  created_at: string;
  sessions: number;
};

type UserContextMenuProps = {
  user: UserRow;
  children: React.ReactNode;
  onEditUsername: (user: UserRow) => void;
  onEditEmail: (user: UserRow) => void;
  onResetPassword: (user: UserRow) => void;
  onBlockUser: (user: UserRow) => void;
  onShadowBan: (user: UserRow) => void;
  onDeleteUser: (user: UserRow) => void;
  onViewIpHistory: (user: UserRow) => void;
  onViewActivity: (user: UserRow) => void;
};

const menuItems: { key: string; label: string; icon: React.ComponentType<{ className?: string }>; destructive?: boolean }[] = [
  { key: "username", label: "Change username", icon: UserPen },
  { key: "email", label: "Change email", icon: Mail },
  { key: "password", label: "Reset password", icon: KeyRound },
  { key: "block", label: "Block user", icon: Ban, destructive: true },
  { key: "shadowBan", label: "Shadow ban", icon: Ban, destructive: true },
  { key: "delete", label: "Delete user", icon: Trash2, destructive: true },
  { key: "ip", label: "View IP history", icon: Globe },
  { key: "activity", label: "View account activity", icon: Activity },
];

export function UserContextMenu({
  user,
  children,
  onEditUsername,
  onEditEmail,
  onResetPassword,
  onBlockUser,
  onShadowBan,
  onDeleteUser,
  onViewIpHistory,
  onViewActivity,
}: UserContextMenuProps) {
  const [open, setOpen] = React.useState(false);
  const [position, setPosition] = React.useState({ x: 0, y: 0 });
  const triggerRef = React.useRef<HTMLTableRowElement>(null);

  const handlers: Record<string, (u: UserRow) => void> = {
    username: onEditUsername,
    email: onEditEmail,
    password: onResetPassword,
    block: onBlockUser,
    shadowBan: onShadowBan,
    delete: onDeleteUser,
    ip: onViewIpHistory,
    activity: onViewActivity,
  };

  const handleContextMenu = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setPosition({ x: e.clientX, y: e.clientY });
    setOpen(true);
  };

  const handleClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    const rect = triggerRef.current?.getBoundingClientRect();
    if (rect) {
      setPosition({ x: rect.right - 8, y: rect.top + rect.height / 2 });
    }
    setOpen(true);
  };

  React.useEffect(() => {
    if (!open) return;
    const close = () => setOpen(false);
    window.addEventListener("click", close);
    window.addEventListener("scroll", close, true);
    return () => {
      window.removeEventListener("click", close);
      window.removeEventListener("scroll", close, true);
    };
  }, [open]);

  const handleItemClick = (key: string) => (e: React.MouseEvent) => {
    e.stopPropagation();
    handlers[key]?.(user);
    setOpen(false);
  };

  return (
    <>
      <tr
        ref={triggerRef}
        onContextMenu={handleContextMenu}
        className="group rounded-2xl border border-white/8 bg-white/5 shadow-soft backdrop-blur-2xl transition hover:bg-white/8"
      >
        {children}
        <td className="w-10 px-2 py-2 align-middle">
          <button
            type="button"
            onClick={handleClick}
            className="rounded-lg p-1.5 text-white/40 opacity-0 transition hover:bg-white/10 hover:text-white group-hover:opacity-100"
            aria-label="User menu"
          >
            <MoreVertical className="h-4 w-4" />
          </button>
        </td>
      </tr>
      {open &&
        typeof document !== "undefined" &&
        createPortal(
          <div
            className="fixed z-[200] min-w-[200px] rounded-2xl border border-white/10 bg-black/95 py-1 shadow-2xl backdrop-blur-2xl"
            style={{ left: position.x, top: position.y }}
            onClick={(e) => e.stopPropagation()}
          >
            {menuItems.map((item) => {
              const Icon = item.icon;
              return (
                <button
                  key={item.key}
                  type="button"
                  onClick={handleItemClick(item.key)}
                  className={cn(
                    "flex w-full items-center gap-2 px-3 py-2 text-left text-sm transition",
                    item.destructive
                      ? "text-rose-400 hover:bg-rose-500/20"
                      : "text-white/80 hover:bg-white/10 hover:text-white"
                  )}
                >
                  <Icon className="h-4 w-4 flex-shrink-0" />
                  {item.label}
                </button>
              );
            })}
          </div>,
          document.body
        )}
    </>
  );
}
