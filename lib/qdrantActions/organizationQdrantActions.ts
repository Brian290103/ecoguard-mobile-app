import { generateEmbedding, generateQdrantEmbeddings } from "../embeddings";
import { searchQdrant, upsertToQdrant } from "../qdrant";
import * as Crypto from "expo-crypto";

interface OrganizationData {
  about: string;
  id: string;
  name: string;
  userId: string;
  logo: string;
}

export const upsertOrganizationToQdrant = async ({
  about,
  id,
  name,
  userId,
  logo,
}: OrganizationData) => {
  try {
    const chunksWithEmbeddings = await generateQdrantEmbeddings(about);

    if (chunksWithEmbeddings.length > 0) {
      const points = chunksWithEmbeddings.map((item) => ({
        id: Crypto.randomUUID(),
        vector: item.embedding,
        payload: {
          organization_id: id,
          name: name,
          content: item.content,
          user_id: userId,
          logo: logo,
        },
      }));
      await upsertToQdrant("organizations", points);
      console.log(`Organization ${id} upserted to Qdrant.`);
    }
  } catch (error) {
    console.error(`Error upserting organization ${id} to Qdrant:`, error);
    throw error;
  }
};

export const findRelevantOrganizations = async (query: string) => {
  try {
    // 1. Generate embedding for the query
    const queryVector = await generateEmbedding(query);

    // 2. Search Qdrant
    const searchResult = await searchQdrant("organizations", queryVector, 5);

    // 3. Process results
    if (searchResult && searchResult.result) {
      const organizations = new Map<
        string,
        { id: string; name: string; logo: string; similarity: number }
      >();

      for (const point of searchResult.result) {
        const { organization_id, name, logo } = point.payload;
        const score = point.score;

        if (organization_id) {
          const existing = organizations.get(organization_id);
          if (!existing || existing.similarity < score) {
            organizations.set(organization_id, {
              id: organization_id,
              name,
              logo,
              similarity: score,
            });
          }
        }
      }

      const relevantOrgs = Array.from(organizations.values());

      relevantOrgs.sort((a, b) => b.similarity - a.similarity);

      return relevantOrgs;
    }

    return [];
  } catch (error) {
    console.error("Error finding relevant organizations:", error);
    throw error;
  }
};
