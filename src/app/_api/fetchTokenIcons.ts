"use client";

import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";
import blobToBase64 from "./blobToBase64";
import { getTokenSymbol } from "../_utils/textHandling";

export default async function fetchTokenIcons(
  tokens,
  isObject = true,
  returnArray = true
) {
  const supabase = createClientComponentClient();

  const promises = tokens.map(async (token) => {
    let tokenSymbol = isObject
      ? getTokenSymbol(token.underlying_symbol)
      : getTokenSymbol(token);

    const { data, error } = await supabase.storage
      .from("token_icons")
      .download(tokenSymbol);

    if (error) {
      console.log(tokenSymbol, error);
      return { tokenSymbol, icon: null };
    }

    const base64Icon = await blobToBase64(data);
    return { tokenSymbol, icon: base64Icon };
  });

  const results = await Promise.all(promises);

  if (returnArray) {
    return results.map(({ icon }) => icon);
  }

  const iconMap = {};

  results.forEach(({ tokenSymbol, icon }) => {
    if (icon) {
      iconMap[tokenSymbol] = icon;
    }
  });

  return iconMap;
}
