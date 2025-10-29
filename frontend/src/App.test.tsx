import React from 'react';
import { render, screen } from '@testing-library/react';
import App from './App';

// Mock the library service
jest.mock('./services/libraryService');

test('renders library lite app', () => {
  render(<App />);
  
  // Check for the app name in the navbar
  const libraryName = screen.getByText(/Library Lite/i);
  expect(libraryName).toBeInTheDocument();
});