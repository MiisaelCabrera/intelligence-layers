import AlertStream from "@/components/AlertStream";
import Scene3D from "@/components/Scene3D";
import TampingSpeed from "@/components/TampingSpeed";
import TampingStream from "@/components/TampingStream";
import ChartsStream from "@/components/ChartsStream";

export default function HomePage() {
  return (
    <main className="min-h-screen flex flex-col items-center justify-center gap-8 py-12">
      <h1 className="text-3xl font-bold">Demo 3D</h1>
      <Scene3D />
      <div className="w-full max-w-6xl grid grid-cols-1 lg:grid-cols-2 gap-8 px-4">
        <ChartsStream />
        <AlertStream />
        <TampingStream />
      </div>
      <TampingSpeed />
    </main>
  );
}
