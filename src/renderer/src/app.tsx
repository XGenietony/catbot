import { useState } from 'react'
import { HashRouter, useLocation } from 'react-router-dom'
import Sidebar from './components/sidebar'
import { TitleBar } from './components/title-bar'
import Chat from './pages/chat'
import Skills from './pages/skills'
import Settings from './pages/settings'
import Workspace from './pages/workspace'
import Channels from './pages/channels'

function MainLayout(): React.JSX.Element {
  const location = useLocation()
  const [visitedRoutes, setVisitedRoutes] = useState<Set<string>>(new Set([location.pathname]))

  if (!visitedRoutes.has(location.pathname)) {
    setVisitedRoutes((prev) => new Set(prev).add(location.pathname))
  }

  const routes = [
    { path: '/', component: <Chat /> },
    { path: '/skills', component: <Skills /> },
    { path: '/workspace', component: <Workspace /> },
    { path: '/channels', component: <Channels /> },
    { path: '/settings', component: <Settings /> }
  ]

  return (
    <div className="flex flex-col h-screen bg-white dark:bg-gray-800 text-gray-900 dark:text-white">
      <TitleBar />
      <div className="flex flex-1 overflow-hidden">
        <Sidebar />
        <main className="flex-1 overflow-hidden relative bg-gray-100 dark:bg-gray-800 pb-2 pr-2">
          {routes.map((route) => {
            // Only render if visited at least once
            if (!visitedRoutes.has(route.path)) return null

            // Toggle visibility based on current path
            const isVisible = location.pathname === route.path

            return (
              <div
                key={route.path}
                style={{ display: isVisible ? 'block' : 'none' }}
                className="h-full w-full bg-white dark:bg-gray-900 rounded-lg overflow-hidden border-none"
              >
                {route.component}
              </div>
            )
          })}
        </main>
      </div>
    </div>
  )
}

function App(): React.JSX.Element {
  return (
    <HashRouter>
      <MainLayout />
    </HashRouter>
  )
}

export default App
