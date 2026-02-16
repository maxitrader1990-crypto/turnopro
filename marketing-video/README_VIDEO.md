# Producing the Final Marketing Video

The video project has been set up with **Simulated High-Quality Placeholders** to demonstrate the exact pacing, transitions, and structure.

## 📂 Project Location

`c:\Users\eduardo velazco\Desktop\pagina\marketing-video`

## 🛠️ How to Finalize (Replace Assets)

1. **Locate Placeholders:**
   Go to the `marketing-video/public` folder. You will see `.svg` files representing the scenes:
   - `chaos_appointment_book.svg` (Hook)
   - `modern_urban_barber_shop.svg` (Vibe)
   - `gold_barber_tools.svg` (Benefits)
   - `booking-mockup.svg` (App UI)
   - `dashboard-mockup.svg` (App Stats)

2. **Download Real Assets:**
   As requested, download high-quality assets from Pexels/Unsplash/Mixkit:
   - **Modern Barber Shop:** Dark, moody, neon/gold lights.
   - **Barber Tools:** Close-up of gold scissors/clippers.
   - **Chaos:** A busy/messy notebook or stressed barber.
   - **App Screenshots:** Capture real screenshots of your running app (`localhost:5173`) on mobile and desktop.

3. **Replace Files:**
   - Overwrite the `.svg` files with your real `.png` or `.jpg` specific images.
   - **Note:** If using `.jpg` or `.png`, you may need to update the file extension in the code (`src/MarketingVideo30s.tsx`, etc.) from `.svg` to your new extension.
   - **Video clips:** If using video clips (`.mp4`), import `Video` from `remotion` instead of `Img` in the code.

## 🚀 How to Render

Run these commands in your terminal (inside `marketing-video` folder):

```bash
# Vertical 30s (Social Media)
npx remotion render src/index.ts MarketingVideo30s out/MarketingVideo30s.mp4

# Vertical 60s (Reels/TikTok)
npx remotion render src/index.ts MarketingVideo60s out/MarketingVideo60s.mp4

# Horizontal (Web)
npx remotion render src/index.ts MarketingVideoHorizontal out/MarketingVideoHorizontal.mp4
```

## 🎨 Customizing Text/Colors

Edit `src/MarketingVideo30s.tsx` (and other files) to change the text instantly.
