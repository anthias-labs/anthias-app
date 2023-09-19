"use client";

import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";
import blobToBase64 from "./blobToBase64";

export default function fetchTokenIcons(tokens) {
  const supabase = createClientComponentClient();

  const promises = tokens.map(async (token) => {
    const { data, error } = await supabase.storage
      .from("token_icons")
      .download(`${token.underlying_symbol}`);

    if (error) {
      console.log(error);
    }

    const base64Icon = await blobToBase64(data);
    return base64Icon;
  });

  return Promise.all(promises);
}
