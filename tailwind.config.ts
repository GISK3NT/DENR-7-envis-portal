import type { Config } from "tailwindcss";

/**
 * Field Atlas theme.
 *
 * One hue family for neutrals (warm bone), one for structure (deep pine),
 * and a single metal accent (brass) borrowed from the DENR seal. Existing
 * `forest-*` / `sand-*` utility names are kept so component class names stay
 * stable; only their values changed.
 */
const config: Config = {
  content: [
    "./app/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
    "./lib/**/*.{ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        forest: {
          50: "#EEF3F0",
          100: "#DCE6E0",
          200: "#BCCFC4",
          300: "#93B0A1",
          400: "#6A8F7D",
          500: "#4A735F",
          600: "#355C4A",
          700: "#274A3B",
          800: "#1B3A2E",
          900: "#132E24",
          950: "#0B1F19",
        },
        sand: {
          50: "#F7F5EE",
          100: "#F1EEE3",
          200: "#E4DFCE",
          300: "#D2CBB4",
          400: "#B9AF93",
          500: "#9E9276",
          600: "#847860",
          700: "#6A604D",
          800: "#514939",
          900: "#3B352A",
        },
        brass: {
          50: "#FBF5E7",
          100: "#F4E7C6",
          200: "#E9CF93",
          300: "#DDB45F",
          400: "#D09B3E",
          500: "#B9852E",
          600: "#976823",
          700: "#75501E",
        },
        ink: "#0B1712",
      },
      fontFamily: {
        sans: ["var(--font-text)", "Segoe UI", "system-ui", "sans-serif"],
        display: ["var(--font-display)", "Georgia", "serif"],
      },
      fontSize: {
        "2xs": ["0.6875rem", { lineHeight: "1rem", letterSpacing: "0.08em" }],
      },
      letterSpacing: {
        tightest: "-0.045em",
      },
      maxWidth: {
        prose: "68ch",
      },
      borderRadius: {
        card: "1.125rem",
      },
      boxShadow: {
        card: "0 1px 1px rgba(11,31,25,.04), 0 10px 28px -18px rgba(11,31,25,.35)",
        lift: "0 2px 2px rgba(11,31,25,.04), 0 22px 44px -26px rgba(11,31,25,.5)",
        inset: "inset 0 1px 0 rgba(255,255,255,.6)",
      },
      backgroundImage: {
        grain:
          "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='140' height='140'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='.85' numOctaves='3'/%3E%3C/filter%3E%3Crect width='140' height='140' filter='url(%23n)' opacity='.35'/%3E%3C/svg%3E\")",
      },
    },
  },
  plugins: [],
};

export default config;
