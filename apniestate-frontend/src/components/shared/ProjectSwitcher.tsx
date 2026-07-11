import { useState, useRef, useEffect } from 'react';
import { useProject } from '@/context/ProjectContext';
import { Building, ChevronDown, Check, FolderOpen } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export default function ProjectSwitcher() {
  const { projects, activeProjectId, activeProject, setActiveProjectId, loading } = useProject();
  const navigate = useNavigate();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  if (loading) return null;
  if (!projects || projects.length === 0) return null;

  const handleSelect = (id: string) => {
    setActiveProjectId(id);
    setIsOpen(false);
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center justify-between gap-3 px-3 py-2 bg-white hover:bg-slate-50 border border-slate-200 rounded-lg cursor-pointer transition-all duration-200 min-w-[200px] shadow-sm hover:shadow group"
      >
        <div className="flex items-center gap-3 overflow-hidden">
          <div className="w-8 h-8 rounded-md bg-blue-50 flex items-center justify-center flex-shrink-0 group-hover:bg-blue-100 transition-colors">
            <Building className="w-4 h-4 text-blue-600" />
          </div>
          <div className="flex flex-col items-start">
            <span className="text-sm font-semibold text-slate-800 whitespace-nowrap overflow-hidden text-ellipsis max-w-[130px]">
              {activeProject ? activeProject.name : 'Select Project'}
            </span>
            <span className="text-[10px] font-medium text-slate-500 uppercase tracking-wider">
              Project Workspace
            </span>
          </div>
        </div>
        <ChevronDown className={`w-4 h-4 text-slate-400 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {isOpen && (
        <div className="absolute top-[calc(100%+8px)] left-0 lg:left-auto lg:right-0 w-[280px] bg-white border border-slate-200 rounded-xl shadow-xl z-[1000] max-h-[400px] overflow-y-auto p-2 animate-in fade-in slide-in-from-top-2 duration-200">
          <div className="px-3 py-2 text-[11px] font-bold text-slate-400 uppercase tracking-wider">
            Your Projects
          </div>
          
          <div className="flex flex-col gap-1 mt-1">
            {projects.map((project) => {
              const isActive = activeProjectId === project.id;
              
              return (
                <button
                  key={project.id}
                  onClick={() => handleSelect(project.id)}
                  className={`w-full flex items-center justify-between px-3 py-2.5 rounded-lg cursor-pointer text-left transition-colors duration-150 ${isActive ? 'bg-blue-50 text-blue-700' : 'hover:bg-slate-50 text-slate-700'}`}
                >
                  <span className={`text-sm ${isActive ? 'font-semibold' : 'font-medium'}`}>{project.name}</span>
                  {isActive && <Check className="w-4 h-4 text-blue-600" />}
                </button>
              );
            })}
          </div>

          <div className="mt-2 pt-2 border-t border-slate-100">
            <button
              onClick={() => { setIsOpen(false); navigate('/projects'); }}
              className="w-full flex items-center gap-2 px-3 py-2.5 text-sm font-medium text-slate-600 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
            >
              <FolderOpen className="w-4 h-4" />
              View All Projects
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
