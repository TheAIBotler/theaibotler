// app/(marketing)/projects/page.tsx
import Link from 'next/link';

export default function ProjectsPage() {
  const projects = [
    {
      title: "www.theaibotler.com",
      description: "My blog",
      model: "Claude 3.7 Sonnet",
      year: 2025,
      projectUrl: "/",
      blogPostUrl: "/blog/building-my-website-with-claude"
    }
  ];

  return (
    <main className="min-h-screen max-w-4xl mx-auto p-8">
      <h1 className="text-4xl font-bold">Projects</h1>
      <p className="mt-4 mb-8 text-gray-600 dark:text-gray-300">
        A collection of my AI-powered projects and experiments.
      </p>

      <div className="grid gap-6">
        {projects.map((project, index) => (
          <div 
            key={index} 
            className="border border-gray-200 dark:border-gray-700 rounded-lg p-6 hover:shadow-md transition-shadow"
          >
            <Link href={project.projectUrl}>
              <h2 className="text-xl font-bold mb-2 text-blue-600 dark:text-blue-400 hover:underline">{project.title}</h2>
            </Link>
            <p className="text-gray-600 dark:text-gray-300 mb-4">{project.description}</p>
            
            <div className="flex flex-wrap gap-2 mb-4">
              <span className="bg-purple-100 dark:bg-purple-900 text-purple-800 dark:text-purple-200 text-xs px-3 py-1 rounded-full">
                {project.model}
              </span>
            </div>
            
            <div className="flex justify-between items-center">
              <div className="text-sm text-gray-500 dark:text-gray-400">
                {project.year}
              </div>
              <Link 
                href={project.blogPostUrl}
                className="text-sm text-blue-600 dark:text-blue-400 hover:underline"
              >
                Read about this project
              </Link>
            </div>
          </div>
        ))}
      </div>
    </main>
  );
}