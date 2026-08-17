"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import {
  ArrowLeft,
  ChevronLeft,
  ChevronRight,
  Pause,
  Play,
  Volume2,
} from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";

interface Song {
  id: string;
  title: string;
  artist: string;
  category: string;
  coverImage: string;
  audioUrl: string;
  duration: number | null;
}

const categoryData: Record<
  string,
  {
    name: string;
    description: string;
    emoji: string;
    background: string;
  }
> = {
  rajasthani: {
    name: "Rajasthani",
    description: "The sound and soul of Rajasthan",
    emoji: "🏜️",
    background:
      "radial-gradient(circle at center, rgba(180,100,30,0.25), transparent 55%)",
  },

  punjabi: {
    name: "Punjabi",
    description: "Punjabi beats and pure energy",
    emoji: "🥁",
    background:
      "radial-gradient(circle at center, rgba(40,130,80,0.25), transparent 55%)",
  },

  haryanvi: {
    name: "Haryanvi",
    description: "Desi Haryanvi vibes",
    emoji: "🌾",
    background:
      "radial-gradient(circle at center, rgba(130,110,30,0.25), transparent 55%)",
  },

  "90s": {
    name: "90s",
    description: "The golden memories of the 90s",
    emoji: "📻",
    background:
      "radial-gradient(circle at center, rgba(90,70,150,0.25), transparent 55%)",
  },
};

