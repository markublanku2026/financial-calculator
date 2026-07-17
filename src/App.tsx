import { Route, Routes } from 'react-router-dom';

import { ErrorBoundary } from './components/ErrorBoundary';
import { PreferencesProvider } from './context/PreferencesContext';
import { calculatorDefinitions } from './data/calculators';
import { AppLayout } from './layout/AppLayout';
import { AboutPage } from './pages/AboutPage';
import { CalculatorDirectoryPage } from './pages/CalculatorDirectoryPage';
import { FinancialDisclaimerPage } from './pages/FinancialDisclaimerPage';
import { HomePage } from './pages/HomePage';
import { NotFoundPage } from './pages/NotFoundPage';
import { PrivacyPolicyPage } from './pages/PrivacyPolicyPage';
import { SupportPage } from './pages/SupportPage';
import { e2eTestRouteEnabled } from './utils/env';

function ErrorBoundaryTestPage(): null {
  throw new Error('Controlled test error');
}

export default function App() {
  return (
    <ErrorBoundary>
      <PreferencesProvider>
        <Routes>
          <Route element={<AppLayout />}>
            <Route index element={<HomePage />} />
            <Route path="/calculators" element={<CalculatorDirectoryPage />} />
            {calculatorDefinitions.map((calculator) => {
              const Component = calculator.component;
              return <Route element={<Component />} key={calculator.slug} path={calculator.route} />;
            })}
            <Route path="/about" element={<AboutPage />} />
            <Route path="/privacy-policy" element={<PrivacyPolicyPage />} />
            <Route path="/financial-disclaimer" element={<FinancialDisclaimerPage />} />
            <Route path="/support" element={<SupportPage />} />
            {e2eTestRouteEnabled ? <Route path="/__test/error-boundary" element={<ErrorBoundaryTestPage />} /> : null}
            <Route path="*" element={<NotFoundPage />} />
          </Route>
        </Routes>
      </PreferencesProvider>
    </ErrorBoundary>
  );
}
