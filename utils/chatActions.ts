import { supabase } from "@/lib/supabase";

export const saveActionMessage = async (
  roomId: string,
  senderId: string,
  message: string,
  type: "community" | "single",
) => {
  const { data: messageData, error } = await supabase
    .from("messages")
    .insert([
      {
        room_id: roomId,
        sender_id: senderId,
        message: message,
        is_action: true,
        type: type,
      },
    ])
    .select()
    .single();

  if (error) {
    console.error("Error saving action message:", error);
    return null;
  }

  return messageData;
};