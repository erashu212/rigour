import React, { useState, useMemo } from 'react';
import { Folder, FolderOpen, FileJson, ChevronDown, ChevronRight, AlertCircle, FileCode } from 'lucide-react';

interface TreeNode {
    name: string;
    path: string;
    isDirectory: boolean;
    children: TreeNode[];
    isViolated: boolean;
}

interface FileTreeProps {
    files: string[];
    onSelect: (file: string) => void;
    activeFile?: string;
    violatedFiles?: string[];
}

const buildTree = (files: string[], violatedFiles: string[]): TreeNode[] => {
    const root: TreeNode[] = [];

    files.forEach(file => {
        const parts = file.split('/');
        let currentLevel = root;
        let cumulativePath = '';

        parts.forEach((part, index) => {
            cumulativePath = cumulativePath ? `${cumulativePath}/${part}` : part;
            const isDirectory = index < parts.length - 1;
            let node = currentLevel.find(n => n.name === part);

            if (!node) {
                node = {
                    name: part,
                    path: cumulativePath,
                    isDirectory,
                    children: [],
                    isViolated: violatedFiles.some(vf => vf === cumulativePath || vf.startsWith(`${cumulativePath}/`))
                };
                currentLevel.push(node);
            }
            currentLevel = node.children;
        });
    });

    // Sort: Folders first, then alphabetically
    const sortNodes = (nodes: TreeNode[]) => {
        nodes.sort((a, b) => {
            if (a.isDirectory && !b.isDirectory) return -1;
            if (!a.isDirectory && b.isDirectory) return 1;
            return a.name.localeCompare(b.name);
        });
        nodes.forEach(n => sortNodes(n.children));
    };

    sortNodes(root);
    return root;
};

interface TreeItemProps {
    node: TreeNode;
    level: number;
    onSelect: (file: string) => void;
    activeFile?: string;
}

const TreeItem: React.FC<TreeItemProps> = ({ node, level, onSelect, activeFile }) => {
    const [isExpanded, setIsExpanded] = useState(level === 0);
    const isActive = activeFile === node.path;

    const toggle = (e: React.MouseEvent) => {
        e.stopPropagation();
        if (node.isDirectory) {
            setIsExpanded(!isExpanded);
        } else {
            onSelect(node.path);
        }
    };

    return (
        <div className="tree-node-container">
            <div
                className={`tree-item ${isActive ? 'active' : ''} ${node.isViolated ? 'violated' : ''}`}
                style={{ paddingLeft: `${level * 12 + 8}px` }}
                onClick={toggle}
            >
                {node.isDirectory ? (
                    <>
                        {isExpanded ? <ChevronDown size={14} className="chevron" /> : <ChevronRight size={14} className="chevron" />}
                        {isExpanded ? <FolderOpen size={14} className="folder-icon" /> : <Folder size={14} className="folder-icon" />}
                    </>
                ) : (
                    <FileCode size={14} className="file-icon" />
                )}
                <span className="node-name" title={node.path}>{node.name}</span>
                {node.isViolated && <AlertCircle size={12} className="violation-icon" />}
            </div>
            {node.isDirectory && isExpanded && (
                <div className="tree-children">
                    {node.children.map(child => (
                        <TreeItem
                            key={child.path}
                            node={child}
                            level={level + 1}
                            onSelect={onSelect}
                            activeFile={activeFile}
                        />
                    ))}
                </div>
            )}
        </div>
    );
};

export const FileTree: React.FC<FileTreeProps> = ({
    files,
    onSelect,
    activeFile,
    violatedFiles = []
}) => {
    const tree = useMemo(() => buildTree(files, violatedFiles), [files, violatedFiles]);

    return (
        <div className="file-tree">
            <div className="tree-header">
                <Folder size={14} />
                <span>Project Explorer</span>
            </div>
            <div className="tree-list">
                {tree.length === 0 ? (
                    <div className="empty-tree-state">No files found</div>
                ) : (
                    tree.map(node => (
                        <TreeItem
                            key={node.path}
                            node={node}
                            level={0}
                            onSelect={onSelect}
                            activeFile={activeFile}
                        />
                    ))
                )}
            </div>
        </div>
    );
};
