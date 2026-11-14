import { useCallback, useEffect, useState } from 'react'
import {
  Activity,
  Apple,
  ArrowRight,
  ArrowUpRight,
  Bike,
  Bed,
  Bell,
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
  Feather,
  Flower2,
  Footprints,
  GraduationCap,
  Heart,
  HeartPulse,
  House,
  Languages,
  Laptop,
  Leaf,
  Lightbulb,
  Link2,
  ListChecks,
  Menu,
  Minus,
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
  Target,
  Trash2,
  TrendingUp,
  Utensils,
  Wallet,
  X,
  type LucideIcon,
} from 'lucide-react'

type Section = 'Overview' | 'Routines' | 'Habits' | 'Calendar' | 'Insights' | 'Profile' | 'Settings'
type Status = 'complete' | 'partial' | 'skipped' | 'rescheduled'
type Habit = {
  id: string; name: string; category: string; duration: number; time: string; routine: string
  icon?: string; frequency?: string; tinyVersion?: string; notes?: string
}
type Reminder = { enabled: boolean; offset: number; nudge: boolean }
type Routine = {
  id: string; name: string; time: string; duration: number; days: string[]; habitIds: string[]; paused?: boolean
  anchor?: string; frequency?: 'days' | 'flexible'; timesPerWeek?: number; windowEnd?: string
  reminder?: Reminder; minimumHabitIds?: string[]; notes?: string; icon?: string
}
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

/* Icons people can pick for routines and habits. "Auto" (no key) keeps the
   icon chosen from the name, category or time of day. */
const iconLibrary: Record<string, LucideIcon> = {
  sunrise: Sunrise, sun: Sun, moon: Moon, bed: Bed, coffee: Coffee, water: Droplets,
  apple: Apple, meal: Utensils, walk: Footprints, strength: Dumbbell, bike: Bike, stretch: PersonStanding,
  calm: Flower2, mind: Brain, book: BookOpen, journal: NotebookPen, learn: GraduationCap, work: Laptop,
  music: Music, create: Palette, heart: Heart, grow: Sprout, tidy: Sparkles, money: Wallet,
}

function autoHabitIcon(name: string, category: string): LucideIcon {
  return habitIconRules.find(([pattern]) => pattern.test(name))?.[1] ?? categoryIcons[category] ?? Leaf
}

function habitIcon(habit: Habit): LucideIcon {
  return (habit.icon && iconLibrary[habit.icon]) || autoHabitIcon(habit.name, habit.category)
}

function HabitIcon({ habit, size = 18 }: { habit: Habit; size?: number }) {
  const Icon = habitIcon(habit)
  return <Icon size={size} strokeWidth={2} />
}

function toneFor(category: string): Tone {
  return categoryTones[category] ?? 'beige'
}

function autoRoutineIcon(time: string): LucideIcon {
  const minutes = timeInMinutes(time)
  if (minutes < 12 * 60) return Sunrise
  if (minutes >= 19 * 60) return Moon
  return Coffee
}

function RoutineIcon({ routine, size = 20 }: { routine: Routine; size?: number }) {
  const Icon = (routine.icon && iconLibrary[routine.icon]) || autoRoutineIcon(routine.time)
  return <Icon size={size} strokeWidth={2} />
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
  const [habitEditor, setHabitEditor] = useState<{ habit?: Habit } | null>(null)
  const [routineEditor, setRoutineEditor] = useState<{ routine?: Routine } | null>(null)
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

  function saveHabit(habit: Habit, routineId: string) {
    setWorkspace((current) => {
      const routine = current.routines.find((item) => item.id === routineId)
      const next = { ...habit, routine: routine ? routine.name : 'Just for me' }
      const exists = current.habits.some((item) => item.id === habit.id)
      return {
        ...current,
        habits: exists ? current.habits.map((item) => item.id === habit.id ? next : item) : [...current.habits, next],
        routines: current.routines.map((item) => {
          const has = item.habitIds.includes(habit.id)
          if (item.id === routineId && !has) return { ...item, habitIds: [...item.habitIds, habit.id] }
          if (item.id !== routineId && has) return { ...item, habitIds: item.habitIds.filter((id) => id !== habit.id), minimumHabitIds: item.minimumHabitIds?.filter((id) => id !== habit.id) }
          return item
        }),
      }
    })
    setNotice(habitEditor?.habit ? 'Habit updated' : 'Habit added to your collection')
    setHabitEditor(null)
  }

  function deleteHabit(habitId: string) {
    setWorkspace((current) => ({
      ...current,
      habits: current.habits.filter((habit) => habit.id !== habitId),
      routines: current.routines.map((routine) => ({ ...routine, habitIds: routine.habitIds.filter((id) => id !== habitId), minimumHabitIds: routine.minimumHabitIds?.filter((id) => id !== habitId) })),
      records: Object.fromEntries(Object.entries(current.records).filter(([key]) => !key.endsWith(`:${habitId}`))),
    }))
    setHabitEditor(null)
    setNotice('Habit deleted')
  }

  function deleteRoutine(routineId: string) {
    setWorkspace((current) => {
      const routine = current.routines.find((item) => item.id === routineId)
      return {
        ...current,
        routines: current.routines.filter((item) => item.id !== routineId),
        habits: current.habits.map((habit) => routine && habit.routine === routine.name ? { ...habit, routine: 'Just for me' } : habit),
      }
    })
    setRoutineEditor(null)
    setNotice('Routine deleted. Its habits are still in your collection')
  }

  function actOnInsight(insight: Insight) {
    const routine = workspace.routines.find((item) => item.id === insight.action?.routineId)
    if (routine) setRoutineEditor({ routine })
    else if (insight.action?.section) navigateTo(insight.action.section)
  }

  function seeAllPatterns() {
    navigateTo('Insights')
    window.setTimeout(() => document.getElementById('patterns')?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 60)
  }

  function saveRoutine(routine: Routine, newHabits: Habit[], previousName?: string) {
    setWorkspace((current) => {
      const exists = current.routines.some((item) => item.id === routine.id)
      const habits = current.habits.map((habit) => {
        if (routine.habitIds.includes(habit.id)) return { ...habit, routine: routine.name }
        if (habit.routine === (previousName ?? routine.name)) return { ...habit, routine: 'Just for me' }
        return habit
      })
      return {
        ...current,
        habits: [...habits, ...newHabits.map((habit) => ({ ...habit, routine: routine.name }))],
        routines: exists ? current.routines.map((item) => item.id === routine.id ? routine : item) : [...current.routines, routine],
      }
    })
    setRoutineEditor(null)
    setNotice(previousName ? 'Routine updated' : 'Your new rhythm is ready')
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

  const closeRoutineEditor = useCallback(() => setRoutineEditor(null), [])
  const closeHabitEditor = useCallback(() => setHabitEditor(null), [])

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
        <nav className="primary-nav" aria-label="Main navigation">{navigation.map(({ name, icon: Icon }) => <button key={name} className={`nav-item ${section === name ? 'active' : ''}`} onClick={() => navigateTo(name)} aria-current={section === name ? 'page' : undefined}><span className="nav-icon"><Icon size={18} strokeWidth={1.75} /></span><span>{name}</span></button>)}</nav>
        <div className="sidebar-bottom">
          <button className={`nav-item secondary-nav ${section === 'Settings' ? 'active' : ''}`} onClick={() => navigateTo('Settings')} aria-current={section === 'Settings' ? 'page' : undefined}><span className="nav-icon"><SlidersHorizontal size={18} strokeWidth={1.75} /></span><span>Settings</span></button>
          <button className="profile-row" onClick={() => navigateTo('Profile')}><div className="avatar">{initial}</div><div className="profile-copy"><strong>{profileName}</strong><span>My personal space</span></div><ChevronRight size={16} /></button>
        </div>
      </aside>

      {mobileMenuOpen && <button className="scrim" aria-label="Close navigation" onClick={() => setMobileMenuOpen(false)} />}
      <main className="main-area">
        <header className="topbar"><button className="icon-button menu-button" aria-label="Open navigation" onClick={() => setMobileMenuOpen(true)}><Menu size={20} /></button><div className="breadcrumb"><span>My space</span><ChevronRight size={14} /><strong>{section}</strong></div><div className="topbar-right"><span className="date-pill"><span className="date-dot" />{new Intl.DateTimeFormat('en', { weekday: 'short', month: 'short', day: 'numeric' }).format(new Date())}</span><button className="avatar top-avatar" aria-label="Open profile" onClick={() => navigateTo('Profile')}>{initial}</button></div></header>
        <div className="content-wrap">
          {section === 'Overview' && <Overview name={firstName} habits={todayActivities} routines={workspace.routines} records={workspace.records} progress={progress} insights={buildInsights(workspace)} onNavigate={navigateTo} onRecord={recordActivity} onAdd={() => setHabitEditor({})} onAct={actOnInsight} onSeeAllPatterns={seeAllPatterns} />}
          {section === 'Routines' && <Routines routines={workspace.routines} habits={workspace.habits} onAdd={() => setRoutineEditor({})} onEdit={(routine) => setRoutineEditor({ routine })} onUpdate={updateRoutine} />}
          {section === 'Habits' && <Habits habits={workspace.habits} query={search} category={category} onSearch={setSearch} onCategory={setCategory} onAdd={() => setHabitEditor({})} onEdit={(habit) => setHabitEditor({ habit })} />}
          {section === 'Calendar' && <CalendarView habits={workspace.habits} routines={workspace.routines} records={workspace.records} selectedDate={selectedDate} onDate={setSelectedDate} onRecord={recordActivity} />}
          {section === 'Insights' && <Insights workspace={workspace} onAct={actOnInsight} />}
          {section === 'Profile' && <ProfileView name={profileName} workspace={workspace} onSave={saveProfile} />}
          {section === 'Settings' && <SettingsView recordCount={Object.keys(workspace.records).length} onClearHistory={clearHistory} onRestore={restoreSample} />}
          <footer className="page-footer"><span>Made for real life, not perfect streaks.</span><span className="footer-mark"><Leaf size={13} /> KINDA</span></footer>
        </div>
      </main>
      {notice && <div className="toast" role="status"><span className="toast-icon"><Check size={14} /></span>{notice}</div>}
      {habitEditor && <HabitEditor habit={habitEditor.habit} routines={workspace.routines} onClose={closeHabitEditor} onSave={saveHabit} onDelete={deleteHabit} />}
      {routineEditor && <RoutineEditor routine={routineEditor.routine} habits={workspace.habits} onClose={closeRoutineEditor} onSave={saveRoutine} onDelete={deleteRoutine} />}
    </div>
  )
}

