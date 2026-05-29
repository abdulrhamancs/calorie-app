import { render, screen } from '@testing-library/react';
import App from './App';

test('renders the onboarding flow', () => {
  render(<App />);
  expect(screen.getByText(/build your target/i)).toBeInTheDocument();
});
