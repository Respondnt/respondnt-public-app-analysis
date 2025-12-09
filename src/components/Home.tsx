import { Link } from 'react-router-dom'

interface App {
    name: string
    displayName: string
    description: string
}

const apps: App[] = [
    {
        name: '1password',
        displayName: '1Password',
        description: 'Password Manager, Extended Access Management, and Trelica by 1Password',
    },
    {
        name: 'slack',
        displayName: 'Slack',
        description: 'Collaboration Platform',
    },
    {
        name: 'miro',
        displayName: 'Miro',
        description: 'AI Innovation Workspace / Online Visual Collaboration Platform',
    },
    {
        name: 'box',
        displayName: 'Box',
        description: 'Content Collaboration Platform',
    },
    {
        name: 'klaviyo',
        displayName: 'Klaviyo',
        description: 'Email Marketing Platform',
    },
]

function Home(): JSX.Element {
    return (
        <div className="w-full h-full overflow-y-auto px-6 lg:px-8 py-8">
            <div className="max-w-7xl mx-auto">
                <div className="text-center mb-16">
                    <p className="text-body-lg text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
                        This website showcases the power of agentic security analysis tools. Our agents automatically break down complex applications into their component parts, then use an intelligent workflow to generate hypotheses and emulate adversary behavior to discover attack paths that could achieve security objectives. We think this is just the beginning, incorporating context, better engineering and more real world data is going to provide the fuel to re-write defensive operations. Reach out to <a href="mailto:wes@respondnt.io" className="text-accent-primary hover:underline">wes@respondnt.com</a> to learn more
                    </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 lg:gap-6 max-w-5xl mx-auto">
                    {apps.map((app) => (
                        <Link
                            key={app.name}
                            to={`/app/${app.name}`}
                            className="group relative bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl p-6 lg:p-8 overflow-hidden transition-all duration-300 hover:shadow-xl hover:shadow-accent-primary/10 hover:-translate-y-1 hover:border-accent-primary/30"
                        >
                            {/* Subtle gradient overlay on hover */}
                            <div className="absolute inset-0 bg-gradient-to-br from-accent-primary/0 to-accent-primary/0 group-hover:from-accent-primary/5 group-hover:to-transparent transition-all duration-300 pointer-events-none" />

                            {/* Content */}
                            <div className="relative z-10">
                                <h3 className="text-xl lg:text-2xl font-semibold text-gray-900 dark:text-white mb-3 group-hover:text-accent-primary transition-colors duration-300">
                                    {app.displayName}
                                </h3>

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

