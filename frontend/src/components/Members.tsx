import React, { useState, useEffect } from 'react';
import { Card, Table, Button, Modal, Form, Alert } from 'react-bootstrap';
import { libraryService } from '../services/libraryService';
import { Member } from '../types/types';

const Members: React.FC = () => {
  const [members, setMembers] = useState<Member[]>([]);
  const [showAddMember, setShowAddMember] = useState(false);
  const [newMember, setNewMember] = useState({ firstName: '', lastName: '' });
  const [alert, setAlert] = useState<{ type: 'success' | 'danger'; message: string } | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadMembers();
  }, []);

  const loadMembers = async () => {
    try {
      const membersData = await libraryService.getMembers();
      setMembers(membersData);
    } catch (error) {
      console.error('Error loading members:', error);
      setAlert({ type: 'danger', message: 'Failed to load members' });
    } finally {
      setLoading(false);
    }
  };

  const handleAddMember = async () => {
    try {
      await libraryService.addMember(newMember.firstName, newMember.lastName);
      setNewMember({ firstName: '', lastName: '' });
      setShowAddMember(false);
      setAlert({ type: 'success', message: 'Member added successfully!' });
      await loadMembers();
    } catch (error: any) {
      setAlert({ type: 'danger', message: error.message });
    }
  };

  if (loading) {
    return <div>Loading members...</div>;
  }

  return (
    <div>
      {alert && (
        <Alert variant={alert.type} onClose={() => setAlert(null)} dismissible>
          {alert.message}
        </Alert>
      )}

      <Card>
        <Card.Header>
          <div className="d-flex justify-content-between align-items-center">
            <h4 className="mb-0">Library Members</h4>
            <Button variant="primary" onClick={() => setShowAddMember(true)}>
              Add Member
            </Button>
          </div>
        </Card.Header>
        <Card.Body>
          {members.length === 0 ? (
            <div className="text-center py-4">
              <p className="text-muted">No members found. Add your first member to get started.</p>
              <Button variant="primary" onClick={() => setShowAddMember(true)}>
                Add First Member
              </Button>
            </div>
          ) : (
            // Replace the table in Members.tsx with this enhanced version
<Table striped bordered hover>
  <thead>
    <tr>
      <th>First Name</th>
      <th>Last Name</th>
      <th>Join Date</th>
      <th>Active Loans</th>
      <th>Member ID</th>
    </tr>
  </thead>
  <tbody>
    {members.map((member) => (
      <tr key={member.id}>
        <td>{member.first_name}</td>
        <td>{member.last_name}</td>
        <td>{member.created_at ? new Date(member.created_at).toLocaleDateString() : 'N/A'}</td>
        <td>
          {member.active_loans && member.active_loans.length > 0 ? (
            <div>
              {member.active_loans.map((loan: any) => (
                <div key={loan.loan_id} className="small">
                  📚 {loan.book_title} 
                  {loan.due_date && (
                    <span className="text-muted">
                      (Due: {new Date(loan.due_date).toLocaleDateString()})
                    </span>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <span className="text-muted">No active loans</span>
          )}
        </td>
        <td>
          <code>{member.id}</code>
        </td>
      </tr>
    ))}
  </tbody>
</Table>
          )}
        </Card.Body>
      </Card>

      <Modal show={showAddMember} onHide={() => setShowAddMember(false)} centered>
        <Modal.Header closeButton>
          <Modal.Title>Add New Member</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form>
            <Form.Group className="mb-3">
              <Form.Label>First Name</Form.Label>
              <Form.Control
                type="text"
                value={newMember.firstName}
                onChange={(e) => setNewMember({ ...newMember, firstName: e.target.value })}
                placeholder="Enter first name"
              />
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label>Last Name</Form.Label>
              <Form.Control
                type="text"
                value={newMember.lastName}
                onChange={(e) => setNewMember({ ...newMember, lastName: e.target.value })}
                placeholder="Enter last name"
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
    </div>
  );
};

export default Members;