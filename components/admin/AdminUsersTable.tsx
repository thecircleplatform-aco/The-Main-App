"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { UserContextMenu, type UserRow } from "./UserContextMenu";
import {
  EditUserModal,
  ConfirmModal,
  IpHistoryModal,
  ActivityModal,
} from "./AdminUserModals";

type AdminUsersTableProps = {
  users: UserRow[];
};

export function AdminUsersTable({ users }: AdminUsersTableProps) {
  const router = useRouter();
  const [editUser, setEditUser] = React.useState<{
    user: UserRow | null;
    mode: "username" | "email" | "password";
  }>({ user: null, mode: "username" });
  const [blockUser, setBlockUser] = React.useState<UserRow | null>(null);
  const [shadowBanUser, setShadowBanUser] = React.useState<UserRow | null>(null);
  const [deleteUser, setDeleteUser] = React.useState<UserRow | null>(null);
  const [ipHistoryUser, setIpHistoryUser] = React.useState<UserRow | null>(null);
  const [activityUser, setActivityUser] = React.useState<UserRow | null>(null);
  const [ips, setIps] = React.useState<{ ip_address: string; device_id: string | null; created_at: string }[]>([]);
  const [activity, setActivity] = React.useState<{
    sessions: { id: string; created_at: string }[];
    ipHistory: { ip_address: string; device_id: string | null; created_at: string }[];
    supportTickets: { id: string; message: string; status: string; created_at: string }[];
  } | null>(null);
  const [loadingIp, setLoadingIp] = React.useState(false);
  const [loadingActivity, setLoadingActivity] = React.useState(false);

  const refresh = () => router.refresh();

  const handleEditSubmit = async (
    userId: string,
    field: "username" | "email" | "password",
    value: string
  ) => {
    const payload: Record<string, unknown> = { userId };
    if (field === "username") payload.username = value;
    else if (field === "email") payload.email = value;
    else payload.password = value;
    const res = await fetch("/api/admin/user/update", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(data.error ?? "Update failed");
    refresh();
  };

  const handleBlock = async () => {
    if (!blockUser) return;
    const res = await fetch("/api/admin/user/block", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId: blockUser.id, block: true }),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(data.error ?? "Block failed");
    refresh();
  };

  const handleUnblock = async () => {
    if (!blockUser) return;
    const res = await fetch("/api/admin/user/block", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId: blockUser.id, block: false }),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(data.error ?? "Unblock failed");
    refresh();
  };

  const handleShadowBan = async () => {
    if (!shadowBanUser) return;
    const res = await fetch("/api/admin/user/shadow-ban", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        userId: shadowBanUser.id,
        shadowBan: shadowBanUser.status !== "shadow_banned",
      }),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(data.error ?? "Shadow ban failed");
    setShadowBanUser(null);
    refresh();
  };

  const handleDelete = async () => {
    if (!deleteUser) return;
    const res = await fetch("/api/admin/user/delete", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId: deleteUser.id }),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(data.error ?? "Delete failed");
    refresh();
  };

  const handleOpenIpHistory = async (user: UserRow) => {
    setIpHistoryUser(user);
    setLoadingIp(true);
    setIps([]);
    try {
      const res = await fetch(`/api/admin/user/ip-history?userId=${user.id}`);
      const data = await res.json().catch(() => ({}));
      if (res.ok) setIps(data.ips ?? []);
    } finally {
      setLoadingIp(false);
    }
  };

  const handleOpenActivity = async (user: UserRow) => {
    setActivityUser(user);
    setLoadingActivity(true);
    setActivity(null);
    try {
      const res = await fetch(`/api/admin/user/activity?userId=${user.id}`);
      const data = await res.json().catch(() => ({}));
      if (res.ok) setActivity(data);
    } finally {
      setLoadingActivity(false);
    }
  };

  const isBlocked = (u: UserRow) =>
    u.status === "blocked" || u.status === "shadow_banned";
  const isShadowBanned = (u: UserRow) => u.status === "shadow_banned";

  return (
    <>
      <div className="max-h-[420px] overflow-y-auto">
        <table className="w-full border-separate border-spacing-y-2 text-xs text-white/80">
          <thead className="sticky top-0 z-10 bg-black/60 backdrop-blur-xl">
            <tr>
              <th className="px-3 py-2 text-left font-medium text-white/60">Email</th>
              <th className="px-3 py-2 text-left font-medium text-white/60">Name</th>
              <th className="px-3 py-2 text-left font-medium text-white/60">Status</th>
              <th className="px-3 py-2 text-left font-medium text-white/60">Sessions</th>
              <th className="px-3 py-2 text-left font-medium text-white/60">Joined</th>
              <th className="w-10 px-2 py-2" />
            </tr>
          </thead>
          <tbody>
            {users.length === 0 ? (
              <tr>
                <td
                  colSpan={6}
                  className="px-3 py-8 text-center text-xs text-white/50"
                >
                  No users yet.
                </td>
              </tr>
            ) : (
              users.map((u) => (
                <UserContextMenu
                  key={u.id}
                  user={u}
                  onEditUsername={(user) =>
                    setEditUser({ user, mode: "username" })
                  }
                  onEditEmail={(user) => setEditUser({ user, mode: "email" })}
                  onResetPassword={(user) =>
                    setEditUser({ user, mode: "password" })
                  }
                  onBlockUser={(user) => setBlockUser(user)}
                  onShadowBan={(user) => setShadowBanUser(user)}
                  onDeleteUser={(user) => setDeleteUser(user)}
                  onViewIpHistory={handleOpenIpHistory}
                  onViewActivity={handleOpenActivity}
                >
                  <td className="px-3 py-2 align-middle">{u.email}</td>
                  <td className="px-3 py-2 align-middle">
                    {u.name ?? <span className="text-white/40">—</span>}
                  </td>
                  <td className="px-3 py-2 align-middle">
                    {u.status && u.status !== "active" ? (
                      <span
                        className={
                          u.status === "blocked"
                            ? "text-rose-400"
                            : "text-amber-400"
                        }
                      >
                        {u.status.replace("_", " ")}
                      </span>
                    ) : (
                      <span className="text-white/50">active</span>
                    )}
                  </td>
                  <td className="px-3 py-2 align-middle">{u.sessions}</td>
                  <td className="px-3 py-2 align-middle text-white/55">
                    {new Date(u.created_at).toLocaleString()}
                  </td>
                </UserContextMenu>
              ))
            )}
          </tbody>
        </table>
      </div>

      <EditUserModal
        open={!!editUser.user}
        onClose={() => setEditUser({ user: null, mode: "username" })}
        user={editUser.user}
        mode={editUser.mode}
        onSubmit={handleEditSubmit}
      />

      <ConfirmModal
        open={!!shadowBanUser}
        onClose={() => setShadowBanUser(null)}
        onConfirm={handleShadowBan}
        title={
          shadowBanUser
            ? isShadowBanned(shadowBanUser)
              ? "Remove shadow ban"
              : "Shadow ban user"
            : ""
        }
        message={
          shadowBanUser
            ? isShadowBanned(shadowBanUser)
              ? `Remove shadow ban from ${shadowBanUser.email}? They will be able to use the app normally.`
              : `Shadow ban ${shadowBanUser.email}? They will be redirected to the help center.`
            : ""
        }
        confirmLabel={
          shadowBanUser && isShadowBanned(shadowBanUser)
            ? "Remove shadow ban"
            : "Shadow ban"
        }
      />

      <ConfirmModal
        open={!!blockUser}
        onClose={() => setBlockUser(null)}
        onConfirm={blockUser && isBlocked(blockUser) ? handleUnblock : handleBlock}
        title={blockUser && isBlocked(blockUser) ? "Unblock user" : "Block user"}
        message={
          blockUser
            ? isBlocked(blockUser)
              ? `Unblock ${blockUser.email}? They will be able to log in again.`
              : `Block ${blockUser.email}? Their session will be invalidated and they won't be able to log in.`
            : ""
        }
        confirmLabel={blockUser && isBlocked(blockUser) ? "Unblock" : "Block"}
      />

      <ConfirmModal
        open={!!deleteUser}
        onClose={() => setDeleteUser(null)}
        onConfirm={handleDelete}
        title="Delete user"
        message={
          deleteUser
            ? `Permanently delete ${deleteUser.email}? This cannot be undone.`
            : ""
        }
        confirmLabel="Delete"
      />

      <IpHistoryModal
        open={!!ipHistoryUser}
        onClose={() => setIpHistoryUser(null)}
        user={ipHistoryUser}
        ips={ips}
        loading={loadingIp}
      />

      <ActivityModal
        open={!!activityUser}
        onClose={() => setActivityUser(null)}
        user={activityUser}
        activity={activity}
        loading={loadingActivity}
      />
    </>
  );
}
