interface Token {
  protocol_names: string[];
}

export default function tokensToProtocolNames(tokens: Token[]): string[] {
  const protocolNames = new Set(
    tokens.flatMap((token) => token.protocol_names)
  );
  return Array.from(protocolNames);
}
