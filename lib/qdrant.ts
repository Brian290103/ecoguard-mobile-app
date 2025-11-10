const qdrantUrl =
  process.env.EXPO_PUBLIC_QDRANT_URL ||
  "https://ecoguard-qdrant.uisen-global.com";
// const qdrantUrl =
//   "http://qdrant-n8ww8400c8g88okoo4sok8gc.130.61.203.124.sslip.io/";
const qdrantApiKey =
  process.env.EXPO_PUBLIC_QDRANT_API_KEY || "RWJyeq5k0WdI9D9JfHcry1NoZrZv88y";

const collectionExists = async (collectionName: string): Promise<boolean> => {
  try {
    const response = await fetch(`${qdrantUrl}/collections/${collectionName}`, {
      method: "GET",
      headers: {
        "api-key": qdrantApiKey,
      },
    });
    return response.ok;
  } catch (error) {
    console.error(
      `Error checking if collection ${collectionName} exists:`,
      error,
    );
    return false;
  }
};

const createCollection = async (collectionName: string) => {
  try {
    const response = await fetch(`${qdrantUrl}/collections/${collectionName}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        "api-key": qdrantApiKey,
      },
      body: JSON.stringify({
        vectors: {
          size: 768, // from our embedding model
          distance: "Cosine",
        },
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      console.error(
        `Error creating collection ${collectionName}:`,
        JSON.stringify(errorData, null, 2),
      );
      throw new Error(
        `Failed to create collection: ${
          errorData.status?.error || response.statusText
        }`,
      );
    }
    console.log(`Collection ${collectionName} created successfully.`);
    return response.json();
  } catch (error) {
    console.error(
      `Exception during createCollection for ${collectionName}:`,
      error,
    );
    throw error;
  }
};

export const upsertToQdrant = async (collectionName: string, points: any[]) => {
  try {
    const exists = await collectionExists(collectionName);
    if (!exists) {
      await createCollection(collectionName);
    }

    const response = await fetch(
      `${qdrantUrl}/collections/${collectionName}/points?wait=true`,
      {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          "api-key": qdrantApiKey,
        },
        body: JSON.stringify({ points }),
      },
    );

    if (!response.ok) {
      const errorData = await response.json();
      console.error(
        "Error upserting to Qdrant:",
        JSON.stringify(errorData, null, 2),
      );
      throw new Error(
        `Failed to upsert to Qdrant: ${
          errorData.status?.error || response.statusText
        }`,
      );
    }

    return response.json();
  } catch (error) {
    console.error("Exception during upsertToQdrant:", error);
    throw error;
  }
};

export const searchQdrant = async (
  collectionName: string,
  vector: number[],
  limit: number = 5,
) => {
  try {
    const response = await fetch(
      `${qdrantUrl}/collections/${collectionName}/points/search`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "api-key": qdrantApiKey,
        },
        body: JSON.stringify({
          vector: vector,
          limit: limit,
          with_payload: true,
        }),
      },
    );

    if (!response.ok) {
      const errorData = await response.json();
      console.error(
        `Error searching in Qdrant collection ${collectionName}:`,
        JSON.stringify(errorData, null, 2),
      );
      throw new Error(
        `Failed to search Qdrant: ${
          errorData.status?.error || response.statusText
        }`,
      );
    }

    return response.json();
  } catch (error) {
    console.error(
      `Exception during searchQdrant for ${collectionName}:`,
      error,
    );
    throw error;
  }
};
