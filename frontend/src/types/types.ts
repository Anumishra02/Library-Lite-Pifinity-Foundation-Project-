export interface Book {
  id: number;
  title: string;
  author: string;
  tags: string[];
  status: string;
  due_date?: string;
  loaned_to_first_name?: string;
  loaned_to_last_name?: string;
  waitlist_count?: number;
  // OpenLibrary fields
  cover_id?: string;
  cover_url?: string;
  open_library_key?: string;
}

export interface Member {
  id: number;
  first_name: string;
  last_name: string;
  created_at?: string;
  active_loans?: Array<{
    loan_id: number;
    book_title: string;
    due_date: string;
  }>;
}

export interface OverdueReport {
  title: string;
  author: string;
  first_name: string;
  last_name: string;
  due_date: string;
  days_overdue: number;
}

export interface TopBook {
  title: string;
  author: string;
  checkout_count: number;
}