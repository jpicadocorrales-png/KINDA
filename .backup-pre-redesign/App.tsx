import { useEffect, useState } from 'react'
import {
  Activity,
  Apple,
  ArrowRight,
  ArrowUpRight,
  Bike,
  BookOpen,
  Brain,
  Briefcase,
  CalendarDays,
  Check,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Circle,
  Clock3,
  Coffee,
  Copy,
  Droplets,
  Dumbbell,
  Flower2,
  Footprints,
  GraduationCap,
  Heart,
  HeartPulse,
  House,
  Languages,
  Laptop,
  Leaf,
  ListChecks,
  Menu,
  Moon,
  MoreHorizontal,
  Music,
  NotebookPen,
  Palette,
  PersonStanding,
  Plus,
  Repeat,
  RotateCcw,
  Search,
  SlidersHorizontal,
  Smartphone,
  Sparkles,
  Sprout,
  Sun,
  Sunrise,
  Trash2,
  TrendingUp,
  UserRound,
  Utensils,
  Wallet,
  X,
  type LucideIcon,
} from 'lucide-react'

type Section = 'Overview' | 'Routines' | 'Habits' | 'Calendar' | 'Insights' | 'Profile' | 'Settings'
type Status = 'complete' | 'partial' | 'skipped' | 'rescheduled'
type Habit = { id: string; name: string; category: string; duration: number; time: string; routine: string }
type Routine = { id: string; name: string; time: string; duration: number; days: string[]; habitIds: string[]; paused?: boolean }
type ActivityRecord = { status: Status; amount?: string; rescheduledTo?: string }
type Profile = { name: string }
type Workspace = { habits: Habit[]; routines: Routine[]; records: Record<string, ActivityRecord>; profile?: Profile }
type Tone = 'orange' | 'butter' | 'sage' | 'beige'

const navigation: { name: Section; icon: LucideIcon }[] = [
  { name: 'Overview', icon: House },
  { name: 'Routines', icon: Repeat },
  { name: 'Habits', icon: ListChecks },
  { name: 'Calendar', icon: CalendarDays },
  { name: 'Insights', icon: TrendingUp },
]

const initialHabits: Habit[] = [
  { id: 'walk', name: 'A little fresh air', category: 'Health', duration: 20, time: '8:00 AM', routine: 'A gentle morning' },
  { id: 'water', name: 'Drink a glass of water', category: 'Health', duration: 2, time: '8:20 AM', routine: 'A gentle morning' },
  { id: 'journal', name: 'A few journal lines', category: 'Personal Growth', duration: 10, time: '8:30 AM', routine: 'A gentle morning' },
  { id: 'read', name: 'Read a few pages', category: 'Personal Growth', duration: 15, time: '9:00 PM', routine: 'Slow evenings' },
  { id: 'stretch', name: 'Stretch and unwind', category: 'Mindfulness', duration: 10, time: '9:20 PM', routine: 'Slow evenings' },
  { id: 'connect', name: 'Check in with someone', category: 'Relationships', duration: 5, time: '6:00 PM', routine: 'A little connection' },
]

