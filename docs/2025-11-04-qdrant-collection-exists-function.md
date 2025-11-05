# Qdrant Collection Exists Supabase Function

## WHAT

This document describes the creation of a Supabase edge function `qdrant-collection-exists`.

## WHY

The purpose of this function is to encapsulate the logic for checking if a collection exists in our Qdrant vector database. By moving this logic to a serverless function, we can call it from our mobile app without exposing Qdrant credentials.

## HOW

The function is implemented in `supabase/functions/qdrant-collection-exists/index.ts`. It receives a `collectionName` in the request body and uses it to make a GET request to the Qdrant collections endpoint. It returns a JSON object with a boolean `exists` property.
