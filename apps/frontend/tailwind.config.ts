import type { Config } from 'tailwindcss';

const config: Config = {
  content: ['./src/**/*.{js,ts,jsx,tsx,mdx}'],
  darkMode: ['class', '[data-theme="dark"]'],
  theme: {
    extend: {
      colors: {
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
        // PetFlow Brand Colors
        petflow: {
          DEFAULT: 'var(--petflow-primary)',
          primary: 'var(--petflow-primary)',
          dark: 'var(--petflow-primary-dark)',
          light: 'var(--petflow-primary-light)',
          teal: 'var(--petflow-teal)',
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
        sans: ['var(--font-geist-sans)', 'system-ui', 'sans-serif'],
        mono: ['var(--font-geist-mono)', 'ui-monospace', 'monospace'],
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
        'petflow-gradient': 'linear-gradient(135deg, var(--petflow-gradient-start) 0%, var(--petflow-gradient-end) 100%)',
        'petflow-gradient-radial': 'radial-gradient(ellipse at top, var(--petflow-gradient-end) 0%, var(--petflow-gradient-start) 100%)',
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