const initialRoutines: Routine[] = [
  { id: 'morning', name: 'A gentle morning', time: '8:00 AM', duration: 32, days: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'], habitIds: ['walk', 'water', 'journal'] },
  { id: 'evening', name: 'Slow evenings', time: '9:00 PM', duration: 25, days: ['Mon', 'Wed', 'Fri', 'Sat'], habitIds: ['read', 'stretch'] },
  { id: 'connection', name: 'A little connection', time: '6:00 PM', duration: 5, days: ['Tue', 'Thu', 'Sat'], habitIds: ['connect'] },
]

const categories = ['All habits', 'Health', 'Personal Growth', 'Work', 'Mindfulness', 'Relationships', 'Lifestyle']
const dayLabels = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']
const dayInitials = ['M', 'T', 'W', 'T', 'F', 'S', 'S']
const storageKey = 'kinda-workspace-v1'
const defaultName = 'Sam Taylor'

/* Brand colors: orange = action & progress, sage = routines, habits & positive
   progress, butter = reminders & small wins, beige = neutral. */
const categoryTones: Record<string, Tone> = { Health: 'sage', 'Personal Growth': 'butter', Work: 'orange', Mindfulness: 'sage', Relationships: 'orange', Lifestyle: 'beige' }
const routineTones: Tone[] = ['sage', 'butter', 'orange']

/* Each habit gets a meaningful icon: matched by keywords in its name first,
   then by its category. */
const habitIconRules: [RegExp, LucideIcon][] = [
  [/\bread|book|\bpages?\b/i, BookOpen],
  [/water|drink|hydrat/i, Droplets],
  [/journal|diary|\bwrit(e|ing)\b/i, NotebookPen],
  [/walk|fresh air|outside|\bsteps?\b|hike/i, Footprints],
  [/stretch|yoga|posture|unwind/i, PersonStanding],
  [/meditat|breath|calm|mindful/i, Flower2],
  [/exercise|workout|\bgym\b|strength|\blift|\brun/i, Dumbbell],
  [/\bbike|cycl/i, Bike],
  [/sleep|\bbed\b|bedtime|\brest\b|\bnap\b/i, Moon],
  [/learn|study|course|\bclass/i, GraduationCap],
  [/language|spanish|english|french/i, Languages],
  [/friend|family|someone|\bcall\b|check in|connect|partner/i, Heart],
  [/\bcook|meal|dinner|lunch|breakfast/i, Utensils],
  [/fruit|vegetable|\beat\b|snack/i, Apple],
  [/clean|tidy|declutter/i, Sparkles],
  [/coffee|\btea\b/i, Coffee],
  [/music|guitar|piano|\bsing/i, Music],
  [/draw|paint|\bart\b|creative/i, Palette],
  [/plant|garden/i, Sprout],
  [/money|budget|\bsav(e|ing)|spend/i, Wallet],
  [/screen|phone|social media/i, Smartphone],
  [/focus|email|inbox|\bwork\b/i, Laptop],
  [/think|puzzle|reflect/i, Brain],
]
const categoryIcons: Record<string, LucideIcon> = { Health: HeartPulse, 'Personal Growth': GraduationCap, Work: Briefcase, Mindfulness: Flower2, Relationships: Heart, Lifestyle: Leaf }

function habitIcon(habit: Habit): LucideIcon {
  return habitIconRules.find(([pattern]) => pattern.test(habit.name))?.[1] ?? categoryIcons[habit.category] ?? Leaf
}

function HabitIcon({ habit, size = 18 }: { habit: Habit; size?: number }) {
  const Icon = habitIcon(habit)
  return <Icon size={size} strokeWidth={2} />
}

function toneFor(category: string): Tone {
  return categoryTones[category] ?? 'beige'
}

function RoutineIcon({ routine, size = 20 }: { routine: Routine; size?: number }) {
  const minutes = timeInMinutes(routine.time)
  if (minutes < 12 * 60) return <Sunrise size={size} strokeWidth={2} />
  if (minutes >= 19 * 60) return <Moon size={size} strokeWidth={2} />
  return <Coffee size={size} strokeWidth={2} />
}

function freshWorkspace(): Workspace {
  return { habits: initialHabits, routines: initialRoutines, records: {} }
}

function readWorkspace(): Workspace {
  try {
    const saved = localStorage.getItem(storageKey)
    if (saved) return JSON.parse(saved) as Workspace
  } catch {
    // Keep a fresh workspace usable if local storage is unavailable or malformed.
  }
  return freshWorkspace()
}

function dateKey(date: Date, habitId: string) {
  return `${date.toDateString()}:${habitId}`
}

function App() {
  const [workspace, setWorkspace] = useState(readWorkspace)
  const [section, setSection] = useState<Section>('Overview')
  const [selectedDate, setSelectedDate] = useState(new Date())
  const [search, setSearch] = useState('')
  const [category, setCategory] = useState('All habits')
  const [modal, setModal] = useState<'routine' | 'habit' | null>(null)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [notice, setNotice] = useState('')

  useEffect(() => {
    try {
      localStorage.setItem(storageKey, JSON.stringify(workspace))
    } catch {
      setNotice('Changes will last for this session only.')
    }
  }, [workspace])

  useEffect(() => {
    if (!notice) return
    const timeout = window.setTimeout(() => setNotice(''), 2800)
    return () => window.clearTimeout(timeout)
  }, [notice])

  const profileName = workspace.profile?.name || defaultName
  const firstName = profileName.split(' ')[0]
  const initial = profileName.charAt(0).toUpperCase()

  const todayActivities = workspace.habits.filter((habit) => {
    const routine = workspace.routines.find((item) => item.name === habit.routine)
    return !routine?.paused
  })
  const completedCount = todayActivities.filter((habit) => workspace.records[dateKey(new Date(), habit.id)]?.status === 'complete').length
  const progress = todayActivities.length ? Math.round((completedCount / todayActivities.length) * 100) : 0

  function recordActivity(habitId: string, status: Status, date = selectedDate) {
    const key = dateKey(date, habitId)
    const record: ActivityRecord = { status }
    if (status === 'rescheduled') {
      const nextDay = new Date(date)
      nextDay.setDate(nextDay.getDate() + 1)
      record.rescheduledTo = nextDay.toDateString()
    }
    setWorkspace((current) => ({ ...current, records: { ...current.records, [key]: record } }))
    const label = status === 'complete' ? 'Done' : status === 'partial' ? 'Marked as a little progress' : status === 'skipped' ? 'Skipped for today' : 'Moved to tomorrow'
    setNotice(label)
  }

  function updateRoutine(routineId: string, action: 'pause' | 'duplicate') {
    setWorkspace((current) => {
      const routine = current.routines.find((item) => item.id === routineId)
      if (!routine) return current
      if (action === 'pause') return { ...current, routines: current.routines.map((item) => item.id === routineId ? { ...item, paused: !item.paused } : item) }
      return { ...current, routines: [...current.routines, { ...routine, id: `${routine.id}-${Date.now()}`, name: `${routine.name} (copy)`, paused: false }] }
    })
    setNotice(action === 'pause' ? 'Routine status updated' : 'Routine duplicated')
  }

  function saveItem(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const formData = new FormData(event.currentTarget)
    const name = String(formData.get('name') || '').trim()
    if (!name) return
    if (modal === 'routine') {
      const duration = Math.max(5, Number(formData.get('duration')) || 20)
      const time = String(formData.get('time') || '8:00 AM')
      const selectedDays = formData.getAll('days').map(String)
      const days = selectedDays.length ? selectedDays : dayLabels
      setWorkspace((current) => ({ ...current, routines: [...current.routines, { id: `routine-${Date.now()}`, name, time, duration, days, habitIds: [] }] }))
      setNotice('Your routine is ready to shape')
    } else {
      const categoryName = String(formData.get('category') || 'Lifestyle')
      setWorkspace((current) => ({ ...current, habits: [...current.habits, { id: `habit-${Date.now()}`, name, category: categoryName, duration: Math.max(1, Number(formData.get('duration')) || 10), time: 'Anytime', routine: 'Just for me' }] }))
      setNotice('Habit added to your collection')
    }
    setModal(null)
  }

  function saveProfile(name: string) {
    setWorkspace((current) => ({ ...current, profile: { name } }))
    setNotice('Profile updated')
  }

  function clearHistory() {
    if (!window.confirm('Clear every recorded moment? Your habits and routines stay as they are.')) return
    setWorkspace((current) => ({ ...current, records: {} }))
    setNotice('Activity history cleared')
  }

  function restoreSample() {
    if (!window.confirm('Restore the sample plan? This replaces your current habits, routines and history.')) return
    setWorkspace((current) => ({ ...freshWorkspace(), profile: current.profile }))
    setNotice('Sample plan restored')
  }

  function navigateTo(next: Section) {
    setSection(next)
    setMobileMenuOpen(false)
  }

  return (
    <div className="app-shell">
      <aside className={`sidebar ${mobileMenuOpen ? 'sidebar-open' : ''}`}>
        <a className="brand" href="#overview" onClick={(event) => { event.preventDefault(); navigateTo('Overview') }} aria-label="KINDA home"><span className="brand-mark"><Leaf size={17} strokeWidth={2.2} /></span><span>KINDA</span></a>
        <div className="brand-tagline">Small steps. A life that fits.</div>
        <div className="nav-caption">YOUR SPACE</div>
        <nav className="primary-nav" aria-label="Main navigation">{navigation.map(({ name, icon: Icon }) => <button key={name} className={`nav-item ${section === name ? 'active' : ''}`} onClick={() => navigateTo(name)} aria-current={section === name ? 'page' : undefined}><span className="nav-icon"><Icon size={17} strokeWidth={2} /></span><span>{name}</span>{name === 'Overview' && <span className="nav-dot" />}</button>)}</nav>
        <div className="sidebar-bottom">
          <div className="sidebar-note"><Sparkles size={16} /><span>Make room for<br />the life you have.</span></div>
          <button className={`nav-item secondary-nav ${section === 'Profile' ? 'active' : ''}`} onClick={() => navigateTo('Profile')} aria-current={section === 'Profile' ? 'page' : undefined}><span className="nav-icon"><UserRound size={16} strokeWidth={2} /></span><span>Profile</span></button>
          <button className={`nav-item secondary-nav ${section === 'Settings' ? 'active' : ''}`} onClick={() => navigateTo('Settings')} aria-current={section === 'Settings' ? 'page' : undefined}><span className="nav-icon"><SlidersHorizontal size={16} strokeWidth={2} /></span><span>Settings</span></button>
          <button className="profile-row" onClick={() => navigateTo('Profile')}><div className="avatar">{initial}</div><div className="profile-copy"><strong>{profileName}</strong><span>My personal space</span></div><ChevronRight size={16} /></button>
        </div>
      </aside>

      {mobileMenuOpen && <button className="scrim" aria-label="Close navigation" onClick={() => setMobileMenuOpen(false)} />}
      <main className="main-area">
        <header className="topbar"><button className="icon-button menu-button" aria-label="Open navigation" onClick={() => setMobileMenuOpen(true)}><Menu size={20} /></button><div className="breadcrumb"><span>My space</span><ChevronRight size={14} /><strong>{section}</strong></div><div className="topbar-right"><span className="date-pill"><span className="date-dot" />{new Intl.DateTimeFormat('en', { weekday: 'short', month: 'short', day: 'numeric' }).format(new Date())}</span><button className="avatar top-avatar" aria-label="Open profile" onClick={() => navigateTo('Profile')}>{initial}</button></div></header>
        <div className="content-wrap">
          {section === 'Overview' && <Overview name={firstName} habits={todayActivities} routines={workspace.routines} records={workspace.records} progress={progress} onNavigate={navigateTo} onRecord={recordActivity} onAdd={() => setModal('habit')} />}
          {section === 'Routines' && <Routines routines={workspace.routines} habits={workspace.habits} onAdd={() => setModal('routine')} onUpdate={updateRoutine} />}
          {section === 'Habits' && <Habits habits={workspace.habits} query={search} category={category} onSearch={setSearch} onCategory={setCategory} onAdd={() => setModal('habit')} />}
          {section === 'Calendar' && <CalendarView habits={workspace.habits} routines={workspace.routines} records={workspace.records} selectedDate={selectedDate} onDate={setSelectedDate} onRecord={recordActivity} />}
          {section === 'Insights' && <Insights records={workspace.records} onNavigate={navigateTo} />}
          {section === 'Profile' && <ProfileView name={profileName} workspace={workspace} onSave={saveProfile} />}
          {section === 'Settings' && <SettingsView recordCount={Object.keys(workspace.records).length} onClearHistory={clearHistory} onRestore={restoreSample} />}
          <footer className="page-footer"><span>Made for real life, not perfect streaks.</span><span className="footer-mark"><Leaf size={13} /> KINDA</span></footer>
        </div>
      </main>
      {notice && <div className="toast" role="status"><span className="toast-icon"><Check size={14} /></span>{notice}</div>}
      {modal && <ItemModal kind={modal} onClose={() => setModal(null)} onSave={saveItem} />}
    </div>
  )
}

function Overview({ name, habits, routines, records, progress, onNavigate, onRecord, onAdd }: {
  name: string; habits: Habit[]; routines: Routine[]; records: Record<string, ActivityRecord>; progress: number; onNavigate: (section: Section) => void; onRecord: (habitId: string, status: Status) => void; onAdd: () => void
}) {
  const now = new Date()
  const greeting = now.getHours() < 12 ? 'Good morning' : now.getHours() < 18 ? 'Good afternoon' : 'Good evening'
  const currentDay = dayLabels[(now.getDay() + 6) % 7]
  const todayRoutines = routines.filter((routine) => !routine.paused && routine.days.includes(currentDay))
  const upcoming = habits.filter((habit) => timeInMinutes(habit.time) >= now.getHours() * 60 + now.getMinutes() && !records[dateKey(now, habit.id)]).slice(0, 3)
  const finished = habits.filter((habit) => records[dateKey(now, habit.id)]?.status === 'complete').length

  return <>
    <section className="welcome-hero" data-tone="orange">
      <div className="welcome-copy">
        <div className="eyebrow">{new Intl.DateTimeFormat('en', { weekday: 'long', month: 'long', day: 'numeric' }).format(now)}</div>
        <p className="banner-greeting">{greeting}, {name}</p>
        <h1 className="banner-title">Make room<br />for what matters.</h1>
        <p className="welcome-subtitle">A little progress is still progress. Take today one small step at a time.</p>
        <div className="welcome-actions"><button className="button button-primary quick-action" onClick={onAdd}><Plus size={17} /> Add a habit</button><span className="welcome-chip"><Check size={15} />{finished} of {habits.length} small steps today</span></div>
      </div>
    </section>
    <section className="dashboard-grid"><div className="left-column">
      <section className="panel progress-panel"><div className="panel-heading"><div><div className="eyebrow small-eyebrow">YOUR DAY, YOUR WAY</div><h2>Today, gently</h2></div><button className="text-button" onClick={() => onNavigate('Calendar')}>See calendar <ArrowRight size={15} /></button></div><div className="progress-layout"><div className="progress-ring" style={{ '--progress': `${progress}%` } as React.CSSProperties}><div className="ring-center"><strong>{progress}<span>%</span></strong><span>in your flow</span></div></div><div className="progress-copy"><strong>{finished} of {habits.length} small steps</strong><span>There is no behind. Just your own pace.</span><div className="progress-tags"><span className="progress-tag tag-done"><span className="status-dot orange-dot" /> {finished} done</span><span className="progress-tag"><span className="status-dot sand-dot" /> {Math.max(habits.length - finished, 0)} still open</span></div></div></div><div className="progress-footer"><span>Every bit counts.</span><span className="date-stamp"><Sun size={14} /> A fresh start, any time</span></div></section>
      <section className="panel routines-panel"><div className="panel-heading"><div><div className="eyebrow small-eyebrow">A FEW THINGS, TOGETHER</div><h2>Today's routines</h2></div><button className="text-button" onClick={() => onNavigate('Routines')}>All routines <ArrowRight size={15} /></button></div><div className="routine-list">{todayRoutines.slice(0, 2).map((routine, index) => {
        const routineHabits = habits.filter((habit) => routine.habitIds.includes(habit.id))
        const done = routineHabits.filter((habit) => records[dateKey(now, habit.id)]?.status === 'complete').length
        const complete = routineHabits.length > 0 && done === routineHabits.length
        return <div className={`routine-row ${complete ? 'routine-complete' : ''}`} data-tone={routineTones[index % routineTones.length]} key={routine.id}><div className="routine-icon"><RoutineIcon routine={routine} /></div><div className="routine-info"><div className="routine-title-row"><strong>{routine.name}</strong><span className="routine-time"><Clock3 size={13} />{routine.time}</span></div><span className="routine-detail">{routineHabits.length} moments <span className="middle-dot">·</span> about {routine.duration} min</span><div className="mini-progress"><span style={{ width: `${routineHabits.length ? done / routineHabits.length * 100 : 0}%` }} /></div></div><span className="routine-count">{complete ? <><Check size={12} /> Done</> : `${done}/${routineHabits.length}`}</span><button className="small-icon-button" aria-label={`Open ${routine.name}`} onClick={() => onNavigate('Routines')}><ChevronRight size={17} /></button></div>
      })}{todayRoutines.length === 0 && <div className="empty-inline">No routines planned for today. A little breathing room counts, too.</div>}</div></section>
      <section className="panel week-panel"><div className="panel-heading"><div><div className="eyebrow small-eyebrow">A SOFTER VIEW</div><h2>Your week</h2></div><button className="text-button" onClick={() => onNavigate('Insights')}>Weekly insights <ArrowRight size={15} /></button></div><div className="week-chart" aria-label="Weekly routine overview">{[['M', 58, 2], ['T', 76, 3], ['W', 48, 2], ['T', 88, 4], ['F', 65, 3], ['S', 40, 2], ['S', 32, 1]].map(([day, height, count], index) => <button key={`${day}-${index}`} className={`week-column ${index === (now.getDay() + 6) % 7 ? 'today-column' : ''}`} onClick={() => onNavigate('Calendar')} aria-label={`${day}, ${count} planned moments`}><span className="week-bar-wrap"><span className="week-bar" style={{ height: `${height}%` }} /></span><span className="week-count">{count}</span><span className="week-day">{day}</span></button>)}</div></section>
    </div><div className="right-column">
      <section className="panel today-panel"><div className="panel-heading"><div><div className="eyebrow small-eyebrow">WHEN IT WORKS FOR YOU</div><h2>Up next</h2></div><span className="live-dot" /></div><div className="upcoming-list">{upcoming.map((habit) => <div className="upcoming-row" data-tone={toneFor(habit.category)} key={habit.id}><div className="upcoming-time">{habit.time}</div><div className="timeline"><span className="timeline-dot"><HabitIcon habit={habit} size={15} /></span></div><div className="upcoming-copy"><strong>{habit.name}</strong><span>{habit.duration} min <span className="category-chip">{habit.category}</span></span></div><button className="small-icon-button" aria-label={`Mark ${habit.name} complete`} onClick={() => onRecord(habit.id, 'complete')}><Circle size={18} /></button></div>)}{upcoming.length === 0 && <div className="empty-inline">Nothing left on the clock. Enjoy the space.</div>}</div><button className="panel-link" onClick={() => onNavigate('Calendar')}>See the whole day <ArrowRight size={15} /></button></section>
      <section className="panel suggestion-panel"><div className="suggestion-top"><span className="suggestion-icon"><Sparkles size={16} /></span><span className="eyebrow small-eyebrow">A KINDA THOUGHT</span><button className="small-icon-button" aria-label="More suggestions"><MoreHorizontal size={18} /></button></div><p>Some days are for doing less. Your routines can flex with you.</p><button className="suggestion-action" onClick={() => onNavigate('Routines')}>Shape your routine <ArrowRight size={14} /></button></section>
      <section className="panel habit-list-panel"><div className="panel-heading"><div><div className="eyebrow small-eyebrow">SMALL MOMENTS</div><h2>Today’s habits</h2></div><span className="habit-total">{habits.length}</span></div><div className="habit-quick-list">{habits.slice(0, 4).map((habit) => {
        const record = records[dateKey(now, habit.id)]
        return <div className="habit-quick-row" data-tone={toneFor(habit.category)} key={habit.id}><button className={`check-control ${record?.status === 'complete' ? 'checked' : record?.status === 'partial' ? 'partially-checked' : ''}`} onClick={() => onRecord(habit.id, record?.status === 'complete' ? 'partial' : 'complete')} aria-label={record?.status === 'complete' ? `Undo ${habit.name}` : `Complete ${habit.name}`}>{record?.status === 'complete' ? <Check size={13} /> : record?.status === 'partial' ? <span className="partial-mark" /> : null}</button><span className="habit-row-icon" title={habit.category}><HabitIcon habit={habit} size={14} /></span><span className={record?.status === 'complete' ? 'habit-done' : ''}>{habit.name}</span><span className="habit-duration">{habit.duration}m</span></div>
      })}</div><button className="panel-link" onClick={() => onNavigate('Habits')}>View all habits <ArrowRight size={15} /></button></section>
    </div></section>
  </>
}

