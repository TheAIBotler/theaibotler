import { MetadataRoute } from 'next';

// Function to generate the sitemap
export default function sitemap(): MetadataRoute.Sitemap {
  // Base URL of the site
  const baseUrl = 'https://www.theaibotler.com';
  
  // Define the static routes
  const routes = [
    {
      url: `${baseUrl}`,
      lastModified: new Date(),
      changeFrequency: 'weekly' as const,
      priority: 1.0,
    },
    {
      url: `${baseUrl}/about`,
      lastModified: new Date(),
      changeFrequency: 'monthly' as const,
      priority: 0.8,
    },
    {
      url: `${baseUrl}/tools`,
      lastModified: new Date(),
      changeFrequency: 'weekly' as const,
      priority: 0.9,
    },
    {
      url: `${baseUrl}/blog`,
      lastModified: new Date(),
      changeFrequency: 'weekly' as const,
      priority: 0.8,
    },
  ];

  // In a real app, you'd also fetch dynamic routes like blog posts from your CMS or API
  // and add them to the sitemap
  
  return routes;
}