function Overview({ name, habits, routines, records, progress, insights, onNavigate, onRecord, onAdd, onAct, onSeeAllPatterns }: {
  name: string; habits: Habit[]; routines: Routine[]; records: Record<string, ActivityRecord>; progress: number; insights: Insight[]
  onNavigate: (section: Section) => void; onRecord: (habitId: string, status: Status) => void; onAdd: () => void; onAct: (insight: Insight) => void; onSeeAllPatterns: () => void
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
        <h1 className="banner-title">Make room<br />for <em>what matters.</em></h1>
        <p className="welcome-subtitle">A little progress is still progress. Take today one small step at a time.</p>
        <div className="welcome-actions"><button className="button button-primary quick-action" onClick={onAdd}><Plus size={17} /> Add a habit</button><span className="welcome-chip"><Check size={14} strokeWidth={2.5} />{finished} of {habits.length} small steps today</span></div>
      </div>
    </section>
    <section className="dashboard-grid"><div className="left-column">
      <section className="panel progress-panel"><div className="panel-heading"><div><h2>Today, gently</h2></div><button className="text-button" onClick={() => onNavigate('Calendar')}>See calendar <ArrowRight size={15} /></button></div><div className="progress-layout"><div className="progress-ring" style={{ '--progress': `${progress}%` } as React.CSSProperties}><div className="ring-center"><strong>{progress}<span>%</span></strong><span>in your flow</span></div></div><div className="progress-copy"><strong>{finished} of {habits.length} small steps</strong><span>There is no behind. Just your own pace.</span><div className="progress-tags"><span className="progress-tag tag-done"><span className="status-dot orange-dot" /> {finished} done</span><span className="progress-tag"><span className="status-dot sand-dot" /> {Math.max(habits.length - finished, 0)} still open</span></div></div></div><div className="progress-footer"><span>Every bit counts.</span><span className="date-stamp"><Sun size={14} /> A fresh start, any time</span></div></section>
      <section className="panel routines-panel"><div className="panel-heading"><div><h2>Today's routines</h2></div><button className="text-button" onClick={() => onNavigate('Routines')}>All routines <ArrowRight size={15} /></button></div><div className="routine-list">{todayRoutines.slice(0, 2).map((routine, index) => {
        const routineHabits = habits.filter((habit) => routine.habitIds.includes(habit.id))
        const done = routineHabits.filter((habit) => records[dateKey(now, habit.id)]?.status === 'complete').length
        const complete = routineHabits.length > 0 && done === routineHabits.length
        return <div className={`routine-row ${complete ? 'routine-complete' : ''}`} data-tone={routineTones[index % routineTones.length]} key={routine.id}><div className="routine-icon"><RoutineIcon routine={routine} /></div><div className="routine-info"><div className="routine-title-row"><strong>{routine.name}</strong><span className="routine-time"><Clock3 size={13} />{routine.time}</span></div><span className="routine-detail">{routineHabits.length} moments <span className="middle-dot">·</span> about {formatDuration(routine.duration)}</span><div className="mini-progress"><span style={{ width: `${routineHabits.length ? done / routineHabits.length * 100 : 0}%` }} /></div></div><span className="routine-count">{complete ? <><Check size={12} /> Done</> : `${done}/${routineHabits.length}`}</span><button className="small-icon-button" aria-label={`Open ${routine.name}`} onClick={() => onNavigate('Routines')}><ChevronRight size={17} /></button></div>
      })}{todayRoutines.length === 0 && <div className="empty-inline">No routines planned for today. A little breathing room counts, too.</div>}</div></section>
      <section className="panel week-panel"><div className="panel-heading"><div><h2>Your week</h2></div><button className="text-button" onClick={() => onNavigate('Insights')}>Weekly insights <ArrowRight size={15} /></button></div><div className="week-chart" aria-label="Weekly routine overview">{[['M', 58, 2], ['T', 76, 3], ['W', 48, 2], ['T', 88, 4], ['F', 65, 3], ['S', 40, 2], ['S', 32, 1]].map(([day, height, count], index) => <button key={`${day}-${index}`} className={`week-column ${index === (now.getDay() + 6) % 7 ? 'today-column' : ''}`} onClick={() => onNavigate('Calendar')} aria-label={`${day}, ${count} planned moments`}><span className="week-bar-wrap"><span className="week-bar" style={{ height: `${height}%` }} /></span><span className="week-count">{count}</span><span className="week-day">{day}</span></button>)}</div></section>
    </div><div className="right-column">
      <section className="panel today-panel"><div className="panel-heading"><div><h2>Up next</h2></div><span className="live-dot" /></div><div className="upcoming-list">{upcoming.map((habit) => <div className="upcoming-row" data-tone={toneFor(habit.category)} key={habit.id}><div className="upcoming-time">{habit.time}</div><div className="timeline"><span className="timeline-dot"><HabitIcon habit={habit} size={15} /></span></div><div className="upcoming-copy"><strong>{habit.name}</strong><span>{habit.duration} min <span className="category-chip">{habit.category}</span></span></div><button className="small-icon-button" aria-label={`Mark ${habit.name} complete`} onClick={() => onRecord(habit.id, 'complete')}><Circle size={18} /></button></div>)}{upcoming.length === 0 && <div className="empty-inline">Nothing left on the clock. Enjoy the space.</div>}</div><button className="panel-link" onClick={() => onNavigate('Calendar')}>See the whole day <ArrowRight size={15} /></button></section>
      <PatternSpotlight insights={insights} onAct={onAct} onSeeAll={onSeeAllPatterns} />
      <section className="panel habit-list-panel"><div className="panel-heading"><div><h2>Today’s habits</h2></div><span className="habit-total">{habits.length}</span></div><div className="habit-quick-list">{habits.slice(0, 4).map((habit) => {
        const record = records[dateKey(now, habit.id)]
        return <div className="habit-quick-row" data-tone={toneFor(habit.category)} key={habit.id}><button className={`check-control ${record?.status === 'complete' ? 'checked' : record?.status === 'partial' ? 'partially-checked' : ''}`} onClick={() => onRecord(habit.id, record?.status === 'complete' ? 'partial' : 'complete')} aria-label={record?.status === 'complete' ? `Undo ${habit.name}` : `Complete ${habit.name}`}>{record?.status === 'complete' ? <Check size={12} strokeWidth={3} /> : record?.status === 'partial' ? <span className="partial-mark" /> : null}</button><span className="habit-row-icon" title={habit.category}><HabitIcon habit={habit} size={14} /></span><span className={record?.status === 'complete' ? 'habit-done' : ''}>{habit.name}</span><span className="habit-duration">{habit.duration}m</span></div>
      })}</div><button className="panel-link" onClick={() => onNavigate('Habits')}>View all habits <ArrowRight size={15} /></button></section>
    </div></section>
  </>
}

function Routines({ routines, habits, onAdd, onEdit, onUpdate }: { routines: Routine[]; habits: Habit[]; onAdd: () => void; onEdit: (routine: Routine) => void; onUpdate: (id: string, action: 'pause' | 'duplicate') => void }) {
  const [query, setQuery] = useState('')
  const needle = query.trim().toLowerCase()
  const matches = (routine: Routine) => !needle
    || routine.name.toLowerCase().includes(needle)
    || (routine.anchor ?? '').toLowerCase().includes(needle)
    || habits.some((habit) => routine.habitIds.includes(habit.id) && habit.name.toLowerCase().includes(needle))
  const shown = routines.filter(matches)
  return <>
    <PageIntro tone="sage" eyebrow="ROUTINES" title={<>Find your own <em>rhythm.</em></>} subtitle="A rhythm, not a rulebook. Build around the days you actually have." action={<button className="button button-primary" onClick={onAdd}><Plus size={17} /> New routine</button>} />
    <div className="routine-toolbar">
      <span>{needle ? `${shown.length} of ${routines.length} routines` : `${routines.length} ${routines.length === 1 ? 'routine' : 'routines'}`}</span>
      <label className="search-box"><Search size={16} /><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Find a routine or habit" aria-label="Search routines" />{query && <button aria-label="Clear search" onClick={() => setQuery('')}><X size={14} /></button>}</label>
    </div>
    {needle && shown.length === 0 && <div className="empty-state"><span className="empty-state-icon"><Search size={22} /></span><h2>No routines found</h2><p>Nothing matches “{query.trim()}”. Try a habit name, or start a new routine.</p><button className="button button-quiet" onClick={() => setQuery('')}>Clear search</button></div>}
    {(!needle || shown.length > 0) && <div className="routine-page-grid">
      {routines.map((routine, index) => {
        if (!matches(routine)) return null
        const routineHabits = routine.habitIds.map((id) => habits.find((habit) => habit.id === id)).filter((habit): habit is Habit => Boolean(habit))
        const minimum = routineHabits.filter((habit) => routine.minimumHabitIds?.includes(habit.id))
        return <article className={`routine-card ${routine.paused ? 'routine-paused' : ''}`} data-tone={routineTones[index % routineTones.length]} key={routine.id}>
          <div className="routine-card-top">
            <div className="routine-icon"><RoutineIcon routine={routine} /></div>
            <button className="small-icon-button" aria-label={`Edit ${routine.name}`} onClick={() => onEdit(routine)}><MoreHorizontal size={19} /></button>
          </div>
          <div className="routine-card-title"><h2>{routine.name}</h2>{routine.paused && <span className="paused-label">Paused</span>}</div>
          {routine.anchor && <div className="routine-anchor"><Link2 size={13} />After {routine.anchor.charAt(0).toLowerCase() + routine.anchor.slice(1)}</div>}
          <div className="routine-card-meta">
            <span><Clock3 size={14} />{routine.windowEnd ? `${routine.time} – ${routine.windowEnd}` : routine.time}</span>
            <span><Activity size={14} />{formatDuration(routine.duration)}</span>
            {routine.reminder?.enabled && <span className="meta-reminder" title={reminderLabel(routine.reminder.offset)}><Bell size={14} /></span>}
          </div>
          {routine.frequency === 'flexible'
            ? <div className="flex-frequency">{routine.timesPerWeek ?? 3}× a week <span className="middle-dot">·</span> any day</div>
            : <div className="day-chips">{dayInitials.map((day, i) => <span className={routine.days.includes(dayLabels[i]) ? 'day-chip selected' : 'day-chip'} key={`${day}-${i}`}>{day}</span>)}</div>}
          <div className="routine-card-divider" />
          <div className="routine-habits-label">IN THIS ROUTINE <span>{routineHabits.length}</span></div>
          <div className="routine-habit-stack">
            {routineHabits.slice(0, 3).map((habit) => <div key={habit.id}><span className="tiny-check" data-tone={toneFor(habit.category)}><HabitIcon habit={habit} size={13} /></span>{habit.name}<span className="habit-duration">{habit.duration}m</span></div>)}
            {routineHabits.length > 3 && <button className="more-habits" onClick={() => onEdit(routine)}>+{routineHabits.length - 3} more</button>}
            {routineHabits.length === 0 && <div className="empty-inline compact-empty">Ready when you are. Add a habit from your collection.</div>}
          </div>
          {minimum.length > 0 && <div className="minimum-badge"><Feather size={13} />Minimum version: {minimum.length} {minimum.length === 1 ? 'habit' : 'habits'} <span className="middle-dot">·</span> {formatDuration(minimum.reduce((sum, habit) => sum + habit.duration, 0))}</div>}
          <div className="routine-card-actions">
            <button className="button button-quiet" onClick={() => onUpdate(routine.id, 'pause')}>{routine.paused ? 'Resume' : 'Pause'}</button>
            <button className="button button-quiet" onClick={() => onUpdate(routine.id, 'duplicate')}><Copy size={14} /> Duplicate</button>
            <button className="button button-quiet edit-button" onClick={() => onEdit(routine)}>Edit <ArrowRight size={14} /></button>
          </div>
        </article>
      })}
      {!needle && <button className="new-routine-card" onClick={onAdd}><span className="new-routine-plus"><Plus size={20} /></span><strong>Start a new rhythm</strong><span>Make a routine that feels like yours.</span></button>}
    </div>}
    <div className="note-banner"><span className="note-banner-icon"><Sparkles size={17} /></span><span><strong>It can be smaller.</strong> Every routine can have a minimum version for the days that ask for less.</span><button onClick={onAdd}>Create one <ArrowRight size={14} /></button></div>
  </>
}

