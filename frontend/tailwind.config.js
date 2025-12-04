/** @type {import('tailwindcss').Config} */
export default {
    content: [
        "./index.html",
        "./src/**/*.{js,jsx,ts,tsx}",
    ],
    theme: {
        extend: {
            colors: {
                Colors: {
                    Text: {
                        Base: {
                            base: "#1A1A1A",          // change to your Figma color
                            "base-lightest": "#9BA1B0", // change to your Figma color
                        },
                    },
                },
            },
        },
    },
    plugins: [],
};
