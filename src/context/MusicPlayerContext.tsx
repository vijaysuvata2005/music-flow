
"use client";

import {
  createContext,
  useContext,
  useEffect,
  useRef,
  useState,
  ReactNode,
} from "react";

export interface Song {
  id: string;
  title: string;
  artist: string;
  category: string;
  coverImage: string;
  audioUrl: string;
  duration: number | null;
  createdAt?: string;
}

interface MusicPlayerContextValue {
  songs: Song[];
  currentSong: Song | null;
  currentIndex: number;
  isPlaying: boolean;
  currentTime: number;
  duration: number;
  volume: number;

  playSong: (song: Song) => Promise<void>;
  togglePlay: () => Promise<void>;
  nextSong: () => Promise<void>;
  previousSong: () => Promise<void>;
  seekSong: (time: number) => void;

  changeVolume: (value: number) => void;
  toggleMute: () => void;
}

interface SavedPlayerState {
  songId: string;
  currentTime: number;
  volume: number;
  isPlaying: boolean;
}

interface MusicPlayerContextType {
  songs: Song[];
  currentSong: Song | undefined;
  currentIndex: number;
  isPlaying: boolean;
  volume: number;
  currentTime: number;
  duration: number;

  setSongs: (songs: Song[]) => void;
  playSong: (index: number) => void;
  togglePlay: () => void;
  previousSong: () => void;
  nextSong: () => void;
  seekSong: (time: number) => void;

  setVolume: (volume: number) => void;

  // Global player compatibility
  changeVolume: (value: number) => void;
  toggleMute: () => void;
}

const MusicPlayerContext =
  createContext<MusicPlayerContextType | null>(null);

const PLAYER_STORAGE_KEY =
  "musicflow-player-state";

