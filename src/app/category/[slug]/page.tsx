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
  VolumeX,
} from "lucide-react";
import {
  useEffect,
  useRef,
  useState,
} from "react";

interface Song {
  id: string;
  title: string;
  artist: string;
  category: string;
  coverImage: string;
  audioUrl: string;
  duration: number | null;
  createdAt?: string;
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

function normalizeCategory(
  category: string | null | undefined
) {
  return String(category || "")
    .trim()
    .toLowerCase();
}

function formatTime(seconds: number) {
  if (!Number.isFinite(seconds) || seconds < 0) {
    return "0:00";
  }

  const minutes = Math.floor(seconds / 60);
  const remaining = Math.floor(seconds % 60);

  return `${minutes}:${remaining
    .toString()
    .padStart(2, "0")}`;
}

export default function CategoryPage() {
  const params = useParams();

  const slug =
    typeof params.slug === "string"
      ? params.slug.toLowerCase()
      : "";

  const category = categoryData[slug];

  const audioRef =
    useRef<HTMLAudioElement | null>(null);

  const songsRef =
    useRef<Song[]>([]);

  const currentIndexRef =
    useRef(-1);

  const pendingPlayRef =
    useRef(false);

  const [songs, setSongs] =
    useState<Song[]>([]);

  const [currentIndex, setCurrentIndex] =
    useState(-1);

  const [isPlaying, setIsPlaying] =
    useState(false);

  const [volume, setVolume] =
    useState(0.8);

  const [currentTime, setCurrentTime] =
    useState(0);

  const [duration, setDuration] =
    useState(0);

  const [loading, setLoading] =
    useState(true);

  const [error, setError] =
    useState("");

  const currentSong =
    currentIndex >= 0 &&
    currentIndex < songs.length
      ? songs[currentIndex]
      : null;

  /*
   * ========================================
   * KEEP REFS IN SYNC
   * ========================================
   */

  useEffect(() => {
    songsRef.current = songs;
  }, [songs]);

  useEffect(() => {
    currentIndexRef.current =
      currentIndex;
  }, [currentIndex]);

  /*
   * ========================================
   * LOAD SONGS
   * ========================================
   */

  useEffect(() => {
    let cancelled = false;

    async function loadSongs() {
      try {
        setLoading(true);
        setError("");

        const response = await fetch(
          "/api/songs",
          {
            cache: "no-store",
          }
        );

        const text =
          await response.text();

        let data: {
          songs?: Song[];
          error?: string;
        } = {};

        try {
          data = text
            ? JSON.parse(text)
            : {};
        } catch {
          throw new Error(
            "Invalid server response from songs API."
          );
        }

        if (!response.ok) {
          throw new Error(
            data.error ||
              `Failed to load songs (${response.status}).`
          );
        }

        if (cancelled) {
          return;
        }

        const allSongs =
          Array.isArray(data.songs)
            ? data.songs
            : [];

        /*
         * Filter songs according to
         * current URL category.
         */

        const categorySongs =
          allSongs.filter(
            (song) =>
              normalizeCategory(
                song.category
              ) ===
              normalizeCategory(slug)
          );

        setSongs(categorySongs);
        songsRef.current =
          categorySongs;

        if (categorySongs.length > 0) {
          setCurrentIndex(0);
          currentIndexRef.current = 0;
        } else {
          setCurrentIndex(-1);
          currentIndexRef.current = -1;
        }
      } catch (error) {
        if (cancelled) {
          return;
        }

        console.error(
          "LOAD CATEGORY SONGS ERROR:",
          error
        );

        setError(
          error instanceof Error
            ? error.message
            : "Failed to load songs."
        );
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    if (category) {
      loadSongs();
    }

    return () => {
      cancelled = true;
    };
  }, [slug, category]);

  /*
   * ========================================
   * LOAD CURRENT AUDIO
   * ========================================
   */

  useEffect(() => {
    const audio =
      audioRef.current;

    if (!audio || !currentSong) {
      return;
    }

    audio.pause();

    setIsPlaying(false);
    setCurrentTime(0);
    setDuration(0);

    audio.volume = volume;

    const shouldPlay =
      pendingPlayRef.current;

    pendingPlayRef.current = false;

    const handleLoadedMetadata =
      () => {
        if (
          Number.isFinite(
            audio.duration
          )
        ) {
          setDuration(
            audio.duration
          );
        }
      };

    const handleCanPlay =
      async () => {
        if (!shouldPlay) {
          return;
        }

        try {
          await audio.play();

          setIsPlaying(true);
        } catch (error) {
          console.error(
            "CATEGORY PLAY ERROR:",
            error
          );

          setIsPlaying(false);
        }
      };

    audio.addEventListener(
      "loadedmetadata",
      handleLoadedMetadata
    );

    audio.addEventListener(
      "canplay",
      handleCanPlay,
      {
        once: true,
      }
    );

    audio.src =
      currentSong.audioUrl;

    audio.load();

    return () => {
      audio.removeEventListener(
        "loadedmetadata",
        handleLoadedMetadata
      );

      audio.removeEventListener(
        "canplay",
        handleCanPlay
      );
    };
  }, [
    currentSong?.id,
    currentSong?.audioUrl,
  ]);

  /*
   * ========================================
   * VOLUME
   * ========================================
   */

  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.volume =
        volume;
    }
  }, [volume]);

