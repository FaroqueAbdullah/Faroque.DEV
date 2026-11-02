// ─────────────────────────────────────────────────────────────
//  EDIT THIS FILE to put your own information into the portfolio.
//  Every text that appears in the game and in the classic view
//  comes from here. `bn` is the Bangla version of a text.
// ─────────────────────────────────────────────────────────────

export type Lang = 'en' | 'bn'
export type L = { en: string; bn: string }

export const profile = {
  name: { en: 'Faroque Abdullah', bn: 'ফারুক আবদুল্লাহ' } as L,
  role: { en: 'Senior Software Engineer', bn: 'সিনিয়র সফটওয়্যার ইঞ্জিনিয়ার' } as L,
  tagline: {
    en: 'Full-stack engineer blending agentic AI with thoughtful UI/UX — hop on, the ride is on me.',
    bn: 'এজেন্টিক AI আর যত্নশীল UI/UX মিলিয়ে কাজ করা একজন ফুল-স্ট্যাক ইঞ্জিনিয়ার — উঠে পড়ুন, ভাড়া লাগবে না।',
  } as L,
  location: { en: 'Dhaka, Bangladesh', bn: 'ঢাকা, বাংলাদেশ' } as L,
  initials: 'FA',
  email: 'abdullahabir3@gmail.com',
  resumeUrl: '/resume.pdf',
  socials: [
    { label: 'GitHub', url: 'https://github.com/FaroqueAbdullah' },
    { label: 'LinkedIn', url: 'https://www.linkedin.com/in/faroque-abdullah-105985126' },
    { label: 'X / Twitter', url: 'https://x.com/F_Abdullah_Abir' },
    { label: 'Blog', url: 'https://faroque.hashnode.dev' },
  ],
}

export const about: { en: string[]; bn: string[] } = {
  en: [
    'Shobo Shokal (Good Morning)! I am a Senior Software Engineer with 8+ years of experience building large, complex web applications in the JavaScript ecosystem. I currently work at Cefalo, a Norwegian software consultancy, where I consult clients across Europe — PowerSIM (pForecast), Arundo Analytics (CarbonPath, carbon calculation for shipping) and Switchr (Switchr Board and CO₂ Offsets) — in energy, shipping and green investment.',
    'Before Cefalo I worked with EchologyX, an England-based CRO agency, as a UI/UX researcher and A/B testing engineer, consulting Webtrends Optimize and helping their high-traffic, multi-billion dollar brand clients succeed with experiments that lifted user interactions by up to 60%.',
    'Today my focus is agentic AI, UI/UX and full-stack development: designing AI-powered chat workflows, LLM and RAG pipelines and agent-driven development with Claude Code, on top of user-centred, accessible (WCAG) interfaces in React, Next.js, Vue and Svelte and backends in Node.js, Express and FastAPI.',
  ],
  bn: [
    'শুভ সকাল (Good Morning)! আমি একজন সিনিয়র সফটওয়্যার ইঞ্জিনিয়ার, জাভাস্ক্রিপ্ট দুনিয়ায় বড় ও জটিল ওয়েব অ্যাপ্লিকেশন বানানোর ৮+ বছরের অভিজ্ঞতা আছে। বর্তমানে কাজ করছি Cefalo-তে। Cefalo নরওয়ের একটি সফটওয়্যার কনসালটেন্সি ফার্ম, যেখানে আমি ইউরোপের বিভিন্ন ক্লায়েন্টকে কনসাল্ট করি — PowerSIM (pForecast), Arundo Analytics (CarbonPath, শিপিংয়ের কার্বন হিসাব) আর Switchr (Switchr Board ও CO₂ Offsets) — জ্বালানি, শিপিং আর সবুজ বিনিয়োগ খাতে।',
    'Cefalo-র আগে আমি ইংল্যান্ডভিত্তিক CRO এজেন্সি EchologyX-এ UI/UX গবেষক ও A/B টেস্টিং ইঞ্জিনিয়ার হিসেবে কাজ করেছি। Webtrends Optimize-কে কনসাল্ট করে তাদের বিলিয়ন ডলারের ব্র্যান্ড ক্লায়েন্টদের সফল হতে সাহায্য করেছি — এক্সপেরিমেন্টে ইউজার ইন্টারঅ্যাকশন বেড়েছে ৬০% পর্যন্ত।',
    'এখন আমার মূল ফোকাস এজেন্টিক AI, UI/UX আর ফুল-স্ট্যাক ডেভেলপমেন্ট: AI চ্যাট ওয়ার্কফ্লো, LLM ও RAG পাইপলাইন, Claude Code দিয়ে এজেন্ট-চালিত ডেভেলপমেন্ট — সাথে React, Next.js, Vue, Svelte-এ ইউজার-কেন্দ্রিক ও অ্যাক্সেসিবল (WCAG) ইন্টারফেস আর Node.js, Express, FastAPI-তে ব্যাকএন্ড।',
  ],
}

