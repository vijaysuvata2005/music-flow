// "use client";

// import {
//   ChevronLeft,
//   ChevronRight,
//   Pause,
//   Play,
//   Volume2,
//   VolumeX,
// } from "lucide-react";

// import { useMusicPlayer } from "@/context/MusicPlayerContext";

// export default function MusicPlayer() {
//   const {
//     currentSong,
//     isPlaying,
//     volume,
//     currentTime,
//     duration,
//     togglePlay,
//     previousSong,
//     nextSong,
//     seekSong,
//     setVolume,
//   } = useMusicPlayer();

//   if (!currentSong) {
//     return null;
//   }

//   const safeDuration =
//     duration > 0
//       ? duration
//       : currentSong.duration ?? 0;

//   const progress =
//     safeDuration > 0
//       ? Math.min(
//           100,
//           (currentTime / safeDuration) * 100
//         )
//       : 0;

//   function formatTime(seconds: number) {
//     if (
//       !Number.isFinite(seconds) ||
//       seconds <= 0
//     ) {
//       return "0:00";
//     }

//     const minutes = Math.floor(
//       seconds / 60
//     );

//     const remaining = Math.floor(
//       seconds % 60
//     );

//     return `${minutes}:${remaining
//       .toString()
//       .padStart(2, "0")}`;
//   }

//   return (
//     <div className="fixed bottom-0 left-0 right-0 z-50 border-t border-white/[0.08] bg-black/75 shadow-[0_-15px_60px_rgba(0,0,0,0.5)] backdrop-blur-2xl">
      
//       <div className="mx-auto flex max-w-7xl items-center gap-2 px-3 py-2.5 sm:gap-3 sm:px-5 sm:py-3">

//         {/* COVER */}

//         <div className="relative h-10 w-10 shrink-0 overflow-hidden rounded-xl sm:h-11 sm:w-11">
//           <img
//             src={currentSong.coverImage}
//             alt={currentSong.title}
//             className={`h-full w-full object-cover transition duration-700 ${
//               isPlaying ? "scale-110" : ""
//             }`}
//           />
//         </div>

//         {/* SONG INFO */}

//         <div className="min-w-0 flex-1">
//           <p className="truncate text-xs font-semibold sm:text-sm">
//             {currentSong.title}
//           </p>

//           <p className="truncate text-[10px] text-white/30 sm:text-xs">
//             {currentSong.artist}
//           </p>
//         </div>

//         {/* PREVIOUS */}

//         <button
//           type="button"
//           onClick={previousSong}
//           className="hidden rounded-full p-2 text-white/35 transition hover:bg-purple-500/10 hover:text-white sm:block"
//           aria-label="Previous song"
//         >
//           <ChevronLeft size={19} />
//         </button>

//         {/* PLAY / PAUSE */}

//         <button
//           type="button"
//           onClick={togglePlay}
//           aria-label={
//             isPlaying
//               ? "Pause song"
//               : "Play song"
//           }
//           className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-gradient-to-r from-fuchsia-400 via-purple-400 to-cyan-400 text-black shadow-[0_4px_30px_rgba(168,85,247,0.22)] transition-all duration-300 hover:scale-110 active:scale-95 sm:h-11 sm:w-11"
//         >
//           {isPlaying ? (
//             <Pause
//               size={17}
//               fill="currentColor"
//             />
//           ) : (
//             <Play
//               size={17}
//               fill="currentColor"
//             />
//           )}
//         </button>

//         {/* NEXT */}

//         <button
//           type="button"
//           onClick={nextSong}
//           className="hidden rounded-full p-2 text-white/35 transition hover:bg-cyan-500/10 hover:text-white sm:block"
//           aria-label="Next song"
//         >
//           <ChevronRight size={19} />
//         </button>

//         {/* VOLUME */}

//         <div className="hidden items-center gap-2 md:flex">
//           <button
//             type="button"
//             onClick={() =>
//               setVolume(
//                 volume > 0 ? 0 : 0.8
//               )
//             }
//             className="text-white/35 transition hover:text-white"
//             aria-label={
//               volume === 0
//                 ? "Unmute"
//                 : "Mute"
//             }
//           >
//             {volume === 0 ? (
//               <VolumeX size={16} />
//             ) : (
//               <Volume2 size={16} />
//             )}
//           </button>

//           <input
//             type="range"
//             min="0"
//             max="1"
//             step="0.01"
//             value={volume}
//             onChange={(event) =>
//               setVolume(
//                 Number(
//                   event.target.value
//                 )
//               )
//             }
//             className="w-20 accent-purple-400"
//             aria-label="Volume"
//           />
//         </div>
//       </div>

//       {/* PROGRESS */}

//       <div className="absolute left-0 right-0 top-0 h-[2px] bg-white/[0.04]">
//         <div
//           className="h-full bg-gradient-to-r from-fuchsia-400 via-purple-400 to-cyan-400 transition-[width] duration-300"
//           style={{
//             width: `${progress}%`,
//           }}
//         />
//       </div>

//       {/* MOBILE PROGRESS */}

//       <div className="flex items-center gap-2 px-3 pb-1 sm:hidden">
//         <span className="w-8 text-[8px] text-white/25">
//           {formatTime(currentTime)}
//         </span>

//         <input
//           type="range"
//           min="0"
//           max={safeDuration || 0}
//           value={Math.min(
//             currentTime,
//             safeDuration || 0
//           )}
//           disabled={!safeDuration}
//           onChange={(event) =>
//             seekSong(
//               Number(event.target.value)
//             )
//           }
//           className="h-1 flex-1 cursor-pointer appearance-none rounded-full bg-white/10 accent-purple-400 disabled:cursor-not-allowed"
//           aria-label="Song progress"
//         />

//         <span className="w-8 text-right text-[8px] text-white/25">
//           {formatTime(safeDuration)}
//         </span>
//       </div>
//     </div>
//   );
// }