import React, { useRef, useState } from "react";
import { toast } from "sonner";
import { api } from "../App";
import { Dialog, DialogContent, DialogTitle, DialogDescription } from "./ui/dialog";

export default function AdminPasswordReset({ user, onClose }) {
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [visible, setVisible] = useState(false);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const pending = useRef(false);

  const submit = async (event) => {
    event.preventDefault();
    if (pending.current) return;
    setError("");
    if ([...password].length < 8) { setError("Password must contain at least 8 characters."); return; }
    if (password !== confirm) { setError("Passwords do not match."); return; }
    pending.current = true;
    setSaving(true);
    try {
      await api.post(`/admin/users/${encodeURIComponent(user.id)}/reset-password`, { new_password: password });
      toast.success("Password updated");
      onClose();
    } catch (err) {
      const detail = err.response?.data?.detail;
      setError(typeof detail === "string" ? detail : Array.isArray(detail) ? detail.map((item) => item.msg).join(". ") : "Unable to update password. Please try again.");
    } finally {
      pending.current = false;
      setSaving(false);
    }
  };

  return <Dialog open onOpenChange={(open) => { if (!open && !pending.current) onClose(); }}>
    <DialogContent className="max-w-md">
      <DialogTitle>Reset password for {user.full_name}</DialogTitle>
      <DialogDescription>Enter and confirm the new password (at least 8 characters).</DialogDescription>
      <form onSubmit={submit} className="space-y-4">
        <div>
          <label htmlFor="admin-new-password" className="mb-1 block text-sm font-medium">New password</label>
          <div className="flex gap-2">
            <input id="admin-new-password" type={visible ? "text" : "password"} autoComplete="new-password" required minLength={8} value={password} onChange={(event) => setPassword(event.target.value)} disabled={saving} className="min-w-0 flex-1 rounded-lg border border-border px-3 py-2" />
            <button type="button" aria-label={visible ? "Hide password" : "Show password"} aria-pressed={visible} onClick={() => setVisible(!visible)} className="rounded-lg border border-border px-3 py-2 text-sm">{visible ? "Hide" : "Show"}</button>
          </div>
        </div>
        <div>
          <label htmlFor="admin-confirm-password" className="mb-1 block text-sm font-medium">Confirm password</label>
          <input id="admin-confirm-password" type="password" autoComplete="new-password" required value={confirm} onChange={(event) => setConfirm(event.target.value)} disabled={saving} className="w-full rounded-lg border border-border px-3 py-2" />
        </div>
        {error && <p role="alert" className="text-sm text-red-700">{error}</p>}
        <div className="flex justify-end gap-3">
          <button type="button" onClick={onClose} disabled={saving} className="rounded-lg border border-border px-4 py-2 disabled:opacity-50">Cancel</button>
          <button type="submit" disabled={saving} className="rounded-lg bg-[#9A3324] px-4 py-2 text-white disabled:opacity-50">{saving ? "Updating…" : "Reset Password"}</button>
        </div>
      </form>
    </DialogContent>
  </Dialog>;
}
