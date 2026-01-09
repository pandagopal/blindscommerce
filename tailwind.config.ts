import type { Config } from "tailwindcss";

const config: Config = {
    darkMode: ["class"],
    content: [
        "./pages/**/*.{js,ts,jsx,tsx,mdx}",
        "./components/**/*.{js,ts,jsx,tsx,mdx}",
        "./app/**/*.{js,ts,jsx,tsx,mdx}",
    ],
    prefix: "",
    future: {
        hoverOnlyWhenSupported: true,
    },
    theme: {
        extend: {
            colors: {
                // Brand Color Palette - CSS variable references (highest priority)
                'primary-red': 'var(--primary-red)',
                'primary-dark': 'var(--primary-dark)',
                'hover-primary': 'var(--hover-primary)',
                'accent-gold': 'var(--accent-gold)',
                'footer-bg': 'var(--bg-footer)',
                'header-bg': 'var(--bg-header)',

                // Brand Red - Primary brand color palette
                'brand-red': {
                    50: '#fef2f3',
                    100: '#fde6e8',
                    200: '#fbd0d5',
                    300: '#f7aab2',
                    400: '#f17a8a',
                    500: '#da0530',  // Primary brand red
                    600: '#c20429',
                    700: '#a00424',
                    800: '#850622',
                    900: '#6f0820',
                    950: '#4a050d',  // Dark brand red
                },

                // Override red to use brand red
                red: {
                    50: '#fef2f3',
                    100: '#fde6e8',
                    200: '#fbd0d5',
                    300: '#f7aab2',
                    400: '#f17a8a',
                    500: '#da0530',
                    600: '#c20429',
                    700: '#a00424',
                    800: '#850622',
                    900: '#6f0820',
                    950: '#4a050d',
                },

                // Charcoal - Replaces black throughout the site (warm, sophisticated)
                'charcoal': {
                    50: '#f7f7f6',
                    100: '#e5e4e2',
                    200: '#cbc9c5',
                    300: '#aaa7a1',
                    400: '#89857d',
                    500: '#6e6a62',
                    600: '#57544d',
                    700: '#474440',
                    800: '#3b3936',
                    900: '#33312f',
                    950: '#1a1918',  // Deep charcoal (use instead of black)
                },

                // Slate - Neutral warm gray for text and backgrounds
                'warm-gray': {
                    50: '#fafaf9',
                    100: '#f5f5f4',
                    200: '#e7e5e4',
                    300: '#d6d3d1',
                    400: '#a8a29e',
                    500: '#78716c',
                    600: '#57534e',
                    700: '#44403c',
                    800: '#292524',
                    900: '#1c1917',
                    950: '#0c0a09',
                },

                // Shadcn UI colors
                background: 'hsl(var(--background))',
                foreground: 'hsl(var(--foreground))',
                card: {
                    DEFAULT: 'hsl(var(--card))',
                    foreground: 'hsl(var(--card-foreground))'
                },
                popover: {
                    DEFAULT: 'hsl(var(--popover))',
                    foreground: 'hsl(var(--popover-foreground))'
                },
                primary: {
                    DEFAULT: 'hsl(var(--primary))',
                    foreground: 'hsl(var(--primary-foreground))'
                },
                secondary: {
                    DEFAULT: 'hsl(var(--secondary))',
                    foreground: 'hsl(var(--secondary-foreground))'
                },
                muted: {
                    DEFAULT: 'hsl(var(--muted))',
                    foreground: 'hsl(var(--muted-foreground))'
                },
                accent: {
                    DEFAULT: 'hsl(var(--accent))',
                    foreground: 'hsl(var(--accent-foreground))'
                },
                destructive: {
                    DEFAULT: 'hsl(var(--destructive))',
                    foreground: 'hsl(var(--destructive-foreground))'
                },
                border: 'hsl(var(--border))',
                input: 'hsl(var(--input))',
                ring: 'hsl(var(--ring))',
                chart: {
                    '1': 'hsl(var(--chart-1))',
                    '2': 'hsl(var(--chart-2))',
                    '3': 'hsl(var(--chart-3))',
                    '4': 'hsl(var(--chart-4))',
                    '5': 'hsl(var(--chart-5))'
                }
            },
            fontFamily: {
                sans: [
                    'var(--font-inter)',
                    'Inter',
                    'Helvetica Neue',
                    'Arial',
                    'sans-serif',
                    'Apple Color Emoji',
                    'Segoe UI Emoji',
                    'Segoe UI Symbol'
                ],
            },
            borderRadius: {
                lg: 'var(--radius)',
                md: 'calc(var(--radius) - 2px)',
                sm: 'calc(var(--radius) - 4px)'
            },
            container: {
                center: true,
                padding: {
                    DEFAULT: '1rem',
                    sm: '2rem',
                    lg: '4rem',
                    xl: '5rem',
                    '2xl': '6rem'
                },
                screens: {
                    sm: '640px',
                    md: '768px',
                    lg: '1024px',
                    xl: '1280px',
                    '2xl': '1536px'
                }
            },
            keyframes: {
                'accordion-down': {
                    from: {
                        height: '0'
                    },
                    to: {
                        height: 'var(--radix-accordion-content-height)'
                    }
                },
                'accordion-up': {
                    from: {
                        height: 'var(--radix-accordion-content-height)'
                    },
                    to: {
                        height: '0'
                    }
                }
            },
            animation: {
                'accordion-down': 'accordion-down 0.2s ease-out',
                'accordion-up': 'accordion-up 0.2s ease-out'
            }
        }
    },
    plugins: [require("tailwindcss-animate")],
} satisfies Config;

export default config;
