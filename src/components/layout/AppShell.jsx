import TopBar from './TopBar'
import BottomNav from './BottomNav'

export default function AppShell({ title, showBack, actions, children }) {
  return (
    <div className="bg-gray-50 flex flex-col" style={{ height: '100dvh' }}>
      <TopBar title={title} showBack={showBack} actions={actions} />
      <main className="flex-1 min-h-0 overflow-y-auto pb-20">
        {children}
      </main>
      <BottomNav />
    </div>
  )
}
