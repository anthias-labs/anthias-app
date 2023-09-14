"use server";

export default async function fetchProtocolIcons(protocols, nameArray = false) {
  const directoryPath = "/protocolIcons";

  if (nameArray) {
    const icons = protocols.map((protocol) => {
      return `${directoryPath}/${protocol}.svg`;
    });

    return icons;
  } else {
    const icons = protocols.map((protocol) => {
      return `${directoryPath}/${protocol.name}.svg`;
    });

    return icons;
  }
}
