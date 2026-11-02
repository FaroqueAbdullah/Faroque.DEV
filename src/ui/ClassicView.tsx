import { useGame } from '../store/useGame'
import { ZONES } from '../game/zones'
import { profile, ui } from '../content/content'
import { SectionContent } from './Sections'

/** A plain scrolling portfolio for visitors who would rather read than ride. */
export function ClassicView() {
  const lang = useGame((s) => s.lang)
  const setPhase = useGame((s) => s.setPhase)
  const toggleLang = useGame((s) => s.toggleLang)
  const ride = () => setPhase(useGame.getState().ready ? 'ride' : 'intro')
  return (
    <div className="classic">
      <header className="classic-hero">
        <div className="classic-bar">
          <button className="btn primary" onClick={ride}>
            {ui.backToRide[lang]}
          </button>
          <button className="icon-btn lang" onClick={toggleLang} aria-label="Switch language">
            {lang === 'en' ? 'বাং' : 'EN'}
          </button>
        </div>
        <p className="eyebrow">{profile.role[lang]}</p>
        <h1 className="display">{profile.name[lang]}</h1>
        <p>{profile.tagline[lang]}</p>
      </header>
      <main>
        {ZONES.filter((z) => z.id !== 'start').map((z) => (
          <section key={z.id} className="classic-section painted">
            <h2>{z.title[lang]}</h2>
            <SectionContent id={z.id} lang={lang} />
          </section>
        ))}
      </main>
      <footer className="classic-footer">© {new Date().getFullYear()} {profile.name[lang]}</footer>
    </div>
  )
}
