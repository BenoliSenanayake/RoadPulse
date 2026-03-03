/** @type {import('tailwindcss').Config} */
export default {
    content: [
        "./index.html",
        "./src/**/*.{js,ts,jsx,tsx}",
    ],
    theme: {
        extend: {
            colors: {
                primary: "var(--primary)",
                accent: "var(--accent)",
                border: "var(--border)",
                bg: "var(--bg)",
                text: "var(--text)",
                muted: "var(--muted)",
                'accent-light': "rgba(59, 130, 246, 0.2)",
            },
            boxShadow: {
                'premium': "0 20px 25px -5px rgb(0 0 0 / 0.05), 0 8px 10px -6px rgb(0 0 0 / 0.05)",
            }
        },
    },
    plugins: [],
}
