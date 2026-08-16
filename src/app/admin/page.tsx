import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { verifyAdminSession } from "@/lib/auth";
import AddSongForm from "./components/AddSongForm";
import SongList from "./components/SongList";
import SettingsForm from "./components/SettingsForm";

export default async function AdminPage() {
  const cookieStore = await cookies();

  const token =
    cookieStore.get("music_flow_admin")?.value;

  if (!token) {
    redirect("/admin/login");
  }

  const session =
    await verifyAdminSession(token);

  if (!session) {
    redirect("/admin/login");
  }

  return (
    <main className="min-h-screen bg-[#070707] px-5 py-10 text-white">
      <div className="mx-auto max-w-5xl">

        {/* Header */}
        <div>
          <p className="text-sm text-white/40">
            Music Flow
          </p>

          <h1 className="mt-2 text-4xl font-bold">
            Admin Dashboard
          </h1>

          <p className="mt-2 text-white/40">
            Welcome, {String(session.username)}
          </p>
        </div>

        {/* Dashboard Stats */}
        <div className="mt-10 grid gap-4 sm:grid-cols-3">

          <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-6">
            <p className="text-sm text-white/40">
              Songs
            </p>

            <p className="mt-2 text-3xl font-bold">
              0
            </p>
          </div>

          <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-6">
            <p className="text-sm text-white/40">
              Categories
            </p>

            <p className="mt-2 text-3xl font-bold">
              4
            </p>
          </div>

          <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-6">
            <p className="text-sm text-white/40">
              Status
            </p>

            <p className="mt-2 text-lg font-medium">
              Connected
            </p>
          </div>
        </div>

        {/* Site Settings */}
        <SettingsForm />

        {/* Add Song */}
        <AddSongForm />

        {/* Song Library */}
        <SongList />

      </div>
    </main>
  );
}