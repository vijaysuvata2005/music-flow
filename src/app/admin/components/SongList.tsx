"use client";

import { useEffect, useState } from "react";

interface Song {
  id: string;
  title: string;
  artist: string;
  category: string;
  coverImage: string;
  audioUrl: string;
  duration: number | null;
  createdAt: string;
}

const categories = [
  {
    value: "rajasthani",
    label: "Rajasthani",
  },
  {
    value: "punjabi",
    label: "Punjabi",
  },
  {
    value: "haryanvi",
    label: "Haryanvi",
  },
  {
    value: "90s",
    label: "90s",
  },
];

function formatDuration(seconds: number | null) {
  if (!seconds) {
    return "--:--";
  }

  const minutes = Math.floor(seconds / 60);
  const remaining = seconds % 60;

  return `${minutes}:${remaining
    .toString()
    .padStart(2, "0")}`;
}

export default function SongList() {
  const [songs, setSongs] = useState<Song[]>([]);
  const [search, setSearch] = useState("");

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [editingSong, setEditingSong] =
    useState<Song | null>(null);

  const [saving, setSaving] = useState(false);

  const [deletingId, setDeletingId] =
    useState<string | null>(null);

  const [uploadingCover, setUploadingCover] =
    useState(false);

  const [uploadingAudio, setUploadingAudio] =
    useState(false);

  async function uploadFile(file: File) {
    const formData = new FormData();

    formData.append("file", file);

    const response = await fetch(
      "/api/admin/upload",
      {
        method: "POST",
        body: formData,
      }
    );

    const text = await response.text();

    let data: {
      url?: string;
      error?: string;
    } = {};

    try {
      data = text ? JSON.parse(text) : {};
    } catch {
      throw new Error(
        `Upload server returned invalid response (${response.status}).`
      );
    }

    if (!response.ok) {
      throw new Error(
        data.error || "Upload failed."
      );
    }

    if (!data.url) {
      throw new Error(
        "Upload completed but URL was not returned."
      );
    }

    return data.url;
  }

  async function loadSongs() {
    try {
      setLoading(true);
      setError("");

      const response = await fetch(
        "/api/admin/songs",
        {
          cache: "no-store",
        }
      );

      const text = await response.text();

      let data: {
        songs?: Song[];
        error?: string;
      } = {};

      try {
        data = text ? JSON.parse(text) : {};
      } catch {
        throw new Error(
          "Invalid server response."
        );
      }

      if (!response.ok) {
        throw new Error(
          data.error ||
            `Failed to load songs (${response.status}).`
        );
      }

      setSongs(data.songs ?? []);
    } catch (error) {
      console.error(error);

      setError(
        error instanceof Error
          ? error.message
          : "Failed to load songs."
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadSongs();
  }, []);

  async function handleDelete(
    id: string,
    title: string
  ) {
    const confirmed = window.confirm(
      `Delete "${title}"?`
    );

    if (!confirmed) {
      return;
    }

    try {
      setDeletingId(id);
      setError("");

      const response = await fetch(
        "/api/admin/songs",
        {
          method: "DELETE",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            id,
          }),
        }
      );

      const text = await response.text();

      let data: {
        success?: boolean;
        error?: string;
      } = {};

      try {
        data = text ? JSON.parse(text) : {};
      } catch {
        throw new Error(
          "Invalid delete response."
        );
      }

      if (!response.ok) {
        throw new Error(
          data.error ||
            `Failed to delete song (${response.status}).`
        );
      }

      setSongs((currentSongs) =>
        currentSongs.filter(
          (song) => song.id !== id
        )
      );
    } catch (error) {
      console.error(
        "DELETE SONG ERROR:",
        error
      );

      setError(
        error instanceof Error
          ? error.message
          : "Failed to delete song."
      );
    } finally {
      setDeletingId(null);
    }
  }

  async function handleUpdate() {
    if (!editingSong) {
      return;
    }

    try {
      setSaving(true);
      setError("");

      const response = await fetch(
        "/api/admin/songs",
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            id: editingSong.id,
            title: editingSong.title.trim(),
            artist: editingSong.artist.trim(),
            category: editingSong.category,
            coverImage:
              editingSong.coverImage.trim(),
            audioUrl:
              editingSong.audioUrl.trim(),
            duration:
              editingSong.duration,
          }),
        }
      );

      const text = await response.text();

      let data: {
        song?: Song;
        error?: string;
      } = {};

      try {
        data = text ? JSON.parse(text) : {};
      } catch {
        throw new Error(
          `Update server returned invalid response (${response.status}).`
        );
      }

      if (!response.ok) {
        throw new Error(
          data.error ||
            `Failed to update song (${response.status}).`
        );
      }

      if (!data.song) {
        throw new Error(
          "Song was updated but no song data was returned."
        );
      }

      setSongs((currentSongs) =>
        currentSongs.map((song) =>
          song.id === data.song!.id
            ? data.song!
            : song
        )
      );

      setEditingSong(null);
    } catch (error) {
      console.error(
        "UPDATE SONG ERROR:",
        error
      );

      setError(
        error instanceof Error
          ? error.message
          : "Failed to update song."
      );
    } finally {
      setSaving(false);
    }
  }

  const filteredSongs = songs.filter(
    (song) => {
      const value =
        `${song.title} ${song.artist} ${song.category}`
          .toLowerCase();

      return value.includes(
        search.toLowerCase()
      );
    }
  );

  return (
    <section className="mt-10">
      <div className="mb-5 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-sm text-white/40">
            Library
          </p>

          <h2 className="mt-1 text-2xl font-bold">
            Your Songs
          </h2>
        </div>

        <input
          type="search"
          value={search}
          onChange={(event) =>
            setSearch(event.target.value)
          }
          placeholder="Search songs..."
          className="w-full rounded-xl border border-white/10 bg-white/[0.04] px-4 py-3 text-sm text-white outline-none placeholder:text-white/30 focus:border-white/30 sm:w-72"
        />
      </div>

      {loading && (
        <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-8 text-center text-white/40">
          Loading songs...
        </div>
      )}

      {error && (
        <div className="mb-4 rounded-2xl border border-red-500/20 bg-red-500/10 p-5 text-red-300">
          {error}
        </div>
      )}

      {!loading &&
        !error &&
        filteredSongs.length === 0 && (
          <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-10 text-center">
            <p className="text-white/50">
              No songs found.
            </p>
          </div>
        )}

      <div className="space-y-3">
        {filteredSongs.map((song) => (
          <div
            key={song.id}
            className="flex flex-col gap-4 rounded-2xl border border-white/10 bg-white/[0.04] p-4 transition hover:bg-white/[0.06] sm:flex-row sm:items-center"
          >
            <img
              src={song.coverImage}
              alt={song.title}
              className="h-16 w-16 rounded-xl object-cover"
            />

            <div className="min-w-0 flex-1">
              <h3 className="truncate font-semibold">
                {song.title}
              </h3>

              <p className="truncate text-sm text-white/40">
                {song.artist}
              </p>

              <div className="mt-2 flex gap-2 text-xs">
                <span className="rounded-full bg-white/10 px-2 py-1 text-white/50">
                  {song.category}
                </span>

                <span className="rounded-full bg-white/10 px-2 py-1 text-white/50">
                  {formatDuration(
                    song.duration
                  )}
                </span>
              </div>
            </div>

            <div className="flex gap-2">
              <button
                type="button"
                onClick={() =>
                  setEditingSong({
                    ...song,
                  })
                }
                className="rounded-xl border border-white/10 px-4 py-2 text-sm text-white/70 transition hover:bg-white/10"
              >
                Edit
              </button>

              <button
                type="button"
                disabled={
                  deletingId === song.id
                }
                onClick={() =>
                  handleDelete(
                    song.id,
                    song.title
                  )
                }
                className="rounded-xl border border-red-500/20 px-4 py-2 text-sm text-red-300 transition hover:bg-red-500/10 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {deletingId === song.id
                  ? "Deleting..."
                  : "Delete"}
              </button>
            </div>
          </div>
        ))}
      </div>

      {editingSong && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm">
          <div className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-3xl border border-white/10 bg-[#111] p-6 shadow-2xl">
            <div className="mb-6 flex items-center justify-between">
              <div>
                <p className="text-sm text-white/40">
                  Music Flow
                </p>

                <h2 className="mt-1 text-2xl font-bold">
                  Edit Song
                </h2>
              </div>

              <button
                type="button"
                onClick={() =>
                  setEditingSong(null)
                }
                className="rounded-xl px-3 py-2 text-white/50 hover:bg-white/10 hover:text-white"
              >
                ✕
              </button>
            </div>

            <div className="space-y-4">
              {/* Song Title */}
              <div>
                <label className="mb-2 block text-sm text-white/60">
                  Song Title
                </label>

                <input
                  value={editingSong.title}
                  onChange={(event) =>
                    setEditingSong({
                      ...editingSong,
                      title:
                        event.target.value,
                    })
                  }
                  className="w-full rounded-xl border border-white/10 bg-black/30 px-4 py-3 text-white outline-none focus:border-white/30"
                />
              </div>

              {/* Artist */}
              <div>
                <label className="mb-2 block text-sm text-white/60">
                  Artist
                </label>

                <input
                  value={editingSong.artist}
                  onChange={(event) =>
                    setEditingSong({
                      ...editingSong,
                      artist:
                        event.target.value,
                    })
                  }
                  className="w-full rounded-xl border border-white/10 bg-black/30 px-4 py-3 text-white outline-none focus:border-white/30"
                />
              </div>

              {/* Category */}
              <div>
                <label className="mb-2 block text-sm text-white/60">
                  Category
                </label>

                <select
                  value={editingSong.category}
                  onChange={(event) =>
                    setEditingSong({
                      ...editingSong,
                      category:
                        event.target.value,
                    })
                  }
                  className="w-full rounded-xl border border-white/10 bg-black/30 px-4 py-3 text-white outline-none focus:border-white/30"
                >
                  {categories.map(
                    (category) => (
                      <option
                        key={
                          category.value
                        }
                        value={
                          category.value
                        }
                        className="bg-black"
                      >
                        {category.label}
                      </option>
                    )
                  )}
                </select>
              </div>

              {/* Cover Image Upload */}
              <div>
                <label className="mb-2 block text-sm text-white/60">
                  Cover Image
                </label>

                <input
                  type="file"
                  accept="image/*"
                  disabled={uploadingCover}
                  onChange={async (event) => {
                    const file =
                      event.target.files?.[0];

                    if (!file) {
                      return;
                    }

                    try {
                      setUploadingCover(
                        true
                      );
                      setError("");

                      const url =
                        await uploadFile(
                          file
                        );

                      setEditingSong({
                        ...editingSong,
                        coverImage: url,
                      });
                    } catch (error) {
                      setError(
                        error instanceof Error
                          ? error.message
                          : "Cover upload failed."
                      );
                    } finally {
                      setUploadingCover(
                        false
                      );

                      event.target.value =
                        "";
                    }
                  }}
                  className="block w-full cursor-pointer rounded-xl border border-white/10 bg-black/30 p-3 text-sm text-white/60 file:mr-4 file:rounded-lg file:border-0 file:bg-white file:px-4 file:py-2 file:font-medium file:text-black"
                />

                {uploadingCover && (
                  <p className="mt-2 text-xs text-white/40">
                    Uploading cover image...
                  </p>
                )}

                {editingSong.coverImage && (
                  <img
                    src={
                      editingSong.coverImage
                    }
                    alt={editingSong.title}
                    className="mt-3 h-24 w-24 rounded-xl object-cover"
                  />
                )}
              </div>

              {/* Audio Upload */}
              <div>
                <label className="mb-2 block text-sm text-white/60">
                  Audio File
                </label>

                <input
                  type="file"
                  accept="audio/*,.mp3"
                  disabled={uploadingAudio}
                  onChange={async (event) => {
                    const file =
                      event.target.files?.[0];

                    if (!file) {
                      return;
                    }

                    try {
                      setUploadingAudio(
                        true
                      );
                      setError("");

                      const url =
                        await uploadFile(
                          file
                        );

                      setEditingSong({
                        ...editingSong,
                        audioUrl: url,
                      });
                    } catch (error) {
                      setError(
                        error instanceof Error
                          ? error.message
                          : "Audio upload failed."
                      );
                    } finally {
                      setUploadingAudio(
                        false
                      );

                      event.target.value =
                        "";
                    }
                  }}
                  className="block w-full cursor-pointer rounded-xl border border-white/10 bg-black/30 p-3 text-sm text-white/60 file:mr-4 file:rounded-lg file:border-0 file:bg-white file:px-4 file:py-2 file:font-medium file:text-black"
                />

                {uploadingAudio && (
                  <p className="mt-2 text-xs text-white/40">
                    Uploading audio...
                  </p>
                )}

                {editingSong.audioUrl && (
                  <audio
                    controls
                    src={
                      editingSong.audioUrl
                    }
                    className="mt-3 w-full"
                  />
                )}
              </div>

              {/* Duration */}
              <div>
                <label className="mb-2 block text-sm text-white/60">
                  Duration (seconds)
                </label>

                <input
                  type="number"
                  min="0"
                  value={
                    editingSong.duration ??
                    ""
                  }
                  onChange={(event) =>
                    setEditingSong({
                      ...editingSong,
                      duration:
                        event.target.value ===
                        ""
                          ? null
                          : Number(
                              event.target.value
                            ),
                    })
                  }
                  className="w-full rounded-xl border border-white/10 bg-black/30 px-4 py-3 text-white outline-none focus:border-white/30"
                />
              </div>
            </div>

            {/* Buttons */}
            <div className="mt-6 flex gap-3">
              <button
                type="button"
                onClick={() =>
                  setEditingSong(null)
                }
                disabled={
                  saving ||
                  uploadingCover ||
                  uploadingAudio
                }
                className="flex-1 rounded-xl border border-white/10 px-4 py-3 text-sm text-white/70 hover:bg-white/10 disabled:opacity-50"
              >
                Cancel
              </button>

              <button
                type="button"
                onClick={handleUpdate}
                disabled={
                  saving ||
                  uploadingCover ||
                  uploadingAudio
                }
                className="flex-1 rounded-xl bg-white px-4 py-3 text-sm font-semibold text-black hover:bg-white/90 disabled:opacity-50"
              >
                {saving
                  ? "Saving..."
                  : "Save Changes"}
              </button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}