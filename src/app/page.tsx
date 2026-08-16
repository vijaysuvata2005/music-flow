"use client";

import {
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

import Link from "next/link";

import {
  ChevronLeft,
  ChevronRight,
  Headphones,
  Music2,
  Pause,
  Play,
  Search,
  Sparkles,
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
}

interface SiteSettings {
  siteName: string;
  instagramUrl: string;
}

interface SavedPlayerState {
  songId: string | null;
  currentTime: number;
  isPlaying: boolean;
  volume: number;
}

function InstagramIcon({
  size = 16,
  className = "",
}: {
  size?: number;
  className?: string;
}) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-hidden="true"
    >
      <rect
        x="3"
        y="3"
        width="18"
        height="18"
        rx="5"
        stroke="currentColor"
        strokeWidth="2"
      />

      <circle
        cx="12"
        cy="12"
        r="4"
        stroke="currentColor"
        strokeWidth="2"
      />

      <circle
        cx="17.5"
        cy="6.5"
        r="1"
        fill="currentColor"
      />
    </svg>
  );
}

const categories = [
  {
    id: "all",
    name: "All Songs",
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

const STORAGE_KEY = "musicflow-player-state";
const SCROLL_KEY = "musicflow-home-scroll";

function formatTime(seconds: number) {
  if (!Number.isFinite(seconds) || seconds <= 0) {
    return "0:00";
  }

  const minutes = Math.floor(seconds / 60);
  const remaining = Math.floor(seconds % 60);

  return `${minutes}:${remaining
    .toString()
    .padStart(2, "0")}`;
}

function getSavedPlayerState(): SavedPlayerState {
  if (typeof window === "undefined") {
    return {
      songId: null,
      currentTime: 0,
      isPlaying: false,
      volume: 0.8,
    };
  }

  try {
    const saved = sessionStorage.getItem(
      STORAGE_KEY
    );

    if (!saved) {
      return {
        songId: null,
        currentTime: 0,
        isPlaying: false,
        volume: 0.8,
      };
    }

    const parsed = JSON.parse(saved);

    return {
      songId:
        typeof parsed.songId === "string"
          ? parsed.songId
          : null,

      currentTime:
        typeof parsed.currentTime === "number" &&
        Number.isFinite(parsed.currentTime)
          ? Math.max(0, parsed.currentTime)
          : 0,

      isPlaying:
        typeof parsed.isPlaying === "boolean"
          ? parsed.isPlaying
          : false,

      volume:
        typeof parsed.volume === "number" &&
        Number.isFinite(parsed.volume)
          ? Math.min(
              1,
              Math.max(0, parsed.volume)
            )
          : 0.8,
    };
  } catch {
    return {
      songId: null,
      currentTime: 0,
      isPlaying: false,
      volume: 0.8,
    };
  }
}

export default function Home() {
  const audioRef = useRef<HTMLAudioElement | null>(
    null
  );

  const playRequestId = useRef(0);

  const shouldPlayRef =
    useRef(false);

  const restoredTimeRef =
    useRef(0);

  const hasRestoredAudioRef =
    useRef(false);

  const currentSongIdRef =
    useRef<string | null>(null);

  const saveTimerRef =
    useRef<ReturnType<typeof setTimeout> | null>(
      null
    );

  const lastSavedTimeRef =
    useRef(0);

  const [songs, setSongs] = useState<Song[]>(
    []
  );

  const [currentIndex, setCurrentIndex] =
    useState(0);

  const [isPlaying, setIsPlaying] =
    useState(false);

  const [volume, setVolume] =
    useState(0.8);

  const [currentTime, setCurrentTime] =
    useState(0);

  const [duration, setDuration] =
    useState(0);

  const [activeCategory, setActiveCategory] =
    useState("all");

  const [search, setSearch] =
    useState("");

  const [loading, setLoading] =
    useState(true);

  const [error, setError] =
    useState("");

  const [settings, setSettings] =
    useState<SiteSettings>({
      siteName: "Music Flow",
      instagramUrl:
        "https://www.instagram.com/vjy.cyber/",
    });

  const currentSong =
    songs[currentIndex];

  /*
   * =========================================
   * KEEP CURRENT SONG ID IN REF
   * =========================================
   */

  useEffect(() => {
    currentSongIdRef.current =
      currentSong?.id ?? null;
  }, [currentSong?.id]);

  /*
   * =========================================
   * SAVE PLAYER STATE
   * =========================================
   */

  function savePlayerState(
    overrides?: Partial<SavedPlayerState>
  ) {
    if (
      typeof window === "undefined"
    ) {
      return;
    }

    try {
      const audio =
        audioRef.current;

      const state: SavedPlayerState = {
        songId:
          overrides?.songId ??
          currentSongIdRef.current,

        currentTime:
          overrides?.currentTime ??
          (audio?.currentTime ??
            currentTime),

        isPlaying:
          overrides?.isPlaying ??
          (audio
            ? !audio.paused
            : isPlaying),

        volume:
          overrides?.volume ??
          volume,
      };

      sessionStorage.setItem(
        STORAGE_KEY,
        JSON.stringify(state)
      );

      lastSavedTimeRef.current =
        state.currentTime;
    } catch (err) {
      console.error(
        "SAVE PLAYER STATE ERROR:",
        err
      );
    }
  }

  /*
   * =========================================
   * SAVE PLAYER STATE ON PAGE HIDE
   * =========================================
   */

  useEffect(() => {
    function handlePageHide() {
      savePlayerState();
    }

    window.addEventListener(
      "pagehide",
      handlePageHide
    );

    return () => {
      window.removeEventListener(
        "pagehide",
        handlePageHide
      );
    };
  }, [currentTime, isPlaying, volume]);

  /*
   * =========================================
   * PERIODIC PLAYER STATE SAVE
   * =========================================
   */

  useEffect(() => {
    if (!currentSong) return;

    if (
      saveTimerRef.current
    ) {
      clearTimeout(
        saveTimerRef.current
      );
    }

    saveTimerRef.current =
      setTimeout(() => {
        savePlayerState();
      }, 300);

    return () => {
      if (
        saveTimerRef.current
      ) {
        clearTimeout(
          saveTimerRef.current
        );
      }
    };
  }, [
    currentSong?.id,
    currentTime,
    isPlaying,
    volume,
  ]);

  /*
   * =========================================
   * LOAD SONGS
   * =========================================
   */

  useEffect(() => {
    let cancelled = false;

    async function loadSongs() {
      try {
        setLoading(true);
        setError("");

        const response =
          await fetch("/api/songs", {
            cache: "no-store",
          });

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
            "Invalid server response."
          );
        }

        if (!response.ok) {
          throw new Error(
            data.error ||
              `Failed to load songs (${response.status}).`
          );
        }

        if (cancelled) return;

        const loadedSongs =
          Array.isArray(data.songs)
            ? data.songs
            : [];

        setSongs(loadedSongs);

        /*
         * RESTORE PLAYER STATE
         */

        const saved =
          getSavedPlayerState();

        const savedIndex =
          saved.songId
            ? loadedSongs.findIndex(
                (song) =>
                  song.id ===
                  saved.songId
              )
            : -1;

        if (
          savedIndex >= 0
        ) {
          setCurrentIndex(
            savedIndex
          );

          setVolume(
            saved.volume
          );

          restoredTimeRef.current =
            saved.currentTime;

          shouldPlayRef.current =
            saved.isPlaying;

          setIsPlaying(
            saved.isPlaying
          );
        } else {
          setCurrentIndex(0);

          setVolume(
            saved.volume
          );

          restoredTimeRef.current =
            0;

          shouldPlayRef.current =
            false;

          setIsPlaying(false);
        }
      } catch (err) {
        if (cancelled) return;

        console.error(
          "LOAD SONGS ERROR:",
          err
        );

        setError(
          err instanceof Error
            ? err.message
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
   * =========================================
   * SITE SETTINGS
   * =========================================
   */

  useEffect(() => {
    let cancelled = false;

    async function loadSettings() {
      try {
        const response =
          await fetch(
            "/api/site-settings",
            {
              cache: "no-store",
            }
          );

        if (!response.ok) return;

        const text =
          await response.text();

        if (!text) return;

        let data: {
          settings?: SiteSettings;
        } = {};

        try {
          data =
            JSON.parse(text);
        } catch {
          return;
        }

        if (
          !cancelled &&
          data.settings
        ) {
          setSettings({
            siteName:
              data.settings.siteName ||
              "Music Flow",

            instagramUrl:
              data.settings.instagramUrl ||
              "https://www.instagram.com/vjy.cyber/",
          });
        }
      } catch (err) {
        if (!cancelled) {
          console.error(
            "LOAD SETTINGS ERROR:",
            err
          );
        }
      }
    }

    loadSettings();

    return () => {
      cancelled = true;
    };
  }, []);

  /*
   * =========================================
   * RESTORE HOME SCROLL POSITION
   * =========================================
   */

  useEffect(() => {
    if (loading) return;

    const savedScroll =
      sessionStorage.getItem(
        SCROLL_KEY
      );

    if (!savedScroll) return;

    const scrollY =
      Number(savedScroll);

    if (
      !Number.isFinite(scrollY) ||
      scrollY <= 0
    ) {
      return;
    }

    const timer =
      window.setTimeout(() => {
        window.scrollTo({
          top: scrollY,
          behavior: "instant" as ScrollBehavior,
        });
      }, 100);

    return () =>
      window.clearTimeout(timer);
  }, [loading]);

  /*
   * =========================================
   * SAVE HOME SCROLL
   * =========================================
   */

  useEffect(() => {
    let timeout:
      | ReturnType<typeof setTimeout>
      | null = null;

    function saveScroll() {
      if (timeout) {
        clearTimeout(timeout);
      }

      timeout = setTimeout(() => {
        sessionStorage.setItem(
          SCROLL_KEY,
          String(window.scrollY)
        );
      }, 100);
    }

    window.addEventListener(
      "scroll",
      saveScroll,
      {
        passive: true,
      }
    );

    return () => {
      window.removeEventListener(
        "scroll",
        saveScroll
      );

      if (timeout) {
        clearTimeout(timeout);
      }

      sessionStorage.setItem(
        SCROLL_KEY,
        String(window.scrollY)
      );
    };
  }, []);

  /*
   * =========================================
   * INSTAGRAM URL
   * =========================================
   */

  const instagramHref =
    useMemo(() => {
      const url =
        settings.instagramUrl?.trim();

      if (!url) {
        return "https://www.instagram.com/vjy.cyber/";
      }

      if (
        !url.startsWith(
          "http://"
        ) &&
        !url.startsWith(
          "https://"
        )
      ) {
        return `https://${url}`;
      }

      return url;
    }, [
      settings.instagramUrl,
    ]);

  /*
   * =========================================
   * SEARCH
   * =========================================
   */

  const filteredSongs =
    useMemo(() => {
      let result = [...songs];

      if (
        activeCategory !==
        "all"
      ) {
        result =
          result.filter(
            (song) =>
              String(
                song.category || ""
              )
                .toLowerCase() ===
              activeCategory.toLowerCase()
          );
      }

      if (search.trim()) {
        const query =
          search
            .toLowerCase()
            .trim();

        result =
          result.filter(
            (song) =>
              `${song.title || ""} ${
                song.artist || ""
              } ${
                song.category || ""
              }`
                .toLowerCase()
                .includes(query)
          );
      }

      return result;
    }, [
      songs,
      activeCategory,
      search,
    ]);

  /*
   * =========================================
   * LATEST SONGS
   * =========================================
   */

  const latestSongs =
    useMemo(() => {
      if (
        activeCategory !==
        "all"
      ) {
        return filteredSongs.slice(
          0,
          5
        );
      }

      if (search.trim()) {
        return filteredSongs.slice(
          0,
          5
        );
      }

      return songs.slice(
        0,
        5
      );
    }, [
      songs,
      filteredSongs,
      activeCategory,
      search,
    ]);

  const librarySongs =
    latestSongs;

  const searchActive =
    search.trim().length > 0;

  /*
   * =========================================
   * AUDIO SOURCE
   * =========================================
   */

  useEffect(() => {
    const audio =
      audioRef.current;

    if (
      !audio ||
      !currentSong?.audioUrl
    ) {
      return;
    }

    const requestId =
      ++playRequestId.current;

    let cancelled = false;

    const shouldPlay =
      shouldPlayRef.current;

    const restoreTime =
      restoredTimeRef.current;

    /*
     * IMPORTANT:
     * Don't reset saved time here.
     */

    audio.pause();

    audio.src =
      currentSong.audioUrl;

    audio.volume = volume;

    audio.load();

    hasRestoredAudioRef.current =
      false;

    const restoreAndPlay =
      async () => {
        if (cancelled) return;

        if (
          requestId !==
          playRequestId.current
        ) {
          return;
        }

        /*
         * RESTORE EXACT POSITION
         */

        if (
          !hasRestoredAudioRef.current
        ) {
          try {
            if (
              restoreTime > 0 &&
              Number.isFinite(
                restoreTime
              )
            ) {
              const safeTime =
                Number.isFinite(
                  audio.duration
                ) &&
                audio.duration > 0
                  ? Math.min(
                      restoreTime,
                      Math.max(
                        0,
                        audio.duration -
                          0.2
                      )
                    )
                  : restoreTime;

              audio.currentTime =
                Math.max(
                  0,
                  safeTime
                );

              setCurrentTime(
                Math.max(
                  0,
                  safeTime
                )
              );
            } else {
              setCurrentTime(
                audio.currentTime ||
                  0
              );
            }

            hasRestoredAudioRef.current =
              true;
          } catch (err) {
            console.error(
              "RESTORE AUDIO POSITION ERROR:",
              err
            );
          }
        }

        if (!shouldPlay) {
          setIsPlaying(false);
          return;
        }

        try {
          await audio.play();

          if (
            !cancelled &&
            requestId ===
              playRequestId.current
          ) {
            setIsPlaying(true);
          }
        } catch (err) {
          if (
            err instanceof
              DOMException &&
            err.name ===
              "AbortError"
          ) {
            return;
          }

          console.error(
            "AUDIO PLAY ERROR:",
            err
          );

          setIsPlaying(false);
        }
      };

    const handleLoadedMetadata =
      () => {
        if (cancelled) return;

        setDuration(
          Number.isFinite(
            audio.duration
          )
            ? audio.duration
            : 0
        );

        restoreAndPlay();
      };

    const handleCanPlay =
      () => {
        restoreAndPlay();
      };

    audio.addEventListener(
      "loadedmetadata",
      handleLoadedMetadata
    );

    audio.addEventListener(
      "canplay",
      handleCanPlay
    );

    /*
     * Sometimes browser already has metadata.
     */

    if (
      audio.readyState >=
      HTMLMediaElement.HAVE_METADATA
    ) {
      handleLoadedMetadata();
    }

    return () => {
      cancelled = true;

      /*
       * SAVE EXACT POSITION
       * BEFORE AUDIO IS DESTROYED
       */

      try {
        const savedTime =
          audio.currentTime;

        if (
          Number.isFinite(
            savedTime
          )
        ) {
          savePlayerState({
            songId:
              currentSong.id,

            currentTime:
              savedTime,

            isPlaying:
              !audio.paused,

            volume:
              audio.volume,
          });
        }
      } catch {}

      audio.removeEventListener(
        "loadedmetadata",
        handleLoadedMetadata
      );

      audio.removeEventListener(
        "canplay",
        handleCanPlay
      );

      audio.pause();
    };
  }, [
    currentSong?.id,
    currentSong?.audioUrl,
  ]);

  /*
   * =========================================
   * VOLUME
   * =========================================
   */

  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.volume =
        volume;
    }

    savePlayerState({
      volume,
    });
  }, [volume]);

  /*
   * =========================================
   * PLAY / PAUSE
   * =========================================
   */

  async function togglePlay() {
    const audio =
      audioRef.current;

    if (
      !audio ||
      !currentSong
    ) {
      return;
    }

    if (isPlaying) {
      shouldPlayRef.current =
        false;

      audio.pause();

      setIsPlaying(false);

      savePlayerState({
        songId:
          currentSong.id,

        currentTime:
          audio.currentTime,

        isPlaying: false,

        volume:
          audio.volume,
      });

      return;
    }

    shouldPlayRef.current =
      true;

    const requestId =
      ++playRequestId.current;

    try {
      const expectedUrl =
        new URL(
          currentSong.audioUrl,
          window.location.href
        ).href;

      if (
        audio.src !==
        expectedUrl
      ) {
        audio.src =
          currentSong.audioUrl;

        audio.load();
      }

      if (
        audio.readyState <
        HTMLMediaElement.HAVE_FUTURE_DATA
      ) {
        await new Promise<void>(
          (
            resolve,
            reject
          ) => {
            let finished =
              false;

            const cleanup =
              () => {
                audio.removeEventListener(
                  "canplay",
                  handleCanPlay
                );

                audio.removeEventListener(
                  "error",
                  handleError
                );
              };

            const handleCanPlay =
              () => {
                if (finished)
                  return;

                finished = true;

                cleanup();

                resolve();
              };

            const handleError =
              () => {
                if (finished)
                  return;

                finished = true;

                cleanup();

                reject(
                  new Error(
                    "Unable to load audio."
                  )
                );
              };

            audio.addEventListener(
              "canplay",
              handleCanPlay,
              {
                once: true,
              }
            );

            audio.addEventListener(
              "error",
              handleError,
              {
                once: true,
              }
            );

            audio.load();
          }
        );
      }

      if (
        requestId !==
        playRequestId.current
      ) {
        return;
      }

      await audio.play();

      if (
        requestId ===
        playRequestId.current
      ) {
        setIsPlaying(true);

        savePlayerState({
          songId:
            currentSong.id,

          currentTime:
            audio.currentTime,

          isPlaying: true,

          volume:
            audio.volume,
        });
      }
    } catch (err) {
      if (
        err instanceof
          DOMException &&
        err.name ===
          "AbortError"
      ) {
        return;
      }

      console.error(
        "PLAY ERROR:",
        err
      );

      setIsPlaying(false);

      savePlayerState({
        isPlaying: false,
      });
    }
  }

  /*
   * =========================================
   * SONG SELECTION
   * =========================================
   */

  function playSong(
    index: number
  ) {
    if (
      index < 0 ||
      index >= songs.length
    ) {
      return;
    }

    if (
      index ===
      currentIndex
    ) {
      togglePlay();
      return;
    }

    /*
     * New song starts from 0.
     * Previously saved song position is
     * restored only for that saved song.
     */

    restoredTimeRef.current =
      0;

    hasRestoredAudioRef.current =
      false;

    shouldPlayRef.current =
      true;

    setCurrentTime(0);
    setDuration(0);
    setCurrentIndex(index);
    setIsPlaying(true);

    const selectedSong =
      songs[index];

    savePlayerState({
      songId:
        selectedSong.id,

      currentTime: 0,

      isPlaying: true,

      volume,
    });
  }

  /*
   * =========================================
   * PREVIOUS
   * =========================================
   */

  function previousSong() {
    if (!songs.length)
      return;

    shouldPlayRef.current =
      true;

    restoredTimeRef.current =
      0;

    hasRestoredAudioRef.current =
      false;

    setCurrentTime(0);
    setDuration(0);
    setIsPlaying(true);

    setCurrentIndex(
      (current) =>
        current === 0
          ? songs.length - 1
          : current - 1
    );
  }

  /*
   * =========================================
   * NEXT
   * =========================================
   */

  function nextSong() {
    if (!songs.length)
      return;

    shouldPlayRef.current =
      true;

    restoredTimeRef.current =
      0;

    hasRestoredAudioRef.current =
      false;

    setCurrentTime(0);
    setDuration(0);
    setIsPlaying(true);

    setCurrentIndex(
      (current) =>
        current ===
        songs.length - 1
          ? 0
          : current + 1
    );
  }

  /*
   * =========================================
   * AUDIO EVENTS
   * =========================================
   */

  function handleTimeUpdate() {
    const audio =
      audioRef.current;

    if (!audio) return;

    const time =
      audio.currentTime;

    setCurrentTime(time);

    /*
     * Save exact playback position.
     */

    if (
      Math.abs(
        time -
          lastSavedTimeRef.current
      ) >= 1
    ) {
      savePlayerState({
        songId:
          currentSongIdRef.current,

        currentTime: time,

        isPlaying:
          !audio.paused,

        volume:
          audio.volume,
      });
    }
  }

  function handleLoadedMetadata() {
    const audio =
      audioRef.current;

    if (!audio) return;

    setDuration(
      Number.isFinite(
        audio.duration
      )
        ? audio.duration
        : 0
    );
  }

  function handlePlay() {
    setIsPlaying(true);

    savePlayerState({
      isPlaying: true,
    });
  }

  function handlePause() {
    setIsPlaying(false);

    const audio =
      audioRef.current;

    savePlayerState({
      isPlaying: false,

      currentTime:
        audio?.currentTime ??
        currentTime,
    });
  }

  function handleAudioError() {
    const audio =
      audioRef.current;

    if (!audio) return;

    if (
      audio.error?.code ===
      MediaError.MEDIA_ERR_ABORTED
    ) {
      return;
    }

    console.error(
      "AUDIO ERROR:",
      audio.error
    );

    setIsPlaying(false);

    savePlayerState({
      isPlaying: false,
    });
  }

  function handleEnded() {
    /*
     * Current song finished.
     * Next song starts normally from 0.
     */

    restoredTimeRef.current =
      0;

    hasRestoredAudioRef.current =
      false;

    nextSong();
  }

  /*
   * =========================================
   * SEEK
   * =========================================
   */

  function seekSong(
    event: React.ChangeEvent<HTMLInputElement>
  ) {
    const value =
      Number(
        event.target.value
      );

    const audio =
      audioRef.current;

    if (!audio) return;

    audio.currentTime =
      value;

    setCurrentTime(value);

    savePlayerState({
      songId:
        currentSong?.id,

      currentTime: value,

      isPlaying:
        !audio.paused,

      volume:
        audio.volume,
    });
  }

  /*
   * =========================================
   * MUTE
   * =========================================
   */

  function toggleMute() {
    const audio =
      audioRef.current;

    if (!audio) return;

    if (volume > 0) {
      audio.volume = 0;

      setVolume(0);

      savePlayerState({
        volume: 0,
      });
    } else {
      audio.volume = 0.8;

      setVolume(0.8);

      savePlayerState({
        volume: 0.8,
      });
    }
  }

  /*
   * =========================================
   * SEARCH SONG
   * =========================================
   */

  function handleSearchSong(
    songId: string
  ) {
    const index =
      songs.findIndex(
        (song) =>
          song.id === songId
      );

    if (index === -1)
      return;

    playSong(index);
  }

  /*
   * =========================================
   * CLEAR SEARCH
   * =========================================
   */

  function clearSearch() {
    setSearch("");
  }

  /*
   * =========================================
   * CATEGORY
   * =========================================
   */

  const categoryTitle =
    categories.find(
      (category) =>
        category.id ===
        activeCategory
    )?.name ||
    "All Songs";

  /*
   * =========================================
   * UI
   * =========================================
   */

  return (
    <main className="relative min-h-screen overflow-x-hidden bg-[#030305] text-white selection:bg-fuchsia-400 selection:text-black">
      <audio
        ref={audioRef}
        preload="metadata"
        onTimeUpdate={
          handleTimeUpdate
        }
        onLoadedMetadata={
          handleLoadedMetadata
        }
        onEnded={handleEnded}
        onPlay={handlePlay}
        onPause={handlePause}
        onError={
          handleAudioError
        }
      />

      {/* BACKGROUND */}

      <div className="pointer-events-none fixed inset-0 z-0 overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_-10%,rgba(168,85,247,0.16),transparent_38%),radial-gradient(circle_at_100%_50%,rgba(6,182,212,0.12),transparent_35%),radial-gradient(circle_at_0%_70%,rgba(236,72,153,0.10),transparent_35%)]" />

        <div className="live-blob blob-purple absolute left-[-180px] top-[10%] h-[480px] w-[480px] rounded-full bg-purple-600/20 blur-[130px]" />

        <div className="live-blob blob-blue absolute right-[-180px] top-[30%] h-[520px] w-[520px] rounded-full bg-cyan-500/20 blur-[140px]" />

        <div className="live-blob blob-pink absolute bottom-[-220px] left-[25%] h-[500px] w-[500px] rounded-full bg-pink-500/15 blur-[140px]" />

        <div className="live-blob blob-orange absolute right-[20%] top-[5%] h-[260px] w-[260px] rounded-full bg-orange-500/10 blur-[100px]" />

        <div className="absolute inset-0 opacity-[0.035] [background-image:linear-gradient(rgba(255,255,255,.5)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,.5)_1px,transparent_1px)] [background-size:55px_55px] [mask-image:linear-gradient(to_bottom,black,transparent_80%)]" />

        <div className="music-particle particle-1" />
        <div className="music-particle particle-2" />
        <div className="music-particle particle-3" />
        <div className="music-particle particle-4" />
        <div className="music-particle particle-5" />
        <div className="music-particle particle-6" />

        <div className="absolute bottom-0 left-0 right-0 flex h-32 items-end justify-center gap-1 opacity-[0.07] sm:gap-2">
          {Array.from({
            length: 42,
          }).map((_, index) => (
            <span
              key={index}
              className="equalizer-bar w-[3px] rounded-full bg-gradient-to-t from-fuchsia-500 via-purple-500 to-cyan-400 sm:w-1"
              style={{
                animationDelay: `${
                  index * -0.12
                }s`,
              }}
            />
          ))}
        </div>
      </div>

      {/* HEADER */}

      <header className="sticky top-0 z-40 border-b border-white/[0.08] bg-black/55 backdrop-blur-2xl">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3.5 sm:px-6 sm:py-4">
          <a
            href="#top"
            className="group flex items-center gap-3"
          >
            <div className="relative flex h-11 w-11 shrink-0 items-center justify-center overflow-hidden rounded-2xl border border-white/15 bg-black/40 shadow-[0_0_30px_rgba(168,85,247,0.18)] transition duration-500 group-hover:scale-105">
              <div className="absolute inset-0 bg-gradient-to-br from-fuchsia-500 via-purple-500 to-cyan-400 opacity-90" />

              <div className="absolute inset-[2px] flex items-center justify-center rounded-[14px] bg-[#08080b]">
                <Music2
                  size={21}
                  className="text-white"
                  strokeWidth={2.5}
                />
              </div>

              <div className="absolute bottom-0 left-0 right-0 h-[2px] bg-gradient-to-r from-fuchsia-500 via-purple-500 to-cyan-400" />
            </div>

            <div>
              <h1 className="text-xl font-black tracking-tight sm:text-2xl">
                <span className="bg-gradient-to-r from-fuchsia-400 via-purple-400 to-cyan-400 bg-clip-text text-transparent">
                  {settings.siteName ||
                    "Music Flow"}
                </span>
              </h1>

              <p className="mt-0.5 text-[9px] font-semibold uppercase tracking-[0.25em] text-white/35 sm:text-[10px]">
                Feel • Discover • Repeat
              </p>
            </div>
          </a>

          <a
            href={instagramHref}
            target="_blank"
            rel="noopener noreferrer"
            aria-label="Music Flow Instagram"
            className="group flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.045] px-3 py-2 text-white/60 transition-all duration-300 hover:scale-105 hover:border-pink-400/30 hover:bg-pink-500/10 hover:text-white"
          >
            <InstagramIcon
              size={16}
              className="transition group-hover:text-pink-400"
            />

            <span className="hidden text-xs font-medium sm:block">
              @vjy.cyber
            </span>
          </a>
        </div>
      </header>

      {/* MAIN */}

      <div
        id="top"
        className="relative z-10 mx-auto max-w-7xl px-4 pb-36 pt-7 sm:px-6 sm:pt-10"
      >
        {/* HERO */}

        <section className="mx-auto mb-7 max-w-5xl text-center sm:mb-9">
          <div className="mx-auto mb-4 flex w-fit items-center gap-2 rounded-full border border-white/10 bg-white/[0.035] px-3 py-1.5 text-[9px] font-semibold uppercase tracking-[0.2em] text-white/40 backdrop-blur-xl">
            <Sparkles
              size={12}
              className="text-fuchsia-400"
            />
            Premium Music Experience
          </div>

          <h2 className="text-4xl font-black tracking-[-0.04em] sm:text-5xl md:text-6xl">
            <span className="text-white">
              Your Music.
            </span>

            <br />

            <span className="bg-gradient-to-r from-fuchsia-400 via-purple-400 to-cyan-400 bg-clip-text text-transparent">
              Your Flow.
            </span>
          </h2>

          <p className="mx-auto mt-4 max-w-xl text-sm leading-6 text-white/35 sm:text-base">
            Discover your favorite songs,
            explore different vibes and let
            the music take you where words
            cannot.
          </p>
        </section>

        {/* SEARCH */}

        <div className="relative mx-auto max-w-2xl">
          <div
            className={`group relative overflow-hidden rounded-2xl border transition-all duration-300 ${
              searchActive
                ? "border-purple-400/30 bg-white/[0.09] shadow-[0_0_60px_rgba(168,85,247,0.12)]"
                : "border-white/10 bg-white/[0.045] hover:border-white/15"
            }`}
          >
            <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-purple-400/60 to-transparent opacity-0 transition group-focus-within:opacity-100" />

            <Search
              size={18}
              className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-white/30 transition group-focus-within:text-purple-300"
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
              className="w-full bg-transparent py-4 pl-11 pr-12 text-sm text-white outline-none placeholder:text-white/25"
            />

            {searchActive && (
              <button
                type="button"
                onClick={
                  clearSearch
                }
                className="absolute right-3 top-1/2 flex h-7 w-7 -translate-y-1/2 items-center justify-center rounded-full bg-white/[0.08] text-white/40 transition hover:bg-white/15 hover:text-white"
              >
                <X size={14} />
              </button>
            )}
          </div>

          {/* SEARCH DROPDOWN */}

          {searchActive && (
            <div className="absolute left-0 right-0 top-[calc(100%+10px)] z-[100] overflow-hidden rounded-2xl border border-white/10 bg-[#0a0a0e]/95 shadow-[0_25px_80px_rgba(0,0,0,0.8)] backdrop-blur-2xl">
              <div className="border-b border-white/[0.06] px-4 py-3">
                <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-white/30">
                  Search Results
                </p>

                <p className="mt-1 text-xs text-white/20">
                  {filteredSongs.length}{" "}
                  {filteredSongs.length ===
                  1
                    ? "song"
                    : "songs"}{" "}
                  found
                </p>
              </div>

              <div className="max-h-[420px] overflow-y-auto p-2">
                {filteredSongs.length >
                0 ? (
                  filteredSongs.map(
                    (song) => {
                      const index =
                        songs.findIndex(
                          (item) =>
                            item.id ===
                            song.id
                        );

                      const active =
                        index ===
                        currentIndex;

                      return (
                        <button
                          key={
                            song.id
                          }
                          type="button"
                          onClick={() =>
                            handleSearchSong(
                              song.id
                            )
                          }
                          className={`group flex w-full items-center gap-3 rounded-xl p-2.5 text-left transition-all duration-200 ${
                            active
                              ? "bg-white/[0.10]"
                              : "hover:bg-white/[0.06]"
                          }`}
                        >
                          <div className="relative h-12 w-12 shrink-0 overflow-hidden rounded-xl">
                            <img
                              src={
                                song.coverImage
                              }
                              alt={
                                song.title
                              }
                              className="h-full w-full object-cover transition duration-500 group-hover:scale-110"
                            />

                            {active && (
                              <div className="absolute inset-0 flex items-center justify-center bg-black/40">
                                {isPlaying ? (
                                  <Pause
                                    size={
                                      15
                                    }
                                    fill="currentColor"
                                  />
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

                          <div className="min-w-0 flex-1">
                            <p className="truncate text-sm font-medium">
                              {
                                song.title
                              }
                            </p>

                            <p className="mt-0.5 truncate text-xs text-white/35">
                              {
                                song.artist
                              }
                            </p>
                          </div>

                          <span className="hidden text-[10px] uppercase tracking-wider text-white/20 sm:block">
                            {
                              song.category
                            }
                          </span>

                          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-white/[0.06] transition group-hover:scale-110 group-hover:bg-white/10">
                            {active &&
                            isPlaying ? (
                              <Pause
                                size={
                                  13
                                }
                                fill="currentColor"
                              />
                            ) : (
                              <Play
                                size={
                                  13
                                }
                                fill="currentColor"
                              />
                            )}
                          </div>
                        </button>
                      );
                    }
                  )
                ) : (
                  <div className="px-6 py-10 text-center">
                    <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-white/[0.05]">
                      <Search
                        size={20}
                        className="text-white/20"
                      />
                    </div>

                    <p className="text-sm text-white/50">
                      No songs found
                    </p>

                    <p className="mt-1 text-xs text-white/20">
                      Try another song or artist
                    </p>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* CATEGORIES */}

        {!searchActive && (
          <div className="mx-auto mt-6 flex max-w-5xl gap-2 overflow-x-auto pb-2 scrollbar-none">
            {categories.map(
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
                    onClick={() => {
                      setActiveCategory(
                        category.id
                      );
                    }}
                    className={`relative shrink-0 overflow-hidden rounded-full border px-4 py-2 text-xs font-medium transition-all duration-300 sm:px-5 sm:py-2.5 sm:text-sm ${
                      active
                        ? "border-transparent bg-gradient-to-r from-fuchsia-500 via-purple-500 to-cyan-500 text-white shadow-[0_5px_30px_rgba(168,85,247,0.22)]"
                        : "border-white/10 bg-white/[0.035] text-white/45 hover:border-white/20 hover:bg-white/[0.07] hover:text-white"
                    }`}
                  >
                    {
                      category.name
                    }
                  </button>
                );
              }
            )}
          </div>
        )}

        {/* NOW PLAYING */}

        {currentSong && (
          <section
            className={`group mx-auto mt-6 max-w-4xl overflow-hidden rounded-[24px] border transition-all duration-700 sm:mt-8 sm:rounded-[28px] ${
              isPlaying
                ? "border-purple-400/20 bg-white/[0.065] shadow-[0_20px_90px_rgba(168,85,247,0.10)]"
                : "border-white/10 bg-white/[0.04]"
            }`}
          >
            <div className="relative flex">
              <div className="pointer-events-none absolute inset-0 bg-gradient-to-r from-fuchsia-500/[0.04] via-transparent to-cyan-500/[0.04]" />

              <div className="relative h-32 w-32 shrink-0 overflow-hidden sm:h-40 sm:w-40 md:h-44 md:w-44">
                <img
                  src={
                    currentSong.coverImage
                  }
                  alt={
                    currentSong.title
                  }
                  className={`h-full w-full object-cover transition-transform duration-[1200ms] ${
                    isPlaying
                      ? "scale-110"
                      : "scale-100"
                  }`}
                />

                <div className="absolute inset-0 bg-gradient-to-tr from-black/70 via-transparent to-purple-400/20" />

                {isPlaying && (
                  <div className="absolute bottom-3 left-3 flex h-7 items-end gap-[3px]">
                    <span className="w-[3px] animate-[musicbar_0.7s_ease-in-out_infinite] rounded-full bg-fuchsia-300" />
                    <span className="w-[3px] animate-[musicbar_0.9s_ease-in-out_infinite] rounded-full bg-purple-300" />
                    <span className="w-[3px] animate-[musicbar_0.6s_ease-in-out_infinite] rounded-full bg-cyan-300" />
                    <span className="w-[3px] animate-[musicbar_1s_ease-in-out_infinite] rounded-full bg-white" />
                  </div>
                )}
              </div>

              <div className="min-w-0 flex-1 p-4 sm:p-6">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="text-[9px] font-semibold uppercase tracking-[0.22em] text-purple-300/50">
                      Now Playing
                    </p>

                    <h2 className="mt-1 truncate text-lg font-black tracking-tight sm:text-2xl">
                      {
                        currentSong.title
                      }
                    </h2>

                    <p className="mt-0.5 truncate text-xs text-white/40 sm:text-sm">
                      {
                        currentSong.artist
                      }
                    </p>
                  </div>

                  <div className="hidden shrink-0 rounded-full border border-white/[0.07] bg-white/[0.03] px-3 py-1 text-[9px] uppercase tracking-wider text-white/25 sm:block">
                    {
                      currentSong.category
                    }
                  </div>
                </div>

                <div className="mt-4 sm:mt-6">
                  <input
                    type="range"
                    min="0"
                    max={
                      duration || 0
                    }
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
                    className="h-1 w-full cursor-pointer appearance-none rounded-full bg-white/10 accent-purple-400 disabled:cursor-not-allowed"
                  />

                  <div className="mt-1.5 flex justify-between text-[9px] text-white/25">
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

                <div className="mt-3 flex items-center gap-2 sm:mt-4">
                  <button
                    type="button"
                    onClick={
                      previousSong
                    }
                    className="flex h-9 w-9 items-center justify-center rounded-full border border-white/10 text-white/50 transition-all duration-300 hover:scale-105 hover:border-purple-400/30 hover:bg-purple-500/10 hover:text-white sm:h-10 sm:w-10"
                  >
                    <ChevronLeft
                      size={18}
                    />
                  </button>

                  <button
                    type="button"
                    onClick={
                      togglePlay
                    }
                    className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-r from-fuchsia-400 via-purple-400 to-cyan-400 text-black shadow-[0_5px_30px_rgba(168,85,247,0.28)] transition-all duration-300 hover:scale-110 active:scale-95 sm:h-11 sm:w-11"
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

                  <button
                    type="button"
                    onClick={
                      nextSong
                    }
                    className="flex h-9 w-9 items-center justify-center rounded-full border border-white/10 text-white/50 transition-all duration-300 hover:scale-105 hover:border-cyan-400/30 hover:bg-cyan-500/10 hover:text-white sm:h-10 sm:w-10"
                  >
                    <ChevronRight
                      size={18}
                    />
                  </button>

                  <div className="ml-auto flex items-center gap-2">
                    <button
                      type="button"
                      onClick={
                        toggleMute
                      }
                      className="text-white/35 transition hover:text-white"
                    >
                      {volume ===
                      0 ? (
                        <VolumeX
                          size={17}
                        />
                      ) : (
                        <Volume2
                          size={17}
                        />
                      )}
                    </button>

                    <input
                      type="range"
                      min="0"
                      max="1"
                      step="0.01"
                      value={
                        volume
                      }
                      onChange={(
                        event
                      ) =>
                        setVolume(
                          Number(
                            event
                              .target
                              .value
                          )
                        )
                      }
                      className="hidden w-20 accent-purple-400 sm:block"
                    />
                  </div>
                </div>
              </div>
            </div>
          </section>
        )}

        {/* LIBRARY */}

        {!searchActive && (
          <section className="mx-auto mt-10 max-w-5xl">
            <div className="mb-4 flex items-center justify-between gap-4">
              <div className="min-w-0">
                <p className="text-[9px] font-semibold uppercase tracking-[0.25em] text-white/20">
                  Your Library
                </p>

                <h2 className="mt-1 truncate text-xl font-black tracking-tight">
                  {activeCategory ===
                  "all"
                    ? "Latest Songs"
                    : categoryTitle}
                </h2>

                <p className="mt-1 text-[10px] text-white/20">
                  {activeCategory ===
                  "all"
                    ? "Recently added songs"
                    : `Latest ${categoryTitle} songs`}
                </p>
              </div>

              <Link
                href="/all-songs"
                className="group flex shrink-0 items-center gap-1.5 rounded-full border border-purple-400/20 bg-purple-500/[0.07] px-3 py-2 text-[10px] font-semibold text-purple-300 transition-all duration-300 hover:border-purple-400/40 hover:bg-purple-500/15 hover:text-white sm:px-4 sm:text-xs"
              >
                All Songs

                <ChevronRight
                  size={14}
                  className="transition-transform duration-300 group-hover:translate-x-0.5"
                />
              </Link>
            </div>

            <div className="mb-3 flex justify-end">
              <span className="text-[10px] text-white/20">
                {
                  librarySongs.length
                }{" "}
                {librarySongs.length ===
                1
                  ? "song"
                  : "songs"}
              </span>
            </div>

            {loading && (
              <div className="space-y-2">
                {[
                  1, 2, 3, 4, 5,
                ].map((item) => (
                  <div
                    key={item}
                    className="h-[72px] animate-pulse rounded-2xl border border-white/5 bg-white/[0.03]"
                  />
                ))}
              </div>
            )}

            {error && (
              <div className="rounded-2xl border border-red-500/20 bg-red-500/10 p-5 text-sm text-red-300">
                {error}
              </div>
            )}

            {!loading &&
              !error &&
              librarySongs.length ===
                0 && (
                <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-10 text-center">
                  <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-white/[0.05]">
                    <Headphones
                      size={23}
                      className="text-white/20"
                    />
                  </div>

                  <p className="text-sm text-white/40">
                    No songs available yet.
                  </p>

                  <p className="mt-1 text-xs text-white/20">
                    Songs added from
                    the admin panel
                    will appear here.
                  </p>
                </div>
              )}

            {!loading &&
              !error &&
              librarySongs.length >
                0 && (
                <div className="space-y-2">
                  {librarySongs.map(
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
                              ? "border-purple-400/20 bg-white/[0.075] shadow-[0_10px_40px_rgba(168,85,247,0.06)]"
                              : "border-white/[0.07] bg-white/[0.025] hover:-translate-y-0.5 hover:border-purple-400/15 hover:bg-white/[0.055]"
                          }`}
                        >
                          {active && (
                            <div className="pointer-events-none absolute inset-0 bg-gradient-to-r from-fuchsia-500/[0.05] via-purple-500/[0.02] to-cyan-500/[0.04]" />
                          )}

                          <div className="relative h-12 w-12 shrink-0 overflow-hidden rounded-xl sm:h-14 sm:w-14">
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
                            />

                            {active && (
                              <div className="absolute inset-0 flex items-center justify-center bg-black/35">
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

                          <div className="relative min-w-0 flex-1">
                            <h3 className="truncate text-sm font-semibold sm:text-[15px]">
                              {
                                song.title
                              }
                            </h3>

                            <p className="mt-0.5 truncate text-xs text-white/30 sm:text-sm">
                              {
                                song.artist
                              }
                            </p>
                          </div>

                          <span className="hidden rounded-full bg-white/[0.04] px-3 py-1 text-[9px] uppercase tracking-wider text-white/25 md:block">
                            {
                              song.category
                            }
                          </span>

                          <span className="hidden text-[10px] text-white/20 sm:block">
                            {formatTime(
                              song.duration ??
                                0
                            )}
                          </span>

                          <span className="relative flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-white/[0.055] text-white/60 transition-all duration-300 group-hover:scale-105 group-hover:bg-purple-500/15 group-hover:text-white">
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
              )}
          </section>
        )}

        {/* ABOUT */}

        <section
          id="about"
          className="mx-auto mt-20 max-w-5xl scroll-mt-24"
        >
          <div className="mb-7 text-center">
            <div className="mx-auto mb-3 flex w-fit items-center gap-2 rounded-full border border-purple-400/15 bg-purple-500/[0.06] px-3 py-1.5 text-[9px] font-semibold uppercase tracking-[0.22em] text-purple-300/60">
              <Sparkles size={12} />
              About Music Flow
            </div>

            <h2 className="text-3xl font-black tracking-tight sm:text-4xl">
              More Than Just
              <span className="ml-2 bg-gradient-to-r from-fuchsia-400 via-purple-400 to-cyan-400 bg-clip-text text-transparent">
                Music
              </span>
            </h2>

            <p className="mx-auto mt-3 max-w-2xl text-sm leading-6 text-white/30">
              Music Flow is a modern music
              experience built for discovering,
              listening and enjoying songs in a
              beautiful, simple and immersive
              environment.
            </p>
          </div>

          <div className="relative overflow-hidden rounded-[28px] border border-white/10 bg-white/[0.035] p-5 shadow-[0_20px_80px_rgba(0,0,0,0.25)] backdrop-blur-xl sm:p-8">
            <div className="pointer-events-none absolute -right-32 -top-32 h-72 w-72 rounded-full bg-purple-500/10 blur-[100px]" />

            <div className="pointer-events-none absolute -bottom-32 -left-32 h-72 w-72 rounded-full bg-cyan-500/10 blur-[100px]" />

            <div className="relative grid gap-8 md:grid-cols-[1fr_auto] md:items-center">
              <div>
                <div className="flex items-center gap-3">
                  <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-fuchsia-500 via-purple-500 to-cyan-400 shadow-[0_10px_35px_rgba(168,85,247,0.2)]">
                    <Music2
                      size={22}
                      className="text-white"
                    />
                  </div>

                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.2em] text-white/25">
                      The Vision
                    </p>

                    <h3 className="text-xl font-black">
                      Welcome to Music Flow
                    </h3>
                  </div>
                </div>

                <p className="mt-5 max-w-2xl text-sm leading-7 text-white/40">
                  Music Flow is designed to make
                  music discovery feel effortless.
                  From regional favorites to
                  timeless classics, the platform
                  brings your music together in one
                  smooth and immersive experience.
                </p>

                <p className="mt-3 max-w-2xl text-sm leading-7 text-white/35">
                  The goal is simple — create a
                  beautiful music platform where
                  the interface stays clean, the
                  experience stays fast and every
                  song gets its moment.
                </p>
              </div>

              <div className="w-full rounded-2xl border border-white/10 bg-black/30 p-5 md:w-[260px]">
                <p className="text-[9px] font-semibold uppercase tracking-[0.22em] text-white/25">
                  Developed By
                </p>

                <h3 className="mt-2 text-xl font-black">
                  Vijay Suvata
                </h3>

                <p className="mt-1 text-xs text-purple-300/70">
                  Full-Stack Developer
                </p>

                <div className="my-4 h-px bg-white/[0.07]" />

                <p className="text-xs leading-5 text-white/30">
                  Building modern web
                  experiences with technology,
                  creativity and a passion for
                  clean UI.
                </p>

                <a
                  href="https://www.instagram.com/vjy.cyber/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-5 flex items-center justify-center gap-2 rounded-xl border border-pink-400/20 bg-pink-500/[0.07] px-4 py-2.5 text-xs font-semibold text-white/70 transition-all duration-300 hover:border-pink-400/40 hover:bg-pink-500/15 hover:text-white"
                >
                  <InstagramIcon
                    size={15}
                    className="text-pink-400"
                  />
                  @vjy.cyber
                </a>
              </div>
            </div>
          </div>

          <div className="mt-4 grid gap-3 sm:grid-cols-3">
            <div className="group rounded-2xl border border-white/[0.07] bg-white/[0.025] p-5 transition-all duration-300 hover:-translate-y-1 hover:border-purple-400/20 hover:bg-purple-500/[0.04]">
              <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-xl bg-fuchsia-500/10 text-fuchsia-400">
                <Music2 size={19} />
              </div>

              <h4 className="font-bold">
                Discover Music
              </h4>

              <p className="mt-2 text-xs leading-5 text-white/25">
                Explore songs across multiple
                categories and discover something
                new every time.
              </p>
            </div>

            <div className="group rounded-2xl border border-white/[0.07] bg-white/[0.025] p-5 transition-all duration-300 hover:-translate-y-1 hover:border-purple-400/20 hover:bg-purple-500/[0.04]">
              <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-xl bg-purple-500/10 text-purple-400">
                <Headphones size={19} />
              </div>

              <h4 className="font-bold">
                Immersive Player
              </h4>

              <p className="mt-2 text-xs leading-5 text-white/25">
                Smooth controls, progress tracking
                and a distraction-free listening
                experience.
              </p>
            </div>

            <div className="group rounded-2xl border border-white/[0.07] bg-white/[0.025] p-5 transition-all duration-300 hover:-translate-y-1 hover:border-purple-400/20 hover:bg-purple-500/[0.04]">
              <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-xl bg-cyan-500/10 text-cyan-400">
                <Sparkles size={19} />
              </div>

              <h4 className="font-bold">
                Made With Passion
              </h4>

              <p className="mt-2 text-xs leading-5 text-white/25">
                Designed and developed with a
                focus on modern UI, performance
                and simplicity.
              </p>
            </div>
          </div>
        </section>

        {/* FOOTER */}

        <footer className="mx-auto mt-16 max-w-5xl border-t border-white/[0.07] pt-7 text-center">
          <div className="flex flex-col items-center justify-between gap-4 sm:flex-row">
            <div className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-gradient-to-br from-fuchsia-500 via-purple-500 to-cyan-400">
                <Music2
                  size={15}
                  className="text-white"
                />
              </div>

              <span className="text-sm font-bold">
                <span className="bg-gradient-to-r from-fuchsia-400 via-purple-400 to-cyan-400 bg-clip-text text-transparent">
                  Music Flow
                </span>
              </span>
            </div>

            <p className="text-[10px] text-white/20">
              ©{" "}
              {new Date().getFullYear()}{" "}
              Music Flow. Built by Vijay
              Suvata.
            </p>

            <a
              href="https://www.instagram.com/vjy.cyber/"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 text-xs text-white/30 transition hover:text-pink-400"
            >
              <InstagramIcon size={14} />
              @vjy.cyber
            </a>
          </div>
        </footer>
      </div>

      {/* BOTTOM PLAYER */}

      {currentSong && (
        <div className="fixed bottom-0 left-0 right-0 z-50 border-t border-white/[0.08] bg-black/75 shadow-[0_-15px_60px_rgba(0,0,0,0.5)] backdrop-blur-2xl">
          <div className="mx-auto flex max-w-7xl items-center gap-2 px-3 py-2.5 sm:gap-3 sm:px-5 sm:py-3">
            <div className="relative h-10 w-10 shrink-0 overflow-hidden rounded-xl sm:h-11 sm:w-11">
              <img
                src={
                  currentSong.coverImage
                }
                alt={
                  currentSong.title
                }
                className={`h-full w-full object-cover transition duration-700 ${
                  isPlaying
                    ? "scale-110"
                    : ""
                }`}
              />
            </div>

            <div className="min-w-0 flex-1">
              <p className="truncate text-xs font-semibold sm:text-sm">
                {
                  currentSong.title
                }
              </p>

              <p className="truncate text-[10px] text-white/30 sm:text-xs">
                {
                  currentSong.artist
                }
              </p>
            </div>

            <button
              type="button"
              onClick={
                previousSong
              }
              className="hidden rounded-full p-2 text-white/35 transition hover:bg-purple-500/10 hover:text-white sm:block"
            >
              <ChevronLeft
                size={19}
              />
            </button>

            <button
              type="button"
              onClick={
                togglePlay
              }
              className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-gradient-to-r from-fuchsia-400 via-purple-400 to-cyan-400 text-black shadow-[0_4px_30px_rgba(168,85,247,0.22)] transition-all duration-300 hover:scale-110 active:scale-95 sm:h-11 sm:w-11"
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

            <button
              type="button"
              onClick={
                nextSong
              }
              className="hidden rounded-full p-2 text-white/35 transition hover:bg-cyan-500/10 hover:text-white sm:block"
            >
              <ChevronRight
                size={19}
              />
            </button>

            <div className="hidden items-center gap-2 md:flex">
              {volume === 0 ? (
                <VolumeX
                  size={16}
                  className="text-white/35"
                />
              ) : (
                <Volume2
                  size={16}
                  className="text-white/35"
                />
              )}

              <input
                type="range"
                min="0"
                max="1"
                step="0.01"
                value={volume}
                onChange={(
                  event
                ) =>
                  setVolume(
                    Number(
                      event.target
                        .value
                    )
                  )
                }
                className="w-20 accent-purple-400"
              />
            </div>
          </div>

          <div className="absolute left-0 right-0 top-0 h-[2px] bg-white/[0.04]">
            <div
              className="h-full bg-gradient-to-r from-fuchsia-400 via-purple-400 to-cyan-400 transition-[width] duration-300"
              style={{
                width:
                  duration > 0
                    ? `${Math.min(
                        100,
                        (currentTime /
                          duration) *
                          100
                      )}%`
                    : "0%",
              }}
            />
          </div>
        </div>
      )}

      {/* ANIMATIONS */}

      <style jsx global>{`
        @keyframes musicbar {
          0%,
          100% {
            height: 25%;
          }

          50% {
            height: 100%;
          }
        }

        @keyframes floatBlobOne {
          0%,
          100% {
            transform: translate3d(
                0,
                0,
                0
              )
              scale(1);
          }

          33% {
            transform: translate3d(
                90px,
                50px,
                0
              )
              scale(1.12);
          }

          66% {
            transform: translate3d(
                -40px,
                100px,
                0
              )
              scale(0.92);
          }
        }

        @keyframes floatBlobTwo {
          0%,
          100% {
            transform: translate3d(
                0,
                0,
                0
              )
              scale(1);
          }

          50% {
            transform: translate3d(
                -100px,
                -60px,
                0
              )
              scale(1.15);
          }
        }

        @keyframes floatBlobThree {
          0%,
          100% {
            transform: translate3d(
                0,
                0,
                0
              )
              scale(1);
          }

          50% {
            transform: translate3d(
                80px,
                -80px,
                0
              )
              scale(1.1);
          }
        }

        .blob-purple {
          animation: floatBlobOne
            18s
            ease-in-out
            infinite;
        }

        .blob-blue {
          animation: floatBlobTwo
            22s
            ease-in-out
            infinite;
        }

        .blob-pink {
          animation: floatBlobThree
            20s
            ease-in-out
            infinite;
        }

        .blob-orange {
          animation: floatBlobOne
            15s
            ease-in-out
            infinite
            reverse;
        }

        @keyframes equalizer {
          0%,
          100% {
            height: 8%;
          }

          25% {
            height: 55%;
          }

          50% {
            height: 25%;
          }

          75% {
            height: 80%;
          }
        }

        .equalizer-bar {
          height: 20%;
          animation: equalizer
            1.2s
            ease-in-out
            infinite;
        }

        @keyframes particleFloat {
          0% {
            transform: translate3d(
                0,
                30px,
                0
              )
              scale(0.7);
            opacity: 0;
          }

          20% {
            opacity: 0.6;
          }

          80% {
            opacity: 0.35;
          }

          100% {
            transform: translate3d(
                100px,
                -400px,
                0
              )
              scale(1.2);
            opacity: 0;
          }
        }

        .music-particle {
          position: absolute;
          bottom: -20px;
          width: 4px;
          height: 4px;
          border-radius: 999px;
          background: linear-gradient(
            135deg,
            #e879f9,
            #a78bfa,
            #22d3ee
          );
          box-shadow:
            0 0 15px
              rgba(217, 70, 239, 0.7);
          animation: particleFloat
            10s
            linear
            infinite;
        }

        .particle-1 {
          left: 10%;
          animation-delay: -2s;
        }

        .particle-2 {
          left: 27%;
          animation-delay: -7s;
          animation-duration: 14s;
        }

        .particle-3 {
          left: 43%;
          animation-delay: -4s;
          animation-duration: 12s;
        }

        .particle-4 {
          left: 62%;
          animation-delay: -9s;
          animation-duration: 15s;
        }

        .particle-5 {
          left: 78%;
          animation-delay: -5s;
          animation-duration: 11s;
        }

        .particle-6 {
          left: 91%;
          animation-delay: -8s;
          animation-duration: 13s;
        }

        .scrollbar-none::-webkit-scrollbar {
          display: none;
        }

        .scrollbar-none {
          scrollbar-width: none;
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
              rgba(168, 85, 247, 0.5);
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

        @media (max-width: 640px) {
          .live-blob {
            filter: blur(100px);
          }

          .equalizer-bar {
            animation-duration: 1.5s;
          }
        }

        @media (prefers-reduced-motion: reduce) {
          .live-blob,
          .equalizer-bar,
          .music-particle {
            animation: none !important;
          }

          * {
            scroll-behavior: auto !important;
          }
        }
      `}</style>
    </main>
  );
}