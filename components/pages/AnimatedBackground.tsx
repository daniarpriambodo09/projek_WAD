// app/components/AnimatedBackground.tsx
"use client"

import { useEffect, useRef } from "react"

export default function AnimatedBackground() {
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    // Jika perlu log atau debug
    console.log("AnimatedBackground mounted")
  }, [])

  return (
    <div className="animated-bg" ref={containerRef}>
      {/* Bubble */}
      <div
        className="bubble"
        style={{
          width: "200px",
          height: "200px",
          left: "10%",
          top: "20%",
          animationDelay: "0s",
        }}
      ></div>
      <div
        className="bubble"
        style={{
          width: "150px",
          height: "150px",
          right: "15%",
          top: "40%",
          animationDelay: "3s",
        }}
      ></div>
      <div
        className="bubble"
        style={{
          width: "180px",
          height: "180px",
          left: "60%",
          bottom: "20%",
          animationDelay: "6s",
        }}
      ></div>
      <div
        className="bubble"
        style={{
          width: "120px",
          height: "120px",
          right: "40%",
          top: "60%",
          animationDelay: "9s",
        }}
      ></div>
      <div
        className="bubble"
        style={{
          width: "160px",
          height: "160px",
          left: "30%",
          bottom: "30%",
          animationDelay: "12s",
        }}
      ></div>

      {/* Gradient Orb */}
      <div
        className="gradient-orb"
        style={{
          width: "400px",
          height: "400px",
          background: "radial-gradient(circle, rgba(93,184,168,0.2), transparent)",
          left: "-100px",
          top: "-100px",
          animationDelay: "0s",
        }}
      ></div>
      <div
        className="gradient-orb"
        style={{
          width: "350px",
          height: "350px",
          background: "radial-gradient(circle, rgba(125,211,192,0.15), transparent)",
          right: "-80px",
          bottom: "-80px",
          animationDelay: "5s",
        }}
      ></div>
      <div
        className="gradient-orb"
        style={{
          width: "300px",
          height: "300px",
          background: "radial-gradient(circle, rgba(70,150,150,0.2), transparent)",
          left: "50%",
          top: "50%",
          animationDelay: "10s",
        }}
      ></div>

      {/* Geometric Shape */}
      <div
        className="geometric-shape"
        style={{
          width: "80px",
          height: "80px",
          background: "linear-gradient(45deg, rgba(125, 211, 192, 0.3), rgba(93, 184, 168, 0.2))",
          left: "20%",
          top: "30%",
          clipPath: "polygon(50% 0%, 100% 50%, 50% 100%, 0% 50%)",
        }}
      ></div>
      <div
        className="geometric-shape"
        style={{
          width: "60px",
          height: "60px",
          background: "linear-gradient(135deg, rgba(70, 150, 150, 0.3), rgba(125, 211, 192, 0.2))",
          right: "25%",
          top: "50%",
          borderRadius: "50%",
          animationDelay: "4s",
        }}
      ></div>
      <div
        className="geometric-shape"
        style={{
          width: "70px",
          height: "70px",
          background: "linear-gradient(90deg, rgba(93, 184, 168, 0.3), rgba(70, 150, 150, 0.2))",
          left: "70%",
          bottom: "40%",
          clipPath: "polygon(50% 0%, 100% 100%, 0% 100%)",
          animationDelay: "8s",
        }}
      ></div>

      {/* Sparkle */}
      <div
        className="sparkle"
        style={{
          left: "15%",
          top: "25%",
          animationDelay: "0s",
        }}
      ></div>
      <div
        className="sparkle"
        style={{
          right: "20%",
          top: "35%",
          animationDelay: "1s",
        }}
      ></div>
      <div
        className="sparkle"
        style={{
          left: "45%",
          top: "15%",
          animationDelay: "2s",
        }}
      ></div>
      <div
        className="sparkle"
        style={{
          right: "35%",
          bottom: "30%",
          animationDelay: "3s",
        }}
      ></div>
      <div
        className="sparkle"
        style={{
          left: "25%",
          bottom: "25%",
          animationDelay: "1.5s",
        }}
      ></div>
      <div
        className="sparkle"
        style={{
          right: "50%",
          top: "60%",
          animationDelay: "2.5s",
        }}
      ></div>
      <div
        className="sparkle"
        style={{
          left: "55%",
          bottom: "35%",
          animationDelay: "3.5s",
        }}
      ></div>

      {/* Wave Pattern */}
      <div className="wave-pattern"></div>

      {/* Particle */}
      {[...Array(12)].map((_, i) => (
        <div
          key={i}
          className="particle"
          style={{
            left: `${10 + (i % 6) * 15}%`,
            bottom: "0",
            animationDelay: `${i * 1.5}s`,
          }}
        ></div>
      ))}

      {/* Pulse Ring */}
      <div
        className="pulse-ring"
        style={{
          width: "100px",
          height: "100px",
          left: "20%",
          top: "40%",
          animationDelay: "0s",
        }}
      ></div>
      <div
        className="pulse-ring"
        style={{
          width: "120px",
          height: "120px",
          right: "30%",
          top: "30%",
          animationDelay: "2s",
        }}
      ></div>
      <div
        className="pulse-ring"
        style={{
          width: "80px",
          height: "80px",
          left: "50%",
          bottom: "35%",
          animationDelay: "4s",
        }}
      ></div>
    </div>
  )
}