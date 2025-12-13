import React, { useState, useEffect, useMemo } from 'react';
import { useSettings } from '../hooks/useSettings';
import type { User } from '../types';
import { CustomSelect } from './CustomSelect';
import { useAuth } from '../App';
import { useAppStore } from '../store';
import { PreviewModal } from './PreviewModal';

interface TenderInputFormProps {
  onSubmit: (data: { mainUrl: string; additionalUrls: string[]; files: File[] }) => void;
  platform: 'xt' | 'uzex';
  selectedAnalystId: string;
  setSelectedAnalystId: React.Dispatch<React.SetStateAction<string>>;
}

const SearchIcon: React.FC = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" viewBox="0 0 20 20" fill="currentColor">
        <path fillRule="evenodd" d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z" clipRule="evenodd" />
    </svg>
);

const TrashIcon: React.FC<{ onClick: () => void, className?: string }> = ({ onClick, className }) => (
    <button type="button" onClick={onClick} className={`p-2 rounded-lg text-textLight hover:text-red-500 hover:bg-red-500/10 transition-colors ${className}`}>
        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm4 0a1 1 0 012 0v6a1 1 0 11-2 0V8z" clipRule="evenodd" /></svg>
    </button>
);

const FileIcon: React.FC = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-textLight" viewBox="0 0 20 20" fill="currentColor">
      <path fillRule="evenodd" d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4zm2 6a1 1 0 011-1h6a1 1 0 110 2H7a1 1 0 01-1-1zm1 3a1 1 0 100 2h6a1 1 0 100-2H7z" clipRule="evenodd" />
    </svg>
);


