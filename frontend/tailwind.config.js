/** @type {import('tailwindcss').Config} */
module.exports = {
  // NOTE: Update this to include the paths to all of your component files.
  content: ["./App.{js,jsx,ts,tsx}", "./src/**/*.{js,jsx,ts,tsx}"],
  presets: [require("nativewind/preset")],
  theme: {
    extend: {
      colors: {
        primary: "#00d2ff", // Royal Blue/Cyan as base
        secondary: "#3a7bd5",
        emerald: "#10b981", // Deep Emerald Green
        royal: "#1e40af", // Royal Blue
        destructive: "#ef4444", // Soft Red
        background: "#1a1a2e",
        surface: "#16213e",
      },
      fontFamily: {
        inter: ["Inter_400Regular"],
        "inter-bold": ["Inter_700Bold"],
        plex: ["IBMPlexSans_500Medium"],
        mono: ["RobotoMono_400Regular"],
        "mono-medium": ["RobotoMono_500Medium"],
        space: ["SpaceGrotesk_700Bold"],
        jakarta: ["PlusJakartaSans_400Regular"],
        "jakarta-semi": ["PlusJakartaSans_600SemiBold"],
        "jakarta-bold": ["PlusJakartaSans_700Bold"],
      },
    },
  },
  plugins: [],
};
