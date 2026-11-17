"use client";

import { motion, useReducedMotion, type HTMLMotionProps } from "framer-motion";

/**
 * Official DENR seal with restrained motion.
 *
 * The artwork is the real seal (public/brand/denr-seal.png). Motion is additive
 * only — a slow breath, an ambient glow and an occasional sheen. The seal's
 * geometry is never altered, and everything stops under prefers-reduced-motion
 * or with variant="static".
 */
export type LogoVariant = "default" | "ambient" | "breathing" | "focus" | "static";

export interface LogoProps extends Omit<HTMLMotionProps<"div">, "children"> {
  /** Visual size (width = height). */
  size?: number;
  variant?: LogoVariant;
  className?: string;
  "aria-label"?: string;
}

const TIMINGS = {
  breathe: 11,
  glow: 11,
  sheen: 13,
} as const;

const SEAL_SRC = "/brand/denr-seal.png";

export function Logo({
  size = 48,
  variant = "default",
  className = "",
  "aria-label": ariaLabel = "Department of Environment and Natural Resources",
  style,
  ...props
}: LogoProps) {
  const reduced = useReducedMotion();
  const live = !reduced && variant !== "static";

  const breathe = live && (variant === "default" || variant === "breathing");
  const glow = live && (variant === "default" || variant === "ambient");
  const sheen = live && variant === "default";

  return (
    <motion.div
      role="img"
      aria-label={ariaLabel}
      className={`denr-logo ${className}`}
      style={{ width: size, height: size, position: "relative", isolation: "isolate", ...style }}
      whileHover={variant === "focus" && live ? { scale: 1.06 } : undefined}
      whileTap={live ? { scale: 0.985 } : undefined}
      {...props}
    >
      {glow ? (
        <motion.div
          aria-hidden
          className="denr-seal-glow"
          style={{
            position: "absolute",
            inset: "-15%",
            zIndex: -1,
            borderRadius: "50%",
            background: "radial-gradient(circle, rgba(185,133,46,0.30), rgba(185,133,46,0) 70%)",
            filter: "blur(7px)",
            transformOrigin: "center",
          }}
          animate={{ scale: [0.93, 1.06, 0.93], opacity: [0.4, 0.85, 0.4] }}
          transition={{ duration: TIMINGS.glow, repeat: Infinity, ease: "easeInOut" }}
        />
      ) : null}

      <motion.img
        className="denr-seal-img"
        src={SEAL_SRC}
        alt=""
        aria-hidden="true"
        width={512}
        height={512}
        draggable={false}
        style={{
          display: "block",
          width: "100%",
          height: "100%",
          objectFit: "contain",
          transformOrigin: "center",
          userSelect: "none",
          pointerEvents: "none",
        }}
        animate={breathe ? { scale: [1, 1.018, 1] } : undefined}
        transition={breathe ? { duration: TIMINGS.breathe, repeat: Infinity, ease: "easeInOut" } : undefined}
      />

      {sheen ? (
        <div
          aria-hidden
          className="denr-seal-sheen"
          style={{
            position: "absolute",
            inset: 0,
            borderRadius: "50%",
            overflow: "hidden",
            pointerEvents: "none",
          }}
        >
          <motion.div
            style={{
              position: "absolute",
              inset: "-40%",
              background:
                "linear-gradient(115deg, transparent 42%, rgba(255,255,255,0.4) 50%, transparent 58%)",
              transformOrigin: "center",
            }}
            animate={{ rotate: -35, x: ["-160%", "160%"] }}
            transition={{ duration: TIMINGS.sheen, repeat: Infinity, ease: "easeInOut" }}
          />
        </div>
      ) : null}

      <div
        aria-hidden
        className="denr-seal-focus-ring"
        style={{
          position: "absolute",
          inset: "-4px",
          borderRadius: "50%",
          border: "2px solid #274A3B",
          opacity: 0,
          pointerEvents: "none",
          transition: "opacity .2s ease",
        }}
      />
    </motion.div>
  );
}

/** Horizontal lockup — official seal beside a short wordmark. */
export interface LogoLockupProps {
  size?: number;
  variant?: LogoVariant;
  className?: string;
  showTagline?: boolean;
  style?: React.CSSProperties;
  "aria-label"?: string;
}

export function LogoLockup({
  size = 48,
  variant = "default",
  className = "",
  showTagline = false,
  style,
  "aria-label": ariaLabel,
}: LogoLockupProps) {
  return (
    <div
      className={`denr-lockup ${className}`}
      style={{ gap: size * 0.26, height: size, ...style }}
      role="img"
      aria-label={ariaLabel || "Department of Environment and Natural Resources"}
    >
      <Logo size={size} variant={variant} aria-label="DENR" />
      <div className="flex flex-col justify-center leading-none">
        <span
          className="font-display font-semibold tracking-tightest text-forest-950"
          style={{ fontSize: size * 0.42 }}
        >
          DENR
        </span>
        {showTagline ? (
          <span
            className="mt-1 uppercase text-forest-600"
            style={{ fontSize: Math.max(7, size * 0.15), letterSpacing: "0.14em" }}
          >
            Environment &amp; Natural Resources
          </span>
        ) : null}
      </div>
    </div>
  );
}

