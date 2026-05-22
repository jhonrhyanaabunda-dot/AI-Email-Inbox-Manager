import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: ["class"],
  content: [
    "./src/app/**/*.{ts,tsx}",
    "./src/components/**/*.{ts,tsx}",
    "./src/lib/**/*.{ts,tsx}",
  ],
  theme: {
    container: { center: true, padding: "2rem", screens: { "2xl": "1440px" } },
    extend: {
      colors: {
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        primary: {
          DEFAULT: "hsl(var(--primary))",
          foreground: "hsl(var(--primary-foreground))",
        },
        secondary: {
          DEFAULT: "hsl(var(--secondary))",
          foreground: "hsl(var(--secondary-foreground))",
        },
        destructive: {
          DEFAULT: "hsl(var(--destructive))",
          foreground: "hsl(var(--destructive-foreground))",
        },
        muted: {
          DEFAULT: "hsl(var(--muted))",
          foreground: "hsl(var(--muted-foreground))",
        },
        accent: {
          DEFAULT: "hsl(var(--accent))",
          foreground: "hsl(var(--accent-foreground))",
        },
        card: {
          DEFAULT: "hsl(var(--card))",
          foreground: "hsl(var(--card-foreground))",
        },
        popover: {
          DEFAULT: "hsl(var(--popover))",
          foreground: "hsl(var(--popover-foreground))",
        },
        // A3 named tokens — for cases where the semantic alias isn't enough
        a3: {
          emerald: "#1DB954",
          "emerald-soft": "rgba(29, 185, 84, 0.1)",
          charcoal: "#2C3038",
          navy: "#0B0D0F",
          stone: "#5A6170",
          fog: "#8A919C",
          line: "#E5E7EB",
        },
      },
      borderRadius: {
        lg: "var(--radius)",                // 16px — cards
        md: "var(--radius-input)",          // 8px — inputs / utility
        sm: "var(--radius-badge)",          // 4px — badges
        pill: "var(--radius-pill)",         // 50px — primary CTA
      },
      boxShadow: {
        emerald: "0 4px 24px 0 rgba(29, 185, 84, 0.3)",
        "emerald-strong": "0 6px 28px 0 rgba(29, 185, 84, 0.4)",
        subtle: "0 4px 16px 0 rgba(0, 0, 0, 0.08)",
        raised: "0 8px 24px 0 rgba(0, 0, 0, 0.12)",
        elevated: "0 4px 30px 0 rgba(0, 0, 0, 0.3)",
      },
      fontFamily: {
        sans: ["var(--font-sora)", "system-ui", "sans-serif"],
        sora: ["var(--font-sora)", "system-ui", "sans-serif"],
        mono: ["ui-monospace", "SFMono-Regular", "Menlo", "monospace"],
      },
      letterSpacing: {
        label: "0.05em",
        a3body: "0.02em",
      },
      maxWidth: {
        "a3-shell": "1440px",
        "a3-content": "1400px",
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
};

export default config;
