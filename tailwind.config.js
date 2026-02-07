/** @type {import('tailwindcss').Config} */
export default {
    content: [
        "./index.html",
        "./src/**/*.{js,ts,jsx,tsx}",
    ],
    theme: {
        extend: {
            colors: {
                primary: "#2563EB",
                accent: "#14B8A6",
                border: "#E5E7EB",
                background: "#F7F8FA",
                text: "#111827",
            },
        },
    },
    plugins: [],
}
