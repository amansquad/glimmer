// #tags anywhere in a note's content become its constellation color.
// Requires a letter first and no space after '#' so markdown headings ("# Title") don't match.
const TAG_PATTERN = /#([a-zA-Z][a-zA-Z0-9_-]*)/g;

export function extractTags(content) {
  const tags = new Set();
  for (const match of content.matchAll(TAG_PATTERN)) {
    tags.add(match[1].toLowerCase());
  }
  return Array.from(tags);
}