/* ---------- Routine editor ---------- */
const anchorSuggestions = ['Morning coffee', 'Brushing my teeth', 'Getting home', 'Lunch', 'Closing my laptop']
const reminderOffsets = [0, 5, 10, 15, 30, 60]
const dayPresets: { label: string; days: string[] }[] = [
  { label: 'Every day', days: dayLabels },
  { label: 'Weekdays', days: dayLabels.slice(0, 5) },
  { label: 'Weekends', days: dayLabels.slice(5) },
]

function RoutineEditor({ routine, habits, onClose, onSave, onDelete }: { routine?: Routine; habits: Habit[]; onClose: () => void; onSave: (routine: Routine, newHabits: Habit[], previousName?: string) => void; onDelete: (id: string) => void }) {
  const isNew = !routine
  const [name, setName] = useState(routine?.name ?? '')
  const [icon, setIcon] = useState(routine?.icon)
  const [anchor, setAnchor] = useState(routine?.anchor ?? '')
  const [frequency, setFrequency] = useState<'days' | 'flexible'>(routine?.frequency ?? 'days')
  const [days, setDays] = useState<string[]>(routine?.days ?? dayLabels.slice(0, 5))
  const [timesPerWeek, setTimesPerWeek] = useState(routine?.timesPerWeek ?? 3)
  const [start, setStart] = useState(to24(routine?.time ?? '8:00 AM'))
  const [hasWindow, setHasWindow] = useState(Boolean(routine?.windowEnd))
  const [end, setEnd] = useState(to24(routine?.windowEnd ?? '9:00 AM'))
  const initialMinutes = routine?.duration ?? 20
  const [durationUnit, setDurationUnit] = useState<'min' | 'h'>(initialMinutes >= 60 && initialMinutes % 30 === 0 ? 'h' : 'min')
  const [durationValue, setDurationValue] = useState(String(initialMinutes >= 60 && initialMinutes % 30 === 0 ? initialMinutes / 60 : initialMinutes))
  const [habitIds, setHabitIds] = useState<string[]>(routine?.habitIds ?? [])
  const [draftHabits, setDraftHabits] = useState<Habit[]>([])
  const [habitQuery, setHabitQuery] = useState('')
  const [reminder, setReminder] = useState<Reminder>(routine?.reminder ?? { enabled: false, offset: 10, nudge: true })
  const [minimumIds, setMinimumIds] = useState<string[]>(routine?.minimumHabitIds ?? [])
  const [notes, setNotes] = useState(routine?.notes ?? '')

  useEscape(onClose)

  const PreviewIcon = (icon && iconLibrary[icon]) || autoRoutineIcon(from24(start))
  const pool = [...habits, ...draftHabits]
  const chosen = habitIds.map((id) => pool.find((habit) => habit.id === id)).filter((habit): habit is Habit => Boolean(habit))
  const available = habits.filter((habit) => !habitIds.includes(habit.id))
  const habitsTotal = chosen.reduce((sum, habit) => sum + habit.duration, 0)
  const minutes = Math.max(1, Math.round((Number(durationValue) || 0) * (durationUnit === 'h' ? 60 : 1)))
  const minimum = chosen.filter((habit) => minimumIds.includes(habit.id))
  const missingDays = frequency === 'days' && days.length === 0
  const canSave = name.trim().length > 0 && !missingDays

  function toggleDay(day: string) {
    setDays((current) => current.includes(day) ? current.filter((item) => item !== day) : dayLabels.filter((item) => item === day || current.includes(item)))
  }

  function addHabit(value = habitQuery) {
    const query = value.trim()
    if (!query) return
    const existing = pool.find((habit) => habit.name.toLowerCase() === query.toLowerCase())
    if (existing) {
      if (!habitIds.includes(existing.id)) setHabitIds((current) => [...current, existing.id])
    } else {
      const created: Habit = { id: `habit-${Date.now()}`, name: query, category: 'Lifestyle', duration: 10, time: from24(start), routine: name.trim() || 'Just for me' }
      setDraftHabits((current) => [...current, created])
      setHabitIds((current) => [...current, created.id])
    }
    setHabitQuery('')
  }

  function removeHabit(id: string) {
    setHabitIds((current) => current.filter((item) => item !== id))
    setMinimumIds((current) => current.filter((item) => item !== id))
  }

  function useHabitsTotal() {
    setDurationUnit('min')
    setDurationValue(String(habitsTotal))
  }

  function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!canSave) return
    const next: Routine = {
      ...(routine ?? { id: `routine-${Date.now()}` }),
      name: name.trim(),
      icon,
      anchor: anchor.trim() || undefined,
      frequency,
      days: frequency === 'days' ? days : routine?.days ?? dayLabels,
      timesPerWeek,
      time: from24(start),
      windowEnd: hasWindow ? from24(end) : undefined,
      duration: minutes,
      habitIds,
      reminder,
      minimumHabitIds: minimumIds.filter((id) => habitIds.includes(id)),
      notes: notes.trim() || undefined,
    }
    onSave(next, draftHabits.filter((habit) => habitIds.includes(habit.id)), routine?.name)
  }

  const summary = [
    frequency === 'flexible' ? `${timesPerWeek}× a week, any day` : describeDays(days),
    hasWindow ? `${from24(start)} – ${from24(end)}` : from24(start),
    formatDuration(minutes),
    reminder.enabled ? `reminder ${reminderLabel(reminder.offset).toLowerCase()}` : null,
  ].filter(Boolean).join(' · ')

  return <div className="modal-backdrop" onMouseDown={(event) => { if (event.target === event.currentTarget) onClose() }}>
    <section className="modal editor" role="dialog" aria-modal="true" aria-labelledby="editor-title" data-tone="sage">
      <form onSubmit={submit} className="editor-form">
        <header className="editor-header">
          <div className="modal-top">
            <span className="modal-icon"><PreviewIcon size={19} /></span>
            <button type="button" className="icon-button" onClick={onClose} aria-label="Close dialog"><X size={19} /></button>
          </div>
          <div className="eyebrow small-eyebrow">{isNew ? 'A NEW RHYTHM' : 'EDIT ROUTINE'}</div>
          <h2 id="editor-title">{name.trim() || (isNew ? 'Untitled routine' : routine.name)}</h2>
          <p className="editor-summary" aria-live="polite">{anchor.trim() && <><span className="summary-anchor">After {anchor.trim().charAt(0).toLowerCase() + anchor.trim().slice(1)}</span> · </>}{summary}</p>
        </header>

        <div className="editor-body">
          <fieldset className="editor-section">
            <legend>The basics</legend>
            <label className="form-label">Routine name<input autoFocus={isNew} value={name} onChange={(event) => setName(event.target.value)} required maxLength={54} placeholder="A slower start" /></label>
            <div className="form-label"><span>Icon</span><IconPicker value={icon} auto={autoRoutineIcon(from24(start))} onChange={setIcon} /></div>
            <label className="form-label">
              <span className="label-row">Anchor it to a moment <span className="label-hint">Optional</span></span>
              <div className="prefix-input"><span>After</span><input value={anchor} onChange={(event) => setAnchor(event.target.value)} maxLength={40} placeholder="my morning coffee" /></div>
            </label>
            <div className="suggestion-chips" aria-label="Anchor suggestions">{anchorSuggestions.map((item) => <button type="button" key={item} className={`suggestion-chip ${anchor === item ? 'selected' : ''}`} onClick={() => setAnchor(anchor === item ? '' : item)}>{item}</button>)}</div>
            <p className="field-help"><Lightbulb size={14} />Tying a routine to something you already do makes it easier to remember.</p>
          </fieldset>

          <fieldset className="editor-section">
            <legend>When</legend>
            <div className="segmented" role="radiogroup" aria-label="Frequency">
              <button type="button" role="radio" aria-checked={frequency === 'days'} className={frequency === 'days' ? 'selected' : ''} onClick={() => setFrequency('days')}>On specific days</button>
              <button type="button" role="radio" aria-checked={frequency === 'flexible'} className={frequency === 'flexible' ? 'selected' : ''} onClick={() => setFrequency('flexible')}>A few times a week</button>
            </div>
            {frequency === 'days' ? <>
              <div className="day-picker">{dayLabels.map((day, i) => <button type="button" key={day} aria-pressed={days.includes(day)} aria-label={day} className={days.includes(day) ? 'selected' : ''} onClick={() => toggleDay(day)}>{dayInitials[i]}</button>)}</div>
              <div className="preset-row">{dayPresets.map((preset) => <button type="button" key={preset.label} className={`text-chip ${preset.days.join() === days.join() ? 'selected' : ''}`} onClick={() => setDays(preset.days)}>{preset.label}</button>)}</div>
              {missingDays && <p className="field-error">Pick at least one day, or switch to “A few times a week”.</p>}
            </> : <div className="stepper-row">
              <div className="stepper"><button type="button" aria-label="Fewer times" onClick={() => setTimesPerWeek((value) => Math.max(1, value - 1))} disabled={timesPerWeek <= 1}><Minus size={15} /></button><strong>{timesPerWeek}</strong><button type="button" aria-label="More times" onClick={() => setTimesPerWeek((value) => Math.min(7, value + 1))} disabled={timesPerWeek >= 7}><Plus size={15} /></button></div>
              <span>times a week, whichever days work. No fixed schedule to fall behind on.</span>
            </div>}
            <div className="form-row">
              <label className="form-label">{hasWindow ? 'From' : 'Start time'}<input type="time" value={start} onChange={(event) => setStart(event.target.value)} required /></label>
              {hasWindow
                ? <label className="form-label">Until<input type="time" value={end} onChange={(event) => setEnd(event.target.value)} /></label>
                : <label className="form-label">Duration<div className="unit-input"><input type="number" min="1" max={durationUnit === 'h' ? 12 : 600} step={durationUnit === 'h' ? 0.5 : 1} value={durationValue} onChange={(event) => setDurationValue(event.target.value)} aria-label="Duration" /><select value={durationUnit} onChange={(event) => setDurationUnit(event.target.value as 'min' | 'h')} aria-label="Unit"><option value="min">min</option><option value="h">hours</option></select></div></label>}
            </div>
            {hasWindow && <label className="form-label">Duration<div className="unit-input"><input type="number" min="1" max={durationUnit === 'h' ? 12 : 600} step={durationUnit === 'h' ? 0.5 : 1} value={durationValue} onChange={(event) => setDurationValue(event.target.value)} aria-label="Duration" /><select value={durationUnit} onChange={(event) => setDurationUnit(event.target.value as 'min' | 'h')} aria-label="Unit"><option value="min">min</option><option value="h">hours</option></select></div></label>}
            <label className="switch-row"><span><strong>Flexible window</strong><span>Any time within a range, instead of an exact time.</span></span><input type="checkbox" role="switch" checked={hasWindow} onChange={(event) => setHasWindow(event.target.checked)} /></label>
            {habitsTotal > 0 && habitsTotal !== minutes && <p className="field-help"><Clock3 size={14} />Your habits add up to {formatDuration(habitsTotal)}. <button type="button" className="inline-link" onClick={useHabitsTotal}>Use that</button></p>}
          </fieldset>

          <fieldset className="editor-section">
            <legend>Habits in this routine <span className="legend-count">{chosen.length}</span></legend>
            {chosen.length > 0 && <ol className="editor-habits">{chosen.map((habit) => <li key={habit.id} data-tone={toneFor(habit.category)}>
              <span className="tiny-check"><HabitIcon habit={habit} size={13} /></span>
              <span className="editor-habit-name">{habit.name}{draftHabits.some((item) => item.id === habit.id) && <span className="new-tag">New</span>}</span>
              <span className="habit-duration">{habit.duration}m</span>
              <button type="button" className="small-icon-button" aria-label={`Remove ${habit.name}`} onClick={() => removeHabit(habit.id)}><X size={15} /></button>
            </li>)}</ol>}
            <div className="add-habit-row">
              <input list="habit-options" value={habitQuery} onChange={(event) => setHabitQuery(event.target.value)} onKeyDown={(event) => { if (event.key === 'Enter') { event.preventDefault(); addHabit() } }} placeholder="Pick a habit or type a new one" aria-label="Add a habit" />
              <datalist id="habit-options">{available.map((habit) => <option key={habit.id} value={habit.name} />)}</datalist>
              <button type="button" className="button button-quiet" onClick={() => addHabit()} disabled={!habitQuery.trim()}><Plus size={14} /> Add</button>
            </div>
            {available.length > 0 && <div className="suggestion-chips">{available.slice(0, 4).map((habit) => <button type="button" key={habit.id} className="suggestion-chip" onClick={() => addHabit(habit.name)}><Plus size={12} />{habit.name}</button>)}</div>}
          </fieldset>

          {chosen.length > 0 && <fieldset className="editor-section minimum-section">
            <legend><Feather size={15} /> Minimum version</legend>
            <p className="section-help">For the days that ask for less. Choose what still counts as showing up.</p>
            <div className="minimum-options">{chosen.map((habit) => <label key={habit.id} className={`check-pill ${minimumIds.includes(habit.id) ? 'selected' : ''}`}><input type="checkbox" checked={minimumIds.includes(habit.id)} onChange={() => setMinimumIds((current) => current.includes(habit.id) ? current.filter((id) => id !== habit.id) : [...current, habit.id])} />{habit.name}</label>)}</div>
            {minimum.length > 0 && <p className="minimum-summary">On a low day: {minimum.length} {minimum.length === 1 ? 'habit' : 'habits'}, about {formatDuration(minimum.reduce((sum, habit) => sum + habit.duration, 0))}. Still a win.</p>}
          </fieldset>}

          <fieldset className="editor-section">
            <legend>Reminders</legend>
            <label className="switch-row"><span><strong>Remind me</strong><span>A quiet notification, never a guilt trip.</span></span><input type="checkbox" role="switch" checked={reminder.enabled} onChange={(event) => setReminder({ ...reminder, enabled: event.target.checked })} /></label>
            {reminder.enabled && <>
              <label className="form-label">When<select value={reminder.offset} onChange={(event) => setReminder({ ...reminder, offset: Number(event.target.value) })}>{reminderOffsets.map((offset) => <option key={offset} value={offset}>{reminderLabel(offset)}</option>)}</select></label>
              <label className="check-row"><input type="checkbox" checked={reminder.nudge} onChange={(event) => setReminder({ ...reminder, nudge: event.target.checked })} /><span>If I miss it, offer the minimum version later</span></label>
            </>}
          </fieldset>

          <fieldset className="editor-section">
            <legend>Notes</legend>
            <label className="form-label"><span className="visually-hidden">Notes</span><textarea value={notes} onChange={(event) => setNotes(event.target.value)} rows={3} maxLength={280} placeholder="Why this matters to you, or what helps it go well" /></label>
          </fieldset>
        </div>

        <EditorFooter isNew={isNew} canSave={canSave} saveLabel={isNew ? 'Create routine' : 'Save changes'} itemName={routine?.name ?? ''} deleteDetail="Its habits stay in your collection." onCancel={onClose} onDelete={() => routine && onDelete(routine.id)} />
      </form>
    </section>
  </div>
}