export function MusicPlayerProvider({
  children,
}: {
  children: ReactNode;
}) {
  const audioRef =
    useRef<HTMLAudioElement | null>(null);

  const playRequestId =
    useRef(0);

  const shouldPlayRef =
    useRef(false);

  /*
   * =========================================
   * SONGS
   * =========================================
   */

  const [songs, setSongsState] =
    useState<Song[]>([]);

  const [currentSongId, setCurrentSongId] =
    useState<string | null>(null);

  const [isPlaying, setIsPlaying] =
    useState(false);

  const [volume, setVolumeState] =
    useState(0.8);

  const [currentTime, setCurrentTime] =
    useState(0);

  const [duration, setDuration] =
    useState(0);

  const [hydrated, setHydrated] =
    useState(false);

  /*
   * =========================================
   * CURRENT SONG
   * =========================================
   */

  const currentSong =
    currentSongId
      ? songs.find(
          (song) =>
            song.id === currentSongId
        )
      : undefined;

  const currentIndex =
    currentSongId
      ? songs.findIndex(
          (song) =>
            song.id === currentSongId
        )
      : -1;

  /*
   * =========================================
   * INITIAL HYDRATION
   * =========================================
   */

  useEffect(() => {
    try {
      const saved =
        localStorage.getItem(
          PLAYER_STORAGE_KEY
        );

      if (saved) {
        const savedState: SavedPlayerState =
          JSON.parse(saved);

        if (
          typeof savedState.volume ===
          "number"
        ) {
          setVolumeState(
            Math.max(
              0,
              Math.min(
                1,
                savedState.volume
              )
            )
          );
        }

        if (
          typeof savedState.songId ===
            "string" &&
          savedState.songId
        ) {
          setCurrentSongId(
            savedState.songId
          );

          shouldPlayRef.current =
            Boolean(
              savedState.isPlaying
            );
        }
      }
    } catch (error) {
      console.error(
        "PLAYER STATE RESTORE ERROR:",
        error
      );
    }

    setHydrated(true);
  }, []);

  /*
   * =========================================
   * SAVE PLAYER STATE
   * =========================================
   */

  function savePlayerState(
    song: Song | undefined,
    time: number,
    playing: boolean,
    currentVolume: number
  ) {
    if (!song) {
      return;
    }

    try {
      const state: SavedPlayerState = {
        songId: song.id,

        currentTime:
          Number.isFinite(time) &&
          time >= 0
            ? time
            : 0,

        volume: Math.max(
          0,
          Math.min(
            1,
            currentVolume
          )
        ),

        isPlaying: playing,
      };

      localStorage.setItem(
        PLAYER_STORAGE_KEY,
        JSON.stringify(state)
      );
    } catch (error) {
      console.error(
        "PLAYER STATE SAVE ERROR:",
        error
      );
    }
  }

  /*
   * =========================================
   * SET SONGS
   * =========================================
   */

  function setSongs(
    newSongs: Song[]
  ) {
    setSongsState(
      (previousSongs) => {
        const songMap =
          new Map<string, Song>();

        previousSongs.forEach(
          (song) => {
            songMap.set(
              song.id,
              song
            );
          }
        );

        newSongs.forEach(
          (song) => {
            songMap.set(
              song.id,
              song
            );
          }
        );

        return Array.from(
          songMap.values()
        );
      }
    );
  }

  /*
   * =========================================
   * RESTORE SONG AFTER SONG LIST LOAD
   * =========================================
   */

  useEffect(() => {
    if (
      !hydrated ||
      !songs.length
    ) {
      return;
    }

    if (currentSongId) {
      const exists =
        songs.some(
          (song) =>
            song.id ===
            currentSongId
        );

      if (exists) {
        return;
      }
    }

    try {
      const saved =
        localStorage.getItem(
          PLAYER_STORAGE_KEY
        );

      if (saved) {
        const savedState: SavedPlayerState =
          JSON.parse(saved);

        const savedSongExists =
          songs.some(
            (song) =>
              song.id ===
              savedState.songId
          );

        if (savedSongExists) {
          setCurrentSongId(
            savedState.songId
          );

          shouldPlayRef.current =
            Boolean(
              savedState.isPlaying
            );

          return;
        }
      }
    } catch (error) {
      console.error(
        "RESTORE SONG ERROR:",
        error
      );
    }
  }, [
    hydrated,
    songs,
    currentSongId,
  ]);

  /*
   * =========================================
   * AUDIO EVENTS
   * =========================================
   */

  useEffect(() => {
    const audio =
      audioRef.current;

    if (!audio) {
      return;
    }

    const handleTimeUpdate =
      () => {
        setCurrentTime(
          audio.currentTime
        );

        if (currentSong) {
          savePlayerState(
            currentSong,
            audio.currentTime,
            !audio.paused,
            volume
          );
        }
      };

    const handleLoadedMetadata =
      () => {
        const newDuration =
          Number.isFinite(
            audio.duration
          )
            ? audio.duration
            : 0;

        setDuration(
          newDuration
        );

        try {
          const saved =
            localStorage.getItem(
              PLAYER_STORAGE_KEY
            );

          if (
            !saved ||
            !currentSong
          ) {
            return;
          }

          const savedState: SavedPlayerState =
            JSON.parse(saved);

          if (
            savedState.songId !==
            currentSong.id
          ) {
            return;
          }

          const restoreTime =
            Number(
              savedState.currentTime
            );

          if (
            Number.isFinite(
              restoreTime
            ) &&
            restoreTime > 0 &&
            restoreTime <
              newDuration
          ) {
            audio.currentTime =
              restoreTime;

            setCurrentTime(
              restoreTime
            );
          }
        } catch (error) {
          console.error(
            "RESTORE POSITION ERROR:",
            error
          );
        }
      };

    const handlePlay =
      () => {
        setIsPlaying(true);

        if (currentSong) {
          savePlayerState(
            currentSong,
            audio.currentTime,
            true,
            volume
          );
        }
      };

    const handlePause =
      () => {
        setIsPlaying(false);

        if (currentSong) {
          savePlayerState(
            currentSong,
            audio.currentTime,
            false,
            volume
          );
        }
      };

    const handleEnded =
      () => {
        if (!songs.length) {
          return;
        }

        shouldPlayRef.current =
          true;

        setCurrentSongId(
          (currentId) => {
            if (!currentId) {
              return (
                songs[0]?.id ??
                null
              );
            }

            const index =
              songs.findIndex(
                (song) =>
                  song.id ===
                  currentId
              );

            if (
              index < 0 ||
              index >=
                songs.length - 1
            ) {
              return (
                songs[0]?.id ??
                null
              );
            }

            return (
              songs[index + 1]?.id ??
              songs[0]?.id ??
              null
            );
          }
        );
      };

    const handleError =
      () => {
        console.error(
          "GLOBAL AUDIO ERROR:",
          audio.error
        );

        setIsPlaying(false);
      };

    audio.addEventListener(
      "timeupdate",
      handleTimeUpdate
    );

    audio.addEventListener(
      "loadedmetadata",
      handleLoadedMetadata
    );

    audio.addEventListener(
      "play",
      handlePlay
    );

    audio.addEventListener(
      "pause",
      handlePause
    );

    audio.addEventListener(
      "ended",
      handleEnded
    );

    audio.addEventListener(
      "error",
      handleError
    );

    return () => {
      audio.removeEventListener(
        "timeupdate",
        handleTimeUpdate
      );

      audio.removeEventListener(
        "loadedmetadata",
        handleLoadedMetadata
      );

      audio.removeEventListener(
        "play",
        handlePlay
      );

      audio.removeEventListener(
        "pause",
        handlePause
      );

      audio.removeEventListener(
        "ended",
        handleEnded
      );

      audio.removeEventListener(
        "error",
        handleError
      );
    };
  }, [
    currentSong?.id,
    volume,
    songs,
  ]);

  /*
   * =========================================
   * CHANGE SONG
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

    audio.pause();

    setIsPlaying(false);
    setCurrentTime(0);
    setDuration(0);

    audio.src =
      currentSong.audioUrl;

    audio.volume =
      volume;

    audio.load();

    const startPlayback =
      async () => {
        if (cancelled) {
          return;
        }

        if (
          requestId !==
          playRequestId.current
        ) {
          return;
        }

        try {
          const saved =
            localStorage.getItem(
              PLAYER_STORAGE_KEY
            );

          if (saved) {
            const savedState: SavedPlayerState =
              JSON.parse(saved);

            if (
              savedState.songId ===
              currentSong.id
            ) {
              const restoreTime =
                Number(
                  savedState.currentTime
                );

              if (
                Number.isFinite(
                  restoreTime
                ) &&
                restoreTime > 0 &&
                restoreTime <
                  audio.duration
              ) {
                audio.currentTime =
                  restoreTime;

                setCurrentTime(
                  restoreTime
                );
              }
            }
          }
        } catch (error) {
          console.error(
            "RESTORE AUDIO TIME ERROR:",
            error
          );
        }

        if (!shouldPlay) {
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
        } catch (error) {
          if (
            error instanceof
              DOMException &&
            error.name ===
              "AbortError"
          ) {
            return;
          }

          console.error(
            "AUDIO PLAY ERROR:",
            error
          );

          setIsPlaying(false);
        }
      };

    const handleCanPlay =
      () => {
        void startPlayback();
      };

    const handleLoadedMetadata =
      () => {
        void startPlayback();
      };

    if (
      audio.readyState >=
      HTMLMediaElement.HAVE_FUTURE_DATA
    ) {
      void startPlayback();
    } else {
      audio.addEventListener(
        "canplay",
        handleCanPlay,
        {
          once: true,
        }
      );

      audio.addEventListener(
        "loadedmetadata",
        handleLoadedMetadata,
        {
          once: true,
        }
      );
    }

    return () => {
      cancelled = true;

      audio.removeEventListener(
        "canplay",
        handleCanPlay
      );

      audio.removeEventListener(
        "loadedmetadata",
        handleLoadedMetadata
      );
    };
  }, [
    currentSong?.id,
    currentSong?.audioUrl,
  ]);

  /*
   * =========================================
   * AUTO SAVE EVERY SECOND
   * =========================================
   */

  useEffect(() => {
    if (!currentSong) {
      return;
    }

    const interval =
      window.setInterval(
        () => {
          const audio =
            audioRef.current;

          savePlayerState(
            currentSong,
            audio?.currentTime ??
              currentTime,
            isPlaying,
            volume
          );
        },
        1000
      );

    return () => {
      window.clearInterval(
        interval
      );
    };
  }, [
    currentSong?.id,
    currentTime,
    isPlaying,
    volume,
  ]);

  /*
   * =========================================
   * SAVE BEFORE REFRESH / CLOSE
   * =========================================
   */

  useEffect(() => {
    const handleBeforeUnload =
      () => {
        const audio =
          audioRef.current;

        savePlayerState(
          currentSong,
          audio?.currentTime ??
            currentTime,
          !audio?.paused &&
            Boolean(audio),
          volume
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
  }, [
    currentSong,
    currentTime,
    volume,
  ]);

  /*
   * =========================================
   * VOLUME
   * =========================================
   */

  function setVolume(
    volumeValue: number
  ) {
    const safeVolume =
      Math.max(
        0,
        Math.min(
          1,
          volumeValue
        )
      );

    setVolumeState(
      safeVolume
    );

    if (audioRef.current) {
      audioRef.current.volume =
        safeVolume;
    }

    if (currentSong) {
      savePlayerState(
        currentSong,
        audioRef.current
          ?.currentTime ??
          currentTime,
        isPlaying,
        safeVolume
      );
    }
  }

  /*
   * =========================================
   * CHANGE VOLUME
   * =========================================
   *
   * GlobalMusicPlayer uses changeVolume().
   * It internally uses the existing setVolume()
   * implementation.
   */

  function changeVolume(
    value: number
  ) {
    setVolume(value);
  }

  /*
   * =========================================
   * MUTE
   * =========================================
   */

  function toggleMute() {
    if (volume > 0) {
      setVolume(0);
    } else {
      setVolume(0.8);
    }
  }

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

    if (!audio.paused) {
      shouldPlayRef.current =
        false;

      audio.pause();

      savePlayerState(
        currentSong,
        audio.currentTime,
        false,
        volume
      );

      return;
    }

    shouldPlayRef.current =
      true;

    const requestId =
      ++playRequestId.current;

    try {
      if (
        audio.readyState <
        HTMLMediaElement.HAVE_FUTURE_DATA
      ) {
        await new Promise<void>(
          (
            resolve,
            reject
          ) => {
            let finished = false;

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

      setIsPlaying(true);

      savePlayerState(
        currentSong,
        audio.currentTime,
        true,
        volume
      );
    } catch (error) {
      if (
        error instanceof
          DOMException &&
        error.name ===
          "AbortError"
      ) {
        return;
      }

      console.error(
        "PLAY ERROR:",
        error
      );

      setIsPlaying(false);
    }
  }

  /*
   * =========================================
   * PLAY SONG
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

    const selectedSong =
      songs[index];

    if (!selectedSong) {
      return;
    }

    if (
      selectedSong.id ===
      currentSongId
    ) {
      void togglePlay();

      return;
    }

    const audio =
      audioRef.current;

    if (
      currentSong &&
      audio
    ) {
      savePlayerState(
        currentSong,
        audio.currentTime,
        false,
        volume
      );
    }

    shouldPlayRef.current =
      true;

    setCurrentTime(0);
    setDuration(0);

    setCurrentSongId(
      selectedSong.id
    );
  }

  /*
   * =========================================
   * PREVIOUS
   * =========================================
   */

  function previousSong() {
    if (!songs.length) {
      return;
    }

    shouldPlayRef.current =
      true;

    setCurrentSongId(
      (currentId) => {
        if (!currentId) {
          return (
            songs[0]?.id ??
            null
          );
        }

        const index =
          songs.findIndex(
            (song) =>
              song.id ===
              currentId
          );

        if (index <= 0) {
          return (
            songs[
              songs.length - 1
            ]?.id ??
            null
          );
        }

        return (
          songs[index - 1]?.id ??
          songs[0]?.id ??
          null
        );
      }
    );
  }

  /*
   * =========================================
   * NEXT
   * =========================================
   */

  function nextSong() {
    if (!songs.length) {
      return;
    }

    shouldPlayRef.current =
      true;

    setCurrentSongId(
      (currentId) => {
        if (!currentId) {
          return (
            songs[0]?.id ??
            null
          );
        }

        const index =
          songs.findIndex(
            (song) =>
              song.id ===
              currentId
          );

        if (
          index < 0 ||
          index >=
            songs.length - 1
        ) {
          return (
            songs[0]?.id ??
            null
          );
        }

        return (
          songs[index + 1]?.id ??
          songs[0]?.id ??
          null
        );
      }
    );
  }

  /*
   * =========================================
   * SEEK
   * =========================================
   */

  function seekSong(
    time: number
  ) {
    const audio =
      audioRef.current;

    if (
      !audio ||
      !currentSong
    ) {
      return;
    }

    const safeTime =
      Math.max(
        0,
        Math.min(
          time,
          Number.isFinite(
            audio.duration
          )
            ? audio.duration
            : time
        )
      );

    audio.currentTime =
      safeTime;

    setCurrentTime(
      safeTime
    );

    savePlayerState(
      currentSong,
      safeTime,
      isPlaying,
      volume
    );
  }

  /*
   * =========================================
   * PROVIDER
   * =========================================
   */

  return (
    <MusicPlayerContext.Provider
      value={{
        songs,
        currentSong,
        currentIndex,
        isPlaying,
        volume,
        currentTime,
        duration,

        setSongs,
        playSong,
        togglePlay,
        previousSong,
        nextSong,
        seekSong,

        setVolume,
        changeVolume,
        toggleMute,
      }}
    >
      <audio
        ref={audioRef}
        preload="metadata"
      />

      {children}
    </MusicPlayerContext.Provider>
  );
}

/*
 * =========================================
 * HOOK
 * =========================================
 */

export function useMusicPlayer() {
  const context =
    useContext(
      MusicPlayerContext
    );

  if (!context) {
    throw new Error(
      "useMusicPlayer must be used inside MusicPlayerProvider"
    );
  }

  return context;
}

