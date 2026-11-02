# Rickshaw Ride Portfolio

An interactive 3D portfolio: visitors pedal a Dhaka cycle rickshaw down a street, and each painted gate along the way opens part of the portfolio (About, Skills, Projects, Experience, Contact). Each end of the street has a roundabout, so visitors can turn around and ride back: a Shapla Chattar fountain at the start, and a flag and giant rickshaw wheel by the river at Sadarghat.

Everything is generated in code: the models are built from three.js primitives, the rickshaw art and signboards are painted on canvas, and the sounds are synthesized with Web Audio. There are no binary assets to manage.

## Run

```bash
npm install
npm run dev       # http://localhost:5173
npm run build     # production build in dist/
npm run preview   # serve the production build
```

## Make it yours

- **All text** lives in `src/content/content.ts` (English + Bangla): name, about, skills, projects, experience, contact links and the easter-egg message.
- **Résumé**: put your PDF at `public/resume.pdf`.
- **Stops**: their order and position along the road are in `src/game/zones.ts`.

## Controls

- Keyboard: W A S D or arrow keys to drive, Space to ring the bell, Esc to close a panel.
- Touch: on-screen buttons.
- HUD: mute, monsoon rain, day/night (defaults to the visitor's local time), Bangla/English, and a Classic view (a plain scrolling page for visitors who'd rather read).
- Collect all 12 fuchkas on the road to unlock the easter egg.

## Structure

```
src/
  content/content.ts     your portfolio data
  game/
    Experience.tsx       scene root: lights, sky, physics world
    Rickshaw.tsx         rickshaw + pedaling puller model, driving controller
    Traffic.tsx          rickshaws and bicycles on the road (left-hand traffic)
    People.tsx           walkers and skaters wandering the footpaths
    Collectibles.tsx     fuchkas
    CameraRig.tsx        chase / intro orbit camera
    Rain.tsx             monsoon rain
    textures.ts          canvas-painted rickshaw art, signs, facades
    world/Street.tsx     road, buildings, poles & wires, trees, river
    world/Landmarks.tsx  gates, tea stall, signboards, bazaar, Shaheed Minar, post office, launch
    world/Roundabouts.tsx  the two roundabouts: ring road, railings, island monuments, buildings
  ui/                    intro, HUD, content panels, touch controls, classic view
  audio/sound.ts         synthesized bell, honks, ambience, rain
```

## Deploy

The site is fully static. On Vercel or Netlify, use the build command `npm run build` and the output directory `dist`.

## Stack

Vite, React 18, TypeScript, three.js, @react-three/fiber, @react-three/drei, @react-three/rapier (physics) and zustand.