function Routines({ routines, habits, onAdd, onUpdate }: { routines: Routine[]; habits: Habit[]; onAdd: () => void; onUpdate: (id: string, action: 'pause' | 'duplicate') => void }) {
  return <><PageIntro tone="sage" eyebrow="ROUTINES" title={<>Find your own<br />rhythm.</>} subtitle="A rhythm, not a rulebook. Build around the days you actually have." action={<button className="button button-primary" onClick={onAdd}><Plus size={17} /> New routine</button>} /><div className="routine-page-grid">{routines.map((routine, index) => {
    const routineHabits = habits.filter((habit) => routine.habitIds.includes(habit.id))
    return <article className={`routine-card ${routine.paused ? 'routine-paused' : ''}`} data-tone={routineTones[index % routineTones.length]} key={routine.id}><div className="routine-card-top"><div className="routine-icon"><RoutineIcon routine={routine} /></div><button className="small-icon-button" aria-label={`More options for ${routine.name}`} onClick={() => onUpdate(routine.id, 'pause')}><MoreHorizontal size={19} /></button></div><div className="routine-card-title"><h2>{routine.name}</h2>{routine.paused && <span className="paused-label">Paused</span>}</div><div className="routine-card-meta"><span><Clock3 size={14} />{routine.time}</span><span><Activity size={14} />{routine.duration} min</span></div><div className="day-chips">{dayInitials.map((day, i) => <span className={routine.days.includes(dayLabels[i]) ? 'day-chip selected' : 'day-chip'} key={`${day}-${i}`}>{day}</span>)}</div><div className="routine-card-divider" /><div className="routine-habits-label">IN THIS ROUTINE <span>{routineHabits.length}</span></div><div className="routine-habit-stack">{routineHabits.slice(0, 3).map((habit) => <div key={habit.id}><span className="tiny-check" data-tone={toneFor(habit.category)}><HabitIcon habit={habit} size={13} /></span>{habit.name}<span className="habit-duration">{habit.duration}m</span></div>)}{routineHabits.length === 0 && <div className="empty-inline compact-empty">Ready when you are. Add a habit from your collection.</div>}</div><div className="routine-card-actions"><button className="button button-quiet" onClick={() => onUpdate(routine.id, 'pause')}>{routine.paused ? 'Resume' : 'Pause'}</button><button className="button button-quiet" onClick={() => onUpdate(routine.id, 'duplicate')}><Copy size={14} /> Duplicate</button><button className="button button-quiet edit-button" onClick={() => onUpdate(routine.id, 'pause')}>Edit <ArrowRight size={14} /></button></div></article>
  })}<button className="new-routine-card" onClick={onAdd}><span className="new-routine-plus"><Plus size={20} /></span><strong>Start a new rhythm</strong><span>Make a routine that feels like yours.</span></button></div><div className="note-banner"><span className="note-banner-icon"><Sparkles size={17} /></span><span><strong>It can be smaller.</strong> Every routine can have a minimum version for the days that ask for less.</span><button onClick={onAdd}>Create one <ArrowRight size={14} /></button></div></>
}

