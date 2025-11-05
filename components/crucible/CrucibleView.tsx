import React from 'react';
import { useCrucibleStore } from '../../stores/crucibleStore';
import CrucibleHome from './CrucibleHome';
import CrucibleSessionView from './CrucibleSessionView';

const CrucibleView: React.FC = () => {
    const { activeSessionId } = useCrucibleStore();

    return (
        <div className="h-full flex flex-col bg-slate-50 dark:bg-slate-900">
            {activeSessionId ? <CrucibleSessionView /> : <CrucibleHome />}
        </div>
    );
};

export default CrucibleView;
