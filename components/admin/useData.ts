"use client";

import { useCallback, useEffect, useState } from "react";

/** Loads a data/<file>.json through the admin API and exposes a save() that PUTs it back. */
export function useData<T>(file: string) {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [savedAt, setSavedAt] = useState<number | null>(null);

  useEffect(() => {
    let alive = true;
    setLoading(true);
    setError("");
    fetch(`/api/admin/data?file=${file}`)
      .then(async (r) => {
        if (!r.ok) throw new Error();
        return r.json();
      })
      .then((j) => {
        if (alive) {
          setData(j);
          setLoading(false);
        }
      })
      .catch(() => {
        if (alive) {
          setError("โหลดข้อมูลไม่สำเร็จ");
          setLoading(false);
        }
      });
    return () => {
      alive = false;
    };
  }, [file]);

  const save = useCallback(async () => {
    if (data == null) return false;
    setSaving(true);
    setError("");
    try {
      const res = await fetch(`/api/admin/data?file=${file}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      const j = await res.json();
      if (!res.ok) throw new Error(j?.error || "บันทึกไม่สำเร็จ");
      setSavedAt(Date.now());
      return true;
    } catch (e) {
      setError(e instanceof Error ? e.message : "บันทึกไม่สำเร็จ");
      return false;
    } finally {
      setSaving(false);
    }
  }, [data, file]);

  return { data, setData, loading, saving, error, savedAt, save };
}
