
"use client";

import {
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";

import Link from "next/link";

import {
  ArrowLeft,
  ChevronLeft,
  ChevronRight,
  Headphones,
  Music2,
  Pause,
  Play,
  Search,
  Volume2,
  VolumeX,
  X,
} from "lucide-react";

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

interface SavedPlayerState {
  songId: string;
  currentTime: number;
  volume: number;
  isPlaying: boolean;
}

const PLAYER_STORAGE_KEY = "musicflow-player-state";

const CATEGORIES = [
  {
    id: "all",
    name: "All",
  },
  {
    id: "rajasthani",
    name: "Rajasthani",
  },
  {
    id: "punjabi",
    name: "Punjabi",
  },
  {
    id: "haryanvi",
    name: "Haryanvi",
  },
  {
    id: "90s",
    name: "90s",
  },
];

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

function normalizeCategory(category: string | null | undefined) {
  return String(category || "")
    .trim()
    .toLowerCase();
}

function getSavedPlayerState(): SavedPlayerState | null {
  try {
    const saved = localStorage.getItem(
      PLAYER_STORAGE_KEY
    );

    if (!saved) {
      return null;
    }

    const parsed = JSON.parse(saved);

    if (
      !parsed ||
      typeof parsed.songId !== "string"
    ) {
      return null;
    }

    return {
      songId: parsed.songId,
      currentTime:
        typeof parsed.currentTime === "number" &&
        Number.isFinite(parsed.currentTime)
          ? Math.max(0, parsed.currentTime)
          : 0,
      volume:
        typeof parsed.volume === "number" &&
        Number.isFinite(parsed.volume)
          ? Math.min(
              1,
              Math.max(0, parsed.volume)
            )
          : 0.8,
      isPlaying: Boolean(parsed.isPlaying),
    };
  } catch (error) {
    console.error(
      "READ PLAYER STATE ERROR:",
      error
    );

    return null;
  }
}

export default function AllSongsPage() {
  const audioRef =
    useRef<HTMLAudioElement | null>(null);

  const audioRequestRef =
    useRef(0);

  const songsRef =
    useRef<Song[]>([]);

  const currentIndexRef =
    useRef(-1);

  const currentSongRef =
    useRef<Song | null>(null);

  const volumeRef =
    useRef(0.8);

  const isPlayingRef =
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

  const [search, setSearch] =
    useState("");

  const [activeCategory, setActiveCategory] =
    useState("all");

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

  useEffect(() => {
    currentSongRef.current =
      currentSong;
  }, [currentSong]);

  useEffect(() => {
    volumeRef.current =
      volume;
  }, [volume]);

  useEffect(() => {
    isPlayingRef.current =
      isPlaying;
  }, [isPlaying]);

  /*
   * ========================================
   * SAVE PLAYER STATE
   * ========================================
   */

  const savePlayerState = useCallback(
    (
      song: Song | null,
      time: number,
      playing: boolean,
      currentVolume: number
    ) => {
      if (!song) {
        return;
      }

      try {
        const safeTime =
          Number.isFinite(time)
            ? Math.max(0, time)
            : 0;

        const safeVolume =
          Number.isFinite(currentVolume)
            ? Math.min(
                1,
                Math.max(
                  0,
                  currentVolume
                )
              )
            : 0.8;

        const state: SavedPlayerState = {
          songId: song.id,
          currentTime: safeTime,
          volume: safeVolume,
          isPlaying: playing,
        };

        localStorage.setItem(
          PLAYER_STORAGE_KEY,
          JSON.stringify(state)
        );
      } catch (error) {
        console.error(
          "SAVE PLAYER STATE ERROR:",
          error
        );
      }
    },
    []
  );

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

        const loadedSongs =
          Array.isArray(data.songs)
            ? data.songs
            : [];

        setSongs(loadedSongs);

        songsRef.current =
          loadedSongs;

        /*
         * Restore previous player state.
         */

        const savedState =
          getSavedPlayerState();

        if (loadedSongs.length === 0) {
          setCurrentIndex(-1);
          currentIndexRef.current = -1;
          return;
        }

        if (savedState) {
          const savedIndex =
            loadedSongs.findIndex(
              (song) =>
                song.id ===
                savedState.songId
            );

          if (savedIndex >= 0) {
            setCurrentIndex(
              savedIndex
            );

            currentIndexRef.current =
              savedIndex;

            setVolume(
              savedState.volume
            );

            volumeRef.current =
              savedState.volume;
          } else {
            setCurrentIndex(0);
            currentIndexRef.current = 0;
          }
        } else {
          setCurrentIndex(0);
          currentIndexRef.current = 0;
        }
      } catch (error) {
        if (cancelled) {
          return;
        }

        console.error(
          "LOAD ALL SONGS ERROR:",
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

    loadSongs();

    return () => {
      cancelled = true;
    };
  }, []);

  /*
   * ========================================
   * FILTERED SONGS
   * ========================================
   */

  const filteredSongs =
    songs.filter((song) => {
      const category =
        normalizeCategory(
          song.category
        );

      const matchesCategory =
        activeCategory === "all" ||
        category ===
          normalizeCategory(
            activeCategory
          );

      const query =
        search.trim().toLowerCase();

      const searchableText =
        `${song.title || ""} ${
          song.artist || ""
        } ${song.category || ""}`.toLowerCase();

      const matchesSearch =
        !query ||
        searchableText.includes(query);

      return (
        matchesCategory &&
        matchesSearch
      );
    });

  /*
   * ========================================
   * LOAD CURRENT AUDIO
   *
   * Important:
   * Audio source is controlled from
   * ONE place only.
   * ========================================
   */

  useEffect(() => {
    const audio =
      audioRef.current;

    if (!audio || !currentSong) {
      return;
    }

    const requestId =
      ++audioRequestRef.current;

    audio.pause();

    setIsPlaying(false);
    isPlayingRef.current = false;

    setCurrentTime(0);
    setDuration(0);

    const savedState =
      getSavedPlayerState();

    const shouldRestoreTime =
      savedState?.songId ===
      currentSong.id;

    const restoreTime =
      shouldRestoreTime
        ? savedState?.currentTime ?? 0
        : 0;

    const restorePlaying =
      shouldRestoreTime
        ? Boolean(
            savedState?.isPlaying
          )
        : false;

    audio.volume =
      volumeRef.current;

    audio.src =
      currentSong.audioUrl;

    audio.load();

    const handleMetadata =
      () => {
        if (
          requestId !==
          audioRequestRef.current
        ) {
          return;
        }

        const audioDuration =
          Number.isFinite(
            audio.duration
          )
            ? audio.duration
            : 0;

        setDuration(
          audioDuration
        );

        if (
          Number.isFinite(
            restoreTime
          ) &&
          restoreTime > 0 &&
          audioDuration > 0 &&
          restoreTime <
            audioDuration
        ) {
          try {
            audio.currentTime =
              restoreTime;

            setCurrentTime(
              restoreTime
            );
          } catch (error) {
            console.error(
              "RESTORE TIME ERROR:",
              error
            );
          }
        }

        /*
         * We intentionally do NOT autoplay
         * a previously playing song when the
         * page is first opened.
         *
         * The user must press Play.
         */

        void restorePlaying;
      };

    const handleDurationChange =
      () => {
        if (
          requestId !==
          audioRequestRef.current
        ) {
          return;
        }

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

    audio.addEventListener(
      "loadedmetadata",
      handleMetadata
    );

    audio.addEventListener(
      "durationchange",
      handleDurationChange
    );

    return () => {
      audio.removeEventListener(
        "loadedmetadata",
        handleMetadata
      );

      audio.removeEventListener(
        "durationchange",
        handleDurationChange
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

      volumeRef.current =
        volume;
    }
  }, [volume]);

  /*
   * ========================================
   * AUTO SAVE
   * ========================================
   */

  useEffect(() => {
    if (!currentSong) {
      return;
    }

    const interval =
      window.setInterval(() => {
        const audio =
          audioRef.current;

        savePlayerState(
          currentSongRef.current,
          audio?.currentTime ??
            currentTime,
          isPlayingRef.current,
          volumeRef.current
        );
      }, 1000);

    return () => {
      window.clearInterval(
        interval
      );
    };
  }, [
    currentSong?.id,
    currentTime,
    savePlayerState,
  ]);

  /*
   * ========================================
   * SAVE BEFORE LEAVING
   * ========================================
   */

  useEffect(() => {
    const handleBeforeUnload =
      () => {
        const audio =
          audioRef.current;

        savePlayerState(
          currentSongRef.current,
          audio?.currentTime ??
            0,
          isPlayingRef.current,
          volumeRef.current
        );
      };

    window.addEventListener(
      "beforeunload",
      handleBeforeUnload
    );

    return () => {
      window.removeEventListener(
        "beforeunload",
        handleBeforeUnload
      );
    };
  }, [savePlayerState]);

  /*
   * ========================================
   * PLAY / PAUSE
   * ========================================
   */

  async function togglePlay() {
    const audio =
      audioRef.current;

    const song =
      currentSongRef.current;

    if (!audio || !song) {
      return;
    }

    if (!audio.src) {
      return;
    }

    if (
      !audio.paused
    ) {
      audio.pause();

      setIsPlaying(false);
      isPlayingRef.current =
        false;

      savePlayerState(
        song,
        audio.currentTime,
        false,
        volumeRef.current
      );

      return;
    }

    try {
      await audio.play();

      setIsPlaying(true);
      isPlayingRef.current =
        true;

      savePlayerState(
        song,
        audio.currentTime,
        true,
        volumeRef.current
      );
    } catch (error) {
      console.error(
        "PLAY ERROR:",
        error
      );

      setIsPlaying(false);
      isPlayingRef.current =
        false;
    }
  }

  /*
   * ========================================
   * PLAY SONG
   * ========================================
   */

  async function playSong(
    index: number
  ) {
    const allSongs =
      songsRef.current;

    if (
      index < 0 ||
      index >= allSongs.length
    ) {
      return;
    }

    const selectedSong =
      allSongs[index];

    const audio =
      audioRef.current;

    if (!audio) {
      return;
    }

    /*
     * Same song:
     * simply toggle play/pause.
     */

    if (
      index ===
      currentIndexRef.current
    ) {
      await togglePlay();
      return;
    }

    /*
     * Save previous song.
     */

    const previousSong =
      currentSongRef.current;

    if (previousSong) {
      savePlayerState(
        previousSong,
        audio.currentTime,
        false,
        volumeRef.current
      );
    }

    /*
     * Change React state.
     *
     * The useEffect below will load
     * the new audio source.
     */

    setCurrentIndex(index);

    currentIndexRef.current =
      index;

    setCurrentTime(0);
    setDuration(0);

    /*
     * Wait until React has applied the
     * new current song and audio source.
     */

    await new Promise<void>(
      (resolve) => {
        window.setTimeout(
          resolve,
          0
        );
      }
    );

    const latestAudio =
      audioRef.current;

    if (!latestAudio) {
      return;
    }

    try {
      /*
       * If metadata is already available,
       * play immediately.
       */

      if (
        latestAudio.readyState >=
        HTMLMediaElement.HAVE_FUTURE_DATA
      ) {
        await latestAudio.play();

        setIsPlaying(true);
        isPlayingRef.current =
          true;

        savePlayerState(
          selectedSong,
          latestAudio.currentTime,
          true,
          volumeRef.current
        );

        return;
      }

      /*
       * Otherwise wait for canplay.
       */

      await new Promise<void>(
        (resolve, reject) => {
          let finished = false;

          const cleanup =
            () => {
              latestAudio.removeEventListener(
                "canplay",
                handleCanPlay
              );

              latestAudio.removeEventListener(
                "error",
                handleError
              );
            };

          const handleCanPlay =
            () => {
              if (finished) {
                return;
              }

              finished = true;
              cleanup();

              resolve();
            };

          const handleError =
            () => {
              if (finished) {
                return;
              }

              finished = true;
              cleanup();

              reject(
                new Error(
                  "Unable to load this audio."
                )
              );
            };

          latestAudio.addEventListener(
            "canplay",
            handleCanPlay,
            {
              once: true,
            }
          );

          latestAudio.addEventListener(
            "error",
            handleError,
            {
              once: true,
            }
          );
        }
      );

      await latestAudio.play();

      setIsPlaying(true);
      isPlayingRef.current =
        true;

      savePlayerState(
        selectedSong,
        latestAudio.currentTime,
        true,
        volumeRef.current
      );
    } catch (error) {
      console.error(
        "SONG PLAY ERROR:",
        error
      );

      setIsPlaying(false);
      isPlayingRef.current =
        false;

      savePlayerState(
        selectedSong,
        latestAudio.currentTime ||
          0,
        false,
        volumeRef.current
      );
    }
  }

  /*
   * ========================================
   * PREVIOUS
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

    await playSong(newIndex);
  }

  /*
   * ========================================
   * NEXT
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

    await playSong(newIndex);
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

    if (!audio) {
      return;
    }

    if (
      Number.isFinite(
        audio.duration
      )
    ) {
      setDuration(
        audio.duration
      );
    }
  }

  function handleDurationChange() {
    const audio =
      audioRef.current;

    if (
      !audio ||
      !Number.isFinite(
        audio.duration
      )
    ) {
      return;
    }

    setDuration(
      audio.duration
    );
  }

  async function handleEnded() {
    setIsPlaying(false);
    isPlayingRef.current =
      false;

    await nextSong();
  }

  function handlePlay() {
    setIsPlaying(true);
    isPlayingRef.current =
      true;

    if (currentSongRef.current) {
      savePlayerState(
        currentSongRef.current,
        audioRef.current
          ?.currentTime ?? 0,
        true,
        volumeRef.current
      );
    }
  }

  function handlePause() {
    setIsPlaying(false);
    isPlayingRef.current =
      false;

    if (currentSongRef.current) {
      savePlayerState(
        currentSongRef.current,
        audioRef.current
          ?.currentTime ?? 0,
        false,
        volumeRef.current
      );
    }
  }

  function handleAudioError() {
    const audio =
      audioRef.current;

    if (!audio) {
      return;
    }

    console.error(
      "AUDIO ERROR:",
      audio.error
    );

    setIsPlaying(false);
    isPlayingRef.current =
      false;
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

    if (
      !audio ||
      !Number.isFinite(value)
    ) {
      return;
    }

    audio.currentTime =
      value;

    setCurrentTime(value);

    if (currentSongRef.current) {
      savePlayerState(
        currentSongRef.current,
        value,
        isPlayingRef.current,
        volumeRef.current
      );
    }
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
        Math.max(
          0,
          value
        )
      );

    setVolume(
      safeVolume
    );

    volumeRef.current =
      safeVolume;

    if (audioRef.current) {
      audioRef.current.volume =
        safeVolume;
    }

    if (currentSongRef.current) {
      savePlayerState(
        currentSongRef.current,
        audioRef.current
          ?.currentTime ?? 0,
        isPlayingRef.current,
        safeVolume
      );
    }
  }

  /*
   * ========================================
   * MUTE
   * ========================================
   */

  function toggleMute() {
    if (volumeRef.current > 0) {
      changeVolume(0);
    } else {
      changeVolume(0.8);
    }
  }

  /*
   * ========================================
   * CLEAR SEARCH
   * ========================================
   */

  function clearSearch() {
    setSearch("");
  }

  /*
   * ========================================
   * BACK TO HOME
   * ========================================
   */

  function handleBackToHome() {
    savePlayerState(
      currentSongRef.current,
      audioRef.current
        ?.currentTime ?? 0,
      isPlayingRef.current,
      volumeRef.current
    );
  }

  /*
   * ========================================
   * PLAYER PROGRESS %
   * ========================================
   */

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

  /*
   * ========================================
   * UI
   * ========================================
   */

  return (
    <main className="relative min-h-screen overflow-x-hidden bg-[#030305] pb-36 text-white selection:bg-fuchsia-400 selection:text-black">

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
        onDurationChange={
          handleDurationChange
        }
        onEnded={
          handleEnded
        }
        onPlay={
          handlePlay
        }
        onPause={
          handlePause
        }
        onError={
          handleAudioError
        }
      />

      {/* ================================== */}
      {/* BACKGROUND */}
      {/* ================================== */}

      <div className="pointer-events-none fixed inset-0 overflow-hidden">

        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_-10%,rgba(168,85,247,0.16),transparent_38%),radial-gradient(circle_at_100%_50%,rgba(6,182,212,0.10),transparent_35%),radial-gradient(circle_at_0%_70%,rgba(236,72,153,0.08),transparent_35%)]" />

        <div className="absolute left-[-180px] top-[15%] h-[420px] w-[420px] rounded-full bg-purple-600/15 blur-[130px]" />

        <div className="absolute right-[-180px] top-[35%] h-[480px] w-[480px] rounded-full bg-cyan-500/10 blur-[140px]" />

        <div className="absolute bottom-[-180px] left-[30%] h-[450px] w-[450px] rounded-full bg-pink-500/10 blur-[140px]" />

        <div className="absolute inset-0 opacity-[0.025] [background-image:linear-gradient(rgba(255,255,255,.5)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,.5)_1px,transparent_1px)] [background-size:55px_55px]" />

      </div>

      {/* ================================== */}
      {/* HEADER */}
      {/* ================================== */}

      <header className="sticky top-0 z-40 border-b border-white/[0.08] bg-black/60 backdrop-blur-2xl">

        <div className="mx-auto flex max-w-6xl items-center gap-3 px-4 py-3.5 sm:gap-4 sm:px-6 sm:py-4">

          <Link
            href="/"
            onClick={
              handleBackToHome
            }
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-white/10 bg-white/[0.04] text-white/60 transition hover:border-purple-400/30 hover:bg-purple-500/10 hover:text-white"
            aria-label="Back to home"
          >
            <ArrowLeft
              size={18}
            />
          </Link>

          <div className="flex min-w-0 items-center gap-3">

            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-fuchsia-500 via-purple-500 to-cyan-400 shadow-[0_0_30px_rgba(168,85,247,0.18)]">

              <Music2
                size={19}
              />

            </div>

            <div className="min-w-0">

              <h1 className="text-lg font-black sm:text-xl">

                <span className="bg-gradient-to-r from-fuchsia-400 via-purple-400 to-cyan-400 bg-clip-text text-transparent">
                  All Songs
                </span>

              </h1>

              <p className="hidden text-[9px] uppercase tracking-[0.22em] text-white/25 sm:block">
                Music Flow Library
              </p>

            </div>

          </div>

          <div className="ml-auto shrink-0 text-[10px] text-white/25 sm:text-xs">
            {songs.length}{" "}
            {songs.length === 1
              ? "song"
              : "songs"}
          </div>

        </div>

      </header>

      {/* ================================== */}
      {/* MAIN */}
      {/* ================================== */}

      <div className="relative z-10 mx-auto max-w-6xl px-4 pb-12 pt-7 sm:px-6 sm:pt-10">

        {/* TITLE */}

        <section className="mb-6">

          <p className="text-[9px] font-semibold uppercase tracking-[0.25em] text-purple-300/50">
            Complete Library
          </p>

          <h2 className="mt-1 text-3xl font-black tracking-tight sm:text-4xl">
            All Songs
          </h2>

          <p className="mt-2 text-sm text-white/30">
            Explore every song available
            on Music Flow.
          </p>

        </section>

        {/* ================================== */}
        {/* SEARCH */}
        {/* ================================== */}

        <div className="relative mb-5">

          <Search
            size={18}
            className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-white/25"
          />

          <input
            type="search"
            value={search}
            onChange={(event) =>
              setSearch(
                event.target.value
              )
            }
            placeholder="Search songs, artists..."
            className="block h-14 w-full rounded-2xl border border-white/10 bg-white/[0.045] py-4 pl-11 pr-12 text-sm text-white outline-none transition focus:border-purple-400/30 focus:bg-white/[0.07] placeholder:text-white/20"
            aria-label="Search songs"
          />

          {search && (
            <button
              type="button"
              onClick={
                clearSearch
              }
              className="absolute right-3 top-1/2 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-full bg-white/[0.06] text-white/40 transition hover:bg-white/10 hover:text-white"
              aria-label="Clear search"
            >
              <X size={15} />
            </button>
          )}

        </div>

        {/* ================================== */}
        {/* CATEGORIES */}
        {/* ================================== */}

        <div className="mb-7 flex gap-2 overflow-x-auto pb-2 scrollbar-none">

          {CATEGORIES.map(
            (category) => {
              const active =
                activeCategory ===
                category.id;

              return (
                <button
                  key={
                    category.id
                  }
                  type="button"
                  onClick={() =>
                    setActiveCategory(
                      category.id
                    )
                  }
                  className={`shrink-0 rounded-full border px-4 py-2.5 text-xs font-medium transition ${
                    active
                      ? "border-transparent bg-gradient-to-r from-fuchsia-500 via-purple-500 to-cyan-500 text-white shadow-[0_5px_25px_rgba(168,85,247,0.18)]"
                      : "border-white/10 bg-white/[0.035] text-white/40 hover:border-white/20 hover:bg-white/[0.07] hover:text-white"
                  }`}
                >
                  {category.name}
                </button>
              );
            }
          )}

        </div>

        {/* ================================== */}
        {/* LOADING */}
        {/* ================================== */}

        {loading && (
          <div className="space-y-2">

            {[
              1,
              2,
              3,
              4,
              5,
              6,
            ].map(
              (item) => (
                <div
                  key={item}
                  className="h-[72px] animate-pulse rounded-2xl border border-white/5 bg-white/[0.03]"
                />
              )
            )}

          </div>
        )}

        {/* ================================== */}
        {/* ERROR */}
        {/* ================================== */}

        {!loading &&
          error && (
            <div className="rounded-2xl border border-red-500/20 bg-red-500/10 p-6 text-sm text-red-300">

              <p className="font-semibold">
                Unable to load songs
              </p>

              <p className="mt-1 text-red-300/70">
                {error}
              </p>

            </div>
          )}

        {/* ================================== */}
        {/* EMPTY */}
        {/* ================================== */}

        {!loading &&
          !error &&
          filteredSongs.length ===
            0 && (
            <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-10 text-center sm:p-12">

              <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-white/[0.05]">

                <Headphones
                  size={24}
                  className="text-white/20"
                />

              </div>

              <p className="text-sm text-white/45">
                No songs found.
              </p>

              <p className="mt-1 text-xs text-white/20">
                Try another search or category.
              </p>

            </div>
          )}

        {/* ================================== */}
        {/* SONG LIST */}
        {/* ================================== */}

        {!loading &&
          !error &&
          filteredSongs.length >
            0 && (
            <section>

              <div className="mb-3 flex items-center justify-between">

                <p className="text-[10px] uppercase tracking-[0.2em] text-white/20">
                  Songs
                </p>

                <p className="text-[10px] text-white/20">
                  {filteredSongs.length}{" "}
                  {filteredSongs.length ===
                  1
                    ? "song"
                    : "songs"}
                </p>

              </div>

              <div className="space-y-2">

                {filteredSongs.map(
                  (song) => {
                    const originalIndex =
                      songs.findIndex(
                        (item) =>
                          item.id ===
                          song.id
                      );

                    const active =
                      originalIndex ===
                      currentIndex;

                    return (
                      <button
                        key={
                          song.id
                        }
                        type="button"
                        onClick={() =>
                          playSong(
                            originalIndex
                          )
                        }
                        className={`group relative flex w-full items-center gap-3 overflow-hidden rounded-2xl border p-2.5 text-left transition-all duration-300 sm:gap-4 sm:p-3 ${
                          active
                            ? "border-purple-400/20 bg-white/[0.075] shadow-[0_10px_40px_rgba(168,85,247,0.08)]"
                            : "border-white/[0.07] bg-white/[0.025] hover:-translate-y-0.5 hover:border-purple-400/15 hover:bg-white/[0.055]"
                        }`}
                      >

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
                              className={`h-full w-full object-cover transition duration-500 ${
                                active
                                  ? "scale-105"
                                  : "group-hover:scale-110"
                              }`}
                              loading="lazy"
                            />
                          ) : (
                            <div className="flex h-full w-full items-center justify-center bg-white/[0.05]">
                              <Music2
                                size={
                                  20
                                }
                                className="text-white/20"
                              />
                            </div>
                          )}

                          {active && (
                            <div className="absolute inset-0 flex items-center justify-center bg-black/40">

                              {isPlaying ? (
                                <div className="flex items-end gap-[2px]">

                                  <span className="h-3 w-[2px] animate-pulse bg-fuchsia-300" />

                                  <span className="h-5 w-[2px] animate-pulse bg-purple-300" />

                                  <span className="h-4 w-[2px] animate-pulse bg-cyan-300" />

                                </div>
                              ) : (
                                <Play
                                  size={
                                    15
                                  }
                                  fill="currentColor"
                                />
                              )}

                            </div>
                          )}

                        </div>

                        {/* INFO */}

                        <div className="relative min-w-0 flex-1">

                          <h3 className="truncate text-sm font-semibold sm:text-[15px]">
                            {song.title ||
                              "Unknown Song"}
                          </h3>

                          <p className="mt-0.5 truncate text-xs text-white/30 sm:text-sm">
                            {song.artist ||
                              "Unknown Artist"}
                          </p>

                        </div>

                        {/* CATEGORY */}

                        <span className="hidden max-w-[120px] truncate rounded-full bg-white/[0.04] px-3 py-1 text-[9px] uppercase tracking-wider text-white/25 md:block">
                          {song.category ||
                            "Music"}
                        </span>

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
                              size={
                                14
                              }
                              fill="currentColor"
                            />
                          ) : (
                            <Play
                              size={
                                14
                              }
                              fill="currentColor"
                            />
                          )}

                        </span>

                      </button>
                    );
                  }
                )}

              </div>

            </section>
          )}

      </div>

      {/* ================================== */}
      {/* BOTTOM PLAYER */}
      {/* ================================== */}

      {currentSong && (
        <div className="fixed bottom-0 left-0 right-0 z-50 border-t border-white/[0.08] bg-black/85 shadow-[0_-15px_60px_rgba(0,0,0,0.6)] backdrop-blur-2xl">

          {/* PROGRESS TOP */}

          <div className="absolute left-0 right-0 top-0 h-[2px] bg-white/[0.04]">

            <div
              className="h-full bg-gradient-to-r from-fuchsia-400 via-purple-400 to-cyan-400 transition-[width] duration-200"
              style={{
                width: `${progress}%`,
              }}
            />

          </div>

          {/* MAIN PLAYER */}

          <div className="mx-auto flex max-w-7xl flex-wrap items-center gap-2 px-3 pb-2.5 pt-3 sm:gap-3 sm:px-5 sm:pb-3">

            {/* COVER */}

            <div className="relative h-10 w-10 shrink-0 overflow-hidden rounded-xl sm:h-11 sm:w-11">

              {currentSong.coverImage ? (
                <img
                  src={
                    currentSong.coverImage
                  }
                  alt={
                    currentSong.title
                  }
                  className={`h-full w-full object-cover transition ${
                    isPlaying
                      ? "scale-110"
                      : ""
                  }`}
                />
              ) : (
                <div className="flex h-full w-full items-center justify-center bg-white/[0.05]">
                  <Music2
                    size={18}
                    className="text-white/20"
                  />
                </div>
              )}

            </div>

            {/* INFO */}

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
              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-white/45 transition hover:bg-purple-500/10 hover:text-white sm:h-10 sm:w-10"
              aria-label="Previous song"
            >
              <ChevronLeft
                size={20}
              />
            </button>

            {/* PLAY */}

            <button
              type="button"
              onClick={
                togglePlay
              }
              className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-gradient-to-r from-fuchsia-400 via-purple-400 to-cyan-400 text-black shadow-[0_4px_30px_rgba(168,85,247,0.22)] transition hover:scale-110 active:scale-95 sm:h-11 sm:w-11"
              aria-label={
                isPlaying
                  ? "Pause"
                  : "Play"
              }
            >
              {isPlaying ? (
                <Pause
                  size={17}
                  fill="currentColor"
                />
              ) : (
                <Play
                  size={17}
                  fill="currentColor"
                />
              )}
            </button>

            {/* NEXT */}

            <button
              type="button"
              onClick={
                nextSong
              }
              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-white/45 transition hover:bg-cyan-500/10 hover:text-white sm:h-10 sm:w-10"
              aria-label="Next song"
            >
              <ChevronRight
                size={20}
              />
            </button>

            {/* MOBILE MUTE */}

            <button
              type="button"
              onClick={
                toggleMute
              }
              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-white/40 transition hover:bg-white/[0.06] hover:text-white md:hidden"
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

            <div className="hidden items-center gap-2 md:flex">

              <button
                type="button"
                onClick={
                  toggleMute
                }
                className="flex h-8 w-8 items-center justify-center text-white/35 transition hover:text-white"
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
                      event.target
                        .value
                    )
                  )
                }
                className="w-20 cursor-pointer accent-purple-400"
                aria-label="Volume"
              />

            </div>

            {/* TIME */}

            <div className="hidden min-w-[80px] text-right text-[10px] tabular-nums text-white/25 lg:block">
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
              className="h-1.5 w-full cursor-pointer appearance-none rounded-full accent-purple-400 disabled:cursor-not-allowed"
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
      {/* DESKTOP SEEK BAR */}
      {/* ================================== */}

      {currentSong && (
        <div className="fixed bottom-[69px] left-0 right-0 z-[49] hidden bg-black/40 px-4 py-1.5 backdrop-blur-md sm:block">

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
            className="h-1 w-full cursor-pointer appearance-none rounded-full accent-purple-400 disabled:cursor-not-allowed"
            aria-label="Song progress"
          />

        </div>
      )}

      {/* ================================== */}
      {/* RANGE STYLE */}
      {/* ================================== */}
{/* 
      <style jsx global>{`
        .scrollbar-none {
          scrollbar-width: none;
        }

        .scrollbar-none::-webkit-scrollbar {
          display: none;
        }

        input[type="range"] {
          accent-color: #a855f7;
        }

        input[type="range"]::-webkit-slider-runnable-track {
          height: 4px;
          border-radius: 999px;
          background: rgba(
            255,
            255,
            255,
            0.08
          );
        }

        input[type="range"]::-webkit-slider-thumb {
          appearance: none;
          width: 12px;
          height: 12px;
          margin-top: -4px;
          border-radius: 999px;
          background: linear-gradient(
            135deg,
            #e879f9,
            #a78bfa,
            #22d3ee
          );
          cursor: pointer;
          box-shadow:
            0 0 15px
            rgba(
              168,
              85,
              247,
              0.5
            );
        }

        input[type="range"]::-moz-range-track {
          height: 4px;
          border-radius: 999px;
          background: rgba(
            255,
            255,
            255,
            0.08
          );
        }

        input[type="range"]::-moz-range-thumb {
          width: 12px;
          height: 12px;
          border: none;
          border-radius: 999px;
          background: #a855f7;
          cursor: pointer;
        }

        input[type="search"]::-webkit-search-cancel-button {
          appearance: none;
        }
      `}</style> */}

    </main>
  );
}

