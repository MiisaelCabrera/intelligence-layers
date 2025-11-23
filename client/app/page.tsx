import AlertStream from '@/components/AlertStream';
import Scene3D from '@/components/Scene3D';

export default function HomePage() {
  return (
    <main className="min-h-screen flex flex-col items-center justify-center gap-6">
      <h1 className="text-3xl font-bold">Demo 3D</h1>
      <Scene3D />
      <AlertStream />
    </main>
  );
}