function Habits({ habits, query, category, onSearch, onCategory, onAdd }: { habits: Habit[]; query: string; category: string; onSearch: (value: string) => void; onCategory: (value: string) => void; onAdd: () => void }) {
  const filtered = habits.filter((habit) => (category === 'All habits' || habit.category === category) && habit.name.toLowerCase().includes(query.toLowerCase()))
  return <><PageIntro tone="butter" eyebrow="HABITS" title={<>Little things.<br />Big changes.</>} subtitle="The small moments that make a life feel more like yours." action={<button className="button button-primary" onClick={onAdd}><Plus size={17} /> New habit</button>} /><div className="habit-toolbar"><div className="filter-tabs" role="tablist" aria-label="Filter by category">{categories.map((item) => <button key={item} role="tab" aria-selected={category === item} data-tone={item === 'All habits' ? 'orange' : toneFor(item)} className={category === item ? 'filter-tab selected' : 'filter-tab'} onClick={() => onCategory(item)}>{item !== 'All habits' && <span className="tone-dot" />}{item}</button>)}</div><label className="search-box"><Search size={16} /><input value={query} onChange={(event) => onSearch(event.target.value)} placeholder="Find a habit" aria-label="Search habits" />{query && <button aria-label="Clear search" onClick={() => onSearch('')}><X size={14} /></button>}</label></div><div className="habit-results-heading"><span>{filtered.length} {filtered.length === 1 ? 'habit' : 'habits'}</span><button className="sort-button">Recently added <ChevronDown size={14} /></button></div>{filtered.length ? <div className="habit-grid">{filtered.map((habit) => <article className="habit-card" data-tone={toneFor(habit.category)} key={habit.id}><div className="habit-card-icon"><HabitIcon habit={habit} size={21} /></div><button className="small-icon-button habit-more" aria-label={`More options for ${habit.name}`}><MoreHorizontal size={18} /></button><div className="habit-card-category">{habit.category}</div><h2>{habit.name}</h2><div className="habit-card-meta"><span><Clock3 size={14} />{habit.duration} min</span><span>{habit.routine}</span></div><div className="habit-card-bottom"><span className="frequency-label"><span className="frequency-dot" /> A few times a week</span><button className="round-action" aria-label={`Open ${habit.name}`}><ArrowUpRight size={16} /></button></div></article>)}</div> : <div className="empty-state"><span className="empty-state-icon"><Search size={22} /></span><h2>No habits found</h2><p>Try another search or choose a different category.</p><button className="button button-quiet" onClick={() => { onSearch(''); onCategory('All habits') }}>Clear filters</button></div>}</>
}

