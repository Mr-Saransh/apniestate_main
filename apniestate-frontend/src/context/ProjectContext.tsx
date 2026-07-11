import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { projectsApi, type Project } from '@/api/projects';
import { useAuth } from '@/context/AuthContext';

interface ProjectContextType {
  projects: Project[];
  activeProjectId: string | null;
  activeProject: Project | null;
  setActiveProjectId: (id: string | null) => void;
  loading: boolean;
}

const ProjectContext = createContext<ProjectContextType | undefined>(undefined);

export function ProjectProvider({ children }: { children: ReactNode }) {
  const { token } = useAuth();
  const [projects, setProjects] = useState<Project[]>([]);
  const [activeProjectId, setActiveProjectId] = useState<string | null>(() => {
    return localStorage.getItem('activeProjectId');
  });
  const [loading, setLoading] = useState(true);

  // Load projects when authenticated
  useEffect(() => {
    let isMounted = true;
    
    const fetchProjects = async () => {
      if (!token) {
        setProjects([]);
        setActiveProjectId(null);
        setLoading(false);
        return;
      }
      
      try {
        setLoading(true);
        const res = await projectsApi.getAll();
        if (isMounted) {
          setProjects(res.data || []);
          if (res.data && res.data.length > 0) {
            const savedId = localStorage.getItem('activeProjectId');
            if (savedId && res.data.find(p => p.id === savedId)) {
              setActiveProjectId(savedId);
            } else if (!activeProjectId || !res.data.find(p => p.id === activeProjectId)) {
              setActiveProjectId(res.data[0].id);
            }
          } else {
            setActiveProjectId(null);
          }
        }
      } catch (err) {
        console.error("Failed to fetch projects for context:", err);
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    fetchProjects();

    return () => {
      isMounted = false;
    };
  }, [token]);

  // Persist active project to localStorage
  useEffect(() => {
    if (activeProjectId) {
      localStorage.setItem('activeProjectId', activeProjectId);
    } else {
      localStorage.removeItem('activeProjectId');
    }
  }, [activeProjectId]);

  const activeProject = projects.find(p => p.id === activeProjectId) || null;

  return (
    <ProjectContext.Provider value={{ projects, activeProjectId, activeProject, setActiveProjectId, loading }}>
      {children}
    </ProjectContext.Provider>
  );
}

export function useProject() {
  const context = useContext(ProjectContext);
  if (context === undefined) {
    throw new Error('useProject must be used within a ProjectProvider');
  }
  return context;
}

