// Follow this setup guide to integrate the Deno language server with your editor:
// https://deno.land/manual/getting_started/setup_your_environment
// This enables autocomplete, go to definition, etc.

// Setup type definitions for built-in Supabase Runtime APIs
import "jsr:@supabase/functions-js/edge-runtime.d.ts";

console.log("Hello from qdrant-collection-exists function!");

// It's recommended to use environment variables for sensitive data
const qdrantUrl = "https://ecoguard-qdrant.uisen-global.com/";
const qdrantApiKey = "nBafoKpV7qHeFFk842u22wY12dP5PLkE";

Deno.serve(async (req) => {
  try {
    const { collectionName } = await req.json();

    if (!collectionName) {
      return new Response(
        JSON.stringify({ error: "collectionName is required" }),
        { status: 400, headers: { "Content-Type": "application/json" } },
      );
    }

    console.log(`Checking if collection "${collectionName}" exists...`);
    console.log(
      "ENV",
      Deno.env.get("EXPO_PUBLIC_GOOGLE_GENERATIVE_AI_API_KEY"),
    );

    const response = await fetch(`${qdrantUrl}collections/${collectionName}`, {
      method: "GET",
      headers: {
        "api-key": qdrantApiKey,
      },
    });

    const exists = response.ok;
    console.log(`Collection "${collectionName}" exists: ${exists}`);

    return new Response(JSON.stringify({ exists }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error(`Error in qdrant-collection-exists function:`, error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
});

/* To invoke locally:

  1. Run `supabase start` (see: https://supabase.com/docs/reference/cli/supabase-start)
  2. Make an HTTP request:

  curl -i --location --request POST 'http://127.0.0.1:54321/functions/v1/qdrant-collection-exists' \
    --header 'Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0' \
    --header 'Content-Type: application/json' \
    --data '{"collectionName":"your-collection-name"}'

*/