function CalendarView({ habits, routines, records, selectedDate, onDate, onRecord }: { habits: Habit[]; routines: Routine[]; records: Record<string, ActivityRecord>; selectedDate: Date; onDate: (date: Date) => void; onRecord: (habitId: string, status: Status) => void }) {
  const weekStart = new Date(selectedDate)
  weekStart.setDate(selectedDate.getDate() - ((selectedDate.getDay() + 6) % 7))
  const days = Array.from({ length: 7 }, (_, index) => { const date = new Date(weekStart); date.setDate(weekStart.getDate() + index); return date })
  const dayCode = dayLabels[(selectedDate.getDay() + 6) % 7]
  const dayRoutines = routines.filter((routine) => !routine.paused && routine.days.includes(dayCode))
  const dayHabits = habits.filter((habit) => dayRoutines.some((routine) => routine.habitIds.includes(habit.id)) || habit.routine === 'Just for me')
  const heading = new Intl.DateTimeFormat('en', { month: 'long', year: 'numeric' }).format(selectedDate)
  function changeWeek(direction: number) { const date = new Date(selectedDate); date.setDate(date.getDate() + direction * 7); onDate(date) }
  return <><PageIntro tone="orange" eyebrow="CALENDAR" title={<>Plan with room<br />to breathe.</>} subtitle="Plans are a starting point. Move things around as life happens." /><section className="calendar-panel panel"><div className="calendar-toolbar"><div className="calendar-month"><h2>{heading}</h2><span className="sample-pill">SAMPLE PLAN</span></div><div className="calendar-controls"><button className="icon-button" onClick={() => changeWeek(-1)} aria-label="Previous week"><ChevronLeft size={18} /></button><button className="button button-quiet today-button" onClick={() => onDate(new Date())}>Today</button><button className="icon-button" onClick={() => changeWeek(1)} aria-label="Next week"><ChevronRight size={18} /></button><div className="view-toggle"><button className="selected">Week</button><button disabled title="Month view is coming later">Month</button></div></div></div><div className="calendar-days">{days.map((date, index) => <button className={`calendar-day ${date.toDateString() === selectedDate.toDateString() ? 'selected' : ''} ${date.toDateString() === new Date().toDateString() ? 'is-today' : ''}`} onClick={() => onDate(date)} key={date.toDateString()}><span>{dayLabels[index]}</span><strong>{date.getDate()}</strong><i className={index === 2 || index === 4 ? 'has-activity' : ''} /></button>)}</div><div className="calendar-body"><div className="calendar-time-axis">{['8 AM', '10 AM', '12 PM', '2 PM', '4 PM', '6 PM', '8 PM', '10 PM'].map((time) => <span key={time}>{time}</span>)}</div><div className="calendar-schedule">{dayHabits.length ? dayHabits.sort((a, b) => timeInMinutes(a.time) - timeInMinutes(b.time)).map((habit) => {
    const record = records[dateKey(selectedDate, habit.id)]
    return <div className="calendar-event" data-tone={toneFor(habit.category)} style={{ gridRow: calendarRow(habit.time) }} key={habit.id}><div className="event-time">{habit.time}</div><strong>{habit.name}</strong><span>{habit.duration} min <span className="middle-dot">·</span> {habit.category}</span><div className="event-actions"><span className={`event-state ${record?.status || 'pending'}`}>{record?.status || 'planned'}</span><button className="small-icon-button" aria-label={`Complete ${habit.name}`} onClick={() => onRecord(habit.id, 'complete')}><Check size={15} /></button></div></div>
  }) : <div className="calendar-empty"><span className="empty-state-icon"><Sun size={20} /></span><strong>A little open space.</strong><span>No planned activities. Your day belongs to you.</span></div>}</div></div><div className="calendar-legend"><span><i className="legend-dot planned" />Planned</span><span><i className="legend-dot complete" />Complete</span><span><i className="legend-dot partial" />Partial</span><span><i className="legend-dot skipped" />Skipped</span></div></section><div className="calendar-footnote"><Sparkles size={16} /><span>Nothing is locked in. Dragging activities to new times will be available as your plan grows.</span></div></>
}

