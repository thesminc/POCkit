import {
  BrowserRouter as Router,
  Routes,
  Route,
  Link,
  useLocation,
} from "react-router-dom";
import { useTranslation } from "react-i18next";
import ProjectsPage from "./pages/ProjectsPage";
import ProjectDetailPage from "./pages/ProjectDetailPage";
import WorkflowDiagram from "./components/WorkflowDiagram";
import LanguageSwitcher from "./components/LanguageSwitcher";
import "./config/i18n"; // Initialize i18n

function App() {
  return (
    <Router>
      <div className="min-h-screen bg-protocol-darker">
        <Navigation />

        <main className="max-w-7xl mx-auto py-0 sm:px-6 lg:px-8">
          <Routes>
            <Route path="/" element={<HomePage />} />
            <Route path="/projects" element={<ProjectsPage />} />
            <Route
              path="/projects/:projectId"
              element={<ProjectDetailPage />}
            />
          </Routes>
        </main>
      </div>
    </Router>
  );
}

function Navigation() {
  const location = useLocation();
  const { t } = useTranslation();

  return (
    <nav className="sticky top-0 z-50 bg-protocol-dark border-b border-protocol-border">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-14">
          <div className="flex">
            <Link to="/" className="flex-shrink-0 flex items-center">
              <div className="w-8 h-8 bg-protocol-primary rounded-lg mr-3"></div>
              <h1 className="text-xl font-bold text-protocol-text-primary">
                {t('ui:header.title', 'POC Studio')}
              </h1>
            </Link>
            <div className="hidden sm:ml-6 sm:flex sm:space-x-8">
              <Link
                to="/projects"
                className={`inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium transition-colors ${
                  location.pathname.startsWith("/projects")
                    ? "border-protocol-primary text-protocol-text-primary"
                    : "border-transparent text-protocol-text-muted hover:text-protocol-text-secondary"
                }`}
              >
                {t('ui:header.projects', 'Projects')}
              </Link>
            </div>
          </div>
          <div className="flex items-center">
            <LanguageSwitcher />
          </div>
        </div>
      </div>
    </nav>
  );
}

function HomePage() {
  const { t } = useTranslation();

  return (
    <div className="px-3 py-1 sm:px-0">
      <div className="bg-protocol-card rounded-lg border border-protocol-border p-6 mt-6">
        {/* Header row: Welcome text (left) and Get Started button (right) */}
        <div className="flex items-center justify-between mb-6">
          <div className="text-left">
            <h2 className="text-3xl font-bold text-protocol-text-primary mb-2">
              {t('pages:home.title', 'Welcome to POC Studio')}
            </h2>
            <p className="text-lg text-protocol-text-secondary">
              {t('pages:home.subtitle', 'AI-First automation that replaces manual processes with intelligent agents.')}
            </p>
          </div>
          <div>
            <Link
              to="/projects"
              className="inline-block px-6 py-3 bg-protocol-primary text-white font-semibold rounded-lg hover:bg-protocol-primary-hover transition shadow-lg"
            >
              {t('pages:home.getStarted', 'Get Started')} →
            </Link>
          </div>
        </div>

        {/* Animated Workflow Diagram */}
        <div className="mt-6 mb-8">
          <WorkflowDiagram />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mt-12">
          <div>
            <h3 className="font-semibold text-lg text-protocol-text-primary mb-3">
              Core Principles
            </h3>
            <ul className="space-y-2 text-protocol-text-secondary">
              <li className="flex items-start">
                <span className="text-protocol-primary mr-2">🤖</span>
                <span>
                  <strong className="text-protocol-text-primary">
                    AI-First POC Design:
                  </strong>{" "}
                  Generates POC documents that propose AI-based solutions with
                  automated agents, code generation, and infrastructure
                  templates
                </span>
              </li>
              <li className="flex items-start">
                <span className="text-protocol-primary mr-2">✓</span>
                <span>
                  <strong className="text-protocol-text-primary">
                    Feasibility Validation:
                  </strong>{" "}
                  Every solution is validated for AI capability before
                  recommendation
                </span>
              </li>
              <li className="flex items-start">
                <span className="text-protocol-primary mr-2">✓</span>
                <span>
                  <strong className="text-protocol-text-primary">
                    Hybrid When Needed:
                  </strong>{" "}
                  AI-assisted workflows when pure automation isn't viable
                </span>
              </li>
              <li className="flex items-start">
                <span className="text-protocol-primary mr-2">✓</span>
                <span>
                  <strong className="text-protocol-text-primary">
                    Technology Agnostic:
                  </strong>{" "}
                  Works with any cloud, platform, or tech stack
                </span>
              </li>
              <li className="flex items-start">
                <span className="text-protocol-primary mr-2">✓</span>
                <span>
                  <strong className="text-protocol-text-primary">
                    Mandatory Citations:
                  </strong>{" "}
                  Every claim references source files with confidence scores
                </span>
              </li>
              <li className="flex items-start">
                <span className="text-protocol-primary mr-2">✓</span>
                <span>
                  <strong className="text-protocol-text-primary">
                    Anti-Hallucination:
                  </strong>{" "}
                  Strict validation thresholds prevent AI from inventing facts
                </span>
              </li>
            </ul>
          </div>

          <div>
            <h3 className="font-semibold text-lg text-protocol-text-primary mb-3">
              Detailed Steps
            </h3>
            <ol className="space-y-2 text-protocol-text-secondary text-sm">
              <li className="flex items-start">
                <span className="text-protocol-primary font-bold mr-2">1.</span>
                <span>Create a project and branch</span>
              </li>
              <li className="flex items-start">
                <span className="text-protocol-primary font-bold mr-2">2.</span>
                <span>Upload infrastructure documents and code</span>
              </li>
              <li className="flex items-start">
                <span className="text-protocol-primary font-bold mr-2">3.</span>
                <span>
                  Classify task type (analysis, testing, security, etc.)
                </span>
              </li>
              <li className="flex items-start">
                <span className="text-protocol-primary font-bold mr-2">4.</span>
                <span>Review AI-suggested Engineering IQ agents</span>
              </li>
              <li className="flex items-start">
                <span className="text-protocol-primary font-bold mr-2">5.</span>
                <span>
                  Answer configuration questions (repo, workflow, integrations)
                </span>
              </li>
              <li className="flex items-start">
                <span className="text-protocol-primary font-bold mr-2">6.</span>
                <span>Generate Business or Developer POC with citations</span>
              </li>
              <li className="flex items-start">
                <span className="text-protocol-primary font-bold mr-2">7.</span>
                <span>Export to Markdown or push to GitHub</span>
              </li>
            </ol>
          </div>
        </div>

        <div className="mt-12 p-6 bg-protocol-darker border border-protocol-primary/20 rounded-lg">
          <p className="text-sm text-protocol-text-secondary">
            <strong className="text-protocol-primary">
              🤖 Powered by Claude Sonnet 4
            </strong>{" "}
            - All analysis includes confidence levels (High ≥90%, Medium 70-89%,
            Low 50-69%) and mandatory source citations to prevent
            hallucinations.
          </p>
        </div>
      </div>
    </div>
  );
}

export default App;