const LANG: L = { en: 'Languages', bn: 'ভাষা' }
const FE: L = { en: 'Frontend', bn: 'ফ্রন্টএন্ড' }
const BE: L = { en: 'Backend & Data', bn: 'ব্যাকএন্ড ও ডেটা' }
const AI: L = { en: 'AI & Tools', bn: 'AI ও টুলস' }

export const skills: { name: string; level: number; group: L }[] = [
  { name: 'TypeScript', level: 95, group: LANG },
    { name: 'React', level: 95, group: FE },
  { name: 'Next.js', level: 85, group: FE },
  { name: 'Svelte / Vue', level: 80, group: FE },
  { name: 'UI / UX', level: 88, group: FE },
  { name: 'Node.js', level: 88, group: BE },
  { name: 'PostgreSQL', level: 80, group: BE },
  { name: 'Agentic AI', level: 88, group: AI },
  { name: 'LLM / RAG', level: 80, group: AI },
  { name: 'Claude Code', level: 88, group: AI },
  { name: 'Docker / Azure', level: 75, group: AI },
]

export const projects: {
  title: string
  description: L
  tags: string[]
  link?: string
  repo?: string
}[] = [
  {
    title: 'pForecast',
    description: {
      en: 'Energy production forecasting platform for European energy operators, built for PowerSIM (Norway). Asset teams simulate production over a field’s full lifetime, combining reservoir data, drilling schedules and facility capacity, and run Monte Carlo analysis to see low, expected and high outcomes. That helps them plan capacity, use resources efficiently and cut waste on the road to cleaner, more responsible energy. I work in a dual design and engineering role: I sketch and prototype accessible (WCAG) UIs with AI design tools that make complex forecasting workflows simple, build new interactive features, and lead the migration from legacy dependencies to a modern stack, using AI for code generation, code reviews and automated testing.',
      bn: 'PowerSIM (নরওয়ে)-এর জন্য ইউরোপের জ্বালানি কোম্পানিগুলোর উৎপাদন পূর্বাভাসের প্ল্যাটফর্ম। রিজার্ভার ডেটা, ড্রিলিং শিডিউল আর স্থাপনার সক্ষমতা মিলিয়ে একটি ক্ষেত্রের পুরো জীবনকালের উৎপাদন সিমুলেট করা যায়, আর Monte Carlo বিশ্লেষণে কম, প্রত্যাশিত ও বেশি — তিন রকম ফলাফল দেখা যায়। এতে সক্ষমতা পরিকল্পনা, সম্পদের দক্ষ ব্যবহার আর অপচয় কমানো সহজ হয় — আরও পরিচ্ছন্ন ও দায়িত্বশীল জ্বালানির পথে। আমি ডিজাইন ও ইঞ্জিনিয়ারিং দুই ভূমিকায় কাজ করি: AI ডিজাইন টুল দিয়ে জটিল ওয়ার্কফ্লো সহজ করে অ্যাক্সেসিবল (WCAG) UI প্রোটোটাইপ করি, নতুন ইন্টারঅ্যাকটিভ ফিচার বানাই, আর AI-এর সাহায্যে কোড জেনারেশন, কোড রিভিউ ও স্বয়ংক্রিয় টেস্টিং ব্যবহার করে পুরনো স্ট্যাক থেকে আধুনিক স্ট্যাকে মাইগ্রেশনের নেতৃত্ব দিই।',
    },
    tags: ['TypeScript', 'React', 'C#', '.NET Core', 'SQL Server', 'Azure', 'WCAG'],
    link: 'https://powersim.com/pforecast-solution/',
  },
  {
    title: 'CarbonPath',
    description: {
      en: 'Carbon calculation platform for the shipping industry, built for Arundo Analytics (Norway). Ship owners, managers, charterers and suppliers share one Scope 3 ledger, where activities like fuel burned on chartered vessels, drydocking and lube-oil orders are automatically sorted into the 15 Scope 3 categories and turned into audit-ready emissions reports. I architected an agentic AI chat workflow so users run carbon calculations and management tasks in plain language instead of clicking through screens. Using AI agents throughout development, I integrated backend APIs, implemented role-based access control (RBAC) for a multi-tenant setup, built pixel-perfect UI components and generated robust automated tests.',
      bn: 'Arundo Analytics (নরওয়ে)-এর জন্য শিপিং ইন্ডাস্ট্রির কার্বন হিসাবের প্ল্যাটফর্ম। জাহাজের মালিক, ম্যানেজার, চার্টারার আর সাপ্লায়াররা একটি Scope 3 লেজার শেয়ার করে, যেখানে চার্টার করা জাহাজের জ্বালানি, ড্রাইডকিং বা লুব-অয়েল অর্ডারের মতো কাজ স্বয়ংক্রিয়ভাবে ১৫টি Scope 3 ক্যাটাগরিতে ভাগ হয়ে অডিট-উপযোগী নিঃসরণ রিপোর্টে পরিণত হয়। আমি এজেন্টিক AI চ্যাট ওয়ার্কফ্লো ডিজাইন করেছি, যাতে স্ক্রিনে ক্লিক না করে সাধারণ ভাষায় কার্বন হিসাব ও ব্যবস্থাপনা করা যায়। পুরো ডেভেলপমেন্টে AI এজেন্ট ব্যবহার করে ব্যাকএন্ড API ইন্টিগ্রেশন, মাল্টি-টেন্যান্ট RBAC, নিখুঁত UI কম্পোনেন্ট আর স্বয়ংক্রিয় টেস্ট বানিয়েছি।',
    },
    tags: ['TypeScript', 'React', 'Express', 'PostgreSQL', 'Redis', 'Agentic AI', 'Azure'],
    link: 'https://arundo.com/solutions/carbonpath',
  },
  {
    title: 'Switchr Board',
    description: {
      en: 'Investment platform for Switchr (Norway), a company that builds and runs large solar parks across Europe. Anyone can buy a share of a solar park, earn a yearly profit and follow their impact live: profit earned, CO₂ saved and energy produced. I built both the web and the mobile app, developing core frontend features, integrating backend APIs, delivering a pixel-perfect UI, automating data updates and writing automated tests, with a focus on performance across platforms.',
      bn: 'Switchr (নরওয়ে)-এর বিনিয়োগ প্ল্যাটফর্ম। Switchr ইউরোপজুড়ে বড় সোলার পার্ক বানায় ও চালায়। যে কেউ সোলার পার্কের অংশ কিনে বছরে লাভ পেতে পারে এবং লাইভ দেখতে পারে তার প্রভাব: অর্জিত লাভ, বাঁচানো CO₂ আর উৎপাদিত বিদ্যুৎ। আমি ওয়েব ও মোবাইল দুটো অ্যাপই বানিয়েছি — মূল ফ্রন্টএন্ড ফিচার, ব্যাকএন্ড API ইন্টিগ্রেশন, নিখুঁত UI, স্বয়ংক্রিয় ডেটা আপডেট আর অটোমেটেড টেস্ট, সব প্ল্যাটফর্মে পারফরম্যান্সের দিকে নজর রেখে।',
    },
    tags: ['JavaScript', 'React', 'React Native', 'C#', 'Go', 'Azure'],
    link: 'https://board.switchr.com/sign-in',
  },
  {
    title: 'Switchr CO₂ Offsets',
    description: {
      en: 'A second Switchr platform where people and businesses buy CO₂ offsets and track their contribution to sustainability goals: offsets purchased, CO₂ reduced and the impact of each contribution. My role was frontend-focused: I built the web interfaces and core features, integrated backend APIs for real-time data, automated dynamic updates, wrote frontend tests and tuned performance and responsiveness.',
      bn: 'Switchr-এর দ্বিতীয় প্ল্যাটফর্ম, যেখানে মানুষ ও প্রতিষ্ঠান CO₂ অফসেট কিনে টেকসই লক্ষ্যে নিজেদের অবদান ট্র্যাক করে: কেনা অফসেট, কমানো CO₂ আর প্রতিটি অবদানের প্রভাব। আমার কাজ ছিল মূলত ফ্রন্টএন্ড: ওয়েব ইন্টারফেস ও মূল ফিচার বানানো, রিয়েল-টাইম ডেটার জন্য API ইন্টিগ্রেশন, ডায়নামিক আপডেট অটোমেশন, ফ্রন্টএন্ড টেস্ট আর পারফরম্যান্স ও রেসপনসিভনেস উন্নত করা।',
    },
    tags: ['Svelte', 'TypeScript', 'PHP', 'PostgreSQL', 'Docker', 'Azure'],
    link: 'https://switchr.com/',
  },
  {
    title: 'Webtrends Optimize',
    description: {
      en: 'Experimentation platform for A/B, multivariate and split-URL testing and personalisation, used by large brands. Through EchologyX (England) I consulted Webtrends Optimize as a UI/UX researcher and engineer: I designed and built complex frontend features for the testing platform itself, and researched, built and shipped A/B test variations for high-traffic sites of multi-billion dollar brands. Working with optimisation managers, these experiments lifted user interactions by up to 60% and key business metrics by up to 30%, without hurting site performance.',
      bn: 'বড় ব্র্যান্ডগুলোর ব্যবহৃত A/B, মাল্টিভ্যারিয়েট ও স্প্লিট-URL টেস্টিং আর পার্সোনালাইজেশন প্ল্যাটফর্ম। EchologyX (ইংল্যান্ড)-এর মাধ্যমে UI/UX গবেষক ও ইঞ্জিনিয়ার হিসেবে Webtrends Optimize-কে কনসাল্ট করেছি: টেস্টিং প্ল্যাটফর্মের জটিল ফ্রন্টএন্ড ফিচার ডিজাইন ও তৈরি করেছি, আর বিলিয়ন ডলারের ব্র্যান্ডগুলোর বেশি ট্রাফিকের সাইটের জন্য A/B টেস্ট গবেষণা, তৈরি ও চালু করেছি। অপ্টিমাইজেশন ম্যানেজারদের সাথে মিলে এসব এক্সপেরিমেন্টে ইউজার ইন্টারঅ্যাকশন ৬০% আর মূল ব্যবসায়িক মেট্রিক ৩০% পর্যন্ত বেড়েছে, সাইটের পারফরম্যান্স না কমিয়েই।',
    },
    tags: ['JavaScript', 'React', 'Node', 'UI/UX Research', 'A/B Testing'],
    link: 'https://www.webtrends-optimize.com/',
  },
  {
    title: 'KPN E-commerce',
    description: {
      en: 'Large-scale e-commerce application for KPN, the Dutch telecom company, built at Binate Solutions. It served millions of users and managed millions of products. I built complex frontend features, developed the admin panel for large-scale product management, integrated secure authentication with role-based access control, worked with designers on pixel-perfect UI/UX, and optimised performance for scalability under heavy traffic.',
      bn: 'Binate Solutions-এ থাকাকালীন নেদারল্যান্ডসের টেলিকম কোম্পানি KPN-এর জন্য বানানো বড় ই-কমার্স অ্যাপ্লিকেশন, যা লাখো ইউজার ও লাখো প্রোডাক্ট সামলাত। আমি জটিল ফ্রন্টএন্ড ফিচার, বড় পরিসরের প্রোডাক্ট ব্যবস্থাপনার অ্যাডমিন প্যানেল, RBAC-সহ নিরাপদ অথেনটিকেশন বানিয়েছি, ডিজাইনারদের সাথে নিখুঁত UI/UX করেছি, আর বেশি ট্রাফিকে স্কেল করার জন্য পারফরম্যান্স অপ্টিমাইজ করেছি।',
    },
    tags: ['JavaScript', 'Vue', 'Angular', 'Node.js', 'Python', 'MySQL'],
    link: 'https://www.kpn.com/shop',
  },
  {
    title: 'DoctorKoi Smart',
    description: {
      en: 'Desktop app for doctors in Bangladesh that replaces handwritten prescriptions with digital ones, automates follow-up schedules, sends patient reminders and handles admin tasks, reducing errors from illegible handwriting. I built key frontend features, integrated backend APIs, worked with designers on a pixel-perfect UI, and added data sync and browser caching for up to 40% faster load times.',
      bn: 'বাংলাদেশের ডাক্তারদের জন্য ডেস্কটপ অ্যাপ, যা হাতে লেখা প্রেসক্রিপশনের বদলে ডিজিটাল প্রেসক্রিপশন দেয়, ফলো-আপ শিডিউল স্বয়ংক্রিয় করে, রোগীকে রিমাইন্ডার পাঠায় আর প্রশাসনিক কাজ সামলায় — অস্পষ্ট হাতের লেখার ভুল কমায়। আমি মূল ফ্রন্টএন্ড ফিচার, ব্যাকএন্ড API ইন্টিগ্রেশন, ডিজাইনারদের সাথে নিখুঁত UI, আর ডেটা সিঙ্ক ও ব্রাউজার ক্যাশিং দিয়ে ৪০% পর্যন্ত দ্রুত লোড নিশ্চিত করেছি।',
    },
    tags: ['TypeScript', 'React', 'Electron', 'GraphQL', 'MobX', 'MongoDB'],
    link: 'https://doctorkoi.com/',
  },
]