export const TenderInputForm: React.FC<TenderInputFormProps> = ({ onSubmit, platform, selectedAnalystId, setSelectedAnalystId }) => {
  const { t } = useSettings();
  const { user } = useAuth();
  const { users } = useAppStore();
  const [mainUrl, setMainUrl] = useState('');
  const [additionalUrls, setAdditionalUrls] = useState<string[]>(['']);
  const [files, setFiles] = useState<File[]>([]);
  const [urlError, setUrlError] = useState<string | null>(null);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);

  const analystOptions = useMemo(() => {
    if (!user) return [];
    if (user.role === 'admin') {
        const brokers = users.filter(u => u.role === 'broker' && u.adminId === user.id);
        return [
            { value: user.id, label: `${user.name} (${t('users.roleAdmin')})` },
            ...brokers.map(b => ({ value: b.id, label: b.name }))
        ];
    }
    return [{ value: user.id, label: user.name }];
  }, [user, users, t]);


  useEffect(() => {
    const trimmedUrl = mainUrl.trim();
    if (!trimmedUrl) { setUrlError(null); return; }
    try {
        const urlObject = new URL(trimmedUrl);
        const hostname = urlObject.hostname.replace('www.', '');
        if (platform === 'xt' && hostname.includes('uzex.uz')) setUrlError(t('tenderAnalysis.urlMismatchErrorXT'));
        else if (platform === 'uzex' && hostname.includes('xt-xarid.uz')) setUrlError(t('tenderAnalysis.urlMismatchErrorUZEX'));
        else setUrlError(null);
    } catch (e) { setUrlError(null); }
  }, [mainUrl, platform, t]);
  
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!urlError && (mainUrl.trim() || files.length > 0)) {
      onSubmit({ mainUrl, additionalUrls, files });
      // Reset form after submission
      setMainUrl('');
      setAdditionalUrls(['']);
      setFiles([]);
    }
  };

  const handleAdditionalUrlChange = (index: number, value: string) => {
    const newUrls = [...additionalUrls];
    newUrls[index] = value;
    setAdditionalUrls(newUrls);
  };
  
  const addAdditionalUrl = () => {
    setAdditionalUrls([...additionalUrls, '']);
  };

  const removeAdditionalUrl = (index: number) => {
    setAdditionalUrls(additionalUrls.filter((_, i) => i !== index));
  };
  
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) { setFiles(prevFiles => [...prevFiles, ...Array.from(e.target.files!)]); }
  };

  const removeFile = (index: number) => {
      setFiles(files.filter((_, i) => i !== index));
  };

  const handlePaste = (event: React.ClipboardEvent<HTMLDivElement>) => {
    const items = event.clipboardData?.items;
    if (!items) return;

    const filesToAdd: File[] = [];
    for (let i = 0; i < items.length; i++) {
        if (items[i].kind === 'file' && items[i].type.startsWith('image/')) {
            const file = items[i].getAsFile();
            if (file) {
                const newFile = new File([file], `screenshot-${Date.now()}.${file.type.split('/')[1]}`, { type: file.type });
                filesToAdd.push(newFile);
            }
        }
    }
    if (filesToAdd.length > 0) {
        event.preventDefault();
        setFiles(prevFiles => [...prevFiles, ...filesToAdd]);
    }
  };
  
  const handleConfirmDownload = (htmlContent: string) => {
    const urlSlug = mainUrl.split('/').pop()?.split('?')[0] || 'fetched-page';
    const fileName = `${urlSlug.replace(/[^a-zA-Z0-9-]/g, '-')}.html`;
    const file = new File([htmlContent], fileName, { type: 'text/html' });
    setFiles(prev => [...prev, file]);
  };

  return (
    <>
      <form onSubmit={handleSubmit} className="space-y-6">
         <div>
          <label htmlFor="broker-select" className="block text-base font-semibold text-textDark mb-2">{t('tenderAnalysis.brokerLabel')}</label>
            <CustomSelect 
                options={analystOptions} 
                value={selectedAnalystId} 
                onChange={setSelectedAnalystId} 
                placeholder={t('tenderAnalysis.brokerSelectPlaceholder')} 
                disabled={user?.role === 'broker'} 
            />
        </div>

        <div>
          <label className="block text-base font-semibold text-textDark mb-2">{t('tenderAnalysis.mainUrlLabel')}</label>
          <div className="flex items-stretch gap-2">
              <input type="url" value={mainUrl} onChange={(e) => setMainUrl(e.target.value)} placeholder={platform === 'xt' ? "https://xt-xarid.uz/procedure/..." : "https://xarid.uzex.uz/ru/trade/lot/..."} className={`flex-grow w-full px-4 py-3 bg-white/20 text-textDark border rounded-xl focus:ring-2 focus:border-primary transition duration-200 ${urlError ? 'border-red-500 focus:ring-red-500' : 'border-transparent focus:ring-primary'}`} required={files.length === 0} />
               <button type="button" onClick={() => setIsPreviewOpen(true)} disabled={!mainUrl.trim() || !!urlError} className="px-4 py-2 text-sm bg-white/20 text-textDark font-bold rounded-xl hover:bg-white/40 transition-colors disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap">
                    {t('tenderAnalysis.previewAndDownload')}
                </button>
          </div>
          {urlError && <p className="text-sm text-red-600 mt-2">{urlError}</p>}
        </div>

        <div>
            <label className="block text-base font-semibold text-textDark mb-2">{t('tenderAnalysis.additionalUrlsLabel')}</label>
            <div className="space-y-2">
              {additionalUrls.map((url, index) => (
                  <div key={index} className="flex items-center gap-2">
                      <input type="url" value={url} onChange={(e) => handleAdditionalUrlChange(index, e.target.value)} placeholder="https://example.com/document.pdf" className="w-full px-4 py-2 bg-white/20 text-textDark border border-transparent rounded-lg focus:ring-2 focus:ring-primary focus:border-primary transition duration-200" />
                      {additionalUrls.length > 1 && <TrashIcon onClick={() => removeAdditionalUrl(index)} />}
                  </div>
              ))}
            </div>
            <button type="button" onClick={addAdditionalUrl} className="mt-2 px-4 py-2 text-sm border border-dashed border-white/20 text-textLight rounded-lg hover:bg-white/10 hover:border-white/40 transition-colors">+ {t('tenderAnalysis.addUrlButton')}</button>
        </div>

        <div>
          <label className="block text-base font-semibold text-textDark mb-2">{t('tenderAnalysis.uploadDocsLabel')}</label>
          <div onPaste={handlePaste} tabIndex={0} className="border-2 border-dashed border-white/20 rounded-xl p-6 text-center focus:outline-none focus:ring-2 focus:ring-primary bg-white/10 hover:border-white/40 transition-colors">
              <input type="file" multiple onChange={handleFileChange} id="file-upload" className="hidden" />
              <label htmlFor="file-upload" className="cursor-pointer text-primary font-bold hover:underline">{t('tenderAnalysis.selectFilesButton')}</label>
              <p className="text-xs text-textLight mt-1">{t('tenderAnalysis.fileTypesHint')}</p>
          </div>
          {files.length > 0 && (
              <div className="mt-4 space-y-2">
                  <h4 className="text-sm font-semibold text-textLight">{t('tenderAnalysis.uploadedFilesLabel')}:</h4>
                  {files.map((file, index) => (
                      <div key={index} className="flex items-center justify-between p-2 bg-white/10 rounded-lg">
                          <div className="flex items-center gap-2 text-sm text-textDark"><FileIcon /><span>{file.name}</span><span className="text-xs text-textLight">({(file.size / 1024).toFixed(1)} KB)</span></div>
                          <TrashIcon onClick={() => removeFile(index)} />
                      </div>
                  ))}
              </div>
          )}
        </div>

        <button type="submit" disabled={!!urlError || (!mainUrl.trim() && files.length === 0)} className="w-full flex items-center justify-center gap-2 px-6 py-4 bg-primary text-white text-lg font-extrabold rounded-xl hover:bg-primary-dark focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary transition duration-200 disabled:bg-primary/60 disabled:cursor-not-allowed shadow-lg hover:shadow-primary/40">
           <SearchIcon /> {t('tenderAnalysis.analyzeButton')}
        </button>
      </form>
      
      <PreviewModal
        isOpen={isPreviewOpen}
        onClose={() => setIsPreviewOpen(false)}
        url={mainUrl}
        onConfirmDownload={handleConfirmDownload}
      />
    </>
  );
};