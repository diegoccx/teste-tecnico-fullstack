import { useState, useEffect, useCallback } from 'react';
import Layout from '../components/Layout';
import UploadModal from '../components/UploadModal';
import ShareModal from '../components/ShareModal';
import { filesApi, usersApi, getStaticUrl } from '../services/api';
import { DriveFile, OrgMember } from '../types';
import { useAuth } from '../contexts/AuthContext';
import { format } from 'date-fns';

function formatBytes(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1048576) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / 1048576).toFixed(1)} MB`;
}

export default function Workspace() {
  const { user } = useAuth();
  const isOwner = user?.role === 'owner';

  const [tab, setTab] = useState<'text' | 'image'>('text');
  const [files, setFiles] = useState<DriveFile[]>([]);
  const [members, setMembers] = useState<OrgMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQ, setSearchQ] = useState('');
  const [filterStart, setFilterStart] = useState('');
  const [filterEnd, setFilterEnd] = useState('');
  const [filterUser, setFilterUser] = useState('');
  const [showUpload, setShowUpload] = useState(false);
  const [shareFile, setShareFile] = useState<DriveFile | null>(null);
  const [deleting, setDeleting] = useState<string | null>(null);
  const [error, setError] = useState('');

  const loadFiles = useCallback(async () => {
    setLoading(true);
    try {
      const params: Record<string, string> = {};
      if (filterStart) params.startDate = filterStart;
      if (filterEnd) params.endDate = filterEnd;
      if (isOwner && filterUser) params.uploadedById = filterUser;
      const res = await filesApi.list(params);
      setFiles(res.data);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Erro ao carregar arquivos');
    }
    setLoading(false);
  }, [filterStart, filterEnd, filterUser, isOwner]);

  useEffect(() => { loadFiles(); }, [loadFiles]);

  useEffect(() => {
    if (isOwner) usersApi.getOrgMembers().then(r => setMembers(r.data)).catch(() => setError('Erro ao carregar membros'));
  }, [isOwner]);

  const handleSearch = async () => {
    if (!searchQ.trim()) { loadFiles(); return; }
    setLoading(true);
    try {
      const res = await filesApi.search(searchQ);
      setFiles(res.data);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Erro ao pesquisar arquivos');
    }
    setLoading(false);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Confirma a exclusão do arquivo?')) return;
    setDeleting(id);
    try {
      await filesApi.delete(id);
      loadFiles();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Erro ao excluir');
    } finally {
      setDeleting(null);
    }
  };

  const textFiles = files.filter(f => f.type === 'text');
  const imageFiles = files.filter(f => f.type === 'image');
  const displayed = tab === 'text' ? textFiles : imageFiles;

  return (
    <Layout>
      {showUpload && (
        <UploadModal onClose={() => setShowUpload(false)} onSuccess={() => { setShowUpload(false); loadFiles(); }} />
      )}
      {shareFile && (
        <ShareModal file={shareFile} onClose={() => setShareFile(null)} />
      )}

      <div className="page-header">
        <div>
          <h1>Área de Trabalho</h1>
          <p>Gerencie e compartilhe seus arquivos</p>
        </div>
        <button className="btn btn-primary" onClick={() => setShowUpload(true)}>
          + Upload de Arquivo
        </button>
      </div>

      {error && <div className="alert alert-danger">{error}</div>}

      <div className="filters-bar">
        <div className="form-group">
          <label>Data inicial</label>
          <input type="date" value={filterStart} onChange={e => setFilterStart(e.target.value)} />
        </div>
        <div className="form-group">
          <label>Data final</label>
          <input type="date" value={filterEnd} onChange={e => setFilterEnd(e.target.value)} />
        </div>
        {isOwner && (
          <div className="form-group">
            <label>Filtrar por usuário</label>
            <select value={filterUser} onChange={e => setFilterUser(e.target.value)}>
              <option value="">Todos</option>
              {members.map(m => (
                <option key={m.id} value={m.id}>{m.name}</option>
              ))}
            </select>
          </div>
        )}
        <button className="btn btn-outline" onClick={() => { setFilterStart(''); setFilterEnd(''); setFilterUser(''); }}>
          Limpar
        </button>
      </div>

      <div className="tabs">
        <button className={`tab ${tab === 'text' ? 'active' : ''}`} onClick={() => setTab('text')}>
          📄 Arquivos de Texto ({textFiles.length})
        </button>
        <button className={`tab ${tab === 'image' ? 'active' : ''}`} onClick={() => setTab('image')}>
          🖼️ Galeria de Imagens ({imageFiles.length})
        </button>
      </div>

      {tab === 'text' && (
        <div className="search-bar">
          <input
            type="text"
            placeholder="Pesquisar por nome..."
            value={searchQ}
            onChange={e => setSearchQ(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleSearch()}
          />
          <button className="btn btn-outline" onClick={handleSearch}>Buscar</button>
          {searchQ && <button className="btn btn-outline" onClick={() => { setSearchQ(''); loadFiles(); }}>✕</button>}
        </div>
      )}

      {loading ? (
        <div className="loading"><div className="spinner" /></div>
      ) : displayed.length === 0 ? (
        <div className="card" style={{ textAlign: 'center', color: '#6b7280', padding: '3rem' }}>
          <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>{tab === 'text' ? '📄' : '🖼️'}</div>
          <p>Nenhum arquivo encontrado. Faça um upload!</p>
        </div>
      ) : tab === 'text' ? (
        <div className="card" style={{ padding: 0 }}>
          {displayed.map(f => (
            <div key={f.id} className="file-item">
              <span className="file-icon">📄</span>
              <div className="file-info">
                <div className="file-name">
                  {f.originalName}
                  {f.isShared && <span className="badge shared" style={{ marginLeft: 8 }}>compartilhado</span>}
                </div>
                <div className="file-meta">
                  Por {f.uploadedBy?.name} · {formatBytes(f.size)} · {format(new Date(f.uploadedAt), 'dd/MM/yyyy HH:mm')}
                </div>
              </div>
              <div className="file-actions">
                <a
                  href={getStaticUrl(f.filePath)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn btn-sm btn-outline"
                >
                  Ver
                </a>
                <button
                  className="btn btn-sm btn-outline"
                  onClick={() => setShareFile(f)}
                >
                  Compartilhar
                </button>
                {isOwner && (
                  <button
                    className="btn btn-sm btn-danger"
                    onClick={() => handleDelete(f.id)}
                    disabled={deleting === f.id}
                  >
                    {deleting === f.id ? <span className="spinner" /> : 'Excluir'}
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="image-grid">
          {displayed.map(f => (
            <div key={f.id} className="image-card">
              <img
                src={getStaticUrl(f.filePath)}
                alt={f.originalName}
                className="image-thumb"
                onError={e => { (e.target as HTMLImageElement).src = 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" width="180" height="140"><rect width="180" height="140" fill="%23f3f4f6"/><text x="90" y="75" text-anchor="middle" fill="%239ca3af" font-size="14">🖼️</text></svg>'; }}
              />
              <div className="image-info">
                <div className="image-name">{f.originalName}</div>
                <div className="image-meta">
                  {f.uploadedBy?.name} · {format(new Date(f.uploadedAt), 'dd/MM/yy')}
                  {f.isShared && <span className="badge shared" style={{ marginLeft: 6, fontSize: '0.7rem' }}>compartilhado</span>}
                </div>
                <div style={{ display: 'flex', gap: '0.4rem', marginTop: '0.5rem', flexWrap: 'wrap' }}>
                  <button className="btn btn-sm btn-outline" onClick={() => setShareFile(f)}>
                    Compartilhar
                  </button>
                  {isOwner && (
                    <button
                      className="btn btn-sm btn-danger"
                      onClick={() => handleDelete(f.id)}
                      disabled={deleting === f.id}
                    >
                      {deleting === f.id ? <span className="spinner" /> : 'Excluir'}
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </Layout>
  );
}
