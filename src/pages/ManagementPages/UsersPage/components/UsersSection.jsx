import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { getUsers, createUser, updateUser, deleteUser } from '../../../../services/api';
import useAuthStore from '../../../../store/authStore';
import UsersList from './UsersList';
import UserDetail from './UserDetail';
import UserForm from './UserForm';
import './UsersSection.css';

const canManage = (actorRole, targetRole) => {
  if (actorRole === 'super_admin') return true;
  if (actorRole === 'admin') return targetRole === 'agent' || targetRole === 'citoyen';
  return false;
};

export default function UsersSection() {
  const currentUserRole = useAuthStore((s) => s.user?.role);

  const [users, setUsers]           = useState([]);
  const [loading, setLoading]       = useState(true);
  const [error, setError]           = useState(null);
  const [selectedId, setSelectedId] = useState(null);
  const [filter, setFilter]         = useState('all');
  const [search, setSearch]         = useState('');
  const [showForm, setShowForm]     = useState(false);
  const [editingUser, setEditingUser] = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const data = await getUsers({ role_ne: 'citoyen' });
      setUsers(Array.isArray(data) ? data : []);
      setError(null);
    } catch {
      setError('Erreur lors du chargement des utilisateurs');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const filtered = useMemo(() => {
    let list = filter === 'all' ? users : users.filter((u) => u.role === filter);
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(
        (u) =>
          `${u.firstName} ${u.lastName}`.toLowerCase().includes(q) ||
          (u.email || '').toLowerCase().includes(q)
      );
    }
    return list;
  }, [users, filter, search]);

  const selectedUser = users.find((u) => u.id === selectedId) || null;

  const handleFormSubmit = async (formData) => {
    try {
      if (editingUser) {
        await updateUser(editingUser.id, formData);
      } else {
        await createUser(formData);
      }
      setShowForm(false);
      setEditingUser(null);
      await load();
    } catch {
      setError(editingUser ? 'Erreur lors de la modification' : 'Erreur lors de la création');
    }
  };

  const handleDelete = async (id) => {
    const target = users.find((u) => u.id === id);
    if (target && !canManage(currentUserRole, target.role)) {
      setError("Vous n'avez pas la permission de supprimer cet utilisateur");
      return;
    }
    try {
      await deleteUser(id);
      if (selectedId === id) setSelectedId(null);
      await load();
    } catch {
      setError('Erreur lors de la suppression');
    }
  };

  const handleEditClick = (user) => {
    if (!canManage(currentUserRole, user.role)) return;
    setEditingUser(user);
    setShowForm(true);
  };

  return (
    <div className="usr-page">
      {error && (
        <div className="usr-error">
          {error}
          <button onClick={() => setError(null)}>×</button>
        </div>
      )}

      <div className="usr-split">
        <UsersList
          users={filtered}
          selectedId={selectedId}
          filter={filter}
          search={search}
          loading={loading}
          onSelect={setSelectedId}
          onFilterChange={setFilter}
          onSearchChange={setSearch}
          onCreateClick={() => { setEditingUser(null); setShowForm(true); }}
        />

        <div className="usr-right">
          <UserDetail
            user={selectedUser}
            currentUserRole={currentUserRole}
            onEdit={handleEditClick}
            onDelete={handleDelete}
          />
        </div>
      </div>

      <UserForm
        show={showForm}
        editingUser={editingUser}
        currentUserRole={currentUserRole}
        onClose={() => { setShowForm(false); setEditingUser(null); }}
        onSubmit={handleFormSubmit}
      />
    </div>
  );
}
