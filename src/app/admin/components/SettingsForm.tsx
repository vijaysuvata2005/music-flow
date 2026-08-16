"use client";

import { useEffect, useState } from "react";

export default function SettingsForm() {
  const [siteName, setSiteName] =
    useState("Music Flow");

  const [instagramUrl, setInstagramUrl] =
    useState("");

  const [loading, setLoading] =
    useState(true);

  const [saving, setSaving] =
    useState(false);

  const [message, setMessage] =
    useState("");

  const [error, setError] =
    useState("");

  useEffect(() => {
    async function loadSettings() {
      try {
        setLoading(true);
        setError("");

        const response = await fetch(
          "/api/admin/settings",
          {
            cache: "no-store",
          }
        );

        const data = await response.json();

        if (!response.ok) {
          throw new Error(
            data.error ||
              "Failed to load settings."
          );
        }

        setSiteName(
          data.settings?.siteName ||
            "Music Flow"
        );

        setInstagramUrl(
          data.settings?.instagramUrl ||
            ""
        );
      } catch (error) {
        console.error(
          "LOAD SETTINGS ERROR:",
          error
        );

        setError(
          error instanceof Error
            ? error.message
            : "Failed to load settings."
        );
      } finally {
        setLoading(false);
      }
    }

    loadSettings();
  }, []);

  async function handleSave() {
    try {
      setSaving(true);
      setMessage("");
      setError("");

      const response = await fetch(
        "/api/admin/settings",
        {
          method: "PATCH",
          headers: {
            "Content-Type":
              "application/json",
          },
          body: JSON.stringify({
            siteName:
              siteName.trim() ||
              "Music Flow",

            instagramUrl:
              instagramUrl.trim(),
          }),
        }
      );

      const data =
        await response.json();

      if (!response.ok) {
        throw new Error(
          data.error ||
            "Failed to save settings."
        );
      }

      setMessage(
        "Settings saved successfully."
      );
    } catch (error) {
      console.error(
        "SAVE SETTINGS ERROR:",
        error
      );

      setError(
        error instanceof Error
          ? error.message
          : "Failed to save settings."
      );
    } finally {
      setSaving(false);
    }
  }

  return (
    <section className="mt-10 rounded-3xl border border-white/10 bg-white/[0.04] p-6">

      {/* Heading */}
      <div>
        <p className="text-sm text-white/40">
          Website Settings
        </p>

        <h2 className="mt-1 text-2xl font-bold">
          Music Flow Settings
        </h2>

        <p className="mt-2 text-sm text-white/40">
          Manage your website name and
          Instagram profile.
        </p>
      </div>

      {loading ? (
        <div className="mt-6 rounded-xl border border-white/10 bg-black/20 p-4 text-sm text-white/40">
          Loading settings...
        </div>
      ) : (
        <div className="mt-6 space-y-5">

          {/* Site Name */}
          <div>
            <label className="mb-2 block text-sm text-white/60">
              Website Name
            </label>

            <input
              type="text"
              value={siteName}
              onChange={(event) =>
                setSiteName(
                  event.target.value
                )
              }
              placeholder="Music Flow"
              className="w-full rounded-xl border border-white/10 bg-black/30 px-4 py-3 text-white outline-none placeholder:text-white/30 focus:border-white/30"
            />
          </div>

          {/* Instagram */}
          <div>
            <label className="mb-2 block text-sm text-white/60">
              Instagram Profile URL
            </label>

            <input
              type="url"
              value={instagramUrl}
              onChange={(event) =>
                setInstagramUrl(
                  event.target.value
                )
              }
              placeholder="https://instagram.com/yourusername"
              className="w-full rounded-xl border border-white/10 bg-black/30 px-4 py-3 text-white outline-none placeholder:text-white/30 focus:border-white/30"
            />

            <p className="mt-2 text-xs text-white/30">
              This profile will be opened when
              users click the Instagram button.
            </p>
          </div>

          {/* Error */}
          {error && (
            <div className="rounded-xl border border-red-500/20 bg-red-500/10 p-4 text-sm text-red-300">
              {error}
            </div>
          )}

          {/* Success */}
          {message && (
            <div className="rounded-xl border border-green-500/20 bg-green-500/10 p-4 text-sm text-green-300">
              {message}
            </div>
          )}

          {/* Save */}
          <button
            type="button"
            onClick={handleSave}
            disabled={saving}
            className="rounded-xl bg-white px-6 py-3 text-sm font-semibold text-black transition hover:bg-white/90 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {saving
              ? "Saving..."
              : "Save Settings"}
          </button>

        </div>
      )}
    </section>
  );
}