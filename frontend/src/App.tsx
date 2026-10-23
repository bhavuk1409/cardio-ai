import { BrowserRouter, Routes, Route, NavLink, useLocation } from 'react-router-dom';
import {
  Activity, BarChart3, Brain, BookOpen, Library, Info,
  Heart, AlertTriangle
} from 'lucide-react';
import Overview from './pages/Overview';
import RiskPrediction from './pages/RiskPrediction';
import ModelPerformance from './pages/ModelPerformance';
import Explainability from './pages/Explainability';
import MedicalAssistant from './pages/MedicalAssistant';
import KnowledgeSources from './pages/KnowledgeSources';
import About from './pages/About';

const navItems = [
  { to: '/', icon: Activity, label: 'Overview' },
  { to: '/predict', icon: Heart, label: 'Risk Prediction' },
  { to: '/performance', icon: BarChart3, label: 'Model Performance' },
  { to: '/explain', icon: Brain, label: 'Explainability' },
  { to: '/assistant', icon: BookOpen, label: 'Medical AI Assistant' },
  { to: '/sources', icon: Library, label: 'Knowledge Sources' },
  { to: '/about', icon: Info, label: 'About Project' },
];

function Sidebar() {
  return (
    <aside className="fixed left-0 top-0 h-screen w-60 bg-white border-r border-gray-200 flex flex-col z-20">
      {/* Logo */}
      <div className="p-5 border-b border-gray-100">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
            <Heart className="w-4 h-4 text-white" />
          </div>
          <div>
            <div className="text-sm font-semibold text-gray-900">CardioRisk AI</div>
            <div className="text-xs text-gray-400">CSET343 Project</div>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 py-4 space-y-0.5 overflow-y-auto">
        {navItems.map(({ to, icon: Icon, label }) => (
          <NavLink
            key={to}
            to={to}
            end={to === '/'}
            className={({ isActive }) =>
              `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-colors ${
                isActive
                  ? 'bg-blue-50 text-blue-700 font-medium'
                  : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
              }`
            }
          >
            <Icon className="w-4 h-4 flex-shrink-0" />
            {label}
          </NavLink>
        ))}
      </nav>

      {/* Footer disclaimer */}
      <div className="p-3 border-t border-gray-100">
        <div className="flex items-start gap-2 p-2.5 bg-amber-50 rounded-lg">
          <AlertTriangle className="w-3.5 h-3.5 text-amber-600 mt-0.5 flex-shrink-0" />
          <p className="text-xs text-amber-700 leading-relaxed">
            Educational prototype. Not a medical device. Consult a physician for health decisions.
          </p>
        </div>
      </div>
    </aside>
  );
}

function Layout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-gray-50">
      <Sidebar />
      <main className="ml-60 min-h-screen">
        <div className="max-w-6xl mx-auto px-8 py-8">
          {children}
        </div>
      </main>
    </div>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Layout><Overview /></Layout>} />
        <Route path="/predict" element={<Layout><RiskPrediction /></Layout>} />
        <Route path="/performance" element={<Layout><ModelPerformance /></Layout>} />
        <Route path="/explain" element={<Layout><Explainability /></Layout>} />
        <Route path="/assistant" element={<Layout><MedicalAssistant /></Layout>} />
        <Route path="/sources" element={<Layout><KnowledgeSources /></Layout>} />
        <Route path="/about" element={<Layout><About /></Layout>} />
      </Routes>
    </BrowserRouter>
  );
}
