import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { getContainers, createContainer, updateContainer, deleteContainer, getZones, getCapteurs } from '../../../../services/api';
import { enrichContainersWithSensors } from '../../../../services/transformers';
import ContainersList from './ContainersList';
import ContainerDetail from './ContainerDetail';
import ContainerForm from './ContainerForm';
import './ContainersSection.css';

export default function ContainersSection() {
  const [containers, setContainers] = useState([]);
  const [capteurs, setCapteurs]     = useState([]);
  const [zones, setZones]           = useState([]);
  const [loading, setLoading]       = useState(true);
  const [error, setError]           = useState(null);

  const [selectedId, setSelectedId]       = useState(null);
  const [filter, setFilter]               = useState('all');
  const [search, setSearch]               = useState('');

  const [showForm, setShowForm]           = useState(false);
  const [editingContainer, setEditingContainer] = useState(null);

  // ── fetch ──────────────────────────────────────────────────────
  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [cData, zData, capData] = await Promise.all([getContainers(), getZones(), getCapteurs()]);
      const rawContainers = Array.isArray(cData) ? cData : cData?.data || [];
      const capList = Array.isArray(capData) ? capData : capData?.data || [];
      setCapteurs(capList);
      setContainers(enrichContainersWithSensors(rawContainers, capList));
      setZones(Array.isArray(zData) ? zData : zData?.data || []);
      setError(null);
    } catch {
      setError('Erreur lors du chargement des données');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  // ── computed ───────────────────────────────────────────────────
  const filtered = useMemo(() => {
    let list = filter === 'all' ? containers : containers.filter((c) => c.status === filter);
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(
        (c) =>
          (c.name || c.code_conteneur || '').toLowerCase().includes(q) ||
          (c.type || '').toLowerCase().includes(q)
      );
    }
    return list;
  }, [containers, filter, search]);

  const selectedContainer = containers.find((c) => c.id === selectedId) || null;

  // ── handlers ──────────────────────────────────────────────────
  const handleCreate = () => {
    setEditingContainer(null);
    setShowForm(true);
  };

  const handleEdit = (container) => {
    setEditingContainer(container);
    setShowForm(true);
  };

  const handleFormSubmit = async (formData) => {
    try {
      if (editingContainer) {
        await updateContainer(editingContainer.id, formData);
      } else {
        await createContainer(formData);
      }
      setShowForm(false);
      setEditingContainer(null);
      await load();
    } catch {
      setError(editingContainer ? 'Erreur lors de la modification' : 'Erreur lors de la création');
    }
  };

  const handleDelete = async (id) => {
    try {
      await deleteContainer(id);
      if (selectedId === id) setSelectedId(null);
      await load();
    } catch {
      setError('Erreur lors de la suppression');
    }
  };

  // ──────────────────────────────────────────────────────────────
  return (
    <div className="cnt-page">
      {error && (
        <div className="cnt-error">
          {error}
          <button onClick={() => setError(null)}>×</button>
        </div>
      )}

      <div className="cnt-split">
        <ContainersList
          containers={filtered}
          zones={zones}
          selectedId={selectedId}
          filter={filter}
          search={search}
          loading={loading}
          onSelect={setSelectedId}
          onFilterChange={setFilter}
          onSearchChange={setSearch}
          onCreateClick={handleCreate}
        />

        <div className="cnt-right">
          <ContainerDetail
            container={selectedContainer}
            zones={zones}
            capteurs={capteurs}
            onEdit={handleEdit}
            onDelete={handleDelete}
          />
        </div>
      </div>

      <ContainerForm
        show={showForm}
        editingContainer={editingContainer}
        zones={zones}
        onClose={() => { setShowForm(false); setEditingContainer(null); }}
        onSubmit={handleFormSubmit}
      />
    </div>
  );
}
