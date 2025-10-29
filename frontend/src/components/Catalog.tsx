import React, { useState, useEffect } from 'react';
import { Row, Col, Form, Button, Table, Modal, Alert, Badge } from 'react-bootstrap';
import { libraryService } from '../services/libraryService';
import { Book, Member } from '../types/types';

const Catalog: React.FC = () => {
  const [books, setBooks] = useState<Book[]>([]);
  const [members, setMembers] = useState<Member[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [showAddBook, setShowAddBook] = useState(false);
  const [showAddMember, setShowAddMember] = useState(false);
  const [showLendBook, setShowLendBook] = useState(false);
  const [selectedBook, setSelectedBook] = useState<Book | null>(null);
  const [selectedMember, setSelectedMember] = useState<string>('');
  const [alert, setAlert] = useState<{ type: 'success' | 'danger' | 'info'; message: string } | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const [newBook, setNewBook] = useState({ title: '', author: '', tags: '' });
  const [newMember, setNewMember] = useState({ firstName: '', lastName: '' });
  const [showWaitlist, setShowWaitlist] = useState(false);
  const [currentBookWaitlist, setCurrentBookWaitlist] = useState<any[]>([]);
  const [showPopulateLibrary, setShowPopulateLibrary] = useState(false);
  const [genre, setGenre] = useState('');
  const [populateResults, setPopulateResults] = useState<Book[] | null>(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setIsLoading(true);
    try {
      const [booksData, membersData] = await Promise.all([
        libraryService.getBooks(),
        libraryService.getMembers(),
      ]);
      setBooks(booksData);
      setMembers(membersData);
    } catch (error: any) {
      console.error('Error loading data:', error);
      if (error.code === 'ERR_NETWORK') {
        setAlert({
          type: 'danger',
          message: 'Cannot connect to backend server. Please make sure the backend is running on port 5002.',
        });
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleShowWaitlist = async (bookId: number) => {
    try {
      const response = await fetch(`http://localhost:5002/api/books/${bookId}/waitlist`);
      const waitlistData = await response.json();
      setCurrentBookWaitlist(waitlistData);
      setShowWaitlist(true);
    } catch (error) {
      console.error('Error fetching waitlist:', error);
      setAlert({ type: 'danger', message: 'Failed to load waitlist' });
    }
  };

  const handleAddBook = async () => {
    if (!newBook.title.trim() || !newBook.author.trim()) {
      setAlert({ type: 'danger', message: 'Title and author are required' });
      return;
    }

    try {
      const tags = newBook.tags.split(',').map(tag => tag.trim()).filter(tag => tag);
      await libraryService.addBook(newBook.title, newBook.author, tags);
      setNewBook({ title: '', author: '', tags: '' });
      setShowAddBook(false);
      setAlert({ type: 'success', message: 'Book added successfully!' });
      loadData();
    } catch (error: any) {
      setAlert({
        type: 'danger',
        message: error.response?.data?.error || 'Failed to add book',
      });
    }
  };

  const handleAddMember = async () => {
    try {
      await libraryService.addMember(newMember.firstName, newMember.lastName);
      setNewMember({ firstName: '', lastName: '' });
      setShowAddMember(false);
      setAlert({ type: 'success', message: 'Member added successfully!' });
      loadData();
    } catch (error: any) {
      setAlert({ type: 'danger', message: error.response?.data?.error || 'Failed to add member' });
    }
  };

  const handleLendBook = async () => {
    if (selectedBook && selectedMember) {
      try {
        const result = await libraryService.lendBook(selectedBook.id, parseInt(selectedMember));
        if (result.message.includes('waitlist')) {
          setAlert({ type: 'info', message: result.message });
        } else {
          setAlert({ type: 'success', message: result.message });
        }
        setShowLendBook(false);
        setSelectedBook(null);
        setSelectedMember('');
        loadData();
      } catch (error: any) {
        if (error.response?.data?.error?.includes('waitlist')) {
          setAlert({ type: 'info', message: error.response.data.error });
        } else {
          setAlert({ type: 'danger', message: error.response?.data?.error || 'Failed to lend book' });
        }
      }
    }
  };

  const handlePopulateLibrary = async () => {
    if (!genre.trim()) {
      setAlert({ type: 'danger', message: 'Please enter a genre' });
      return;
    }

    try {
      setIsLoading(true);
      const result = await libraryService.populateLibrary(genre);
      setShowPopulateLibrary(false);
      setGenre('');
      setPopulateResults(result.books || []);
      setAlert({
        type: 'success',
        message: result.message || `Added books for genre: ${genre}`,
      });
      loadData();
    } catch (error: any) {
      setAlert({
        type: 'danger',
        message: error.response?.data?.error || 'Failed to populate library',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleReturnBook = async (bookId: number, bookTitle: string) => {
    try {
      const result = await libraryService.returnBook(bookId);
      setAlert({
        type: 'success',
        message: result.message + (result.notification ? ` ${result.notification}` : ''),
      });
      loadData();
    } catch (error: any) {
      setAlert({ type: 'danger', message: error.response?.data?.error || 'Failed to return book' });
    }
  };

  const handleAddToWaitlist = async (bookId: number) => {
    if (!selectedMember) {
      setAlert({ type: 'danger', message: 'Please select a member first' });
      return;
    }

    try {
      const result = await libraryService.lendBook(bookId, parseInt(selectedMember));
      setAlert({ type: 'info', message: result.message });
      loadData();
    } catch (error: any) {
      setAlert({ type: 'danger', message: error.response?.data?.error || 'Failed to join waitlist' });
    }
  };

  // Clear populate results when modal closed or user navigates away
  useEffect(() => {
    if (!showPopulateLibrary) setPopulateResults(null);
  }, [showPopulateLibrary]);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim()) {
      loadData();
      return;
    }

    setIsLoading(true);
    try {
      const booksData = await libraryService.searchBooks(searchQuery);
      setBooks(booksData);
    } catch (error) {
      console.error('Error searching books:', error);
      setAlert({ type: 'danger', message: 'Failed to search books' });
    } finally {
      setIsLoading(false);
    }
  };

  const filteredBooks = searchQuery
    ? books.filter(book => book.title.toLowerCase().includes(searchQuery.toLowerCase()))
    : books;

  // Show empty state if no books
  if (!isLoading && books.length === 0) {
    return (
      <div className="text-center py-5">
        <div className="mb-4">
          <h2>📚 Your Library is Empty</h2>
          <p className="text-muted">Get started by adding your first book or member.</p>
        </div>
        
        {alert && (
          <Alert variant={alert.type} onClose={() => setAlert(null)} dismissible className="mx-auto" style={{maxWidth: '500px'}}>
            {alert.message}
          </Alert>
        )}

        <div className="d-flex justify-content-center gap-3 mb-4">
          <Button variant="primary" onClick={() => setShowAddBook(true)} size="lg">
            Add Your First Book
          </Button>
          <Button variant="secondary" onClick={() => setShowAddMember(true)} size="lg">
            Add Your First Member
          </Button>
          <Button variant="info" onClick={() => setShowPopulateLibrary(true)} size="lg">
            📚 Load Sample Data
          </Button>
        </div>

        {/* Add Book Modal */}
        <Modal show={showAddBook} onHide={() => setShowAddBook(false)}>
          <Modal.Header closeButton>
            <Modal.Title>Add New Book</Modal.Title>
          </Modal.Header>
          <Modal.Body>
            <Form>
              <Form.Group className="mb-3">
                <Form.Label>Title *</Form.Label>
                <Form.Control
                  type="text"
                  value={newBook.title}
                  onChange={(e) => setNewBook({ ...newBook, title: e.target.value })}
                  placeholder="Enter book title"
                  required
                />
              </Form.Group>
              <Form.Group className="mb-3">
                <Form.Label>Author *</Form.Label>
                <Form.Control
                  type="text"
                  value={newBook.author}
                  onChange={(e) => setNewBook({ ...newBook, author: e.target.value })}
                  placeholder="Enter author name"
                  required
                />
              </Form.Group>
              <Form.Group className="mb-3">
                <Form.Label>Tags (comma separated)</Form.Label>
                <Form.Control
                  type="text"
                  value={newBook.tags}
                  onChange={(e) => setNewBook({ ...newBook, tags: e.target.value })}
                  placeholder="fiction, sci-fi, classic"
                />
              </Form.Group>
            </Form>
          </Modal.Body>
          <Modal.Footer>
            <Button variant="secondary" onClick={() => setShowAddBook(false)}>
              Cancel
            </Button>
            <Button 
              variant="primary" 
              onClick={handleAddBook}
              disabled={!newBook.title.trim() || !newBook.author.trim()}
            >
              Add Book
            </Button>
          </Modal.Footer>
        </Modal>

        {/* Add Member Modal */}
        <Modal show={showAddMember} onHide={() => setShowAddMember(false)}>
          <Modal.Header closeButton>
            <Modal.Title>Add New Member</Modal.Title>
          </Modal.Header>
          <Modal.Body>
            <Form>
              <Form.Group className="mb-3">
                <Form.Label>First Name *</Form.Label>
                <Form.Control
                  type="text"
                  value={newMember.firstName}
                  onChange={(e) => setNewMember({ ...newMember, firstName: e.target.value })}
                  placeholder="Enter first name"
                  required
                />
              </Form.Group>
              <Form.Group className="mb-3">
                <Form.Label>Last Name *</Form.Label>
                <Form.Control
                  type="text"
                  value={newMember.lastName}
                  onChange={(e) => setNewMember({ ...newMember, lastName: e.target.value })}
                  placeholder="Enter last name"
                  required
                />
              </Form.Group>
            </Form>
          </Modal.Body>
          <Modal.Footer>
            <Button variant="secondary" onClick={() => setShowAddMember(false)}>
              Cancel
            </Button>
            <Button 
              variant="primary" 
              onClick={handleAddMember}
              disabled={!newMember.firstName.trim() || !newMember.lastName.trim()}
            >
              Add Member
            </Button>
          </Modal.Footer>
        </Modal>

        {/* Populate Library Modal */}
        <Modal show={showPopulateLibrary} onHide={() => setShowPopulateLibrary(false)}>
          <Modal.Header closeButton>
            <Modal.Title>📚 Populate Library</Modal.Title>
          </Modal.Header>
          <Modal.Body>
            <Form>
              <Form.Group className="mb-3">
                <Form.Label>Genre *</Form.Label>
                <Form.Control
                  type="text"
                  value={genre}
                  onChange={(e) => setGenre(e.target.value)}
                  placeholder="Enter genre (e.g., fiction, science, romance)"
                  required
                />
                <Form.Text className="text-muted">
                  This will fetch popular books from this genre using Open Library API
                </Form.Text>
              </Form.Group>
            </Form>
          </Modal.Body>
          <Modal.Footer>
            <Button variant="secondary" onClick={() => setShowPopulateLibrary(false)}>
              Cancel
            </Button>
            <Button 
              variant="primary" 
              onClick={handlePopulateLibrary}
              disabled={!genre.trim() || isLoading}
            >
              {isLoading ? 'Populating...' : 'Populate Library'}
            </Button>
          </Modal.Footer>
        </Modal>
      </div>
    );
  }

  return (
    <div>
      {alert && (
        <Alert variant={alert.type} onClose={() => setAlert(null)} dismissible>
          {alert.message}
        </Alert>
      )}

      {populateResults && (
        <Alert variant="info" className="my-3" onClose={() => setPopulateResults(null)} dismissible>
          <div className="d-flex align-items-center mb-2">
            <strong className="me-2">📚 Populate results — added books:</strong>
          </div>
          <Row xs={1} md={2} lg={3} className="g-4">
            {populateResults.map((b) => (
              <Col key={b.id || b.title}>
                <div className="d-flex align-items-start p-2 border rounded">
                  {b.cover_url && (
                    <img 
                      src={b.cover_url} 
                      alt={`Cover of ${b.title}`}
                      style={{ width: '60px', marginRight: '10px' }}
                      className="img-fluid"
                    />
                  )}
                  <div>
                    <div><strong>{b.title}</strong></div>
                    <div className="text-muted">by {b.author}</div>
                    {b.tags && b.tags.length > 0 && (
                      <div className="mt-1">
                        {b.tags.slice(0, 3).map(tag => (
                          <Badge key={tag} bg="secondary" className="me-1">{tag}</Badge>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </Col>
            ))}
          </Row>
        </Alert>
      )}

      <Row className="mb-4">
        <Col>
          <h2>Book Catalog</h2>
        </Col>
        <Col xs="auto">
          <Button variant="info" onClick={() => setShowPopulateLibrary(true)} className="me-2">
            📚 Populate Library
          </Button>
          <Button variant="primary" onClick={() => setShowAddBook(true)} className="me-2">
            Add Book
          </Button>
          <Button variant="secondary" onClick={() => setShowAddMember(true)}>
            Add Member
          </Button>
        </Col>
      </Row>

      <Form className="mb-4" onSubmit={handleSearch}>
        <Form.Control
          type="text"
          placeholder="Search books by title..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
      </Form>

      {isLoading ? (
        <div className="text-center py-4">
          <div className="spinner-border" role="status">
            <span className="visually-hidden">Loading...</span>
          </div>
        </div>
      ) : (
        <Table striped bordered hover responsive>
          <thead className="table-dark">
            <tr>
              <th>ID</th>
              <th>Title</th>
              <th>Author</th>
              <th>Tags</th>
              <th>Status</th>
              <th>Due Date</th>
              <th>Loaned To</th>
              <th>Waitlist</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredBooks.map((book) => {
              const isOverdue = book.due_date && new Date(book.due_date) < new Date();

              return (
                <tr key={book.id}>
                  <td>{book.id}</td>
                  <td>{book.title}</td>
                  <td>{book.author}</td>
                  <td>{book.tags?.join(', ') || '-'}</td>
                  <td>
                    <Badge bg={book.status === 'available' ? 'success' : 'warning'}>
                      {book.status || 'available'}
                    </Badge>
                  </td>
                  <td>
                    {book.due_date ? new Date(book.due_date).toLocaleDateString() : '-'}
                    {isOverdue && <Badge bg="danger" className="ms-1">Overdue</Badge>}
                  </td>
                  <td>
                    {book.loaned_to_first_name && book.loaned_to_last_name
                      ? `${book.loaned_to_first_name} ${book.loaned_to_last_name}`
                      : '-'}
                  </td>
                  <td>
                    {(book.waitlist_count ?? 0) > 0 && (
                      <Button
                        variant="outline-info"
                        size="sm"
                        onClick={() => handleShowWaitlist(book.id)}
                      >
                        View Waitlist ({book.waitlist_count})
                      </Button>
                    )}
                  </td>
                  <td>
                    {book.status === 'available' && (
                      <Button
                        variant="outline-primary"
                        size="sm"
                        onClick={() => {
                          setSelectedBook(book);
                          setShowLendBook(true);
                        }}
                      >
                        Lend
                      </Button>
                    )}

                    {book.status === 'on-loan' && (
                      <>
                        <Button
                          variant="outline-success"
                          size="sm"
                          className="me-2"
                          onClick={() => handleReturnBook(book.id, book.title)}
                        >
                          Return
                        </Button>
                        <Button
                          variant="outline-warning"
                          size="sm"
                          onClick={() => {
                            setSelectedBook(book);
                            setShowLendBook(true);
                          }}
                        >
                          Join Waitlist
                        </Button>
                      </>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </Table>
      )}

      {/* Add Book Modal */}
      <Modal show={showAddBook} onHide={() => setShowAddBook(false)}>
        <Modal.Header closeButton>
          <Modal.Title>Add New Book</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form>
            <Form.Group className="mb-3">
              <Form.Label>Title *</Form.Label>
              <Form.Control
                type="text"
                value={newBook.title}
                onChange={(e) => setNewBook({ ...newBook, title: e.target.value })}
                placeholder="Enter book title"
                required
              />
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label>Author *</Form.Label>
              <Form.Control
                type="text"
                value={newBook.author}
                onChange={(e) => setNewBook({ ...newBook, author: e.target.value })}
                placeholder="Enter author name"
                required
              />
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label>Tags (comma separated)</Form.Label>
              <Form.Control
                type="text"
                value={newBook.tags}
                onChange={(e) => setNewBook({ ...newBook, tags: e.target.value })}
                placeholder="fiction, sci-fi, classic"
              />
            </Form.Group>
          </Form>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowAddBook(false)}>
            Cancel
          </Button>
          <Button 
            variant="primary" 
            onClick={handleAddBook}
            disabled={!newBook.title.trim() || !newBook.author.trim()}
          >
            Add Book
          </Button>
        </Modal.Footer>
      </Modal>

      {/* Add Member Modal */}
      <Modal show={showAddMember} onHide={() => setShowAddMember(false)}>
        <Modal.Header closeButton>
          <Modal.Title>Add New Member</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form>
            <Form.Group className="mb-3">
              <Form.Label>First Name *</Form.Label>
              <Form.Control
                type="text"
                value={newMember.firstName}
                onChange={(e) => setNewMember({ ...newMember, firstName: e.target.value })}
                placeholder="Enter first name"
                required
              />
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label>Last Name *</Form.Label>
              <Form.Control
                type="text"
                value={newMember.lastName}
                onChange={(e) => setNewMember({ ...newMember, lastName: e.target.value })}
                placeholder="Enter last name"
                required
              />
            </Form.Group>
          </Form>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowAddMember(false)}>
            Cancel
          </Button>
          <Button 
            variant="primary" 
            onClick={handleAddMember}
            disabled={!newMember.firstName.trim() || !newMember.lastName.trim()}
          >
            Add Member
          </Button>
        </Modal.Footer>
      </Modal>

      {/* Lend Book Modal */}
      <Modal show={showLendBook} onHide={() => setShowLendBook(false)}>
        <Modal.Header closeButton>
          <Modal.Title>
            {selectedBook?.status === 'available' ? 'Lend Book' : 'Join Waitlist'}
          </Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form>
            <Form.Group className="mb-3">
              <Form.Label>Book</Form.Label>
              <Form.Control type="text" value={selectedBook?.title} disabled />
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label>Member</Form.Label>
              <Form.Select
                value={selectedMember}
                onChange={(e) => setSelectedMember(e.target.value)}
              >
                <option value="">Select a member</option>
                {members.map((member) => (
                  <option key={member.id} value={member.id.toString()}>
                    {member.first_name} {member.last_name}
                  </option>
                ))}
              </Form.Select>
            </Form.Group>
          </Form>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowLendBook(false)}>
            Cancel
          </Button>
          <Button 
            variant="primary" 
            onClick={handleLendBook}
            disabled={!selectedMember}
          >
            {selectedBook?.status === 'available' ? 'Lend Book' : 'Join Waitlist'}
          </Button>
        </Modal.Footer>
      </Modal>

      {/* Waitlist Modal */}
      <Modal show={showWaitlist} onHide={() => setShowWaitlist(false)}>
        <Modal.Header closeButton>
          <Modal.Title>📋 Waitlist</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {currentBookWaitlist.length === 0 ? (
            <p className="text-muted">No one is on the waitlist for this book.</p>
          ) : (
            <Table striped bordered>
              <thead>
                <tr>
                  <th>#</th>
                  <th>Member Name</th>
                  <th>Joined Date</th>
                </tr>
              </thead>
              <tbody>
                {currentBookWaitlist.map((item, index) => (
                  <tr key={item.id}>
                    <td>{index + 1}</td>
                    <td>{item.first_name} {item.last_name}</td>
                    <td>{new Date(item.joined_date).toLocaleDateString()}</td>
                  </tr>
                ))}
              </tbody>
            </Table>
          )}
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowWaitlist(false)}>
            Close
          </Button>
        </Modal.Footer>
      </Modal>

      {/* Populate Library Modal */}
      <Modal show={showPopulateLibrary} onHide={() => setShowPopulateLibrary(false)}>
        <Modal.Header closeButton>
          <Modal.Title>📚 Populate Library</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form>
            <Form.Group className="mb-3">
              <Form.Label>Genre *</Form.Label>
              <Form.Control
                type="text"
                value={genre}
                onChange={(e) => setGenre(e.target.value)}
                placeholder="Enter genre (e.g., fiction, science, romance)"
                required
              />
              <Form.Text className="text-muted">
                This will fetch popular books from this genre using Open Library API
              </Form.Text>
            </Form.Group>
          </Form>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowPopulateLibrary(false)}>
            Cancel
          </Button>
          <Button 
            variant="primary" 
            onClick={handlePopulateLibrary}
            disabled={!genre.trim() || isLoading}
          >
            {isLoading ? 'Populating...' : 'Populate Library'}
          </Button>
        </Modal.Footer>
      </Modal>
    </div>
  );
};

export default Catalog;