// siDesa/components/AnimatedBackground.tsx
"use client"

import { useEffect, useRef } from "react"

export default function AnimatedBackground() {
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    console.log("AnimatedBackground mounted - Tech-Nature Fusion")
  }, [])

  return (
    <div className="animated-bg" ref={containerRef}>
      {/* Scanning line effect */}
      <div className="scan-line"></div>

      {/* Bubble - Glowing emerald orbs */}
      <div
        className="bubble"
        style={{
          width: "320px",
          height: "320px",
          left: "5%",
          top: "15%",
          animationDelay: "0s",
        }}
      ></div>
      <div
        className="bubble"
        style={{
          width: "240px",
          height: "240px",
          right: "8%",
          top: "35%",
          animationDelay: "4s",
        }}
      ></div>
      <div
        className="bubble"
        style={{
          width: "280px",
          height: "280px",
          left: "52%",
          bottom: "12%",
          animationDelay: "8s",
        }}
      ></div>
      <div
        className="bubble"
        style={{
          width: "200px",
          height: "200px",
          right: "32%",
          top: "52%",
          animationDelay: "12s",
        }}
      ></div>
      <div
        className="bubble"
        style={{
          width: "220px",
          height: "220px",
          left: "22%",
          bottom: "22%",
          animationDelay: "16s",
        }}
      ></div>
      <div
        className="bubble"
        style={{
          width: "180px",
          height: "180px",
          right: "58%",
          top: "68%",
          animationDelay: "20s",
        }}
      ></div>

      {/* Gradient Orb - Ambient glow */}
      <div
        className="gradient-orb"
        style={{
          width: "550px",
          height: "550px",
          background: "radial-gradient(circle, rgba(16, 185, 129, 0.12), transparent)",
          left: "-180px",
          top: "-180px",
          animationDelay: "0s",
        }}
      ></div>
      <div
        className="gradient-orb"
        style={{
          width: "500px",
          height: "500px",
          background: "radial-gradient(circle, rgba(20, 184, 166, 0.15), transparent)",
          right: "-120px",
          bottom: "-120px",
          animationDelay: "6s",
        }}
      ></div>
      <div
        className="gradient-orb"
        style={{
          width: "450px",
          height: "450px",
          background: "radial-gradient(circle, rgba(34, 211, 238, 0.1), transparent)",
          left: "42%",
          top: "42%",
          animationDelay: "12s",
        }}
      ></div>
      <div
        className="gradient-orb"
        style={{
          width: "400px",
          height: "400px",
          background: "radial-gradient(circle, rgba(16, 185, 129, 0.08), transparent)",
          left: "18%",
          bottom: "18%",
          animationDelay: "18s",
        }}
      ></div>
      <div
        className="gradient-orb"
        style={{
          width: "380px",
          height: "380px",
          background: "radial-gradient(circle, rgba(6, 182, 212, 0.1), transparent)",
          right: "45%",
          top: "55%",
          animationDelay: "24s",
        }}
      ></div>

      {/* Geometric Shape - Tech elements */}
      <div
        className="geometric-shape"
        style={{
          width: "110px",
          height: "110px",
          background: "linear-gradient(45deg, rgba(52, 211, 153, 0.25), rgba(34, 211, 238, 0.15))",
          left: "16%",
          top: "26%",
          clipPath: "polygon(50% 0%, 100% 50%, 50% 100%, 0% 50%)",
          border: "1px solid rgba(34, 211, 238, 0.3)",
        }}
      ></div>
      <div
        className="geometric-shape"
        style={{
          width: "90px",
          height: "90px",
          background: "linear-gradient(135deg, rgba(16, 185, 129, 0.22), rgba(20, 184, 166, 0.15))",
          right: "20%",
          top: "45%",
          borderRadius: "50%",
          animationDelay: "5s",
          border: "1px solid rgba(16, 185, 129, 0.3)",
        }}
      ></div>
      <div
        className="geometric-shape"
        style={{
          width: "100px",
          height: "100px",
          background: "linear-gradient(90deg, rgba(34, 211, 238, 0.2), rgba(16, 185, 129, 0.15))",
          left: "62%",
          bottom: "35%",
          clipPath: "polygon(50% 0%, 100% 100%, 0% 100%)",
          animationDelay: "10s",
          border: "1px solid rgba(34, 211, 238, 0.25)",
        }}
      ></div>
      <div
        className="geometric-shape"
        style={{
          width: "80px",
          height: "80px",
          background: "linear-gradient(180deg, rgba(20, 184, 166, 0.2), rgba(16, 185, 129, 0.12))",
          left: "38%",
          top: "62%",
          borderRadius: "30%",
          animationDelay: "15s",
          border: "1px solid rgba(20, 184, 166, 0.3)",
        }}
      ></div>
      <div
        className="geometric-shape"
        style={{
          width: "70px",
          height: "70px",
          background: "linear-gradient(225deg, rgba(34, 211, 238, 0.18), rgba(6, 182, 212, 0.12))",
          right: "48%",
          bottom: "48%",
          clipPath: "polygon(30% 0%, 70% 0%, 100% 30%, 100% 70%, 70% 100%, 30% 100%, 0% 70%, 0% 30%)",
          animationDelay: "20s",
          border: "1px solid rgba(34, 211, 238, 0.28)",
        }}
      ></div>

      {/* Sparkle - Neon stars */}
      {[
        { left: "10%", top: "20%", delay: "0s" },
        { right: "15%", top: "30%", delay: "1s" },
        { left: "40%", top: "10%", delay: "2s" },
        { right: "28%", bottom: "25%", delay: "3s" },
        { left: "20%", bottom: "20%", delay: "1.5s" },
        { right: "45%", top: "55%", delay: "2.5s" },
        { left: "50%", bottom: "30%", delay: "3.5s" },
        { right: "22%", top: "72%", delay: "0.8s" },
        { left: "65%", top: "40%", delay: "1.8s" },
        { right: "60%", bottom: "55%", delay: "2.8s" },
        { left: "8%", top: "60%", delay: "3.2s" },
        { right: "10%", bottom: "15%", delay: "0.5s" },
      ].map((pos, i) => (
        <div
          key={`sparkle-${i}`}
          className="sparkle"
          style={{
            ...pos,
            animationDelay: pos.delay,
          }}
        ></div>
      ))}

      {/* Wave Pattern */}
      <div className="wave-pattern"></div>

      {/* Particle - Rising data points */}
      {[...Array(18)].map((_, i) => (
        <div
          key={`particle-${i}`}
          className="particle"
          style={{
            left: `${6 + (i % 8) * 12}%`,
            bottom: "0",
            animationDelay: `${i * 1.5}s`,
          }}
        ></div>
      ))}

      {/* Pulse Ring - Scanning radar */}
      {[
        { width: "140px", left: "16%", top: "36%", delay: "0s" },
        { width: "160px", right: "26%", top: "26%", delay: "2s" },
        { width: "120px", left: "46%", bottom: "30%", delay: "4s" },
        { width: "130px", right: "12%", bottom: "42%", delay: "3s" },
        { width: "110px", left: "28%", top: "65%", delay: "5s" },
      ].map((ring, i) => (
        <div
          key={`ring-${i}`}
          className="pulse-ring"
          style={{
            width: ring.width,
            height: ring.width,
            left: ring.left,
            right: ring.right,
            top: ring.top,
            bottom: ring.bottom,
            animationDelay: ring.delay,
          }}
        ></div>
      ))}
    </div>
  )
}