import Image from "next/image";
import AlertStream from "@/components/AlertStream";
import TampingSpeed from "@/components/TampingSpeed";
import TampingStream from "@/components/TampingStream";
import ChartsStream from "@/components/ChartsStream";
import SpeedControl from "@/components/SpeedControl";

export default function HomePage() {
  return (
    <main className="relative min-h-screen bg-white text-[#111827] flex flex-col overflow-x-hidden px-20">
      {/* HERO / LOGO */}
      <section className="relative flex flex-col items-center justify-center pt-12 pb-8 md:px-10">
        <div className="z-10 flex flex-col items-center gap-4 max-w-6xl w-full">
          <div className="flex justify-center w-full">
            <div className="animate-logoFade">
              <Image
                src="/Logo.svg"
                alt="InterLayer"
                width={100}
                height={80}
                priority
              />
            </div>
          </div>

          <div className="text-center space-y-1 w-full">
            <h1 className="text-3xl md:text-4xl font-semibold tracking-[0.25em] uppercase text-[#111827]/80">
              InterLayer
            </h1>
            <p className="text-sm md:text-base text-[#6b7280] max-w-2xl mx-auto">
              Real-time confidence monitoring for rail tamping operations,
              unified in a single Omniverse view.
            </p>
          </div>
        </div>
      </section>

      {/* CONTROLS & SPEED */}
      <section>
        <div className="">
          <h2 className="text-xs md:text-sm tracking-[0.25em] uppercase text-[#9ca3af]">
            Control Panel
          </h2>

          <div className="flex items-stretch justify-between gap-4  px-2 py-4 min-h-[22rem]">
            {/* Columna izquierda */}
            <div className="flex flex-col w-full border-y border-[#e5e7eb] bg-white/90 backdrop-blur-sm shadow-[0_18px_40px_rgba(15,23,42,0.06)] rounded-3xl overflow-hidden">
              <div className="flex items-center justify-between px-6 md:px-10 py-4 border-b border-[#f3f4f6] text-[11px] uppercase tracking-[0.25em] text-[#9ca3af]">
                <span>Omniverse View</span>
                <span>Realtime · 3D</span>
              </div>

              {/* Este div ocupa el alto restante */}
              <div className="w-full flex-1 flex items-center justify-center bg-[#f3f4f6]">
                <div class="sketchfab-embed-wrapper">
                  {" "}
                  <iframe
                    title="Tamping Machine"
                    frameborder="0"
                    allowfullscreen
                    mozallowfullscreen="true"
                    webkitallowfullscreen="true"
                    allow="autoplay; fullscreen; xr-spatial-tracking"
                    xr-spatial-tracking
                    execution-while-out-of-viewport
                    execution-while-not-rendered
                    web-share
                    src="https://sketchfab.com/models/93cb72a8bcc6415ea5e4ff3e861f396a/embed?autostart=1&preload=1&transparent=1"
                  >
                    {" "}
                  </iframe>{" "}
                </div>
              </div>
            </div>

            {/* Columna derecha */}
            <div className="flex flex-col rounded-3xl border border-[#e5e7eb] bg-white p-6  gap-4">
              <TampingSpeed />
              <AlertStream />
            </div>
          </div>
        </div>
      </section>

      <section className="my-25">
        <h2 className="text-xs md:text-sm tracking-[0.25em] uppercase text-[#9ca3af]">
          Sensor Charts
        </h2>
        <br></br>
        <ChartsStream />
      </section>

      {/* SYSTEM METRICS */}
      <section className=" md: pb-10 w-full ">
        <div className=" space-y-4 w-full">
          <h2 className="text-xs md:text-sm tracking-[0.25em] uppercase text-[#9ca3af]">
            System Metrics
          </h2>

          <div className="flex flex-row w-full justify-between rounded-3xl border border-[#e5e7eb] bg-white p-6 shadow-[0_16px_30px_rgba(15,23,42,0.06)] gap-4">
            <TampingStream />
            <SpeedControl />
          </div>
        </div>
      </section>
    </main>
  );
}
