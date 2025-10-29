import React, { useState, useEffect } from 'react';
import { Card, Table, Alert, Row, Col, Button } from 'react-bootstrap'; // Fixed import
import { libraryService } from '../services/libraryService';
import { OverdueReport, TopBook } from '../types/types';

const Reports: React.FC = () => {
  const [overdueReports, setOverdueReports] = useState<OverdueReport[]>([]);
  const [topBooks, setTopBooks] = useState<TopBook[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>('');

  useEffect(() => {
    loadReports();
  }, []);

  const loadReports = async () => {
    try {
      setLoading(true);
      console.log('📊 Loading reports...');
      
      const [overdueData, topBooksData] = await Promise.all([
        libraryService.getOverdueReport(),
        libraryService.getTopBooks(5)
      ]);
      
      console.log('✅ Reports loaded:', { 
        overdue: overdueData.length, 
        topBooks: topBooksData.length 
      });
      
      setOverdueReports(overdueData);
      setTopBooks(topBooksData);
      setError('');
    } catch (error: any) {
      console.error('❌ Error loading reports:', error);
      setError(error.response?.data?.error || 'Failed to load reports. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="text-center py-4">
        <div className="spinner-border" role="status">
          <span className="visually-hidden">Loading...</span>
        </div>
        <p className="mt-2">Loading reports...</p>
      </div>
    );
  }

  return (
    <div>
      <h2 className="mb-4">Library Reports</h2>

      {error && (
        <Alert variant="danger" className="mb-4">
          {error}
          <div className="mt-2">
            <Button variant="outline-danger" size="sm" onClick={loadReports}>
              Retry Loading Reports
            </Button>
          </div>
        </Alert>
      )}

      <Row>
        <Col lg={6} className="mb-4">
          <Card>
            <Card.Header className="bg-warning text-dark">
              <h5 className="mb-0">📚 Overdue Books</h5>
            </Card.Header>
            <Card.Body>
              {overdueReports.length === 0 ? (
                <Alert variant="success" className="mb-0">
                  🎉 No overdue books! All books are returned on time.
                </Alert>
              ) : (
                <Table striped bordered hover responsive>
                  <thead>
                    <tr>
                      <th>Book Title</th>
                      <th>Author</th>
                      <th>Member</th>
                      <th>Due Date</th>
                      <th>Days Overdue</th>
                    </tr>
                  </thead>
                  <tbody>
                    {overdueReports.map((report, index) => (
                      <tr key={index}>
                        <td>{report.title}</td>
                        <td>{report.author}</td>
                        <td>{report.first_name} {report.last_name}</td>
                        <td>{new Date(report.due_date).toLocaleDateString()}</td>
                        <td className="text-danger fw-bold">{report.days_overdue}</td>
                      </tr>
                    ))}
                  </tbody>
                </Table>
              )}
            </Card.Body>
          </Card>
        </Col>

        <Col lg={6} className="mb-4">
          <Card>
            <Card.Header className="bg-success text-white">
              <h5 className="mb-0">⭐ Top 5 Most Popular Books</h5>
            </Card.Header>
            <Card.Body>
              {topBooks.length === 0 ? (
                <Alert variant="info" className="mb-0">
                  No checkout data available yet. Start lending books to see popular titles.
                </Alert>
              ) : (
                <Table striped bordered hover responsive>
                  <thead>
                    <tr>
                      <th>#</th>
                      <th>Book Title</th>
                      <th>Author</th>
                      <th>Checkout Count</th>
                    </tr>
                  </thead>
                  <tbody>
                    {topBooks.map((book, index) => (
                      <tr key={index}>
                        <td>{index + 1}</td>
                        <td>{book.title}</td>
                        <td>{book.author}</td>
                        <td className="text-center">
                          <span className="badge bg-primary">{book.checkout_count}</span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </Table>
              )}
            </Card.Body>
          </Card>
        </Col>
      </Row>
    </div>
  );
};

export default Reports;