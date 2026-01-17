import Link from 'next/link';
import Image from 'next/image';
import { query } from '@/lib/db';

interface BlogPost {
  id: number;
  slug: string;
  title: string;
  excerpt: string;
  featured_image: string | null;
  category: string;
  published_at: string;
  view_count: number;
}

async function getBlogPosts(): Promise<BlogPost[]> {
  try {
    const posts = await query<BlogPost[]>(
      `SELECT id, slug, title, excerpt, featured_image, category, published_at, view_count 
       FROM blog_posts 
       WHERE status = 'published' 
       ORDER BY published_at DESC 
       LIMIT 20`
    );
    return posts;
  } catch (error) {
    console.error('Error fetching blog posts:', error);
    return [];
  }
}

function formatDate(date: string) {
  return new Date(date).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
}

export default async function BlogPage() {
  const posts = await getBlogPosts();

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero Section */}
      <div className="bg-primary-600 text-white py-10">
        <div className="container mx-auto px-4">
          <h1 className="text-4xl font-bold mb-4">Smart Blinds Hub Blog</h1>
          <p className="text-xl text-primary-100">Tips, guides, and inspiration for your window treatments</p>
        </div>
      </div>

      {/* Blog Posts Grid */}
      <div className="container mx-auto px-4 py-12">
        {posts.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-gray-500 text-lg">No blog posts yet. Check back soon!</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {posts.map((post) => (
              <article key={post.id} className="bg-white rounded-xl shadow-sm overflow-hidden hover:shadow-md transition-shadow">
                <Link href={`/blog/${post.slug}`}>
                  <div className="aspect-video bg-gray-200 relative">
                    {post.featured_image ? (
                      <Image
                        src={post.featured_image}
                        alt={post.title}
                        fill
                        className="object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-gray-400">
                        <svg className="w-16 h-16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                      </div>
                    )}
                  </div>
                  <div className="p-6">
                    {post.category && (
                      <span className="text-xs font-medium text-primary-600 uppercase tracking-wide">
                        {post.category.replace('-', ' ')}
                      </span>
                    )}
                    <h2 className="text-xl font-semibold text-gray-900 mt-2 mb-3 line-clamp-2 hover:text-primary-600 transition-colors">
                      {post.title}
                    </h2>
                    <p className="text-gray-600 text-sm line-clamp-3 mb-4">
                      {post.excerpt}
                    </p>
                    <div className="flex items-center justify-between text-sm text-gray-500">
                      <span>{formatDate(post.published_at)}</span>
                      <span>{post.view_count.toLocaleString()} views</span>
                    </div>
                  </div>
                </Link>
              </article>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export const metadata = {
  title: 'Blog | Smart Blinds Hub',
  description: 'Expert tips, guides, and inspiration for window treatments. Learn about blinds, shades, shutters, and more.',
};
