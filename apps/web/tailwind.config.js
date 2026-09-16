/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        background: '#F7F9FC',
        surface: {
          DEFAULT: '#FFFFFF',
          elevated: '#FFFFFF',
          subtle: '#F2F5F9',
          hover: '#EEF3F8',
        },
        border: {
          DEFAULT: '#DCE3EC',
          subtle: '#E8EDF3',
        },
        navy: {
          sidebar: '#081A2B',
          primary: '#0B1F33',
          secondary: '#12395A',
        },
        brand: {
          blue: '#1769E0',
          bright: '#2F80ED',
        },
        status: {
          success: '#16845B',
          successBg: '#EAF7F1',
          warning: '#C98200',
          warningBg: '#FFF5DD',
          danger: '#C63D3D',
          dangerBg: '#FDEEEE',
          info: '#2563A6',
          infoBg: '#EDF5FF',
        },
        text: {
          primary: '#102033',
          secondary: '#536274',
          muted: '#7C8998',
          disabled: '#AAB4C0',
        }
      },
      borderRadius: {
        card: '14px',
        input: '10px',
        btn: '9px',
        modal: '18px',
        hero: '20px',
      },
      boxShadow: {
        subtle: '0 1px 2px rgba(16,32,51,0.04)',
        card: '0 8px 24px rgba(16,32,51,0.07)',
        modal: '0 20px 50px rgba(16,32,51,0.10)',
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'sans-serif'],
      }
    },
  },
  plugins: [],
}
