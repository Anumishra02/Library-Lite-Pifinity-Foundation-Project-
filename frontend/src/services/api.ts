import axios from 'axios';
import { Book, Member, OverdueReport, TopBook } from '../types/types';

const API_BASE = 'http://localhost:5002/api';
const api = axios.create({
  baseURL: API_BASE,
  headers: {
    'Content-Type': 'application/json',
  },
});

export const booksApi = {
  getAll: (search?: string) => 
    api.get<Book[]>('/books', { params: { search } }),
  
  create: (book: { title: string; author: string; tags: string[] }) =>
    api.post<Book>('/books', book),
};

export const membersApi = {
  getAll: () => 
    api.get<Member[]>('/members'),
  
  create: (member: { firstName: string; lastName: string }) =>
    api.post<Member>('/members', member),
};

export const loansApi = {
  lend: (data: { bookId: number; memberId: number }) =>
    api.post<{ message: string; dueDate?: string }>('/loans', data),
  
  return: (bookId: number) =>
    api.post<{ message: string; notification?: string; dueDate?: string }>('/loans/return', { bookId }),
};

export const reportsApi = {
  getOverdue: () =>
    api.get<OverdueReport[]>('/reports/overdue'),
  
  getTopBooks: (limit: number = 5) =>
    api.get<TopBook[]>(`/reports/top-books?limit=${limit}`),
};

export const populateApi = {
  byGenre: (genre: string) =>
    api.post<{ message: string; books: Book[] }>('/populate', { genre }),
};

export default api;