export const experience: {
  period: string
  role: L
  company: string
  summary: L
  clients?: { name: string; period: string; points: L[] }[]
}[] = [
  {
    period: '2022 — Now',
    role: { en: 'Senior Software Engineer · Consultant', bn: 'সিনিয়র সফটওয়্যার ইঞ্জিনিয়ার · কনসালট্যান্ট' },
    company: 'Cefalo · Norway',
    summary: {
      en: 'Consultant at a Norwegian software firm, embedded in the product teams of European clients.',
      bn: 'নরওয়ের সফটওয়্যার ফার্মের কনসালট্যান্ট, ইউরোপীয় ক্লায়েন্টদের প্রোডাক্ট টিমে সরাসরি কাজ করি।',
    },
    clients: [
      {
        name: 'PowerSIM · pForecast',
        period: '2025 — Now',
        points: [
          {
            en: 'Dual design and engineering role on an energy production forecasting platform for European operators.',
            bn: 'ইউরোপীয় জ্বালানি কোম্পানির উৎপাদন পূর্বাভাস প্ল্যাটফর্মে ডিজাইন ও ইঞ্জিনিয়ারিং দুই ভূমিকা।',
          },
          {
            en: 'Prototype accessible (WCAG) UIs with AI design tools that make complex forecasting workflows simple.',
            bn: 'AI ডিজাইন টুল দিয়ে জটিল ওয়ার্কফ্লো সহজ করে অ্যাক্সেসিবল (WCAG) UI প্রোটোটাইপ করি।',
          },
          {
            en: 'Lead the migration to a modern stack, using AI for code generation, code reviews and automated testing.',
            bn: 'AI দিয়ে কোড জেনারেশন, কোড রিভিউ ও স্বয়ংক্রিয় টেস্টিং ব্যবহার করে আধুনিক স্ট্যাকে মাইগ্রেশনের নেতৃত্ব দিই।',
          },
        ],
      },
      {
        name: 'Arundo Analytics · CarbonPath',
        period: '2023 — 2025',
        points: [
          {
            en: 'Architected an agentic AI chat workflow so users run carbon calculations for shipping in plain language.',
            bn: 'এজেন্টিক AI চ্যাট ওয়ার্কফ্লো ডিজাইন করেছি, যাতে সাধারণ ভাষায় শিপিংয়ের কার্বন হিসাব করা যায়।',
          },
          {
            en: 'Implemented multi-tenant role-based access control (RBAC) and integrated backend APIs.',
            bn: 'মাল্টি-টেন্যান্ট রোল-ভিত্তিক অ্যাক্সেস কন্ট্রোল (RBAC) ও ব্যাকএন্ড API ইন্টিগ্রেশন করেছি।',
          },
          {
            en: 'Created a component library that raised in-house component usage by 80%.',
            bn: 'কম্পোনেন্ট লাইব্রেরি বানিয়ে ইন-হাউস কম্পোনেন্টের ব্যবহার ৮০% বাড়িয়েছি।',
          },
        ],
      },
      {
        name: 'Switchr · Switchr Board',
        period: '2022 — 2023',
        points: [
          {
            en: 'Built the web and mobile apps for investing in European solar parks and tracking profit, CO₂ saved and energy produced.',
            bn: 'ইউরোপের সোলার পার্কে বিনিয়োগ এবং লাভ, বাঁচানো CO₂ ও উৎপাদিত বিদ্যুৎ ট্র্যাক করার ওয়েব ও মোবাইল অ্যাপ বানিয়েছি।',
          },
          {
            en: 'Built the frontend of a CO₂ offset platform where users buy offsets and follow their impact.',
            bn: 'CO₂ অফসেট প্ল্যাটফর্মের ফ্রন্টএন্ড বানিয়েছি, যেখানে ব্যবহারকারী অফসেট কিনে প্রভাব দেখতে পারে।',
          },
        ],
      },
    ],
  },
  {
    period: '2021 — 2022',
    role: { en: 'Senior Software Engineer · Consultant', bn: 'সিনিয়র সফটওয়্যার ইঞ্জিনিয়ার · কনসালট্যান্ট' },
    company: 'EchologyX · England',
    summary: {
      en: 'Worked as a UI/UX researcher and A/B testing engineer: studied how users behave, designed experiments and turned the results into better interfaces and higher conversion rates (CRO).',
      bn: 'UI/UX গবেষক ও A/B টেস্টিং ইঞ্জিনিয়ার হিসেবে কাজ করেছি: ব্যবহারকারীর আচরণ বিশ্লেষণ, এক্সপেরিমেন্ট ডিজাইন, আর ফলাফল দিয়ে আরও ভালো ইন্টারফেস ও বেশি কনভার্সন (CRO) নিশ্চিত করেছি।',
    },
    clients: [
      {
        name: 'Webtrends Optimize',
        period: '2021 — 2022',
        points: [
          {
            en: 'Researched UI/UX and shipped A/B test variations for their multi-billion dollar brand clients.',
            bn: 'তাদের বিলিয়ন ডলারের ব্র্যান্ড ক্লায়েন্টদের জন্য UI/UX গবেষণা ও A/B টেস্ট ভ্যারিয়েশন বানিয়েছি।',
          },
          {
            en: 'Up to 60% more user interactions, 30% growth in key metrics and 40% faster loads with SSR.',
            bn: '৬০% পর্যন্ত বেশি ইন্টারঅ্যাকশন, মূল মেট্রিকে ৩০% প্রবৃদ্ধি আর SSR দিয়ে ৪০% দ্রুত লোড।',
          },
          {
            en: 'Built frontend features for the testing platform and mentored developers on A/B testing.',
            bn: 'টেস্টিং প্ল্যাটফর্মের ফ্রন্টএন্ড ফিচার বানিয়েছি এবং ডেভেলপারদের A/B টেস্টিং শিখিয়েছি।',
          },
        ],
      },
    ],
  },
  {
    period: '2020 — 2021',
    role: { en: 'Software Engineer', bn: 'সফটওয়্যার ইঞ্জিনিয়ার' },
    company: 'Binate Solutions · Bangladesh',
    summary: {
      en: 'Frontend and UI/UX work on a large-scale e-commerce platform serving millions of users.',
      bn: 'লাখো ব্যবহারকারীর বড় ই-কমার্স প্ল্যাটফর্মে ফ্রন্টএন্ড ও UI/UX কাজ।',
    },
    clients: [
      {
        name: 'KPN · E-commerce platform',
        period: '2020 — 2021',
        points: [
          {
            en: 'Worked with designers to deliver pixel-perfect, responsive shopping UIs for millions of users.',
            bn: 'ডিজাইনারদের সাথে মিলে লাখো ব্যবহারকারীর জন্য নিখুঁত, রেসপন্সিভ শপিং UI বানিয়েছি।',
          },
          {
            en: 'Shaped the admin panel UX so teams could manage millions of products through clear, fast flows.',
            bn: 'অ্যাডমিন প্যানেলের UX সাজিয়েছি, যাতে টিম সহজ ও দ্রুত ধাপে লাখো প্রোডাক্ট পরিচালনা করতে পারে।',
          },
          {
            en: 'Built the role-based (RBAC) sign-in and permission flows, keeping security simple for every user role.',
            bn: 'রোল-ভিত্তিক (RBAC) সাইন-ইন ও পারমিশন ফ্লো বানিয়েছি, যাতে প্রতিটি রোলের জন্য নিরাপত্তা সহজ থাকে।',
          },
          {
            en: 'Introduced TDD, cutting bug reports by 30%, and tuned performance for heavy traffic.',
            bn: 'TDD চালু করে বাগ রিপোর্ট ৩০% কমিয়েছি এবং ভারী ট্রাফিকের জন্য পারফরম্যান্স বাড়িয়েছি।',
          },
        ],
      },
    ],
  },
  {
    period: '2019 — 2020',
    role: { en: 'Software Engineer', bn: 'সফটওয়্যার ইঞ্জিনিয়ার' },
    company: 'DoctorKoi Smart · Bangladesh',
    summary: {
      en: 'Frontend and UI/UX work on a desktop app that helps doctors run their practice.',
      bn: 'ডাক্তারদের চেম্বার পরিচালনায় সাহায্য করা ডেস্কটপ অ্যাপে ফ্রন্টএন্ড ও UI/UX কাজ।',
    },
    clients: [
      {
        name: 'DoctorKoi · Digital prescription app',
        period: '2019 — 2020',
        points: [
          {
            en: 'Built the UI doctors use to write digital prescriptions, schedule follow-ups and send patient reminders.',
            bn: 'ডিজিটাল প্রেসক্রিপশন লেখা, ফলো-আপ শিডিউল আর রোগীকে রিমাইন্ডার পাঠানোর UI বানিয়েছি।',
          },
          {
            en: 'Worked directly with clients, marketing and designers to turn requirements into simple, pixel-perfect screens.',
            bn: 'ক্লায়েন্ট, মার্কেটিং ও ডিজাইনারদের সাথে সরাসরি কাজ করে রিকোয়ারমেন্টকে সহজ, নিখুঁত স্ক্রিনে রূপ দিয়েছি।',
          },
          {
            en: 'Added data sync and caching for up to 40% faster loads, so the app stays quick during busy clinic hours.',
            bn: 'ডেটা সিঙ্ক ও ক্যাশিং যোগ করে ৪০% পর্যন্ত দ্রুত লোড, যাতে ব্যস্ত সময়েও অ্যাপ দ্রুত থাকে।',
          },
        ],
      },
    ],
  },
]

