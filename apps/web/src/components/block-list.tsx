"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import type { BlockDto } from "@dorham/shared";
import { api, ApiError } from "../lib/api";
import { useCopy } from "./locale-provider";

export function BlockList() {
  const copy = useCopy();
  const [rows, setRows] = useState<BlockDto[] | null>(null);
  const [error, setError] = useState("");

  function load() {
    api<BlockDto[]>("/users/me/blocks")
      .then(setRows)
      .catch((err: unknown) => setError(err instanceof ApiError ? err.message : copy.safety.blockFail));
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function unblock(id: string) {
    try {
      await api(`/users/${id}/block`, { method: "DELETE" });
      setRows((prev) => (prev ?? []).filter((row) => row.blockedId !== id));
    } catch (err) {
      setError(err instanceof ApiError ? err.message : copy.safety.blockFail);
    }
  }

  return (
    <article className="profile-trust-card">
      <h3>{copy.safety.blocksTitle}</h3>
      <p className="muted">{copy.safety.blocksLead}</p>
      {error ? <p className="muted">{error}</p> : null}
      {!rows ? (
        <p className="muted">…</p>
      ) : rows.length === 0 ? (
        <p className="muted">{copy.safety.blocksEmpty}</p>
      ) : (
        <ul className="block-list">
          {rows.map((row) => (
            <li key={row.id}>
              <Link href={`/people/${row.blockedId}`}>{row.displayName}</Link>
              <button className="btn ghost" type="button" onClick={() => void unblock(row.blockedId)}>
                {copy.safety.unblock}
              </button>
            </li>
          ))}
        </ul>
      )}
    </article>
  );
}
