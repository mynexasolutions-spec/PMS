// A small, safe renderer for note content. It builds React elements itself (no raw HTML is ever injected),
// supports **bold**, *italic*, ++underline++, `code`, [links](https://…), ![images](https://…), bare URLs,
// "- " bullet lists and "1. " numbered lists. Only http(s) and mailto links/images are allowed.

const INLINE = /\*\*(.+?)\*\*|\+\+(.+?)\+\+|\*([^*\n]+?)\*|`([^`\n]+)`|!\[([^\]\n]*)\]\((https?:\/\/[^\s)]+)\)|\[([^\]\n]+)\]\(((?:https?:\/\/|mailto:)[^\s)]+)\)|(https?:\/\/[^\s<)]+)/g;

const linkClass = "font-medium text-brand-700 underline decoration-brand-300 underline-offset-2 hover:text-brand-800";

function renderInline(text, keyBase = "n") {
  const out = [];
  let last = 0;
  let index = 0;
  for (const match of text.matchAll(INLINE)) {
    if (match.index > last) out.push(text.slice(last, match.index));
    const key = `${keyBase}-${index++}`;
    if (match[1] !== undefined) out.push(<strong key={key}>{renderInline(match[1], key)}</strong>);
    else if (match[2] !== undefined) out.push(<u key={key}>{renderInline(match[2], key)}</u>);
    else if (match[3] !== undefined) out.push(<em key={key}>{renderInline(match[3], key)}</em>);
    else if (match[4] !== undefined)
      out.push(
        <code key={key} className="rounded bg-[#eef3ef] px-1.5 py-0.5 font-mono text-[0.9em] text-[#14632f]">
          {match[4]}
        </code>,
      );
    else if (match[6] !== undefined)
      out.push(
        // eslint-disable-next-line @next/next/no-img-element
        <img key={key} src={match[6]} alt={match[5]} loading="lazy" referrerPolicy="no-referrer" className="my-1.5 block max-h-[220px] max-w-full rounded-lg border border-line" />,
      );
    else if (match[8] !== undefined)
      out.push(
        <a key={key} href={match[8]} target="_blank" rel="noopener noreferrer" className={linkClass}>
          {match[7]}
        </a>,
      );
    else
      out.push(
        <a key={key} href={match[9]} target="_blank" rel="noopener noreferrer" className={linkClass}>
          {match[9]}
        </a>,
      );
    last = match.index + match[0].length;
  }
  if (last < text.length) out.push(text.slice(last));
  return out;
}

export default function MarkdownLite({ text }) {
  const blocks = [];
  for (const line of text.split("\n")) {
    const bullet = /^\s*[-*]\s+(.*)$/.exec(line);
    const numbered = /^\s*\d+[.)]\s+(.*)$/.exec(line);
    const last = blocks[blocks.length - 1];
    if (bullet || numbered) {
      const type = bullet ? "ul" : "ol";
      if (last?.type === type) last.lines.push((bullet ?? numbered)[1]);
      else blocks.push({ type, lines: [(bullet ?? numbered)[1]] });
    } else if (!line.trim()) {
      blocks.push({ type: "gap" });
    } else if (last?.type === "p") {
      last.lines.push(line);
    } else {
      blocks.push({ type: "p", lines: [line] });
    }
  }

  return blocks.map((block, i) => {
    if (block.type === "gap") return null;
    if (block.type === "p")
      return (
        <p key={i} className="mt-1.5 first:mt-0">
          {block.lines.map((line, j) => (
            <span key={j}>
              {j > 0 && <br />}
              {renderInline(line, `${i}-${j}`)}
            </span>
          ))}
        </p>
      );
    const List = block.type;
    return (
      <List key={i} className={`mt-1.5 space-y-0.5 pl-5 first:mt-0 ${block.type === "ul" ? "list-disc" : "list-decimal"}`}>
        {block.lines.map((line, j) => (
          <li key={j}>{renderInline(line, `${i}-${j}`)}</li>
        ))}
      </List>
    );
  });
}
