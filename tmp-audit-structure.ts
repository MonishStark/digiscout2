import { renderCompositionPreviewDocument } from "./src/lib/composition-renderer.ts";

const sampleSchema = (visualBehavior: string) => ({
  seo: { title: "Audit" },
  brand: { businessName: "Test Brand" },
  sections: [{ type: "hero", heading: "Hero Heading", description: "Open copy", media: { src: "https://example.com/image.jpg" } }],
  narrativeCompositions: [{
    id: "comp-1",
    narrativePurpose: "establish-authority",
    visualBehavior,
    scanPattern: "diagonal-ascending",
    densityMode: "balanced",
    geometrySystem: "grid-overlay",
    contentType: "hero",
    viewportRatio: 1,
    images: [{ src: "https://example.com/image.jpg", classification: "landscape", dominantColor: "#777", aspectRatio: 1.78, hasText: false, hasfaces: false, emotionalTone: "professional", suggestedTreatment: "contained" }],
    heading: "Test Heading",
    description: "Test description",
    actions: [{ label: "Action", href: "#", style: "primary" }],
    proofElements: [{ type: "testimonial", content: "Great!" }],
    motionLanguage: { entryTrigger: "on-scroll", entryType: "fade", internalMotion: "subtle" },
    styling: { typographySize: "large", typographyWeight: "bold" },
  }],
});

const engines = [
  { vb: "immersive-overlap", name: "cinematicImmersive" },
  { vb: "cinematic-reveal", name: "galleryStack" },
  { vb: "brutalist-stack", name: "brutalistGrid" },
  { vb: "editorial-asymmetry", name: "editorialOverlap" },
  { vb: "intimate-breathe", name: "atmosphericMinimal" },
];

type Signature = { tag: string; cls?: string; parent?: number; depth: number };

function parseSectionStructure(html: string): Signature[] {
  const sectionMatch = html.match(/<section[\s\S]*<\/section>/m);
  if (!sectionMatch) {
    // fallback to whole html if section not matched by regex due forward slash
    return [];
  }
  const sectionHtml = sectionMatch[0];
  const regex = /<(article|aside|div|header|section|span|p|h2|h3|figure|img|blockquote|main|template|footer|nav|ul|li)([^>]*)>/gi;
  const signatures: Signature[] = [];
  let match: RegExpExecArray | null;
  let stack: { tag: string; depth: number }[] = [];
  const voidTags = new Set(["img", "input", "br", "hr", "meta", "link"]);
  let index = 0;
  while ((match = regex.exec(sectionHtml))) {
    const tag = match[1];
    const attrs = match[2];
    const isClosing = /^\s*\//.test(attrs);
    const isSelfClosing = /\/$/.test(attrs) || voidTags.has(tag);
    if (isClosing) {
      stack.pop();
      continue;
    }
    const depth = stack.length;
    const clsMatch = attrs.match(/class=["']([^"']+)["']/i);
    signatures.push({ tag, cls: clsMatch?.[1], depth, parent: stack.length ? signatures.length - 1 : undefined });
    if (!isSelfClosing) {
      stack.push({ tag, depth });
    }
    index += 1;
  }
  return signatures;
}

function signatureSummary(sigs: Signature[]): string {
  return sigs.map((sig) => `${"  ".repeat(sig.depth)}<${sig.tag}${sig.cls ? ` class="${sig.cls}"` : ""}>`).join("\n");
}

for (const engine of engines) {
  const schema = sampleSchema(engine.vb);
  const html = renderCompositionPreviewDocument(schema);
  const sigs = parseSectionStructure(html);
  console.log(`ENGINE: ${engine.name} (${engine.vb})`);
  console.log(`NODES: ${sigs.length}`);
  console.log(signatureSummary(sigs.slice(0, 40)));
  console.log("---\n");
}
