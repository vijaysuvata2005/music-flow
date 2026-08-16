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
import { useState } from "react";

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

const demoSongs = [
  {
    id: 1,
    title: "Sample Song One",
    artist: "Music Flow",
  },
  {
    id: 2,
    title: "Sample Song Two",
    artist: "Music Flow",
  },
  {
    id: 3,
    title: "Sample Song Three",
    artist: "Music Flow",
  },
];

export default function CategoryPage() {
  const params = useParams();

  const slug =
    typeof params.slug === "string"
      ? params.slug.toLowerCase()
      : "";

  const category = categoryData[slug];

  const [isPlaying, setIsPlaying] = useState(false);
  const [currentSong, setCurrentSong] = useState(0);
  const [volume, setVolume] = useState(80);

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

  const nextSong = () => {
    setCurrentSong((current) =>
      current === demoSongs.length - 1 ? 0 : current + 1
    );

    setIsPlaying(true);
  };

  const previousSong = () => {
    setCurrentSong((current) =>
      current === 0 ? demoSongs.length - 1 : current - 1
    );

    setIsPlaying(true);
  };

  return (
    <main
      className="min-h-screen bg-[#070707] text-white"
      style={{
        backgroundImage: category.background,
      }}
    >
      {/* HEADER */}

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

      {/* CATEGORY HERO */}

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

      {/* SONGS */}

      <section className="mx-auto max-w-3xl px-5 pb-32">
        <div className="space-y-2">
          {demoSongs.map((song, index) => (
            <button
              key={song.id}
              onClick={() => {
                setCurrentSong(index);
                setIsPlaying(true);
              }}
              className="group flex w-full items-center gap-4 rounded-2xl border border-white/5 bg-white/[0.025] p-4 text-left transition hover:border-white/10 hover:bg-white/[0.06]"
            >
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-white/10">
                🎵
              </div>

              <div className="min-w-0 flex-1">
                <h2 className="truncate text-sm font-medium">
                  {song.title}
                </h2>

                <p className="mt-1 text-xs text-white/40">
                  {song.artist}
                </p>
              </div>

              <Play
                size={18}
                className="text-white/40 transition group-hover:text-white"
              />
            </button>
          ))}
        </div>
      </section>

      {/* PLAYER */}

      <div className="fixed bottom-0 left-0 right-0 z-50 border-t border-white/10 bg-black/80 backdrop-blur-2xl">
        <div className="mx-auto max-w-5xl px-5 py-4">
          <div className="flex items-center gap-4">
            <div className="hidden min-w-0 flex-1 sm:block">
              <p className="truncate text-sm font-medium">
                {demoSongs[currentSong].title}
              </p>

              <p className="truncate text-xs text-white/40">
                {demoSongs[currentSong].artist}
              </p>
            </div>

            <div className="mx-auto flex items-center gap-4">
              <button
                onClick={previousSong}
                className="rounded-full p-2 text-white/60 transition hover:bg-white/10 hover:text-white"
              >
                <ChevronLeft size={22} />
              </button>

              <button
                onClick={() => setIsPlaying(!isPlaying)}
                className="flex h-11 w-11 items-center justify-center rounded-full bg-white text-black transition hover:scale-105"
              >
                {isPlaying ? (
                  <Pause size={19} />
                ) : (
                  <Play size={19} />
                )}
              </button>

              <button
                onClick={nextSong}
                className="rounded-full p-2 text-white/60 transition hover:bg-white/10 hover:text-white"
              >
                <ChevronRight size={22} />
              </button>
            </div>

            <div className="hidden flex-1 items-center justify-end gap-3 sm:flex">
              <Volume2 size={18} className="text-white/50" />

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