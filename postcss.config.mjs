const config = {
  plugins: ["@tailwindcss/postcss"],
  theme: {
    extend: {
      keyframes: {
        fadeIn: {
          "0%": { opacity: "0" },
          "100%": { opacity: "1" },
        },
        fadeOut: {
          // Opcional, mas útil para transição de saída
          "0%": { opacity: "1" },
          "100%": { opacity: "0" },
        },
      },
      animation: {
        "fade-in": "fadeIn 0.2s ease-out forwards", // Aplica a animação
        "fade-out": "fadeOut 0.2s ease-out forwards", // Opcional
      },
    },
  },
};

export default config;
