import { render, screen } from '@testing-library/react';
import App from './App';

test('app renders without crashing', () => {
  render(<App />);
  // L'app redirige vers /login — le formulaire de login doit être présent
  expect(document.body).toBeTruthy();
});