  /*
   * ========================================
   * PLAY / PAUSE
   * ========================================
   */

  async function togglePlay() {
    const audio =
      audioRef.current;

    if (!audio || !currentSong) {
      return;
    }

    if (audio.paused) {
      try {
        await audio.play();
        setIsPlaying(true);
      } catch (error) {
        console.error(
          "PLAY ERROR:",
          error
        );

        setIsPlaying(false);
      }
    } else {
      audio.pause();
      setIsPlaying(false);
    }
  }

  /*
   * ========================================
   * PLAY SELECTED SONG
   * ========================================
   */

  async function playSong(index: number) {
    if (
      index < 0 ||
      index >= songsRef.current.length
    ) {
      return;
    }

    /*
     * Same song:
     * toggle play/pause.
     */

    if (
      index ===
      currentIndexRef.current
    ) {
      await togglePlay();
      return;
    }

    /*
     * Tell audio effect to autoplay
     * after new source is loaded.
     */

    pendingPlayRef.current = true;

    setCurrentIndex(index);
    currentIndexRef.current =
      index;

    setCurrentTime(0);
    setDuration(0);
  }

  /*
   * ========================================
   * PREVIOUS SONG
   * ========================================
   */

  async function previousSong() {
    const allSongs =
      songsRef.current;

    if (!allSongs.length) {
      return;
    }

    const current =
      currentIndexRef.current;

    const newIndex =
      current <= 0
        ? allSongs.length - 1
        : current - 1;

    pendingPlayRef.current = true;

    setCurrentIndex(newIndex);
    currentIndexRef.current =
      newIndex;
  }

  /*
   * ========================================
   * NEXT SONG
   * ========================================
   */

  async function nextSong() {
    const allSongs =
      songsRef.current;

    if (!allSongs.length) {
      return;
    }

    const current =
      currentIndexRef.current;

    const newIndex =
      current >=
      allSongs.length - 1
        ? 0
        : current + 1;

    pendingPlayRef.current = true;

    setCurrentIndex(newIndex);
    currentIndexRef.current =
      newIndex;
  }

  /*
   * ========================================
   * AUDIO EVENTS
   * ========================================
   */

  function handleTimeUpdate() {
    const audio =
      audioRef.current;

    if (!audio) {
      return;
    }

    setCurrentTime(
      audio.currentTime
    );
  }

  function handleLoadedMetadata() {
    const audio =
      audioRef.current;

    if (
      audio &&
      Number.isFinite(
        audio.duration
      )
    ) {
      setDuration(
        audio.duration
      );
    }
  }

  function handlePlay() {
    setIsPlaying(true);
  }

  function handlePause() {
    setIsPlaying(false);
  }

  async function handleEnded() {
    setIsPlaying(false);

    await nextSong();
  }

  function handleAudioError() {
    const audio =
      audioRef.current;

    console.error(
      "CATEGORY AUDIO ERROR:",
      audio?.error
    );

    setIsPlaying(false);
  }

  /*
   * ========================================
   * SEEK
   * ========================================
   */

  function seekSong(
    event: React.ChangeEvent<HTMLInputElement>
  ) {
    const value =
      Number(event.target.value);

    const audio =
      audioRef.current;

    if (!audio) {
      return;
    }

    audio.currentTime =
      value;

    setCurrentTime(value);
  }

