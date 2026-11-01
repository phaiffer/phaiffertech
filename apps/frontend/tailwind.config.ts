import type { Config } from 'tailwindcss';

// Palette scales read RGB channels from CSS variables (see globals.css). Outside the
// app surface they resolve to Tailwind's original values, so the public website keeps
// its look; inside `[data-surface='app']` they resolve to the Comanda v2 neutrals.
const SCALE_STEPS = [50, 100, 200, 300, 400, 500, 600, 700, 800, 900, 950] as const;
const channel = (variable: string) => `rgb(var(${variable}) / <alpha-value>)`;
const variableScale = (name: string) =>
  Object.fromEntries(SCALE_STEPS.map((step) => [step, channel(`--tw-${name}-${step}`)]));

const config: Config = {
  content: ['./src/**/*.{js,ts,jsx,tsx,mdx}'],
  darkMode: ['class', '[data-theme="dark"]'],
  theme: {
    extend: {
      screens: {
        // Comanda v2: the sidebar becomes a drawer below 900px.
        nav: '900px',
      },
      colors: {
        slate: variableScale('slate'),
        emerald: variableScale('emerald'),
        // In the app these become neutral tints (50-300) and the v2 semantic hue
        // (400+): amber = warn, red/rose = danger, blue/sky = in progress, violet = grooming.
        amber: variableScale('amber'),
        red: variableScale('red'),
        rose: variableScale('rose'),
        blue: variableScale('blue'),
        sky: variableScale('sky'),
        violet: variableScale('violet'),
        white: channel('--tw-white'),
        // Comanda v2 tokens
        ink: {
          DEFAULT: 'var(--ink)',
          2: 'var(--ink-2)',
        },
        faint: 'var(--faint)',
        page: 'var(--bg)',
        'bg-subtle': 'var(--bg-subtle)',
        'bg-row': 'var(--bg-row)',
        selected: {
          DEFAULT: 'var(--selected)',
          strong: 'var(--selected-strong)',
        },
        line: {
          DEFAULT: 'var(--line)',
          soft: 'var(--line-soft)',
        },
        control: 'var(--control)',
        highlight: 'var(--highlight)',
        warn: 'var(--warn)',
        status: {
          waiting: 'var(--status-waiting)',
          'in-progress': 'var(--status-in-progress)',
          grooming: 'var(--status-grooming)',
          ready: 'var(--status-ready)',
          done: 'var(--status-done)',
        },
        background: 'var(--background)',
        foreground: 'var(--foreground)',
        muted: {
          DEFAULT: 'var(--muted)',
          foreground: 'var(--muted-foreground)',
        },
        surface: {
          DEFAULT: 'var(--surface)',
          elevated: 'var(--surface-elevated)',
          inset: 'var(--surface-inset)',
        },
        border: {
          DEFAULT: 'var(--border)',
          muted: 'var(--border-muted)',
        },
        ring: 'var(--ring)',
        accent: {
          DEFAULT: 'var(--accent)',
          foreground: 'var(--accent-foreground)',
          muted: 'var(--accent-muted)',
          core: 'var(--accent-core)',
          crm: 'var(--accent-crm)',
          pet: 'var(--accent-pet)',
        },
        // Pet Brand Colors
        pet: {
          DEFAULT: 'var(--pet-primary)',
          primary: 'var(--pet-primary)',
          dark: 'var(--pet-primary-dark)',
          light: 'var(--pet-primary-light)',
          teal: 'var(--pet-teal)',
        },
        // Feature Card Icon Colors
        'icon-green': 'var(--icon-green)',
        'icon-purple': 'var(--icon-purple)',
        'icon-pink': 'var(--icon-pink)',
        'icon-coral': 'var(--icon-coral)',
        'icon-teal': 'var(--icon-teal)',
        'icon-red': 'var(--icon-red)',
        success: {
          DEFAULT: 'var(--success)',
          muted: 'var(--success-muted)',
        },
        warning: {
          DEFAULT: 'var(--warning)',
          muted: 'var(--warning-muted)',
        },
        destructive: {
          DEFAULT: 'var(--destructive)',
          muted: 'var(--destructive-muted)',
        },
        danger: {
          DEFAULT: 'var(--destructive)',
          muted: 'var(--destructive-muted)',
        },
        info: {
          DEFAULT: 'var(--info)',
          muted: 'var(--info-muted)',
        },
        card: {
          DEFAULT: 'var(--card)',
          foreground: 'var(--card-foreground)',
        },
        popover: {
          DEFAULT: 'var(--popover)',
          foreground: 'var(--popover-foreground)',
        },
        primary: {
          DEFAULT: 'var(--primary)',
          foreground: 'var(--primary-foreground)',
        },
        secondary: {
          DEFAULT: 'var(--secondary)',
          foreground: 'var(--secondary-foreground)',
        },
        input: 'var(--input)',
        sidebar: {
          DEFAULT: 'var(--sidebar)',
          foreground: 'var(--sidebar-foreground)',
          primary: 'var(--sidebar-primary)',
          'primary-foreground': 'var(--sidebar-primary-foreground)',
          accent: 'var(--sidebar-accent)',
          'accent-foreground': 'var(--sidebar-accent-foreground)',
          border: 'var(--sidebar-border)',
          ring: 'var(--sidebar-ring)',
        },
      },
      borderRadius: {
        sm: 'var(--radius-sm)',
        md: 'var(--radius-md)',
        lg: 'var(--radius-lg)',
        xl: 'var(--radius-xl)',
        '2xl': 'var(--radius-2xl)',
        '3xl': 'var(--radius-3xl)',
        sidebar: 'calc(var(--radius) - 2px)',
      },
      boxShadow: {
        xs: 'var(--shadow-xs)',
        sm: 'var(--shadow-sm)',
        md: 'var(--shadow-md)',
        lg: 'var(--shadow-lg)',
        card: 'var(--shadow-card)',
      },
      fontFamily: {
        // --font-app-* switch to IBM Plex inside the app surface (globals.css).
        sans: ['var(--font-app-sans)', 'system-ui', 'sans-serif'],
        mono: ['var(--font-app-mono)', 'ui-monospace', 'monospace'],
      },
      fontSize: {
        '2xs': ['0.625rem', { lineHeight: '0.875rem' }],
      },
      spacing: {
        '18': '4.5rem',
        '88': '22rem',
        '128': '32rem',
      },
      backgroundImage: {
        'pet-gradient': 'linear-gradient(135deg, var(--pet-gradient-start) 0%, var(--pet-gradient-end) 100%)',
        'pet-gradient-radial': 'radial-gradient(ellipse at top, var(--pet-gradient-end) 0%, var(--pet-gradient-start) 100%)',
        'hero-pattern': 'radial-gradient(circle at 20% 50%, rgba(16, 185, 129, 0.08) 0%, transparent 50%), radial-gradient(circle at 80% 50%, rgba(20, 184, 166, 0.08) 0%, transparent 50%)',
      },
      animation: {
        'fade-in': 'fade-in 0.2s ease-out',
        'slide-up': 'slide-up 0.3s ease-out',
        'pulse-subtle': 'pulse-subtle 2s ease-in-out infinite',
        'pulse-live': 'pulse-live 2s cubic-bezier(0.4, 0, 0.6, 1) infinite',
      },
      keyframes: {
        'pulse-live': {
          '0%, 100%': { opacity: '1', transform: 'scale(1)' },
          '50%': { opacity: '0.5', transform: 'scale(1.05)' },
        }
      }
    },
  },
  plugins: [],
};

export default config;
