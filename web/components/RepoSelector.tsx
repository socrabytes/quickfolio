import React, { useState, ChangeEvent, FormEvent } from 'react';

interface RepoSelectorProps {
  onRepoSelected: (repoName: string) => void;
  githubUsername?: string; // To prefill or suggest repo names
  installationId?: number | null; // GitHub App installation ID
}

const RepoSelector: React.FC<RepoSelectorProps> = ({ 
  onRepoSelected, 
  githubUsername = '',
  installationId = null
}) => {
  const [repoName, setRepoName] = useState<string>('');
  const [repoType, setRepoType] = useState<'userPage' | 'projectPage'>('projectPage');

  const handleInputChange = (event: ChangeEvent<HTMLInputElement>) => {
    setRepoName(event.target.value.trim());
  };

  const handleRepoTypeChange = (event: ChangeEvent<HTMLSelectElement>) => {
    setRepoType(event.target.value as 'userPage' | 'projectPage');
    // Reset repo name or update based on type if needed
    if (event.target.value === 'userPage') {
      setRepoName(`${githubUsername}.github.io`);
    } else {
      setRepoName('');
    }
  };

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (repoName) {
      const fullRepoName = repoType === 'projectPage' ? `${githubUsername}/${repoName}` : repoName;
      onRepoSelected(fullRepoName);
    }
  };

  const newRepoUrl = 'https://github.com/new';

  return (
    <div className="space-y-4 p-4 bg-gray-800 text-white rounded-lg shadow-lg">
      <h3 className="text-xl font-semibold mb-3">Select or Create GitHub Repository</h3>

      <div>
        <label htmlFor="repoType" className="block text-sm font-medium text-gray-300 mb-1">
          Repository Type:
        </label>
        <select
          id="repoType"
          value={repoType}
          onChange={handleRepoTypeChange}
          className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
        >
          <option value="projectPage">Project Repository (e.g., {githubUsername}/my-portfolio)</option>
          <option value="userPage">User/Organization Site (e.g., {githubUsername}.github.io)</option>
        </select>
        <p className="text-xs text-gray-400 mt-1">
          {repoType === 'userPage' 
            ? `This will be your main GitHub Pages site at ${githubUsername}.github.io` 
            : `This will deploy to ${githubUsername}.github.io/[repository-name]`}
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-3">
        <div>
          <label htmlFor="repoName" className="block text-sm font-medium text-gray-300 mb-1">
            {repoType === 'projectPage' ? 'Repository Name:' : 'GitHub Pages Site:'}
          </label>
          <div className="flex rounded-md shadow-sm">
            {repoType === 'projectPage' && (
              <span className="inline-flex items-center px-3 rounded-l-md border border-r-0 border-gray-600 bg-gray-700 text-gray-400 sm:text-sm">
                {githubUsername}/
              </span>
            )}
            <input
              type="text"
              name="repoName"
              id="repoName"
              value={repoName}
              onChange={handleInputChange}
              disabled={repoType === 'userPage'}
              className={`flex-1 min-w-0 block w-full px-3 py-2 bg-gray-700 border border-gray-600 focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm ${repoType === 'projectPage' ? 'rounded-none rounded-r-md' : 'rounded-md'}`}
              placeholder={repoType === 'projectPage' ? 'my-awesome-portfolio' : ''}
              required
            />
          </div>
          {repoType === 'userPage' && (
            <p className="mt-1 text-xs text-gray-400">
              This will be your main GitHub Pages site: {githubUsername}.github.io.
            </p>
          )}
        </div>

        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-2 sm:space-y-0 sm:space-x-3">
          <button
            type="submit"
            className="w-full sm:w-auto inline-flex justify-center items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-800 focus:ring-indigo-500 transition-colors duration-150"
          >
            Use This Repository
          </button>
          <a
            href={newRepoUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="w-full sm:w-auto inline-flex justify-center items-center px-4 py-2 border border-gray-600 text-sm font-medium rounded-md text-gray-300 bg-gray-700 hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-800 focus:ring-indigo-500 transition-colors duration-150"
          >
            Create New Repository on GitHub
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 ml-1.5" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M10.293 3.293a1 1 0 011.414 0l6 6a1 1 0 010 1.414l-6 6a1 1 0 01-1.414-1.414L14.586 11H3a1 1 0 110-2h11.586l-4.293-4.293a1 1 0 010-1.414z" clipRule="evenodd" />
            </svg>
          </a>
        </div>
      </form>
      <p className="text-xs text-gray-400">
        Quickfolio needs access to a specific repository. If you don&apos;t have one yet, you can create it on GitHub.
        The app will later request permission for this single repository.
      </p>
    </div>
  );
};

export default RepoSelector;
