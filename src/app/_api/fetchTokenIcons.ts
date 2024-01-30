"use client";

import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";
import blobToBase64 from "./blobToBase64";

export default function fetchTokenIcons(tokens) {
  const supabase = createClientComponentClient();

  const promises = tokens.map(async (token) => {
    let tokenSymbol = token.underlying_symbol;
    if (tokenSymbol[0] === "c") {
      tokenSymbol = tokenSymbol.slice(1);
    }

    const { data, error } = await supabase.storage
      .from("token_icons")
      .download(tokenSymbol);

    if (error) {
      console.log(tokenSymbol, error);

      return null;
    }

    const base64Icon = await blobToBase64(data);
    return base64Icon;
  });

  return Promise.all(promises);
}