function Insights({ records, onNavigate }: { records: Record<string, ActivityRecord>; onNavigate: (section: Section) => void }) {
  const completed = Object.values(records).filter((record) => record.status === 'complete').length
  const partial = Object.values(records).filter((record) => record.status === 'partial').length
  return <><PageIntro tone="sage" eyebrow="INSIGHTS" title={<>Look how far<br />you've come.</>} subtitle="A little reflection can help you make a plan that fits better." action={<button className="period-button">This week <ChevronDown size={15} /></button>} /><div className="insight-notice"><span className="sample-pill">SAMPLE PREVIEW</span><span>Preview metrics show sample patterns. Your real insights will take shape as you log activity.</span></div><div className="insight-metrics"><article className="metric-card"><span className="metric-label">THIS WEEK</span><div className="metric-value">68<span>%</span><span className="metric-trend"><ArrowUpRight size={15} /> 8%</span></div><span className="metric-caption">of planned moments, at your pace</span><div className="metric-sparkline"><span style={{ height: '28%' }} /><span style={{ height: '42%' }} /><span style={{ height: '38%' }} /><span style={{ height: '57%' }} /><span style={{ height: '49%' }} /><span style={{ height: '75%' }} /><span style={{ height: '64%' }} /></div></article><article className="metric-card metric-sage"><span className="metric-label">RECORDED SO FAR</span><div className="metric-value">{completed}<span> moments</span></div><span className="metric-caption">{partial} partial progress count, too</span><div className="metric-inline-progress"><span style={{ width: `${Math.min(completed * 20, 100)}%` }} /></div></article><article className="metric-card metric-highlight"><span className="metric-label">A DAY THAT FITS</span><div className="metric-value">Tuesday</div><span className="metric-caption">has been a gentle, steady rhythm</span><div className="metric-highlight-icon"><Sun size={23} /></div></article></div><div className="insights-lower"><section className="panel consistency-panel"><div className="panel-heading"><div><div className="eyebrow small-eyebrow">A LOOK BACK</div><h2>Weekly consistency</h2></div><span className="sample-pill">SAMPLE</span></div><div className="consistency-chart">{[['Mon', 42], ['Tue', 78], ['Wed', 55], ['Thu', 68], ['Fri', 88], ['Sat', 37], ['Sun', 52]].map(([day, value]) => <div className="consistency-day" key={day}><span className="consistency-value">{value}%</span><span className="consistency-track"><i className={day === 'Fri' ? 'highlight-bar' : ''} style={{ height: `${value}%` }} /></span><span className="consistency-label">{day}</span></div>)}</div></section><section className="panel reflection-panel"><div className="panel-heading"><div><div className="eyebrow small-eyebrow">A THOUGHT FOR YOU</div><h2>Keep what fits</h2></div><span className="reflection-icon"><Sparkles size={17} /></span></div><p>It looks like your mornings have a little more room than your evenings. Would a shorter evening routine feel kinder?</p><button className="text-button" onClick={() => onNavigate('Routines')}>Explore your routines <ArrowRight size={15} /></button></section></div><div className="insight-bottom-note"><Heart size={16} /><span>No streaks to protect here. Missing a day is information, not a setback.</span></div></>
}

function ProfileView({ name, workspace, onSave }: { name: string; workspace: Workspace; onSave: (name: string) => void }) {
  const values = Object.values(workspace.records)
  const complete = values.filter((record) => record.status === 'complete').length
  const partial = values.filter((record) => record.status === 'partial').length
  const categoryCounts = categories.slice(1).map((item) => ({ item, count: workspace.habits.filter((habit) => habit.category === item).length })).filter(({ count }) => count > 0)
  function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const next = String(new FormData(event.currentTarget).get('name') || '').trim()
    if (next) onSave(next)
  }
  return <><PageIntro tone="butter" eyebrow="PROFILE" title={<>This space<br />is yours.</>} subtitle="A few details so KINDA feels like home." />
    <div className="profile-grid">
      <section className="panel profile-card"><div className="profile-avatar-large">{name.charAt(0).toUpperCase()}</div><div className="eyebrow small-eyebrow">HOW SHOULD WE GREET YOU?</div><form className="profile-form" onSubmit={submit}><label className="form-label">Your name<input name="name" defaultValue={name} maxLength={40} required /></label><button type="submit" className="button button-primary"><Check size={15} /> Save</button></form></section>
      <section className="panel profile-stats"><div className="panel-heading"><div><div className="eyebrow small-eyebrow">WHAT YOU'VE BUILT</div><h2>Your space at a glance</h2></div></div><div className="stat-grid"><div className="stat-tile" data-tone="sage"><strong>{workspace.habits.length}</strong><span>habits</span></div><div className="stat-tile" data-tone="butter"><strong>{workspace.routines.length}</strong><span>routines</span></div><div className="stat-tile" data-tone="orange"><strong>{complete}</strong><span>moments done</span></div><div className="stat-tile" data-tone="beige"><strong>{partial}</strong><span>a little progress</span></div></div><div className="routine-habits-label">YOUR CATEGORIES</div><div className="category-cloud">{categoryCounts.map(({ item, count }) => <span className="category-chip" data-tone={toneFor(item)} key={item}>{item} · {count}</span>)}</div></section>
    </div>
  </>
}

