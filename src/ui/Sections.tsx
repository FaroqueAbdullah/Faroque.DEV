import { useState, type FormEvent } from 'react'
import { about, education, experience, profile, projects, skills, ui, type Lang } from '../content/content'
import type { ZoneId } from '../game/zones'

function Welcome({ lang }: { lang: Lang }) {
  return (
    <div className="welcome">
      <p className="eyebrow">{profile.role[lang]}</p>
      <h3 className="display">{profile.name[lang]}</h3>
      <p>{profile.tagline[lang]}</p>
      <p className="hint">{ui.welcomeHint[lang]}</p>
    </div>
  )
}

function About({ lang }: { lang: Lang }) {
  return (
    <div>
      <div className="about-head">
        <div className="avatar" aria-hidden>
          {profile.initials}
        </div>
        <div>
          <strong>{profile.name[lang]}</strong>
          <div className="muted">{profile.location[lang]}</div>
        </div>
      </div>
      {about[lang].map((p, i) => (
        <p key={i}>{p}</p>
      ))}
    </div>
  )
}

function Skills({ lang }: { lang: Lang }) {
  const groups = new Map<string, typeof skills>()
  for (const s of skills) {
    const key = s.group[lang]
    groups.set(key, [...(groups.get(key) ?? []), s])
  }
  return (
    <div className="skills">
      {[...groups].map(([group, list]) => (
        <div key={group} className="skill-group">
          <h4>{group}</h4>
          {list.map((s) => (
            <div key={s.name} className="skill">
              <span>{s.name}</span>
              <div className="bar" role="meter" aria-valuenow={s.level} aria-valuemin={0} aria-valuemax={100} aria-label={s.name}>
                <i style={{ width: `${s.level}%` }} />
              </div>
            </div>
          ))}
        </div>
      ))}
    </div>
  )
}

function Projects({ lang }: { lang: Lang }) {
  const [open, setOpen] = useState<string | null>(null)
  return (
    <div className="cards">
      {projects.map((p) => (
        <article key={p.title} className={`card${open === p.title ? ' expanded' : ''}`}>
          <h4>{p.title}</h4>
          <p className="card-desc">{p.description[lang]}</p>
          <button
            className="read-more"
            aria-expanded={open === p.title}
            onClick={() => setOpen(open === p.title ? null : p.title)}
          >
            {open === p.title ? ui.showLess[lang] : ui.readMore[lang]}
          </button>
          <div className="tags">
            {p.tags.map((t) => (
              <span key={t}>{t}</span>
            ))}
          </div>
          {(p.link || p.repo) && (
            <div className="links">
              {p.link && (
                <a href={p.link} target="_blank" rel="noreferrer">
                  {ui.visit[lang]} ↗
                </a>
              )}
              {p.repo && (
                <a href={p.repo} target="_blank" rel="noreferrer">
                  {ui.code[lang]} ↗
                </a>
              )}
            </div>
          )}
        </article>
      ))}
    </div>
  )
}

function Experience({ lang }: { lang: Lang }) {
  return (
    <ol className="timeline">
      {experience.map((e) => (
        <li key={e.period + e.company}>
          <span className="period">{e.period}</span>
          <strong>{e.role[lang]}</strong>
          <span className="muted"> · {e.company}</span>
          <p>{e.summary[lang]}</p>
          {e.clients && (
            <ul className="clients">
              {e.clients.map((c) => (
                <li key={c.name}>
                  <strong>{c.name}</strong>
                  <span className="muted"> · {c.period}</span>
                  <ul>
                    {c.points.map((pt, i) => (
                      <li key={i}>{pt[lang]}</li>
                    ))}
                  </ul>
                </li>
              ))}
            </ul>
          )}
        </li>
      ))}
    </ol>
  )
}

function Education({ lang }: { lang: Lang }) {
  return (
    <ol className="timeline">
      {education.map((e) => (
        <li key={e.period + e.institution}>
          <span className="period">{e.period}</span>
          <strong>{e.degree[lang]}</strong>
          <span className="muted">
            {' '}
            · {e.institution}, {e.location[lang]}
          </span>
          <ul className="points">
            {e.points.map((pt, i) => (
              <li key={i}>{pt[lang]}</li>
            ))}
          </ul>
        </li>
      ))}
    </ol>
  )
}

function Contact({ lang }: { lang: Lang }) {
  const [name, setName] = useState('')
  const [message, setMessage] = useState('')
  const send = (e: FormEvent) => {
    e.preventDefault()
    const subject = encodeURIComponent(`Hello from ${name || 'your portfolio'}`)
    const body = encodeURIComponent(message)
    window.location.href = `mailto:${profile.email}?subject=${subject}&body=${body}`
  }
  return (
    <div>
      <p>
        <a className="email" href={`mailto:${profile.email}`}>
          {profile.email}
        </a>
      </p>
      <form className="contact-form" onSubmit={send}>
        <label>
          {ui.yourName[lang]}
          <input value={name} onChange={(e) => setName(e.target.value)} />
        </label>
        <label>
          {ui.message[lang]}
          <textarea rows={3} value={message} onChange={(e) => setMessage(e.target.value)} required />
        </label>
        <button className="btn primary" type="submit">
          {ui.sendMail[lang]}
        </button>
      </form>
      <div className="links socials">
        {profile.socials.map((s) => (
          <a key={s.label} href={s.url} target="_blank" rel="noreferrer">
            {s.label} ↗
          </a>
        ))}
        <a href={profile.resumeUrl} download>
          {ui.resume[lang]} ↓
        </a>
      </div>
    </div>
  )
}

export function SectionContent({ id, lang }: { id: ZoneId; lang: Lang }) {
  switch (id) {
    case 'start':
      return <Welcome lang={lang} />
    case 'about':
      return <About lang={lang} />
    case 'skills':
      return <Skills lang={lang} />
    case 'projects':
      return <Projects lang={lang} />
    case 'experience':
      return <Experience lang={lang} />
    case 'education':
      return <Education lang={lang} />
    case 'contact':
      return <Contact lang={lang} />
  }
}
