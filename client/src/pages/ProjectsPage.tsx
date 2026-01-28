import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';

interface Project {
  id: string;
  name: string;
  description: string | null;
  createdAt: string;
}

export default function ProjectsPage() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [newProjectName, setNewProjectName] = useState('');
  const [newProjectDescription, setNewProjectDescription] = useState('');
  const [createdByEmail, setCreatedByEmail] = useState('louis.b.barber@accenture.com');
  const [creating, setCreating] = useState(false);
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<{ show: boolean; project: Project | null }>({
    show: false,
    project: null,
  });
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    loadProjects();
  }, []);

  const loadProjects = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/projects');
      const data = await response.json();
      if (data.success) {
        setProjects(data.projects);
      }
    } catch (error) {
      console.error('Failed to load projects:', error);
    } finally {
      setLoading(false);
    }
  };

  const createProject = async () => {
    if (!newProjectName.trim()) {
      alert('Project name is required');
      return;
    }
    if (!createdByEmail.trim()) {
      alert('Your email is required');
      return;
    }

    try {
      setCreating(true);
      const response = await fetch('/api/projects', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: newProjectName,
          description: newProjectDescription || null,
          createdBy: createdByEmail,
        }),
      });

      const data = await response.json();
      if (data.success) {
        setProjects([...projects, data.project]);
        setShowCreate(false);
        setNewProjectName('');
        setNewProjectDescription('');
        setCreatedByEmail('louis.b.barber@accenture.com');
      } else {
        alert(data.error || 'Failed to create project');
      }
    } catch (error) {
      console.error('Failed to create project:', error);
      alert('Failed to create project');
    } finally {
      setCreating(false);
    }
  };

  const deleteProject = async () => {
    if (!deleteConfirm.project) return;

    try {
      setDeleting(true);
      const response = await fetch(`/api/projects/${deleteConfirm.project.id}`, {
        method: 'DELETE',
      });

      const data = await response.json();
      if (data.success) {
        setProjects(projects.filter(p => p.id !== deleteConfirm.project!.id));
        setDeleteConfirm({ show: false, project: null });
      } else {
        alert(data.error || 'Failed to delete project');
      }
    } catch (error) {
      console.error('Failed to delete project:', error);
      alert('Failed to delete project');
    } finally {
      setDeleting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-protocol-primary"></div>
      </div>
    );
  }

  return (
    <div className="px-4 py-6 sm:px-0">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-protocol-text-primary">Projects</h1>
        <button
          onClick={() => setShowCreate(true)}
          className="px-4 py-2 bg-protocol-primary text-white rounded-lg hover:bg-protocol-primary-hover"
        >
          New Project
        </button>
      </div>

      {projects.length === 0 ? (
        <div className="bg-protocol-card border border-protocol-border rounded-lg shadow p-12 text-center">
          <h2 className="text-xl font-semibold text-protocol-text-primary mb-2">No Projects Yet</h2>
          <p className="text-protocol-text-secondary mb-6">Create your first project to get started</p>
          <button
            onClick={() => setShowCreate(true)}
            className="px-6 py-3 bg-protocol-primary text-white rounded-lg hover:bg-protocol-primary-hover"
          >
            Create Project
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {projects.map((project) => (
            <div
              key={project.id}
              className="bg-protocol-card border border-protocol-border rounded-lg shadow hover:shadow-lg transition-shadow p-6 relative"
            >
              {/* Three-dot menu */}
              <div className="absolute top-4 right-4">
                <button
                  onClick={(e) => {
                    e.preventDefault();
                    setOpenMenuId(openMenuId === project.id ? null : project.id);
                  }}
                  className="p-1 hover:bg-protocol-darker rounded"
                >
                  <svg className="w-5 h-5 text-protocol-text-secondary" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M10 6a2 2 0 110-4 2 2 0 010 4zM10 12a2 2 0 110-4 2 2 0 010 4zM10 18a2 2 0 110-4 2 2 0 010 4z" />
                  </svg>
                </button>

                {/* Dropdown menu */}
                {openMenuId === project.id && (
                  <>
                    {/* Backdrop to close menu */}
                    <div
                      className="fixed inset-0 z-10"
                      onClick={() => setOpenMenuId(null)}
                    />
                    <div className="absolute right-0 mt-2 w-48 bg-protocol-card border border-protocol-border rounded-md shadow-lg z-20">
                      <button
                        onClick={(e) => {
                          e.preventDefault();
                          setOpenMenuId(null);
                          setDeleteConfirm({ show: true, project });
                        }}
                        className="w-full text-left px-4 py-2 text-sm text-protocol-error hover:bg-protocol-darker flex items-center gap-2"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                        Delete Project
                      </button>
                    </div>
                  </>
                )}
              </div>

              {/* Project card content */}
              <Link to={`/projects/${project.id}`} className="block">
                <h3 className="text-lg font-semibold text-protocol-text-primary mb-2 pr-8">{project.name}</h3>
                {project.description && (
                  <p className="text-protocol-text-secondary text-sm mb-4">{project.description}</p>
                )}
                <p className="text-xs text-protocol-text-muted">
                  Created {new Date(project.createdAt).toLocaleDateString()}
                </p>
              </Link>
            </div>
          ))}
        </div>
      )}

      {/* Create Project Modal */}
      {showCreate && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-protocol-card border border-protocol-border rounded-lg shadow-xl max-w-md w-full p-6">
            <h2 className="text-xl font-bold text-protocol-text-primary mb-4">Create New Project</h2>

            <div className="mb-4">
              <label className="block text-sm font-medium text-protocol-text-secondary mb-2">
                Your Email <span className="text-protocol-error">*</span>
              </label>
              <input
                type="email"
                value={createdByEmail}
                onChange={(e) => setCreatedByEmail(e.target.value)}
                className="block w-full px-3 py-2 bg-protocol-input-bg border border-protocol-input-border text-protocol-text-primary rounded-md focus:outline-none focus:ring-2 focus:ring-protocol-primary"
                placeholder="e.g., john.doe@company.com"
                disabled={creating}
              />
            </div>

            <div className="mb-4">
              <label className="block text-sm font-medium text-protocol-text-secondary mb-2">
                Project Name <span className="text-protocol-error">*</span>
              </label>
              <input
                type="text"
                value={newProjectName}
                onChange={(e) => setNewProjectName(e.target.value)}
                className="block w-full px-3 py-2 bg-protocol-input-bg border border-protocol-input-border text-protocol-text-primary rounded-md focus:outline-none focus:ring-2 focus:ring-protocol-primary"
                placeholder="e.g., ACAPS Infrastructure Analysis"
                disabled={creating}
              />
            </div>

            <div className="mb-6">
              <label className="block text-sm font-medium text-protocol-text-secondary mb-2">
                Description (Optional)
              </label>
              <textarea
                value={newProjectDescription}
                onChange={(e) => setNewProjectDescription(e.target.value)}
                rows={3}
                className="block w-full px-3 py-2 bg-protocol-input-bg border border-protocol-input-border text-protocol-text-primary rounded-md focus:outline-none focus:ring-2 focus:ring-protocol-primary"
                placeholder="Brief description of the project..."
                disabled={creating}
              />
            </div>

            <div className="flex justify-end gap-3">
              <button
                onClick={() => {
                  setShowCreate(false);
                  setNewProjectName('');
                  setNewProjectDescription('');
                  setCreatedByEmail('louis.b.barber@accenture.com');
                }}
                className="px-4 py-2 text-protocol-text-secondary bg-protocol-darker rounded-md hover:bg-protocol-border"
                disabled={creating}
              >
                Cancel
              </button>
              <button
                onClick={createProject}
                className="px-4 py-2 bg-protocol-primary text-white rounded-md hover:bg-protocol-primary-hover disabled:opacity-50"
                disabled={creating || !newProjectName.trim() || !createdByEmail.trim()}
              >
                {creating ? 'Creating...' : 'Create Project'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteConfirm.show && deleteConfirm.project && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-protocol-card border border-protocol-border rounded-lg shadow-xl max-w-md w-full p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 rounded-full bg-protocol-darker flex items-center justify-center">
                <svg className="w-6 h-6 text-protocol-error" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
              </div>
              <div>
                <h2 className="text-xl font-bold text-protocol-text-primary">Delete Project?</h2>
                <p className="text-sm text-protocol-text-secondary">This action cannot be undone</p>
              </div>
            </div>

            <div className="mb-6 bg-protocol-darker p-4 rounded border border-protocol-border">
              <p className="text-sm text-protocol-text-secondary mb-2">
                You are about to delete:
              </p>
              <p className="font-semibold text-protocol-text-primary">{deleteConfirm.project.name}</p>
              {deleteConfirm.project.description && (
                <p className="text-sm text-protocol-text-secondary mt-1">{deleteConfirm.project.description}</p>
              )}
            </div>

            <p className="text-sm text-protocol-text-secondary mb-6">
              This will permanently delete the project and all associated data including:
            </p>
            <ul className="text-sm text-protocol-text-secondary mb-6 space-y-1 pl-5 list-disc">
              <li>All branches</li>
              <li>All analysis sessions</li>
              <li>All generated POCs</li>
              <li>All uploaded files</li>
            </ul>

            <div className="flex justify-end gap-3">
              <button
                onClick={() => setDeleteConfirm({ show: false, project: null })}
                className="px-4 py-2 text-protocol-text-secondary bg-protocol-darker rounded-md hover:bg-protocol-border"
                disabled={deleting}
              >
                Cancel
              </button>
              <button
                onClick={deleteProject}
                className="px-4 py-2 bg-protocol-error text-white rounded-md hover:bg-red-700 disabled:opacity-50 flex items-center gap-2"
                disabled={deleting}
              >
                {deleting ? (
                  <>
                    <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                    </svg>
                    Deleting...
                  </>
                ) : (
                  <>
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                    Delete Project
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
