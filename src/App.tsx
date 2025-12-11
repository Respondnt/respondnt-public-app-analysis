import { BrowserRouter, Routes, Route, Link, useParams } from 'react-router-dom'
import ApplicationBreakdown from './components/ApplicationBreakdown'
import DiscoveryVectors from './components/DiscoveryVectors'
import Home from './components/Home'

function App(): JSX.Element {
    return (
        <BrowserRouter basename="/">
            <div className="min-h-screen bg-white dark:bg-gray-950 flex flex-col">
                <header className="flex-shrink-0 z-40 bg-white/80 dark:bg-gray-950/80 backdrop-blur-md border-b border-gray-200 dark:border-gray-800">
                    <nav className="w-full px-6 py-4 flex items-center justify-between">
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
                <main className="flex-1 min-h-0">
                    <Routes>
                        <Route path="/" element={<Home />} />
                        <Route path="/app/:appName" element={<AppView />} />
                        <Route path="/app/:appName/discovery/:techniqueName" element={<DiscoveryView />} />
                    </Routes>
                </main>
            </div>
        </BrowserRouter>
    )
}

function AppView(): JSX.Element {
    const { appName } = useParams<{ appName: string }>()
    return <ApplicationBreakdown appName={appName ?? ''} />
}

function DiscoveryView(): JSX.Element {
    const { appName, techniqueName } = useParams<{ appName: string; techniqueName: string }>()
    // Decode the technique name from URL encoding
    const decodedTechniqueName = techniqueName ? decodeURIComponent(techniqueName) : ''
    return <DiscoveryVectors appName={appName ?? ''} techniqueName={decodedTechniqueName} />
}

export default App


