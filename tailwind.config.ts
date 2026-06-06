import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{ts,tsx,js,jsx}"],
  darkMode: "class",
  theme: {
    /* Override border-radius defaults — doctrine requires sharp corners everywhere
       except explicit pills (999px). Keep "full" at 999px for pill use. */
    borderRadius: {
      none:    "0px",
      sm:      "0px",
      DEFAULT: "0px",
      md:      "0px",
      lg:      "0px",
      xl:      "0px",
      "2xl":   "0px",
      "3xl":   "0px",
      full:    "999px",
    },
    extend: {
      colors: {
        background:          "hsl(var(--background))",
        foreground:          "hsl(var(--foreground))",
        card:                "hsl(var(--card))",
        "card-foreground":   "hsl(var(--card-foreground))",
        primary:             "hsl(var(--primary))",
        "primary-foreground":"hsl(var(--primary-foreground))",
        secondary:           "hsl(var(--secondary))",
        "secondary-foreground":"hsl(var(--secondary-foreground))",
        muted:               "hsl(var(--muted))",
        "muted-foreground":  "hsl(var(--muted-foreground))",
        accent:              "hsl(var(--accent))",
        "accent-foreground": "hsl(var(--accent-foreground))",
        destructive:         "hsl(var(--destructive))",
        "destructive-foreground":"hsl(var(--destructive-foreground))",
        success:             "hsl(var(--success))",
        "success-foreground":"hsl(var(--success-foreground))",
        border:              "hsl(var(--border))",
        input:               "hsl(var(--input))",
        ring:                "hsl(var(--ring))",
      },
      fontFamily: {
        sans:  ["Inter Tight", "-apple-system", "BlinkMacSystemFont", "Segoe UI", "Roboto", "Helvetica", "Arial", "sans-serif"],
        mono:  ["JetBrains Mono", "ui-monospace", "SFMono-Regular", "Menlo", "monospace"],
        serif: ["Source Serif 4", "Georgia", "serif"],
      },
    },
  },
  plugins: [],
};

export default config;