function SettingsView({ recordCount, onClearHistory, onRestore }: { recordCount: number; onClearHistory: () => void; onRestore: () => void }) {
  const legend: { tone: Tone; label: string; detail: string }[] = [
    { tone: 'orange', label: 'Orange', detail: 'Actions, highlights and progress' },
    { tone: 'sage', label: 'Sage', detail: 'Routines, habits and positive progress' },
    { tone: 'butter', label: 'Butter', detail: 'Reminders and small wins' },
    { tone: 'beige', label: 'Beige', detail: 'Calm, neutral moments' },
  ]
  return <><PageIntro tone="sage" eyebrow="SETTINGS" title={<>Shape KINDA<br />your way.</>} subtitle="Your plan lives on this device. Change what you need, keep what helps." />
    <div className="settings-grid">
      <section className="panel settings-panel"><div className="panel-heading"><div><div className="eyebrow small-eyebrow">YOUR DATA</div><h2>Saved on this device</h2></div></div>
        <div className="setting-row"><div><strong>Activity history</strong><span>{recordCount} recorded {recordCount === 1 ? 'moment' : 'moments'}. Habits and routines are kept.</span></div><button className="button button-quiet" onClick={onClearHistory}><Trash2 size={14} /> Clear history</button></div>
        <div className="setting-row"><div><strong>Sample plan</strong><span>Start over with the original habits and routines.</span></div><button className="button button-quiet" onClick={onRestore}><RotateCcw size={14} /> Restore</button></div>
      </section>
      <section className="panel settings-panel"><div className="panel-heading"><div><div className="eyebrow small-eyebrow">READING THE COLOURS</div><h2>What each colour means</h2></div></div><div className="legend-list">{legend.map(({ tone, label, detail }) => <div className="legend-row" data-tone={tone} key={tone}><span className="legend-swatch" /><strong>{label}</strong><span>{detail}</span></div>)}</div></section>
    </div>
  </>
}