function to24(time: string) {
  const total = timeInMinutes(time)
  return `${String(Math.floor(total / 60)).padStart(2, '0')}:${String(total % 60).padStart(2, '0')}`
}

function from24(value: string) {
  const [hours, minutes] = value.split(':').map(Number)
  const period = hours >= 12 ? 'PM' : 'AM'
  return `${hours % 12 || 12}:${String(minutes || 0).padStart(2, '0')} ${period}`
}

function formatDuration(minutes: number) {
  if (minutes < 60) return `${minutes} min`
  const hours = Math.floor(minutes / 60)
  const rest = minutes % 60
  return rest ? `${hours} h ${rest} min` : `${hours} h`
}

function reminderLabel(offset: number) {
  if (offset === 0) return 'At start time'
  return offset >= 60 ? `${offset / 60} h before` : `${offset} min before`
}

function describeDays(days: string[]) {
  const key = days.join()
  if (key === dayLabels.join()) return 'Every day'
  if (key === dayLabels.slice(0, 5).join()) return 'Weekdays'
  if (key === dayLabels.slice(5).join()) return 'Weekends'
  return days.length ? days.join(', ') : 'No days yet'
}

function Habits({ habits, query, category, onSearch, onCategory, onAdd, onEdit }: { habits: Habit[]; query: string; category: string; onSearch: (value: string) => void; onCategory: (value: string) => void; onAdd: () => void; onEdit: (habit: Habit) => void }) {
  const filtered = habits.filter((habit) => (category === 'All habits' || habit.category === category) && habit.name.toLowerCase().includes(query.toLowerCase()))
  return <><PageIntro tone="butter" eyebrow="HABITS" title={<>Little things. <em>Big changes.</em></>} subtitle="The small moments that make a life feel more like yours." action={<button className="button button-primary" onClick={onAdd}><Plus size={17} /> New habit</button>} /><div className="habit-toolbar"><div className="filter-tabs" role="tablist" aria-label="Filter by category">{categories.map((item) => <button key={item} role="tab" aria-selected={category === item} data-tone={item === 'All habits' ? 'orange' : toneFor(item)} className={category === item ? 'filter-tab selected' : 'filter-tab'} onClick={() => onCategory(item)}>{item !== 'All habits' && <span className="tone-dot" />}{item}</button>)}</div><label className="search-box"><Search size={16} /><input value={query} onChange={(event) => onSearch(event.target.value)} placeholder="Find a habit" aria-label="Search habits" />{query && <button aria-label="Clear search" onClick={() => onSearch('')}><X size={14} /></button>}</label></div><div className="habit-results-heading"><span>{filtered.length} {filtered.length === 1 ? 'habit' : 'habits'}</span><button className="sort-button">Recently added <ChevronDown size={14} /></button></div>{filtered.length ? <div className="habit-grid">{filtered.map((habit) => <article className="habit-card" data-tone={toneFor(habit.category)} key={habit.id}><div className="habit-card-icon"><HabitIcon habit={habit} size={21} /></div><button className="small-icon-button habit-more" aria-label={`Edit ${habit.name}`} onClick={() => onEdit(habit)}><MoreHorizontal size={18} /></button><div className="habit-card-category">{habit.category}</div><h2>{habit.name}</h2><div className="habit-card-meta"><span><Clock3 size={14} />{habit.duration} min</span><span>{habit.routine}</span></div>{habit.tinyVersion && <div className="habit-tiny"><Feather size={12} />Tiny: {habit.tinyVersion}</div>}<div className="habit-card-bottom"><span className="frequency-label"><span className="frequency-dot" /> {habit.frequency ?? 'A few times a week'}</span><button className="round-action" aria-label={`Edit ${habit.name}`} onClick={() => onEdit(habit)}><ArrowUpRight size={16} /></button></div></article>)}</div> : <div className="empty-state"><span className="empty-state-icon"><Search size={22} /></span><h2>No habits found</h2><p>Try another search or choose a different category.</p><button className="button button-quiet" onClick={() => { onSearch(''); onCategory('All habits') }}>Clear filters</button></div>}</>
}

