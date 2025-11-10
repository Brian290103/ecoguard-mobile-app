import { createGoogleGenerativeAI } from "@ai-sdk/google";
import { embed, embedMany } from "ai";
import { supabase } from "./supabase";

const google = createGoogleGenerativeAI({
  apiKey: process.env.EXPO_PUBLIC_GOOGLE_GENERATIVE_AI_API_KEY,
});

const embeddingModel = google.textEmbedding("text-embedding-004");

export const generateChunks = (
  input: string,
  size = 1000,
  overlap = 200,
): string[] => {
  const text = input.trim().replace(/\s+/g, " "); // normalize spaces
  const chunks: string[] = [];
  let i = 0;

  while (i < text.length) {
    const end = i + size;
    chunks.push(text.slice(i, end));
    i += size - overlap; // slide forward with overlap
  }

  return chunks;
};

export const generateEmbeddings = async (
  value: string,
  referenceId: string,
  referenceTable: string,
): Promise<Array<{ embedding: number[]; content: string }>> => {
  const chunks = generateChunks(value);

  const results: Array<{ embedding: number[]; content: string }> = [];

  // Batch size limit
  const BATCH_SIZE = 100;

  for (let i = 0; i < chunks.length; i += BATCH_SIZE) {
    const batch = chunks.slice(i, i + BATCH_SIZE);

    const { embeddings } = await embedMany({
      model: embeddingModel,
      values: batch,
      providerOptions: {
        google: {
          dimensions: 768,
        },
      },
    });

    const embeddingValues = embeddings.map((e, idx) => ({
      content: batch[idx],
      embedding: `[${e.join(",")}]`, // Format the embedding as a PostGIS vector string
      reference_id: referenceId,
      reference_table: referenceTable,
    }));

    const { data, error } = await supabase
      .from("embeddings")
      .insert(embeddingValues);

    if (error) {
      console.error("Error inserting embeddings:", error);
      // Depending on desired error handling, you might want to throw or return null
    }

    embeddings.forEach((e, idx) => {
      results.push({ content: batch[idx], embedding: e });
    });
  }

  return results;
};

export const generateQdrantEmbeddings = async (
  value: string,
): Promise<{ content: string; embedding: number[] }[]> => {
  const chunks = generateChunks(value);

  const results: { content: string; embedding: number[] }[] = [];

  // Batch size limit
  const BATCH_SIZE = 100;

  for (let i = 0; i < chunks.length; i += BATCH_SIZE) {
    const batch = chunks.slice(i, i + BATCH_SIZE);

    const { embeddings } = await embedMany({
      model: embeddingModel,
      values: batch,
      providerOptions: {
        google: {
          dimensions: 768,
        },
      },
    });

    embeddings.forEach((e, idx) => {
      results.push({ content: batch[idx], embedding: e });
    });
  }

  return results;
};

export const generateEmbedding = async (value: string): Promise<number[]> => {
  const input = value.replaceAll("\n", " ");
  const { embedding } = await embed({
    model: embeddingModel,
    value: input,
    providerOptions: {
      google: {
        dimensions: 768, // 👈 force 768-dim instead of 3072
      },
    },
  });
  return embedding;
};

export const findRelevantContent = async (userQuery: string) => {
  // console.log("userQuery", userQuery);
  const userQueryEmbedded = await generateEmbedding(userQuery);

  const { data, error } = await supabase.rpc("match_documents", {
    query_embedding: userQueryEmbedded,
    match_threshold: 0.1, // You might want to adjust this threshold
    match_count: 4, // Limit to 4 as in the original query
  });

  if (error) {
    console.error("Error searching embeddings:", error);
    return null;
  }

  // console.log("similarGuides", data);
  return data;
};

export const findRelevantOrganizations = async (
  reportDescription: string,
): Promise<Array<{
  id: string;
  name: string;
  logo: string;
  similarity: number;
}> | null> => {
  console.log(
    "Finding relevant organizations for description:",
    reportDescription,
  );

  // Generate the embedding for the query
  const reportEmbedding = await generateEmbedding(reportDescription);
  console.log("Generated embedding vector of length:", reportEmbedding.length);

  // Use the report's embedding to query for similar content (organizations)
  const { data: similarContentData, error: similarContentError } =
    await supabase.rpc("match_documents", {
      query_embedding: reportEmbedding,
      match_threshold: 0.1, // Adjust as needed
      match_count: 20, // Get more to filter later
      // reference_table: "organizations",
    });

  if (similarContentError) {
    console.error("Error searching for similar content:", similarContentError);
    return null;
  }

  if (!similarContentData || similarContentData.length === 0) {
    return [];
  }

  // Filter results to only include organizations and fetch their details
  const organizationIds = similarContentData.map(
    (item: any) => item.reference_id,
  );

  const { data: organizationsData, error: organizationsError } = await supabase
    .from("organizations")
    .select("id, name, logo")
    .in("id", organizationIds);

  if (organizationsError) {
    console.error("Error fetching organizations:", organizationsError);
    return null;
  }

  if (!organizationsData || organizationsData.length === 0) {
    return [];
  }

  // Combine similarity scores with organization details
  const relevantOrganizations = organizationsData.map((org) => {
    const similarityMatch = similarContentData.find(
      (item: any) => item.reference_id === org.id,
    );
    return {
      id: org.id,
      name: org.name,
      logo: org.logo,
      similarity: similarityMatch ? similarityMatch.similarity : 0, // Assuming 'similarity' is returned by match_documents
    };
  });

  // Sort by similarity in descending order
  relevantOrganizations.sort((a, b) => b.similarity - a.similarity);

  return relevantOrganizations;
};
