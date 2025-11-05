import { generateQdrantEmbeddings } from "../embeddings";
import { upsertToQdrant } from "../qdrant";
import * as Crypto from "expo-crypto";

interface ReportData {
  description: string;
  id: string;
  title: string;
  userId: string;
}

export const upsertReportToQdrant = async ({
  description,
  id,
  title,
  userId,
}: ReportData) => {
  try {
    const chunksWithEmbeddings = await generateQdrantEmbeddings(description);

    if (chunksWithEmbeddings.length > 0) {
      const points = chunksWithEmbeddings.map((item) => ({
        id: Crypto.randomUUID(),
        vector: item.embedding,
        payload: {
          report_id: id,
          title: title,
          content: item.content,
          user_id: userId,
        },
      }));
      await upsertToQdrant("reports", points);
      console.log(`Report ${id} upserted to Qdrant.`);
    }
  } catch (error) {
    console.error(`Error upserting report ${id} to Qdrant:`, error);
    // Re-throwing the error so the caller can handle it if needed
    throw error;
  }
};