type CalendarMode = 'day' | 'week' | 'month' | 'year'
const calendarModes: { mode: CalendarMode; label: string }[] = [
  { mode: 'day', label: 'Day' },
  { mode: 'week', label: 'Week' },
  { mode: 'month', label: 'Month' },
  { mode: 'year', label: 'Year' },
]

function sameDay(a: Date, b: Date) {
  return a.toDateString() === b.toDateString()
}

function startOfWeek(date: Date) {
  const start = new Date(date)
  start.setHours(0, 0, 0, 0)
  start.setDate(date.getDate() - ((date.getDay() + 6) % 7))
  return start
}

function addDays(date: Date, amount: number) {
  const next = new Date(date)
  next.setDate(next.getDate() + amount)
  return next
}

/* Six rows of seven days, Monday first, covering the whole month. */
function monthMatrix(year: number, month: number) {
  const start = startOfWeek(new Date(year, month, 1))
  return Array.from({ length: 42 }, (_, index) => addDays(start, index))
}

function CalendarView({ habits, routines, records, selectedDate, onDate, onRecord }: { habits: Habit[]; routines: Routine[]; records: Record<string, ActivityRecord>; selectedDate: Date; onDate: (date: Date) => void; onRecord: (habitId: string, status: Status) => void }) {
  const [mode, setMode] = useState<CalendarMode>('week')
  const today = new Date()
  const weekStart = startOfWeek(selectedDate)
  const weekDays = Array.from({ length: 7 }, (_, index) => addDays(weekStart, index))

  function habitsOn(date: Date) {
    const code = dayLabels[(date.getDay() + 6) % 7]
    const dayRoutines = routines.filter((routine) => !routine.paused && routine.days.includes(code))
    return habits.filter((habit) => dayRoutines.some((routine) => routine.habitIds.includes(habit.id)) || habit.routine === 'Just for me')
  }

  function doneOn(date: Date, list: Habit[]) {
    return list.filter((habit) => records[dateKey(date, habit.id)]?.status === 'complete').length
  }

  function move(direction: number) {
    const next = new Date(selectedDate)
    if (mode === 'day') next.setDate(next.getDate() + direction)
    if (mode === 'week') next.setDate(next.getDate() + direction * 7)
    if (mode === 'month' || mode === 'year') {
      const day = next.getDate()
      next.setDate(1)
      if (mode === 'month') next.setMonth(next.getMonth() + direction)
      else next.setFullYear(next.getFullYear() + direction)
      next.setDate(Math.min(day, new Date(next.getFullYear(), next.getMonth() + 1, 0).getDate()))
    }
    onDate(next)
  }

  const year = selectedDate.getFullYear()
  const shortDate = (date: Date) => new Intl.DateTimeFormat('en', { month: 'short', day: 'numeric' }).format(date)
  const weekEnd = weekDays[6]
  const heading = mode === 'day'
    ? new Intl.DateTimeFormat('en', { weekday: 'long', month: 'long', day: 'numeric' }).format(selectedDate)
    : mode === 'week'
      ? weekStart.getMonth() === weekEnd.getMonth() ? `${shortDate(weekStart)} – ${weekEnd.getDate()}` : `${shortDate(weekStart)} – ${shortDate(weekEnd)}`
      : mode === 'month' ? new Intl.DateTimeFormat('en', { month: 'long' }).format(selectedDate) : String(year)
  const headingYear = mode === 'year' ? '' : String(year)
  const containsToday = mode === 'day' ? sameDay(selectedDate, today)
    : mode === 'week' ? sameDay(startOfWeek(today), weekStart)
      : mode === 'month' ? today.getMonth() === selectedDate.getMonth() && today.getFullYear() === year
        : today.getFullYear() === year
  const unit = mode === 'week' ? 'week' : mode

  function daySchedule(date: Date, showTitle = false) {
    const list = [...habitsOn(date)].sort((a, b) => timeInMinutes(a.time) - timeInMinutes(b.time))
    const done = doneOn(date, list)
    return <div className="day-schedule">
      {showTitle && <div className="day-schedule-title"><strong>{new Intl.DateTimeFormat('en', { weekday: 'long', month: 'long', day: 'numeric' }).format(date)}</strong>{list.length > 0 && <span>{done} of {list.length} done</span>}</div>}
      {list.length ? <div className="calendar-body">{calendarSlots.map((label, index) => {
        const slotHabits = list.filter((habit) => calendarRow(habit.time) === index + 1)
        return <div className={`calendar-slot ${slotHabits.length ? '' : 'is-empty'}`} key={label}><span className="calendar-slot-time">{label}</span><div className="calendar-slot-events">{slotHabits.map((habit) => {
          const record = records[dateKey(date, habit.id)]
          return <div className={`calendar-event ${record?.status ? `is-${record.status}` : ''}`} data-tone={toneFor(habit.category)} key={habit.id} title={`${habit.name} · ${habit.category}`}><div className="event-copy"><strong>{habit.name}</strong><span>{habit.time} <span className="middle-dot">·</span> {habit.duration} min</span></div>{record && record.status !== 'complete' && <span className={`event-state ${record.status}`}>{record.status}</span>}<button className="small-icon-button event-check" aria-label={record?.status === 'complete' ? `${habit.name} completed` : `Complete ${habit.name}`} aria-pressed={record?.status === 'complete'} onClick={() => onRecord(habit.id, 'complete')}><Check size={14} strokeWidth={2.5} /></button></div>
        })}</div></div>
      })}</div> : <div className="calendar-empty"><span className="empty-state-icon"><Sun size={20} /></span><strong>A little open space.</strong><span>No planned activities. Your day belongs to you.</span></div>}
    </div>
  }

  return <>
    <PageIntro tone="orange" eyebrow="CALENDAR" title={<>Plan with room <em>to breathe.</em></>} subtitle="Plans are a starting point. Move things around as life happens." />
    <section className="calendar-panel panel">
      <div className="calendar-toolbar">
        <div className="calendar-nav">
          <button className="icon-button" onClick={() => move(-1)} aria-label={`Previous ${unit}`}><ChevronLeft size={18} /></button>
          <button className="icon-button" onClick={() => move(1)} aria-label={`Next ${unit}`}><ChevronRight size={18} /></button>
          <div className="calendar-month"><h2>{heading} {headingYear && <span className="calendar-year">{headingYear}</span>}</h2></div>
          {!containsToday && <button className="today-link" onClick={() => onDate(new Date())}>Back to today</button>}
        </div>
        <div className="view-toggle" role="tablist" aria-label="Calendar view">{calendarModes.map(({ mode: item, label }) => <button key={item} role="tab" aria-selected={mode === item} className={mode === item ? 'selected' : ''} onClick={() => setMode(item)}>{label}</button>)}</div>
      </div>

      {mode === 'week' && <>
        <div className="calendar-days">{weekDays.map((date, index) => {
          const planned = habitsOn(date).length
          return <button className={`calendar-day ${sameDay(date, selectedDate) ? 'selected' : ''} ${sameDay(date, today) ? 'is-today' : ''}`} onClick={() => onDate(date)} key={date.toDateString()}><span>{dayLabels[index]}</span><strong>{date.getDate()}</strong><i className={planned ? 'has-activity' : ''} /></button>
        })}</div>
        {daySchedule(selectedDate)}
      </>}

      {mode === 'day' && daySchedule(selectedDate, true)}

      {mode === 'month' && <>
        <div className="month-grid" role="grid" aria-label={heading}>
          {dayInitials.map((day, index) => <span className="month-weekday" key={`${day}-${index}`}>{dayLabels[index]}</span>)}
          {monthMatrix(year, selectedDate.getMonth()).map((date) => {
            const list = habitsOn(date)
            const done = doneOn(date, list)
            const outside = date.getMonth() !== selectedDate.getMonth()
            return <button role="gridcell" key={date.toDateString()} className={`month-cell ${outside ? 'is-outside' : ''} ${sameDay(date, selectedDate) ? 'selected' : ''} ${sameDay(date, today) ? 'is-today' : ''}`} onClick={() => onDate(date)} aria-label={`${date.toDateString()}, ${list.length} planned, ${done} done`}>
              <span className="month-date">{date.getDate()}</span>
              {list.length > 0 && <span className="month-dots" aria-hidden="true">{list.slice(0, 5).map((habit, i) => <i key={habit.id} className={i < done ? 'done' : ''} />)}</span>}
              {list.length > 0 && <span className="month-count">{done ? `${done}/${list.length}` : `${list.length} planned`}</span>}
            </button>
          })}
        </div>
        {daySchedule(selectedDate, true)}
      </>}

      {mode === 'year' && <div className="year-grid">{Array.from({ length: 12 }, (_, month) => {
        const monthDate = new Date(year, month, 1)
        return <div className={`year-month ${month === selectedDate.getMonth() ? 'is-current' : ''}`} key={month}>
          <button className="year-month-name" onClick={() => { onDate(new Date(year, month, Math.min(selectedDate.getDate(), new Date(year, month + 1, 0).getDate()))); setMode('month') }}>{new Intl.DateTimeFormat('en', { month: 'long' }).format(monthDate)}<ChevronRight size={14} /></button>
          <div className="year-days">{monthMatrix(year, month).slice(0, 42).map((date) => {
            const outside = date.getMonth() !== month
            const planned = outside ? 0 : habitsOn(date).length
            const level = planned === 0 ? 0 : planned <= 2 ? 1 : planned <= 4 ? 2 : 3
            return <button key={date.toDateString()} disabled={outside} className={`year-day level-${level} ${!outside && sameDay(date, today) ? 'is-today' : ''} ${!outside && sameDay(date, selectedDate) ? 'selected' : ''}`} onClick={() => { onDate(date); setMode('day') }} aria-label={outside ? undefined : `${date.toDateString()}, ${planned} planned`}>{outside ? '' : date.getDate()}</button>
          })}</div>
        </div>
      })}</div>}

      <div className="calendar-legend">
        {mode === 'year'
          ? <><span><i className="legend-dot level-1" />A little planned</span><span><i className="legend-dot level-3" />A full day</span><span><i className="legend-dot today" />Today</span></>
          : <><span><i className="legend-dot planned" />Planned</span><span><i className="legend-dot complete" />Complete</span><span><i className="legend-dot partial" />Partial</span><span><i className="legend-dot skipped" />Skipped</span></>}
      </div>
    </section>
    <div className="calendar-footnote"><Sparkles size={16} /><span>Nothing is locked in. Dragging activities to new times will be available as your plan grows.</span></div>
  </>
}

