import React, { useMemo } from 'react';
import { WikiEntry, MindMapNode as MindMapNodeData, WIKI_ROOT_ID } from '../../types';
import MindMap from '../studio/MindMap';

interface WikiGraphViewProps {
    wikis: WikiEntry[];
    history: WikiEntry[];
    onNodeSelect: (nodeId: string) => void;
}

const buildTree = (wikis: WikiEntry[], parentId: string | null): MindMapNodeData[] => {
    return wikis
      .filter(wiki => wiki.parentId === parentId)
      .sort((a, b) => a.createdAt - b.createdAt)
      .map(wiki => ({
        id: wiki.id,
        label: wiki.term,
        children: buildTree(wikis, wiki.id),
      }));
};

const WikiGraphView: React.FC<WikiGraphViewProps> = ({ wikis, history, onNodeSelect }) => {
    const treeData = useMemo(() => {
        return {
          root: {
            id: WIKI_ROOT_ID,
            label: "Wiki Home",
            children: buildTree(wikis, WIKI_ROOT_ID)
          }
        };
    }, [wikis]);

    const activeNodePath = useMemo(() => new Set(history.map(h => h.id)), [history]);

    return (
        <div className="flex-1 overflow-hidden p-6 md:p-8 animate-in fade-in">
             <MindMap
                data={treeData.root}
                onRegenerate={() => { /* No-op, regeneration is handled in article view */ }}
                isLoading={false}
                onNodeClick={onNodeSelect}
                activeNodePath={activeNodePath}
            />
        </div>
    );
};

export default WikiGraphView;