function PageIntro({ eyebrow, title, subtitle, action, tone }: { eyebrow: string; title: React.ReactNode; subtitle: string; action?: React.ReactNode; tone: Tone }) {
  return <section className="page-intro" data-tone={tone}><div className="page-intro-copy"><div className="eyebrow">{eyebrow}</div><h1 className="banner-title">{title}</h1><p>{subtitle}</p>{action && <div className="page-intro-action">{action}</div>}</div></section>
}

function ItemModal({ kind, onClose, onSave }: { kind: 'habit' | 'routine'; onClose: () => void; onSave: (event: React.FormEvent<HTMLFormElement>) => void }) {
  return <div className="modal-backdrop" onMouseDown={(event) => { if (event.target === event.currentTarget) onClose() }}><section className="modal" role="dialog" aria-modal="true" aria-labelledby="modal-title" data-tone={kind === 'routine' ? 'sage' : 'orange'}><div className="modal-top"><span className="modal-icon">{kind === 'routine' ? <Repeat size={19} /> : <ListChecks size={19} />}</span><button className="icon-button" onClick={onClose} aria-label="Close dialog"><X size={19} /></button></div><div className="eyebrow small-eyebrow">MAKE IT YOURS</div><h2 id="modal-title">{kind === 'routine' ? 'A new rhythm' : 'A small thing, for you'}</h2><p>{kind === 'routine' ? 'Start with what feels doable. You can shape it as you go.' : 'No perfect plan needed. Just a place to begin.'}</p><form onSubmit={onSave}><label className="form-label">{kind === 'routine' ? 'Routine name' : 'Habit name'}<input autoFocus name="name" required maxLength={54} placeholder={kind === 'routine' ? 'A slower start' : 'Step outside for a minute'} /></label><div className="form-row"><label className="form-label">{kind === 'routine' ? 'Approximate time' : 'Category'}{kind === 'routine' ? <select name="time" defaultValue="8:00 AM"><option>7:00 AM</option><option>8:00 AM</option><option>9:00 AM</option><option>6:00 PM</option><option>9:00 PM</option></select> : <select name="category" defaultValue="Lifestyle">{categories.slice(1).map((item) => <option key={item}>{item}</option>)}</select>}</label><label className="form-label">{kind === 'routine' ? 'Estimated minutes' : 'Minutes'}<input name="duration" type="number" min="1" max="240" defaultValue={kind === 'routine' ? '20' : '10'} /></label></div><div className="modal-actions"><button type="button" className="button button-quiet" onClick={onClose}>Cancel</button><button type="submit" className="button button-primary"><Plus size={16} /> Create {kind}</button></div></form></section></div>
}

function timeInMinutes(time: string) {
  const [clock, period] = time.split(' ')
  const [hours, minutes] = clock.split(':').map(Number)
  return (hours % 12 + (period === 'PM' ? 12 : 0)) * 60 + minutes
}

function calendarRow(time: string) {
  const hour = Math.floor(timeInMinutes(time) / 60)
  return Math.max(1, Math.min(7, hour - 7))
}

export default App
