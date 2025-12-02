import { BrowserRouter, Routes, Route, Link, useParams } from 'react-router-dom'
import ApplicationBreakdown from './components/ApplicationBreakdown'
import Home from './components/Home'

function App() {
  return (
    <BrowserRouter basename="/">
      <div className="min-h-screen bg-white dark:bg-gray-950">
        <header className="fixed top-0 left-0 right-0 z-40 bg-white/80 dark:bg-gray-950/80 backdrop-blur-md border-b border-gray-200 dark:border-gray-800">
          <nav className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
            <Link to="/" className="flex items-center gap-3 text-h4 font-semibold text-gray-900 dark:text-white hover:text-accent-primary transition-colors">
              <img src="/logo.png" alt="Respondnt Logo" className="h-8 w-8 object-contain" />
              Respondnt
            </Link>
            <div className="flex items-center gap-4">
              <button
                onClick={() => {
                  document.documentElement.classList.toggle('dark')
                }}
                className="px-4 py-2 rounded-lg text-body-sm font-medium bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700 transition-all"
              >
                Toggle Dark Mode
              </button>
            </div>
          </nav>
        </header>
        <main className="pt-20">
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/app/:appName" element={<AppView />} />
          </Routes>
        </main>
      </div>
    </BrowserRouter>
  )
}

function AppView() {
  const { appName } = useParams()
  return <ApplicationBreakdown appName={appName} />
}

export default App

