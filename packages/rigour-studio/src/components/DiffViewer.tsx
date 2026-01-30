import React from 'react';
import { DiffEditor, Editor } from '@monaco-editor/react';
import { FileCode, X } from 'lucide-react';

interface DiffViewerProps {
    filename: string;
    originalCode: string;
    modifiedCode: string;
    onClose: () => void;
    theme?: 'dark' | 'light';
}

const getLanguage = (filename: string): string => {
    const ext = filename.split('.').pop()?.toLowerCase();
    const map: Record<string, string> = {
        ts: 'typescript', tsx: 'typescript', js: 'javascript', jsx: 'javascript',
        py: 'python', rb: 'ruby', rs: 'rust', go: 'go',
        json: 'json', yaml: 'yaml', yml: 'yaml', md: 'markdown',
        css: 'css', scss: 'scss', html: 'html', xml: 'xml',
        sql: 'sql', sh: 'shell', bash: 'shell', zsh: 'shell',
    };
    return map[ext || ''] || 'plaintext';
};

export const DiffViewer: React.FC<DiffViewerProps> = ({
    filename,
    originalCode,
    modifiedCode,
    onClose,
    theme = 'dark'
}) => {
    const isDiff = originalCode !== modifiedCode;
    const language = getLanguage(filename);
    const monacoTheme = theme === 'dark' ? 'vs-dark' : 'light';


    return (
        <div className="diff-viewer-overlay">
            <div className="diff-viewer-window">
                <div className="diff-viewer-header">
                    <div className="title">
                        <FileCode size={18} />
                        <span>{filename}</span>
                        {isDiff && <span className="diff-badge">Modified</span>}
                    </div>
                    <button onClick={onClose} className="close-btn">
                        <X size={20} />
                    </button>
                </div>
                <div className="diff-editor-container">
                    {isDiff ? (
                        <DiffEditor
                            height="100%"
                            language={language}
                            original={originalCode}
                            modified={modifiedCode}
                            theme={monacoTheme}
                            options={{
                                renderSideBySide: true,
                                readOnly: true,
                                minimap: { enabled: false },
                                scrollBeyondLastLine: false,
                                fontSize: 13,
                            }}
                        />
                    ) : (
                        <Editor
                            height="100%"
                            language={language}
                            value={modifiedCode}
                            theme={monacoTheme}
                            options={{
                                readOnly: true,
                                minimap: { enabled: false },
                                scrollBeyondLastLine: false,
                                fontSize: 13,
                                lineNumbers: 'on',
                            }}
                        />
                    )}
                </div>
            </div>
        </div>
    );
};
