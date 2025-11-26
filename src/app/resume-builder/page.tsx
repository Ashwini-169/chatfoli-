"use client";
import { useState, useEffect } from "react";
import { Provider } from "react-redux";
import { store } from "lib/redux/store";
import { ResumeForm } from "components/ResumeForm";
import { Resume } from "components/Resume";
import { AIChatbox, AIChatboxContent } from "components/AIChatbox";
import {
  useSetInitialStore,
  useSaveStateToLocalStorageOnChange,
} from "lib/redux/hooks";

type ViewMode = 'chat' | 'builder';
type ChatRole = 'general' | 'hr' | 'educator';

// Wrapper component to use hooks inside Provider
function ResumeBuilderContent() {
  // Initialize store from localStorage and set up auto-save
  useSetInitialStore();
  useSaveStateToLocalStorageOnChange();

  const [viewMode, setViewMode] = useState<ViewMode>('chat');
  const [selectedRole, setSelectedRole] = useState<ChatRole>('general');

  return (
    <main className="relative h-full w-full overflow-hidden bg-card">
      <div className="grid grid-cols-3 md:grid-cols-6">
        <div className="col-span-3">
          {viewMode === 'chat' ? (
            <AIChatboxContent 
              selectedRole={selectedRole} 
              setSelectedRole={setSelectedRole} 
            />
          ) : (
            <ResumeForm />
          )}
        </div>
        <div className="col-span-3">
          <Resume />
        </div>
      </div>
      <AIChatbox viewMode={viewMode} onModeChange={setViewMode} />
    </main>
  );
}

export default function Create() {
  return (
    <Provider store={store}>
      <ResumeBuilderContent />
    </Provider>
  );
}