  /*
   * ========================================
   * VOLUME
   * ========================================
   */

  function changeVolume(
    value: number
  ) {
    const safeVolume =
      Math.min(
        1,
        Math.max(0, value)
      );

    setVolume(
      safeVolume
    );

    if (audioRef.current) {
      audioRef.current.volume =
        safeVolume;
    }
  }

  /*
   * ========================================
   * MUTE
   * ========================================
   */

  function toggleMute() {
    if (volume > 0) {
      changeVolume(0);
    } else {
      changeVolume(0.8);
    }
  }

  /*
   * ========================================
   * UNKNOWN CATEGORY
   * ========================================
   */

  if (!category) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#070707] px-5 text-white">
        <div className="text-center">
          <h1 className="text-3xl font-bold">
            Category not found
          </h1>

          <p className="mt-2 text-sm text-white/40">
            The requested music category
            does not exist.
          </p>

          <Link
            href="/"
            className="mt-5 inline-block rounded-full bg-white px-5 py-2 text-sm font-medium text-black transition hover:scale-105"
          >
            Back to Music Flow
          </Link>
        </div>
      </main>
    );
  }

  const progress =
    duration > 0
      ? Math.min(
          100,
          Math.max(
            0,
            (currentTime /
              duration) *
              100
          )
        )
      : 0;

  return (
    <main
      className="min-h-screen bg-[#070707] pb-32 text-white"
      style={{
        backgroundImage:
          category.background,
      }}
    >
      {/* ================================== */}
      {/* AUDIO */}
      {/* ================================== */}

      <audio
        ref={audioRef}
        preload="metadata"
        onTimeUpdate={
          handleTimeUpdate
        }
        onLoadedMetadata={
          handleLoadedMetadata
        }
        onPlay={handlePlay}
        onPause={handlePause}
        onEnded={handleEnded}
        onError={handleAudioError}
      />

      {/* ================================== */}
      {/* HEADER */}
      {/* ================================== */}

      <header className="fixed left-0 right-0 top-0 z-50 border-b border-white/10 bg-black/60 backdrop-blur-xl">
        <div className="mx-auto flex h-16 max-w-5xl items-center px-5">
          <Link
            href="/"
            className="flex items-center gap-2 text-sm text-white/60 transition hover:text-white"
          >
            <ArrowLeft
              size={18}
            />

            <span>
              Music Flow
            </span>
          </Link>

          <div className="ml-auto text-sm font-medium">
            {category.name}
          </div>
        </div>
      </header>

      {/* ================================== */}
      {/* HERO */}
      {/* ================================== */}

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

          {!loading &&
            !error && (
              <p className="mt-4 text-xs text-white/25">
                {songs.length}{" "}
                {songs.length === 1
                  ? "song"
                  : "songs"}{" "}
                available
              </p>
            )}
        </div>
      </section>

      {/* ================================== */}
      {/* SONGS */}
      {/* ================================== */}

      <section className="mx-auto max-w-3xl px-5 pb-10">
        {/* LOADING */}

        {loading && (
          <div className="space-y-2">
            {[
              1,
              2,
              3,
              4,
              5,
            ].map((item) => (
              <div
                key={item}
                className="h-[76px] animate-pulse rounded-2xl border border-white/5 bg-white/[0.03]"
              />
            ))}
          </div>
        )}

        {/* ERROR */}

        {!loading &&
          error && (
            <div className="rounded-2xl border border-red-500/20 bg-red-500/10 p-6 text-center">
              <p className="font-semibold text-red-300">
                Unable to load songs
              </p>

              <p className="mt-2 text-sm text-red-300/60">
                {error}
              </p>
            </div>
          )}

        {/* EMPTY */}

        {!loading &&
          !error &&
          songs.length === 0 && (
            <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-10 text-center">
              <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-white/[0.05] text-2xl">
                {category.emoji}
              </div>

              <p className="text-sm text-white/50">
                No songs available in this
                category yet.
              </p>

              <p className="mt-1 text-xs text-white/20">
                Songs added by the admin
                will appear here.
              </p>
            </div>
          )}

        {/* SONG LIST */}

        {!loading &&
          !error &&
          songs.length > 0 && (
            <div className="space-y-2">
              {songs.map(
                (song, index) => {
                  const active =
                    index ===
                    currentIndex;

                  return (
                    <button
                      key={song.id}
                      type="button"
                      onClick={() =>
                        playSong(index)
                      }
                      className={`group relative flex w-full items-center gap-4 overflow-hidden rounded-2xl border p-3 text-left transition-all duration-300 sm:p-4 ${
                        active
                          ? "border-purple-400/20 bg-white/[0.075] shadow-[0_10px_40px_rgba(168,85,247,0.08)]"
                          : "border-white/5 bg-white/[0.025] hover:border-white/10 hover:bg-white/[0.06]"
                      }`}
                    >
                      {/* ACTIVE GLOW */}

                      {active && (
                        <div className="pointer-events-none absolute inset-0 bg-gradient-to-r from-fuchsia-500/[0.05] via-purple-500/[0.02] to-cyan-500/[0.04]" />
                      )}

                      {/* COVER */}

                      <div className="relative h-12 w-12 shrink-0 overflow-hidden rounded-xl sm:h-14 sm:w-14">
                        {song.coverImage ? (
                          <img
                            src={
                              song.coverImage
                            }
                            alt={
                              song.title
                            }
                            className="h-full w-full object-cover transition duration-500 group-hover:scale-110"
                            loading="lazy"
                          />
                        ) : (
                          <div className="flex h-full w-full items-center justify-center bg-white/[0.05] text-xl">
                            🎵
                          </div>
                        )}

                        {active && (
                          <div className="absolute inset-0 flex items-center justify-center bg-black/45">
                            {isPlaying ? (
                              <div className="flex items-end gap-[2px]">
                                <span className="h-3 w-[2px] animate-pulse bg-fuchsia-300" />
                                <span className="h-5 w-[2px] animate-pulse bg-purple-300" />
                                <span className="h-4 w-[2px] animate-pulse bg-cyan-300" />
                              </div>
                            ) : (
                              <Play
                                size={15}
                                fill="currentColor"
                              />
                            )}
                          </div>
                        )}
                      </div>

                      {/* SONG INFO */}

                      <div className="relative min-w-0 flex-1">
                        <h2 className="truncate text-sm font-semibold sm:text-[15px]">
                          {song.title ||
                            "Unknown Song"}
                        </h2>

                        <p className="mt-1 truncate text-xs text-white/40">
                          {song.artist ||
                            "Unknown Artist"}
                        </p>
                      </div>

                      {/* DURATION */}

                      <span className="hidden text-[10px] text-white/20 sm:block">
                        {formatTime(
                          song.duration ??
                            0
                        )}
                      </span>

                      {/* PLAY BUTTON */}

                      <span className="relative flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-white/[0.055] text-white/60 transition group-hover:scale-105 group-hover:bg-purple-500/15 group-hover:text-white">
                        {active &&
                        isPlaying ? (
                          <Pause
                            size={14}
                            fill="currentColor"
                          />
                        ) : (
                          <Play
                            size={14}
                            fill="currentColor"
                          />
                        )}
                      </span>
                    </button>
                  );
                }
              )}
            </div>
          )}
      </section>

      {/* ================================== */}
      {/* PLAYER */}
      {/* ================================== */}

      {currentSong && (
        <div className="fixed bottom-0 left-0 right-0 z-50 border-t border-white/10 bg-black/85 shadow-[0_-15px_60px_rgba(0,0,0,0.6)] backdrop-blur-2xl">
          {/* PROGRESS */}

          <div className="absolute left-0 right-0 top-0 h-[2px] bg-white/[0.04]">
            <div
              className="h-full bg-gradient-to-r from-fuchsia-400 via-purple-400 to-cyan-400"
              style={{
                width: `${progress}%`,
              }}
            />
          </div>

          {/* PLAYER CONTENT */}

          <div className="mx-auto flex max-w-5xl items-center gap-2 px-3 pb-3 pt-4 sm:gap-4 sm:px-5">
            {/* COVER */}

            <div className="hidden h-11 w-11 shrink-0 overflow-hidden rounded-xl sm:block">
              {currentSong.coverImage ? (
                <img
                  src={
                    currentSong.coverImage
                  }
                  alt={
                    currentSong.title
                  }
                  className="h-full w-full object-cover"
                />
              ) : (
                <div className="flex h-full w-full items-center justify-center bg-white/[0.05]">
                  🎵
                </div>
              )}
            </div>

            {/* SONG INFO */}

            <div className="min-w-0 flex-1">
              <p className="truncate text-xs font-semibold sm:text-sm">
                {currentSong.title}
              </p>

              <p className="truncate text-[10px] text-white/30 sm:text-xs">
                {currentSong.artist}
              </p>
            </div>

            {/* PREVIOUS */}

            <button
              type="button"
              onClick={
                previousSong
              }
              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-white/45 transition hover:bg-white/10 hover:text-white sm:h-10 sm:w-10"
              aria-label="Previous song"
            >
              <ChevronLeft
                size={21}
              />
            </button>

            {/* PLAY / PAUSE */}

            <button
              type="button"
              onClick={
                togglePlay
              }
              className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-white text-black shadow-lg transition hover:scale-105 active:scale-95"
              aria-label={
                isPlaying
                  ? "Pause"
                  : "Play"
              }
            >
              {isPlaying ? (
                <Pause
                  size={18}
                  fill="currentColor"
                />
              ) : (
                <Play
                  size={18}
                  fill="currentColor"
                />
              )}
            </button>

            {/* NEXT */}

            <button
              type="button"
              onClick={nextSong}
              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-white/45 transition hover:bg-white/10 hover:text-white sm:h-10 sm:w-10"
              aria-label="Next song"
            >
              <ChevronRight
                size={21}
              />
            </button>

            {/* MOBILE MUTE */}

            <button
              type="button"
              onClick={
                toggleMute
              }
              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-white/40 transition hover:bg-white/10 hover:text-white sm:hidden"
              aria-label={
                volume === 0
                  ? "Unmute"
                  : "Mute"
              }
            >
              {volume === 0 ? (
                <VolumeX
                  size={17}
                />
              ) : (
                <Volume2
                  size={17}
                />
              )}
            </button>

            {/* DESKTOP VOLUME */}

            <div className="hidden items-center gap-2 sm:flex">
              <button
                type="button"
                onClick={
                  toggleMute
                }
                className="flex h-8 w-8 items-center justify-center text-white/40 transition hover:text-white"
                aria-label={
                  volume === 0
                    ? "Unmute"
                    : "Mute"
                }
              >
                {volume === 0 ? (
                  <VolumeX
                    size={16}
                  />
                ) : (
                  <Volume2
                    size={16}
                  />
                )}
              </button>

              <input
                type="range"
                min="0"
                max="1"
                step="0.01"
                value={volume}
                onChange={(event) =>
                  changeVolume(
                    Number(
                      event.target.value
                    )
                  )
                }
                className="w-20 cursor-pointer accent-purple-400"
                aria-label="Volume"
              />
            </div>

            {/* TIME */}

            <div className="hidden min-w-[80px] text-right text-[10px] tabular-nums text-white/25 md:block">
              {formatTime(
                currentTime
              )}{" "}
              /{" "}
              {formatTime(
                duration
              )}
            </div>
          </div>

          {/* MOBILE SEEK */}

          <div className="px-3 pb-2 sm:hidden">
            <input
              type="range"
              min="0"
              max={duration || 0}
              value={Math.min(
                currentTime,
                duration || 0
              )}
              onChange={
                seekSong
              }
              disabled={
                !duration
              }
              className="h-1.5 w-full cursor-pointer accent-purple-400 disabled:cursor-not-allowed"
              aria-label="Song progress"
            />

            <div className="mt-1 flex justify-between text-[9px] tabular-nums text-white/20">
              <span>
                {formatTime(
                  currentTime
                )}
              </span>

              <span>
                {formatTime(
                  duration
                )}
              </span>
            </div>
          </div>
        </div>
      )}

      {/* ================================== */}
      {/* DESKTOP SEEK */}
      {/* ================================== */}

      {currentSong && (
        <div className="fixed bottom-[67px] left-0 right-0 z-[49] hidden bg-black/40 px-4 py-1.5 backdrop-blur-md sm:block">
          <input
            type="range"
            min="0"
            max={duration || 0}
            value={Math.min(
              currentTime,
              duration || 0
            )}
            onChange={
              seekSong
            }
            disabled={!duration}
            className="h-1 w-full cursor-pointer accent-purple-400 disabled:cursor-not-allowed"
            aria-label="Song progress"
          />
        </div>
      )}
    </main>
  );
}