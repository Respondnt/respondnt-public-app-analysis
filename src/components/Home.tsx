import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { loadComprehensiveAnalysisData } from '../utils/dataLoaders'

interface App {
    name: string
    displayName: string
    description: string
    tag: 'SaaS' | '1st Party'
}

const allApps: App[] = [
    {
        name: 'substation',
        displayName: 'Substation',
        description: '',
        tag: '1st Party',
    },
    {
        name: 'slack',
        displayName: 'Slack',
        description: 'Collaboration Platform',
        tag: 'SaaS',
    },
    {
        name: 'github',
        displayName: 'GitHub',
        description: 'Code Repository Platform',
        tag: 'SaaS',
    },
]

function Home(): JSX.Element {
    const [availableApps, setAvailableApps] = useState<App[]>([])
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        const checkAvailableApps = async (): Promise<void> => {
            const baseUrl = import.meta.env.BASE_URL
            const appsWithData: App[] = []

            for (const app of allApps) {
                // 1st Party apps should always show, regardless of comprehensiveData
                if (app.tag === '1st Party') {
                    appsWithData.push(app)
                } else {
                    // SaaS apps only show if they have comprehensiveData
                    const comprehensiveData = await loadComprehensiveAnalysisData(baseUrl, app.name)
                    if (comprehensiveData) {
                        appsWithData.push(app)
                    }
                }
            }

            setAvailableApps(appsWithData)
            setLoading(false)
        }

        checkAvailableApps()
    }, [])

    if (loading) {
        return (
            <div className="w-full h-full flex items-center justify-center">
                <div className="text-center">
                    <div className="text-body text-gray-600 dark:text-gray-400">Loading...</div>
                </div>
            </div>
        )
    }

    return (
        <div className="w-full h-full overflow-y-auto px-6 lg:px-8 py-8">
            <div className="max-w-7xl mx-auto">
                <div className="text-center mb-16">
                    <p className="text-body-lg text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
                        This website showcases the power of agentic security analysis tools. Our agents automatically break down complex applications into their component parts, then use an intelligent workflow to generate hypotheses and emulate adversary behavior to discover attack paths that could achieve security objectives. We think this is just the beginning, incorporating context, better engineering and more real world data is going to provide the fuel to re-write defensive operations. Reach out to <a href="mailto:wes@respondnt.io" className="text-accent-primary hover:underline">wes@respondnt.com</a> to learn more
                    </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 lg:gap-6 max-w-5xl mx-auto">
                    {availableApps.map((app) => (
                        <Link
                            key={app.name}
                            to={`/app/${app.name}`}
                            className="group relative bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl p-6 lg:p-8 overflow-hidden transition-all duration-300 hover:shadow-xl hover:shadow-accent-primary/10 hover:-translate-y-1 hover:border-accent-primary/30"
                        >
                            {/* Subtle gradient overlay on hover */}
                            <div className="absolute inset-0 bg-gradient-to-br from-accent-primary/0 to-accent-primary/0 group-hover:from-accent-primary/5 group-hover:to-transparent transition-all duration-300 pointer-events-none" />

                            {/* Content */}
                            <div className="relative z-10">
                                <div className="flex items-center gap-2 mb-3">
                                    <h3 className="text-xl lg:text-2xl font-semibold text-gray-900 dark:text-white group-hover:text-accent-primary transition-colors duration-300">
                                        {app.displayName}
                                    </h3>
                                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-md text-body-xs font-medium ${app.tag === '1st Party'
                                        ? 'bg-blue-50 dark:bg-blue-950/20 text-blue-700 dark:text-blue-300'
                                        : 'bg-green-50 dark:bg-green-950/20 text-green-700 dark:text-green-300'
                                        }`}>
                                        {app.tag}
                                    </span>
                                </div>

                                {/* Arrow indicator */}
                                <div className="mt-4 flex items-center text-accent-primary opacity-0 group-hover:opacity-100 transform translate-x-0 group-hover:translate-x-1 transition-all duration-300">
                                    <span className="text-sm font-medium">View Analysis</span>
                                    <svg
                                        className="w-4 h-4 ml-2"
                                        fill="none"
                                        stroke="currentColor"
                                        viewBox="0 0 24 24"
                                    >
                                        <path
                                            strokeLinecap="round"
                                            strokeLinejoin="round"
                                            strokeWidth={2}
                                            d="M9 5l7 7-7 7"
                                        />
                                    </svg>
                                </div>
                            </div>
                        </Link>
                    ))}
                </div>
            </div>
        </div>
    )
}

export default Home

