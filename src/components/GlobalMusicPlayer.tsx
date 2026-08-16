"use client";

import {
  ChevronLeft,
  ChevronRight,
  Music2,
  Pause,
  Play,
  Volume2,
  VolumeX,
} from "lucide-react";

import {
  useMusicPlayer,
} from "@/context/MusicPlayerContext";

function formatTime(
  seconds: number
) {
  if (
    !Number.isFinite(seconds) ||
    seconds < 0
  ) {
    return "0:00";
  }

  const minutes =
    Math.floor(seconds / 60);

  const remaining =
    Math.floor(seconds % 60);

  return `${minutes}:${remaining
    .toString()
    .padStart(2, "0")}`;
}

export default function GlobalMusicPlayer() {
  const {
    currentSong,
    isPlaying,
    currentTime,
    duration,
    volume,

    togglePlay,
    nextSong,
    previousSong,
    seekSong,
    changeVolume,
    toggleMute,
  } = useMusicPlayer();

  if (!currentSong) {
    return null;
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
    <>
      <div className="fixed bottom-0 left-0 right-0 z-[100] border-t border-white/[0.08] bg-black/90 shadow-[0_-15px_60px_rgba(0,0,0,0.6)] backdrop-blur-2xl">

        {/* PROGRESS */}

        <div className="absolute left-0 right-0 top-0 h-[2px] bg-white/[0.04]">
          <div
            className="h-full bg-gradient-to-r from-fuchsia-400 via-purple-400 to-cyan-400"
            style={{
              width: `${progress}%`,
            }}
          />
        </div>

        <div className="mx-auto flex max-w-7xl items-center gap-2 px-3 pb-2.5 pt-3 sm:gap-3 sm:px-5 sm:pb-3">

          {/* COVER */}

          <div className="h-10 w-10 shrink-0 overflow-hidden rounded-xl sm:h-11 sm:w-11">
            {currentSong.coverImage ? (
              <img
                src={
                  currentSong.coverImage
                }
                alt={
                  currentSong.title
                }
                className={`h-full w-full object-cover ${
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

          {/* MUTE */}

          <button
            type="button"
            onClick={
              toggleMute
            }
            className="flex h-9 w-9 shrink-0 items-center justify-center text-white/40 hover:text-white md:hidden"
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
              className="flex h-8 w-8 items-center justify-center text-white/35 hover:text-white"
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
              className="w-20 accent-purple-400"
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

        {/* SEEK */}

        <div className="px-3 pb-2 sm:px-5">

          <input
            type="range"
            min="0"
            max={duration || 0}
            value={Math.min(
              currentTime,
              duration || 0
            )}
            onChange={(event) =>
              seekSong(
                Number(
                  event.target.value
                )
              )
            }
            disabled={!duration}
            className="h-1.5 w-full cursor-pointer appearance-none rounded-full accent-purple-400 disabled:cursor-not-allowed"
            aria-label="Song progress"
          />

          <div className="mt-1 flex justify-between text-[9px] text-white/20 sm:hidden">
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
    </>
  );
}