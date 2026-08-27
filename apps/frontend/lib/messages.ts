type ParsedMessageContent = {
  text?: string;
  options?: Array<{ title: string; value: string }>;
  isOptions?: boolean;
};

export function displayMessageContent(content?: string | null) {
  if (!content) return "";

  try {
    if (content.startsWith("{") && content.includes('"isOptions"')) {
      const parsed = JSON.parse(content) as ParsedMessageContent;
      return parsed.text || content;
    }
  } catch {
    return content;
  }

  return content;
}

export function parseMessageOptions(content?: string | null) {
  if (!content) return { text: "", options: [] as Array<{ title: string; value: string }> };

  try {
    if (content.startsWith("{") && content.includes('"isOptions"')) {
      const parsed = JSON.parse(content) as ParsedMessageContent;
      return {
        text: parsed.text || content,
        options: parsed.options || []
      };
    }
  } catch {
    return { text: content, options: [] };
  }

  return { text: content, options: [] };
}
