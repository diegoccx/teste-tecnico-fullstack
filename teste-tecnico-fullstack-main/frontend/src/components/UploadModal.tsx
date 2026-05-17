import { useState, useRef } from 'react';
import { filesApi } from '../services/api';

interface Props {
  onClose: () => void;
  onSuccess: () => void;
}

export default function UploadModal({ onClose, onSuccess }: Props) {
  const [type, setType] = useState<'text' | 'image'>('text');
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  const accept = type === 'text' ? '.txt,.md,.csv' : '.jpg,.jpeg,.png,.gif,.webp';

  const handleUpload = async () => {
    if (!file) { setError('Selecione um arquivo'); return; }
    setError('');
    setUploading(true);
    try {
      const fd = new FormData();
      fd.append('file', file);
      if (type === 'text') await filesApi.uploadText(fd);
      else await filesApi.uploadImage(fd);
      onSuccess();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Erro ao fazer upload');
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="modal-backdrop">
      <div className="modal">
        <div className="modal-header">
          <h3>Upload de Arquivo</h3>
          <button className="btn btn-icon btn-outline" onClick={onClose}>✕</button>
        </div>

        <div className="tabs" style={{ marginBottom: '1rem' }}>
          <button className={`tab ${type === 'text' ? 'active' : ''}`} onClick={() => { setType('text'); setFile(null); }}>
            📄 Texto
          </button>
          <button className={`tab ${type === 'image' ? 'active' : ''}`} onClick={() => { setType('image'); setFile(null); }}>
            🖼️ Imagem
          </button>
        </div>

        {error && <div className="alert alert-danger">{error}</div>}

        <div
          style={{
            border: '2px dashed #d1d5db',
            borderRadius: 10,
            padding: '2rem',
            textAlign: 'center',
            cursor: 'pointer',
            marginBottom: '1rem',
          }}
          onClick={() => inputRef.current?.click()}
        >
          {file ? (
            <div>
              <div style={{ fontSize: '2rem' }}>{type === 'text' ? '📄' : '🖼️'}</div>
              <div style={{ fontWeight: 500, marginTop: 8 }}>{file.name}</div>
              <div style={{ fontSize: '0.8rem', color: '#6b7280', marginTop: 4 }}>
                {(file.size / 1024).toFixed(1)} KB
              </div>
            </div>
          ) : (
            <div>
              <div style={{ fontSize: '2rem', color: '#9ca3af' }}>📁</div>
              <div style={{ color: '#6b7280', marginTop: 8 }}>
                Clique para selecionar um arquivo
              </div>
              <div style={{ fontSize: '0.8rem', color: '#9ca3af', marginTop: 4 }}>
                {type === 'text' ? 'Aceito: .txt, .md, .csv (máx. 10MB)' : 'Aceito: .jpg, .png, .gif, .webp (máx. 10MB)'}
              </div>
            </div>
          )}
          <input
            ref={inputRef}
            type="file"
            accept={accept}
            style={{ display: 'none' }}
            onChange={e => setFile(e.target.files?.[0] || null)}
          />
        </div>

        <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end' }}>
          <button className="btn btn-outline" onClick={onClose}>Cancelar</button>
          <button className="btn btn-primary" onClick={handleUpload} disabled={uploading || !file}>
            {uploading ? <><span className="spinner" />&nbsp; Enviando...</> : 'Fazer Upload'}
          </button>
        </div>
      </div>
    </div>
  );
}
