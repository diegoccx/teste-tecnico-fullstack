import { useState, useEffect } from 'react';
import { fileSharesApi, usersApi } from '../services/api';
import { DriveFile, OrgMember } from '../types';
import { useAuth } from '../contexts/AuthContext';

interface Props {
  file: DriveFile;
  onClose: () => void;
}

export default function ShareModal({ file, onClose }: Props) {
  const { user } = useAuth();
  const [members, setMembers] = useState<OrgMember[]>([]);
  const [currentShares, setCurrentShares] = useState<any[]>([]);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const [sharing, setSharing] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    Promise.all([
      usersApi.getOrgMembers(),
      fileSharesApi.getShares(file.id),
    ]).then(([membersRes, sharesRes]) => {
      const alreadyShared = new Set<string>(sharesRes.data.map((s: any) => s.sharedWithId));
      setMembers(membersRes.data.filter((m: OrgMember) => m.id !== user?.id));
      setCurrentShares(sharesRes.data);
      setSelected(alreadyShared);
      setLoading(false);
    });
  }, [file.id, user?.id]);

  const toggleMember = (id: string) => {
    setSelected(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const handleShare = async () => {
    setSharing(true);
    setError('');
    setSuccess('');
    try {
      const previouslySharedIds = new Set<string>(currentShares.map((s: any) => s.sharedWithId));

      const toAdd = Array.from(selected).filter(id => !previouslySharedIds.has(id));
      const toRevoke = currentShares.filter((s: any) => !selected.has(s.sharedWithId));

      await Promise.all([
        toAdd.length > 0 ? fileSharesApi.share(file.id, toAdd) : Promise.resolve(),
        ...toRevoke.map((s: any) => fileSharesApi.revoke(s.id)),
      ]);

      setCurrentShares(prev => {
        const kept = prev.filter((s: any) => selected.has(s.sharedWithId));
        const added = toAdd.map(id => ({ sharedWithId: id, id: `pending-${id}` }));
        return [...kept, ...added];
      });

      setSuccess('Compartilhamento atualizado com sucesso!');
    } catch (err: any) {
      setError(err.response?.data?.message || 'Erro ao compartilhar');
    } finally {
      setSharing(false);
    }
  };

  return (
    <div className="modal-backdrop">
      <div className="modal">
        <div className="modal-header">
          <h3>Compartilhar Arquivo</h3>
          <button className="btn btn-icon btn-outline" onClick={onClose}>✕</button>
        </div>

        <div className="alert alert-info">
          <strong>{file.originalName}</strong>
        </div>

        {error && <div className="alert alert-danger">{error}</div>}
        {success && <div className="alert alert-success">{success}</div>}

        {loading ? (
          <div className="loading"><div className="spinner" /></div>
        ) : members.length === 0 ? (
          <p style={{ color: '#6b7280', fontSize: '0.9rem' }}>
            Nenhum outro membro na organização para compartilhar.
          </p>
        ) : (
          <>
            <p style={{ fontSize: '0.85rem', color: '#6b7280', marginBottom: '0.5rem' }}>
              Selecione os membros com quem deseja compartilhar:
            </p>
            <div className="member-list">
              {members.map(m => (
                <label key={m.id} className="member-item">
                  <input
                    type="checkbox"
                    checked={selected.has(m.id)}
                    onChange={() => toggleMember(m.id)}
                  />
                  <div>
                    <div className="member-name">{m.name}</div>
                    <div className="member-email">{m.email}</div>
                  </div>
                  <span className={`badge ${m.role}`} style={{ marginLeft: 'auto' }}>{m.role}</span>
                </label>
              ))}
            </div>
          </>
        )}

        <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end', marginTop: '1rem' }}>
          <button className="btn btn-outline" onClick={onClose}>Fechar</button>
          {members.length > 0 && (
            <button className="btn btn-primary" onClick={handleShare} disabled={sharing}>
              {sharing ? <><span className="spinner" />&nbsp; Salvando...</> : 'Salvar Compartilhamento'}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