export default function CategoryPage() {
  const params = useParams();

  const slug =
    typeof params.slug === "string"
      ? params.slug.toLowerCase()
      : "";

  const category = categoryData[slug];

  const [songs, setSongs] = useState<Song[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [currentSong, setCurrentSong] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [volume, setVolume] = useState(80);

  const audioRef = useRef<HTMLAudioElement | null>(null);

  // ================================
  // LOAD SONGS
  // ================================

  useEffect(() => {
    async function loadSongs() {
      try {
        setLoading(true);
        setError("");

        const response = await fetch("/api/songs");

        if (!response.ok) {
          throw new Error("Failed to load songs");
        }

        const data = await response.json();

        setSongs(data.songs || []);
      } catch (error) {
        console.error("CATEGORY SONGS ERROR:", error);
        setError("Songs load nahi ho pa rahe hain.");
      } finally {
        setLoading(false);
      }
    }

    loadSongs();
  }, []);

  // ================================
  // FILTER CATEGORY
  // ================================

  const categorySongs = useMemo(() => {
    return songs.filter(
      (song) =>
        song.category?.toLowerCase() === slug
    );
  }, [songs, slug]);

  // ================================
  // RESET CURRENT SONG
  // ================================

  useEffect(() => {
    setCurrentSong(0);
    setIsPlaying(false);
  }, [slug]);

  // ================================
  // PLAY CURRENT SONG
  // ================================

  useEffect(() => {
    const audio = audioRef.current;

    if (!audio || !categorySongs.length) {
      return;
    }

    audio.volume = volume / 100;

    if (isPlaying) {
      audio
        .play()
        .catch((error) => {
          console.error("AUDIO PLAY ERROR:", error);
          setIsPlaying(false);
        });
    } else {
      audio.pause();
    }
  }, [isPlaying, currentSong, categorySongs, volume]);

  // ================================
  // VOLUME
  // ================================

  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.volume = volume / 100;
    }
  }, [volume]);

  // ================================
  // NEXT SONG
  // ================================

  const nextSong = () => {
    if (!categorySongs.length) return;

    setCurrentSong((current) =>
      current === categorySongs.length - 1
        ? 0
        : current + 1
    );

    setIsPlaying(true);
  };

  // ================================
  // PREVIOUS SONG
  // ================================

  const previousSong = () => {
    if (!categorySongs.length) return;

    setCurrentSong((current) =>
      current === 0
        ? categorySongs.length - 1
        : current - 1
    );

    setIsPlaying(true);
  };

  // ================================
  // SONG ENDED
  // ================================

  const handleSongEnded = () => {
    nextSong();
  };

  // ================================
  // INVALID CATEGORY
  // ================================

  if (!category) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#070707] text-white">
        <div className="text-center">
          <h1 className="text-3xl font-bold">
            Category not found
          </h1>

          <Link
            href="/"
            className="mt-5 inline-block rounded-full bg-white px-5 py-2 text-sm text-black"
          >
            Back to Music Flow
          </Link>
        </div>
      </main>
    );
  }

  const activeSong =
    categorySongs.length > 0
      ? categorySongs[currentSong]
      : null;

  return (
    <main
      className="min-h-screen bg-[#070707] text-white"
      style={{
        backgroundImage: category.background,
      }}
    >
      {/* ================================
          HEADER
      ================================= */}

      <header className="fixed left-0 right-0 top-0 z-50 border-b border-white/10 bg-black/60 backdrop-blur-xl">
        <div className="mx-auto flex h-16 max-w-5xl items-center px-5">
          <Link
            href="/"
            className="flex items-center gap-2 text-sm text-white/60 transition hover:text-white"
          >
            <ArrowLeft size={18} />

            <span>Music Flow</span>
          </Link>

          <div className="ml-auto text-sm font-medium">
            {category.name}
          </div>
        </div>
      </header>

      {/* ================================
          HERO
      ================================= */}

      <section className="flex min-h-[430px] items-center justify-center px-5 pt-16">
        <div className="text-center">
          <div className="mx-auto mb-6 flex h-48 w-48 items-center justify-center rounded-3xl border border-white/10 bg-white/[0.04] text-7xl shadow-2xl backdrop-blur-xl">
            {category.emoji}
          </div>

          <h1 className="text-4xl font-bold sm:text-6xl">
            {category.name}
          </h1>

          <p className="mt-3 text-sm text-white/40">
            {category.description}
          </p>
        </div>
      </section>

      {/* ================================
          SONGS
      ================================= */}

      <section className="mx-auto max-w-3xl px-5 pb-32">
        {loading ? (
          <div className="py-10 text-center text-sm text-white/40">
            Loading songs...
          </div>
        ) : error ? (
          <div className="rounded-2xl border border-red-500/20 bg-red-500/5 p-6 text-center text-sm text-red-300">
            {error}
          </div>
        ) : categorySongs.length === 0 ? (
          <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-10 text-center">
            <div className="text-4xl">
              {category.emoji}
            </div>

            <h2 className="mt-4 text-lg font-semibold">
              No songs found
            </h2>

            <p className="mt-2 text-sm text-white/40">
              Abhi {category.name} category mein koi song
              available nahi hai.
            </p>

            <Link
              href="/all-songs"
              className="mt-5 inline-block rounded-full bg-white px-5 py-2 text-sm font-medium text-black transition hover:scale-105"
            >
              Browse All Songs
            </Link>
          </div>
        ) : (
          <div className="space-y-2">
            {categorySongs.map((song, index) => {
              const isCurrent =
                index === currentSong;

              return (
                <button
                  key={song.id}
                  onClick={() => {
                    setCurrentSong(index);
                    setIsPlaying(true);
                  }}
                  className={`group flex w-full items-center gap-4 rounded-2xl border p-4 text-left transition ${
                    isCurrent
                      ? "border-white/15 bg-white/[0.08]"
                      : "border-white/5 bg-white/[0.025] hover:border-white/10 hover:bg-white/[0.06]"
                  }`}
                >
                  {/* COVER */}

                  <div className="h-12 w-12 shrink-0 overflow-hidden rounded-xl bg-white/10">
                    {song.coverImage ? (
                      <img
                        src={song.coverImage}
                        alt={song.title}
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center">
                        🎵
                      </div>
                    )}
                  </div>

                  {/* INFO */}

                  <div className="min-w-0 flex-1">
                    <h2 className="truncate text-sm font-medium">
                      {song.title}
                    </h2>

                    <p className="mt-1 truncate text-xs text-white/40">
                      {song.artist}
                    </p>
                  </div>

                  {/* PLAY ICON */}

                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full">
                    {isCurrent && isPlaying ? (
                      <Pause
                        size={17}
                        className="text-white"
                      />
                    ) : (
                      <Play
                        size={17}
                        className="text-white/40 transition group-hover:text-white"
                      />
                    )}
                  </div>
                </button>
              );
            })}
          </div>
        )}
      </section>

      {/* ================================
          AUDIO
      ================================= */}

      {activeSong && (
        <audio
          ref={audioRef}
          src={activeSong.audioUrl}
          onEnded={handleSongEnded}
          preload="metadata"
        />
      )}

      {/* ================================
          PLAYER
      ================================= */}

      <div className="fixed bottom-0 left-0 right-0 z-50 border-t border-white/10 bg-black/80 backdrop-blur-2xl">
        <div className="mx-auto max-w-5xl px-5 py-4">
          <div className="flex items-center gap-4">
            {/* CURRENT SONG */}

            <div className="hidden min-w-0 flex-1 sm:block">
              {activeSong ? (
                <>
                  <p className="truncate text-sm font-medium">
                    {activeSong.title}
                  </p>

                  <p className="truncate text-xs text-white/40">
                    {activeSong.artist}
                  </p>
                </>
              ) : (
                <>
                  <p className="text-sm font-medium">
                    No song selected
                  </p>

                  <p className="text-xs text-white/40">
                    Select a song to start playing
                  </p>
                </>
              )}
            </div>

            {/* CONTROLS */}

            <div className="mx-auto flex items-center gap-4">
              <button
                onClick={previousSong}
                disabled={!categorySongs.length}
                className="rounded-full p-2 text-white/60 transition hover:bg-white/10 hover:text-white disabled:cursor-not-allowed disabled:opacity-30"
              >
                <ChevronLeft size={22} />
              </button>

              <button
                onClick={() => {
                  if (!categorySongs.length) return;

                  setIsPlaying((current) => !current);
                }}
                disabled={!categorySongs.length}
                className="flex h-11 w-11 items-center justify-center rounded-full bg-white text-black transition hover:scale-105 disabled:cursor-not-allowed disabled:opacity-40"
              >
                {isPlaying ? (
                  <Pause size={19} />
                ) : (
                  <Play size={19} />
                )}
              </button>

              <button
                onClick={nextSong}
                disabled={!categorySongs.length}
                className="rounded-full p-2 text-white/60 transition hover:bg-white/10 hover:text-white disabled:cursor-not-allowed disabled:opacity-30"
              >
                <ChevronRight size={22} />
              </button>
            </div>

            {/* VOLUME */}

            <div className="hidden flex-1 items-center justify-end gap-3 sm:flex">
              <Volume2
                size={18}
                className="text-white/50"
              />

              <input
                type="range"
                min="0"
                max="100"
                value={volume}
                onChange={(e) =>
                  setVolume(Number(e.target.value))
                }
                className="w-24"
              />
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}