"use client";

import { useState } from "react";
import { Logo, LogoLockup, LogoIcon } from "@/components/logo";
import styles from "./LogoDemo.module.css";

export default function LogoDemoPage() {
  const [variant, setVariant] = useState<"default" | "ambient" | "breathing" | "focus" | "static">("default");
  const [size, setSize] = useState(64);
  const [showLockup, setShowLockup] = useState(true);
  const [showTagline, setShowTagline] = useState(false);

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <h1 className={styles.title}>DENR Official Seal — Professional Motion System</h1>
        <p className={styles.subtitle}>
          The actual DENR seal (<code>/public/brand/denr-seal.png</code>) with sophisticated animations.
          Authoritative, accessible, production-ready.
        </p>
      </header>

      <main className={styles.main}>
        <section className={styles.section}>
          <h2 className={styles.sectionTitle}>Interactive Variants</h2>
          <p className={styles.sectionDesc}>
            Select an animation variant and hover/tap the logos to test interaction states.
            All motion respects <code>prefers-reduced-motion</code>.
          </p>

          <div className={styles.controls}>
            <div className={styles.controlGroup}>
              <label htmlFor="variant" className={styles.label}>Animation Variant</label>
              <select
                id="variant"
                value={variant}
                onChange={(e) => setVariant(e.target.value as typeof variant)}
                className={styles.select}
              >
                <option value="default">Default — Breathe + Glow + Sheen (10s)</option>
                <option value="ambient">Ambient — Slow Rotate + Glow</option>
                <option value="breathing">Breathing Only — Scale Pulse</option>
                <option value="focus">Focus — Hover/Tap Response</option>
                <option value="static">Static — No Animation</option>
              </select>
            </div>

            <div className={styles.controlGroup}>
              <label htmlFor="size" className={styles.label}>Size: {size}px</label>
              <input
                id="size"
                type="range"
                min="24"
                max="140"
                step="4"
                value={size}
                onChange={(e) => setSize(Number(e.target.value))}
                className={styles.slider}
              />
            </div>

            <div className={styles.controlGroup}>
              <label className={styles.checkboxLabel}>
                <input
                  type="checkbox"
                  checked={showLockup}
                  onChange={(e) => setShowLockup(e.target.checked)}
                  className={styles.checkbox}
                />
                Show horizontal lockup
              </label>
            </div>

            <div className={styles.controlGroup}>
              <label className={styles.checkboxLabel}>
                <input
                  type="checkbox"
                  checked={showTagline}
                  onChange={(e) => setShowTagline(e.target.checked)}
                  className={styles.checkbox}
                />
                Show tagline (lockup only)
              </label>
            </div>
          </div>

          <div className={styles.demoGrid}>
            <div className={styles.demoCard}>
              <h3 className={styles.demoTitle}>Official Seal Only</h3>
              <div className={styles.logoWrapper}>
                <Logo size={size} variant={variant} />
              </div>
              <code className={styles.code}>
                <Logo size={size} variant={variant} />
              </code>
            </div>

            {showLockup && (
              <div className={styles.demoCard}>
                <h3 className={styles.demoTitle}>Horizontal Lockup</h3>
                <div className={styles.logoWrapper}>
                  <LogoLockup size={size} variant={variant} showTagline={showTagline} />
                </div>
                <code className={styles.code}>
                  <LogoLockup size={size} variant={variant} showTagline={showTagline} />
                </code>
              </div>
            )}

            <div className={styles.demoCard}>
              <h3 className={styles.demoTitle}>Favicon / App Icon</h3>
              <div className={styles.iconGrid}>
                {[16, 32, 48, 64, 128, 192].map((s) => (
                  <div key={s} className={styles.iconItem}>
                    <LogoIcon size={s} />
                    <span className={styles.iconLabel}>{s}×{s}</span>
                  </div>
                ))}
              </div>
              <code className={styles.code}>
                <LogoIcon size={32} />
              </code>
            </div>
          </div>
        </section>

        <section className={styles.section}>
          <h2 className={styles.sectionTitle}>Size Ladder</h2>
          <p className={styles.sectionDesc}>
            The official seal maintains clarity from favicon (16px) to hero (120px+).
          </p>
          <div className={styles.sizeLadder}>
            {[16, 20, 24, 28, 32, 40, 48, 56, 64, 80, 96, 120].map((s) => (
              <div key={s} className={styles.sizeItem}>
                <Logo size={s} variant="static" />
                <span className={styles.sizeLabel}>{s}px</span>
              </div>
            ))}
          </div>
        </section>

        <section className={styles.section}>
          <h2 className={styles.sectionTitle}>Colour Modes</h2>
          <p className={styles.sectionDesc}>
            Works on light, dark, and coloured backgrounds. The seal's own colours adapt naturally.
          </p>
          <div className={styles.colourGrid}>
            <div className={styles.colourCard}>
              <h4 className={styles.colourTitle}>Light (Default)</h4>
              <div className={styles.colourDemo} style={{ background: "#F5F0E1" }}>
                <Logo size={64} variant="static" />
              </div>
            </div>
            <div className={styles.colourCard}>
              <h4 className={styles.colourTitle}>Dark Mode</h4>
              <div className={styles.colourDemo} style={{ background: "#1A1A2E" }}>
                <Logo size={64} variant="static" />
              </div>
            </div>
            <div className={styles.colourCard}>
              <h4 className={styles.colourTitle}>Forest Background</h4>
              <div className={styles.colourDemo} style={{ background: "#1B5E20" }}>
                <Logo size={64} variant="static" />
              </div>
            </div>
            <div className={styles.colourCard}>
              <h4 className={styles.colourTitle}>Gold Background</h4>
              <div className={styles.colourDemo} style={{ background: "#D9A441" }}>
                <Logo size={64} variant="static" />
              </div>
            </div>
          </div>
        </section>

        <section className={styles.section}>
          <h2 className={styles.sectionTitle}>Animation Comparison</h2>
          <p className={styles.sectionDesc}>
            Side-by-side comparison of all variants at the same size.
          </p>
          <div className={styles.comparisonGrid}>
            {(["default", "ambient", "breathing", "focus", "static"] as const).map((v) => (
              <div key={v} className={styles.comparisonCard}>
                <h4 className={styles.comparisonTitle}>{v.charAt(0).toUpperCase() + v.slice(1)}</h4>
                <div className={styles.comparisonLogo}>
                  <Logo size={56} variant={v} />
                </div>
                <p className={styles.comparisonDesc}>
                  {v === "default" && "10s breathe + glow + sheen (recommended)"}
                  {v === "ambient" && "Slow rotate + glow pulse"}
                  {v === "breathing" && "Scale pulse only, minimal"}
                  {v === "focus" && "Hover/tap response only"}
                  {v === "static" && "No animation (print/accessibility)"}
                </p>
              </div>
            ))}
          </div>
        </section>

        <section className={styles.section}>
          <h2 className={styles.sectionTitle}>Design Decisions</h2>
          <div className={styles.decisionGrid}>
            <div className={styles.decisionCard}>
              <h4 className={styles.decisionTitle}>🎯 Official Seal Preserved</h4>
              <p className={styles.decisionDesc}>
                Uses the actual <code>public/brand/denr-seal.png</code> — no geometric reinterpretation.
                All official equity maintained: forest border, gold accents, Philippine eagle, three stars, text rings.
              </p>
            </div>
            <div className={styles.decisionCard}>
              <h4 className={styles.decisionTitle}>⚡ Authoritative Motion</h4>
              <p className={styles.decisionDesc}>
                10-second breath cycle (institutional stability), ambient gold glow, subtle sheen sweep.
                No gimmicks — conveys permanence and trust. Respects <code>prefers-reduced-motion</code>.
              </p>
            </div>
            <div className={styles.decisionCard}>
              <h4 className={styles.decisionTitle}>♿ Accessibility First</h4>
              <p className={styles.decisionDesc}>
                Proper ARIA labels, focus-visible rings, reduced-motion support, semantic structure.
                Works with screen readers and keyboard navigation.
              </p>
            </div>
            <div className={styles.decisionCard}>
              <h4 className={styles.decisionTitle}>📱 Production-Ready</h4>
              <p className={styles.decisionDesc}>
                TypeScript, Framer Motion, tree-shakeable. Three components: <code><Logo /></code>,
                <code><LogoLockup /></code>, <code><LogoIcon /></code>. Zero layout shift.
              </p>
            </div>
            <div className={styles.decisionCard}>
              <h4 className={styles.decisionTitle}>🎨 Colour Adaptive</h4>
              <p className={styles.decisionDesc}>
                The seal's native colours (forest green, gold, white) work on any background.
                No forced inversion — the official seal renders faithfully everywhere.
              </p>
            </div>
            <div className={styles.decisionCard}>
              <h4 className={styles.decisionTitle}>🔧 Flexible API</h4>
              <p className={styles.decisionDesc}>
                Size via <code>size</code> prop (any px value), 5 animation variants,
                lockup with optional tagline, favicon component for PWA/icons.
              </p>
            </div>
          </div>
        </section>

        <section className={styles.section}>
          <h2 className={styles.sectionTitle}>Usage Examples</h2>
          <div className={styles.usageGrid}>
            <div className={styles.usageCard}>
              <h4 className={styles.usageTitle}>Header / Navigation</h4>
              <pre className={styles.usageCode}>
{`<LogoLockup size={40} variant="default" showTagline />`}
              </pre>
              <LogoLockup size={40} variant="default" showTagline />
            </div>
            <div className={styles.usageCard}>
              <h4 className={styles.usageTitle}>Dashboard Hero</h4>
              <pre className={styles.usageCode}>
{`<Logo size={96} variant="default" />`}
              </pre>
              <Logo size={96} variant="default" />
            </div>
            <div className={styles.usageCard}>
              <h4 className={styles.usageTitle}>Button / Small UI</h4>
              <pre className={styles.usageCode}>
{`<Logo size={24} variant="static" />`}
              </pre>
              <Logo size={24} variant="static" />
            </div>
            <div className={styles.usageCard}>
              <h4 className={styles.usageTitle}>Favicon / PWA</h4>
              <pre className={styles.usageCode}>
{`<LogoIcon size={32} />`}
              </pre>
              <LogoIcon size={32} />
            </div>
          </div>
        </section>
      </main>

      <footer className={styles.footer}>
        <p>
          DENR Official Seal Motion System &middot;
          Department of Environment and Natural Resources, Republic of the Philippines
        </p>
      </footer>
    </div>
  );
}