"use server";

export default async function fetchProtocolTokenIcons(protocols) {
  const directoryPath = "/protocolTokenIcons";

  const icons = protocols.map((protocol) => {
    return `${directoryPath}/${protocol.chain}.svg`;
  });

  return icons;
}
