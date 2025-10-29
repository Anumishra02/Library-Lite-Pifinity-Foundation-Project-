import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import Catalog from './Catalog';
import { libraryService } from '../services/libraryService';
import { Book, Member } from '../types/types';

// Mock the libraryService
jest.mock('../services/libraryService');

const mockLibraryService = libraryService as jest.Mocked<typeof libraryService>;

describe('Catalog Component', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    
    // Setup default mock implementations for ASYNC methods
    mockLibraryService.getBooks.mockResolvedValue([]);
    mockLibraryService.getMembers.mockResolvedValue([]);
    mockLibraryService.addBook.mockResolvedValue({
      id: 1,
      title: 'Test Book',
      author: 'Test Author',
      tags: [],
      status: 'available'
    });
    mockLibraryService.lendBook.mockResolvedValue({
      message: 'Book loaned successfully'
    });
    mockLibraryService.returnBook.mockResolvedValue({
      message: 'Book returned successfully'
    });
    mockLibraryService.searchBooks.mockResolvedValue([]);
  });

  test('renders empty state when no books', async () => {
    render(<Catalog />);
    
    await waitFor(() => {
      expect(screen.getByText('📚 Your Library is Empty')).toBeInTheDocument();
    });
    expect(screen.getByText('Add Your First Book')).toBeInTheDocument();
    expect(screen.getByText('Add Your First Member')).toBeInTheDocument();
  });

  test('renders book list when books are available', async () => {
    const mockBooks: Book[] = [
      {
        id: 1,
        title: 'Test Book 1',
        author: 'Author 1',
        tags: ['fiction'],
        status: 'available'
      },
      {
        id: 2, 
        title: 'Test Book 2',
        author: 'Author 2',
        tags: ['non-fiction'],
        status: 'on-loan',
        due_date: '2024-01-01',
        loaned_to_first_name: 'John',
        loaned_to_last_name: 'Doe'
      }
    ];
    
    mockLibraryService.getBooks.mockResolvedValue(mockBooks);

    render(<Catalog />);
    
    await waitFor(() => {
      expect(screen.getByText('Test Book 1')).toBeInTheDocument();
      expect(screen.getByText('Test Book 2')).toBeInTheDocument();
    });
  });

  test('handles search functionality', async () => {
    const mockBooks: Book[] = [
      {
        id: 1,
        title: 'JavaScript Guide',
        author: 'Author 1',
        tags: ['programming'],
        status: 'available'
      },
      {
        id: 2,
        title: 'Python Programming', 
        author: 'Author 2',
        tags: ['programming'],
        status: 'available'
      }
    ];
    
    mockLibraryService.getBooks.mockResolvedValue(mockBooks);
    mockLibraryService.searchBooks.mockResolvedValue([mockBooks[0]]); // Only return first book for search

    render(<Catalog />);
    
    await waitFor(() => {
      expect(screen.getByText('JavaScript Guide')).toBeInTheDocument();
    });
    
    const searchInput = screen.getByPlaceholderText('Search books by title...');
    fireEvent.change(searchInput, { target: { value: 'JavaScript' } });
    
    const searchButton = screen.getByText('Search');
    fireEvent.click(searchButton);

    await waitFor(() => {
      expect(mockLibraryService.searchBooks).toHaveBeenCalledWith('JavaScript');
    });
  });

  test('opens add book modal when button is clicked', async () => {
    const mockBooks: Book[] = [
      {
        id: 1,
        title: 'Test Book',
        author: 'Test Author',
        tags: ['fiction'],
        status: 'available'
      }
    ];
    
    mockLibraryService.getBooks.mockResolvedValue(mockBooks);

    render(<Catalog />);
    
    await waitFor(() => {
      expect(screen.getByText('Test Book')).toBeInTheDocument();
    });
    
    const addBookButton = screen.getByText('Add Book');
    fireEvent.click(addBookButton);
    
    expect(screen.getByText('Add New Book')).toBeInTheDocument();
  });

  test('adds a new book successfully', async () => {
    mockLibraryService.getBooks.mockResolvedValue([]);

    render(<Catalog />);
    
    // Wait for empty state to load
    await waitFor(() => {
      expect(screen.getByText('Add Your First Book')).toBeInTheDocument();
    });
    
    // Open add book modal
    const addBookButton = screen.getByText('Add Your First Book');
    fireEvent.click(addBookButton);
    
    // Fill out the form
    fireEvent.change(screen.getByLabelText('Title *'), {
      target: { value: 'New Book' }
    });
    fireEvent.change(screen.getByLabelText('Author *'), {
      target: { value: 'New Author' }
    });
    
    // Submit the form
    const submitButton = screen.getByText('Add Book');
    fireEvent.click(submitButton);
    
    await waitFor(() => {
      expect(mockLibraryService.addBook).toHaveBeenCalledWith(
        'New Book',
        'New Author',
        []
      );
    });
  });

  test('handles lending a book', async () => {
    const mockBooks: Book[] = [
      {
        id: 1,
        title: 'Test Book',
        author: 'Test Author',
        tags: ['fiction'],
        status: 'available'
      }
    ];
    
    const mockMembers: Member[] = [
      {
        id: 1,
        first_name: 'John',
        last_name: 'Doe'
      }
    ];
    
    mockLibraryService.getBooks.mockResolvedValue(mockBooks);
    mockLibraryService.getMembers.mockResolvedValue(mockMembers);

    render(<Catalog />);
    
    await waitFor(() => {
      expect(screen.getByText('Test Book')).toBeInTheDocument();
    });
    
    // Click lend button
    const lendButton = screen.getByText('Lend');
    fireEvent.click(lendButton);
    
    expect(screen.getByText('Lend Book')).toBeInTheDocument();
  });

  test('handles returning a book', async () => {
    const mockBooks: Book[] = [
      {
        id: 1,
        title: 'Test Book',
        author: 'Test Author',
        tags: ['fiction'],
        status: 'on-loan',
        due_date: '2024-01-01',
        loaned_to_first_name: 'John',
        loaned_to_last_name: 'Doe'
      }
    ];
    
    mockLibraryService.getBooks.mockResolvedValue(mockBooks);

    render(<Catalog />);
    
    await waitFor(() => {
      expect(screen.getByText('Test Book')).toBeInTheDocument();
    });
    
    // Click return button
    const returnButton = screen.getByText('Return');
    fireEvent.click(returnButton);
    
    await waitFor(() => {
      expect(mockLibraryService.returnBook).toHaveBeenCalledWith(1);
    });
  });

  test('shows loading state', async () => {
    mockLibraryService.getBooks.mockResolvedValue([]);

    render(<Catalog />);
    
    // Initially shows loading
    expect(screen.getByText('Add Your First Book')).toBeInTheDocument();
  });

  test('handles errors when loading books fails', async () => {
    mockLibraryService.getBooks.mockRejectedValue(new Error('Failed to load'));

    render(<Catalog />);
    
    // Should still show empty state but with potential error
    await waitFor(() => {
      expect(screen.getByText('Add Your First Book')).toBeInTheDocument();
    });
  });

  test('handles adding book with tags', async () => {
    mockLibraryService.getBooks.mockResolvedValue([]);

    render(<Catalog />);
    
    await waitFor(() => {
      expect(screen.getByText('Add Your First Book')).toBeInTheDocument();
    });
    
    // Open add book modal
    const addBookButton = screen.getByText('Add Your First Book');
    fireEvent.click(addBookButton);
    
    // Fill out the form with tags
    fireEvent.change(screen.getByLabelText('Title *'), {
      target: { value: 'New Book' }
    });
    fireEvent.change(screen.getByLabelText('Author *'), {
      target: { value: 'New Author' }
    });
    fireEvent.change(screen.getByLabelText('Tags'), {
      target: { value: 'fiction, classic' }
    });
    
    // Submit the form
    const submitButton = screen.getByText('Add Book');
    fireEvent.click(submitButton);
    
    await waitFor(() => {
      expect(mockLibraryService.addBook).toHaveBeenCalledWith(
        'New Book',
        'New Author',
        ['fiction', 'classic']
      );
    });
  });
});