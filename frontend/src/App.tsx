import React, { useState,useEffect } from 'react';
import { Container, Nav, Navbar, Button, Modal } from 'react-bootstrap';
import { libraryService } from './services/libraryService';
import Catalog from './components/Catalog';
import Members from './components/Members';
import Reports from './components/Reports';
import 'bootstrap/dist/css/bootstrap.min.css';
import './App.css';

type View = 'catalog' | 'members' | 'reports';

function App() {
  const [currentView, setCurrentView] = useState<View>('catalog');
  const [showWelcomeModal, setShowWelcomeModal] = useState(false);

  useEffect(() => {
    // Check if it's first visit
    const hasVisited = localStorage.getItem('hasVisitedLibrary');
    if (!hasVisited) {
      setShowWelcomeModal(true);
      localStorage.setItem('hasVisitedLibrary', 'true');
    }
  }, []);

  const handleLoadSampleData = async () => {
    try {
      // Populate with some sample genres
      await libraryService.populateLibrary('fiction');
      await libraryService.populateLibrary('science');
      setShowWelcomeModal(false);
    } catch (error) {
      console.error('Failed to load sample data:', error);
      setShowWelcomeModal(false);
    }
  };

  const handleStartFresh = () => {
    setShowWelcomeModal(false);
  };

  const renderView = () => {
    switch (currentView) {
      case 'catalog':
        return <Catalog />;
      case 'members':
        return <Members />;
      case 'reports':
        return <Reports />;
      default:
        return <Catalog />;
    }
  };

  return (
    <div className="App">
      {/* Welcome Modal */}
      <Modal show={showWelcomeModal} centered backdrop="static" keyboard={false}>
        <Modal.Header className="bg-primary text-white">
          <Modal.Title>📚 Welcome to Library Lite!</Modal.Title>
        </Modal.Header>
        <Modal.Body className="text-center">
          <div className="mb-4">
            <h5>Get Started with Your Library</h5>
            <p className="text-muted">
              Would you like to start with sample books, or create your own from scratch?
            </p>
          </div>
          
          <div className="d-flex gap-3 justify-content-center">
            <Button 
              variant="primary" 
              onClick={handleLoadSampleData}
              size="lg"
            >
              🚀 Load Sample Data
            </Button>
            <Button 
              variant="outline-primary" 
              onClick={handleStartFresh}
              size="lg"
            >
              🆕 Start Fresh
            </Button>
          </div>
        </Modal.Body>
        <Modal.Footer className="justify-content-center">
          <small className="text-muted">
            You can always add books and members later from the Catalog view.
          </small>
        </Modal.Footer>
      </Modal>

      <Navbar bg="dark" variant="dark" expand="lg">
        <Container>
          <Navbar.Brand>📚 Library Lite</Navbar.Brand>
          <Nav className="me-auto">
            <Nav.Link 
              active={currentView === 'catalog'} 
              onClick={() => setCurrentView('catalog')}
            >
              Catalog
            </Nav.Link>
            <Nav.Link 
              active={currentView === 'members'} 
              onClick={() => setCurrentView('members')}
            >
              Members
            </Nav.Link>
            <Nav.Link 
              active={currentView === 'reports'} 
              onClick={() => setCurrentView('reports')}
            >
              Reports
            </Nav.Link>
          </Nav>
        </Container>
      </Navbar>

      <Container className="mt-4">
        {renderView()}
      </Container>
    </div>
  );
}

export default App;