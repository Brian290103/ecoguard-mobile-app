import { generateEmbedding } from "../embeddings";
import { searchQdrant } from "../qdrant";

export const findRelevantAgencies = async (query: string) => {
  try {
    // 1. Generate embedding for the query
    const queryVector = await generateEmbedding(query);

    // 2. Search Qdrant
    const searchResult = await searchQdrant("agencies", queryVector, 5);

    // 3. Process results
    if (searchResult && searchResult.result) {
      const agencies = new Map<
        string,
        { id: string; name: string; logo: string; similarity: number }
      >();

      for (const point of searchResult.result) {
        const { agency_id, name, logo } = point.payload;
        const score = point.score;

        if (agency_id) {
          const existing = agencies.get(agency_id);
          if (!existing || existing.similarity < score) {
            agencies.set(agency_id, {
              id: agency_id,
              name,
              logo,
              similarity: score,
            });
          }
        }
      }

      const relevantAgencies = Array.from(agencies.values());

      relevantAgencies.sort((a, b) => b.similarity - a.similarity);

      return relevantAgencies;
    }

    return [];
  } catch (error) {
    console.error("Error finding relevant agencies:", error);
    throw error;
  }
};
