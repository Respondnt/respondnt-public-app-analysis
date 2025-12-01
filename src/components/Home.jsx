import { Link } from 'react-router-dom'

const apps = [
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
]

function Home() {
  return (
    <div className="max-w-7xl mx-auto px-6 lg:px-8 py-16 lg:py-24">
      <div className="text-center mb-16">
        <h1 className="text-display-lg font-bold text-gray-900 dark:text-white mb-6">
          Application Breakdowns
        </h1>
        <p className="text-body-lg text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
          Comprehensive analysis of application capabilities, technical components, and security behaviors
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8">
        {apps.map((app) => (
          <Link
            key={app.name}
            to={`/app/${app.name}`}
            className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl shadow-sm overflow-hidden transition-all duration-200 hover:shadow-md hover:border-accent-primary/20 group"
          >
            <div className="p-6">
              <h3 className="text-h4 font-semibold text-gray-900 dark:text-white mb-2 group-hover:text-accent-primary transition-colors">
                {app.displayName}
              </h3>
              <p className="text-body-sm text-gray-600 dark:text-gray-400">
                {app.description}
              </p>
            </div>
          </Link>
        ))}
      </div>
    </div>
  )
}

export default Home