export const education: {
  period: string
  degree: L
  institution: string
  location: L
  points: L[]
}[] = [
  {
    period: '2015 — 2019',
    degree: { en: 'B.Tech in Information Technology', bn: 'ইনফরমেশন টেকনোলজিতে বি.টেক' },
    institution: 'Lovely Professional University',
    location: { en: 'Punjab, India', bn: 'পাঞ্জাব, ভারত' },
    points: [
      {
        en: 'Won placements in hackathons and coding competitions across India.',
        bn: 'ভারতজুড়ে হ্যাকাথন ও কোডিং প্রতিযোগিতায় পুরস্কার।',
      },
      {
        en: 'Specialisation courses in Android development.',
        bn: 'অ্যান্ড্রয়েড ডেভেলপমেন্টে বিশেষায়িত কোর্স।',
      },
      {
        en: 'Certified in cyber security and ethical hacking (AEGIS Institute).',
        bn: 'সাইবার সিকিউরিটি ও এথিক্যাল হ্যাকিং সার্টিফিকেশন (AEGIS Institute)।',
      },
      {
        en: 'Certified in SAP ABAP, TAW10 & TAW12 (SAP Education India).',
        bn: 'SAP ABAP সার্টিফিকেশন, TAW10 ও TAW12 (SAP Education India)।',
      },
    ],
  },
]