/* ---------- Insights: patterns from the plan and the history ---------- */
type InsightKind = 'working' | 'improve' | 'idea'
type Insight = { id: string; kind: InsightKind; title: string; body: string; stat?: string; sample?: boolean; action?: { label: string; routineId?: string; section?: Section } }

const insightKinds: Record<InsightKind, { label: string; tone: Tone; icon: LucideIcon }> = {
  working: { label: 'Working well', tone: 'sage', icon: TrendingUp },
  improve: { label: 'Could be easier', tone: 'butter', icon: Target },
  idea: { label: 'Try this', tone: 'beige', icon: Lightbulb },
}

function buildInsights({ habits, routines, records }: Workspace): Insight[] {
  const insights: Insight[] = []
  const habitName = (id: string) => habits.find((habit) => habit.id === id)?.name ?? 'A habit'
  const entries = Object.entries(records).map(([key, record]) => {
    const split = key.lastIndexOf(':')
    return { habitId: key.slice(split + 1), day: new Date(key.slice(0, split)).getDay(), record }
  })
  const count = (list: typeof entries, statuses: Status[]) => list.filter((entry) => statuses.includes(entry.record.status)).length

  /* From the history (only once there is enough of it) */
  if (entries.length >= 3) {
    const byHabit = new Map<string, typeof entries>()
    entries.forEach((entry) => byHabit.set(entry.habitId, [...(byHabit.get(entry.habitId) ?? []), entry]))
    const ranked = [...byHabit.entries()].map(([id, list]) => ({ id, done: count(list, ['complete']), missed: count(list, ['skipped', 'rescheduled']) }))
    const steadiest = [...ranked].sort((a, b) => b.done - a.done)[0]
    if (steadiest?.done >= 2) insights.push({ id: 'steadiest', kind: 'working', title: `${habitName(steadiest.id)} is your steadiest habit`, body: 'Whatever makes this one easy, its time, its size or its place in a routine, is worth borrowing for the others.', stat: `${steadiest.done} times done` })
    const slipping = [...ranked].sort((a, b) => b.missed - a.missed)[0]
    if (slipping?.missed >= 2) {
      const routine = routines.find((item) => item.habitIds.includes(slipping.id))
      insights.push({ id: 'slipping', kind: 'improve', title: `${habitName(slipping.id)} keeps getting moved`, body: 'Skipping it is not a failure, it is a signal. A smaller version or a different time might fit better.', stat: `${slipping.missed} times skipped or moved`, action: routine ? { label: `Adjust ${routine.name}`, routineId: routine.id } : { label: 'Edit habits', section: 'Habits' } })
    }
    const partial = count(entries, ['partial'])
    if (partial >= 2) insights.push({ id: 'partial', kind: 'working', title: 'Partial progress is adding up', body: 'On days you could not do it all, you still did something. That is how habits survive busy weeks.', stat: `${partial} partial days` })
    const doneByDay = dayLabels.map((_, index) => count(entries.filter((entry) => (entry.day + 6) % 7 === index), ['complete']))
    const bestDay = doneByDay.indexOf(Math.max(...doneByDay))
    if (doneByDay[bestDay] >= 2) insights.push({ id: 'best-day', kind: 'working', title: `${dayNames[bestDay]}s tend to go well`, body: 'Notice what is different about that day. A little of it could carry into the rest of the week.', stat: `${doneByDay[bestDay]} moments done` })
  } else {
    insights.push(
      { id: 'sample-friday', kind: 'working', sample: true, title: 'Fridays are your strongest day', body: 'You finished most of what you planned on Fridays. Shorter plans seem to help: Friday holds the fewest habits.', stat: '88% of planned moments' },
      { id: 'sample-weekend', kind: 'improve', sample: true, title: 'Weekends dip below the rest of the week', body: 'Your plan keeps weekday times on Saturday. A later start, or a weekend-only routine, could match how those days really go.', stat: '37% on Saturdays', action: { label: 'Look at your routines', section: 'Routines' } },
    )
  }

  /* From the plan itself (always real) */
  const active = routines.filter((routine) => !routine.paused)
  const routineHabits = (routine: Routine) => habits.filter((habit) => routine.habitIds.includes(habit.id))

  const weekly = (filter: (minutes: number) => boolean) => active.filter((routine) => filter(timeInMinutes(routine.time))).reduce((sum, routine) => sum + routine.duration * (routine.frequency === 'flexible' ? routine.timesPerWeek ?? 3 : routine.days.length), 0)
  const mornings = weekly((minutes) => minutes < 12 * 60)
  const evenings = weekly((minutes) => minutes >= 17 * 60)
  if (mornings && evenings && Math.abs(mornings - evenings) >= 20) {
    const heavier = evenings > mornings ? 'evenings' : 'mornings'
    const lighter = heavier === 'evenings' ? 'mornings' : 'evenings'
    const heavyRoutine = [...active].filter((routine) => heavier === 'evenings' ? timeInMinutes(routine.time) >= 17 * 60 : timeInMinutes(routine.time) < 12 * 60).sort((a, b) => b.duration - a.duration)[0]
    insights.push({ id: 'balance', kind: 'improve', title: `Your ${heavier} carry more than your ${lighter}`, body: `You plan ${formatDuration(Math.max(mornings, evenings))} a week in the ${heavier.slice(0, -1)} and ${formatDuration(Math.min(mornings, evenings))} in the ${lighter.slice(0, -1)}. Would moving one habit feel kinder?`, stat: `${formatDuration(Math.abs(mornings - evenings))} difference`, action: heavyRoutine ? { label: `Rebalance ${heavyRoutine.name}`, routineId: heavyRoutine.id } : undefined })
  }

  active.forEach((routine) => {
    const total = routineHabits(routine).reduce((sum, habit) => sum + habit.duration, 0)
    if (total > routine.duration + 5) insights.push({ id: `tight-${routine.id}`, kind: 'improve', title: `${routine.name} needs more time than it has`, body: `Its habits add up to ${formatDuration(total)}, but the routine allows ${formatDuration(routine.duration)}. Tight plans are the first to slip.`, stat: `${formatDuration(total - routine.duration)} short`, action: { label: 'Adjust the time', routineId: routine.id } })
  })

  const longest = [...active].sort((a, b) => b.duration - a.duration)[0]
  if (longest && (longest.duration >= 45 || longest.habitIds.length >= 4) && !longest.minimumHabitIds?.length) insights.push({ id: 'longest', kind: 'improve', title: `${longest.name} is your biggest routine`, body: 'Big routines are the hardest to start on a tired day. A minimum version gives you a smaller door in.', stat: `${formatDuration(longest.duration)} · ${longest.habitIds.length} habits`, action: { label: 'Add a minimum version', routineId: longest.id } })

  const perDay = dayLabels.map((day) => active.filter((routine) => routine.frequency !== 'flexible' && routine.days.includes(day)).length)
  const busiest = perDay.indexOf(Math.max(...perDay))
  const quietest = perDay.indexOf(Math.min(...perDay))
  if (perDay[busiest] - perDay[quietest] >= 2) insights.push({ id: 'busy-day', kind: 'improve', title: `${dayNames[busiest]} is your busiest day`, body: `It holds ${perDay[busiest]} routines while ${dayNames[quietest]} holds ${perDay[quietest] || 'none'}. Spreading one out could make both days feel lighter.`, stat: `${perDay[busiest]} vs ${perDay[quietest]} routines`, action: { label: 'See your week', section: 'Calendar' } })

  const withoutMinimum = active.filter((routine) => routine.habitIds.length > 1 && !routine.minimumHabitIds?.length)
  if (withoutMinimum.length && !insights.some((item) => item.id === 'longest' && item.action?.routineId === withoutMinimum[0].id)) insights.push({ id: 'minimum', kind: 'idea', title: `Give ${withoutMinimum[0].name} a minimum version`, body: 'Decide now what still counts on a low-energy day, so future you does not have to.', stat: withoutMinimum.length > 1 ? `${withoutMinimum.length} routines without one` : undefined, action: { label: 'Set it up', routineId: withoutMinimum[0].id } })

  const unanchored = active.find((routine) => !routine.anchor)
  if (unanchored) insights.push({ id: 'anchor', kind: 'idea', title: `Anchor ${unanchored.name} to a moment`, body: 'Routines tied to something you already do, like coffee or getting home, are easier to remember than a time on the clock.', action: { label: 'Add an anchor', routineId: unanchored.id } })

  const noReminder = active.filter((routine) => !routine.reminder?.enabled)
  if (noReminder.length) insights.push({ id: 'reminder', kind: 'idea', title: noReminder.length === active.length ? 'No reminders are on yet' : `${noReminder[0].name} has no reminder`, body: 'A quiet nudge a few minutes before can be the difference between remembering and realising at night.', stat: `${noReminder.length} of ${active.length} routines`, action: { label: 'Turn one on', routineId: noReminder[0].id } })

  const loose = habits.filter((habit) => !routines.some((routine) => routine.habitIds.includes(habit.id)))
  if (loose.length) insights.push({ id: 'loose', kind: 'idea', title: `${loose.length} ${loose.length === 1 ? 'habit lives' : 'habits live'} on their own`, body: 'Habits inside a routine get done more often, because one step leads to the next.', stat: loose.slice(0, 2).map((habit) => habit.name).join(', '), action: { label: 'Find them a home', section: 'Habits' } })

  const paused = routines.filter((routine) => routine.paused)
  if (paused.length) insights.push({ id: 'paused', kind: 'idea', title: `${paused[0].name} is on pause`, body: 'Pausing is allowed. When you are ready, resume it, make it smaller, or let it go without guilt.', action: { label: 'Review it', routineId: paused[0].id } })

  if (active.length && insights.filter((item) => item.kind === 'working').length === 0) insights.push({ id: 'planned', kind: 'working', title: 'You have a plan that fits on a page', body: `${active.length} ${active.length === 1 ? 'routine' : 'routines'} and ${habits.length} habits. Small enough to keep, big enough to matter.` })

  const order: InsightKind[] = ['working', 'improve', 'idea']
  return insights.sort((a, b) => order.indexOf(a.kind) - order.indexOf(b.kind))
}

