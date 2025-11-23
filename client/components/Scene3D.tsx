'use client'

import { Canvas, useFrame } from '@react-three/fiber'
import { OrbitControls } from '@react-three/drei'
import { useRef } from 'react'
import type { Mesh } from 'three'

type SpinningBoxProps = {
  color?: string
  speed?: number
}

function SpinningBox({ color = '#ff66cc', speed = 1 }: SpinningBoxProps) {
  const meshRef = useRef<Mesh | null>(null)

  useFrame((_, delta) => {
    if (!meshRef.current) return
    meshRef.current.rotation.y += delta * speed
    meshRef.current.rotation.x += delta * speed * 0.5
  })

  return (
    <mesh ref={meshRef}>
      <boxGeometry args={[1, 1, 1]} />
      <meshStandardMaterial color={color} />
    </mesh>
  )
}

export default function Scene3D() {
  return (
    <div style={{ width: '100%', height: 400 }}>
      <Canvas camera={{ position: [3, 3, 3] }}>
        <ambientLight intensity={0.4} />
        <directionalLight position={[5, 5, 5]} intensity={1} />
        <SpinningBox color="#ff66cc" speed={1.2} />
        <OrbitControls />
      </Canvas>
    </div>
  )
}