/** Standalone seal for icon slots — matches the browser favicon exactly. */
export function LogoIcon({ size = 32, className = "" }: { size?: number; className?: string }) {
  return (
    <img
      src={SEAL_SRC}
      alt="DENR"
      width={size}
      height={size}
      className={className}
      style={{ width: size, height: size, display: "block" }}
      draggable={false}
    />
  );
}

/** ENVIS logomark — the custom shield with mountain, leaves, waves, and stars.
 *  Used in README, public headers, and anywhere the ENVIS brand appears. */
export function EnvisLogo({
  size = 48,
  className = "",
  "aria-label": ariaLabel = "ENVIS · DENR Region VII",
  ...props
}: React.SVGProps<SVGSVGElement> & { size?: number; className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 256 256"
      width={size}
      height={size}
      className={`envis-logo ${className}`}
      role="img"
      aria-label={ariaLabel}
      {...props}
    >
      <defs>
        <linearGradient id="forestGrad" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#1B4D3A"/>
          <stop offset="100%" stopColor="#0F2E1F"/>
        </linearGradient>
        <linearGradient id="brassGrad" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#C8A05E"/>
          <stop offset="100%" stopColor="#9D7B3E"/>
        </linearGradient>
        <linearGradient id="waterGrad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#2E86C1"/>
          <stop offset="100%" stopColor="#1B4F72"/>
        </linearGradient>
      </defs>

      {/* Outer shield ring (brass) */}
      <path d="M128 12 C192.5 12 244 50 244 128 C244 206 128 244 128 244 C128 244 12 206 12 128 C12 50 63.5 12 128 12 Z M128 24 C75.5 24 32 53.5 32 128 C32 202.5 128 232 128 232 C128 232 224 202.5 224 128 C224 53.5 180.5 24 128 24 Z"
        fill="url(#brassGrad)"/>

      {/* Inner shield field (forest green) */}
      <path d="M128 28 C180 28 220 56 220 128 C220 200 128 226 128 226 C128 226 36 200 36 128 C36 56 76 28 128 28 Z"
        fill="url(#forestGrad)"/>

      {/* Central mountain silhouette */}
      <path d="M128 168 L88 96 L128 52 L168 96 Z"
        fill="#0D2318" opacity="0.6"/>

      {/* Mountain highlight */}
      <path d="M128 52 L108 96 L128 168 L148 96 Z"
        fill="none" stroke="rgba(200,160,94,0.35)" strokeWidth="1.5"/>

      {/* Three stylized leaves (forest cover) */}
      <g fill="#2E7D3E">
        <path d="M74 92 C66 86 60 78 64 70 C68 62 78 58 86 64 C94 70 92 82 84 88 C78 92 74 92 74 92 Z"/>
        <path d="M128 78 C116 70 106 60 112 52 C118 44 134 40 144 48 C154 56 148 70 138 78 C130 84 128 78 128 78 Z"/>
        <path d="M182 92 C190 86 196 78 192 70 C188 62 178 58 170 64 C162 70 164 82 172 88 C178 92 182 92 182 92 Z"/>
      </g>

      {/* Water waves (coastal/marine) */}
      <g fill="none" stroke="url(#waterGrad)" strokeWidth="2" strokeLinecap="round" opacity="0.85">
        <path d="M56 180 Q100 172 128 180 T200 180"/>
        <path d="M64 196 Q100 188 128 196 T192 196" strokeWidth="1.5" opacity="0.6"/>
        <path d="M72 212 Q100 206 128 212 T184 212" strokeWidth="1" opacity="0.45"/>
      </g>

      {/* Brass accent bar at bottom */}
      <rect x="56" y="224" width="144" height="4" rx="2" fill="url(#brassGrad)" opacity="0.9"/>

      {/* Three stars (Philippines / Region VII) */}
      <g fill="url(#brassGrad)">
        <polygon points="104,232 106,238 112,238 108,242 110,248 104,244 98,248 100,242 96,238 102,238"/>
        <polygon points="128,230 130,236 136,236 132,240 134,246 128,242 122,246 124,240 120,236 126,236" transform="scale(1.15 1.15) translate(-2 -2)"/>
        <polygon points="152,232 154,238 160,238 156,242 158,248 152,244 146,248 148,242 144,238 150,238"/>
      </g>
    </svg>
  );
}