function PatternSpotlight({ insights, onAct, onSeeAll }: { insights: Insight[]; onAct: (insight: Insight) => void; onSeeAll: () => void }) {
  const [index, setIndex] = useState(0)
  const current = insights[index % Math.max(insights.length, 1)]
  if (!current) return null
  const step = (direction: number) => setIndex((value) => (value + direction + insights.length) % insights.length)
  return <section className="panel reflection-panel" aria-roledescription="carousel" aria-label="Patterns in your plan">
    <div className="suggestion-top"><span className="reflection-icon"><Sparkles size={16} /></span><span className="eyebrow small-eyebrow">KEEP WHAT FITS</span></div>
    <div className="spotlight" key={current.id} aria-live="polite">
      <span className="spotlight-kind" data-kind={current.kind}>{insightKinds[current.kind].label}{current.sample && ' · sample'}</span>
      <p className="spotlight-title">{current.title}</p>
      <p className="spotlight-body">{current.body}</p>
      {current.action && <button className="text-button" onClick={() => onAct(current)}>{current.action.label} <ArrowRight size={15} /></button>}
    </div>
    <div className="spotlight-nav">
      <button className="spotlight-arrow" aria-label="Previous pattern" onClick={() => step(-1)}><ChevronLeft size={16} /></button>
      <span className="spotlight-count">{(index % insights.length) + 1} of {insights.length}</span>
      <button className="spotlight-arrow" aria-label="Next pattern" onClick={() => step(1)}><ChevronRight size={16} /></button>
      <button className="spotlight-all" onClick={onSeeAll}>See all patterns</button>
    </div>
  </section>
}

const dayNames = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']

