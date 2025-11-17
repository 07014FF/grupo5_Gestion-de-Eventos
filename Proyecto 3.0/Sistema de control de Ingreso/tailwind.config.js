export default {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      fontFamily: {
        sans: ["Inter", "system-ui", "Segoe UI", "Roboto", "sans-serif"],
      },
      colors: {
        brand: {
          DEFAULT: "#E30613", // rojo estilo ticketera
          600: "#CC0611",
          700: "#B1050F",
        },
        ink: {
          900: "#0F172A", // títulos
          700: "#334155", // texto
        },
      },
      boxShadow: {
        soft: "0 6px 20px -6px rgba(0,0,0,.15)",
      },
    },
  },
  plugins: [],
}
