import AlertStream from '@/components/AlertStream';
import Scene3D from '@/components/Scene3D';
import TampingStream from '@/components/TampingStream';

export default function HomePage() {
  return (
    <main className="min-h-screen flex flex-col items-center justify-center gap-8 py-12">
      <h1 className="text-3xl font-bold">Demo 3D</h1>
      <Scene3D />
      <div className="w-full max-w-6xl grid grid-cols-1 lg:grid-cols-2 gap-8 px-4">
        <AlertStream />
        <TampingStream />
      </div>
    </main>
  );
}
