"use client";

import { useState, useEffect, useCallback } from "react";
import { authHeaders, formatDate, tierColor } from "./shared";

interface Client {
  id: string;
  name: string;
  email: string;
  api_key_prefix: string;
  tier: "trial" | "agency" | "enterprise" | "internal";
  allowed_skills: string[];
  rate_limit_per_hour: number;
  active: boolean;
  notes: string | null;
  created_at?: string;
}

interface ClientWithSecret extends Client {
  api_key: string;
}

const TIERS: Client["tier"][] = ["trial", "agency", "enterprise", "internal"];
const KNOWN_SKILLS = ["brand-roast", "brand-positioning"];

export default function ClientsTab({
  apiKey,
  refreshKey,
}: {
  apiKey: string;
  refreshKey: number;
}) {
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const [showCreate, setShowCreate] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [freshSecret, setFreshSecret] = useState<ClientWithSecret | null>(null);

  const fetchClients = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/admin/clients", { headers: authHeaders(apiKey) });
      if (!res.ok) {
        setError(`Failed to fetch clients (HTTP ${res.status})`);
        setLoading(false);
        return;
      }
      const data = await res.json();
      setClients(data.clients || []);
    } catch {
      setError("Failed to fetch clients.");
    }
    setLoading(false);
  }, [apiKey]);

  useEffect(() => {
    fetchClients();
  }, [fetchClients, refreshKey]);

  async function handleCreate(payload: {
    name: string;
    email: string;
    tier: Client["tier"];
    allowed_skills: string[];
    rate_limit_per_hour: number;
    notes?: string;
  }) {
    const res = await fetch("/api/admin/clients", {
      method: "POST",
      headers: { ...authHeaders(apiKey), "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    const data = await res.json();
    if (!res.ok) {
      setError(data.error || "Failed to create client");
      return;
    }
    setFreshSecret(data.client);
    setShowCreate(false);
    await fetchClients();
  }

  async function handleUpdate(id: string, updates: Partial<Client>) {
    const res = await fetch(`/api/admin/clients?id=${id}`, {
      method: "PATCH",
      headers: { ...authHeaders(apiKey), "Content-Type": "application/json" },
      body: JSON.stringify(updates),
    });
    if (!res.ok) {
      setError(`Failed to update client`);
      return;
    }
    setEditingId(null);
    await fetchClients();
  }

  async function handleRevoke(id: string, name: string) {
    if (!confirm(`Revoke API key for "${name}"? The client will immediately lose access to all skills.`)) return;
    const res = await fetch(`/api/admin/clients?id=${id}`, {
      method: "DELETE",
      headers: authHeaders(apiKey),
    });
    if (!res.ok) {
      setError(`Failed to revoke client`);
      return;
    }
    await fetchClients();
  }

  return (
    <>
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Clients</h1>
          <p className="mt-1 text-sm text-zinc-500">
            Create, revoke, and manage API keys. Keys grant access to specific gated skills.
          </p>
        </div>
        <button
          onClick={() => setShowCreate(true)}
          className="rounded-full bg-zinc-900 px-5 py-2.5 text-sm font-medium text-white hover:bg-zinc-800"
        >
          + New client
        </button>
      </div>

      {loading && (
        <div className="mt-8 flex items-center gap-3 text-sm text-zinc-500">
          <div className="h-4 w-4 animate-spin rounded-full border-2 border-zinc-300 border-t-zinc-900" />
          Loading clients...
        </div>
      )}

      {error && (
        <div className="mt-8 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
          {error}
        </div>
      )}

      {freshSecret && (
        <div className="mt-6 rounded-xl border border-emerald-200 bg-emerald-50 p-5">
          <p className="text-xs font-bold uppercase tracking-widest text-emerald-700">
            New API key — copy now, will not be shown again
          </p>
          <code className="mt-2 block break-all rounded-lg bg-white px-3 py-2 font-mono text-sm text-zinc-900">
            {freshSecret.api_key}
          </code>
          <div className="mt-3 flex items-center gap-3">
            <button
              onClick={() => {
                navigator.clipboard.writeText(freshSecret.api_key);
              }}
              className="text-xs font-medium text-emerald-700 hover:text-emerald-900"
            >
              Copy to clipboard
            </button>
            <button
              onClick={() => setFreshSecret(null)}
              className="text-xs text-zinc-500 hover:text-zinc-900"
            >
              Dismiss
            </button>
          </div>
        </div>
      )}

      {showCreate && (
        <CreateClientForm
          onCancel={() => setShowCreate(false)}
          onCreate={handleCreate}
        />
      )}

      {clients.length > 0 && (
        <div className="mt-8 overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-zinc-200 text-left text-xs font-medium uppercase tracking-widest text-zinc-400">
                <th className="pb-3 pr-4">Name</th>
                <th className="pb-3 pr-4">Email</th>
                <th className="pb-3 pr-4">Tier</th>
                <th className="pb-3 pr-4">Allowed skills</th>
                <th className="pb-3 pr-4 text-right">Rate/h</th>
                <th className="pb-3 pr-4">Status</th>
                <th className="pb-3 pr-4">Key prefix</th>
                <th className="pb-3 pr-4">Created</th>
                <th className="pb-3"></th>
              </tr>
            </thead>
            <tbody>
              {clients.map((c) => (
                <ClientRow
                  key={c.id}
                  client={c}
                  editing={editingId === c.id}
                  onEdit={() => setEditingId(c.id)}
                  onCancelEdit={() => setEditingId(null)}
                  onSave={(updates) => handleUpdate(c.id, updates)}
                  onRevoke={() => handleRevoke(c.id, c.name)}
                />
              ))}
            </tbody>
          </table>
        </div>
      )}

      {!loading && clients.length === 0 && !error && (
        <div className="mt-12 rounded-xl border border-dashed border-zinc-300 bg-white py-12 text-center">
          <p className="text-sm font-medium text-zinc-500">No clients yet</p>
          <p className="mt-2 text-xs text-zinc-400">
            Create the first one to grant API access to gated skills.
          </p>
        </div>
      )}
    </>
  );
}

function ClientRow({
  client,
  editing,
  onEdit,
  onCancelEdit,
  onSave,
  onRevoke,
}: {
  client: Client;
  editing: boolean;
  onEdit: () => void;
  onCancelEdit: () => void;
  onSave: (updates: Partial<Client>) => void;
  onRevoke: () => void;
}) {
  const [tier, setTier] = useState(client.tier);
  const [skills, setSkills] = useState<string[]>(client.allowed_skills);
  const [rate, setRate] = useState(client.rate_limit_per_hour);
  const [active, setActive] = useState(client.active);
  const [notes, setNotes] = useState(client.notes ?? "");

  useEffect(() => {
    if (editing) {
      setTier(client.tier);
      setSkills(client.allowed_skills);
      setRate(client.rate_limit_per_hour);
      setActive(client.active);
      setNotes(client.notes ?? "");
    }
  }, [editing, client]);

  if (editing) {
    return (
      <tr className="border-b border-zinc-100 bg-zinc-50">
        <td className="py-3 pr-4 font-medium">{client.name}</td>
        <td className="py-3 pr-4 text-zinc-500">{client.email}</td>
        <td className="py-3 pr-4">
          <select
            value={tier}
            onChange={(e) => setTier(e.target.value as Client["tier"])}
            className="rounded border border-zinc-200 px-2 py-1 text-xs"
          >
            {TIERS.map((t) => (
              <option key={t} value={t}>
                {t}
              </option>
            ))}
          </select>
        </td>
        <td className="py-3 pr-4">
          <div className="flex flex-wrap gap-1">
            <label className="flex items-center gap-1 text-xs">
              <input
                type="checkbox"
                checked={skills.includes("*")}
                onChange={(e) => setSkills(e.target.checked ? ["*"] : [])}
              />
              All (*)
            </label>
            {!skills.includes("*") &&
              KNOWN_SKILLS.map((k) => (
                <label key={k} className="flex items-center gap-1 text-xs">
                  <input
                    type="checkbox"
                    checked={skills.includes(k)}
                    onChange={(e) => {
                      setSkills(
                        e.target.checked ? [...skills, k] : skills.filter((s) => s !== k)
                      );
                    }}
                  />
                  {k}
                </label>
              ))}
          </div>
        </td>
        <td className="py-3 pr-4 text-right">
          <input
            type="number"
            value={rate}
            onChange={(e) => setRate(Math.max(1, Number(e.target.value) || 0))}
            className="w-20 rounded border border-zinc-200 px-2 py-1 text-right text-xs"
            min={1}
          />
        </td>
        <td className="py-3 pr-4">
          <label className="flex items-center gap-1 text-xs">
            <input type="checkbox" checked={active} onChange={(e) => setActive(e.target.checked)} />
            active
          </label>
        </td>
        <td className="py-3 pr-4 font-mono text-xs text-zinc-400">{client.api_key_prefix}…</td>
        <td className="py-3 pr-4 text-zinc-400 text-xs">
          <input
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="notes"
            className="w-32 rounded border border-zinc-200 px-2 py-1 text-xs"
          />
        </td>
        <td className="py-3 text-right">
          <button
            onClick={() =>
              onSave({
                tier,
                allowed_skills: skills,
                rate_limit_per_hour: rate,
                active,
                notes,
              })
            }
            className="mr-2 rounded bg-zinc-900 px-3 py-1 text-xs font-medium text-white hover:bg-zinc-800"
          >
            Save
          </button>
          <button
            onClick={onCancelEdit}
            className="text-xs text-zinc-500 hover:text-zinc-900"
          >
            Cancel
          </button>
        </td>
      </tr>
    );
  }

  return (
    <tr className="border-b border-zinc-100 hover:bg-white transition-colors">
      <td className="py-3 pr-4 font-medium">{client.name}</td>
      <td className="py-3 pr-4 text-zinc-500">{client.email}</td>
      <td className="py-3 pr-4">
        <span
          className={`inline-flex rounded-full border px-2 py-0.5 text-xs font-medium ${tierColor(client.tier)}`}
        >
          {client.tier}
        </span>
      </td>
      <td className="py-3 pr-4">
        <div className="flex flex-wrap gap-1">
          {client.allowed_skills.map((s) => (
            <span
              key={s}
              className="inline-flex rounded bg-zinc-100 px-2 py-0.5 font-mono text-xs text-zinc-700"
            >
              {s}
            </span>
          ))}
        </div>
      </td>
      <td className="py-3 pr-4 text-right font-mono text-xs text-zinc-600">
        {client.rate_limit_per_hour}
      </td>
      <td className="py-3 pr-4">
        {client.active ? (
          <span className="inline-flex rounded-full bg-emerald-50 px-2 py-0.5 text-xs text-emerald-700">
            active
          </span>
        ) : (
          <span className="inline-flex rounded-full bg-red-50 px-2 py-0.5 text-xs text-red-700">
            revoked
          </span>
        )}
      </td>
      <td className="py-3 pr-4 font-mono text-xs text-zinc-400">{client.api_key_prefix}…</td>
      <td className="py-3 pr-4 text-zinc-400 text-xs whitespace-nowrap">
        {client.created_at ? formatDate(client.created_at) : "—"}
      </td>
      <td className="py-3 text-right whitespace-nowrap">
        <button
          onClick={onEdit}
          className="mr-3 text-xs text-zinc-500 hover:text-zinc-900"
        >
          Edit
        </button>
        {client.active && (
          <button onClick={onRevoke} className="text-xs text-red-600 hover:text-red-800">
            Revoke
          </button>
        )}
      </td>
    </tr>
  );
}

function CreateClientForm({
  onCancel,
  onCreate,
}: {
  onCancel: () => void;
  onCreate: (payload: {
    name: string;
    email: string;
    tier: Client["tier"];
    allowed_skills: string[];
    rate_limit_per_hour: number;
    notes?: string;
  }) => void;
}) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [tier, setTier] = useState<Client["tier"]>("trial");
  const [skills, setSkills] = useState<string[]>(["*"]);
  const [rate, setRate] = useState(100);
  const [notes, setNotes] = useState("");

  return (
    <div className="mt-6 rounded-xl border border-zinc-200 bg-white p-6">
      <h2 className="text-sm font-bold uppercase tracking-widest text-zinc-400">
        Create client
      </h2>
      <div className="mt-4 grid gap-3 sm:grid-cols-2">
        <label className="text-xs">
          Name
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="mt-1 w-full rounded-lg border border-zinc-200 px-3 py-2 text-sm"
            placeholder="Acme Inc."
          />
        </label>
        <label className="text-xs">
          Email
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="mt-1 w-full rounded-lg border border-zinc-200 px-3 py-2 text-sm"
            placeholder="ops@acme.com"
          />
        </label>
        <label className="text-xs">
          Tier
          <select
            value={tier}
            onChange={(e) => setTier(e.target.value as Client["tier"])}
            className="mt-1 w-full rounded-lg border border-zinc-200 px-3 py-2 text-sm"
          >
            {TIERS.map((t) => (
              <option key={t} value={t}>
                {t}
              </option>
            ))}
          </select>
        </label>
        <label className="text-xs">
          Rate limit / hour
          <input
            type="number"
            value={rate}
            onChange={(e) => setRate(Math.max(1, Number(e.target.value) || 0))}
            min={1}
            className="mt-1 w-full rounded-lg border border-zinc-200 px-3 py-2 text-sm"
          />
        </label>
      </div>
      <div className="mt-4">
        <p className="text-xs font-medium text-zinc-600">Allowed skills</p>
        <div className="mt-2 flex flex-wrap gap-3">
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={skills.includes("*")}
              onChange={(e) => setSkills(e.target.checked ? ["*"] : [])}
            />
            All (*)
          </label>
          {!skills.includes("*") &&
            KNOWN_SKILLS.map((k) => (
              <label key={k} className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={skills.includes(k)}
                  onChange={(e) => {
                    setSkills(
                      e.target.checked ? [...skills, k] : skills.filter((s) => s !== k)
                    );
                  }}
                />
                {k}
              </label>
            ))}
        </div>
      </div>
      <div className="mt-4">
        <label className="text-xs">
          Notes (optional)
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            className="mt-1 w-full rounded-lg border border-zinc-200 px-3 py-2 text-sm"
            rows={2}
            placeholder="Onboarded Apr 15 via Stripe trial signup"
          />
        </label>
      </div>
      <div className="mt-6 flex items-center gap-3">
        <button
          disabled={!name.trim() || !email.trim() || skills.length === 0}
          onClick={() =>
            onCreate({
              name: name.trim(),
              email: email.trim(),
              tier,
              allowed_skills: skills,
              rate_limit_per_hour: rate,
              notes: notes.trim() || undefined,
            })
          }
          className="rounded-full bg-zinc-900 px-5 py-2.5 text-sm font-medium text-white hover:bg-zinc-800 disabled:opacity-40"
        >
          Create
        </button>
        <button onClick={onCancel} className="text-sm text-zinc-500 hover:text-zinc-900">
          Cancel
        </button>
      </div>
    </div>
  );
}
