import { useState } from 'react';
import { MemoryRouter } from 'react-router-dom';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';

import { DonationPanel } from '../components/DonationPanel';
import { AdSlot } from '../components/AdSlot';
import { CopyResultButton } from '../components/CopyResultButton';
import { ErrorBoundary } from '../components/ErrorBoundary';
import { PreferencesProvider } from '../context/PreferencesContext';
import { HourlyIncomeCalculatorPage } from '../calculators/HourlyIncomeCalculatorPage';
import { LoanPaymentCalculatorPage } from '../calculators/LoanPaymentCalculatorPage';
import { HomePage } from '../pages/HomePage';
import { CalculatorDirectoryPage } from '../pages/CalculatorDirectoryPage';
import { AppLayout } from '../layout/AppLayout';
import { copyTextToClipboard } from '../utils/clipboard';
import { renderWithApp } from './renderWithApp';

vi.mock('../utils/clipboard', () => ({
  copyTextToClipboard: vi.fn(),
}));

function RecentHarness() {
  const [view, setView] = useState<'hourly' | 'loan' | 'home'>('hourly');

  return (
    <>
      <div>
        <button type="button" onClick={() => setView('hourly')}>Show hourly</button>
        <button type="button" onClick={() => setView('loan')}>Show loan</button>
        <button type="button" onClick={() => setView('home')}>Show home</button>
      </div>
      {view === 'hourly' ? <HourlyIncomeCalculatorPage /> : null}
      {view === 'loan' ? <LoanPaymentCalculatorPage /> : null}
      {view === 'home' ? <HomePage /> : null}
    </>
  );
}

describe('app behavior', () => {
  it('finds calculators by alias on the homepage', async () => {
    const user = userEvent.setup();
    renderWithApp(<HomePage />);

    await user.type(screen.getByLabelText('Search by name, category, keyword, or common term'), 'home loan');

    expect(screen.getByRole('heading', { name: 'Mortgage Calculator' })).toBeInTheDocument();
  });

  it('shows recommendations and reset when directory search has no exact matches', async () => {
    const user = userEvent.setup();
    renderWithApp(<CalculatorDirectoryPage />);

    await user.type(screen.getByLabelText('Search calculators'), 'zzzzzz impossible query');

    expect(screen.getByText('No exact matches')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Reset search' })).toBeInTheDocument();
  });

  it('highlights matching search text in calculator cards', async () => {
    const user = userEvent.setup();
    renderWithApp(<CalculatorDirectoryPage />);

    await user.type(screen.getByLabelText('Search calculators'), 'mortgage');

    expect(screen.getAllByText('Mortgage', { selector: 'mark' }).length).toBeGreaterThan(0);
  });

  it('adds and clears favorites in the directory', async () => {
    const user = userEvent.setup();
    renderWithApp(<CalculatorDirectoryPage />);

    const mortgageFavoriteButton = screen.getAllByRole('button', { name: /mortgage calculator/i })[0];
    await user.click(mortgageFavoriteButton);

    const favoritesSection = screen.getByRole('heading', { name: 'Favorites' }).closest('section');
    expect(favoritesSection).not.toBeNull();
    expect(screen.getAllByRole('heading', { name: 'Mortgage Calculator' }).length).toBeGreaterThan(0);

    await user.click(screen.getByRole('button', { name: 'Clear favorites' }));
    expect(screen.getByText('No favorites yet')).toBeInTheDocument();
  });

  it('keeps recently used calculators ordered and deduplicated', async () => {
    const user = userEvent.setup();
    render(
      <PreferencesProvider>
        <MemoryRouter>
          <RecentHarness />
        </MemoryRouter>
      </PreferencesProvider>,
    );

    await user.click(screen.getByRole('button', { name: 'Show loan' }));
    await user.click(screen.getByRole('button', { name: 'Show hourly' }));
    await user.click(screen.getByRole('button', { name: 'Show home' }));

    const recentSection = screen.getByRole('heading', { name: 'Recently used calculators' }).closest('section');
    expect(recentSection).not.toBeNull();

    const headings = Array.from(recentSection?.querySelectorAll('h2') ?? []).map((node) => node.textContent?.trim());
    expect(headings).toContain('Hourly-to-Annual Income Calculator');
    expect(headings).toContain('Loan Payment Calculator');
    expect(headings.filter((title) => title === 'Hourly-to-Annual Income Calculator')).toHaveLength(1);
  });

  it('falls back safely when stored preferences JSON is malformed', () => {
    window.localStorage.setItem('financial-calculator-preferences', '{bad json');

    renderWithApp(<HomePage />);

    expect(screen.getByRole('heading', { name: /plan with browser-based calculators/i })).toBeInTheDocument();
  });

  it('shows the storage-disabled footer note when localStorage is blocked', () => {
    renderWithApp(<AppLayout />, { blockedStorage: true });

    expect(screen.getByText(/could not be stored on this device/i)).toBeInTheDocument();
  });

  it('hides donation and ad placeholders when unconfigured', () => {
    const { container } = renderWithApp(
      <div>
        <DonationPanel />
        <AdSlot placement="results" />
      </div>,
    );

    expect(screen.queryByRole('heading', { name: 'Optional support' })).not.toBeInTheDocument();
    expect(container.querySelector('[data-placement]')).toBeNull();
  });

  it('shows the error boundary fallback without exposing a stack trace', () => {
    const Thrower = () => {
      throw new Error('boom');
    };

    const spy = vi.spyOn(console, 'error').mockImplementation(() => undefined);

    render(
      <MemoryRouter>
        <ErrorBoundary>
          <Thrower />
        </ErrorBoundary>
      </MemoryRouter>,
    );

    expect(screen.getByRole('heading', { name: 'Something went wrong' })).toBeInTheDocument();
    expect(screen.queryByText(/boom/)).not.toBeInTheDocument();
    spy.mockRestore();
  });

  it('shows success feedback after copying a result', async () => {
    vi.mocked(copyTextToClipboard).mockResolvedValue(true);
    const user = userEvent.setup();
    renderWithApp(<CopyResultButton getText={() => 'Monthly payment: $489.15'} />);

    await user.click(screen.getByRole('button', { name: 'Copy result' }));

    expect(copyTextToClipboard).toHaveBeenCalledWith('Monthly payment: $489.15');
    expect(screen.getByText('Result copied.')).toBeInTheDocument();
  });

  it('shows failure feedback when clipboard copy is rejected', async () => {
    vi.mocked(copyTextToClipboard).mockResolvedValue(false);
    const user = userEvent.setup();
    renderWithApp(<CopyResultButton getText={() => 'Monthly payment: $489.15'} />);

    await user.click(screen.getByRole('button', { name: 'Copy result' }));

    expect(screen.getByText('Copy failed on this device.')).toBeInTheDocument();
  });
});
