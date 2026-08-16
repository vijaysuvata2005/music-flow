"use client";

import { ChangeEvent, FormEvent, useState } from "react";

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

async function uploadFile(file: File) {
  const formData = new FormData();

  formData.append("file", file);

  const response = await fetch("/api/admin/upload", {
    method: "POST",
    body: formData,
  });

  const text = await response.text();

  let data: {
    url?: string;
    error?: string;
  };

  try {
    data = JSON.parse(text);
  } catch {
    console.error(
      "UPLOAD API NON-JSON RESPONSE:",
      text
    );

    throw new Error(
      `Upload server error (${response.status}): ${text.slice(
        0,
        200
      )}`
    );
  }

  if (!response.ok) {
    throw new Error(
      data.error || "Upload failed"
    );
  }

  if (!data.url) {
    throw new Error(
      "Upload succeeded but no file URL was returned."
    );
  }

  return data.url;
}

export default function AddSongForm() {
  const [title, setTitle] = useState("");
  const [artist, setArtist] = useState("");
  const [category, setCategory] = useState("rajasthani");
  const [coverImage, setCoverImage] = useState("");
  const [audioUrl, setAudioUrl] = useState("");
  const [duration, setDuration] = useState("");

  const [coverFile, setCoverFile] = useState<File | null>(
    null
  );

  const [audioFile, setAudioFile] = useState<File | null>(
    null
  );

  const [loading, setLoading] = useState(false);
  const [uploadStatus, setUploadStatus] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  function handleCoverChange(
    event: ChangeEvent<HTMLInputElement>
  ) {
    const file = event.target.files?.[0];

    if (!file) {
      return;
    }

    if (!file.type.startsWith("image/")) {
      setError("Please select a valid image file.");
      return;
    }

    setError("");
    setCoverFile(file);
  }

  function handleAudioChange(
    event: ChangeEvent<HTMLInputElement>
  ) {
    const file = event.target.files?.[0];

    if (!file) {
      return;
    }

    if (
      !file.type.startsWith("audio/") &&
      !file.name.toLowerCase().endsWith(".mp3")
    ) {
      setError("Please select a valid audio file.");
      return;
    }

    setError("");
    setAudioFile(file);
  }

  async function handleSubmit(
    event: FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();

    setLoading(true);
    setMessage("");
    setError("");

    try {
      if (!coverFile) {
        throw new Error(
          "Please select a cover image."
        );
      }

      if (!audioFile) {
        throw new Error(
          "Please select an audio file."
        );
      }

      if (!title.trim()) {
        throw new Error(
          "Please enter the song title."
        );
      }

      if (!artist.trim()) {
        throw new Error(
          "Please enter the artist name."
        );
      }

      setUploadStatus("Uploading cover image...");

      const uploadedCoverUrl =
        await uploadFile(coverFile);

      setCoverImage(uploadedCoverUrl);

      setUploadStatus("Uploading audio...");

      const uploadedAudioUrl =
        await uploadFile(audioFile);

      setAudioUrl(uploadedAudioUrl);

      setUploadStatus("Saving song...");

      const response = await fetch(
        "/api/admin/songs",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            title: title.trim(),
            artist: artist.trim(),
            category,
            coverImage: uploadedCoverUrl,
            audioUrl: uploadedAudioUrl,
            duration:
              duration === ""
                ? null
                : Number(duration),
          }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.error || "Failed to save song."
        );
      }

      setMessage(
        "Song added successfully!"
      );

      setTitle("");
      setArtist("");
      setCategory("rajasthani");
      setCoverImage("");
      setAudioUrl("");
      setDuration("");
      setCoverFile(null);
      setAudioFile(null);
      setUploadStatus("");

      const coverInput =
        document.getElementById(
          "cover-file"
        ) as HTMLInputElement | null;

      const audioInput =
        document.getElementById(
          "audio-file"
        ) as HTMLInputElement | null;

      if (coverInput) {
        coverInput.value = "";
      }

      if (audioInput) {
        audioInput.value = "";
      }
    } catch (error) {
      console.error(error);

      setUploadStatus("");

      setError(
        error instanceof Error
          ? error.message
          : "Something went wrong."
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="mt-10 rounded-3xl border border-white/10 bg-white/[0.04] p-6 shadow-2xl backdrop-blur-xl">
      <div className="mb-7">
        <p className="text-sm font-medium text-white/40">
          Music Library
        </p>

        <h2 className="mt-1 text-2xl font-bold">
          Add New Song
        </h2>

        <p className="mt-2 text-sm text-white/40">
          Upload a cover image and audio file.
        </p>
      </div>

      <form
        onSubmit={handleSubmit}
        className="space-y-5"
      >
        {/* Song title */}
        <div>
          <label className="mb-2 block text-sm text-white/60">
            Song Title
          </label>

          <input
            type="text"
            value={title}
            onChange={(event) =>
              setTitle(event.target.value)
            }
            placeholder="Enter song title"
            required
            className="w-full rounded-xl border border-white/10 bg-black/30 px-4 py-3 text-white outline-none placeholder:text-white/25 focus:border-white/30"
          />
        </div>

        {/* Artist */}
        <div>
          <label className="mb-2 block text-sm text-white/60">
            Artist
          </label>

          <input
            type="text"
            value={artist}
            onChange={(event) =>
              setArtist(event.target.value)
            }
            placeholder="Enter artist name"
            required
            className="w-full rounded-xl border border-white/10 bg-black/30 px-4 py-3 text-white outline-none placeholder:text-white/25 focus:border-white/30"
          />
        </div>

        {/* Category */}
        <div>
          <label className="mb-2 block text-sm text-white/60">
            Category
          </label>

          <select
            value={category}
            onChange={(event) =>
              setCategory(event.target.value)
            }
            className="w-full rounded-xl border border-white/10 bg-black/30 px-4 py-3 text-white outline-none focus:border-white/30"
          >
            {categories.map((item) => (
              <option
                key={item.value}
                value={item.value}
                className="bg-black"
              >
                {item.label}
              </option>
            ))}
          </select>
        </div>

        {/* Cover */}
        <div>
          <label
            htmlFor="cover-file"
            className="mb-2 block text-sm text-white/60"
          >
            Cover Image
          </label>

          <input
            id="cover-file"
            type="file"
            accept="image/*"
            onChange={handleCoverChange}
            className="block w-full cursor-pointer rounded-xl border border-white/10 bg-black/30 p-3 text-sm text-white/60 file:mr-4 file:rounded-lg file:border-0 file:bg-white file:px-4 file:py-2 file:font-medium file:text-black"
          />

          {coverFile && (
            <p className="mt-2 text-xs text-white/40">
              Selected: {coverFile.name}
            </p>
          )}
        </div>

        {/* Audio */}
        <div>
          <label
            htmlFor="audio-file"
            className="mb-2 block text-sm text-white/60"
          >
            Audio File
          </label>

          <input
            id="audio-file"
            type="file"
            accept="audio/*,.mp3"
            onChange={handleAudioChange}
            className="block w-full cursor-pointer rounded-xl border border-white/10 bg-black/30 p-3 text-sm text-white/60 file:mr-4 file:rounded-lg file:border-0 file:bg-white file:px-4 file:py-2 file:font-medium file:text-black"
          />

          {audioFile && (
            <p className="mt-2 text-xs text-white/40">
              Selected: {audioFile.name}
            </p>
          )}
        </div>

        {/* Duration */}
        <div>
          <label className="mb-2 block text-sm text-white/60">
            Duration in seconds
          </label>

          <input
            type="number"
            min="0"
            value={duration}
            onChange={(event) =>
              setDuration(event.target.value)
            }
            placeholder="Example: 240"
            className="w-full rounded-xl border border-white/10 bg-black/30 px-4 py-3 text-white outline-none placeholder:text-white/25 focus:border-white/30"
          />
        </div>

        {/* Status */}
        {uploadStatus && (
          <div className="rounded-xl border border-white/10 bg-white/[0.04] px-4 py-3 text-sm text-white/70">
            {uploadStatus}
          </div>
        )}

        {message && (
          <div className="rounded-xl border border-green-500/20 bg-green-500/10 px-4 py-3 text-sm text-green-300">
            {message}
          </div>
        )}

        {error && (
          <div className="rounded-xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-300">
            {error}
          </div>
        )}

        {/* Submit */}
        <button
          type="submit"
          disabled={loading}
          className="w-full rounded-xl bg-white px-5 py-3 font-medium text-black transition hover:bg-white/90 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {loading
            ? "Processing..."
            : "Add Song"}
        </button>
      </form>
    </div>
  );
}