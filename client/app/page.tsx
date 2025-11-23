import Image from "next/image";
import AlertStream from "@/components/AlertStream";
import TampingSpeed from "@/components/TampingSpeed";
import TampingStream from "@/components/TampingStream";
import ChartsStream from "@/components/ChartsStream";
import SpeedControl from "@/components/SpeedControl";

export default function HomePage() {
  return (
    <main className="relative min-h-screen bg-white text-[#111827] flex flex-col overflow-x-hidden">
      {/* Gradientes top & bottom */}
      <div className="pointer-events-none absolute inset-x-0 top-0 h-40 bg-gradient-to-b from-[#f3f4f6] to-transparent" />
      <div className="pointer-events-none absolute inset-x-0 bottom-0 h-40 bg-gradient-to-t from-[#f3f4f6] to-transparent" />

      {/* HERO / LOGO */}
      <section className="relative flex flex-col items-center justify-center pt-12 pb-8 px-6 md:px-10">
        <div className="z-10 flex flex-col items-center gap-4 max-w-6xl w-full">
          <div className="flex justify-start w-full">
            <div className="animate-logoFade">
              <Image
                src="/Logo.svg"
                alt="InteLayer"
                width={100}
                height={80}
                priority
              />
            </div>
          </div>

          <div className="text-center space-y-1 w-full">
            <h1 className="text-3xl md:text-4xl font-semibold tracking-[0.25em] uppercase text-[#111827]/80">
              InteLayer
            </h1>
            <p className="text-sm md:text-base text-[#6b7280] max-w-2xl mx-auto">
              Real-time confidence monitoring for rail tamping operations,
              unified in a single Omniverse view.
            </p>
          </div>
        </div>
      </section>

      {/* OMNIVERSE 3D WINDOW – FULL WIDTH */}
      <section className="w-full pb-10">
        <div className="w-full border-y border-[#e5e7eb] bg-white/90 backdrop-blur-sm shadow-[0_18px_40px_rgba(15,23,42,0.06)]">
          <div className="flex items-center justify-between px-6 md:px-10 py-4 border-b border-[#f3f4f6] text-[11px] uppercase tracking-[0.25em] text-[#9ca3af]">
            <span>Omniverse View</span>
            <span>Realtime · 3D</span>
          </div>

          <div className="w-full aspect-[16/8] md:aspect-[16/7] bg-[#f3f4f6]">
          </div>
        </div>
      </section>

      {/* SYSTEM METRICS */}
      <section className="px-6 md:px-10 pb-10">
        <div className="max-w-6xl mx-auto space-y-4">
          <h2 className="text-xs md:text-sm tracking-[0.25em] uppercase text-[#9ca3af]">
            System Metrics
          </h2>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="rounded-3xl border border-[#e5e7eb] bg-white p-6 shadow-[0_16px_30px_rgba(15,23,42,0.06)]">
              <ChartsStream />
            </div>
            <div className="rounded-3xl border border-[#e5e7eb] bg-white p-6 shadow-[0_16px_30px_rgba(15,23,42,0.06)]">
              <TampingStream />
            </div>
          </div>
        </div>
      </section>

      {/* CONTROLS & SPEED */}
      <section className="px-6 md:px-10 pb-10">
        <div className="max-w-6xl mx-auto space-y-4">
          <h2 className="text-xs md:text-sm tracking-[0.25em] uppercase text-[#9ca3af]">
            Control Panel
          </h2>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="rounded-3xl border border-[#e5e7eb] bg-white p-6 shadow-[0_16px_30px_rgba(15,23,42,0.06)]">
              <SpeedControl />
            </div>
            <div className="rounded-3xl border border-[#e5e7eb] bg-white p-6 shadow-[0_16px_30px_rgba(15,23,42,0.06)]">
              <TampingSpeed />
            </div>
          </div>
        </div>
      </section>

      {/* ALERT STREAM */}
      <section className="px-6 md:px-10 pb-16">
        <div className="max-w-6xl mx-auto space-y-4">
          <h2 className="text-xs md:text-sm tracking-[0.25em] uppercase text-[#9ca3af]">
            Live Alerts
          </h2>

          <div className="rounded-3xl border border-[#e5e7eb] bg-white p-6 shadow-[0_16px_30px_rgba(15,23,42,0.06)]">
            <AlertStream />
          </div>
        </div>
      </section>
    </main>
  );
}
