import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { FiArrowLeft, FiExternalLink, FiEye, FiCopy, FiCode, FiCalendar, FiUser } from 'react-icons/fi';
import toast from 'react-hot-toast';
import Layout from '@components/Layout';
import CodeEditor from '@components/CodeEditor';
import LikeButton from '@components/LikeButton';
import CopyButton from '@components/CopyButton';
import LoadingSpinner from '@components/LoadingSpinner';
import { formatDate, formatNumber } from '@lib/utils';
import supabase from '@lib/supabase';

export default function SnippetDetail() {
  const router = useRouter();
  const { id } = router.query;
  
  const [snippet, setSnippet] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  // Fetch snippet data and increment view count
  useEffect(() => {
    const fetchSnippet = async () => {
      if (!id) return;
      
      try {
        setIsLoading(true);
        setError(null);
        
        // Fetch the snippet data
        const { data, error } = await supabase
          .from('snippets')
          .select('*')
          .eq('id', id)
          .single();
        
        if (error) throw error;
        
        if (!data) {
          setError('Snippet not found');
          return;
        }
        
        setSnippet(data);
        
        // Increment view count via API to handle duplicate views
        try {
          await fetch(`/api/views/${id}`, { method: 'POST' });
        } catch (viewError) {
          console.error('Error incrementing view count:', viewError);
          // Non-critical error, don't set error state
        }
        
      } catch (err) {
        console.error('Error fetching snippet:', err);
        setError(err.message || 'Failed to load snippet');
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchSnippet();
  }, [id]);

  // Handle like count changes
  const handleLikeChange = (isLiked, newCount) => {
    if (snippet) {
      setSnippet(prev => ({
        ...prev,
        likes_count: newCount
      }));
    }
  };

  // Copy snippet link to clipboard
  const copyLink = () => {
    const url = window.location.href;
    navigator.clipboard.writeText(url);
    toast.success('Link copied to clipboard!');
  };

  if (isLoading) {
    return (
      <Layout title="Loading Snippet - CodeSnapX">
        <div className="flex justify-center items-center min-h-[50vh]">
          <LoadingSpinner size="xl" text="Loading snippet..." />
        </div>
      </Layout>
    );
  }

  if (error || !snippet) {
    return (
      <Layout title="Snippet Not Found - CodeSnapX">
        <div className="text-center py-16">
          <h1 className="text-3xl font-bold mb-4">Snippet Not Found</h1>
          <p className="text-gray-400 mb-8">
            The snippet you are looking for doesn't exist or has been removed.
          </p>
          <Link href="/">
            <button className="btn btn-primary">
              <FiArrowLeft className="mr-2" /> Back to Home
            </button>
          </Link>
        </div>
      </Layout>
    );
  }

  return (
    <Layout title={`${snippet.title || 'Untitled Snippet'} - CodeSnapX`}>
      <div className="max-w-5xl mx-auto">
        {/* Back button */}
        <div className="mb-6">
          <button
            onClick={() => router.back()}
            className="text-gray-400 hover:text-white flex items-center"
          >
            <FiArrowLeft className="mr-2" /> Back
          </button>
        </div>
        
        {/* Snippet header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">{snippet.title || 'Untitled Snippet'}</h1>
          
          {snippet.description && (
            <p className="text-gray-300 mb-4">{snippet.description}</p>
          )}
          
          <div className="flex flex-wrap items-center text-sm text-gray-400 gap-x-6 gap-y-2">
            {snippet.author && (
              <div className="flex items-center">
                <FiUser className="mr-1" />
                <span className="flex items-center">
                  {snippet.author}
                  {snippet.is_verified && (
                    <span className="inline-flex ml-1 items-center text-blue-500" title="Verified author">
                      <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd"></path>
                      </svg>
                    </span>
                  )}
                </span>
              </div>
            )}
            
            <div className="flex items-center">
              <FiCode className="mr-1" />
              <span className="capitalize">{snippet.language || 'Plain Text'}</span>
            </div>
            
            <div className="flex items-center">
              <FiCalendar className="mr-1" />
              <span>{formatDate(snippet.created_at)}</span>
            </div>
            
            <div className="flex items-center">
              <FiEye className="mr-1" />
              <span>{formatNumber(snippet.views_count || 0)} views</span>
            </div>
          </div>
        </div>
        
        {/* Code editor */}
        <div className="mb-8">
          <CodeEditor
            code={snippet.content}
            language={snippet.language || 'plaintext'}
            readOnly={true}
            showLineNumbers={true}
            showCopyButton={true}
          />
        </div>
        
        {/* Action buttons */}
        <div className="flex flex-wrap justify-between items-center gap-4 mb-16">
          <div className="flex flex-wrap gap-2">
            <LikeButton 
              snippetId={snippet.id}
              initialLikesCount={snippet.likes_count || 0}
              onLikeChange={handleLikeChange}
              iconOnly={false}
            />
            
            <CopyButton
              text={snippet.content}
              className="btn btn-ghost"
              iconOnly={false}
              successMessage="Code copied to clipboard!"
            />
            
            <Link href={`/snippet/raw/${snippet.id}`} className="btn btn-ghost">
              <FiExternalLink className="mr-2" /> Raw View
            </Link>
          </div>
          
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={copyLink}
            className="btn btn-outline"
          >
            <FiCopy className="mr-2" /> Copy Link
          </motion.button>
        </div>
      </div>
    </Layout>
  );
}
