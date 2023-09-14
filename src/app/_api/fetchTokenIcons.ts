"use server";

import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";

export default async function fetchTokenIcons(tokens) {
  const supabase = createClientComponentClient();

  const promises = tokens.map(async (token: string) => {
    console.log("token name", token);

    const { data, error } = await supabase.storage
      .from("token_icons")
      .download(`${token.toString().toLowerCase()}`);

    if (error) {
      console.log(error);
    }

    return data;
  });

  return Promise.all(promises);
}