// Shown when the visitor collects every fuchka on the road.
export const funFact: L = {
  en: 'Easter egg unlocked! Fun fact: I once ate 30 fuchkas in one sitting.',
  bn: 'ইস্টার এগ আনলক! মজার তথ্য: আমি একবার এক বসায় ৩০টা ফুচকা খেয়েছিলাম।',
}

// Interface texts.
export const ui = {
  ride: { en: 'Start the ride', bn: 'যাত্রা শুরু' },
  classic: { en: 'Classic view', bn: 'সাধারণ ভিউ' },
  backToRide: { en: 'Back to the ride', bn: 'রাইডে ফিরুন' },
  readMore: { en: 'Read more', bn: 'আরও পড়ুন' },
  showLess: { en: 'Show less', bn: 'কম দেখুন' },
  loading: { en: 'Loading the streets of Dhaka…', bn: 'ঢাকার রাস্তা লোড হচ্ছে…' },
  controls: {
    en: 'W A S D / arrow keys to drive · Space to ring the bell',
    bn: 'চালাতে W A S D / অ্যারো কী · ঘণ্টা বাজাতে স্পেস',
  },
  touchControls: {
    en: 'Use the on-screen buttons to drive',
    bn: 'চালাতে স্ক্রিনের বোতাম ব্যবহার করুন',
  },
  nextStop: { en: 'Next stop', bn: 'পরের স্টপ' },
  endOfRoad: {
    en: 'End of the road — go round the roundabout and ride back!',
    bn: 'রাস্তা শেষ — গোলচত্বর ঘুরে ফিরে চলুন!',
  },
  backAtStart: {
    en: 'Back at the start — thanks for riding!',
    bn: 'শুরুতে ফিরে এসেছেন — রাইডের জন্য ধন্যবাদ!',
  },
  fuchka: { en: 'Fuchka', bn: 'ফুচকা' },
  visit: { en: 'Visit', bn: 'দেখুন' },
  code: { en: 'Code', bn: 'কোড' },
  resume: { en: 'Download résumé', bn: 'জীবনবৃত্তান্ত ডাউনলোড' },
  sendMail: { en: 'Send message', bn: 'বার্তা পাঠান' },
  yourName: { en: 'Your name', bn: 'আপনার নাম' },
  message: { en: 'Message', bn: 'বার্তা' },
  close: { en: 'Close', bn: 'বন্ধ' },
  welcomeHint: {
    en: 'Drive forward along the road. Each painted gate is a stop of my story.',
    bn: 'রাস্তা ধরে সামনে চালান। প্রতিটি রঙিন গেট আমার গল্পের একটি স্টপ।',
  },
} satisfies Record<string, L>
