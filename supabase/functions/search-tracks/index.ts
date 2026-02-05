 import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
 
 const corsHeaders = {
   'Access-Control-Allow-Origin': '*',
   'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
 };
 
 interface DeezerTrack {
   id: number;
   title: string;
   artist: { name: string };
   album: { title: string; cover_medium: string };
   preview: string;
 }
 
 interface SearchResult {
   id: string;
   name: string;
   artists: { name: string }[];
   album: { name: string; images: { url: string }[] };
   preview_url: string | null;
 }
 
 serve(async (req) => {
   // Handle CORS preflight
   if (req.method === 'OPTIONS') {
     return new Response(null, { headers: corsHeaders });
   }
 
   try {
     const { query } = await req.json();
 
     if (!query || typeof query !== 'string') {
       return new Response(
         JSON.stringify({ error: 'Query parameter is required' }),
         { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
       );
     }
 
     // Search Deezer API (no API key required!)
     const searchUrl = `https://api.deezer.com/search?q=${encodeURIComponent(query)}&limit=10`;
     const response = await fetch(searchUrl);
 
     if (!response.ok) {
       throw new Error(`Deezer API error: ${response.status}`);
     }
 
     const data = await response.json();
 
     // Transform Deezer response to our format (compatible with SpotifySearchResult)
     const tracks: SearchResult[] = (data.data || []).map((track: DeezerTrack) => ({
       id: String(track.id),
       name: track.title,
       artists: [{ name: track.artist.name }],
       album: {
         name: track.album.title,
         images: [{ url: track.album.cover_medium }],
       },
       preview_url: track.preview,
     }));
 
     return new Response(
       JSON.stringify({ tracks }),
       { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
     );
   } catch (error) {
     console.error('Search error:', error);
     return new Response(
       JSON.stringify({ error: error instanceof Error ? error.message : 'Search failed' }),
       { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
     );
   }
 });