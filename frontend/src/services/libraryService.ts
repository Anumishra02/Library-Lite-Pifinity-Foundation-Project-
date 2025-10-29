import { booksApi, membersApi, loansApi, reportsApi, populateApi } from './api';
import { Book, Member, OverdueReport, TopBook } from '../types/types';

class LibraryService {
  // Books
  async addBook(title: string, author: string, tags: string[] = []): Promise<Book> {
    const response = await booksApi.create({ title, author, tags });
    return response.data;
  }

  async getBooks(search?: string): Promise<Book[]> {
  try {
    console.log('🔍 Fetching books from:', 'http://localhost:5002/api/books');
    const response = await booksApi.getAll(search);
    console.log('✅ Books fetched successfully');
    return response.data;
  } catch (error: any) {
    console.error('❌ Error fetching books:', error.message);
    console.error('Full error:', error);
    throw error;
  }
}

  // Members
  async addMember(firstName: string, lastName: string): Promise<Member> {
    const response = await membersApi.create({ firstName, lastName });
    return response.data;
  }

  async getMembers(): Promise<Member[]> {
    const response = await membersApi.getAll();
    return response.data;
  }

  // Loans
  async lendBook(bookId: number, memberId: number): Promise<{ message: string; dueDate?: string }> {
    const response = await loansApi.lend({ bookId, memberId });
    return response.data;
  }

  async returnBook(bookId: number): Promise<{ message: string; notification?: string }> {
    const response = await loansApi.return(bookId);
    return response.data;
  }

  // Reports
  async getOverdueReport(): Promise<OverdueReport[]> {
    const response = await reportsApi.getOverdue();
    return response.data;
  }

  async getTopBooks(limit: number = 5): Promise<TopBook[]> {
    const response = await reportsApi.getTopBooks(limit);
    return response.data;
  }

  // Populate
  async populateLibrary(genre: string): Promise<{ message: string; books: Book[] }> {
    const response = await populateApi.byGenre(genre);
    return response.data;
  }

  // For backward compatibility - these will now be no-ops since we're using backend
  loadFromLocalStorage(): void {
    // No-op: data is now stored in backend
  }

  loadSampleData(): void {
    // No-op: sample data is now in database initialization
  }

  // Search functionality
  async searchBooks(query: string): Promise<Book[]> {
    const response = await booksApi.getAll(query);
    return response.data;
  }

  // Get current borrower info
  async getCurrentBorrower(bookId: number): Promise<{ member: Member | null; dueDate: string | null }> {
    try {
      const books = await this.getBooks();
      const book = books.find(b => b.id === bookId);
      
      if (book && book.status === 'on-loan' && book.loaned_to_first_name && book.loaned_to_last_name) {
        return {
          member: {
            id: 0, // We don't have the member ID here
            first_name: book.loaned_to_first_name,
            last_name: book.loaned_to_last_name
          },
          dueDate: book.due_date || null
        };
      }
      return { member: null, dueDate: null };
    } catch (error) {
      return { member: null, dueDate: null };
    }
  }
}

export const libraryService = new LibraryService();