import supabase from '@lib/supabase';

// API route for listing and creating snippets
export default async function handler(req, res) {
  // Handle different HTTP methods
  switch (req.method) {
    case 'GET':
      return getSnippets(req, res);
    case 'POST':
      return createSnippet(req, res);
    default:
      return res.status(405).json({ error: 'Method not allowed' });
  }
}

// GET - List snippets with pagination and filtering
async function getSnippets(req, res) {
  try {
    // Parse query parameters
    const {
      page = 1,
      limit = 10,
      sort = 'created_at',
      order = 'desc',
      language,
      search,
    } = req.query;
    
    // Calculate pagination
    const from = (page - 1) * limit;
    const to = page * limit - 1;
    
    // Build query
    let query = supabase
      .from('snippets')
      .select('*', { count: 'exact' });
    
    // Apply language filter if provided
    if (language) {
      query = query.eq('language', language);
    }
    
    // Apply text search if provided
    if (search) {
      query = query.or(`title.ilike.%${search}%,content.ilike.%${search}%`);
    }
    
    // Apply sorting
    query = query.order(sort, { ascending: order === 'asc' });
    
    // Apply pagination
    query = query.range(from, to);
    
    // Execute query
    const { data, error, count } = await query;
    
    if (error) throw error;
    
    // Return data with pagination info
    return res.status(200).json({
      snippets: data,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: count,
        pages: Math.ceil(count / limit)
      }
    });
  } catch (error) {
    console.error('Error fetching snippets:', error);
    return res.status(500).json({ error: 'Failed to fetch snippets' });
  }
}

// POST - Create a new snippet
async function createSnippet(req, res) {
  try {
    const { id, title, content, language, description, is_private, user_id } = req.body;
    
    // Validate required fields
    if (!content) {
      return res.status(400).json({ error: 'Content is required' });
    }
    
    if (!title) {
      return res.status(400).json({ error: 'Title is required' });
    }
    
    // Insert into database
    const { data, error } = await supabase
      .from('snippets')
      .insert([
        {
          id,
          title,
          content,
          language: language || 'plaintext',
          description,
          is_private: is_private || false,
          user_id,
          views_count: 0,
          likes_count: 0
        }
      ])
      .select();
    
    if (error) throw error;
    
    return res.status(201).json(data[0]);
  } catch (error) {
    console.error('Error creating snippet:', error);
    return res.status(500).json({ error: 'Failed to create snippet' });
  }
}
