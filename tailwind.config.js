/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        'serif': ['Georgia', 'Times New Roman', 'serif'],
        'sans': ['Inter', 'system-ui', 'sans-serif'],
        'mono': ['JetBrains Mono', 'Consolas', 'monospace'],
      },
      typography: {
        DEFAULT: {
          css: {
            maxWidth: 'none',
            color: '#374151',
            lineHeight: '1.75',
            fontSize: '1.125rem',
            'h1, h2, h3, h4, h5, h6': {
              color: '#111827',
              fontWeight: '600',
            },
            'h1': {
              fontSize: '2.25rem',
              marginTop: '0',
              marginBottom: '1.5rem',
            },
            'h2': {
              fontSize: '1.875rem',
              marginTop: '2rem',
              marginBottom: '1rem',
            },
            'h3': {
              fontSize: '1.5rem',
              marginTop: '1.5rem',
              marginBottom: '0.75rem',
            },
            'p': {
              marginTop: '0',
              marginBottom: '1.25rem',
            },
            'blockquote': {
              borderLeftColor: '#e5e7eb',
              borderLeftWidth: '0.25rem',
              paddingLeft: '1rem',
              fontStyle: 'italic',
              color: '#6b7280',
            },
            'code': {
              backgroundColor: '#f3f4f6',
              padding: '0.125rem 0.25rem',
              borderRadius: '0.25rem',
              fontSize: '0.875rem',
            },
            'pre': {
              backgroundColor: '#1f2937',
              color: '#f9fafb',
              padding: '1rem',
              borderRadius: '0.5rem',
              overflow: 'auto',
            },
            'pre code': {
              backgroundColor: 'transparent',
              padding: '0',
              color: 'inherit',
            },
          },
        },
      },
    },
  },
  plugins: [
    require('@tailwindcss/typography'),
  ],
}


