import { notFound } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { query, execute } from '@/lib/db';
import fs from 'fs';
import path from 'path';
import matter from 'gray-matter';
import { marked } from 'marked';

interface BlogPost {
  id: number;
  slug: string;
  title: string;
  excerpt: string;
  file_path: string;
  featured_image: string | null;
  category: string;
  tags: string;
  published_at: string;
  view_count: number;
  seo_title: string | null;
  seo_description: string | null;
}

interface PageProps {
  params: Promise<{ slug: string }>;
}

async function getBlogPost(slug: string): Promise<{ post: BlogPost; content: string } | null> {
  try {
    const posts = await query<BlogPost[]>(
      `SELECT * FROM blog_posts WHERE slug = ? AND status = 'published'`,
      [slug]
    );
    
    if (!posts || posts.length === 0) {
      return null;
    }
    
    const post = posts[0];
    
    // Read markdown content from file
    let content = '';
    const contentPath = process.env.CONTENT_PATH || path.join(process.cwd(), 'content');
    const filePath = post.file_path || path.join(contentPath, 'blog', 'posts', `${slug}.md`);
    
    if (fs.existsSync(filePath)) {
      const fileContent = fs.readFileSync(filePath, 'utf-8');
      const { content: markdownContent } = matter(fileContent);
      content = marked(markdownContent) as string;
    }
    
    // Increment view count
    await execute('UPDATE blog_posts SET view_count = view_count + 1 WHERE id = ?', [post.id]);
    
    return { post, content };
  } catch (error) {
    console.error('Error fetching blog post:', error);
    return null;
  }
}

async function getRelatedPosts(category: string, currentSlug: string): Promise<BlogPost[]> {
  try {
    const posts = await query<BlogPost[]>(
      `SELECT id, slug, title, excerpt, featured_image, category, published_at 
       FROM blog_posts 
       WHERE status = 'published' AND category = ? AND slug != ?
       ORDER BY published_at DESC 
       LIMIT 3`,
      [category, currentSlug]
    );
    return posts;
  } catch (error) {
    console.error('Error fetching related posts:', error);
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

export async function generateMetadata({ params }: PageProps) {
  const { slug } = await params;
  const result = await getBlogPost(slug);
  
  if (!result) {
    return {
      title: 'Post Not Found | Smart Blinds Hub',
    };
  }
  
  return {
    title: result.post.seo_title || `${result.post.title} | Smart Blinds Hub Blog`,
    description: result.post.seo_description || result.post.excerpt,
    openGraph: {
      title: result.post.title,
      description: result.post.excerpt,
      images: result.post.featured_image ? [result.post.featured_image] : [],
    },
  };
}

export default async function BlogPostPage({ params }: PageProps) {
  const { slug } = await params;
  const result = await getBlogPost(slug);
  
  if (!result) {
    notFound();
  }
  
  const { post, content } = result;
  const tags = post.tags ? JSON.parse(post.tags) : [];
  const relatedPosts = await getRelatedPosts(post.category, slug);
  
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero Image */}
      {post.featured_image && (
        <div className="relative h-96 bg-gray-200">
          <Image
            src={post.featured_image}
            alt={post.title}
            fill
            className="object-cover"
            priority
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
        </div>
      )}
      
      <article className="container mx-auto px-4 py-12 max-w-4xl">
        {/* Breadcrumb */}
        <nav className="text-sm text-gray-500 mb-6">
          <Link href="/" className="hover:text-primary-600">Home</Link>
          <span className="mx-2">/</span>
          <Link href="/blog" className="hover:text-primary-600">Blog</Link>
          <span className="mx-2">/</span>
          <span className="text-gray-700">{post.title}</span>
        </nav>
        
        {/* Post Header */}
        <header className="mb-8">
          {post.category && (
            <Link 
              href={`/blog?category=${post.category}`}
              className="inline-block text-sm font-medium text-primary-600 uppercase tracking-wide mb-3 hover:text-primary-700"
            >
              {post.category.replace('-', ' ')}
            </Link>
          )}
          <h1 className="text-4xl font-bold text-gray-900 mb-4">{post.title}</h1>
          <div className="flex items-center gap-4 text-gray-500">
            <time dateTime={post.published_at}>{formatDate(post.published_at)}</time>
            <span>•</span>
            <span>{post.view_count.toLocaleString()} views</span>
          </div>
        </header>
        
        {/* Post Content */}
        <div 
          className="prose prose-lg max-w-none mb-12"
          dangerouslySetInnerHTML={{ __html: content || '<p>Content coming soon...</p>' }}
        />
        
        {/* Tags */}
        {tags.length > 0 && (
          <div className="flex flex-wrap gap-2 mb-12">
            {tags.map((tag: string) => (
              <Link
                key={tag}
                href={`/blog?tag=${tag}`}
                className="px-3 py-1 bg-gray-100 text-gray-600 rounded-full text-sm hover:bg-primary-100 hover:text-primary-700 transition-colors"
              >
                #{tag}
              </Link>
            ))}
          </div>
        )}
        
        {/* Share */}
        <div className="border-t border-b border-gray-200 py-6 mb-12">
          <p className="text-sm text-gray-500 mb-3">Share this article:</p>
          <div className="flex gap-3">
            <a
              href={`https://twitter.com/intent/tweet?text=${encodeURIComponent(post.title)}&url=${encodeURIComponent(`https://smartblindshub.com/blog/${slug}`)}`}
              target="_blank"
              rel="noopener noreferrer"
              className="px-4 py-2 bg-[#1DA1F2] text-white rounded-lg text-sm hover:bg-[#1a8cd8] transition-colors"
            >
              Twitter
            </a>
            <a
              href={`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(`https://smartblindshub.com/blog/${slug}`)}`}
              target="_blank"
              rel="noopener noreferrer"
              className="px-4 py-2 bg-[#4267B2] text-white rounded-lg text-sm hover:bg-[#365899] transition-colors"
            >
              Facebook
            </a>
            <a
              href={`https://www.linkedin.com/shareArticle?mini=true&url=${encodeURIComponent(`https://smartblindshub.com/blog/${slug}`)}&title=${encodeURIComponent(post.title)}`}
              target="_blank"
              rel="noopener noreferrer"
              className="px-4 py-2 bg-[#0077B5] text-white rounded-lg text-sm hover:bg-[#006097] transition-colors"
            >
              LinkedIn
            </a>
          </div>
        </div>
        
        {/* Related Posts */}
        {relatedPosts.length > 0 && (
          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-6">Related Articles</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {relatedPosts.map((relatedPost) => (
                <Link
                  key={relatedPost.id}
                  href={`/blog/${relatedPost.slug}`}
                  className="bg-white rounded-lg overflow-hidden shadow-sm hover:shadow-md transition-shadow"
                >
                  <div className="aspect-video bg-gray-200 relative">
                    {relatedPost.featured_image && (
                      <Image
                        src={relatedPost.featured_image}
                        alt={relatedPost.title}
                        fill
                        className="object-cover"
                      />
                    )}
                  </div>
                  <div className="p-4">
                    <h3 className="font-semibold text-gray-900 line-clamp-2 hover:text-primary-600">
                      {relatedPost.title}
                    </h3>
                  </div>
                </Link>
              ))}
            </div>
          </section>
        )}
      </article>
    </div>
  );
}