function Insights({ workspace, onAct }: { workspace: Workspace; onAct: (insight: Insight) => void }) {
  const records = workspace.records
  const completed = Object.values(records).filter((record) => record.status === 'complete').length
  const partial = Object.values(records).filter((record) => record.status === 'partial').length
  const insights = buildInsights(workspace)
  const [filter, setFilter] = useState<InsightKind | 'all'>('all')
  const [expanded, setExpanded] = useState(false)
  const filtered = insights.filter((item) => filter === 'all' || item.kind === filter)
  const visible = expanded ? filtered : filtered.slice(0, 4)

  return <><PageIntro tone="sage" eyebrow="INSIGHTS" title={<>Look how far <em>you've come.</em></>} subtitle="A little reflection can help you make a plan that fits better." action={<button className="period-button">This week <ChevronDown size={15} /></button>} /><div className="insight-notice"><span className="sample-pill">SAMPLE PREVIEW</span><span>Preview metrics show sample patterns. Your real insights will take shape as you log activity.</span></div><div className="insight-metrics"><article className="metric-card"><span className="metric-label">THIS WEEK</span><div className="metric-value">68<span>%</span><span className="metric-trend"><ArrowUpRight size={15} /> 8%</span></div><span className="metric-caption">of planned moments, at your pace</span><div className="metric-sparkline"><span style={{ height: '28%' }} /><span style={{ height: '42%' }} /><span style={{ height: '38%' }} /><span style={{ height: '57%' }} /><span style={{ height: '49%' }} /><span style={{ height: '75%' }} /><span style={{ height: '64%' }} /></div></article><article className="metric-card metric-sage"><span className="metric-label">RECORDED SO FAR</span><div className="metric-value">{completed}<span> moments</span></div><span className="metric-caption">{partial} partial progress count, too</span><div className="metric-inline-progress"><span style={{ width: `${Math.min(completed * 20, 100)}%` }} /></div></article><article className="metric-card metric-highlight"><span className="metric-label">A DAY THAT FITS</span><div className="metric-value">Tuesday</div><span className="metric-caption">has been a gentle, steady rhythm</span><div className="metric-highlight-icon"><Sun size={23} /></div></article></div><div className="insights-lower"><section className="panel consistency-panel"><div className="panel-heading"><div><h2>Weekly consistency</h2></div><span className="sample-pill">SAMPLE</span></div><div className="consistency-chart">{[['Mon', 42], ['Tue', 78], ['Wed', 55], ['Thu', 68], ['Fri', 88], ['Sat', 37], ['Sun', 52]].map(([day, value]) => <div className="consistency-day" key={day}><span className="consistency-value">{value}%</span><span className="consistency-track"><i className={day === 'Fri' ? 'highlight-bar' : ''} style={{ height: `${value}%` }} /></span><span className="consistency-label">{day}</span></div>)}</div></section></div>

    <section className="panel patterns-panel" id="patterns">
      <div className="patterns-heading">
        <div><div className="eyebrow">PATTERNS</div><h2 className="patterns-title">What your patterns <em>say</em></h2><p>Read from your plan{Object.keys(records).length >= 3 ? ' and your history' : ''}. Nothing here is a grade.</p></div>
        <div className="pattern-filters" role="tablist" aria-label="Filter patterns">
          {(['all', 'working', 'improve', 'idea'] as const).map((kind) => {
            const total = kind === 'all' ? insights.length : insights.filter((item) => item.kind === kind).length
            return <button key={kind} role="tab" aria-selected={filter === kind} data-kind={kind} className={`pattern-filter ${filter === kind ? 'selected' : ''}`} onClick={() => { setFilter(kind); setExpanded(false) }}>{kind === 'all' ? 'All' : insightKinds[kind].label}<span>{total}</span></button>
          })}
        </div>
      </div>
      <ul className="pattern-list">{visible.map((insight) => {
        const meta = insightKinds[insight.kind]
        const Icon = meta.icon
        return <li className="pattern-row" data-tone={meta.tone} key={insight.id}>
          <span className="pattern-icon"><Icon size={17} /></span>
          <div className="pattern-copy">
            <div className="pattern-title-row"><strong>{insight.title}</strong>{insight.sample && <span className="sample-pill">SAMPLE</span>}</div>
            <p>{insight.body}</p>
            {insight.stat && <span className="pattern-stat">{insight.stat}</span>}
          </div>
          {insight.action && <button className="button button-quiet pattern-action" onClick={() => onAct(insight)}>{insight.action.label}<ArrowRight size={14} /></button>}
        </li>
      })}</ul>
      {filtered.length > 4 && <button className="pattern-more" onClick={() => setExpanded((value) => !value)}>{expanded ? 'Show fewer' : `Show ${filtered.length - 4} more`}<ChevronDown size={15} className={expanded ? 'is-flipped' : ''} /></button>}
    </section>
    <div className="insight-bottom-note"><Heart size={16} /><span>No streaks to protect here. Missing a day is information, not a setback.</span></div></>
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
  return <><PageIntro tone="butter" eyebrow="PROFILE" title={<>This space <em>is yours.</em></>} subtitle="A few details so KINDA feels like home." />
    <div className="profile-grid">
      <section className="panel profile-card"><div className="profile-avatar-large">{name.charAt(0).toUpperCase()}</div><div className="eyebrow small-eyebrow">HOW SHOULD WE GREET YOU?</div><form className="profile-form" onSubmit={submit}><label className="form-label">Your name<input name="name" defaultValue={name} maxLength={40} required /></label><button type="submit" className="button button-primary"><Check size={15} /> Save</button></form></section>
      <section className="panel profile-stats"><div className="panel-heading"><div><h2>Your space at a glance</h2></div></div><div className="stat-grid"><div className="stat-tile" data-tone="sage"><strong>{workspace.habits.length}</strong><span>habits</span></div><div className="stat-tile" data-tone="butter"><strong>{workspace.routines.length}</strong><span>routines</span></div><div className="stat-tile" data-tone="orange"><strong>{complete}</strong><span>moments done</span></div><div className="stat-tile" data-tone="beige"><strong>{partial}</strong><span>a little progress</span></div></div><div className="routine-habits-label">YOUR CATEGORIES</div><div className="category-cloud">{categoryCounts.map(({ item, count }) => <span className="category-chip" data-tone={toneFor(item)} key={item}>{item} · {count}</span>)}</div></section>
    </div>
  </>
}

function SettingsView({ recordCount, onClearHistory, onRestore }: { recordCount: number; onClearHistory: () => void; onRestore: () => void }) {
  const legend: { tone: Tone; label: string; detail: string }[] = [
    { tone: 'orange', label: 'Ember', detail: 'Focus: today, progress and where you are' },
    { tone: 'sage', label: 'Sage', detail: 'Done, and calm categories' },
    { tone: 'butter', label: 'Butter', detail: 'A little progress counts' },
    { tone: 'beige', label: 'Sand', detail: 'Everything else stays quiet' },
  ]
  return <><PageIntro tone="sage" eyebrow="SETTINGS" title={<>Shape KINDA <em>your way.</em></>} subtitle="Your plan lives on this device. Change what you need, keep what helps." />
    <div className="settings-grid">
      <section className="panel settings-panel"><div className="panel-heading"><div><h2>Saved on this device</h2></div></div>
        <div className="setting-row"><div><strong>Activity history</strong><span>{recordCount} recorded {recordCount === 1 ? 'moment' : 'moments'}. Habits and routines are kept.</span></div><button className="button button-quiet" onClick={onClearHistory}><Trash2 size={14} /> Clear history</button></div>
        <div className="setting-row"><div><strong>Sample plan</strong><span>Start over with the original habits and routines.</span></div><button className="button button-quiet" onClick={onRestore}><RotateCcw size={14} /> Restore</button></div>
      </section>
      <section className="panel settings-panel"><div className="panel-heading"><div><h2>What each colour means</h2></div></div><div className="legend-list">{legend.map(({ tone, label, detail }) => <div className="legend-row" data-tone={tone} key={tone}><span className="legend-swatch" /><strong>{label}</strong><span>{detail}</span></div>)}</div></section>
    </div>
  </>
}

function PageIntro({ eyebrow, title, subtitle, action, tone }: { eyebrow: string; title: React.ReactNode; subtitle: string; action?: React.ReactNode; tone: Tone }) {
  return <section className="page-intro" data-tone={tone}><div className="page-intro-copy"><div className="eyebrow">{eyebrow}</div><h1 className="banner-title">{title}</h1><p>{subtitle}</p>{action && <div className="page-intro-action">{action}</div>}</div></section>
}

/* ---------- Shared editor pieces ---------- */
function IconPicker({ value, auto, onChange }: { value?: string; auto: LucideIcon; onChange: (key: string | undefined) => void }) {
  const Auto = auto
  return <div className="icon-picker" role="radiogroup" aria-label="Icon">
    <button type="button" role="radio" aria-checked={!value} className={`icon-option auto-option ${!value ? 'selected' : ''}`} onClick={() => onChange(undefined)} title="Automatic: picked from the name"><Auto size={18} /><span>Auto</span></button>
    {Object.entries(iconLibrary).map(([key, Icon]) => <button type="button" role="radio" key={key} aria-checked={value === key} aria-label={key} title={key} className={`icon-option ${value === key ? 'selected' : ''}`} onClick={() => onChange(key)}><Icon size={18} /></button>)}
  </div>
}

function EditorFooter({ isNew, canSave, saveLabel, itemName, deleteDetail, onCancel, onDelete }: { isNew: boolean; canSave: boolean; saveLabel: string; itemName: string; deleteDetail: string; onCancel: () => void; onDelete: () => void }) {
  const [confirming, setConfirming] = useState(false)
  if (confirming) return <footer className="modal-actions editor-actions is-confirming" role="alert">
    <span className="confirm-copy"><strong>Delete “{itemName}”?</strong>{deleteDetail}</span>
    <div className="confirm-buttons">
      <button type="button" className="button button-quiet" onClick={() => setConfirming(false)} autoFocus>Keep it</button>
      <button type="button" className="button button-danger" onClick={onDelete}><Trash2 size={14} /> Delete</button>
    </div>
  </footer>
  return <footer className="modal-actions editor-actions">
    {!isNew && <button type="button" className="delete-link" onClick={() => setConfirming(true)}><Trash2 size={14} /> Delete</button>}
    <button type="button" className="button button-quiet" onClick={onCancel}>Cancel</button>
    <button type="submit" className="button button-primary" disabled={!canSave}><Check size={15} /> {saveLabel}</button>
  </footer>
}

function useEscape(onClose: () => void) {
  useEffect(() => {
    const onKey = (event: KeyboardEvent) => { if (event.key === 'Escape') onClose() }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose])
}

/* ---------- Habit editor ---------- */
const habitFrequencies = ['Every day', 'Weekdays', 'A few times a week', 'Once a week', 'Whenever it fits']

function HabitEditor({ habit, routines, onClose, onSave, onDelete }: { habit?: Habit; routines: Routine[]; onClose: () => void; onSave: (habit: Habit, routineId: string) => void; onDelete: (id: string) => void }) {
  const isNew = !habit
  const [name, setName] = useState(habit?.name ?? '')
  const [icon, setIcon] = useState(habit?.icon)
  const [category, setCategory] = useState(habit?.category ?? 'Lifestyle')
  const [duration, setDuration] = useState(String(habit?.duration ?? 10))
  const [time, setTime] = useState(habit && timeInMinutes(habit.time) >= 0 ? to24(habit.time) : '09:00')
  const [frequency, setFrequency] = useState(habit?.frequency ?? 'A few times a week')
  const [routineId, setRoutineId] = useState(routines.find((routine) => habit && routine.habitIds.includes(habit.id))?.id ?? '')
  const [tinyVersion, setTinyVersion] = useState(habit?.tinyVersion ?? '')
  const [notes, setNotes] = useState(habit?.notes ?? '')
  useEscape(onClose)

  const PreviewIcon = (icon && iconLibrary[icon]) || autoHabitIcon(name, category)
  const canSave = name.trim().length > 0
  const minutes = Math.max(1, Math.round(Number(duration) || 1))
  const routineName = routines.find((routine) => routine.id === routineId)?.name

  function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!canSave) return
    onSave({
      ...(habit ?? { id: `habit-${Date.now()}`, routine: 'Just for me' }),
      name: name.trim(), icon, category, duration: minutes, time: from24(time), frequency,
      tinyVersion: tinyVersion.trim() || undefined, notes: notes.trim() || undefined,
    }, routineId)
  }

  return <div className="modal-backdrop" onMouseDown={(event) => { if (event.target === event.currentTarget) onClose() }}>
    <section className="modal editor" role="dialog" aria-modal="true" aria-labelledby="habit-editor-title" data-tone={toneFor(category)}>
      <form onSubmit={submit} className="editor-form">
        <header className="editor-header">
          <div className="modal-top">
            <span className="modal-icon"><PreviewIcon size={19} /></span>
            <button type="button" className="icon-button" onClick={onClose} aria-label="Close dialog"><X size={19} /></button>
          </div>
          <div className="eyebrow small-eyebrow">{isNew ? 'A SMALL THING, FOR YOU' : 'EDIT HABIT'}</div>
          <h2 id="habit-editor-title">{name.trim() || 'Untitled habit'}</h2>
          <p className="editor-summary" aria-live="polite">{[frequency, from24(time), formatDuration(minutes), routineName ? `in ${routineName}` : 'on its own'].join(' · ')}</p>
        </header>

        <div className="editor-body">
          <fieldset className="editor-section">
            <legend>The basics</legend>
            <label className="form-label">Habit name<input autoFocus={isNew} value={name} onChange={(event) => setName(event.target.value)} required maxLength={54} placeholder="Step outside for a minute" /></label>
            <div className="form-label"><span>Icon</span><IconPicker value={icon} auto={autoHabitIcon(name, category)} onChange={setIcon} /></div>
            <div className="form-label"><span>Category</span>
              <div className="suggestion-chips" role="radiogroup" aria-label="Category">{categories.slice(1).map((item) => <button type="button" role="radio" aria-checked={category === item} key={item} data-tone={toneFor(item)} className={`suggestion-chip tone-chip ${category === item ? 'selected' : ''}`} onClick={() => setCategory(item)}><span className="tone-dot" />{item}</button>)}</div>
            </div>
          </fieldset>

          <fieldset className="editor-section">
            <legend>When</legend>
            <label className="form-label">How often<select value={frequency} onChange={(event) => setFrequency(event.target.value)}>{habitFrequencies.map((item) => <option key={item}>{item}</option>)}</select></label>
            <div className="form-row">
              <label className="form-label">Usual time<input type="time" value={time} onChange={(event) => setTime(event.target.value)} required /></label>
              <label className="form-label">Minutes<input type="number" min="1" max="240" value={duration} onChange={(event) => setDuration(event.target.value)} /></label>
            </div>
            <label className="form-label">Part of a routine<select value={routineId} onChange={(event) => setRoutineId(event.target.value)}><option value="">Not in a routine</option>{routines.map((routine) => <option key={routine.id} value={routine.id}>{routine.name}</option>)}</select></label>
          </fieldset>

          <fieldset className="editor-section minimum-section">
            <legend><Feather size={15} /> Tiny version</legend>
            <p className="section-help">The two-minute version for low days. Doing just this still counts.</p>
            <label className="form-label"><span className="visually-hidden">Tiny version</span><input value={tinyVersion} onChange={(event) => setTinyVersion(event.target.value)} maxLength={60} placeholder="Just put on my shoes" /></label>
          </fieldset>

          <fieldset className="editor-section">
            <legend>Notes</legend>
            <label className="form-label"><span className="visually-hidden">Notes</span><textarea value={notes} onChange={(event) => setNotes(event.target.value)} rows={3} maxLength={280} placeholder="Why this matters to you, or what helps it go well" /></label>
          </fieldset>
        </div>

        <EditorFooter isNew={isNew} canSave={canSave} saveLabel={isNew ? 'Create habit' : 'Save changes'} itemName={habit?.name ?? ''} deleteDetail="Its history goes with it. Routines that use it keep going without it." onCancel={onClose} onDelete={() => habit && onDelete(habit.id)} />
      </form>
    </section>
  </div>
}

function timeInMinutes(time: string) {
  const [clock, period] = time.split(' ')
  const [hours, minutes] = clock.split(':').map(Number)
  return (hours % 12 + (period === 'PM' ? 12 : 0)) * 60 + minutes
}

/* The schedule shows 8 two-hour slots, from 8 AM to midnight. */
const calendarSlots = ['8 AM', '10 AM', '12 PM', '2 PM', '4 PM', '6 PM', '8 PM', '10 PM']

function calendarRow(time: string) {
  const hour = Math.floor(timeInMinutes(time) / 60)
  return Math.max(1, Math.min(8, Math.floor((hour - 8) / 2) + 1))
}

export default App
