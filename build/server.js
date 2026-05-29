var __defProp = Object.defineProperty;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __esm = (fn, res) => function __init() {
  return fn && (res = (0, fn[__getOwnPropNames(fn)[0]])(fn = 0)), res;
};
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};

// src/lib/vertex-homepage-generation-prompt.ts
var VERTEX_HOMEPAGE_GENERATION_PROMPT;
var init_vertex_homepage_generation_prompt = __esm({
  "src/lib/vertex-homepage-generation-prompt.ts"() {
    VERTEX_HOMEPAGE_GENERATION_PROMPT = `You are a professional agency web design engine specializing in modern local business websites.

Your task: using ONLY the full business context provided in the input variables below, generate the business-specific copy, selected images, and structural content for an Elementor homepage template. 

Return ONE final production-ready content payload as a JSON object matching the requested schema. Return ONLY valid JSON. No other text, markdown, or code fences.

============================================
INPUT VARIABLES (provided by caller)
============================================
- business_name (string)
- business_category (string)
- short_tagline (string)
- one_sentence_summary (string)
- primary_cta_text (string)
- primary_cta_url (string)
- secondary_cta_text (string)
- secondary_cta_url (string)
- phone (string)
- address (string)
- maps_url (string)
- hours (string or array)
- services (array of {title, short_description, image_url})
- categories (array of strings)
- reviews (array of {author, rating (1-5), text, date})
- images (object with keys: hero, service1, service2, gallery[]; each value is absolute URL)
- colors (object: primary, accent, neutral - optional)
- logo_url (string - optional)
- local_context (string - neighborhood/city/region)

============================================
REQUIRED OUTPUT SCHEMA
============================================
Your JSON output must have exactly these keys and structure:

{
  "hero": {
    "heading": "Headline for the hero section, maximum 8 words, incorporating business category and city/neighborhood name.",
    "description": "A very short, punchy 1-sentence tagline or subheading, maximum 10 words, describing the core value proposition.",
    "button_text": "Text for the hero primary button, e.g., 'View Our Projects' or 'Book Appointment'.",
    "hero_image": "Absolute image URL selected from the business images to serve as the main hero background.",
    "masked_image": "Absolute image URL selected from the business images to serve as the supporting circular/masked hero image."
  },
  "about": {
    "heading": "An engaging heading for the about us section (e.g., 'Highest Level of Quality for Residential Projects').",
    "description": "A 2-3 sentence paragraph about the business history, dedication, and neighborhood focus, using local_context details.",
    "image": "Absolute image URL selected from the business images to show the work or team in the about section.",
    "button_text": "Text for the about button, e.g., 'Learn More'."
  },
  "services": {
    "heading": "Section title, e.g., 'What We Do' or 'Our Services'.",
    "description": "A brief introductory sentence or phrase about the services offered.",
    "list": [
      "Service item 1 (short name, max 4 words)",
      "Service item 2 (short name, max 4 words)",
      "Service item 3 (short name, max 4 words)",
      "Service item 4 (short name, max 4 words)",
      "Service item 5 (short name, max 4 words)",
      "Service item 6 (short name, max 4 words)",
      "Service item 7 (short name, max 4 words)",
      "Service item 8 (short name, max 4 words)"
    ],
    "image": "Absolute image URL selected from the business images for the services showcase background."
  },
  "features": {
    "heading": "Heading summarizing the values, e.g., 'Exceptional Quality Guaranteed'.",
    "items": [
      {
        "title": "Feature 1 Title (e.g. 'High Quality Materials')",
        "description": "Short description (1 sentence) highlighting materials, tools, or products used."
      },
      {
        "title": "Feature 2 Title (e.g. 'Years of Experience')",
        "description": "Short description (1 sentence) highlighting expertise, licensing, or local trust."
      },
      {
        "title": "Feature 3 Title (e.g. 'Attention to Details')",
        "description": "Short description (1 sentence) highlighting customer satisfaction or meticulous finish."
      }
    ]
  },
  "projects": {
    "heading": "Section title, e.g., 'Recent Projects' or 'Our Work Portfolio'.",
    "description": "A brief sentence inviting users to check out the portfolio or recent local projects."
  },
  "process": {
    "heading": "Section title, e.g., 'Our Work Process - Let\\'s Bring Your Vision to Life'.",
    "steps": [
      {
        "title": "Step 1 Title (e.g. 'Creating a Brief')",
        "description": "1 sentence explaining the initial contact or assessment phase."
      },
      {
        "title": "Step 2 Title (e.g. 'Design')",
        "description": "1 sentence explaining the preparation, quoting, or visual design phase."
      },
      {
        "title": "Step 3 Title (e.g. 'Manufacture')",
        "description": "1 sentence explaining the work, crafting, or execution phase."
      },
      {
        "title": "Step 4 Title (e.g. 'Installation')",
        "description": "1 sentence explaining the final handoff, delivery, or installation phase."
      }
    ]
  },
  "testimonials": {
    "heading": "Section title, e.g., 'Client Testimonials' or 'Reviews from Neighbors'.",
    "items": [
      {
        "content": "Full quote text of testimonial 1. Must be taken from real reviews provided if possible.",
        "name": "Author of testimonial 1"
      },
      {
        "content": "Full quote text of testimonial 2. Must be taken from real reviews provided if possible.",
        "name": "Author of testimonial 2"
      },
      {
        "content": "Full quote text of testimonial 3. Must be taken from real reviews provided if possible.",
        "name": "Author of testimonial 3"
      }
    ],
    "slideshow": [
      "Image URL 1 for the testimonials sidebar gallery",
      "Image URL 2 for the testimonials sidebar gallery",
      "Image URL 3 for the testimonials sidebar gallery"
    ]
  }
}

============================================
RULES FOR CONTENT GENERATION
============================================
1. Tone and Copy:
   - Make all copy specific to the business type and local context provided.
   - Avoid generic AI fluff or overused clich\xE9s (e.g., 'elevate your space', 'cutting-edge solutions', 'transform your business').
   - Keep messages practical, direct, and professional.
2. Review Extraction:
   - Extract actual quotes and names from the 'reviews' input variable. Do not invent fake reviews if real ones are provided.
3. Image Assignment:
   - Distribute the business photos and suggestions across: 'hero_image', 'masked_image', 'about.image', 'services.image', and 'testimonials.slideshow' (3 images).
   - Ensure the same URL is not used excessively unless there are fewer than 3 images total.
   - All image fields MUST contain valid absolute URLs from the provided input variables.
4. Completeness:
   - Generate exactly 8 service list items.
   - Generate exactly 3 features.
   - Generate exactly 4 steps.
   - Generate exactly 3 testimonials and exactly 3 testimonial slideshow URLs.
`;
  }
});

// src/lib/direct-vertex-homepage-generation.ts
var direct_vertex_homepage_generation_exports = {};
__export(direct_vertex_homepage_generation_exports, {
  analyzeAndFilterImages: () => analyzeAndFilterImages,
  buildHomepageGenerationRequest: () => buildHomepageGenerationRequest,
  default: () => direct_vertex_homepage_generation_default,
  detectOrGenerateLogo: () => detectOrGenerateLogo,
  generateHomepageViaDirectVertexPrompt: () => generateHomepageViaDirectVertexPrompt,
  resolveSectionImages: () => resolveSectionImages
});
import fs4 from "fs";
import path3 from "path";
import crossFetch from "cross-fetch";
function optimizeGooglePhotoUrl(url, size = 1600) {
  if (!url || typeof url !== "string") return url;
  if (url.includes("googleusercontent.com/places/") || url.includes("googleusercontent.com/p/")) {
    const baseUrl = url.split("=")[0];
    return `${baseUrl}=s${size}`;
  }
  return url;
}
function collectBusinessImages(business) {
  const sources = [];
  if (Array.isArray(business.photos)) {
    sources.push(...business.photos.map((url) => optimizeGooglePhotoUrl(url, 1600)));
  }
  if (Array.isArray(business.imageSuggestions)) {
    sources.push(...business.imageSuggestions.map((url) => optimizeGooglePhotoUrl(url, 1600)));
  }
  if (business.logo) {
    sources.push(optimizeGooglePhotoUrl(business.logo, 400));
  }
  if (Array.isArray(business.reviews)) {
    business.reviews.forEach((r) => {
      if (Array.isArray(r.photos)) {
        sources.push(...r.photos.map((url) => typeof url === "string" ? optimizeGooglePhotoUrl(url, 1600) : ""));
      } else if (Array.isArray(r.images)) {
        sources.push(...r.images.map((url) => typeof url === "string" ? optimizeGooglePhotoUrl(url, 1600) : ""));
      }
    });
  }
  return [...new Set(sources.filter(Boolean))];
}
async function downloadImageAsBase64(url) {
  try {
    const lowResUrl = optimizeGooglePhotoUrl(url, 400);
    const res = await crossFetch(lowResUrl);
    if (!res.ok) return null;
    const buffer = await res.arrayBuffer();
    const base64Data = Buffer.from(buffer).toString("base64");
    let mimeType = res.headers.get("content-type") || "image/jpeg";
    if (mimeType.includes(";")) {
      mimeType = mimeType.split(";")[0];
    }
    return { mimeType, data: base64Data };
  } catch (e) {
    return null;
  }
}
async function analyzeProjectImage(url, fallbackTitle, log, options) {
  log(`[ImageAnalyzer] Downloading and analyzing Google Maps project image: ${url}`);
  const imgObj = await downloadImageAsBase64(url);
  if (!imgObj) {
    log(`[ImageAnalyzer] Failed to download or convert image: ${url}. Using fallback title: ${fallbackTitle}`);
    return fallbackTitle;
  }
  try {
    log(`[ImageAnalyzer] Running Gemini Vision analysis on image...`);
    const prompt = `This photo was uploaded to Google Maps for a cabinetry/woodworking business. Identify the specific cabinetry, furniture, or woodwork item shown in this photo (e.g., kitchen cabinets, closet shelving, wooden dining table, bathroom vanity, TV console, bookshelf, etc.). Respond with a short, professional, human-sounding project title (2 to 4 words maximum, capitalized) describing what the photo shows. Do not use generic words like 'Recent Project' or 'Woodworking'. Return ONLY the title itself, with no explanation or punctuation.`;
    const responseText = await generateWithFallback(
      [
        {
          role: "user",
          parts: [
            { inlineData: { mimeType: imgObj.mimeType, data: imgObj.data } },
            { text: prompt }
          ]
        }
      ],
      {
        temperature: 0.2
      },
      {
        logStderr: log,
        debugSession: options?.debugSession,
        throttleGemini: options?.throttleGemini || (async () => {
        }),
        contextLabel: "project-image-caption"
      }
    );
    const title = responseText?.trim();
    if (title && title.length > 2 && title.length < 50) {
      log(`[ImageAnalyzer] Successfully analyzed image. Title: "${title}"`);
      return title;
    }
    log(`[ImageAnalyzer] Gemini response was empty or invalid. Response: "${responseText}". Using fallback: ${fallbackTitle}`);
    return fallbackTitle;
  } catch (e) {
    log(`[ImageAnalyzer] Error analyzing image: ${e.message || e}. Using fallback: ${fallbackTitle}`);
    return fallbackTitle;
  }
}
async function analyzeAndFilterImages(business, log, options) {
  log(`[ImageAnalyzer] Cabinetry focus: Returning custom cabinetry generation prompts for: ${business.name}`);
  const globalStyle = "Scandinavian luxury editorial photography, Japandi-inspired interiors, soft natural daylight, matte walnut/oak textures, calm minimal compositions, realistic architectural photography, muted neutral palette, clean negative space, airy atmosphere, shallow depth of field, premium interior magazine aesthetic, avoid clutter, avoid construction-site feeling, avoid glossy CGI look, avoid oversaturated wood, avoid harsh lighting, avoid busy backgrounds, fully rendered scene showing the complete cabinetry, no blank vertical columns, no plain blocking walls, cinematic but understated, emotionally calm visual tone, consistent warm-beige color grading, charcoal shadows instead of pure black, matte surfaces only, soft contrast, minimal props, same lighting direction across sections, avoid visual density spikes, maintain editorial pacing between sections";
  return {
    hero_image: {
      action: "generate",
      generation_prompt: `A single minimalistic custom kitchen cabinet photograph, single continuous view, no grid, no collage, no multiple frames, no split screen, ${globalStyle}. Scandinavian editorial aesthetic, soft morning daylight, clean architectural composition, minimal decor styling, warm beige and walnut tones, realistic interior photography, calm premium atmosphere, matte finishes, luxury cabinetry integrated naturally into the environment. Wide cinematic framing, single visual focal point.`
    },
    masked_image: {
      action: "generate",
      generation_prompt: `A different single professional architectural photograph of a luxury modern cabinet corner or elegant storage sideboard cupboard, single continuous view, no grid, no collage, no multiple angles, no split screen, ${globalStyle}. Soft morning daylight, clean Scandinavian editorial aesthetic, realistic photo, Japandi interior styling, clean neutral background, matte textures, elegant cabinet proportions.`
    },
    about_image: {
      action: "generate",
      generation_prompt: `A premium professional studio flat lay photograph of luxury cabinet design details, samples and hardware on a solid, completely plain, blank pure white background. On the far left, a vertical arrangement of cabinetry sample boards (walnut wood panel with a gold/brass handle, smaller neutral tile), and on the far right, a vertical arrangement of cabinetry sample boards (light oak panel with a black knob handle, linen cloth folded), arranged solely on the left and right sides. Crucially, the wooden sample boards and all items on the left and right must be vertically compressed and centered, leaving a very large and generous empty white margin/padding (at least 20% to 25% of the image height) at both the top and bottom of the image frame. The wooden samples must be short and self-contained, completely surrounded by pure white empty space, and must never touch or run off the top or bottom edges of the image. The entire center 60% of the image must be a completely empty, solid, plain pure white negative space with no shadows, objects, or text. Soft natural daylight, clean Japandi/Scandinavian design aesthetic, matte finishes only.`
    },
    services_image: {
      action: "generate",
      generation_prompt: `Luxury built-in walnut shelving wall in modern living room, ${globalStyle}. Soft ambient lighting, Scandinavian interior design aesthetic, calm cinematic atmosphere, minimal furniture styling, realistic architectural photography, elegant minimal composition with empty space on one side.`
    },
    testimonials_slideshow: [
      {
        action: "generate",
        generation_prompt: `Luxury minimalist custom walk-in closet drawers with matte walnut paneling and brushed bronze pull handles, ${globalStyle}. Muted earth tones, spacious design layout.`
      },
      {
        action: "generate",
        generation_prompt: `Modern minimal bathroom vanity cabinet detail, matte oak panels with natural stone basin, ${globalStyle}. Clean lines, directional morning light.`
      },
      {
        action: "generate",
        generation_prompt: `Bespoke walnut kitchen island detail featuring integrated cabinet doors, ${globalStyle}. Clean joints, editorial cabinetry details.`
      }
    ],
    project_posts: [
      {
        action: "generate",
        post_title: "Custom Kitchen Cabinetry",
        generation_prompt: `Luxury modern walnut kitchen cabinets detail shot, ${globalStyle}. Muted neutral palette, matte wood finishes.`
      },
      {
        action: "generate",
        post_title: "Minimalist Oak TV Console",
        generation_prompt: `Modern sleek floating oak console detail, ${globalStyle}. Clean scandinavian aesthetic, simple geometric lines.`
      },
      {
        action: "generate",
        post_title: "Luxury Walk-In Closet",
        generation_prompt: `Bespoke walk-in wardrobe storage setup with natural oak details, ${globalStyle}. Airy atmosphere, minimal clutter.`
      },
      {
        action: "generate",
        post_title: "Bespoke Home Office Shelving",
        generation_prompt: `Handcrafted built-in home office shelving system in matte walnut finish, ${globalStyle}. Spacious styling, calm atmosphere.`
      }
    ]
  };
}
async function detectOrGenerateLogo(business, log, options) {
  log(`[LogoDetector] Cabinetry focus: Returning custom cabinetry logo generation prompt for: ${business.name}`);
  const defaultPrompt = `A premium minimalist text-based typography logo featuring the business name "${business.name}" with a elegant modern wood chisel or fine tree icon, clean modern flat design, solid white background, sharp vector lines, high-end lettermark`;
  return { action: "generate", generation_prompt: defaultPrompt };
}
async function resolveSectionImages(analysis, log, logoAnalysis, business, options) {
  const resultUrls = {
    hero_image: "",
    masked_image: "",
    about_image: "",
    services_image: "",
    testimonials_slideshow: [],
    project_posts: [],
    logo_image: ""
  };
  const getFallbackPlaceholder = (role) => {
    if (role.startsWith("project_")) {
      const projectPics = [
        "https://images.unsplash.com/photo-1556911220-e15b29be8c8f?w=800&q=80",
        "https://images.unsplash.com/photo-1539922980492-38f6673af8dd?w=800&q=80",
        "https://images.unsplash.com/photo-1558882224-cca166733360?w=800&q=80",
        "https://images.unsplash.com/photo-1581091226825-a6a2a5aee158?w=800&q=80"
      ];
      const idx = parseInt(role.split("_")[1], 10) - 1 || 0;
      return projectPics[idx % projectPics.length] || projectPics[0];
    }
    try {
      const rootDefaultDir = path3.join(process.cwd(), "default");
      const publicDefaultDir = path3.join(process.cwd(), "public", "default");
      if (!fs4.existsSync(publicDefaultDir)) {
        fs4.mkdirSync(publicDefaultDir, { recursive: true });
      }
      if (fs4.existsSync(rootDefaultDir)) {
        const files = fs4.readdirSync(rootDefaultDir).filter(
          (f) => f.toLowerCase().endsWith(".png") || f.toLowerCase().endsWith(".jpg") || f.toLowerCase().endsWith(".jpeg")
        );
        for (const file of files) {
          const srcPath = path3.join(rootDefaultDir, file);
          const destPath = path3.join(publicDefaultDir, file);
          if (!fs4.existsSync(destPath)) {
            fs4.copyFileSync(srcPath, destPath);
          }
        }
      }
      if (fs4.existsSync(publicDefaultDir)) {
        const files = fs4.readdirSync(publicDefaultDir).filter(
          (f) => f.toLowerCase().endsWith(".png") || f.toLowerCase().endsWith(".jpg") || f.toLowerCase().endsWith(".jpeg")
        );
        if (files.length > 0) {
          let selectedFile = files[0];
          if (role.toLowerCase().includes("hero")) {
            selectedFile = files[0 % files.length];
          } else if (role.toLowerCase().includes("about")) {
            selectedFile = files[1 % files.length];
          } else if (role.toLowerCase().includes("service")) {
            selectedFile = files[2 % files.length];
          } else if (role.toLowerCase().includes("masked")) {
            selectedFile = files[3 % files.length];
          } else {
            let hash = 0;
            for (let i = 0; i < role.length; i++) {
              hash = role.charCodeAt(i) + ((hash << 5) - hash);
            }
            const index = Math.abs(hash) % files.length;
            selectedFile = files[index];
          }
          const baseUrl = process.env.API_URL || "https://api.digiscout.online";
          const localUrl = `${baseUrl}/public/default/${selectedFile}`;
          log(`[ImageGenerator] Found local default fallback image for ${role}: ${localUrl}`);
          return localUrl;
        }
      }
    } catch (err) {
      log(`[ImageGenerator] Error scanning public/default directory: ${err.message}`);
    }
    const fallbacks = {
      hero: "https://images.unsplash.com/photo-1556911220-e15b29be8c8f?w=1200&q=80",
      // Premium kitchen cabinetry
      masked: "https://images.unsplash.com/photo-1533090161767-e6ffed986c88?w=800&q=80",
      // Wood grain texture
      about: "https://images.unsplash.com/photo-1581091226825-a6a2a5aee158?w=1200&q=80",
      // Woodworking workshop
      services: "https://images.unsplash.com/photo-1539922980492-38f6673af8dd?w=1200&q=80",
      // Finished cabinetry
      logo: "https://images.unsplash.com/photo-1540555700478-4be289fbecef?w=400&q=80"
      // Fallback logo emblem
    };
    if (role.startsWith("testimonial_")) {
      return "https://images.unsplash.com/photo-1558882224-cca166733360?w=800&q=80";
    }
    return fallbacks[role] || "https://images.unsplash.com/photo-1556911220-e15b29be8c8f?w=1200&q=80";
  };
  const generateAndSave = async (prompt, role, aspectRatio = "16:9") => {
    try {
      let finalPrompt = prompt;
      if (role !== "logo") {
        finalPrompt = `${prompt} Crucially, the image must be a pure, clean photograph with absolutely NO text, NO logos, NO labels, NO buttons, NO overlays, NO icons, and NO watermarks.`;
      }
      const base64Bytes = await generateCustomImage(finalPrompt, { aspectRatio, logStderr: log });
      const filename = `gen_${role}_${Date.now()}_${Math.random().toString(36).substring(2, 7)}.png`;
      const publicDir2 = path3.join(process.cwd(), "public");
      const imagesDir2 = path3.join(publicDir2, "generated-images");
      if (!fs4.existsSync(imagesDir2)) {
        fs4.mkdirSync(imagesDir2, { recursive: true });
      }
      const filePath = path3.join(imagesDir2, filename);
      fs4.writeFileSync(filePath, Buffer.from(base64Bytes, "base64"));
      const baseUrl = process.env.API_URL || "https://api.digiscout.online";
      const fileUrl = `${baseUrl}/public/generated-images/${filename}`;
      log(`[ImageGenerator] Saved generated image for ${role} to ${fileUrl}`);
      return fileUrl;
    } catch (err) {
      log(`[ImageGenerator] Error generating image for ${role}: ${err.message || err}. Falling back to default cabinetry placeholder.`);
      return getFallbackPlaceholder(role);
    }
  };
  const taskList = [];
  if (analysis.hero_image.action === "use_existing" && analysis.hero_image.url) {
    resultUrls.hero_image = analysis.hero_image.url;
  } else {
    taskList.push({
      run: async () => {
        resultUrls.hero_image = await generateAndSave(analysis.hero_image.generation_prompt || "wooden chair chair modern", "hero", "1:1");
      }
    });
  }
  if (analysis.masked_image.action === "use_existing" && analysis.masked_image.url) {
    resultUrls.masked_image = analysis.masked_image.url;
  } else {
    taskList.push({
      run: async () => {
        resultUrls.masked_image = await generateAndSave(analysis.masked_image.generation_prompt || "wood grain pattern detail close-up", "masked", "1:1");
      }
    });
  }
  if (analysis.about_image.action === "use_existing" && analysis.about_image.url) {
    resultUrls.about_image = analysis.about_image.url;
  } else {
    taskList.push({
      run: async () => {
        resultUrls.about_image = await generateAndSave(analysis.about_image.generation_prompt || "woodworking craftsman work", "about", "4:3");
      }
    });
  }
  if (analysis.services_image.action === "use_existing" && analysis.services_image.url) {
    resultUrls.services_image = analysis.services_image.url;
  } else {
    taskList.push({
      run: async () => {
        resultUrls.services_image = await generateAndSave(analysis.services_image.generation_prompt || "carpentry workshop background", "services", "16:9");
      }
    });
  }
  for (let i = 0; i < 3; i++) {
    resultUrls.testimonials_slideshow[i] = getFallbackPlaceholder(`testimonial_${i + 1}`);
  }
  const projectPhotos = [];
  if (business) {
    if (Array.isArray(business.photos)) {
      projectPhotos.push(...business.photos.map((url) => optimizeGooglePhotoUrl(url, 1600)));
    }
    if (Array.isArray(business.imageSuggestions)) {
      projectPhotos.push(...business.imageSuggestions.map((url) => optimizeGooglePhotoUrl(url, 1600)));
    }
    if (Array.isArray(business.reviews)) {
      business.reviews.forEach((r) => {
        if (Array.isArray(r.photos)) {
          projectPhotos.push(...r.photos.map((url) => typeof url === "string" ? optimizeGooglePhotoUrl(url, 1600) : ""));
        } else if (Array.isArray(r.images)) {
          projectPhotos.push(...r.images.map((url) => typeof url === "string" ? optimizeGooglePhotoUrl(url, 1600) : ""));
        }
      });
    }
  }
  const uniqueProjectPhotos = [...new Set(projectPhotos.filter(Boolean))];
  const projectsList = analysis.project_posts || [];
  for (let i = 0; i < Math.min(4, projectsList.length); i++) {
    const item = projectsList[i];
    const title = item.post_title || `Project ${i + 1}`;
    if (uniqueProjectPhotos[i]) {
      log(`[ImageGenerator] Project "${title}": Using actual Google Maps photo: ${uniqueProjectPhotos[i]}`);
      const analyzedTitle = await analyzeProjectImage(uniqueProjectPhotos[i], title, log, options);
      resultUrls.project_posts[i] = {
        title: analyzedTitle,
        url: uniqueProjectPhotos[i]
      };
    } else {
      log(`[ImageGenerator] Project "${title}": No Google Maps photo found, using cabinet fallback`);
      resultUrls.project_posts[i] = {
        title,
        url: getFallbackPlaceholder(`project_${i + 1}`)
      };
    }
  }
  if (logoAnalysis && logoAnalysis.action === "use_existing" && logoAnalysis.url) {
    resultUrls.logo_image = logoAnalysis.url;
  } else if (logoAnalysis && logoAnalysis.generation_prompt) {
    taskList.push({
      run: async () => {
        resultUrls.logo_image = await generateAndSave(logoAnalysis.generation_prompt, "logo", "16:9");
      }
    });
  } else {
    resultUrls.logo_image = getFallbackPlaceholder("logo");
  }
  if (taskList.length > 0) {
    log(`[ImageGenerator] Queueing ${taskList.length} AI image generation tasks with concurrency limit of 2...`);
    let nextIndex = 0;
    const worker = async () => {
      while (nextIndex < taskList.length) {
        const index = nextIndex++;
        try {
          await taskList[index].run();
        } catch (err) {
          log(`[ImageGenerator] Worker task error: ${err.message || err}`);
        }
      }
    };
    const limit = 2;
    const workers = Array.from({ length: Math.min(limit, taskList.length) }, worker);
    await Promise.all(workers);
  }
  return resultUrls;
}
function pickDesignProfile(category) {
  return {
    name: "Bespoke Woodworking",
    palette: {
      background: "#E8E6DF",
      surface: "#ffffff",
      primary: "#141111",
      accent: "#80311B",
      text: "#141111",
      muted: "#6B6661",
      outline: "rgba(20, 17, 17, 0.12)"
    },
    typography: { heading: "Spartan", body: "Inter" }
  };
}
function buildHomepageGenerationRequest(business) {
  const images = collectBusinessImages(business);
  const [hero, service1, service2, ...gallery] = images;
  const design = pickDesignProfile(business.category || business.businessType || "");
  return {
    business_name: business.name || "Untitled Business",
    business_category: business.category || business.businessType || "Local Service",
    short_tagline: business.tagline || business.shortTagline || `${business.category || "Service"} in ${business.neighborhood || business.city || "Your Area"}`,
    one_sentence_summary: business.summary || business.oneSentenceSummary || `Trusted ${business.category || "service provider"} serving the ${business.neighborhood || business.city || "local"} community.`,
    primary_cta_text: business.cta_primary_text || "Get Started Today",
    primary_cta_url: business.cta_primary_url || business.websiteUri || "#contact",
    secondary_cta_text: business.cta_secondary_text || "Learn More",
    secondary_cta_url: business.cta_secondary_url || business.websiteUri || "#services",
    phone: business.phoneNumber || business.phone || "Contact for availability",
    address: business.address || business.location || "See directions on map",
    maps_url: business.mapsUrl || `https://maps.google.com/?q=${encodeURIComponent(business.name || "location")}`,
    hours: business.hours || business.businessHours || "Call for hours of operation",
    services: business.services && Array.isArray(business.services) ? business.services.slice(0, 5).map((s) => ({
      title: typeof s === "string" ? s : s.title || s.name || "Service",
      short_description: typeof s === "string" ? `Professional ${s} service` : s.description || s.short_description || `Professional ${s.title} service`,
      image_url: s.image_url || s.photo || service1
    })) : [],
    categories: business.categories || [business.category],
    reviews: business.reviews && Array.isArray(business.reviews) ? business.reviews.slice(0, 6).map((r) => ({
      author: r.author || r.author_name || r.authorName || r.reviewerName || "Customer",
      rating: r.rating || r.stars || 5,
      text: r.text || r.review || r.comment || "Excellent service and highly recommended",
      date: r.date || r.reviewDate || r.relative_time_description || (r.time ? new Date(r.time * 1e3).toLocaleDateString() : void 0)
    })) : [],
    images: {
      hero,
      service1,
      service2,
      gallery: gallery || []
    },
    colors: {
      primary: design.palette.primary,
      accent: design.palette.accent,
      neutral: design.palette.background
    },
    logo_url: business.logo,
    local_context: `${business.neighborhood || business.area || business.city || "Local area"}, serving the ${business.city || "community"}`,
    competitors: business.competitors,
    trust_logos: business.trustLogos
  };
}
async function callVertexHomepageGeneration(prompt, request, debugLog, options) {
  const log = debugLog || ((msg) => console.error(msg));
  log(`[Vertex] Calling unified homepage generation via generateWithFallback...`);
  log(`[Vertex] Business: ${request.business_name}`);
  log(`[Vertex] Category: ${request.business_category}`);
  try {
    const { generateWithFallback: generateWithFallback2 } = await Promise.resolve().then(() => (init_gemini(), gemini_exports));
    const responseText = await generateWithFallback2(
      [
        {
          role: "user",
          parts: [
            { text: prompt },
            { text: `

Business Context (JSON):
${JSON.stringify(request, null, 2)}` }
          ]
        }
      ],
      {
        temperature: 0.1,
        responseMimeType: "application/json"
      },
      {
        logStderr: log,
        debugSession: options?.debugSession,
        throttleGemini: options?.throttleGemini || (async () => {
        }),
        persistGenerationDebugFile: options?.persistFile ? (session, filename, content) => options.persistFile(filename, content) : void 0,
        contextLabel: "direct-vertex-prompt"
      }
    );
    if (!responseText) {
      throw new Error("Vertex returned empty response");
    }
    log(`[Vertex] Response received (${responseText.length} characters)`);
    let jsonString = responseText.trim();
    if (jsonString.startsWith("```")) {
      jsonString = jsonString.replace(/^```[a-zA-Z]*\n/, "").replace(/\n```$/, "");
    }
    log(`[RAW VERTEX RESPONSE]: ${jsonString}`);
    let parsed = JSON.parse(jsonString);
    if (parsed && parsed.hero && parsed.about && parsed.services && !parsed.elementorContent) {
      log("[Vertex] Detected direct root sections; wrapping under elementorContent");
      parsed = {
        elementorContent: {
          hero: parsed.hero,
          about: parsed.about,
          services: parsed.services,
          features: parsed.features,
          projects: parsed.projects,
          process: parsed.process,
          testimonials: parsed.testimonials
        },
        notes: parsed.notes || "Auto-wrapped from direct root sections"
      };
    }
    if (!parsed || !parsed.elementorContent || !parsed.elementorContent.hero || !parsed.elementorContent.about || !parsed.elementorContent.services) {
      throw new Error(
        "Invalid response structure: missing elementorContent or required sections (hero, about, services)"
      );
    }
    log(`[Vertex] Parsed response successfully`);
    log(
      `[Vertex] Generated Hero Heading: "${parsed.elementorContent.hero.heading}"`
    );
    return parsed;
  } catch (error) {
    log(
      `[Vertex] Generation failed: ${error instanceof Error ? error.message : String(error)}`
    );
    throw error;
  }
}
function wrapForWordPress(homepageResult) {
  const cssBlock = `<!-- wp:html -->
<style>
${homepageResult.css}
</style>
<!-- /wp:html -->`;
  const htmlBlock = `<!-- wp:group {"align":"full","layout":{"type":"constrained"}} -->
<div class="wp-block-group alignfull">
${homepageResult.html}
</div>
<!-- /wp:group -->`;
  return `${cssBlock}

${htmlBlock}`;
}
async function generateHomepageViaDirectVertexPrompt(business, options) {
  const log = options?.debugLog || ((msg) => console.error(msg));
  const persist = options?.persistFile || ((filename, content) => {
  });
  try {
    log(`[DirectVertex] Starting image pre-filtering and resolution...`);
    const imageAnalysis = await analyzeAndFilterImages(business, log, {
      throttleGemini: options?.throttleGemini,
      debugSession: options?.debugSession
    });
    persist("01a-image-analysis.json", imageAnalysis);
    const logoAnalysis = await detectOrGenerateLogo(business, log, {
      throttleGemini: options?.throttleGemini,
      debugSession: options?.debugSession
    });
    persist("01logo-analysis.json", logoAnalysis);
    const resolvedImages = await resolveSectionImages(imageAnalysis, log, logoAnalysis, business, {
      throttleGemini: options?.throttleGemini,
      debugSession: options?.debugSession
    });
    persist("01b-resolved-images.json", resolvedImages);
    const request = buildHomepageGenerationRequest(business);
    request.images = {
      hero: resolvedImages.hero_image,
      service1: resolvedImages.services_image,
      service2: resolvedImages.about_image,
      gallery: [resolvedImages.masked_image, ...resolvedImages.testimonials_slideshow]
    };
    persist("01-homepage-generation-request.json", request);
    log(`[DirectVertex] Starting deterministic homepage generation...`);
    const response = await callVertexHomepageGeneration(
      VERTEX_HOMEPAGE_GENERATION_PROMPT,
      request,
      log,
      options
    );
    if (response.elementorContent) {
      if (!response.elementorContent.hero) response.elementorContent.hero = {};
      response.elementorContent.hero.hero_image = resolvedImages.hero_image;
      response.elementorContent.hero.masked_image = resolvedImages.masked_image;
      if (!response.elementorContent.about) response.elementorContent.about = {};
      response.elementorContent.about.image = resolvedImages.about_image;
      if (!response.elementorContent.services) response.elementorContent.services = {};
      response.elementorContent.services.image = resolvedImages.services_image;
      if (!response.elementorContent.testimonials) response.elementorContent.testimonials = {};
      response.elementorContent.testimonials.slideshow = resolvedImages.testimonials_slideshow;
      if (!response.elementorContent.projects) response.elementorContent.projects = {};
      response.elementorContent.projects.posts = resolvedImages.project_posts;
      response.elementorContent.logo_image = resolvedImages.logo_image;
    }
    persist("02-vertex-response.json", response);
    const schema = {
      id: business.id || `homepage-${Date.now()}`,
      businessId: business.id,
      businessName: business.name || "Untitled",
      schemaVersion: "1.0",
      meta: {
        businessId: business.id || `biz-${Date.now()}`,
        siteId: `site-${business.id || "business"}-${Date.now()}`,
        slug: (business.name || "site").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, ""),
        version: 1,
        target: "wordpress",
        traceId: options?.debugSession?.traceId
      },
      brand: {
        businessName: business.name || "Business",
        category: business.category || "Local Business",
        address: business.address || "",
        phone: business.phoneNumber || "",
        email: business.email || "",
        websiteUri: business.websiteUri || "",
        logo: resolvedImages.logo_image || business.logo || "",
        hours: business.hours || business.businessHours || ""
      },
      seo: {
        title: `${business.name || "Business"} | Preview`,
        description: business.tagline || `Bespoke web presentation for ${business.name || "our client"}.`,
        keywords: [business.category || "Local Business"]
      },
      theme: (() => {
        const design = pickDesignProfile(business.category || business.businessType || "");
        const primary = request.colors?.primary || design.palette.primary;
        const accent = request.colors?.accent || design.palette.accent;
        const neutral = request.colors?.neutral || design.palette.background;
        return {
          primaryColor: primary,
          accentColor: accent,
          neutralColor: neutral,
          name: "modern-agency",
          mode: "light",
          palette: {
            primary,
            surface: design.palette.surface,
            background: neutral,
            accent,
            text: design.palette.text,
            muted: design.palette.muted,
            outline: design.palette.outline
          },
          typography: {
            heading: design.typography.heading,
            body: design.typography.body
          }
        };
      })(),
      sections: [],
      createdAt: (/* @__PURE__ */ new Date()).toISOString(),
      _wordpressHtml: "",
      _renderSource: "direct-vertex-prompt",
      _generatedHomepage: response,
      elementorContent: response.elementorContent,
      notes: response.notes,
      _validation: {
        rating: business.rating || 0,
        reviewCount: business.reviewCount || 0,
        repairs: [],
        validatedAt: (/* @__PURE__ */ new Date()).toISOString(),
        traceId: options?.debugSession?.traceId,
        photos: business.photos || [],
        imageSuggestions: business.imageSuggestions || [],
        logo: business.logo || ""
      }
    };
    persist("04-minimal-schema.json", schema);
    log(`[DirectVertex] Homepage generation complete`);
    return schema;
  } catch (error) {
    log(
      `[DirectVertex] Failed: ${error instanceof Error ? error.message : String(error)}`
    );
    throw error;
  }
}
var GENAI_KEY, direct_vertex_homepage_generation_default;
var init_direct_vertex_homepage_generation = __esm({
  "src/lib/direct-vertex-homepage-generation.ts"() {
    init_vertex_homepage_generation_prompt();
    init_gemini();
    GENAI_KEY = process.env.GEMINI_API_KEY || process.env.GENAI_KEY;
    direct_vertex_homepage_generation_default = {
      generateHomepageViaDirectVertexPrompt,
      buildHomepageGenerationRequest,
      callVertexHomepageGeneration,
      wrapForWordPress
    };
  }
});

// src/lib/gemini.ts
var gemini_exports = {};
__export(gemini_exports, {
  askBusinessAIChatStream: () => askBusinessAIChatStream,
  fetchLeadAIChatHistory: () => fetchLeadAIChatHistory,
  generateCustomImage: () => generateCustomImage,
  generateOutreachEmail: () => generateOutreachEmail,
  generateWebsite: () => generateWebsite,
  generateWebsiteContent: () => generateWebsiteContent,
  generateWebsiteContentLegacy: () => generateWebsiteContentLegacy,
  generateWithFallback: () => generateWithFallback
});
async function generateWebsite(business) {
  try {
    const token = localStorage.getItem("ds_token");
    const headers = { "Content-Type": "application/json" };
    if (token) {
      headers["Authorization"] = `Bearer ${token}`;
    }
    const resp = await fetch(`${API_URL}/api/generate`, {
      method: "POST",
      headers,
      body: JSON.stringify(business)
    });
    if (!resp.ok) {
      let errorMsg = "";
      try {
        const errorJson = await resp.json();
        errorMsg = errorJson.error || errorJson.message || `${resp.status} ${resp.statusText}`;
      } catch {
        const text = await resp.text().catch(() => "");
        errorMsg = text || `${resp.status} ${resp.statusText}`;
      }
      const errorObj = new Error(errorMsg);
      errorObj.status = resp.status;
      throw errorObj;
    }
    const payload = await resp.json();
    return {
      schema: payload,
      debugTraceId: resp.headers.get("x-debug-generation-id") || void 0,
      debugFallbackUsed: (resp.headers.get("x-debug-generation-fallback") || "").toLowerCase() === "true"
    };
  } catch (err) {
    throw err;
  }
}
async function generateOutreachEmail(business, websiteUrl) {
  return `Subject: Modern website for ${business.name}

Hi ${business.name},

We created a prototype website at ${websiteUrl}.`;
}
async function fetchLeadAIChatHistory(leadId) {
  try {
    const token = localStorage.getItem("ds_token");
    const headers = {};
    if (token) {
      headers["Authorization"] = `Bearer ${token}`;
    }
    const resp = await fetch(
      `${API_URL}/api/business-ai-chat/${encodeURIComponent(leadId)}`,
      { headers }
    );
    if (!resp.ok) {
      throw new Error("Failed to fetch chat history");
    }
    const data = await resp.json();
    return data.messages || [];
  } catch (error) {
    console.error("Failed to fetch chat history:", error);
    return [];
  }
}
async function askBusinessAIChatStream(leadId, businessContext, messages, onChunk, signal) {
  const token = localStorage.getItem("ds_token");
  const headers = { "Content-Type": "application/json" };
  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }
  const resp = await fetch(`${API_URL}/api/business-ai-chat`, {
    method: "POST",
    headers,
    body: JSON.stringify({ leadId, businessContext, messages }),
    signal
  });
  if (!resp.ok) {
    const text = await resp.text().catch(() => "");
    throw new Error(
      `Chat request failed: ${resp.status} ${resp.statusText} ${text}`
    );
  }
  const reader = resp.body?.getReader();
  if (!reader) {
    const text = await resp.text().catch(() => "");
    onChunk(text);
    return;
  }
  const decoder = new TextDecoder("utf-8");
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    const chunk = decoder.decode(value, { stream: true });
    onChunk(chunk);
  }
}
async function generateWithFallback(promptOrContents, config = {}, options) {
  const googleCloudApiKey = process.env.GOOGLE_CLOUD_API_KEY;
  const geminiApiKey = process.env.GEMINI_API_KEY;
  const geminiRestUrl = process.env.GEMINI_REST_URL || "https://generativelanguage.googleapis.com/v1beta/models/gemini-flash-latest:generateContent";
  const contents = typeof promptOrContents === "string" ? [{ role: "user", parts: [{ text: promptOrContents }] }] : promptOrContents;
  const contextLabel = options.contextLabel || "unknown-stage";
  const logProvider = (payload) => {
    if (!options.debugSession || !options.persistGenerationDebugFile) return;
    const line = `[${(/* @__PURE__ */ new Date()).toISOString()}] stage=${contextLabel} provider=${payload.provider} model=${payload.model} status=${payload.status}${payload.outputChars !== void 0 ? ` outputChars=${payload.outputChars}` : ""}${payload.error ? ` error=${payload.error}` : ""}`;
    options.persistGenerationDebugFile(
      options.debugSession,
      "00-provider.log",
      line,
      true
    );
  };
  if (googleCloudApiKey) {
    const apiEndpoint = process.env.VERTEX_API_ENDPOINT || "aiplatform.googleapis.com";
    const modelId = "gemini-3.1-pro-preview";
    const generateContentApi = "streamGenerateContent";
    const vertexUrl = `https://${apiEndpoint}/v1/publishers/google/models/${modelId}:${generateContentApi}?key=${googleCloudApiKey}`;
    try {
      options.logStderr(`[AI] Primary Vertex Attempt (${apiEndpoint})...`);
      await options.throttleGemini();
      const payload = {
        contents,
        generationConfig: {
          temperature: config.temperature ?? 1,
          thinkingConfig: {
            thinkingLevel: "HIGH"
          }
        },
        safetySettings: [
          { category: "HARM_CATEGORY_HATE_SPEECH", threshold: "OFF" },
          { category: "HARM_CATEGORY_DANGEROUS_CONTENT", threshold: "OFF" },
          { category: "HARM_CATEGORY_SEXUALLY_EXPLICIT", threshold: "OFF" },
          { category: "HARM_CATEGORY_HARASSMENT", threshold: "OFF" }
        ],
        tools: [{ googleSearch: {} }]
      };
      if (config.responseMimeType) {
        payload.generationConfig.responseMimeType = config.responseMimeType;
      }
      const res = await fetch(vertexUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });
      if (res.ok) {
        const data = await res.json();
        let text = "";
        if (Array.isArray(data)) {
          for (const chunk of data) {
            const chunkText = chunk.candidates?.[0]?.content?.parts?.[0]?.text;
            if (chunkText) text += chunkText;
          }
        } else {
          text = data.candidates?.[0]?.content?.parts?.[0]?.text || "";
        }
        if (text) {
          options.logStderr(`[AI] Vertex Success!`);
          logProvider({
            provider: "vertex",
            model: modelId,
            status: "success",
            outputChars: text.length
          });
          return text;
        }
        throw new Error("Vertex response contents parts were empty");
      }
      const errText = await res.text().catch(() => "");
      throw new Error(
        `Vertex REST failed with status ${res.status}: ${errText}`
      );
    } catch (err) {
      options.logStderr(
        `[AI] Vertex Failed, Switching to Gemini Flash... Error: ${err.message || err}`
      );
      logProvider({
        provider: "vertex",
        model: modelId,
        status: "failure",
        error: err?.message || String(err)
      });
      if (options.debugSession && options.appendGenerationDebugError) {
        options.appendGenerationDebugError(
          options.debugSession,
          `vertex_failed: ${err.message || err}`
        );
      }
    }
  } else {
    options.logStderr(
      `[AI] GOOGLE_CLOUD_API_KEY not found. Skipping Vertex, trying Public Gemini...`
    );
  }
  if (geminiApiKey) {
    const fallbackUrl = `${geminiRestUrl}${geminiRestUrl.includes("?") ? "&" : "?"}key=${geminiApiKey}`;
    try {
      options.logStderr(`[AI] Fallback Public Gemini Attempt...`);
      await options.throttleGemini();
      const payload = {
        contents,
        generationConfig: {
          temperature: config.temperature ?? 1
        }
      };
      if (config.responseMimeType) {
        payload.generationConfig.responseMimeType = config.responseMimeType;
      }
      const res = await fetch(fallbackUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });
      if (res.ok) {
        const data = await res.json();
        const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
        if (text) {
          options.logStderr(`[AI] Public Gemini Success!`);
          logProvider({
            provider: "public-gemini",
            model: geminiRestUrl,
            status: "success",
            outputChars: text.length
          });
          return text;
        }
        throw new Error("Public Gemini response contents parts were empty");
      }
      const errText = await res.text().catch(() => "");
      throw new Error(
        `Public Gemini REST failed with status ${res.status}: ${errText}`
      );
    } catch (err) {
      options.logStderr(
        `[AI] Public Gemini Failed. Error: ${err.message || err}`
      );
      logProvider({
        provider: "public-gemini",
        model: geminiRestUrl,
        status: "failure",
        error: err?.message || String(err)
      });
      if (options.debugSession && options.appendGenerationDebugError) {
        options.appendGenerationDebugError(
          options.debugSession,
          `public_gemini_failed: ${err.message || err}`
        );
      }
    }
  } else {
    options.logStderr(`[AI] GEMINI_API_KEY not found.`);
  }
  options.logStderr(`[AI] Both attempts failed. Triggering UI Alert.`);
  throw new Error("AI_CRITICAL_FAILURE");
}
async function generateWebsiteContentLegacy(business, options) {
  if (typeof window !== "undefined") {
    throw new Error(
      "generateWebsiteContent can only be run on the server-side"
    );
  }
  try {
    const buildImageBlock = (b) => {
      const sources = b.photos || [];
      return sources.length ? sources.slice(0, 10).map((u, i) => `${i + 1}. ${u}`).join("\n") : "None";
    };
    const buildReviewsBlock = (b) => {
      if (Array.isArray(b.reviews) && b.reviews.length) {
        return b.reviews.slice(0, 5).map(
          (r, i) => `${i + 1}. ${r.rating || ""} - ${r.text || r.comment || ""}`
        ).join("\n");
      }
      return "None";
    };
    const stage0Prompt = `You are a premium Senior Staff Brand Director and Art Director.
Establish a custom brand Creative Direction Brief based on:
Business Name: ${business.name}
Category: ${business.category || "Local Service"}
Address: ${business.address || "N/A"}
Phone: ${business.phoneNumber || "N/A"}
Reviews:
${buildReviewsBlock(business)}
Reference Images:
${buildImageBlock(business)}

Return ONLY a valid JSON object matching this structure:
{
  "emotionalTone": "...",
  "brandPersonality": { "luxuryVsApproachable": 50, "technicalVsEmotional": 50, "modernVsHeritage": 50, "industrialVsEditorial": 50, "minimalistVsLayered": 50, "premiumVsEnergetic": 50 },
  "visualIdentity": { "themeMode": "light", "colorPalettePhilosophy": "...", "primaryColorIntent": "...", "accentColorIntent": "...", "backgroundColorIntent": "...", "surfaceColorIntent": "..." },
  "compositionPhilosophy": { "alignment": "asymmetrical", "layoutCadence": "...", "spacingRhythm": "balanced", "sectionTransitions": "..." },
  "typographyMood": { "headingFontFamily": "...", "bodyFontFamily": "...", "moodDescriptor": "..." },
  "mediaTreatment": { "style": "...", "shapes": ["..."] },
  "motionAndInteractions": { "personality": "subtle", "feel": "..." },
  "premiumReferences": ["..."],
  "atmosphericDirectionDescription": "...",
  "designTokens": {
    "spacingScale": { "xs": "...", "sm": "...", "md": "...", "lg": "...", "xl": "...", "xxl": "..." },
    "typographyScale": { "heroHeadline": "clamp(...)", "sectionHeadline": "clamp(...)", "bodyText": "clamp(...)", "headingFont": "...", "bodyFont": "..." },
    "radiusSystem": { "sm": "...", "md": "...", "lg": "...", "full": "..." },
    "shadowSystem": { "soft": "...", "premium": "...", "intense": "..." },
    "textureSystem": { "mode": "grain", "styleString": "..." },
    "animationTimingSystem": { "easingCurve": "...", "revealDuration": "..." },
    "layeringDepthSystem": { "zBack": "...", "zBase": "...", "zOverlay": "..." },
    "colorRamp": { "background": "...", "surface": "...", "primary": "...", "accent": "...", "text": "...", "muted": "...", "outline": "..." },
    "gradientSystem": { "ambientLighting": "...", "brandGradient": "..." }
  }
}`;
    options.logStderr(
      "[Gemini Generation] Stage 0: Generating Creative Direction..."
    );
    if (options.debugSession && options.persistGenerationDebugFile) {
      options.persistGenerationDebugFile(
        options.debugSession,
        "01a-creative-direction-prompt.md",
        stage0Prompt
      );
    }
    const stage0Text = await generateWithFallback(
      stage0Prompt,
      { temperature: 0.2, responseMimeType: "application/json" },
      options
    );
    if (options.debugSession && options.persistGenerationDebugFile) {
      options.persistGenerationDebugFile(
        options.debugSession,
        "01b-creative-direction-raw.json",
        stage0Text
      );
    }
    options.logStderr(
      `[Gemini Generation] Stage 0 Output (Creative Direction): ${stage0Text}`
    );
    const creativeDirection = JSON.parse(stage0Text.trim());
    if (options.debugSession) {
      options.persistGenerationDebugFile(
        options.debugSession,
        "01c-creative-direction-parsed.json",
        creativeDirection
      );
    }
    const qualificationNotes = business.notes || business.qualificationNotes || "None";
    const neighborhood = business.neighborhood || business.vibe || "Unknown";
    const specialties = Array.isArray(business.specialties) ? business.specialties.join(", ") : business.specialties || "General services";
    const tone = business.tone || "professional";
    const stage1Prompt = `You are a premium Senior Front-end Architect.
Generate a structured website schema matching the exact design decisions in the Creative Direction Brief.
Your design decisions must respect:
${JSON.stringify(creativeDirection, null, 2)}

Modern layout rules (MUST ENFORCE):
- Avoid excessive, empty whitespace that causes the site to feel "underdeveloped" or generic startup-like. Maintain tight, high-impact padding variables to ensure a cohesive, robust visual experience.
- Break free from templates. Create a unique pacing, visual flow, and section rhythm specifically suited for this business, prioritizing fewer, more high-impact sections over many repetitive ones.
- Enforce the brand's visual identity (theme mode, color palette, custom gradients, typography pairing) with absolute consistency. Avoid excessive mutations or contrast mismatch.

COPYWRITING INSTRUCTIONS (CRITICAL):
- TONE: Journalistic, confident, and highly specific. Write like an editor for Monocle or GQ.
- RULE 1: NO AI SPEAK. Permanently ban words like: "Unlock, Discover, Unleash, Elevate, Premier, Top-Notch, Cutting-Edge, Tailored, Seamless." 
- RULE 2: Show, Don't Tell. Instead of "We offer the best plumbing services," write "Emergency leak repair and pipe routing in under 45 minutes."
- RULE 3: Use hyper-local anchors. Reference the actual neighborhood, street, or city vibe provided in the context to make it feel grounded.
- RULE 4: Hero Subheadlines must state exactly what the business does, who it is for, and where it is located in plain, striking English.

DYNAMIC SECTIONS & COMPOSITION ORCHESTRATION:
- Do NOT use a standard, repetitive section structure.
- You have full creative control over which sections exist, their sequence, and their hierarchy to optimize the brand's narrative.
- You do NOT write raw HTML. Instead, you are the Creative Director and Orchestrator.
- For EVERY section in the "sections" array, you MUST generate a highly custom "composition" object instructing our premium rendering engine how to build that section.

COMPOSITION DICTIONARY OPTIONS (Choose appropriate properties matching business category tone):
"composition": {
  "sectionType": Choose from [
    "cinematicHero", "editorialHero", "splitNarrativeHero", 
    "asymmetricalFeatures", "glassFeatureCards", "processNarrative", 
    "immersiveGallery", "floatingImageStack", 
    "floatingTestimonialWall", 
    "layeredCTA", 
    "luxuryMetricsStrip", "storytellingTimeline", "transformationShowcase", 
    "premiumContactPanel", "accordionClean"
  ],
  "layoutBehavior": Choose from [
    "offset-right", "offset-left", "grid-stagger", "asymmetrical", "side-by-side", "split-grid", "centered-dramatic", "horizontal-carousel", "diagonal-split"
  ],
  "visualDepth": Choose from [
    "layered-atmospheric", "glassmorphic", "frosted-glow", "dramatic-depth", "flat-minimalist"
  ],
  "motionStyle": Choose from [
    "premiumFade", "cinematicReveal", "staggerLift", "softFloat", "atmosphericParallax", "editorialSlide", "luxuryGlow"
  ],
  "imageTreatment": Choose from [
    "layeredGlass", "editorialCrop", "cinematicBleed", "atmosphericOverlay", "luxuryFrame", "brutalistSharp", "floatingDepth", "diagonalWedge"
  ],
  "spacingMode": Choose from [
    "luxury-editorial", "balanced", "compact", "airy"
  ],
  "themeIntensity": Choose from [
    "dramatic", "soft", "balanced", "high-contrast"
  ],
  "hierarchyWeight": Choose from [
    "dominant", "supporting", "breathing", "cinematicPause", "transitionary"
  ]
}

THEME DESIGN SYSTEM:
- Choose the theme mode determined in the Creative Direction Brief: "${creativeDirection.visualIdentity.themeMode}".
- Derive all palette colors (background, surface, primary, accent, text, muted, outline) directly from the visualIdentity and brand personality intents.
- Generative Design DNA: You MUST generate a "designDNA" object under "theme" this DNA system drives the adaptive visual rendering and mutation rules:
  "designDNA": {
    "spacingPersonality": Choose from ["compressed", "balanced", "airy", "luxury-editorial", "brutalist-dense"],
    "compositionAggression": Number (0 to 100 representing layout mutation/offset levels),
    "hierarchyIntensity": Number (0 to 100 representing font size scales & weight variance),
    "motionEnergy": Number (0 to 100 representing stagger/speed timings),
    "visualDensity": Number (0 to 100 representing complexity/content density),
    "asymmetryLevel": Number (0 to 100 representing vertical alignment shifts and margins offsets),
    "atmosphereIntensity": Number (0 to 100 representing ambient radial glow levels & noise opacity),
    "typographyDominance": Choose from ["restrained", "balanced", "dominant-serif", "brutalist-impact", "cinematic-oversized", "layered-typography-walls", "vertical-accents"],
    "imageWeight": Number (0 to 100 representing image coverage vs text layout),
    "luxuryScore": Number (0 to 100 representing rounded smooth cards, high-end serif styling),
    "cinematicScore": Number (0 to 100 representing dark themes, immersive split and bleed panels),
    "brutalismScore": Number (0 to 100 representing blocky outlines, sharp text, raw structural elements),
    "editorialScore": Number (0 to 100 representing warm neutral tones, spacious asymmetric structures),
    "softnessScore": Number (0 to 100 representing rounded curves, fluid overlays, low-contrast shadows),
    "visualAtmosphere": Choose from ["industrial-grit", "luxury-glow", "soft-editorial-warmth", "cinematic-darkness", "energetic-neon", "architectural-minimalism"]
  }

Business Context:
- Name: ${business.name}
- Category: ${business.category || "Local Service"}
- Address: ${business.address || "N/A"}
- Phone: ${business.phoneNumber || "N/A"}
- Email: ${business.email || "NONE PROVIDED"}
- Website: ${business.websiteUri || "N/A"}
- Logo: ${business.logo || "None"}

Qualification Notes:
${qualificationNotes}

Neighborhood / Vibe:
${neighborhood}

Service Specialties:
${specialties}

Customer Tone / Sentiment:
${tone}

Reviews:
${buildReviewsBlock(business)}

Reference Images:
${buildImageBlock(business)}

Return only valid JSON matching the WebsiteSchema interface. Include the "designDNA" object under "theme" exactly as specified. Do not enclose in markdown code fences.`;
    options.logStderr(
      "[Gemini Generation] Stage 1: Generating Layout Schema..."
    );
    if (options.debugSession) {
      options.persistGenerationDebugFile(
        options.debugSession,
        "02-stage1-prompt.md",
        stage1Prompt
      );
    }
    const schemaText = await generateWithFallback(
      stage1Prompt,
      { temperature: 0.9, responseMimeType: "application/json" },
      { ...options, contextLabel: "stage1-schema" }
    );
    options.logStderr(
      `[Gemini Generation] Stage 1 Output (Raw Schema): ${schemaText}`
    );
    if (options.debugSession) {
      options.persistGenerationDebugFile(
        options.debugSession,
        "03-gemini-raw-response.txt",
        schemaText
      );
    }
    let parsedSchema;
    try {
      let cleanedJson = schemaText.trim();
      if (cleanedJson.startsWith("```")) {
        cleanedJson = cleanedJson.replace(/^```[a-zA-Z]*\n/, "").replace(/\n```$/, "");
      }
      if (options.parseWebsiteSchemaOutput) {
        const result = options.parseWebsiteSchemaOutput(
          cleanedJson,
          business,
          options.debugSession
        );
        if (!result) {
          throw new Error("parseWebsiteSchemaOutput returned null/failed");
        }
        parsedSchema = result;
      } else {
        parsedSchema = JSON.parse(cleanedJson.trim());
      }
      options.logStderr(
        `[Gemini Generation] Stage 1 Parsed & Normalized Schema: ${JSON.stringify(parsedSchema, null, 2)}`
      );
    } catch (parseError) {
      throw new Error(
        `Failed to parse Stage 1 generated schema JSON: ${parseError instanceof Error ? parseError.message : String(parseError)}`
      );
    }
    options.logStderr(
      "[Gemini Generation] Stage 2: Generating WordPress HTML..."
    );
    const stage2Prompt = `You are turning the approved website schema you just generated into the FINAL WordPress homepage HTML.

Return ONLY homepage HTML suitable for WordPress post_content.
Do not return JSON.
Do not explain anything.
Do not wrap the response in markdown unless it is a plain \`\`\`html fenced block.
Do not output JavaScript.
Use one initial <style> block if needed, then the homepage markup.
Render the sections in the schema order exactly as provided.
Use the exact business copy and exact media URLs from the schema.
Do not collapse the page into a common in-house template.
Make the composition, spacing, typography treatment, and hierarchy feel bespoke to this business.
Light theme only.
No site header chrome, no WordPress admin text, no fake badges like "crafted for premium presentation".
No generic placeholder copy.

MODERN UI & STYLING CONSTRAINTS (Apply via inline styles):
- SPACING: Stop using hard pixel values for padding. Use fluid clamp spacing: padding: clamp(4rem, 8vw, 8rem) 5%;
- BORDERS & SURFACES: For cards (bento grids, features, testimonials), use modern soft UI. Apply: background: #ffffff; border: 1px solid rgba(0,0,0,0.05); border-radius: 24px; box-shadow: 0 8px 32px rgba(0,0,0,0.03);
- TYPOGRAPHY HIERARCHY: Make h1 massive and tight: font-size: clamp(3.5rem, 8vw, 6rem); line-height: 1.05; tracking: -0.02em; Make paragraph text readable: font-size: 1.125rem; line-height: 1.6; color: rgba(0,0,0,0.7);
- IMAGES: Never use raw sharp corners. All images must have border-radius: 16px; box-shadow: 0 4px 20px rgba(0,0,0,0.06); unless they are explicitly arched.
- BENTO GRID REFINEMENT: Ensure gap spacing is modern. display: grid; gap: 24px;.`;
    if (options.debugSession) {
      options.persistGenerationDebugFile(
        options.debugSession,
        "05a-wordpress-html-prompt.md",
        stage2Prompt
      );
    }
    const stage2Contents = [
      { role: "user", parts: [{ text: stage1Prompt }] },
      {
        role: "model",
        parts: [{ text: JSON.stringify(parsedSchema, null, 2) }]
      },
      { role: "user", parts: [{ text: stage2Prompt }] }
    ];
    const htmlText = await generateWithFallback(
      stage2Contents,
      { temperature: 0.75 },
      { ...options, contextLabel: "stage2-wordpress-html" }
    );
    options.logStderr(
      `[Gemini Generation] Stage 2 Output (Raw HTML): ${htmlText}`
    );
    if (options.debugSession) {
      options.persistGenerationDebugFile(
        options.debugSession,
        "05b-wordpress-html-raw.txt",
        htmlText
      );
    }
    let cleanedHtml = htmlText.trim();
    if (cleanedHtml.startsWith("```")) {
      cleanedHtml = cleanedHtml.replace(/^```[a-zA-Z]*\n/, "").replace(/\n```$/, "");
    }
    options.logStderr(
      `[Gemini Generation] Stage 2 Cleaned HTML: ${cleanedHtml}`
    );
    if (!cleanedHtml) {
      throw new Error("Generated WordPress HTML was empty");
    }
    if (options.debugSession) {
      options.persistGenerationDebugFile(
        options.debugSession,
        "05c-wordpress-html-final.html",
        cleanedHtml
      );
    }
    parsedSchema._wordpressHtml = cleanedHtml;
    parsedSchema._renderSource = "gemini-html";
    options.logStderr(
      "[Gemini Generation] Primary website generation succeeded!"
    );
    return parsedSchema;
  } catch (error) {
    options.logStderr(
      `[Gemini Generation] Generation pipeline failed. Error: ${error instanceof Error ? error.message : String(error)}`
    );
    if (options.debugSession) {
      options.appendGenerationDebugError(
        options.debugSession,
        `generation_failed: ${error instanceof Error ? error.message : String(error)}`
      );
    }
    throw error;
  }
}
async function generateWebsiteContent(business, options) {
  if (typeof window !== "undefined") {
    throw new Error(
      "generateWebsiteContent can only be run on the server-side"
    );
  }
  try {
    options.logStderr(
      "[Gemini] Running direct deterministic homepage generation..."
    );
    const { generateHomepageViaDirectVertexPrompt: generateHomepageViaDirectVertexPrompt2 } = await Promise.resolve().then(() => (init_direct_vertex_homepage_generation(), direct_vertex_homepage_generation_exports));
    return await generateHomepageViaDirectVertexPrompt2(business, {
      debugLog: options.logStderr,
      debugSession: options.debugSession,
      persistFile: (filename, content) => {
        if (options.persistGenerationDebugFile && options.debugSession) {
          options.persistGenerationDebugFile(options.debugSession, filename, content);
        }
      },
      throttleGemini: options.throttleGemini
    });
  } catch (error) {
    options.logStderr(
      `[Gemini] Direct homepage generation failed. Error: ${error instanceof Error ? error.message : String(error)}`
    );
    if (options.debugSession && options.appendGenerationDebugError) {
      options.appendGenerationDebugError(
        options.debugSession,
        `generation_failed: ${error instanceof Error ? error.message : String(error)}`
      );
    }
    throw error;
  }
}
async function generateCustomImage(prompt, options) {
  const log = options?.logStderr || ((msg) => console.error(msg));
  const googleCloudApiKey = process.env.GOOGLE_CLOUD_API_KEY;
  const geminiApiKey = process.env.GEMINI_API_KEY;
  if (!googleCloudApiKey && !geminiApiKey) {
    throw new Error("Missing API key for image generation (GEMINI_API_KEY or GOOGLE_CLOUD_API_KEY)");
  }
  if (googleCloudApiKey) {
    const apiEndpoint = process.env.VERTEX_API_ENDPOINT || "aiplatform.googleapis.com";
    const modelName = "gemini-3-pro-image-preview";
    const url = `https://${apiEndpoint}/v1/publishers/google/models/${modelName}:streamGenerateContent?key=${googleCloudApiKey}`;
    log(`[AI] Generating image via Vertex API using ${modelName}. Prompt: "${prompt}"...`);
    let attempt = 0;
    const maxAttempts = 6;
    while (attempt < maxAttempts) {
      attempt++;
      try {
        const payload = {
          contents: [
            {
              role: "user",
              parts: [
                {
                  text: prompt
                }
              ]
            }
          ],
          generationConfig: {
            temperature: 1,
            maxOutputTokens: 32768,
            responseModalities: ["TEXT", "IMAGE"],
            topP: 0.95,
            imageConfig: {
              aspectRatio: options?.aspectRatio || "16:9",
              imageSize: "1K",
              imageOutputOptions: {
                mimeType: "image/png"
              },
              personGeneration: "ALLOW_ALL"
            }
          },
          safetySettings: [
            {
              category: "HARM_CATEGORY_HATE_SPEECH",
              threshold: "OFF"
            },
            {
              category: "HARM_CATEGORY_DANGEROUS_CONTENT",
              threshold: "OFF"
            },
            {
              category: "HARM_CATEGORY_SEXUALLY_EXPLICIT",
              threshold: "OFF"
            },
            {
              category: "HARM_CATEGORY_HARASSMENT",
              threshold: "OFF"
            }
          ]
        };
        const res = await fetch(url, {
          method: "POST",
          headers: {
            "Content-Type": "application/json"
          },
          body: JSON.stringify(payload)
        });
        if (res.ok) {
          const chunks = await res.json();
          let imageBytes = "";
          for (const chunk of chunks) {
            const parts = chunk.candidates?.[0]?.content?.parts;
            if (parts) {
              for (const part of parts) {
                if (part.inlineData && part.inlineData.data) {
                  imageBytes = part.inlineData.data;
                }
              }
            }
          }
          if (imageBytes) {
            log(`[AI] Vertex Image generation successful (${imageBytes.length} bytes)`);
            return imageBytes;
          }
          throw new Error("No inlineData image bytes found in stream chunks");
        } else {
          const errText = await res.text().catch(() => "");
          if ((res.status === 429 || errText.includes("RESOURCE_EXHAUSTED")) && attempt < maxAttempts) {
            const delay = 8e3 + Math.random() * 4e3;
            log(`[AI] Vertex rate limited (429/RESOURCE_EXHAUSTED). Retrying attempt ${attempt + 1}/${maxAttempts} in ${(delay / 1e3).toFixed(1)}s...`);
            await new Promise((resolve) => setTimeout(resolve, delay));
            continue;
          }
          throw new Error(`Vertex REST failed with status ${res.status}: ${errText}`);
        }
      } catch (err) {
        const isTransient = err.message?.includes("fetch") || err.message?.includes("network") || err.message?.includes("timeout");
        if (isTransient && attempt < maxAttempts) {
          const delay = 3e3 + Math.random() * 2e3;
          log(`[AI] Vertex fetch network error: ${err.message || err}. Retrying attempt ${attempt + 1}/${maxAttempts} in ${(delay / 1e3).toFixed(1)}s...`);
          await new Promise((resolve) => setTimeout(resolve, delay));
          continue;
        }
        log(`[AI] Vertex Image generation failed on attempt ${attempt}/${maxAttempts}: ${err.message || err}.`);
        if (attempt >= maxAttempts) {
          log(`[AI] Vertex Image generation failed after ${maxAttempts} attempts. Trying fallback...`);
        }
      }
    }
  }
  if (geminiApiKey) {
    const modelName = "imagen-4.0-generate-001";
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${modelName}:predict?key=${geminiApiKey}`;
    log(`[AI] Generating image via Gemini API fallback using ${modelName}. Prompt: "${prompt}"...`);
    try {
      const payload = {
        instances: [
          {
            prompt
          }
        ],
        parameters: {
          sampleCount: 1,
          aspectRatio: options?.aspectRatio || "16:9"
        }
      };
      const res = await fetch(url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify(payload)
      });
      if (res.ok) {
        const data = await res.json();
        const imageBytes = data.predictions?.[0]?.bytesBase64Encoded;
        if (imageBytes) {
          log(`[AI] Gemini Image generation successful (${imageBytes.length} bytes)`);
          return imageBytes;
        }
        throw new Error("No bytesBase64Encoded returned in prediction response");
      } else {
        const errText = await res.text().catch(() => "");
        throw new Error(`Gemini REST failed with status ${res.status}: ${errText}`);
      }
    } catch (err) {
      log(`[AI] Gemini Image generation failed: ${err.message || err}`);
    }
  }
  throw new Error("All image generation attempts failed");
}
var API_URL;
var init_gemini = __esm({
  "src/lib/gemini.ts"() {
    API_URL = process.env?.VITE_API_URL || "http://localhost:5001";
  }
});

// src/lib/wordpress.ts
var wordpress_exports = {};
__export(wordpress_exports, {
  buildWordPressProvisioningPlan: () => buildWordPressProvisioningPlan,
  buildWordPressSitePages: () => buildWordPressSitePages,
  collectWordPressMediaAssets: () => collectWordPressMediaAssets,
  schemaToGutenbergBlocks: () => schemaToGutenbergBlocks
});
function escapeHtml(value) {
  return (value || "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/\"/g, "&quot;").replace(/'/g, "&#39;");
}
function slugify(value) {
  return (value || "client-site").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
}
function renderNavBlocks(schema) {
  const voice = getSiteVoice(schema);
  const links = [
    { title: "Home", href: "/" },
    { title: "About", href: "/about/" },
    { title: voice.featuresTitle, href: "/services/" },
    { title: voice.galleryTitle, href: "/gallery/" },
    { title: voice.faqTitle, href: "/faq/" },
    { title: voice.contactTitle, href: "/contact/" }
  ];
  return `<!-- wp:navigation {"layout":{"type":"flex","justifyContent":"center"}} -->
<nav class="wp-block-navigation">${links.map((link) => `<a class="wp-block-navigation-item__content" href="${link.href}">${escapeHtml(link.title)}</a>`).join("")}</nav>
<!-- /wp:navigation -->`;
}
function getSiteVoice(schema) {
  const category = (schema.brand.category || "").toLowerCase();
  const businessName = schema.brand.businessName || "The Brand";
  if (category.includes("restaurant") || category.includes("cafe") || category.includes("bakery")) {
    return {
      featuresTitle: "Signature Dishes & Experiences",
      galleryTitle: "Dining Room & Detail",
      testimonialsTitle: "Guest Impressions",
      faqTitle: "Dining Questions",
      contactTitle: `Visit ${businessName}`,
      aboutTitle: `The Story Behind ${businessName}`,
      ctaButton: "Reserve Your Table"
    };
  }
  if (category.includes("salon") || category.includes("spa") || category.includes("wellness")) {
    return {
      featuresTitle: "Signature Rituals",
      galleryTitle: "Studio Atmosphere",
      testimonialsTitle: "Client Notes",
      faqTitle: "Treatment Questions",
      contactTitle: `Book ${businessName}`,
      aboutTitle: `About ${businessName}`,
      ctaButton: "Schedule Your Appointment"
    };
  }
  if (category.includes("gym") || category.includes("fitness") || category.includes("training")) {
    return {
      featuresTitle: "Training Programs",
      galleryTitle: "Progress & Environment",
      testimonialsTitle: "Member Wins",
      faqTitle: "Training Questions",
      contactTitle: `Start Training at ${businessName}`,
      aboutTitle: `About ${businessName}`,
      ctaButton: "Start Your Program"
    };
  }
  return {
    featuresTitle: "Capabilities Built For Growth",
    galleryTitle: "Selected Work",
    testimonialsTitle: "Trusted By Real Customers",
    faqTitle: "Questions, Answered Clearly",
    contactTitle: `Let's Build Your Next Version`,
    aboutTitle: `About ${businessName}`,
    ctaButton: "Book A Consultation"
  };
}
function getSection(schema, type) {
  return schema.sections.find((section) => section.type === type);
}
function wrapHtmlBlock(content) {
  return `<!-- wp:html -->
${content}
<!-- /wp:html -->`;
}
function getSectionLayout(section) {
  return (section.layout || section.variant || "standard").toLowerCase();
}
function getSectionTitle(section, fallback) {
  return section?.headline || section?.title || fallback;
}
function renderStructuredHeroSection(schema) {
  const hero = getSection(schema, "hero");
  if (!hero) return "";
  const layout = getSectionLayout(hero);
  const title = getSectionTitle(hero, schema.brand.businessName || "Welcome");
  const subheadline = hero.subheadline || `${schema.brand.businessName || "This business"} deserves a more distinctive digital presence.`;
  const primaryCta = hero.primaryCta || hero.ctaPrimary || { label: "Learn More", href: "#contact" };
  const secondaryCta = hero.secondaryCta || hero.ctaSecondary;
  const mediaUrl = hero.media?.url || hero.media?.src || "";
  const mediaAlt = hero.media?.alt || schema.brand.businessName;
  const badge = hero.badge || schema.brand.category;
  if (layout === "immersive") {
    return wrapHtmlBlock(`
<section class="wp-section wp-hero wp-hero--immersive" id="top" data-layout="immersive">
	<div class="wp-hero__media">
		${mediaUrl ? `<img src="${escapeHtml(mediaUrl)}" alt="${escapeHtml(mediaAlt)}" />` : ""}
		<div class="wp-hero__overlay"></div>
	</div>
	<div class="wp-hero__content">
		<p class="wp-hero__badge">${escapeHtml(badge)}</p>
		<h1>${escapeHtml(title)}</h1>
		<p>${escapeHtml(subheadline)}</p>
		<div class="wp-hero__actions">
			<a class="wp-button wp-button--primary" href="${escapeHtml(primaryCta.href)}">${escapeHtml(primaryCta.label)}</a>
			${secondaryCta ? `<a class="wp-button wp-button--secondary" href="${escapeHtml(secondaryCta.href)}">${escapeHtml(secondaryCta.label)}</a>` : ""}
		</div>
	</div>
</section>`);
  }
  if (layout === "centered") {
    return wrapHtmlBlock(`
<section class="wp-section wp-hero wp-hero--centered" id="top" data-layout="centered">
	<div class="wp-hero__content wp-hero__content--centered">
		<p class="wp-hero__badge">${escapeHtml(badge)}</p>
		<h1>${escapeHtml(title)}</h1>
		<p>${escapeHtml(subheadline)}</p>
		<div class="wp-hero__actions wp-hero__actions--centered">
			<a class="wp-button wp-button--primary" href="${escapeHtml(primaryCta.href)}">${escapeHtml(primaryCta.label)}</a>
			${secondaryCta ? `<a class="wp-button wp-button--secondary" href="${escapeHtml(secondaryCta.href)}">${escapeHtml(secondaryCta.label)}</a>` : ""}
		</div>
	</div>
	${mediaUrl ? `<figure class="wp-hero__figure"><img src="${escapeHtml(mediaUrl)}" alt="${escapeHtml(mediaAlt)}" /></figure>` : ""}
</section>`);
  }
  return wrapHtmlBlock(`
<section class="wp-section wp-hero wp-hero--split" id="top" data-layout="${escapeHtml(layout)}">
	<div class="wp-hero__content">
		<p class="wp-hero__badge">${escapeHtml(badge)}</p>
		<h1>${escapeHtml(title)}</h1>
		<p>${escapeHtml(subheadline)}</p>
		<div class="wp-hero__actions">
			<a class="wp-button wp-button--primary" href="${escapeHtml(primaryCta.href)}">${escapeHtml(primaryCta.label)}</a>
			${secondaryCta ? `<a class="wp-button wp-button--secondary" href="${escapeHtml(secondaryCta.href)}">${escapeHtml(secondaryCta.label)}</a>` : ""}
		</div>
	</div>
	${mediaUrl ? `<figure class="wp-hero__figure"><img src="${escapeHtml(mediaUrl)}" alt="${escapeHtml(mediaAlt)}" /></figure>` : ""}
</section>`);
}
function renderStructuredFeaturesSection(schema) {
  const features = getSection(schema, "features");
  if (!features || !Array.isArray(features.items) || features.items.length === 0) {
    return "";
  }
  const layout = getSectionLayout(features);
  const title = getSectionTitle(features, getSiteVoice(schema).featuresTitle);
  const items = features.items;
  if (layout === "list") {
    return wrapHtmlBlock(`
<section class="wp-section wp-features wp-features--list" id="services" data-layout="list">
	<header class="wp-section__header">
		<p class="wp-section__eyebrow">Services</p>
		<h2>${escapeHtml(title)}</h2>
	</header>
	<div class="wp-features__list">
		${items.map(
      (item, index) => `
		<article class="wp-feature wp-feature--row">
			<span class="wp-feature__index">${String(index + 1).padStart(2, "0")}</span>
			<div>
				<h3>${escapeHtml(item.title)}</h3>
				<p>${escapeHtml(item.description)}</p>
			</div>
		</article>`
    ).join("")}
	</div>
</section>`);
  }
  if (layout === "alternating-grid") {
    return wrapHtmlBlock(`
<section class="wp-section wp-features wp-features--alternating" id="services" data-layout="alternating-grid">
	<header class="wp-section__header">
		<p class="wp-section__eyebrow">Services</p>
		<h2>${escapeHtml(title)}</h2>
	</header>
	<div class="wp-features__grid wp-features__grid--alternating">
		${items.map(
      (item, index) => `
		<article class="wp-feature wp-feature--${index % 2 === 0 ? "tall" : "wide"}">
			<span class="wp-feature__index">${String(index + 1).padStart(2, "0")}</span>
			<h3>${escapeHtml(item.title)}</h3>
			<p>${escapeHtml(item.description)}</p>
		</article>`
    ).join("")}
	</div>
</section>`);
  }
  return wrapHtmlBlock(`
<section class="wp-section wp-features wp-features--bento" id="services" data-layout="${escapeHtml(layout)}">
	<header class="wp-section__header">
		<p class="wp-section__eyebrow">Services</p>
		<h2>${escapeHtml(title)}</h2>
	</header>
	<div class="wp-features__grid wp-features__grid--bento">
		${items.map(
    (item, index) => `
		<article class="wp-feature wp-feature--card wp-feature--${index === 0 ? "lead" : "support"}">
			<span class="wp-feature__index">${String(index + 1).padStart(2, "0")}</span>
			<h3>${escapeHtml(item.title)}</h3>
			<p>${escapeHtml(item.description)}</p>
		</article>`
  ).join("")}
	</div>
</section>`);
}
function renderStructuredGallerySection(schema) {
  const gallery = getSection(schema, "gallery");
  if (!gallery || !Array.isArray(gallery.items) || gallery.items.length === 0) {
    return "";
  }
  const layout = getSectionLayout(gallery);
  const title = getSectionTitle(gallery, getSiteVoice(schema).galleryTitle);
  if (layout === "masonry") {
    return wrapHtmlBlock(`
<section class="wp-section wp-gallery wp-gallery--masonry" id="gallery" data-layout="masonry">
	<header class="wp-section__header">
		<p class="wp-section__eyebrow">Gallery</p>
		<h2>${escapeHtml(title)}</h2>
	</header>
	<div class="wp-gallery__masonry">
		${gallery.items.map(
      (item, index) => `
		<figure class="wp-gallery__item wp-gallery__item--${index % 3 + 1}">
			<img src="${escapeHtml(item.src)}" alt="${escapeHtml(item.alt)}" />
		</figure>`
    ).join("")}
	</div>
</section>`);
  }
  if (layout === "asymmetrical") {
    return wrapHtmlBlock(`
<section class="wp-section wp-gallery wp-gallery--asymmetrical" id="gallery" data-layout="asymmetrical">
	<header class="wp-section__header">
		<p class="wp-section__eyebrow">Gallery</p>
		<h2>${escapeHtml(title)}</h2>
	</header>
	<div class="wp-gallery__asymmetrical">
		${gallery.items.map(
      (item, index) => `
		<figure class="wp-gallery__panel wp-gallery__panel--${index === 0 ? "hero" : index % 2 === 0 ? "stack" : "rail"}">
			<img src="${escapeHtml(item.src)}" alt="${escapeHtml(item.alt)}" />
		</figure>`
    ).join("")}
	</div>
</section>`);
  }
  return wrapHtmlBlock(`
<section class="wp-section wp-gallery wp-gallery--grid" id="gallery" data-layout="${escapeHtml(layout)}">
	<header class="wp-section__header">
		<p class="wp-section__eyebrow">Gallery</p>
		<h2>${escapeHtml(title)}</h2>
	</header>
	<div class="wp-gallery__grid">
		${gallery.items.map(
    (item) => `
		<figure class="wp-gallery__item">
			<img src="${escapeHtml(item.src)}" alt="${escapeHtml(item.alt)}" />
		</figure>`
  ).join("")}
	</div>
</section>`);
}
function renderStructuredTestimonialsSection(schema) {
  const testimonials = getSection(schema, "testimonials");
  if (!testimonials || !Array.isArray(testimonials.items) || testimonials.items.length === 0) {
    return "";
  }
  const layout = getSectionLayout(testimonials);
  const title = getSectionTitle(
    testimonials,
    getSiteVoice(schema).testimonialsTitle
  );
  if (layout === "timeline") {
    return wrapHtmlBlock(`
<section class="wp-section wp-testimonials wp-testimonials--timeline" id="testimonials" data-layout="timeline">
	<header class="wp-section__header">
		<p class="wp-section__eyebrow">Testimonials</p>
		<h2>${escapeHtml(title)}</h2>
	</header>
	<div class="wp-testimonials__timeline">
		${testimonials.items.map(
      (item, index) => `
		<article class="wp-testimonial wp-testimonial--timeline">
			<span class="wp-testimonial__index">${String(index + 1).padStart(2, "0")}</span>
			<blockquote><p>${escapeHtml(item.quote)}</p></blockquote>
			<footer><strong>${escapeHtml(item.author)}</strong>${item.role ? `<span>${escapeHtml(item.role)}</span>` : ""}</footer>
		</article>`
    ).join("")}
	</div>
</section>`);
  }
  return wrapHtmlBlock(`
<section class="wp-section wp-testimonials wp-testimonials--cards" id="testimonials" data-layout="${escapeHtml(layout)}">
	<header class="wp-section__header">
		<p class="wp-section__eyebrow">Testimonials</p>
		<h2>${escapeHtml(title)}</h2>
	</header>
	<div class="wp-testimonials__grid">
		${testimonials.items.map(
    (item) => `
		<article class="wp-testimonial wp-testimonial--card">
			<blockquote><p>${escapeHtml(item.quote)}</p></blockquote>
			<footer><strong>${escapeHtml(item.author)}</strong>${item.role ? `<span>${escapeHtml(item.role)}</span>` : ""}</footer>
		</article>`
  ).join("")}
	</div>
</section>`);
}
function renderStructuredFaqSection(schema) {
  const faq = getSection(schema, "faq");
  if (!faq || !Array.isArray(faq.items) || faq.items.length === 0) {
    return "";
  }
  const title = getSectionTitle(faq, getSiteVoice(schema).faqTitle);
  return wrapHtmlBlock(`
<section class="wp-section wp-faq" id="faq" data-layout="${escapeHtml(getSectionLayout(faq))}">
	<header class="wp-section__header">
		<p class="wp-section__eyebrow">FAQ</p>
		<h2>${escapeHtml(title)}</h2>
	</header>
	<div class="wp-faq__list">
		${faq.items.map(
    (item) => `
		<details class="wp-faq__item">
			<summary>${escapeHtml(item.question)}</summary>
			<p>${escapeHtml(item.answer)}</p>
		</details>`
  ).join("")}
	</div>
</section>`);
}
function renderStructuredContactSection(schema) {
  const contact = getSection(schema, "contact");
  const title = getSectionTitle(contact, getSiteVoice(schema).contactTitle);
  const layout = getSectionLayout(contact || {});
  const email = schema.brand.email || "";
  return wrapHtmlBlock(`
<section class="wp-section wp-contact wp-contact--${escapeHtml(layout)}" id="contact" data-layout="${escapeHtml(layout)}">
	<header class="wp-section__header">
		<p class="wp-section__eyebrow">Contact</p>
		<h2>${escapeHtml(title)}</h2>
	</header>
	<div class="wp-contact__grid">
		<article class="wp-contact__details">
			<h3>${escapeHtml(schema.brand.businessName)}</h3>
			<p>${escapeHtml(schema.brand.address || "")}</p>
			${schema.brand.phone ? `<p><strong>Phone:</strong> ${escapeHtml(schema.brand.phone)}</p>` : ""}
			${email ? `<p><strong>Email:</strong> ${escapeHtml(email)}</p>` : ""}
		</article>
		<article class="wp-contact__card">
			<div class="wp-contact__map">${escapeHtml(schema.brand.address || "")}</div>
			${email ? `<a class="wp-button wp-button--primary" href="mailto:${escapeHtml(email)}">Book A Conversation</a>` : ""}
		</article>
	</div>
</section>`);
}
function renderStructuredCtaSection(schema) {
  const cta = getSection(schema, "cta");
  if (!cta) return "";
  const layout = getSectionLayout(cta);
  const title = getSectionTitle(cta, getSiteVoice(schema).ctaTitle);
  const body = cta.body || "";
  const buttonLabel = cta.buttonLabel || cta.primaryCta?.label || getSiteVoice(schema).ctaButton;
  const buttonHref = cta.buttonHref || cta.primaryCta?.href || "#contact";
  if (layout === "side-by-side") {
    return wrapHtmlBlock(`
<section class="wp-section wp-cta wp-cta--split" data-layout="side-by-side">
	<div class="wp-cta__split">
		<div>
			<p class="wp-section__eyebrow">Call To Action</p>
			<h2>${escapeHtml(title)}</h2>
			<p>${escapeHtml(body)}</p>
		</div>
		<div class="wp-cta__actions">
			<a class="wp-button wp-button--primary" href="${escapeHtml(buttonHref)}">${escapeHtml(buttonLabel)}</a>
		</div>
	</div>
</section>`);
  }
  return wrapHtmlBlock(`
<section class="wp-section wp-cta wp-cta--centered" data-layout="${escapeHtml(layout)}">
	<div class="wp-cta__card">
		<p class="wp-section__eyebrow">Call To Action</p>
		<h2>${escapeHtml(title)}</h2>
		<p>${escapeHtml(body)}</p>
		<a class="wp-button wp-button--primary" href="${escapeHtml(buttonHref)}">${escapeHtml(buttonLabel)}</a>
	</div>
</section>`);
}
function renderStructuredSection(schema, section) {
  switch (section?.type) {
    case "hero":
      return renderStructuredHeroSection(schema);
    case "features":
      return renderStructuredFeaturesSection(schema);
    case "gallery":
      return renderStructuredGallerySection(schema);
    case "testimonials":
      return renderStructuredTestimonialsSection(schema);
    case "faq":
      return renderStructuredFaqSection(schema);
    case "contact":
      return renderStructuredContactSection(schema);
    case "cta":
      return renderStructuredCtaSection(schema);
    default:
      return "";
  }
}
function buildHomePageBlocks(schema) {
  return [
    renderNavBlocks(schema),
    ...(Array.isArray(schema.sections) ? schema.sections : []).map(
      (section) => renderStructuredSection(schema, section)
    )
  ].filter(Boolean).join("\n\n");
}
function buildAboutPageBlocks(schema) {
  const hero = getSection(schema, "hero");
  const voice = getSiteVoice(schema);
  const intro = hero?.subheadline || schema.seo.description || `${schema.brand.businessName} is a modern ${schema.brand.category} brand.`;
  const highlights = [
    `Category: ${schema.brand.category}`,
    `Style Direction: ${schema.theme.name}`,
    `Experience Focus: ${schema.theme.style}`
  ];
  return [
    renderNavBlocks(schema),
    wrapHtmlBlock(`
<section class="wp-section wp-about" data-layout="editorial">
  <header class="wp-section__header">
    <p class="wp-section__eyebrow">About</p>
    <h1>${escapeHtml(voice.aboutTitle)}</h1>
  </header>
  <div class="wp-about__content">
    <p>${escapeHtml(intro)}</p>
    <ul>
      ${highlights.map((item) => `<li>${escapeHtml(item)}</li>`).join("\n      ")}
    </ul>
  </div>
</section>`),
    renderStructuredTestimonialsSection(schema)
  ].filter(Boolean).join("\n\n");
}
function buildServicesPageBlocks(schema) {
  const voice = getSiteVoice(schema);
  return [
    renderNavBlocks(schema),
    wrapHtmlBlock(`
<section class="wp-section wp-services" data-layout="editorial">
  <header class="wp-section__header">
    <p class="wp-section__eyebrow">Services</p>
    <h1>${escapeHtml(voice.featuresTitle)}</h1>
  </header>
</section>`),
    renderStructuredFeaturesSection(schema),
    renderStructuredCtaSection(schema)
  ].filter(Boolean).join("\n\n");
}
function buildGalleryPageBlocks(schema) {
  const voice = getSiteVoice(schema);
  return [
    renderNavBlocks(schema),
    wrapHtmlBlock(`
<section class="wp-section wp-gallery-page" data-layout="editorial">
  <header class="wp-section__header">
    <p class="wp-section__eyebrow">Gallery</p>
    <h1>${escapeHtml(voice.galleryTitle)}</h1>
  </header>
</section>`),
    renderStructuredGallerySection(schema)
  ].filter(Boolean).join("\n\n");
}
function buildFaqPageBlocks(schema) {
  const voice = getSiteVoice(schema);
  return [
    renderNavBlocks(schema),
    wrapHtmlBlock(`
<section class="wp-section wp-faq-page" data-layout="editorial">
  <header class="wp-section__header">
    <p class="wp-section__eyebrow">FAQ</p>
    <h1>${escapeHtml(voice.faqTitle)}</h1>
  </header>
</section>`),
    renderStructuredFaqSection(schema)
  ].filter(Boolean).join("\n\n");
}
function buildContactPageBlocks(schema) {
  const voice = getSiteVoice(schema);
  return [
    renderNavBlocks(schema),
    wrapHtmlBlock(`
<section class="wp-section wp-contact-page" data-layout="split">
  <header class="wp-section__header">
    <p class="wp-section__eyebrow">Contact</p>
    <h1>${escapeHtml(voice.contactTitle)}</h1>
  </header>
</section>`),
    renderStructuredContactSection(schema)
  ].filter(Boolean).join("\n\n");
}
function schemaToGutenbergBlocks(schema) {
  if (!schema) {
    return "";
  }
  return buildHomePageBlocks(schema);
}
function collectWordPressMediaAssets(schema) {
  const assets = [];
  for (const section of schema.sections) {
    if (section.type === "hero" && section.media?.src) {
      assets.push({
        sourceUrl: section.media.src,
        alt: section.media.alt || schema.brand.businessName,
        preferredFilename: `${schema.meta.slug}-hero`
      });
    }
    if (section.type === "gallery" && Array.isArray(section.items)) {
      for (const [index, item] of section.items.entries()) {
        assets.push({
          sourceUrl: item.src,
          alt: item.alt || `${schema.brand.businessName} gallery ${index + 1}`,
          preferredFilename: `${schema.meta.slug}-gallery-${index + 1}`
        });
      }
    }
  }
  const unique = /* @__PURE__ */ new Map();
  for (const asset of assets) {
    if (asset.sourceUrl) {
      unique.set(asset.sourceUrl, asset);
    }
  }
  return Array.from(unique.values());
}
function buildWordPressSitePages(schema) {
  const pages = [
    {
      title: schema.brand.businessName || "Home",
      slug: "home",
      content: buildHomePageBlocks(schema),
      isHomepage: true
    },
    {
      title: "About",
      slug: "about",
      content: buildAboutPageBlocks(schema)
    },
    {
      title: "Services",
      slug: "services",
      content: buildServicesPageBlocks(schema)
    },
    {
      title: "Gallery",
      slug: "gallery",
      content: buildGalleryPageBlocks(schema)
    },
    {
      title: "FAQ",
      slug: "faq",
      content: buildFaqPageBlocks(schema)
    },
    {
      title: "Contact",
      slug: "contact",
      content: buildContactPageBlocks(schema)
    }
  ];
  return pages;
}
function buildWordPressProvisioningPlan(schema, business, options) {
  const schemaMeta = schema.meta || {};
  const siteSlug = slugify(schemaMeta.slug || business.name || "client-site");
  const emailSlug = slugify(
    business.name || schema.brand.businessName || "client"
  );
  const ownerEmail = options?.ownerEmail || business.email || `${emailSlug}@example-client.test`;
  const ownerUsername = options?.ownerUsername || slugify(`${emailSlug}-${schemaMeta.businessId || business.id || "lead"}`);
  return {
    siteTitle: schema.brand.businessName || business.name || schema.seo.title || "Client Site",
    siteSlug,
    ownerEmail,
    ownerUsername,
    ownerDisplayName: schema.brand.businessName || business.name || ownerUsername,
    baseTheme: options?.baseTheme || "digital-scout-base-theme",
    pages: buildWordPressSitePages(schema),
    media: collectWordPressMediaAssets(schema),
    themeSettings: {
      palette: schema.theme.palette,
      typography: schema.theme.typography,
      radius: schema.theme.radius,
      style: schema.theme.style,
      name: schema.theme.name
    }
  };
}
var init_wordpress = __esm({
  "src/lib/wordpress.ts"() {
  }
});

// src/lib/direct-homepage-renderer.ts
function escapeHtml2(s) {
  return (s || "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}
function pickHeroImage(schema) {
  const photos = schema.brand && schema.brand.photos || schema.photos || [];
  if (photos && photos.length) return photos[0];
  const src = (schema.sections || []).map(
    (s) => s.media && s.media.src || s.items && s.items[0] && s.items[0].src
  ).find(Boolean);
  return src || "";
}
function renderBusinessHomepage(schema) {
  const brand = schema.brand || {};
  const name = escapeHtml2(brand.businessName || "Your Business");
  const category = escapeHtml2(brand.category || "Local Service");
  const address = escapeHtml2(brand.address || "");
  const phone = escapeHtml2(brand.phone || "");
  const heroImage = pickHeroImage(schema);
  const css = `:root{--bg:#fafafa;--surface:#ffffff;--muted:#6b7280;--accent:#1e40af;--radius:16px;--gap:24px}
body{margin:0;font-family:Inter,system-ui,Segoe UI,Roboto,-apple-system,Helvetica,Arial;color:#0f172a;background:var(--bg)}
.site{max-width:1200px;margin:0 auto;padding:40px 20px}
.hero{display:grid;grid-template-columns:1fr 520px;gap:var(--gap);align-items:center;padding:48px 0}
.hero__content{padding:28px;background:var(--surface);border-radius:var(--radius);box-shadow:0 10px 30px rgba(2,6,23,0.06)}
.hero__eyebrow{color:var(--accent);font-weight:700;letter-spacing:0.08em;font-size:0.85rem;margin-bottom:8px}
.hero__title{font-size:clamp(2rem,4vw,3.6rem);margin:0 0 12px;line-height:1.02}
.hero__lead{color:var(--muted);margin:0 0 18px;max-width:44ch}
.cta-row{display:flex;gap:12px}
.btn{display:inline-block;padding:12px 18px;border-radius:10px;text-decoration:none;font-weight:700}
.btn--primary{background:var(--accent);color:#fff}
.btn--secondary{background:transparent;border:2px solid rgba(15,23,42,0.06);color:var(--accent)}
.hero__visual{border-radius:var(--radius);overflow:hidden;height:440px;background-size:cover;background-position:center;box-shadow:0 18px 50px rgba(2,6,23,0.08)}
.section{display:grid;grid-template-columns:1fr 1fr;gap:32px;padding:64px 0;align-items:start}
.section--stack{grid-template-columns:1fr}
.services{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:18px}
.service{background:var(--surface);padding:18px;border-radius:12px;box-shadow:0 8px 30px rgba(2,6,23,0.04)}
.gallery{display:grid;grid-template-columns:repeat(3,1fr);gap:12px}
.gallery img{width:100%;height:160px;object-fit:cover;border-radius:12px}
.trust-cards{display:flex;gap:12px;flex-wrap:wrap}
.trust{background:var(--surface);padding:16px;border-radius:10px;min-width:180px}
.contact{background:linear-gradient(180deg,#fff,#f8fafc);padding:20px;border-radius:12px}
@media(max-width:980px){.hero{grid-template-columns:1fr;gap:18px}.hero__visual{height:320px}.section{grid-template-columns:1fr}.gallery{grid-template-columns:repeat(2,1fr)}}`;
  const heroHtml = `
  <header class="hero">
    <div class="hero__content">
      <div class="hero__eyebrow">${category}</div>
      <h1 class="hero__title">${name}</h1>
      <p class="hero__lead">Museum-quality restoration and meticulous workshop craftsmanship. We repair, restore and preserve heirlooms with visible provenance and local authenticity.</p>
      <div class="cta-row">
        <a class="btn btn--primary" href="#contact">Book a consultation</a>
        <a class="btn btn--secondary" href="#gallery">View the work</a>
      </div>
      <div style="margin-top:18px;color:var(--muted);font-size:0.95rem">${address}${phone ? ` \u2022 ${phone}` : ""}</div>
    </div>
    <div class="hero__visual" style="background-image:url('${escapeHtml2(heroImage)}')"></div>
  </header>`;
  const servicesSection = (schema.sections || []).find(
    (s) => s.type === "features" || s.type === "service"
  );
  const services = servicesSection && Array.isArray(servicesSection.items) ? servicesSection.items.slice(0, 4).map(
    (it) => `<div class="service"><strong>${escapeHtml2(it.title || it.name || "Service")}</strong><p style="margin:8px 0 0;color:var(--muted)">${escapeHtml2(it.description || it.copy || "Professional service delivered with care.")}</p></div>`
  ).join("") : [
    `<div class="service"><strong>Conservation & Restoration</strong><p style="margin:8px 0 0;color:var(--muted)">Museum-grade restoration for antiques and heirlooms.</p></div>`,
    `<div class="service"><strong>Refinishing & Repair</strong><p style="margin:8px 0 0;color:var(--muted)">Structural repairs and surface refinishing to restore integrity.</p></div>`
  ].join("");
  const servicesHtml = `<section class="section"><div><h2>What we do</h2><div class="services">${services}</div></div><aside><h3>Why choose us</h3><p style="color:var(--muted)">Local workshop with decades of experience, transparent process, and visible before/after evidence.</p><div class="trust-cards"><div class="trust"><strong>4.9/5</strong><div style="color:var(--muted)">Average client rating</div></div><div class="trust"><strong>Certified</strong><div style="color:var(--muted)">Conservation-grade materials</div></div></div></aside></section>`;
  const galleryImages = ((schema.sections || []).filter((s) => s.type === "gallery").flatMap((g) => g.items || []) || []).slice(0, 6).map((it) => it.src).filter(Boolean);
  const galleryHtml = `<section id="gallery" class="section section--stack"><div><h2>Selected work</h2><div class="gallery">${(galleryImages.length ? galleryImages : [""]).map((src) => `<img src="${escapeHtml2(src || "")}">`).join("")}</div></div></section>`;
  const testimonials = ((schema.sections || []).find((s) => s.type === "testimonials") || {}).items || [];
  const testimonialsHtml = testimonials.length ? `<section class="section"><div><h2>What clients say</h2><div>${testimonials.slice(0, 3).map(
    (t) => `<div class="service"><blockquote style="margin:0 0 8px">${escapeHtml2(t.copy || t.content || t.text || "Great work.")}</blockquote><footer style="color:var(--muted);font-size:0.9rem">\u2014 ${escapeHtml2(t.author || "Client")}</footer></div>`
  ).join("")}</div></div></section>` : "";
  const contactHtml = `<section id="contact" class="section"><div><h2>Contact</h2><div class="contact"><p style="margin:0 0 8px;color:var(--muted)">Ready to start? Book an in-workshop consultation.</p><p style="margin:0"><strong>${name}</strong><br/>${address}<br/>${phone ? `<a href="tel:${phone}">${phone}</a>` : ""}</p></div></div><aside><h3>Request a quote</h3><p style="color:var(--muted)">Send images of your piece and we'll follow up with next steps.</p></aside></section>`;
  const html = `<main class="site">${heroHtml}${servicesHtml}${galleryHtml}${testimonialsHtml}${contactHtml}</main>`;
  return { html, css };
}
var init_direct_homepage_renderer = __esm({
  "src/lib/direct-homepage-renderer.ts"() {
  }
});

// src/lib/premium-site-builder.ts
var premium_site_builder_exports = {};
__export(premium_site_builder_exports, {
  buildPremiumPageContent: () => buildPremiumPageContent,
  esc: () => esc
});
function esc(str) {
  return (str || "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}
function buildPremiumPageContent(schema) {
  if (schema && schema._wordpressHtml) {
    return schema._wordpressHtml;
  }
  const result = renderBusinessHomepage(schema);
  const cssBlock = `<!-- wp:html -->
<style>
${result.css}
</style>
<!-- /wp:html -->`;
  const wrappedHtml = `<!-- wp:group {"align":"full","layout":{"type":"constrained"}} -->
<div class="wp-block-group alignfull">
${result.html}
</div>
<!-- /wp:group -->`;
  return `${cssBlock}

${wrappedHtml}`;
}
var init_premium_site_builder = __esm({
  "src/lib/premium-site-builder.ts"() {
    init_direct_homepage_renderer();
  }
});

// src/lib/layout-registry.ts
var HERO_LAYOUTS, FEATURES_LAYOUTS, GALLERY_LAYOUTS, TESTIMONIALS_LAYOUTS, CTA_LAYOUTS, FAQ_LAYOUTS, CONTACT_LAYOUTS;
var init_layout_registry = __esm({
  "src/lib/layout-registry.ts"() {
    HERO_LAYOUTS = [
      "immersive-split",
      "minimal-centered",
      "editorial-left",
      "stacked-media",
      "luxury-overlap",
      "split-modern-dark",
      "centered-glass"
    ];
    FEATURES_LAYOUTS = [
      "bento-grid",
      "alternating-stack",
      "icon-list",
      "feature-cards",
      "editorial-rows",
      "masonry-grid"
    ];
    GALLERY_LAYOUTS = [
      "masonry-cinematic",
      "asymmetrical-overlap",
      "standard-grid",
      "collage-editorial"
    ];
    TESTIMONIALS_LAYOUTS = [
      "floating-cards",
      "editorial-quotes",
      "timeline-scroll",
      "split-highlight"
    ];
    CTA_LAYOUTS = [
      "centered-premium",
      "side-by-side-split",
      "immersive-banner",
      "minimal-inline"
    ];
    FAQ_LAYOUTS = ["accordion-clean", "split-columns"];
    CONTACT_LAYOUTS = ["split-card", "minimal-centered"];
  }
});

// src/lib/website-schema-validator.ts
var website_schema_validator_exports = {};
__export(website_schema_validator_exports, {
  validateWebsiteSchema: () => validateWebsiteSchema
});
function validateWebsiteSchema(schema) {
  const errors = [];
  const repairs = [];
  if (!schema) {
    return { isValid: false, errors: ["Schema is null or undefined"] };
  }
  if (schema.schemaVersion !== "1.0") {
    schema.schemaVersion = "1.0";
    repairs.push("version_forced_1.0");
  }
  if (!schema.meta || !schema.theme || !schema.brand || !Array.isArray(schema.sections)) {
    return {
      isValid: false,
      errors: ["Missing core top-level objects (meta, theme, brand, sections)"]
    };
  }
  const repairedSections = schema.sections.map(
    (section, index) => {
      const type = (section.type || "unknown").toLowerCase();
      section.type = type;
      const normalizeValue = (value) => (value || "").toString().toLowerCase();
      const validateLayout = (layout, variant, allowed, variantAllowed, fallback) => {
        const finalLayout = layout || variant || fallback;
        section.layout = finalLayout;
        if (variant) {
          section.variant = variant;
        }
      };
      switch (type) {
        case "hero":
          validateLayout(
            section.layout,
            section.variant,
            [...HERO_LAYOUTS, ...HERO_VARIANTS],
            HERO_VARIANTS,
            "editorial-left"
          );
          break;
        case "features":
          validateLayout(
            section.layout,
            section.variant,
            [...FEATURES_LAYOUTS, ...FEATURES_VARIANTS],
            FEATURES_VARIANTS,
            "feature-cards"
          );
          break;
        case "gallery":
          validateLayout(
            section.layout,
            section.variant,
            [...GALLERY_LAYOUTS, ...GALLERY_VARIANTS],
            GALLERY_VARIANTS,
            "standard-grid"
          );
          break;
        case "testimonials":
          validateLayout(
            section.layout,
            section.variant,
            [...TESTIMONIALS_LAYOUTS, ...TESTIMONIALS_VARIANTS],
            TESTIMONIALS_VARIANTS,
            "floating-cards"
          );
          break;
        case "cta":
          validateLayout(
            section.layout,
            section.variant,
            [...CTA_LAYOUTS, ...CTA_VARIANTS],
            CTA_VARIANTS,
            "centered-premium"
          );
          break;
        case "faq":
          validateLayout(
            section.layout,
            section.variant,
            [...FAQ_LAYOUTS, ...FAQ_VARIANTS],
            FAQ_VARIANTS,
            "accordion-clean"
          );
          break;
        case "contact":
          validateLayout(
            section.layout,
            section.variant,
            [...CONTACT_LAYOUTS, ...CONTACT_VARIANTS],
            CONTACT_VARIANTS,
            "split-card"
          );
          break;
        default:
          if (!section.layout) {
            section.layout = "custom-block";
          }
          break;
      }
      if (!section.id) {
        section.id = `${type}-${index}`;
        repairs.push(`section_${index}_missing_id_auto_gen`);
      }
      return section;
    }
  );
  if (!schema.brand.businessName) errors.push("Missing businessName in brand");
  if (!schema.theme.brandDNA) errors.push("Missing brandDNA in theme");
  return {
    isValid: errors.length === 0,
    errors,
    repairedSchema: {
      ...schema,
      sections: repairedSections,
      _validation: {
        repairs,
        validatedAt: (/* @__PURE__ */ new Date()).toISOString()
      }
    }
  };
}
var HERO_VARIANTS, FEATURES_VARIANTS, GALLERY_VARIANTS, TESTIMONIALS_VARIANTS, CTA_VARIANTS, FAQ_VARIANTS, CONTACT_VARIANTS;
var init_website_schema_validator = __esm({
  "src/lib/website-schema-validator.ts"() {
    init_layout_registry();
    HERO_VARIANTS = [
      "immersive",
      "cinematic",
      "editorial",
      "editorial-split",
      "magazine",
      "centered",
      "minimal",
      "split"
    ];
    FEATURES_VARIANTS = [
      "bento",
      "editorial-cards",
      "editorial-list",
      "alternating-stack",
      "grid"
    ];
    GALLERY_VARIANTS = [
      "editorial-mosaic",
      "stacked-collage",
      "collage"
    ];
    TESTIMONIALS_VARIANTS = [
      "floating-cards",
      "editorial-quotes",
      "spotlight"
    ];
    CTA_VARIANTS = ["gradient-band", "split-card", "side-by-side"];
    FAQ_VARIANTS = ["cards", "split-columns", "grid"];
    CONTACT_VARIANTS = [
      "split-card",
      "minimal-centered",
      "centered"
    ];
  }
});

// src/lib/env.ts
import dotenv from "dotenv";
import path from "path";
import fs from "fs";
import { fileURLToPath } from "url";
var cwd = process.cwd();
var __filename = fileURLToPath(import.meta.url);
var __dirname = path.dirname(__filename);
var bundleRoot = path.resolve(__dirname, "../");
var searchPaths = [cwd, bundleRoot];
var envFiles = [".env.production", ".env.local", ".env"];
console.error(`[Env] Searching in: ${searchPaths.join(", ")}`);
try {
  const files = fs.readdirSync(cwd);
  console.error(`[Env] Files found in ${cwd}: ${files.join(", ")}`);
} catch (e) {
  console.error(`[Env] Could not list files in ${cwd}: ${e.message}`);
}
for (const root of searchPaths) {
  for (const file of envFiles) {
    const fullPath = path.join(root, file);
    if (fs.existsSync(fullPath)) {
      console.error(`[Env] Found environment file: ${fullPath}`);
      const result = dotenv.config({
        path: fullPath,
        override: file === ".env.production"
      });
      if (result.error) {
        console.error(`[Env] Error parsing ${fullPath}: ${result.error.message}`);
      } else {
        console.error(`[Env] Successfully loaded ${fullPath} (override: ${file === ".env.production"})`);
      }
    }
  }
}
if (!process.env.DB_USER) {
  console.error("[Env] WARNING: DB_USER is not set after loading environment files.");
} else {
  console.error(`[Env] DB_USER is set to: ${process.env.DB_USER}`);
}
var env_default = process.env;

// server.ts
import crossFetch3 from "cross-fetch";
import crypto2 from "crypto";
import cors from "cors";
import express from "express";
import fs7 from "fs";
import path6, { dirname } from "path";
import { fileURLToPath as fileURLToPath2 } from "url";

// src/lib/callhippo-service.ts
async function sendOutreachViaCallHippo(request, apiKey) {
  const { businessName, phoneNumber, message, preferredChannel } = request;
  const TEST_MOCK = process.env.CALLHIPPO_TEST_MOCK === "true";
  const TEST_TARGET = process.env.CALLHIPPO_TEST_TARGET;
  const FORCE_SUCCESS = process.env.CALLHIPPO_FORCE_SUCCESS === "true";
  if (TEST_MOCK) {
    const target = TEST_TARGET || phoneNumber;
    console.log(
      `[CallHippo][MOCK] Pretending to send ${preferredChannel} to ${target} for ${businessName}`
    );
    return {
      success: true,
      channel: preferredChannel,
      messageId: `mock-${Date.now()}`,
      status: "mocked"
    };
  }
  console.log(
    `[CallHippo] Outreach request for ${businessName} (${phoneNumber}) via ${preferredChannel}`
  );
  if (preferredChannel === "whatsapp") {
    try {
      const result = await sendWhatsAppMessage(phoneNumber, message, apiKey);
      if (result.success) {
        console.log(`[CallHippo] WhatsApp sent successfully to ${phoneNumber}`);
        return result;
      }
    } catch (whatsappError) {
      console.warn(
        `[CallHippo] WhatsApp failed for ${phoneNumber}, falling back to SMS:`,
        whatsappError instanceof Error ? whatsappError.message : whatsappError
      );
    }
  }
  try {
    const result = await sendSmsMessage(phoneNumber, message, apiKey);
    if (result.success) {
      console.log(`[CallHippo] SMS sent successfully to ${phoneNumber}`);
      return result;
    }
    if (FORCE_SUCCESS) {
      console.warn(
        `[CallHippo][FORCE_SUCCESS] Returning demo success for ${phoneNumber}`
      );
      return {
        success: true,
        channel: preferredChannel,
        messageId: `forced-${Date.now()}`,
        status: "forced-success"
      };
    }
    return result;
  } catch (smsError) {
    const errorMsg = smsError instanceof Error ? smsError.message : String(smsError);
    console.error(`[CallHippo] SMS also failed for ${phoneNumber}:`, errorMsg);
    if (FORCE_SUCCESS) {
      console.warn(
        `[CallHippo][FORCE_SUCCESS] API failed, returning demo success for ${phoneNumber}`
      );
      return {
        success: true,
        channel: preferredChannel,
        messageId: `forced-${Date.now()}`,
        status: "forced-success"
      };
    }
    return {
      success: false,
      channel: "sms",
      error: `SMS delivery failed: ${errorMsg}`
    };
  }
}
async function sendWhatsAppMessage(phoneNumber, message, apiKey) {
  const formattedPhone = formatPhoneNumber(phoneNumber);
  const url = "https://api.callhippo.com/v1/whatsapp/send";
  const payload = {
    to: formattedPhone,
    message
  };
  console.log(`[CallHippo] Attempting WhatsApp to ${formattedPhone}`);
  try {
    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`
      },
      body: JSON.stringify(payload)
    });
    if (!response.ok) {
      const errorText = await response.text();
      console.warn(
        `[CallHippo] WhatsApp API returned ${response.status}:`,
        errorText
      );
      if (response.status >= 400 && response.status < 500) {
        throw new Error(`WhatsApp not available: ${response.statusText}`);
      }
      throw new Error(
        `WhatsApp API error: ${response.status} ${response.statusText}`
      );
    }
    const data = await response.json();
    console.log(`[CallHippo] WhatsApp success response:`, data);
    return {
      success: true,
      channel: "whatsapp",
      messageId: data.id || data.messageId,
      status: data.status || "sent"
    };
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : String(error);
    console.warn(`[CallHippo] WhatsApp error:`, errorMsg);
    throw error;
  }
}
async function sendSmsMessage(phoneNumber, message, apiKey) {
  const formattedPhone = formatPhoneNumber(phoneNumber);
  const url = "https://api.callhippo.com/v1/sms/send";
  const payload = {
    to: formattedPhone,
    message
  };
  console.log(`[CallHippo] Attempting SMS to ${formattedPhone}`);
  try {
    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`
      },
      body: JSON.stringify(payload)
    });
    if (!response.ok) {
      const errorText = await response.text();
      console.warn(
        `[CallHippo] SMS API returned ${response.status}:`,
        errorText
      );
      throw new Error(
        `SMS API error: ${response.status} ${response.statusText}`
      );
    }
    const data = await response.json();
    console.log(`[CallHippo] SMS success response:`, data);
    return {
      success: true,
      channel: "sms",
      messageId: data.id || data.messageId,
      status: data.status || "sent"
    };
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : String(error);
    console.warn(`[CallHippo] SMS error:`, errorMsg);
    throw error;
  }
}
function formatPhoneNumber(phone) {
  const cleaned = phone.replace(/[\s\-\(\)\.]/g, "");
  if (!cleaned.startsWith("+")) {
    return `+1${cleaned.replace(/^1/, "")}`;
  }
  return cleaned;
}

// src/lib/db.ts
import mysql from "mysql2/promise";
var pool = mysql.createPool({
  host: process.env.DB_HOST || "127.0.0.1",
  user: process.env.DB_USER || "root",
  password: process.env.DB_PASSWORD || "",
  database: process.env.DB_NAME || "digitalscout",
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
});
console.error(`[DB] Pool initialized. User: ${process.env.DB_USER || "root (default)"}, Host: ${process.env.DB_HOST || "127.0.0.1"}`);
async function initializeDatabase() {
  try {
    await pool.query(`
			CREATE TABLE IF NOT EXISTS provisioning_jobs (
				id VARCHAR(255) PRIMARY KEY,
				project_id VARCHAR(255) NOT NULL,
				business_name VARCHAR(255) NULL,
				website_schema JSON NULL,
				status ENUM('lead', 'pending', 'creating_subdomain', 'creating_database', 'installing_wordpress', 'configuring_wordpress', 'deploying_content', 'validating', 'completed', 'failed') DEFAULT 'lead',
				subdomain VARCHAR(255) NULL,
				db_name VARCHAR(255) NULL,
				db_user VARCHAR(255) NULL,
				db_pass_encrypted TEXT NULL,
				wp_admin_user VARCHAR(255) NULL,
				wp_admin_pass_encrypted TEXT NULL,
				retry_count INT DEFAULT 0,
				locked_at DATETIME NULL,
				logs JSON NULL,
				created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
				updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
				trace_id VARCHAR(255) NULL,
				is_preview BOOLEAN DEFAULT FALSE,
				preview_expires_at DATETIME NULL,
				generation_metrics JSON NULL,
				gutenberg_trace LONGTEXT NULL,
				raw_ai_trace JSON NULL,
				INDEX idx_status (status),
				INDEX idx_project (project_id),
				INDEX idx_trace (trace_id),
				INDEX idx_preview_expiry (preview_expires_at)
			) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
		`);
    await pool.query(`
			CREATE TABLE IF NOT EXISTS generation_audit_logs (
				id INT AUTO_INCREMENT PRIMARY KEY,
				trace_id VARCHAR(255) NOT NULL,
				step VARCHAR(100) NOT NULL,
				message TEXT NOT NULL,
				data JSON NULL,
				created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
				INDEX idx_trace (trace_id)
			) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
		`);
    try {
      await pool.query(`ALTER TABLE provisioning_jobs MODIFY COLUMN status ENUM('lead', 'pending', 'creating_subdomain', 'creating_database', 'installing_wordpress', 'configuring_wordpress', 'deploying_content', 'validating', 'completed', 'failed') DEFAULT 'lead'`);
    } catch (e) {
    }
    try {
      await pool.query(`ALTER TABLE provisioning_jobs ADD COLUMN website_schema JSON NULL AFTER business_name`);
    } catch (e) {
    }
    try {
      await pool.query(`ALTER TABLE provisioning_jobs ADD COLUMN db_pass_encrypted TEXT NULL AFTER db_user`);
    } catch (e) {
    }
    try {
      await pool.query(`ALTER TABLE provisioning_jobs ADD COLUMN business_name VARCHAR(255) NULL AFTER project_id`);
    } catch (e) {
    }
    try {
      await pool.query(`ALTER TABLE provisioning_jobs ADD COLUMN trace_id VARCHAR(255) NULL AFTER updated_at`);
    } catch (e) {
    }
    try {
      await pool.query(`ALTER TABLE provisioning_jobs ADD COLUMN is_preview BOOLEAN DEFAULT FALSE AFTER trace_id`);
    } catch (e) {
    }
    try {
      await pool.query(`ALTER TABLE provisioning_jobs ADD COLUMN preview_expires_at DATETIME NULL AFTER is_preview`);
    } catch (e) {
    }
    try {
      await pool.query(`ALTER TABLE provisioning_jobs ADD COLUMN generation_metrics JSON NULL AFTER preview_expires_at`);
    } catch (e) {
    }
    try {
      await pool.query(`ALTER TABLE provisioning_jobs ADD COLUMN gutenberg_trace LONGTEXT NULL AFTER generation_metrics`);
    } catch (e) {
    }
    try {
      await pool.query(`ALTER TABLE provisioning_jobs ADD COLUMN raw_ai_trace JSON NULL AFTER gutenberg_trace`);
    } catch (e) {
    }
    try {
      await pool.query(`ALTER TABLE provisioning_jobs ADD INDEX idx_trace (trace_id)`);
    } catch (e) {
    }
    try {
      await pool.query(`ALTER TABLE provisioning_jobs ADD INDEX idx_preview_expiry (preview_expires_at)`);
    } catch (e) {
    }
    await pool.query(`
			CREATE TABLE IF NOT EXISTS isolated_deployments (
				id VARCHAR(255) PRIMARY KEY,
				project_id VARCHAR(255) NOT NULL,
				subdomain_url VARCHAR(255) NOT NULL,
				wp_admin_url VARCHAR(255) NOT NULL,
				admin_username VARCHAR(255) NOT NULL,
				encrypted_admin_password TEXT NOT NULL,
				website_schema JSON NULL,
				ssl_status ENUM('pending', 'valid') DEFAULT 'pending',
				last_ssl_check DATETIME NULL,
				created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
				UNIQUE KEY uk_project (project_id)
			) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
		`);
    await pool.query(`
			CREATE TABLE IF NOT EXISTS lead_ai_messages (
				id INT AUTO_INCREMENT PRIMARY KEY,
				lead_id VARCHAR(255) NOT NULL,
				conversation_id VARCHAR(255) NOT NULL,
				role VARCHAR(50) NOT NULL,
				content TEXT NOT NULL,
				created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
				INDEX idx_lead_conv (lead_id, conversation_id)
			) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
		`);
    await pool.query(`
			CREATE TABLE IF NOT EXISTS users (
				id VARCHAR(255) PRIMARY KEY,
				name VARCHAR(255) NOT NULL,
				email VARCHAR(255) NOT NULL UNIQUE,
				password_hash VARCHAR(255) NOT NULL,
				is_verified BOOLEAN DEFAULT FALSE,
				created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
				updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
			) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
		`);
    await pool.query(`
			CREATE TABLE IF NOT EXISTS otp_verifications (
				id INT AUTO_INCREMENT PRIMARY KEY,
				email VARCHAR(255) NOT NULL,
				otp_code VARCHAR(10) NOT NULL,
				expires_at DATETIME NOT NULL,
				created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
				INDEX idx_email_otp (email, otp_code)
			) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
		`);
    await pool.query(`
			CREATE TABLE IF NOT EXISTS password_resets (
				id INT AUTO_INCREMENT PRIMARY KEY,
				email VARCHAR(255) NOT NULL,
				token VARCHAR(255) NOT NULL UNIQUE,
				expires_at DATETIME NOT NULL,
				created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
				INDEX idx_token (token)
			) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
		`);
    try {
      await pool.query(`ALTER TABLE provisioning_jobs ADD COLUMN user_id VARCHAR(255) NULL AFTER id`);
    } catch (e) {
    }
    try {
      await pool.query(`ALTER TABLE provisioning_jobs ADD INDEX idx_user_id (user_id)`);
    } catch (e) {
    }
    try {
      await pool.query(`ALTER TABLE isolated_deployments ADD COLUMN website_schema JSON NULL AFTER encrypted_admin_password`);
    } catch (e) {
    }
    try {
      await pool.query(`ALTER TABLE isolated_deployments ADD COLUMN ssl_status ENUM('pending', 'valid') DEFAULT 'pending' AFTER website_schema`);
    } catch (e) {
    }
    try {
      await pool.query(`ALTER TABLE isolated_deployments ADD COLUMN last_ssl_check DATETIME NULL AFTER ssl_status`);
    } catch (e) {
    }
    console.log("[DB] Provisioning schema initialized successfully.");
  } catch (error) {
    console.error("[DB] Failed to initialize schema:", error);
  }
}

// src/lib/provisioning-engine.ts
import * as crypto from "crypto";
import * as fs5 from "fs";
import * as path4 from "path";
import crossFetch2 from "cross-fetch";

// src/lib/cpanel-uapi.ts
import { exec } from "child_process";
import { promisify } from "util";
var execAsync = promisify(exec);
function getSshPrefix() {
  const host = process.env.WP_SSH_HOST;
  const port = process.env.WP_SSH_PORT || "22";
  const user = process.env.WP_SSH_USER;
  const keyPath = process.env.WP_SSH_KEY_PATH || "";
  if (!host || !user) {
    throw new Error(
      "WP_SSH_HOST and WP_SSH_USER must be set to run cPanel UAPI commands remotely."
    );
  }
  const keyFlag = keyPath ? `-i "${keyPath}"` : "";
  return [
    "ssh",
    "-p",
    port,
    keyFlag,
    "-o StrictHostKeyChecking=no",
    "-o ConnectTimeout=30",
    "-o BatchMode=yes",
    `${user}@${host}`
  ].filter(Boolean).join(" ");
}
async function callUapiRemote(module, func, params) {
  const paramStr = Object.entries(params).map(([k, v]) => `${k}=${v.replace(/'/g, "\\'")}`).join(" ");
  const uapiCmd = `uapi --output=json ${module} ${func} ${paramStr}`;
  const sshPrefix = getSshPrefix();
  const fullCmd = `${sshPrefix} '${uapiCmd}'`;
  process.stderr.write(`[cPanel-SSH] ${module}::${func} ${paramStr}
`);
  try {
    const { stdout, stderr } = await execAsync(fullCmd, { timeout: 6e4 });
    if (stderr.trim()) {
      process.stderr.write(`[cPanel-SSH] STDERR: ${stderr.trim()}
`);
    }
    let parsed;
    try {
      parsed = JSON.parse(stdout);
    } catch (e) {
      throw new Error(
        `cPanel UAPI returned invalid JSON: ${stdout.substring(0, 300)}`
      );
    }
    const result = parsed?.result;
    if (!result) {
      throw new Error(
        `Unexpected cPanel UAPI response shape: ${JSON.stringify(parsed).substring(0, 300)}`
      );
    }
    if (result.status === 0 || result.errors && result.errors.length > 0) {
      const errMsg = Array.isArray(result.errors) ? result.errors.join(", ") : "Unknown cPanel error";
      throw new Error(`cPanel UAPI Error (${module}::${func}): ${errMsg}`);
    }
    process.stderr.write(`[cPanel-SSH] ${module}::${func} \u2192 OK
`);
    return result.data;
  } catch (error) {
    if (error.message?.includes("cPanel UAPI")) throw error;
    throw new Error(
      `cPanel SSH command failed (${module}::${func}): ${error.message}`
    );
  }
}
async function addSubdomain(subdomain, rootDomain, documentRoot) {
  const cpanelUser = process.env.CPANEL_USERNAME || "";
  const homePrefix = `/home/${cpanelUser}/`;
  const relativeDir = documentRoot.startsWith(homePrefix) ? documentRoot.slice(homePrefix.length) : documentRoot;
  return callUapiRemote("SubDomain", "addsubdomain", {
    domain: subdomain,
    rootdomain: rootDomain,
    dir: relativeDir
  });
}
async function deleteSubdomain(subdomain, rootDomain) {
  const fullDomain = `${subdomain}.${rootDomain}`;
  const underscoreDomain = `${subdomain}_${rootDomain}`;
  process.stderr.write(
    `[cPanel-SSH] Attempting to delete domain/subdomain: ${fullDomain}
`
  );
  try {
    await callUapiRemote("Domains", "remove_domain", {
      domain: fullDomain
    });
    return true;
  } catch (e) {
    console.warn(
      `[cPanel-SSH] Domains::remove_domain failed: ${e.message}. Trying legacy fallback...`
    );
  }
  try {
    await callUapiRemote("SubDomain", "delsubdomain", {
      domain: subdomain,
      rootdomain: rootDomain
    });
    return true;
  } catch (e) {
    console.warn(
      `[cPanel-SSH] SubDomain::delsubdomain (sub part) failed: ${e.message}. Trying full domain variant...`
    );
  }
  try {
    await callUapiRemote("SubDomain", "delsubdomain", {
      domain: fullDomain,
      rootdomain: rootDomain
    });
    return true;
  } catch (e) {
    console.warn(
      `[cPanel-SSH] SubDomain::delsubdomain (full part) failed: ${e.message}.`
    );
  }
  try {
    await callUapiRemote("SubDomain", "delete_subdomain", {
      domain: subdomain,
      rootdomain: rootDomain
    });
    return true;
  } catch (e) {
    console.warn(
      `[cPanel-SSH] SubDomain::delete_subdomain failed: ${e.message}.`
    );
  }
  const cpapi2Variants = [
    `cpapi2 --output=json SubDomain delsubdomain domain=${fullDomain}`,
    `cpapi2 --output=json SubDomain delsubdomain domain=${underscoreDomain}`,
    `/usr/local/cpanel/bin/cpapi2 --output=json SubDomain delsubdomain domain=${fullDomain}`,
    `/usr/local/cpanel/bin/cpapi2 --output=json SubDomain delsubdomain domain=${underscoreDomain}`
  ];
  for (const cpapi2Cmd of cpapi2Variants) {
    try {
      const sshPrefix = getSshPrefix();
      const fullCmd = `${sshPrefix} '${cpapi2Cmd}'`;
      process.stderr.write(
        `[cPanel-SSH] Attempting cpapi2 fallback: ${cpapi2Cmd}
`
      );
      const { stdout, stderr } = await execAsync(fullCmd, { timeout: 6e4 });
      process.stderr.write(`[cPanel-SSH] cpapi2 output: ${stdout.trim()}
`);
      if (stderr.trim()) {
        process.stderr.write(`[cPanel-SSH] cpapi2 stderr: ${stderr.trim()}
`);
      }
      let parsed;
      try {
        parsed = JSON.parse(stdout);
        const error = parsed?.cpanelresult?.error;
        if (error) {
          console.warn(`[cPanel-SSH] cpapi2 reported error in JSON response: ${error}`);
          continue;
        }
        const data = parsed?.cpanelresult?.data;
        if (data && data.result === 0) {
          console.warn(`[cPanel-SSH] cpapi2 reported failure in JSON data: ${data.reason}`);
          continue;
        }
      } catch (jsonErr) {
      }
      return true;
    } catch (e) {
      console.warn(
        `[cPanel-SSH] cpapi2 command failed (${cpapi2Cmd}): ${e.message}`
      );
    }
  }
  try {
    await callUapiRemote("DomainInfo", "delete_domain", {
      domain: fullDomain
    });
    return true;
  } catch (e) {
    console.error(
      `[cPanel-SSH] All UAPI subdomain deletion methods failed for ${fullDomain}. Final error: ${e.message}`
    );
  }
  const customCmd = process.env.CPANEL_DELETE_SUBDOMAIN_CMD;
  if (customCmd) {
    try {
      const sshPrefix = getSshPrefix();
      const resolved = customCmd.replace(/\{\{subdomain\}\}/g, subdomain).replace(/\{\{rootDomain\}\}/g, rootDomain).replace(/\{\{fullDomain\}\}/g, fullDomain);
      const fullCmd = `${sshPrefix} '${resolved}'`;
      process.stderr.write(
        `[cPanel-SSH] Attempting custom subdomain delete command for ${fullDomain}
`
      );
      await execAsync(fullCmd, { timeout: 6e4 });
      return true;
    } catch (e) {
      console.error(
        `[cPanel-SSH] Custom subdomain delete command failed for ${fullDomain}: ${e.message}`
      );
    }
  }
  throw new Error(
    `Subdomain deletion failed for ${fullDomain}. UAPI modules unavailable and no custom delete command succeeded.`
  );
}
async function createDatabase(dbName) {
  return callUapiRemote("Mysql", "create_database", { name: dbName });
}
async function deleteDatabase(dbName) {
  return callUapiRemote("Mysql", "delete_database", { name: dbName });
}
async function createDatabaseUser(dbUser, password) {
  return callUapiRemote("Mysql", "create_user", {
    name: dbUser,
    password
  });
}
async function deleteDatabaseUser(dbUser) {
  return callUapiRemote("Mysql", "delete_user", { name: dbUser });
}
async function setDatabasePrivileges(dbUser, dbName, privileges = "ALL PRIVILEGES") {
  return callUapiRemote("Mysql", "set_privileges_on_database", {
    user: dbUser,
    database: dbName,
    privileges
  });
}
async function checkSubdomainExists(subdomain, rootDomain) {
  const fullDomain = `${subdomain}.${rootDomain}`;
  try {
    const data = await callUapiRemote("DomainInfo", "list_domains", {});
    if (data) {
      const subdomains = data.sub_domains || [];
      const mainDomain = data.main_domain || "";
      const addonDomains = data.addon_domains || [];
      const parkedDomains = data.parked_domains || [];
      const all = [mainDomain, ...subdomains, ...addonDomains, ...parkedDomains].filter(Boolean).map((d) => d.toLowerCase());
      if (all.includes(fullDomain.toLowerCase())) {
        return true;
      }
    }
  } catch (e) {
    process.stderr.write(`[cPanel-SSH] DomainInfo::list_domains failed: ${e.message}. Trying SubDomain::listsubdomains...
`);
    try {
      const data = await callUapiRemote("SubDomain", "listsubdomains", {});
      if (Array.isArray(data)) {
        const found = data.some((sub) => {
          const dom = (sub.domain || "").toLowerCase();
          const subD = (sub.subdomain || "").toLowerCase();
          return dom === fullDomain.toLowerCase() || subD === subdomain.toLowerCase();
        });
        if (found) return true;
      }
    } catch (e2) {
      process.stderr.write(`[cPanel-SSH] SubDomain::listsubdomains failed: ${e2.message}.
`);
    }
  }
  return false;
}
async function remoteDirectoryExists(dirPath) {
  const sshPrefix = getSshPrefix();
  const cmd = `${sshPrefix} 'test -d "${dirPath}" && echo "exists" || echo "not_exists"'`;
  try {
    const { stdout } = await execAsync(cmd, { timeout: 15e3 });
    return stdout.trim() === "exists";
  } catch (e) {
    process.stderr.write(`[cPanel-SSH] Check remote directory exists failed: ${e.message}
`);
    return false;
  }
}

// src/lib/wp-cli.ts
import { exec as exec2 } from "child_process";
import { promisify as promisify2 } from "util";
import * as fs2 from "fs";
var execAsync2 = promisify2(exec2);
var WpCliError = class extends Error {
  constructor(message, stdout, stderr, code) {
    super(message);
    this.name = "WpCliError";
    this.stdout = stdout;
    this.stderr = stderr;
    this.code = code;
  }
};
function getSshConfig() {
  const host = process.env.WP_SSH_HOST;
  const port = process.env.WP_SSH_PORT || "22";
  const user = process.env.WP_SSH_USER;
  const keyPath = process.env.WP_SSH_KEY_PATH || "";
  const wpCliPath = process.env.WP_CLI_PATH || "wp";
  return { host, port, user, keyPath, wpCliPath };
}
async function executeRemoteCommand(remoteCommand, logCallback) {
  const { host, port, user, keyPath, wpCliPath: _wpCliPath } = getSshConfig();
  let cmd;
  if (host && user) {
    const escapedCmd = remoteCommand.replace(/'/g, `'\\''`);
    const keyFlag = keyPath ? `-i "${keyPath}"` : "";
    cmd = [
      "ssh",
      "-p",
      port,
      keyFlag,
      "-o StrictHostKeyChecking=no",
      "-o ConnectTimeout=30",
      "-o ServerAliveInterval=60",
      "-o BatchMode=yes",
      `${user}@${host}`,
      `'${escapedCmd}'`
    ].filter(Boolean).join(" ");
    if (logCallback) {
      logCallback(`[SSH\u2192${host}] ${remoteCommand.replace(/--dbpass=[^\s'"]+/g, "--dbpass=***").replace(/--admin_password=[^\s'"]+/g, "--admin_password=***")}`);
    }
    process.stderr.write(`[SSH] RUNNING: ${cmd.replace(/--dbpass=[^\s'"]+/g, "--dbpass=***").replace(/--admin_password=[^\s'"]+/g, "--admin_password=***")}
`);
  } else {
    cmd = remoteCommand;
    if (logCallback) logCallback(`[LOCAL] ${cmd}`);
    process.stderr.write(`[LOCAL] RUNNING: ${cmd}
`);
  }
  try {
    const { stdout, stderr } = await execAsync2(cmd, {
      timeout: 18e4,
      // 3 min max per command
      maxBuffer: 10 * 1024 * 1024,
      // 10MB
      env: { ...process.env }
    });
    if (stdout.trim()) {
      process.stderr.write(`[SSH] STDOUT: ${stdout.trim().substring(0, 1e3)}
`);
      if (logCallback) logCallback(`[WP-CLI] STDOUT: ${stdout.trim()}`);
    }
    if (stderr.trim()) {
      process.stderr.write(`[SSH] STDERR: ${stderr.trim()}
`);
      if (logCallback) logCallback(`[WP-CLI] STDERR: ${stderr.trim()}`);
    }
    return { stdout, stderr };
  } catch (error) {
    const stdout = error.stdout || "";
    const stderr = error.stderr || "";
    process.stderr.write(`[SSH] FAILED: ${error.message}
`);
    if (stderr) process.stderr.write(`[SSH] STDERR_OUT: ${stderr}
`);
    if (logCallback) {
      logCallback(`[WP-CLI] FAILED: ${error.message}`);
      if (stdout) logCallback(`[WP-CLI] STDOUT: ${stdout}`);
      if (stderr) logCallback(`[WP-CLI] STDERR: ${stderr}`);
    }
    throw new WpCliError(
      `WP-CLI remote command failed: ${remoteCommand.substring(0, 120)}`,
      stdout,
      stderr,
      error.code
    );
  }
}
async function checkWpCliAvailable() {
  const { wpCliPath } = getSshConfig();
  try {
    const { stdout } = await executeRemoteCommand(`${wpCliPath} --version --allow-root`);
    return {
      available: true,
      version: stdout.trim(),
      path: wpCliPath
    };
  } catch (e) {
    return {
      available: false,
      error: `WP-CLI not reachable on remote server: ${e.message}`
    };
  }
}
async function runWpCommand(command, documentRoot, logCallback) {
  const { wpCliPath } = getSshConfig();
  const fullCommand = `${wpCliPath} ${command} --path="${documentRoot}" --allow-root`;
  return executeRemoteCommand(fullCommand, logCallback);
}
async function downloadWordPressCore(documentRoot, logCallback) {
  await executeRemoteCommand(`mkdir -p "${documentRoot}"`, logCallback);
  return runWpCommand("core download", documentRoot, logCallback);
}
async function createWpConfig(documentRoot, dbName, dbUser, dbPass, dbHost = "localhost", logCallback) {
  return runWpCommand(
    `config create --dbname="${dbName}" --dbuser="${dbUser}" --dbpass="${dbPass}" --dbhost="${dbHost}" --extra-php="define('WP_DEBUG', false); define('WP_DEBUG_LOG', false);" --force`,
    documentRoot,
    logCallback
  );
}
async function installWordPress(documentRoot, url, title, adminUser, adminPassword, adminEmail, logCallback) {
  const safeTitle = title.replace(/'/g, `'\\''`);
  return runWpCommand(
    `core install --url="${url}" --title='${safeTitle}' --admin_user="${adminUser}" --admin_password="${adminPassword}" --admin_email="${adminEmail}" --skip-email`,
    documentRoot,
    logCallback
  );
}
async function configurePermalinks(documentRoot, structure = "/%postname%/", logCallback) {
  return runWpCommand(`rewrite structure "${structure}"`, documentRoot, logCallback);
}
async function runRemoteShellCommand(command, logCallback) {
  return executeRemoteCommand(command, logCallback);
}
async function copyFileToRemote(localPath, remotePath, logCallback) {
  const { host, port, user, keyPath } = getSshConfig();
  if (!host || !user) {
    if (logCallback) logCallback(`[LOCAL COPY] ${localPath} -> ${remotePath}`);
    fs2.copyFileSync(localPath, remotePath);
    return;
  }
  const keyFlag = keyPath ? `-i "${keyPath}"` : "";
  const escapedRemotePath = remotePath.replace(/'/g, `'\\''`);
  const sshCmd = [
    "ssh",
    "-p",
    port,
    keyFlag,
    "-o StrictHostKeyChecking=no",
    "-o ConnectTimeout=30",
    "-o ServerAliveInterval=60",
    "-o BatchMode=yes",
    `${user}@${host}`,
    `'cat > "${escapedRemotePath}"'`
  ].filter(Boolean).join(" ");
  if (logCallback) {
    logCallback(`[SSH COPY] ${localPath} -> ${user}@${host}:${remotePath}`);
  }
  return new Promise((resolve, reject) => {
    const child = exec2(sshCmd, { maxBuffer: 10 * 1024 * 1024 }, (error, stdout, stderr) => {
      if (error) {
        if (logCallback) {
          logCallback(`[SSH COPY FAILED] error: ${error.message}`);
          if (stderr) logCallback(`[SSH COPY FAILED stderr] ${stderr}`);
        }
        reject(new Error(`SSH copy failed: ${error.message} (stderr: ${stderr})`));
      } else {
        resolve();
      }
    });
    const readStream = fs2.createReadStream(localPath);
    readStream.on("error", (err) => {
      child.kill();
      reject(err);
    });
    readStream.pipe(child.stdin);
  });
}

// src/lib/elementor-merger.ts
import fs3 from "fs";
import path2 from "path";
function mergeElementorTemplate(templateDir, aiContent, mediaMap, businessInfo, menuId, footerMenuId, custServiceMenuId) {
  const isKit2 = fs3.existsSync(path2.join(templateDir, "templates", "49.json"));
  const homePath = path2.join(templateDir, "content", "page", "2.json");
  const headerPath = path2.join(templateDir, "templates", isKit2 ? "49.json" : "15.json");
  const footerPath = path2.join(templateDir, "templates", isKit2 ? "156.json" : "244.json");
  if (!fs3.existsSync(homePath)) {
    throw new Error(`Home page template not found at ${homePath}`);
  }
  if (!fs3.existsSync(headerPath)) {
    throw new Error(`Header template not found at ${headerPath}`);
  }
  if (!fs3.existsSync(footerPath)) {
    throw new Error(`Footer template not found at ${footerPath}`);
  }
  const homeData = JSON.parse(fs3.readFileSync(homePath, "utf8"));
  const headerData = JSON.parse(fs3.readFileSync(headerPath, "utf8"));
  const footerData = JSON.parse(fs3.readFileSync(footerPath, "utf8"));
  const homeSections = homeData.content || [];
  const headerSections = headerData.content || [];
  const footerSections = footerData.content || [];
  const getLocalMedia = (url) => {
    if (!url) return null;
    const normalizedUrl = url.replace(/\\/g, "");
    if (mediaMap[normalizedUrl]) return mediaMap[normalizedUrl];
    const cleanUrl = normalizedUrl.split("?")[0].replace(/^https?:/, "");
    for (const key of Object.keys(mediaMap)) {
      const cleanKey = key.split("?")[0].replace(/^https?:/, "");
      if (cleanKey === cleanUrl) {
        return mediaMap[key];
      }
    }
    return null;
  };
  const collectElements = (elements) => {
    const columns = [];
    const containers = [];
    const widgets = {};
    const traverse = (els) => {
      if (!els || !Array.isArray(els)) return;
      for (const el of els) {
        if (el.elType === "column") {
          columns.push(el);
        } else if (el.elType === "container") {
          containers.push(el);
        } else if (el.elType === "widget") {
          const type = el.widgetType;
          if (type) {
            if (!widgets[type]) {
              widgets[type] = [];
            }
            widgets[type].push(el);
          }
        }
        if (el.elements && Array.isArray(el.elements)) {
          traverse(el.elements);
        }
      }
    };
    traverse(elements);
    return { columns, containers, widgets };
  };
  const processSection = (section, title) => {
    if (!section.elements || !Array.isArray(section.elements)) return;
    const { columns, containers, widgets } = collectElements(section.elements);
    if (isKit2) {
      if (title === "Hero") {
        if (containers[0] && containers[0].settings) {
          const targetUrl = aiContent.hero?.hero_image || "";
          const local = getLocalMedia(targetUrl);
          if (local) {
            containers[0].settings.background_image = {
              url: local.url,
              id: String(local.id),
              source: "library"
            };
          } else if (targetUrl) {
            containers[0].settings.background_image = {
              url: targetUrl,
              id: "",
              source: "library"
            };
          }
          containers[0].settings.background_size = "cover";
          containers[0].settings.background_repeat = "no-repeat";
          containers[0].settings.background_position = "center center";
          containers[0].settings.background_color = "#E8E6DF";
        }
        if (containers[1] && containers[1].settings) {
          const targetUrl = aiContent.hero?.masked_image || "";
          const local = getLocalMedia(targetUrl);
          if (local) {
            containers[1].settings.background_image = {
              url: local.url,
              id: String(local.id),
              source: "library"
            };
          } else if (targetUrl) {
            containers[1].settings.background_image = {
              url: targetUrl,
              id: "",
              source: "library"
            };
          }
          containers[1].settings.background_size = "cover";
          containers[1].settings.background_repeat = "no-repeat";
          containers[1].settings.background_position = "center center";
          containers[1].settings.background_color = "#E8E6DF";
        }
        if (widgets["call-to-action"]?.[0] && widgets["call-to-action"][0].settings) {
          const cta = widgets["call-to-action"][0];
          cta.settings.title = aiContent.hero?.heading || "";
          cta.settings.description = aiContent.hero?.description || aiContent.about?.description || "";
          cta.settings.button = `${aiContent.hero?.button_text || "Shop Now"} \u2794`;
          cta.settings.align = "center";
          cta.settings.alignment = "center";
          cta.settings.link = {
            url: "#products",
            is_external: "",
            nofollow: "",
            custom_attributes: ""
          };
        }
      } else if (title === "Home Goods") {
        const mainContainer = section;
        if (mainContainer && mainContainer.settings) {
          const targetUrl = aiContent.about?.image || "";
          const local = getLocalMedia(targetUrl);
          if (local) {
            mainContainer.settings.background_image = {
              url: local.url,
              id: String(local.id),
              source: "library"
            };
          } else if (targetUrl) {
            mainContainer.settings.background_image = {
              url: targetUrl,
              id: "",
              source: "library"
            };
          }
          mainContainer.settings.background_size = "cover";
          mainContainer.settings.background_repeat = "no-repeat";
          mainContainer.settings.background_position = "center center";
          mainContainer.settings.background_color = "#ffffff";
          delete mainContainer.settings.background_overlay_background;
          delete mainContainer.settings.background_overlay_color;
          delete mainContainer.settings.background_overlay_opacity;
          if (mainContainer.settings.__globals__) {
            delete mainContainer.settings.__globals__.background_overlay_color;
            delete mainContainer.settings.__globals__.background_overlay_image;
          }
        }
        if (widgets.heading?.[0] && widgets.heading[0].settings) {
          widgets.heading[0].settings.title = aiContent.about?.heading || "";
          widgets.heading[0].settings.title_color = "#141111";
          if (widgets.heading[0].settings.__globals__) {
            delete widgets.heading[0].settings.__globals__.title_color;
          }
        }
        if (widgets["text-editor"]?.[0] && widgets["text-editor"][0].settings) {
          widgets["text-editor"][0].settings.editor = `<div style="color: #141111; line-height: 1.6; font-size: 1.1rem;">${aiContent.about?.description || ""}</div>`;
          widgets["text-editor"][0].settings.text_color = "#141111";
          if (widgets["text-editor"][0].settings.__globals__) {
            delete widgets["text-editor"][0].settings.__globals__.text_color;
          }
        }
        if (widgets.button?.[0] && widgets.button[0].settings) {
          widgets.button[0].settings.text = `${aiContent.about?.button_text || "Learn More"}`;
          widgets.button[0].settings.link = {
            url: "#products",
            is_external: "",
            nofollow: "",
            custom_attributes: ""
          };
        }
      } else if (title === "Tablewear") {
        const mainContainer = section;
        if (mainContainer && mainContainer.settings) {
          const targetUrl = aiContent.services?.image || "";
          const local = getLocalMedia(targetUrl);
          if (local) {
            mainContainer.settings.background_image = {
              url: local.url,
              id: String(local.id),
              source: "library"
            };
          } else if (targetUrl) {
            mainContainer.settings.background_image = {
              url: targetUrl,
              id: "",
              source: "library"
            };
          }
          mainContainer.settings.background_size = "cover";
          mainContainer.settings.background_repeat = "no-repeat";
          mainContainer.settings.background_position = "center center";
          mainContainer.settings.background_color = "#E8E6DF";
        }
        if (widgets.heading?.[0] && widgets.heading[0].settings) {
          widgets.heading[0].settings.title = aiContent.services?.heading || "";
        }
        if (widgets["text-editor"]?.[0] && widgets["text-editor"][0].settings) {
          widgets["text-editor"][0].settings.editor = `<p>${aiContent.services?.description || ""}</p>`;
        }
        if (widgets.button?.[0] && widgets.button[0].settings) {
          widgets.button[0].settings.text = `Our Services`;
          widgets.button[0].settings.link = {
            url: "#products",
            is_external: "",
            nofollow: "",
            custom_attributes: ""
          };
        }
      } else if (title === "Products") {
        if (widgets.heading?.[0] && widgets.heading[0].settings) {
          widgets.heading[0].settings.title = aiContent.projects?.heading || "Recent Projects";
        }
        if (widgets["woocommerce-products"]?.[0]) {
          const pWidget = widgets["woocommerce-products"][0];
          pWidget.widgetType = "posts";
          pWidget.settings = {
            classic_columns: "3",
            classic_thumbnail_size_size: "large",
            classic_item_ratio: { unit: "px", size: "0.8", sizes: [] },
            classic_meta_data: [],
            classic_show_excerpt: "",
            classic_posts_per_page: "3",
            classic_column_gap: { unit: "px", size: "30", sizes: [] },
            classic_row_gap: { unit: "px", size: "30", sizes: [] },
            __globals__: {
              classic_title_typography_typography: "globals/typography?id=secondary"
            }
          };
        }
        if (widgets.button?.[0] && widgets.button[0].settings) {
          widgets.button[0].settings.text = `Contact Us`;
          widgets.button[0].settings.link = {
            url: "#contact",
            is_external: "",
            nofollow: "",
            custom_attributes: ""
          };
        }
      } else if (title === "CTA") {
        const mainContainer = section;
        if (mainContainer && mainContainer.settings) {
          const targetUrl = aiContent.services?.image || "";
          const local = getLocalMedia(targetUrl);
          if (local) {
            mainContainer.settings.background_image = {
              url: local.url,
              id: String(local.id),
              source: "library"
            };
          } else if (targetUrl) {
            mainContainer.settings.background_image = {
              url: targetUrl,
              id: "",
              source: "library"
            };
          }
          mainContainer.settings.background_size = "cover";
          mainContainer.settings.background_repeat = "no-repeat";
          mainContainer.settings.background_position = "center center";
          mainContainer.settings.background_color = "#E8E6DF";
          mainContainer.settings.flex_align_items = "stretch";
          if (!mainContainer.settings.padding) {
            mainContainer.settings.padding = { unit: "%", top: "0", right: "0", bottom: "0", left: "50" };
          } else {
            mainContainer.settings.padding.top = "0";
            mainContainer.settings.padding.bottom = "0";
          }
        }
        if (widgets.heading?.[0] && widgets.heading[0].settings) {
          widgets.heading[0].settings.title = aiContent.process?.heading || "Our Work Process";
        }
        if (widgets["text-editor"]?.[0] && widgets["text-editor"][0].settings) {
          let processText = "";
          if (Array.isArray(aiContent.process?.steps)) {
            processText = aiContent.process.steps.map(
              (step, idx) => `<strong>${idx + 1}. ${step.title}</strong>: ${step.description}`
            ).join("<br/><br/>");
          }
          widgets["text-editor"][0].settings.editor = `<p>${processText}</p>`;
        }
        if (widgets.button?.[0] && widgets.button[0].settings) {
          widgets.button[0].settings.text = `Get a Quote`;
          widgets.button[0].settings.link = {
            url: "#contact",
            is_external: "",
            nofollow: "",
            custom_attributes: ""
          };
        }
        if (containers[0] && containers[0].settings) {
          containers[0].settings.height = { unit: "%", size: 100 };
          containers[0].settings.min_height = { unit: "px", size: 0 };
          containers[0].settings.align_self = "stretch";
          containers[0].settings.margin = {
            unit: "px",
            top: "0",
            right: "0",
            bottom: "0",
            left: "0",
            isLinked: "1"
          };
        }
      } else if (title === "Banner") {
        if (widgets["icon-list"]?.[0] && widgets["icon-list"][0].settings?.icon_list?.[0]) {
          widgets["icon-list"][0].settings.icon_list[0].text = `Call Us: ${businessInfo.phone}`;
        }
      } else if (title === "Header") {
        if (widgets["nav-menu"]?.[0] && widgets["nav-menu"][0].settings && menuId) {
          widgets["nav-menu"][0].settings.menu = String(menuId);
        }
        if (widgets["theme-site-logo"]?.[0] && widgets["theme-site-logo"][0].settings) {
          const targetUrl = aiContent.logo_image || "";
          const local = getLocalMedia(targetUrl);
          if (local) {
            widgets["theme-site-logo"][0].settings.image = {
              url: local.url,
              id: String(local.id)
            };
          } else if (targetUrl) {
            widgets["theme-site-logo"][0].settings.image = {
              url: targetUrl,
              id: ""
            };
          }
          widgets["theme-site-logo"][0].settings.height = { unit: "px", size: 85, sizes: [] };
          widgets["theme-site-logo"][0].settings.height_tablet = { unit: "px", size: 75, sizes: [] };
          widgets["theme-site-logo"][0].settings.height_mobile = { unit: "px", size: 65, sizes: [] };
          widgets["theme-site-logo"][0].settings.width = { unit: "%", size: 100, sizes: [] };
        }
      } else if (title === "Footer") {
        if (widgets["text-editor"]?.[0] && widgets["text-editor"][0].settings) {
          widgets["text-editor"][0].settings.editor = `<p>${businessInfo.name} - Professional craftsmanship and dedicated service.</p>`;
        }
        const contactList = widgets["icon-list"]?.[0];
        if (contactList && Array.isArray(contactList.settings.icon_list)) {
          const originalItems = contactList.settings.icon_list;
          const newItems = [];
          if (businessInfo.address && originalItems[0]) {
            const item = JSON.parse(JSON.stringify(originalItems[0]));
            item.text = businessInfo.address;
            newItems.push(item);
          }
          if (businessInfo.hours && originalItems[0]) {
            const item = JSON.parse(JSON.stringify(originalItems[0]));
            item.text = Array.isArray(businessInfo.hours) ? businessInfo.hours.join(", ") : String(businessInfo.hours);
            newItems.push(item);
          }
          const phoneProto = originalItems.find(
            (itm) => String(itm.text).toLowerCase().includes("phone") || String(itm.icon?.value).includes("phone")
          ) || originalItems[1] || originalItems[0];
          if (businessInfo.phone && phoneProto) {
            const item = JSON.parse(JSON.stringify(phoneProto));
            item.text = `Phone: ${businessInfo.phone}`;
            item.link = { url: `tel:${businessInfo.phone.replace(/[^0-9+]/g, "")}` };
            newItems.push(item);
          }
          const emailProto = originalItems.find(
            (itm) => String(itm.text).toLowerCase().includes("@") || String(itm.text).toLowerCase().includes("email") || String(itm.icon?.value).includes("envelope")
          ) || originalItems[2] || originalItems[0];
          if (businessInfo.email && emailProto) {
            const item = JSON.parse(JSON.stringify(emailProto));
            item.text = businessInfo.email;
            item.link = { url: `mailto:${businessInfo.email}` };
            newItems.push(item);
          }
          contactList.settings.icon_list = newItems;
        }
        if (widgets.image?.[0] && widgets.image[0].settings) {
          const targetUrl = aiContent.logo_image || "";
          const local = getLocalMedia(targetUrl);
          if (local) {
            widgets.image[0].settings.image = {
              url: local.url,
              id: String(local.id)
            };
          } else if (targetUrl) {
            widgets.image[0].settings.image = {
              url: targetUrl,
              id: ""
            };
          }
        }
        if (widgets["nav-menu"]) {
          if (widgets["nav-menu"][0] && widgets["nav-menu"][0].settings && custServiceMenuId) {
            widgets["nav-menu"][0].settings.menu = String(custServiceMenuId);
          }
          if (widgets["nav-menu"][1] && widgets["nav-menu"][1].settings && footerMenuId) {
            widgets["nav-menu"][1].settings.menu = String(footerMenuId);
          }
        }
        if (widgets.heading && Array.isArray(widgets.heading)) {
          for (const h of widgets.heading) {
            if (h.settings && h.settings.link) {
              h.settings.link.url = "#";
            }
          }
        }
      } else if (title === "Copyright") {
        if (widgets.heading?.[0] && widgets.heading[0].settings) {
          delete widgets.heading[0].settings.__dynamic__;
          widgets.heading[0].settings.title = `\xA9 ${(/* @__PURE__ */ new Date()).getFullYear()} ${businessInfo.name}. All Rights Reserved.`;
        }
      }
    } else {
      if (title === "Hero section") {
        if (widgets.heading?.[0] && widgets.heading[0].settings) {
          widgets.heading[0].settings.title = aiContent.hero?.heading || "";
        }
        if (widgets.button?.[0] && widgets.button[0].settings) {
          widgets.button[0].settings.text = `${aiContent.hero?.button_text || "Get Started"}`;
          widgets.button[0].settings.link = {
            url: "#services",
            is_external: "",
            nofollow: "",
            custom_attributes: ""
          };
        }
        let bgCol = columns.find((c) => c.settings?.background_image?.url);
        if (!bgCol && columns.length > 1) {
          bgCol = columns[1];
        }
        if (bgCol && bgCol.settings) {
          const targetUrl = aiContent.hero?.hero_image || "";
          const local = getLocalMedia(targetUrl);
          if (!bgCol.settings.background_image) {
            bgCol.settings.background_image = { url: "", id: "" };
          }
          if (local) {
            bgCol.settings.background_image.url = local.url;
            bgCol.settings.background_image.id = String(local.id);
          } else if (targetUrl) {
            bgCol.settings.background_image.url = targetUrl;
            bgCol.settings.background_image.id = "";
          }
          bgCol.settings.background_size = "cover";
          bgCol.settings.background_repeat = "no-repeat";
          bgCol.settings.background_position = "center center";
          bgCol.settings.background_color = "#E8E6DF";
        }
        if (widgets.image?.[0] && widgets.image[0].settings) {
          const targetUrl = aiContent.hero?.masked_image || "";
          const local = getLocalMedia(targetUrl);
          if (!widgets.image[0].settings.image) {
            widgets.image[0].settings.image = { url: "", id: "" };
          }
          if (local) {
            widgets.image[0].settings.image.url = local.url;
            widgets.image[0].settings.image.id = String(local.id);
          } else if (targetUrl) {
            widgets.image[0].settings.image.url = targetUrl;
            widgets.image[0].settings.image.id = "";
          }
          widgets.image[0].settings["object-fit"] = "cover";
          widgets.image[0].settings.image_size = "full";
          widgets.image[0].settings.image_border_radius = {
            unit: "%",
            top: "50",
            right: "50",
            bottom: "50",
            left: "50",
            isLinked: "1"
          };
        }
      } else if (title === "Highest level") {
        if (widgets.image?.[0] && widgets.image[0].settings) {
          const targetUrl = aiContent.about?.image || "";
          const local = getLocalMedia(targetUrl);
          if (!widgets.image[0].settings.image) {
            widgets.image[0].settings.image = { url: "", id: "" };
          }
          if (local) {
            widgets.image[0].settings.image.url = local.url;
            widgets.image[0].settings.image.id = String(local.id);
          } else if (targetUrl) {
            widgets.image[0].settings.image.url = targetUrl;
            widgets.image[0].settings.image.id = "";
          }
        }
        if (widgets.heading?.[0] && widgets.heading[0].settings) {
          widgets.heading[0].settings.title = aiContent.about?.heading || "";
        }
        if (widgets["text-editor"]?.[0] && widgets["text-editor"][0].settings) {
          widgets["text-editor"][0].settings.editor = `<p>${aiContent.about?.description || ""}</p>`;
        }
        if (widgets.button?.[0] && widgets.button[0].settings) {
          widgets.button[0].settings.text = `${aiContent.about?.button_text || "Learn More"}`;
          widgets.button[0].settings.link = {
            url: "#services",
            is_external: "",
            nofollow: "",
            custom_attributes: ""
          };
        }
      } else if (title === "What we do") {
        if (widgets.heading?.[0] && widgets.heading[0].settings) {
          widgets.heading[0].settings.title = aiContent.services?.heading || "";
        }
        if (widgets["text-editor"]?.[0] && widgets["text-editor"][0].settings) {
          widgets["text-editor"][0].settings.editor = aiContent.services?.description || "";
        }
        const iconLists = widgets["icon-list"] || [];
        const servicesList = aiContent.services?.list || [];
        if (iconLists[0] && iconLists[0].settings && Array.isArray(iconLists[0].settings.icon_list)) {
          for (let i = 0; i < 4; i++) {
            if (iconLists[0].settings.icon_list[i] && servicesList[i]) {
              iconLists[0].settings.icon_list[i].text = servicesList[i];
            }
          }
        }
        if (iconLists[1] && iconLists[1].settings && Array.isArray(iconLists[1].settings.icon_list)) {
          for (let i = 0; i < 4; i++) {
            if (iconLists[1].settings.icon_list[i] && servicesList[i + 4]) {
              iconLists[1].settings.icon_list[i].text = servicesList[i + 4];
            }
          }
        }
        let bgCol = columns.find((c) => c.settings?.background_image?.url);
        if (!bgCol && columns.length > 1) {
          bgCol = columns[1];
        }
        if (bgCol && bgCol.settings) {
          const targetUrl = aiContent.services?.image || "";
          const local = getLocalMedia(targetUrl);
          if (!bgCol.settings.background_image) {
            bgCol.settings.background_image = { url: "", id: "" };
          }
          if (local) {
            bgCol.settings.background_image.url = local.url;
            bgCol.settings.background_image.id = String(local.id);
          } else if (targetUrl) {
            bgCol.settings.background_image.url = targetUrl;
            bgCol.settings.background_image.id = "";
          }
          bgCol.settings.background_size = "cover";
          bgCol.settings.background_repeat = "no-repeat";
          bgCol.settings.background_position = "center center";
          bgCol.settings.background_color = "#E8E6DF";
        }
      } else if (title === "Exceptional quality") {
        if (widgets.heading?.[0] && widgets.heading[0].settings) {
          widgets.heading[0].settings.title = aiContent.features?.heading || "";
        }
        const iconBoxes = widgets["icon-box"] || [];
        const featuresItems = aiContent.features?.items || [];
        for (let i = 0; i < 3; i++) {
          if (iconBoxes[i] && iconBoxes[i].settings && featuresItems[i]) {
            iconBoxes[i].settings.title_text = featuresItems[i].title;
            iconBoxes[i].settings.description_text = featuresItems[i].description;
          }
        }
      } else if (title === "Recent projects") {
        if (widgets.heading?.[0] && widgets.heading[0].settings) {
          widgets.heading[0].settings.title = aiContent.projects?.heading || "";
        }
        if (widgets["text-editor"]?.[0] && widgets["text-editor"][0].settings) {
          widgets["text-editor"][0].settings.editor = aiContent.projects?.description || "";
        }
      } else if (title === "Work Process") {
        if (widgets.heading?.[0] && widgets.heading[0].settings) {
          widgets.heading[0].settings.title = aiContent.process?.heading || "";
        }
        const iconBoxes = widgets["icon-box"] || [];
        const steps = aiContent.process?.steps || [];
        for (let i = 0; i < 4; i++) {
          if (iconBoxes[i] && iconBoxes[i].settings && steps[i]) {
            iconBoxes[i].settings.title_text = steps[i].title;
            iconBoxes[i].settings.description_text = steps[i].description;
          }
        }
      } else if (title === "Client testimonials") {
        const slideshowCol = columns.find((c) => c.settings?.background_background === "slideshow");
        if (slideshowCol && slideshowCol.settings) {
          if (!Array.isArray(slideshowCol.settings.background_slideshow_gallery)) {
            slideshowCol.settings.background_slideshow_gallery = [];
          }
          const localSlideshow = [];
          const slideshowUrls = aiContent.testimonials?.slideshow || [];
          for (let i = 0; i < Math.min(3, slideshowUrls.length); i++) {
            const targetUrl = slideshowUrls[i];
            const local = getLocalMedia(targetUrl);
            if (local) {
              localSlideshow.push({
                id: String(local.id),
                url: local.url
              });
            } else if (targetUrl) {
              localSlideshow.push({
                id: "",
                url: targetUrl
              });
            }
          }
          if (localSlideshow.length > 0) {
            slideshowCol.settings.background_slideshow_gallery = localSlideshow;
          }
        }
        if (widgets.heading?.[0] && widgets.heading[0].settings) {
          widgets.heading[0].settings.title = aiContent.testimonials?.heading || "";
        }
        if (widgets["testimonial-carousel"]?.[0] && widgets["testimonial-carousel"][0].settings && Array.isArray(widgets["testimonial-carousel"][0].settings.slides)) {
          const slides = widgets["testimonial-carousel"][0].settings.slides;
          const testimonialsItems = aiContent.testimonials?.items || [];
          for (let i = 0; i < Math.min(3, slides.length); i++) {
            if (testimonialsItems[i]) {
              slides[i].content = `\u201C${testimonialsItems[i].content}\u201D`;
              slides[i].name = testimonialsItems[i].name;
              slides[i].title = "";
            }
          }
        }
      } else if (title === "Header") {
        if (widgets.button?.[0] && widgets.button[0].settings) {
          const btn = widgets.button[0];
          delete btn.settings.__dynamic__;
          btn.settings.text = `Call Us ${businessInfo.phone}`;
          btn.settings.link = {
            url: `tel:${businessInfo.phone.replace(/[^0-9+]/g, "")}`,
            is_external: "",
            nofollow: "",
            custom_attributes: ""
          };
        }
        if (widgets["nav-menu"]?.[0] && widgets["nav-menu"][0].settings && menuId) {
          widgets["nav-menu"][0].settings.menu = String(menuId);
        }
      } else if (title === "Let's discuss") {
        if (widgets.heading?.[0] && widgets.heading[0].settings) {
          widgets.heading[0].settings.title = `Let\u2019s discuss your project!`;
        }
        if (widgets["text-editor"]?.[0] && widgets["text-editor"][0].settings) {
          widgets["text-editor"][0].settings.editor = `<p>Don\u2019t hesitate to contact us. We\u2019ll be happy to discuss your needs, provide estimates, and answer all your questions.</p>`;
        }
        if (widgets.button?.[0] && widgets.button[0].settings) {
          widgets.button[0].settings.text = `Contact Us`;
          widgets.button[0].settings.link = {
            url: "#contact",
            is_external: "",
            nofollow: "",
            custom_attributes: ""
          };
        }
      } else if (title === "Footer") {
        if (widgets.heading?.[0] && widgets.heading[0].settings) {
          const cHeading = widgets.heading[0];
          delete cHeading.settings.__dynamic__;
          cHeading.settings.title = `\xA9 ${(/* @__PURE__ */ new Date()).getFullYear()} ${businessInfo.name}. All Rights Reserved.`;
        }
        const contactList = (widgets["icon-list"] || []).find(
          (widget) => widget.settings?.icon_list?.some((item) => String(item.text).includes("@"))
        );
        if (contactList && Array.isArray(contactList.settings.icon_list)) {
          for (const item of contactList.settings.icon_list) {
            const text = String(item.text || "");
            if (text.includes("St Germain") || item.text === "315 St Germain Ave, Canada") {
              item.text = businessInfo.address;
            } else if (text.includes("620-637") || text.match(/[0-9]{3}-[0-9]{3}/)) {
              item.text = businessInfo.phone;
              item.link = { url: `tel:${businessInfo.phone.replace(/[^0-9+]/g, "")}` };
            } else if (text.includes("@")) {
              item.text = businessInfo.email;
              item.link = { url: `mailto:${businessInfo.email}` };
            }
          }
        }
      }
    }
  };
  homeSections.forEach((section) => {
    const title = section.settings?._title || "";
    processSection(section, title);
  });
  headerSections.forEach((section) => {
    const title = section.settings?._title || "Header";
    processSection(section, title);
  });
  footerSections.forEach((section) => {
    const title = section.settings?._title || "Footer";
    processSection(section, title);
  });
  if (footerSections.length > 0) {
    const lastSection = footerSections[footerSections.length - 1];
    const findLeafContainer = (el) => {
      if (!el) return null;
      if (el.elType === "column") return el;
      if (el.elType === "container") {
        const hasNested = el.elements && el.elements.some((child) => child.elType === "container" || child.elType === "column");
        if (!hasNested) {
          return el;
        }
        for (let i = el.elements.length - 1; i >= 0; i--) {
          const found = findLeafContainer(el.elements[i]);
          if (found) return found;
        }
      }
      return null;
    };
    let targetContainer = findLeafContainer(lastSection) || lastSection;
    if (targetContainer && targetContainer.elements) {
      targetContainer.elements.push({
        id: "ds_custom_footer_css",
        settings: {
          html: `<style>
/* Force all text inside footer to be white */
[data-elementor-type="footer"] *, 
.elementor-element-29c6e791 *, 
.elementor-element-28f7602f *, 
footer *, 
.site-footer *, 
.elementor-location-footer * { 
    color: #ffffff !important; 
} 
/* Force all icons inside footer to be white */
[data-elementor-type="footer"] svg, 
[data-elementor-type="footer"] path, 
.elementor-element-29c6e791 svg, 
.elementor-element-29c6e791 path, 
.elementor-element-28f7602f svg,
.elementor-element-28f7602f path,
footer svg, 
footer path, 
.site-footer svg, 
.site-footer path,
.elementor-location-footer svg,
.elementor-location-footer path { 
    fill: #ffffff !important; 
} 
/* Hover states for links inside footer */
[data-elementor-type="footer"] a:hover, 
[data-elementor-type="footer"] a:hover *, 
.elementor-element-29c6e791 a:hover, 
.elementor-element-29c6e791 a:hover *, 
.elementor-element-28f7602f a:hover,
.elementor-element-28f7602f a:hover *,
footer a:hover, 
footer a:hover *, 
.site-footer a:hover, 
.site-footer a:hover *,
.elementor-location-footer a:hover,
.elementor-location-footer a:hover * { 
    color: #ffffff !important; 
    opacity: 0.8 !important; 
} 
/* Placeholder styling for subscription form */
[data-elementor-type="footer"] ::placeholder, 
.elementor-element-29c6e791 ::placeholder, 
.elementor-element-28f7602f ::placeholder,
footer ::placeholder, 
.site-footer ::placeholder,
.elementor-location-footer ::placeholder { 
    color: rgba(255, 255, 255, 0.6) !important; 
}

/* Call to Action Content Centering */
.elementor-widget-call-to-action .elementor-cta__content,
.elementor-widget-call-to-action .elementor-cta__title,
.elementor-widget-call-to-action .elementor-cta__description,
.elementor-widget-call-to-action .elementor-cta__button-wrapper {
    text-align: center !important;
}
.elementor-widget-call-to-action .elementor-cta__button-wrapper {
    display: flex !important;
    justify-content: center !important;
}

/* Logo Widget Container Transparency */
.elementor-element-3b58bec7,
.elementor-element-69be47e,
.elementor-element-5a62107a,
.elementor-element-44b1aa0b,
.elementor-element-3b58bec7 .elementor-widget-container,
.elementor-element-69be47e .elementor-widget-container,
.elementor-element-5a62107a .elementor-widget-container,
.elementor-element-44b1aa0b .elementor-widget-container {
    background-color: transparent !important;
    background: transparent !important;
}

/* Header Logo (Key out white background on light header) */
.elementor-element-3b58bec7 img,
.elementor-element-69be47e img,
.elementor-widget-theme-site-logo img,
.elementor-widget-image img[src*="gen_logo"],
header img[src*="gen_logo"],
.site-header img[src*="gen_logo"] {
    mix-blend-mode: multiply !important;
    background-color: transparent !important;
}

/* Footer Logo (Invert to white on transparent for dark footer) */
.elementor-element-5a62107a img,
.elementor-element-44b1aa0b img,
[data-elementor-type="footer"] img[src*="gen_logo"],
footer img[src*="gen_logo"],
.site-footer img[src*="gen_logo"] {
    filter: invert(1) !important;
    mix-blend-mode: screen !important;
    background-color: transparent !important;
}

/* Responsive Aspect Ratio Scaling to prevent background cropping */
html, body {
    overflow-x: hidden !important;
    max-width: 100vw !important;
}
.elementor-section, .e-container, .elementor-column {
    max-width: 100% !important;
}

/* ==========================================
   KIT 1 (Carpenter) Responsive Layout Fixes
   ========================================== */

/* Hero Section Height Overrides */
@media (min-width: 768px) {
    .elementor-element-40a06f6 {
        height: auto !important;
        min-height: auto !important;
    }
    .elementor-element-580cc436 {
        min-height: calc(100vh - 120px) !important;
        display: flex !important;
        flex-direction: column !important;
        justify-content: center !important;
        padding-top: 8% !important;
        padding-bottom: 5% !important;
    }
    .elementor-element-4fc28b13 {
        aspect-ratio: 1 / 1 !important;
        height: auto !important;
        min-height: auto !important;
        max-height: calc(100vh - 120px) !important;
    }
}
@media (max-width: 767px) {
    .elementor-element-40a06f6 {
        height: auto !important;
        min-height: auto !important;
    }
    .elementor-element-580cc436 {
        padding: 50px 20px 30px 20px !important;
        height: auto !important;
        min-height: auto !important;
    }
    .elementor-element-4fc28b13 {
        aspect-ratio: 1 / 1 !important;
        height: auto !important;
        min-height: auto !important;
        width: 100% !important;
    }
    .elementor-element-1bc75a32 {
        display: none !important;
    }
}

/* Masked Image Positioning in Hero */
.elementor-element-41484f27 {
    object-fit: cover !important;
    border-radius: 50% !important;
}
@media (min-width: 768px) {
    .elementor-element-41484f27 {
        left: -15% !important;
    }
}

/* About Section ("Highest level") Image Scaling */
.elementor-element-6f812967 img {
    aspect-ratio: 4 / 3 !important;
    width: 100% !important;
    height: auto !important;
    min-height: auto !important;
    object-fit: cover !important;
}
.elementor-element-6f812967 {
    height: auto !important;
    min-height: auto !important;
}
@media (max-width: 767px) {
    .elementor-element-6f812967 {
        margin-top: 0 !important;
        margin-bottom: 20px !important;
    }
}

/* Services Section ("What we do") Background Alignment */
@media (min-width: 768px) {
    .elementor-element-59b6e6d5 {
        height: auto !important;
        min-height: auto !important;
    }
    .elementor-element-42abf8aa {
        aspect-ratio: 16 / 9 !important;
        height: auto !important;
        min-height: auto !important;
    }
}
@media (max-width: 767px) {
    .elementor-element-42abf8aa {
        aspect-ratio: 16 / 9 !important;
        height: auto !important;
        min-height: auto !important;
        width: 100% !important;
    }
    .elementor-element-63950d29 {
        display: none !important;
    }
}

/* Testimonials (Section 5) Height Alignment (Image and Quote Card) */
@media (min-width: 768px) {
    .elementor-element-331d0ffb {
        display: flex !important;
        align-items: stretch !important;
    }
    .elementor-element-6e5c11f9, .elementor-element-75ba3d29 {
        height: auto !important;
        align-self: stretch !important;
        display: flex !important;
        flex-direction: column !important;
    }
    .elementor-element-6e5c11f9 .elementor-widget-wrap,
    .elementor-element-75ba3d29 .elementor-widget-wrap {
        height: 100% !important;
        display: flex !important;
        flex-direction: column !important;
        justify-content: center !important;
    }
}

/* ==========================================
   KIT 2 (Wooden Accessories) Responsive Fixes
   ========================================== */

/* Hero Container Viewport Limits */
@media (min-width: 768px) {
    .elementor-element-49f8bd39 {
        height: auto !important;
        min-height: auto !important;
    }
    .elementor-element-35a4f6fb, .elementor-element-39f1fa01 {
        aspect-ratio: 1 / 1 !important;
        height: auto !important;
        min-height: auto !important;
        max-height: calc(100vh - 120px) !important;
    }
}
@media (max-width: 767px) {
    .elementor-element-49f8bd39 {
        height: auto !important;
        min-height: auto !important;
        flex-direction: column !important;
    }
    .elementor-element-35a4f6fb {
        display: none !important;
    }
    .elementor-element-39f1fa01 {
        aspect-ratio: 1 / 1 !important;
        height: auto !important;
        min-height: auto !important;
        width: 100% !important;
    }
}

/* Home Goods (About) */
.elementor-element-4d1645d0 {
    aspect-ratio: 4 / 3 !important;
    height: auto !important;
    min-height: auto !important;
}
@media (max-width: 767px) {
    .elementor-element-4d1645d0 {
        aspect-ratio: auto !important;
        min-height: 380px !important;
        padding-top: 40px !important;
        padding-bottom: 40px !important;
    }
}

/* Tablewear (Services) */
.elementor-element-51305b21 {
    aspect-ratio: 16 / 9 !important;
    height: auto !important;
    min-height: auto !important;
}
@media (max-width: 767px) {
    .elementor-element-51305b21 {
        aspect-ratio: auto !important;
        min-height: 380px !important;
        padding-top: 40px !important;
        padding-bottom: 40px !important;
    }
}

/* CTA (Section 5) Parent-Child Stretch to align Image and Quote Card heights */
.elementor-element-1b226200 {
    display: flex !important;
    flex-direction: row !important;
    justify-content: flex-end !important;
    align-items: stretch !important;
    padding-top: 0 !important;
    padding-bottom: 0 !important;
    aspect-ratio: 16 / 9 !important;
    height: auto !important;
    min-height: auto !important;
}
.elementor-element-56a3deab {
    height: 100% !important;
    min-height: 100% !important;
    align-self: stretch !important;
    margin-top: 0 !important;
    margin-bottom: 0 !important;
}
@media (max-width: 767px) {
    .elementor-element-1b226200 {
        flex-direction: column !important;
        aspect-ratio: auto !important;
        min-height: 450px !important;
    }
    .elementor-element-7c6a7a2 {
        position: relative !important;
        margin: 30px auto 0 auto !important;
        left: auto !important;
        transform: none !important;
        display: block !important;
        clear: both !important;
    }
}
</style>`
        },
        elements: [],
        isInner: false,
        widgetType: "html",
        elType: "widget"
      });
    }
  }
  const combinedSections = [
    ...headerSections,
    ...homeSections,
    ...footerSections
  ];
  const mapLibraryUrlsAndFixStretch = (obj) => {
    if (!obj || typeof obj !== "object") return;
    if (obj.elType === "widget" && obj.widgetType === "image" && obj.settings) {
      obj.settings["object-fit"] = "cover";
    }
    if (obj.settings && obj.settings.background_image && obj.settings.background_image.url) {
      obj.settings.background_size = "cover";
      obj.settings.background_repeat = "no-repeat";
      obj.settings.background_position = "center center";
      const isAboutContainer = obj.settings?._title === "Home Goods" || obj.id === "4d1645d0";
      obj.settings.background_color = isAboutContainer ? "#ffffff" : "#E8E6DF";
    }
    if (obj.url && typeof obj.url === "string" && obj.url.includes("library.elementor.com")) {
      const local = getLocalMedia(obj.url);
      if (local) {
        obj.url = local.url;
        if (obj.id !== void 0) {
          obj.id = String(local.id);
        }
      }
    }
    if (obj.value && typeof obj.value === "object" && obj.value.url && typeof obj.value.url === "string" && obj.value.url.includes("library.elementor.com")) {
      const local = getLocalMedia(obj.value.url);
      if (local) {
        obj.value.url = local.url;
        if (obj.value.id !== void 0) {
          obj.value.id = String(local.id);
        }
      }
    }
    for (const key of Object.keys(obj)) {
      const val = obj[key];
      if (typeof val === "string" && val.includes("library.elementor.com")) {
        const local = getLocalMedia(val);
        if (local) {
          obj[key] = local.url;
        }
      } else if (val && typeof val === "object") {
        mapLibraryUrlsAndFixStretch(val);
      }
    }
  };
  mapLibraryUrlsAndFixStretch(combinedSections);
  return JSON.stringify(combinedSections);
}

// src/lib/provisioning-engine.ts
init_gemini();
var MAX_RETRIES = 3;
var DEBUG_ROOT_DIR = path4.join(process.cwd(), ".debug-generation");
var MAX_SUBDOMAIN_LENGTH = 45;
var SUBDOMAIN_SEMANTIC_VARIANTS = [
  "-shop",
  "-store",
  "-official",
  "-co",
  "-pro"
];
function sanitizeSubdomainBase(name) {
  return (name || "").toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9]+/g, "-").replace(/-+/g, "-").replace(/^-+|-+$/g, "").substring(0, 40).replace(/^-+|-+$/g, "");
}
function cleanSubdomain(sub) {
  return sub.replace(/-+/g, "-").replace(/^-+|-+$/g, "");
}
async function isSubdomainTaken(subdomain) {
  const [rows] = await pool.query(
    `SELECT id FROM provisioning_jobs
		 WHERE subdomain = ? AND status NOT IN ('failed', 'cleaned')
		 LIMIT 1`,
    [subdomain]
  );
  return rows && rows.length > 0;
}
async function generateUniqueSubdomain(businessName) {
  const base = sanitizeSubdomainBase(businessName);
  if (!base) {
    return `site-${crypto.randomBytes(3).toString("hex")}`;
  }
  if (!await isSubdomainTaken(base)) {
    return base;
  }
  for (let i = 1; i <= 5; i++) {
    const candidate = cleanSubdomain(`${base}-${i}`.substring(0, MAX_SUBDOMAIN_LENGTH));
    if (!await isSubdomainTaken(candidate)) {
      return candidate;
    }
  }
  for (const suffix of SUBDOMAIN_SEMANTIC_VARIANTS) {
    const candidate = cleanSubdomain(`${base}${suffix}`.substring(0, MAX_SUBDOMAIN_LENGTH));
    if (!await isSubdomainTaken(candidate)) {
      return candidate;
    }
  }
  for (let attempt = 0; attempt < 10; attempt++) {
    const suffix = crypto.randomBytes(2).toString("hex");
    const candidate = cleanSubdomain(`${base}-${suffix}`.substring(0, MAX_SUBDOMAIN_LENGTH));
    if (!await isSubdomainTaken(candidate)) {
      return candidate;
    }
  }
  return cleanSubdomain(`${base}-${crypto.randomBytes(4).toString("hex")}`.substring(
    0,
    MAX_SUBDOMAIN_LENGTH
  ));
}
async function suggestAlternativeSubdomainViaVertex(businessName, existingSubdomain, attemptNumber, log) {
  try {
    log(`[cPanel-Subdomain] Querying Vertex for an alternative subdomain for "${businessName}" because "${existingSubdomain}" is taken.`);
    const prompt = `You are a professional local business web hosting setup assistant.
The business name is "${businessName}".
The primary subdomain candidate "${existingSubdomain}" is already taken on our server.
Please suggest one alternative, professional, clean, DNS-safe subdomain name that is highly relevant to this business.
Follow these rules strictly:
1. ONLY lowercase letters, numbers, and hyphens are allowed. No other characters.
2. Max 45 characters long.
3. It must be different from "${existingSubdomain}".
4. It must NOT contain suffixes like "-1" or random numbers. Make it semantic and professional (e.g., adding words like "cabinetry", "woodwork", "shop", "builders", or local keywords if relevant).
5. Attempt number: ${attemptNumber}. If attempt is greater than 1, make it more unique.
6. Return ONLY the alternative subdomain name string itself, with no explanation, no formatting, no markdown, and no punctuation.`;
    const responseText = await generateWithFallback(
      prompt,
      { temperature: 0.7 },
      {
        logStderr: log,
        throttleGemini: async () => {
        },
        contextLabel: "alternative-subdomain-generation"
      }
    );
    const result = responseText?.trim().toLowerCase().replace(/[^a-z0-9-]/g, "");
    if (result && result.length > 2 && result !== existingSubdomain) {
      log(`[cPanel-Subdomain] Vertex suggested alternative subdomain: "${result}"`);
      return result;
    }
  } catch (e) {
    log(`[cPanel-Subdomain] Vertex error suggesting subdomain: ${e.message || e}`);
  }
  const suffix = crypto.randomBytes(3).toString("hex");
  return cleanSubdomain(`${sanitizeSubdomainBase(businessName)}-${suffix}`.substring(0, MAX_SUBDOMAIN_LENGTH));
}
function generateSecurePassword() {
  return crypto.randomBytes(16).toString("hex") + "!aA1";
}
function encrypt(text) {
  const key = process.env.ENCRYPTION_KEY || "0123456789abcdef0123456789abcdef";
  const iv = crypto.randomBytes(16);
  const cipher = crypto.createCipheriv("aes-256-cbc", Buffer.from(key), iv);
  let encrypted = cipher.update(text);
  encrypted = Buffer.concat([encrypted, cipher.final()]);
  return iv.toString("hex") + ":" + encrypted.toString("hex");
}
function decrypt(encryptedValue) {
  const [ivHex, encHex] = encryptedValue.split(":");
  const key = process.env.ENCRYPTION_KEY || "0123456789abcdef0123456789abcdef";
  const decipher = crypto.createDecipheriv(
    "aes-256-cbc",
    Buffer.from(key),
    Buffer.from(ivHex, "hex")
  );
  let decrypted = decipher.update(Buffer.from(encHex, "hex"));
  decrypted = Buffer.concat([decrypted, decipher.final()]);
  return decrypted.toString();
}
async function appendLog(jobId, message) {
  const timestamp = (/* @__PURE__ */ new Date()).toISOString();
  const logEntry = `[${timestamp}] ${message}`;
  console.log(`[Job ${jobId}] ${message}`);
  fs5.writeSync(2, `[Job ${jobId}] ${message}
`);
  await pool.query(
    `UPDATE provisioning_jobs SET logs = JSON_ARRAY_APPEND(COALESCE(logs, JSON_ARRAY()), '$', ?) WHERE id = ?`,
    [logEntry, jobId]
  );
}
async function processJob(jobId) {
  const [rows] = await pool.query(
    `SELECT * FROM provisioning_jobs WHERE id = ?`,
    [jobId]
  );
  if (!rows || rows.length === 0) return;
  const job = rows[0];
  if (job.status === "completed" || job.status === "failed") return;
  try {
    await executeStateMachine(job);
  } catch (error) {
    await appendLog(job.id, `ERROR: ${error.message}`);
    if (job.retry_count < MAX_RETRIES) {
      await appendLog(
        job.id,
        `Retrying later (Attempt ${job.retry_count + 1}/${MAX_RETRIES})`
      );
      await pool.query(
        `UPDATE provisioning_jobs SET retry_count = retry_count + 1, locked_at = NULL WHERE id = ?`,
        [job.id]
      );
    } else {
      await appendLog(job.id, `Max retries reached. Initiating rollback.`);
      await rollbackJob(job);
      await pool.query(
        `UPDATE provisioning_jobs SET status = 'failed', locked_at = NULL WHERE id = ?`,
        [job.id]
      );
    }
  }
}
async function executeStateMachine(job) {
  const rootDomain = process.env.WP_ROOT_DOMAIN || "digiscoutwp.online";
  const docRootBase = process.env.WP_DOCROOT_BASE || "/home/digigesf/public_html/sites";
  let subdomain = job.subdomain;
  let dbName = job.db_name;
  let dbUser = job.db_user;
  let wpAdminUser = job.wp_admin_user || "admin";
  let wpAdminPass = job.wp_admin_pass_encrypted;
  if (job.status === "pending" || job.status === "creating_subdomain") {
    await pool.query(
      `UPDATE provisioning_jobs SET status = 'creating_subdomain' WHERE id = ?`,
      [job.id]
    );
    await appendLog(job.id, "Starting subdomain creation on remote WP server");
    if (!subdomain) {
      const name = job.business_name || job.project_id;
      subdomain = await generateUniqueSubdomain(name);
      await appendLog(job.id, `Generated subdomain: "${subdomain}"`);
      await pool.query(
        `UPDATE provisioning_jobs SET subdomain = ? WHERE id = ?`,
        [subdomain, job.id]
      );
    }
    let subdomainOk = false;
    let attempts = 0;
    const maxSubdomainAttempts = 3;
    while (!subdomainOk && attempts < maxSubdomainAttempts) {
      attempts++;
      const fullDocRoot = `${docRootBase}/${subdomain}`;
      await appendLog(job.id, `Remote doc root will be: ${fullDocRoot}`);
      let existsOnServer = false;
      try {
        const subExists = await checkSubdomainExists(subdomain, rootDomain);
        const dirExists = await remoteDirectoryExists(fullDocRoot);
        if (subExists || dirExists) {
          existsOnServer = true;
          await appendLog(
            job.id,
            `Subdomain "${subdomain}.${rootDomain}" or remote directory "${fullDocRoot}" already exists on Namecheap/cPanel server.`
          );
        }
      } catch (chkErr) {
        await appendLog(
          job.id,
          `Warning during subdomain existence pre-check: ${chkErr.message || chkErr}`
        );
      }
      if (existsOnServer) {
        if (attempts < maxSubdomainAttempts) {
          const prevSubdomain = subdomain;
          subdomain = await suggestAlternativeSubdomainViaVertex(
            job.business_name || job.project_id,
            prevSubdomain,
            attempts,
            (msg) => appendLog(job.id, msg)
          );
          await appendLog(job.id, `Retrying subdomain check with Vertex suggested alternative: "${subdomain}"`);
          await pool.query(
            `UPDATE provisioning_jobs SET subdomain = ? WHERE id = ?`,
            [subdomain, job.id]
          );
          continue;
        } else {
          throw new Error(`Failed to find a unique subdomain after ${maxSubdomainAttempts} attempts. Last tried: "${subdomain}"`);
        }
      }
      try {
        await addSubdomain(subdomain, rootDomain, fullDocRoot);
        await appendLog(
          job.id,
          `Created subdomain: ${subdomain}.${rootDomain} \u2192 ${fullDocRoot}`
        );
        subdomainOk = true;
      } catch (subErr) {
        const errMsg = subErr.message || String(subErr);
        if (errMsg.includes("already exists") || errMsg.includes("exists") || errMsg.includes("closed by remote host")) {
          await appendLog(
            job.id,
            `Subdomain "${subdomain}.${rootDomain}" collision or connection closure detected: "${errMsg}"`
          );
          if (attempts < maxSubdomainAttempts) {
            const prevSubdomain = subdomain;
            subdomain = await suggestAlternativeSubdomainViaVertex(
              job.business_name || job.project_id,
              prevSubdomain,
              attempts,
              (msg) => appendLog(job.id, msg)
            );
            await appendLog(job.id, `Retrying subdomain creation with Vertex suggested alternative: "${subdomain}"`);
            await pool.query(
              `UPDATE provisioning_jobs SET subdomain = ? WHERE id = ?`,
              [subdomain, job.id]
            );
          } else {
            throw new Error(`Failed to create a unique subdomain after ${maxSubdomainAttempts} attempts. Last tried: "${subdomain}"`);
          }
        } else {
          throw subErr;
        }
      }
    }
    job.status = "creating_database";
  }
  if (job.status === "creating_database") {
    await pool.query(
      `UPDATE provisioning_jobs SET status = 'creating_database' WHERE id = ?`,
      [job.id]
    );
    await appendLog(job.id, "Creating database on remote WP server cPanel");
    const dbPrefix = process.env.CPANEL_USERNAME ? `${process.env.CPANEL_USERNAME}_` : "db_";
    if (!dbName) {
      const suffix = crypto.randomBytes(4).toString("hex");
      dbName = `${dbPrefix}${suffix}`.substring(0, 64);
      dbUser = `${dbPrefix}u${suffix}`.substring(0, 32);
      await pool.query(
        `UPDATE provisioning_jobs SET db_name = ?, db_user = ? WHERE id = ?`,
        [dbName, dbUser, job.id]
      );
    }
    const dbPassword = generateSecurePassword();
    await createDatabase(dbName);
    await createDatabaseUser(dbUser, dbPassword);
    await setDatabasePrivileges(dbUser, dbName);
    await pool.query(
      `UPDATE provisioning_jobs SET db_pass_encrypted = ? WHERE id = ?`,
      [encrypt(dbPassword), job.id]
    );
    job._tempDbPass = dbPassword;
    await appendLog(
      job.id,
      `Created remote database: ${dbName} and user: ${dbUser}`
    );
    job.status = "installing_wordpress";
  }
  if (job.status === "installing_wordpress") {
    await pool.query(
      `UPDATE provisioning_jobs SET status = 'installing_wordpress' WHERE id = ?`,
      [job.id]
    );
    await appendLog(
      job.id,
      "Starting remote WordPress installation via SSH/WP-CLI"
    );
    let dbPassword = job._tempDbPass;
    if (!dbPassword && job.db_pass_encrypted) {
      try {
        dbPassword = decrypt(job.db_pass_encrypted);
      } catch (e) {
        throw new Error(`Failed to decrypt DB password: ${e.message}`);
      }
    }
    if (!dbPassword) {
      throw new Error("Database password missing. Cannot install WordPress.");
    }
    const wpCliStatus = await checkWpCliAvailable();
    if (!wpCliStatus.available) {
      throw new Error(
        `WP-CLI not reachable on remote server: ${wpCliStatus.error}`
      );
    }
    await appendLog(job.id, `WP-CLI available: ${wpCliStatus.version}`);
    const fullDocRoot = `${docRootBase}/${subdomain}`;
    await appendLog(job.id, `Creating remote directory: ${fullDocRoot}`);
    await runRemoteShellCommand(
      `mkdir -p "${fullDocRoot}"`,
      (log) => appendLog(job.id, log)
    );
    await downloadWordPressCore(fullDocRoot, (log) => appendLog(job.id, log));
    if (!wpAdminPass) {
      const rawPass = generateSecurePassword();
      wpAdminPass = encrypt(rawPass);
      job._tempAdminPass = rawPass;
      await pool.query(
        `UPDATE provisioning_jobs SET wp_admin_user = ?, wp_admin_pass_encrypted = ? WHERE id = ?`,
        [wpAdminUser, wpAdminPass, job.id]
      );
    }
    await createWpConfig(
      fullDocRoot,
      dbName,
      dbUser,
      dbPassword,
      "localhost",
      (log) => appendLog(job.id, log)
    );
    const rawAdminPass = job._tempAdminPass || decrypt(wpAdminPass);
    const siteUrl = `http://${subdomain}.${rootDomain}`;
    await installWordPress(
      fullDocRoot,
      siteUrl,
      `${job.business_name || "Generated Site"} \u2014 ${job.project_id}`,
      wpAdminUser,
      rawAdminPass,
      "admin@digitalscout.online",
      (log) => appendLog(job.id, log)
    );
    await appendLog(job.id, `WordPress installed at ${siteUrl}`);
    job.status = "configuring_wordpress";
  }
  if (job.status === "configuring_wordpress") {
    await pool.query(
      `UPDATE provisioning_jobs SET status = 'configuring_wordpress' WHERE id = ?`,
      [job.id]
    );
    const fullDocRoot = `${docRootBase}/${subdomain}`;
    await configurePermalinks(
      fullDocRoot,
      "/%postname%/",
      (log) => appendLog(job.id, log)
    );
    await appendLog(job.id, "Configured remote permalinks");
    await appendLog(job.id, "Installing Hello Elementor theme...");
    try {
      await runWpCommand(
        `theme install hello-elementor --activate`,
        fullDocRoot,
        (log) => appendLog(job.id, log)
      );
      await appendLog(job.id, "Hello Elementor theme activated");
    } catch (e) {
      await appendLog(
        job.id,
        `Warning: Theme install failed (${e.message}), using default`
      );
    }
    try {
      await runWpCommand(
        `theme delete twentytwentyfive twentytwentyfour twentytwentythree astra`,
        fullDocRoot,
        (log) => appendLog(job.id, log)
      );
    } catch (e) {
    }
    await appendLog(job.id, "Installing and activating Elementor plugin...");
    try {
      await runWpCommand(
        `plugin install elementor --activate`,
        fullDocRoot,
        (log) => appendLog(job.id, log)
      );
      await appendLog(job.id, "Elementor plugin installed and activated");
    } catch (e) {
      await appendLog(
        job.id,
        `Warning: Elementor plugin install failed (${e.message})`
      );
    }
    const localProZipPath = path4.join(process.cwd(), "elementor-pro-4.0.4.zip");
    if (fs5.existsSync(localProZipPath)) {
      await appendLog(job.id, "Found Elementor Pro zip file. Uploading to remote server...");
      const remoteProZipPath = `/tmp/elementor-pro-4.0.4.zip`;
      try {
        await copyFileToRemote(localProZipPath, remoteProZipPath, (log) => appendLog(job.id, log));
        await appendLog(job.id, "Elementor Pro zip uploaded. Installing and activating...");
        await runWpCommand(
          `plugin install "${remoteProZipPath}" --activate`,
          fullDocRoot,
          (log) => appendLog(job.id, log)
        );
        await appendLog(job.id, "Elementor Pro plugin installed and activated successfully.");
      } catch (err) {
        await appendLog(
          job.id,
          `Warning: Elementor Pro plugin install failed (${err.message})`
        );
      } finally {
        await runRemoteShellCommand(`rm -f "${remoteProZipPath}"`, (log) => appendLog(job.id, log)).catch(() => {
        });
      }
    } else {
      await appendLog(job.id, "Warning: elementor-pro-4.0.4.zip not found in workspace root. Skipping Elementor Pro installation.");
    }
    await runWpCommand(
      `option update default_comment_status closed`,
      fullDocRoot,
      (log) => appendLog(job.id, log)
    ).catch(() => {
    });
    await runWpCommand(
      `option update blogdescription ""`,
      fullDocRoot,
      (log) => appendLog(job.id, log)
    ).catch(() => {
    });
    job.status = "deploying_content";
  }
  if (job.status === "deploying_content") {
    await pool.query(
      `UPDATE provisioning_jobs SET status = 'deploying_content' WHERE id = ?`,
      [job.id]
    );
    await appendLog(
      job.id,
      "Deploying content to remote WordPress..."
    );
    const fullDocRoot = `${docRootBase}/${subdomain}`;
    const schema = typeof job.website_schema === "string" ? JSON.parse(job.website_schema) : job.website_schema;
    if (schema) {
      const isElementor = schema.elementorContent !== void 0;
      let homepageBlocks = "";
      if (!isElementor) {
        const { schemaToGutenbergBlocks: schemaToGutenbergBlocks2 } = await Promise.resolve().then(() => (init_wordpress(), wordpress_exports));
        homepageBlocks = schemaToGutenbergBlocks2(schema);
      }
      await pool.query(
        `UPDATE provisioning_jobs SET gutenberg_trace = ?, status = 'deploying_content' WHERE id = ?`,
        [isElementor ? JSON.stringify(schema.elementorContent) : homepageBlocks, job.id]
      );
      const contentMeta = await injectWebsiteContent(
        fullDocRoot,
        schema,
        homepageBlocks,
        wpAdminUser,
        (log) => appendLog(job.id, log)
      );
      await appendLog(
        job.id,
        `CONTENT_APPLIED source=${contentMeta.renderSource} length=${contentMeta.length} sha1=${contentMeta.sha1}`
      );
      await appendLog(job.id, "Content injected successfully on remote server");
    } else {
      await appendLog(job.id, "WARNING: No website schema found to inject.");
    }
    job.status = "completed";
  }
  if (job.status === "completed") {
    await pool.query(
      `UPDATE provisioning_jobs SET status = 'completed', locked_at = NULL WHERE id = ?`,
      [job.id]
    );
    const httpUrl = `http://${subdomain}.${rootDomain}`;
    await pool.query(
      `
			INSERT IGNORE INTO isolated_deployments
				(id, project_id, subdomain_url, wp_admin_url, admin_username, encrypted_admin_password, website_schema, ssl_status)
			VALUES (?, ?, ?, ?, ?, ?, ?, 'pending')
		`,
      [
        crypto.randomUUID(),
        job.project_id,
        httpUrl,
        `${httpUrl}/wp-admin`,
        wpAdminUser,
        wpAdminPass,
        typeof job.website_schema === "string" ? job.website_schema : JSON.stringify(job.website_schema)
      ]
    );
    if (job.trace_id) {
      try {
        await pool.query(
          `INSERT INTO generation_audit_logs (trace_id, step, message, data) VALUES (?, ?, ?, ?)`,
          [
            job.trace_id,
            "provisioning_completed",
            `Remote WordPress site provisioned at ${httpUrl}`,
            JSON.stringify({
              url: httpUrl,
              jobId: job.id,
              remoteHost: process.env.WP_SSH_HOST
            })
          ]
        );
      } catch (e) {
      }
    }
    await appendLog(
      job.id,
      `Job completed! Remote WP site live at ${httpUrl} (SSL polling started)`
    );
  }
}
function esc2(str) {
  return (str || "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}
function ensureWordPressHtmlBlock(html) {
  const trimmed = (html || "").trim();
  if (!trimmed) return "";
  if (trimmed.includes("<!-- wp:html -->")) {
    return trimmed;
  }
  return `<!-- wp:html -->
${trimmed}
<!-- /wp:html -->`;
}
function updateElementorKitSettings(kitJson, schema) {
  const primary = schema.theme?.primaryColor || schema.theme?.palette?.primary || "#0066cc";
  const accent = schema.theme?.accentColor || schema.theme?.palette?.accent || "#ff6600";
  const neutral = schema.theme?.neutralColor || schema.theme?.palette?.background || "#f5f5f5";
  const text = schema.theme?.palette?.text || "#0f172a";
  const headingFont = schema.theme?.typography?.heading || "Inter";
  const bodyFont = schema.theme?.typography?.body || "Inter";
  const settings = kitJson.settings || {};
  if (Array.isArray(settings.system_colors)) {
    settings.system_colors.forEach((col) => {
      if (col._id === "primary") col.color = primary;
      if (col._id === "secondary") col.color = primary;
      if (col._id === "accent") col.color = accent;
      if (col._id === "text") col.color = text;
    });
  }
  if (Array.isArray(settings.custom_colors)) {
    settings.custom_colors.forEach((col) => {
      if (col._id === "afc2c62") {
        col.color = neutral;
      }
    });
  }
  const replaceFonts = (obj) => {
    if (!obj || typeof obj !== "object") return;
    if (obj.typography_font_family === "Spartan") {
      const title = String(obj.title || "").toLowerCase();
      if (title.includes("text") || title.includes("copyright") || title.includes("body")) {
        obj.typography_font_family = bodyFont;
      } else {
        obj.typography_font_family = headingFont;
      }
    }
    for (const key of Object.keys(obj)) {
      if (obj[key] && typeof obj[key] === "object") {
        replaceFonts(obj[key]);
      }
    }
  };
  replaceFonts(settings);
  return kitJson;
}
async function injectWebsiteContent(docRoot, schema, _homepageBlocks, adminUser, logCallback) {
  try {
    await logCallback("Cleaning up default WordPress content...");
    try {
      const deleteCmd = `/usr/local/sbin/wp post list --post_type=post,page --format=ids --path="${docRoot}" --allow-root | xargs -r /usr/local/sbin/wp post delete --force --allow-root --path="${docRoot}"`;
      await runRemoteShellCommand(deleteCmd, logCallback);
    } catch (e) {
    }
    const isElementor = schema.elementorContent !== void 0;
    if (isElementor) {
      await logCallback("Deploying Elementor template-based layout...");
      await logCallback("Creating mu-plugins to allow SVG uploads...");
      await runRemoteShellCommand(`mkdir -p "${docRoot}/wp-content/mu-plugins"`, logCallback);
      const allowSvgPhp = `<?php
// Allow SVG uploads in WordPress
add_filter('upload_mimes', function($mimes) {
    $mimes['svg'] = 'image/svg+xml';
    $mimes['svgz'] = 'image/svg+xml';
    return $mimes;
});
add_filter('wp_check_filetype_and_ext', function($data, $file, $filename, $mimes) {
    $filetype = wp_check_filetype($filename, $mimes);
    if ($filetype['ext'] === 'svg') {
        $data['ext'] = 'svg';
        $data['type'] = 'image/svg+xml';
    }
    return $data;
}, 10, 4);
`;
      const base64AllowSvg = Buffer.from(allowSvgPhp).toString("base64");
      await runRemoteShellCommand(
        `echo "${base64AllowSvg}" | base64 -d > "${docRoot}/wp-content/mu-plugins/allow-svg.php"`,
        logCallback
      );
      const mediaMap = {};
      const imageSet = /* @__PURE__ */ new Set();
      const aiContent = schema.elementorContent;
      if (aiContent.hero?.hero_image) imageSet.add(aiContent.hero.hero_image);
      if (aiContent.hero?.masked_image) imageSet.add(aiContent.hero.masked_image);
      if (aiContent.about?.image) imageSet.add(aiContent.about.image);
      if (aiContent.services?.image) imageSet.add(aiContent.services.image);
      if (Array.isArray(aiContent.testimonials?.slideshow)) {
        aiContent.testimonials.slideshow.forEach((url) => {
          if (url) imageSet.add(url);
        });
      }
      if (Array.isArray(aiContent.projects?.posts)) {
        aiContent.projects.posts.forEach((p) => {
          if (p.url) imageSet.add(p.url);
        });
      }
      if (schema.brand?.logo) {
        imageSet.add(schema.brand.logo);
      }
      const templateDir = path4.join(process.cwd(), "elementor-kit-2");
      const templateFiles = [
        path4.join(templateDir, "content", "page", "2.json"),
        path4.join(templateDir, "templates", "49.json"),
        path4.join(templateDir, "templates", "156.json")
      ];
      for (const file of templateFiles) {
        if (fs5.existsSync(file)) {
          try {
            const content2 = fs5.readFileSync(file, "utf8").replace(/\\/g, "");
            const matches = content2.match(/https?:\/\/library\.elementor\.com\/[^\s"'}]+/g);
            if (matches) {
              for (const match of matches) {
                imageSet.add(match);
              }
            }
          } catch (e) {
            await logCallback(`Error reading template file ${file}: ${e}`);
          }
        }
      }
      for (const imgUrl of imageSet) {
        await logCallback(`Importing image: ${imgUrl}`);
        try {
          let mediaId = "";
          let imported = false;
          if (imgUrl.includes("/public/generated-images/") || imgUrl.includes("/public/default/")) {
            const isDefault = imgUrl.includes("/public/default/");
            const marker = isDefault ? "/public/default/" : "/public/generated-images/";
            const parts = imgUrl.split(marker);
            const filename = decodeURIComponent(parts[parts.length - 1]);
            const localPath = path4.join(process.cwd(), "public", isDefault ? "default" : "generated-images", filename);
            if (fs5.existsSync(localPath)) {
              await logCallback(`Detected local image: ${filename}. Copying to remote server...`);
              const ext = filename.toLowerCase().endsWith(".png") ? "png" : "jpg";
              const remoteTmpMedia = `/tmp/ds_local_${Date.now()}_${Math.random().toString(36).substring(2, 7)}.${ext}`;
              try {
                await copyFileToRemote(localPath, remoteTmpMedia, logCallback);
                const mediaOut = await runWpCommand(
                  `media import "${remoteTmpMedia}" --porcelain`,
                  docRoot,
                  logCallback
                );
                mediaId = mediaOut.stdout.trim();
                if (/^\d+$/.test(mediaId)) {
                  imported = true;
                }
              } catch (uploadErr) {
                await logCallback(`Failed to copy/import local file ${filename}: ${uploadErr.message}. Trying direct fallback...`);
              } finally {
                await runRemoteShellCommand(`rm -f "${remoteTmpMedia}"`, logCallback).catch(() => {
                });
              }
            } else {
              await logCallback(`Local file not found at ${localPath} for generated image URL: ${imgUrl}. Trying direct fallback...`);
            }
          }
          if (!imported && imgUrl.startsWith("http")) {
            try {
              await logCallback(`Downloading image locally on Node server first: ${imgUrl}`);
              const ext = imgUrl.toLowerCase().includes(".png") ? "png" : "jpg";
              const tempLocalDir = path4.join(process.cwd(), "scratch", "downloads");
              if (!fs5.existsSync(tempLocalDir)) {
                fs5.mkdirSync(tempLocalDir, { recursive: true });
              }
              const tempLocalPath = path4.join(tempLocalDir, `dl_${Date.now()}_${Math.random().toString(36).substring(2, 7)}.${ext}`);
              const response = await crossFetch2(imgUrl, {
                headers: {
                  "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
                }
              });
              if (response.ok) {
                const arrayBuffer = await response.arrayBuffer();
                fs5.writeFileSync(tempLocalPath, Buffer.from(arrayBuffer));
                await logCallback(`Copying downloaded file to remote server via SSH: ${tempLocalPath}`);
                const remoteTmpMedia = `/tmp/ds_dl_${Date.now()}_${Math.random().toString(36).substring(2, 7)}.${ext}`;
                try {
                  await copyFileToRemote(tempLocalPath, remoteTmpMedia, logCallback);
                  const mediaOut = await runWpCommand(
                    `media import "${remoteTmpMedia}" --porcelain`,
                    docRoot,
                    logCallback
                  );
                  mediaId = mediaOut.stdout.trim();
                  if (/^\d+$/.test(mediaId)) {
                    imported = true;
                  }
                } finally {
                  await runRemoteShellCommand(`rm -f "${remoteTmpMedia}"`, logCallback).catch(() => {
                  });
                  if (fs5.existsSync(tempLocalPath)) {
                    fs5.unlinkSync(tempLocalPath);
                  }
                }
              } else {
                await logCallback(`Local download failed: HTTP status ${response.status}`);
              }
            } catch (downloadErr) {
              await logCallback(`Failed local download/transfer pipeline: ${downloadErr.message}. Trying direct fallback...`);
            }
          }
          if (!imported) {
            try {
              const mediaOut = await runWpCommand(
                `media import "${imgUrl}" --porcelain`,
                docRoot,
                logCallback
              );
              mediaId = mediaOut.stdout.trim();
            } catch (e) {
              await logCallback(`Direct import failed for ${imgUrl}. Trying with curl on remote server...`);
              const ext = imgUrl.toLowerCase().includes(".png") ? "png" : "jpg";
              const remoteTmpMedia = `/tmp/ds_media_${Date.now()}_${Math.random().toString(36).substring(2, 7)}.${ext}`;
              await runRemoteShellCommand(
                `curl -sL -A "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36" "${imgUrl}" -o "${remoteTmpMedia}"`,
                logCallback
              );
              const mediaOut = await runWpCommand(
                `media import "${remoteTmpMedia}" --porcelain`,
                docRoot,
                logCallback
              );
              mediaId = mediaOut.stdout.trim();
              await runRemoteShellCommand(`rm -f "${remoteTmpMedia}"`, logCallback).catch(() => {
              });
            }
          }
          if (/^\d+$/.test(mediaId)) {
            const urlOut = await runWpCommand(
              `eval "echo wp_get_attachment_url(${mediaId});"`,
              docRoot,
              logCallback
            );
            const localUrl = urlOut.stdout.trim();
            mediaMap[imgUrl] = { id: parseInt(mediaId, 10), url: localUrl };
            await logCallback(`Successfully imported: ${imgUrl} -> ID: ${mediaId}, URL: ${localUrl}`);
            if (imgUrl === schema.brand?.logo) {
              await logCallback(`Setting site icon to: ${mediaId}`);
              await runWpCommand(
                `option update site_icon ${mediaId}`,
                docRoot,
                logCallback
              ).catch(() => {
              });
            }
          }
        } catch (err) {
          await logCallback(`Failed to import media ${imgUrl}: ${err.message}`);
        }
      }
      if (Array.isArray(aiContent.projects?.posts) && aiContent.projects.posts.length > 0) {
        await logCallback(`Creating ${aiContent.projects.posts.length} project posts in WordPress...`);
        for (const post of aiContent.projects.posts) {
          try {
            const localMedia = mediaMap[post.url];
            await logCallback(`Creating post: "${post.title}" with thumbnail ID: ${localMedia?.id || "none"}`);
            const safeTitle = post.title.replace(/'/g, `'\\''`);
            const postCreateOut = await runWpCommand(
              `post create --post_type=post --post_title='${safeTitle}' --post_status=publish --porcelain`,
              docRoot,
              logCallback
            );
            const newPostId = postCreateOut.stdout.trim();
            await logCallback(`Created project post ID: ${newPostId}`);
            if (newPostId && /^\d+$/.test(newPostId) && localMedia?.id) {
              try {
                await runWpCommand(
                  `post meta set ${newPostId} _thumbnail_id ${localMedia.id}`,
                  docRoot,
                  logCallback
                );
                await logCallback(`Set thumbnail (featured image) ID ${localMedia.id} for post ${newPostId}`);
              } catch (thumbErr) {
                await logCallback(`Warning: Failed to set thumbnail for post ${newPostId}: ${thumbErr.message}`);
              }
            } else if (newPostId && /^\d+$/.test(newPostId) && !localMedia?.id) {
              await logCallback(`Warning: No media found in mediaMap for project URL: ${post.url}. Post created without thumbnail.`);
            }
          } catch (postErr) {
            await logCallback(`Warning: Failed to create project post: ${postErr.message}`);
          }
        }
      }
      let menuId = "";
      let footerMenuId = "";
      let custServiceMenuId = "";
      try {
        await logCallback("Creating Main Menu...");
        const menuCreateOut = await runWpCommand(
          `menu create "Main Menu" --porcelain`,
          docRoot,
          logCallback
        );
        menuId = menuCreateOut.stdout.trim();
        await logCallback(`Main Menu ID: ${menuId}`);
        if (menuId) {
          await runWpCommand(
            `menu location assign "Main Menu" menu-1`,
            docRoot,
            logCallback
          );
          try {
            const itemsOut = await runWpCommand(
              `menu item list "${menuId}" --format=ids`,
              docRoot,
              logCallback
            );
            const itemIds = itemsOut.stdout.trim().replace(/\s+/g, " ");
            if (itemIds) {
              await runWpCommand(
                `menu item delete ${itemIds}`,
                docRoot,
                logCallback
              );
            }
          } catch (clearErr) {
          }
          await runWpCommand(
            `menu item add-custom "${menuId}" "Home" "#"`,
            docRoot,
            logCallback
          );
          await runWpCommand(
            `menu item add-custom "${menuId}" "Services" "#services"`,
            docRoot,
            logCallback
          );
          await runWpCommand(
            `menu item add-custom "${menuId}" "Reviews" "#reviews"`,
            docRoot,
            logCallback
          );
          await runWpCommand(
            `menu item add-custom "${menuId}" "Contact" "#contact"`,
            docRoot,
            logCallback
          );
        }
      } catch (menuErr) {
        await logCallback(`Warning during menu creation: ${menuErr.message}`);
      }
      try {
        await logCallback("Creating Footer Menu (Legal & Privacy)...");
        const fmCreateOut = await runWpCommand(
          `menu create "Footer Menu" --porcelain`,
          docRoot,
          logCallback
        );
        footerMenuId = fmCreateOut.stdout.trim();
        if (footerMenuId) {
          try {
            const itemsOut = await runWpCommand(
              `menu item list "${footerMenuId}" --format=ids`,
              docRoot,
              logCallback
            );
            const itemIds = itemsOut.stdout.trim().replace(/\s+/g, " ");
            if (itemIds) {
              await runWpCommand(`menu item delete ${itemIds}`, docRoot, logCallback);
            }
          } catch (clearErr) {
          }
          await runWpCommand(`menu item add-custom "${footerMenuId}" "Terms of Use" "#"`, docRoot, logCallback);
          await runWpCommand(`menu item add-custom "${footerMenuId}" "Privacy & Cookies" "#"`, docRoot, logCallback);
        }
      } catch (fmErr) {
        await logCallback(`Warning during footer menu creation: ${fmErr.message}`);
      }
      try {
        await logCallback("Creating Customer Service Menu...");
        const csCreateOut = await runWpCommand(
          `menu create "Customer Service" --porcelain`,
          docRoot,
          logCallback
        );
        custServiceMenuId = csCreateOut.stdout.trim();
        if (custServiceMenuId) {
          try {
            const itemsOut = await runWpCommand(
              `menu item list "${custServiceMenuId}" --format=ids`,
              docRoot,
              logCallback
            );
            const itemIds = itemsOut.stdout.trim().replace(/\s+/g, " ");
            if (itemIds) {
              await runWpCommand(`menu item delete ${itemIds}`, docRoot, logCallback);
            }
          } catch (clearErr) {
          }
          await runWpCommand(`menu item add-custom "${custServiceMenuId}" "Home" "#"`, docRoot, logCallback);
          await runWpCommand(`menu item add-custom "${custServiceMenuId}" "Services" "#services"`, docRoot, logCallback);
          await runWpCommand(`menu item add-custom "${custServiceMenuId}" "Contact" "#contact"`, docRoot, logCallback);
        }
      } catch (csErr) {
        await logCallback(`Warning during customer service menu creation: ${csErr.message}`);
      }
      const businessInfo = {
        name: schema.brand?.businessName || "Business",
        address: schema.brand?.address || "",
        phone: schema.brand?.phone || "",
        email: schema.brand?.email || "",
        hours: schema.brand?.hours || ""
      };
      await logCallback("Merging Elementor template layouts...");
      const mergedJson = mergeElementorTemplate(
        templateDir,
        aiContent,
        mediaMap,
        businessInfo,
        menuId,
        footerMenuId,
        custServiceMenuId
      );
      await logCallback("Creating Home page post in WordPress for Elementor...");
      const homePageIdOut2 = await runWpCommand(
        `post create --post_type=page --post_title="Home" --post_content="" --post_status=publish --format=ids --user="${adminUser}"`,
        docRoot,
        logCallback
      );
      const homePageId2 = homePageIdOut2.stdout.replace(/[^0-9]/g, "").trim();
      if (!homePageId2 || homePageId2 === "0") {
        throw new Error("Home page creation failed \u2014 invalid ID returned");
      }
      await logCallback(`Home page created with ID: ${homePageId2}. Setting as front page...`);
      await runWpCommand(`option update show_on_front page`, docRoot, logCallback);
      await runWpCommand(`option update page_on_front ${homePageId2}`, docRoot, logCallback);
      if (schema.brand?.businessName) {
        await runWpCommand(
          `option update blogname "${esc2(schema.brand.businessName)}"`,
          docRoot,
          logCallback
        );
      }
      await runWpCommand(`rewrite structure "/%postname%/"`, docRoot, logCallback);
      await runWpCommand(`rewrite flush`, docRoot, logCallback);
      let activeKitId = "";
      let updatedKitSettingsJson = "";
      try {
        await logCallback("Retrieving active Elementor kit...");
        const kitOut = await runWpCommand(
          `option get elementor_active_kit`,
          docRoot,
          logCallback
        );
        activeKitId = kitOut.stdout.trim();
        await logCallback(`Active Elementor kit ID: ${activeKitId}`);
        if (activeKitId) {
          const kitSettingsPath = path4.join(process.cwd(), "elementor-kit-2", "site-settings.json");
          if (fs5.existsSync(kitSettingsPath)) {
            const rawKitSettings = JSON.parse(fs5.readFileSync(kitSettingsPath, "utf8"));
            const updatedKit = updateElementorKitSettings(rawKitSettings, schema);
            updatedKitSettingsJson = JSON.stringify(updatedKit.settings || {});
          } else {
            await logCallback(`Warning: site-settings.json not found at ${kitSettingsPath}`);
          }
        }
      } catch (e) {
        await logCallback(`Warning: failed to customize Elementor kit settings: ${e.message}`);
      }
      const homepageJsonTmp = `/tmp/ds_el_data_${Date.now()}.json`;
      const kitJsonTmp = `/tmp/ds_el_kit_${Date.now()}.json`;
      const phpScriptTmp = `/tmp/ds_el_script_${Date.now()}.php`;
      await logCallback("Uploading Elementor payloads to remote server...");
      const homepageB64 = Buffer.from(mergedJson).toString("base64");
      await runRemoteShellCommand(
        `echo "${homepageB64}" | base64 -d > '${homepageJsonTmp}'`,
        logCallback
      );
      if (updatedKitSettingsJson) {
        const kitB64 = Buffer.from(updatedKitSettingsJson).toString("base64");
        await runRemoteShellCommand(
          `echo "${kitB64}" | base64 -d > '${kitJsonTmp}'`,
          logCallback
        );
      }
      const logoUrl = schema.brand?.logo || "";
      const logoAttachmentId = logoUrl ? mediaMap[logoUrl]?.id || "" : "";
      const phpCode = `<?php
$homepage_id = intval($args[0]);
$homepage_json_file = $args[1];
$kit_id = intval($args[2]);
$kit_settings_json_file = $args[3];
$logo_attachment_id = intval($args[4]);

if ($homepage_id && file_exists($homepage_json_file)) {
    $json_content = file_get_contents($homepage_json_file);
    $data = json_decode($json_content, true);
    if ($data) {
        update_post_meta($homepage_id, '_elementor_data', wp_slash($json_content));
        update_post_meta($homepage_id, '_elementor_edit_mode', 'builder');
        update_post_meta($homepage_id, '_wp_page_template', 'elementor_canvas');
        echo "HOMEPAGE_META_UPDATED\\n";
    } else {
        echo "ERROR: Invalid homepage JSON\\n";
    }
}

if ($kit_id && file_exists($kit_settings_json_file)) {
    $kit_content = file_get_contents($kit_settings_json_file);
    $settings = json_decode($kit_content, true);
    if ($settings) {
        update_post_meta($kit_id, '_elementor_page_settings', wp_slash($settings));
        echo "KIT_SETTINGS_UPDATED\\n";
    } else {
        echo "ERROR: Invalid kit settings JSON\\n";
    }
}

if ($logo_attachment_id) {
    set_theme_mod('custom_logo', $logo_attachment_id);
    echo "CUSTOM_LOGO_SET\\n";
}

// Inject global CSS to fix horizontal scroll and ensure circle images render correctly.
// This runs inside WP context so no shell-escaping issues.
$global_css = 'html, body { overflow-x: hidden !important; max-width: 100vw !important; } .elementor-section, .e-container, .elementor-column { max-width: 100% !important; } ' .
	'.elementor-widget-theme-site-logo img { mix-blend-mode: multiply !important; height: auto !important; max-height: 85px !important; width: auto !important; } ' .
	'.elementor-element-1b226200, .elementor-element-1b226200 .elementor-widget-text-editor, .elementor-element-1b226200 .elementor-widget-text-editor p { color: #E9E8E6 !important; } ' .
	'.elementor-element-1b226200 .elementor-widget-text-editor strong { color: #FFFFFF !important; } ' .
	'.elementor-element-51305b21 .elementor-background-overlay { background-color: rgba(12, 40, 53, 0.6) !important; opacity: 1 !important; } ' .
	'.elementor-element-51305b21::before { content: ""; position: absolute; top: 0; left: 0; right: 0; bottom: 0; background: rgba(12, 40, 53, 0.6) !important; z-index: 0; pointer-events: none; } ' .
	'.elementor-element-51305b21 > * { position: relative; z-index: 1; } ' .
	'.elementor-element-39f1fa01 .elementor-background-overlay { background-color: rgba(12, 40, 53, 0.45) !important; opacity: 1 !important; } ' .
	'.elementor-element-39f1fa01::before { content: ""; position: absolute; top: 0; left: 0; right: 0; bottom: 0; background: rgba(12, 40, 53, 0.45) !important; z-index: 0; pointer-events: none; } ' .
	'.elementor-element-39f1fa01 > * { position: relative; z-index: 1; } ' .
	'[data-elementor-type="footer"] *, .elementor-element-29c6e791 *, footer *, .site-footer *, .elementor-location-footer * { color: #ffffff !important; } ' .
	'[data-elementor-type="footer"] svg, [data-elementor-type="footer"] path, .elementor-element-29c6e791 svg, .elementor-element-29c6e791 path, footer svg, footer path, .site-footer svg, .site-footer path { fill: #ffffff !important; } ' .
	'[data-elementor-type="footer"] a:hover, [data-elementor-type="footer"] a:hover *, .elementor-element-29c6e791 a:hover, .elementor-element-29c6e791 a:hover *, footer a:hover, footer a:hover *, .site-footer a:hover, .site-footer a:hover * { color: #ffffff !important; opacity: 0.8 !important; } ' .
	'[data-elementor-type="footer"] ::placeholder, .elementor-element-29c6e791 ::placeholder, footer ::placeholder, .site-footer ::placeholder { color: rgba(255, 255, 255, 0.6) !important; } ' .
	'.elementor-widget-call-to-action .elementor-cta__content { display: flex !important; flex-direction: column !important; align-items: center !important; justify-content: center !important; text-align: center !important; } ' .
	'.elementor-widget-call-to-action .elementor-cta__title, .elementor-widget-call-to-action .elementor-cta__description, .elementor-widget-call-to-action .elementor-cta__content * { text-align: center !important; } ' .
	'.elementor-widget-call-to-action .elementor-cta__button-wrapper { display: flex !important; justify-content: center !important; width: 100% !important; } ' .
	'.elementor-widget-call-to-action .elementor-cta__button { margin: 0 auto !important; display: inline-block !important; } ' .
	'.elementor-element-3b58bec7, .elementor-element-69be47e, .elementor-element-5a62107a, .elementor-element-44b1aa0b, .elementor-element-3b58bec7 .elementor-widget-container, .elementor-element-69be47e .elementor-widget-container, .elementor-element-5a62107a .elementor-widget-container, .elementor-element-44b1aa0b .elementor-widget-container { background-color: transparent !important; background: transparent !important; } ' .
	'.elementor-element-3b58bec7 img, .elementor-element-69be47e img, .elementor-widget-theme-site-logo img, .elementor-widget-image img[src*="gen_logo"], header img[src*="gen_logo"], .site-header img[src*="gen_logo"] { mix-blend-mode: multiply !important; background-color: transparent !important; } ' .
	'.elementor-element-5a62107a img, .elementor-element-44b1aa0b img, [data-elementor-type="footer"] img[src*="gen_logo"], footer img[src*="gen_logo"], .site-footer img[src*="gen_logo"] { filter: invert(1) !important; mix-blend-mode: screen !important; background-color: transparent !important; } ' .
	'/* KIT 1 Hero overrides */ ' .
	'@media (min-width: 768px) { ' .
	'  .elementor-element-40a06f6 { height: auto !important; min-height: auto !important; } ' .
	'  .elementor-element-580cc436 { min-height: calc(100vh - 120px) !important; display: flex !important; flex-direction: column !important; justify-content: center !important; padding-top: 8% !important; padding-bottom: 5% !important; } ' .
	'  .elementor-element-4fc28b13 { aspect-ratio: 1 / 1 !important; height: auto !important; min-height: auto !important; max-height: calc(100vh - 120px) !important; } ' .
	'} ' .
	'@media (max-width: 767px) { ' .
	'  .elementor-element-40a06f6 { height: auto !important; min-height: auto !important; } ' .
	'  .elementor-element-580cc436 { padding: 50px 20px 30px 20px !important; height: auto !important; min-height: auto !important; } ' .
	'  .elementor-element-4fc28b13 { aspect-ratio: 1 / 1 !important; height: auto !important; min-height: auto !important; width: 100% !important; } ' .
	'  .elementor-element-1bc75a32 { display: none !important; } ' .
	'} ' .
	'.elementor-element-41484f27 { object-fit: cover !important; border-radius: 50% !important; } ' .
	'@media (min-width: 768px) { .elementor-element-41484f27 { left: -15% !important; } } ' .
	'/* KIT 1 About & Services overrides */ ' .
	'.elementor-element-6f812967 img { aspect-ratio: 4 / 3 !important; width: 100% !important; height: auto !important; min-height: auto !important; object-fit: cover !important; } ' .
	'.elementor-element-6f812967 { height: auto !important; min-height: auto !important; } ' .
	'@media (max-width: 767px) { .elementor-element-6f812967 { margin-top: 0 !important; margin-bottom: 20px !important; } } ' .
	'@media (min-width: 768px) { ' .
	'  .elementor-element-59b6e6d5 { height: auto !important; min-height: auto !important; } ' .
	'  .elementor-element-42abf8aa { aspect-ratio: 16 / 9 !important; height: auto !important; min-height: auto !important; } ' .
	'} ' .
	'@media (max-width: 767px) { ' .
	'  .elementor-element-42abf8aa { aspect-ratio: 16 / 9 !important; height: auto !important; min-height: auto !important; width: 100% !important; } ' .
	'  .elementor-element-63950d29 { display: none !important; } ' .
	'} ' .
	'/* KIT 1 Testimonials Stretch */ ' .
	'@media (min-width: 768px) { ' .
	'  .elementor-element-331d0ffb { display: flex !important; align-items: stretch !important; } ' .
	'  .elementor-element-6e5c11f9, .elementor-element-75ba3d29 { height: auto !important; align-self: stretch !important; display: flex !important; flex-direction: column !important; } ' .
	'  .elementor-element-6e5c11f9 .elementor-widget-wrap, .elementor-element-75ba3d29 .elementor-widget-wrap { height: 100% !important; display: flex !important; flex-direction: column !important; justify-content: center !important; } ' .
	'} ' .
	'/* KIT 2 Hero overrides */ ' .
	'@media (min-width: 768px) { ' .
	'  .elementor-element-49f8bd39 { height: auto !important; min-height: auto !important; } ' .
	'  .elementor-element-35a4f6fb, .elementor-element-39f1fa01 { aspect-ratio: 1 / 1 !important; height: auto !important; min-height: auto !important; max-height: calc(100vh - 120px) !important; } ' .
	'} ' .
	'@media (max-width: 767px) { ' .
	'  .elementor-element-49f8bd39 { height: auto !important; min-height: auto !important; flex-direction: column !important; } ' .
	'  .elementor-element-35a4f6fb { display: none !important; } ' .
	'  .elementor-element-39f1fa01 { aspect-ratio: 1 / 1 !important; height: auto !important; min-height: auto !important; width: 100% !important; } ' .
	'} ' .
	'/* KIT 2 About & Services */ ' .
	'.elementor-element-4d1645d0 { aspect-ratio: 4 / 3 !important; height: auto !important; min-height: auto !important; } ' .
	'@media (max-width: 767px) { .elementor-element-4d1645d0 { aspect-ratio: auto !important; min-height: 380px !important; padding-top: 40px !important; padding-bottom: 40px !important; } } ' .
	'.elementor-element-51305b21 { aspect-ratio: 16 / 9 !important; height: auto !important; min-height: auto !important; } ' .
	'@media (max-width: 767px) { .elementor-element-51305b21 { aspect-ratio: auto !important; min-height: 380px !important; padding-top: 40px !important; padding-bottom: 40px !important; } } ' .
	'/* KIT 2 CTA Stretch */ ' .
	'.elementor-element-1b226200 { display: flex !important; flex-direction: row !important; justify-content: flex-end !important; align-items: stretch !important; padding-top: 0 !important; padding-bottom: 0 !important; aspect-ratio: 16 / 9 !important; height: auto !important; min-height: auto !important; } ' .
	'.elementor-element-56a3deab { height: 100% !important; min-height: 100% !important; align-self: stretch !important; margin-top: 0 !important; margin-bottom: 0 !important; } ' .
	'@media (max-width: 767px) { .elementor-element-1b226200 { flex-direction: column !important; aspect-ratio: auto !important; min-height: 450px !important; } .elementor-element-7c6a7a2 { position: relative !important; margin: 30px auto 0 auto !important; left: auto !important; transform: none !important; display: block !important; clear: both !important; } }';
update_option('elementor_custom_css', $global_css);
echo "GLOBAL_CSS_SET
";

// Create Must-Use plugin to inject styles dynamically
$mu_dir = WP_CONTENT_DIR . '/mu-plugins';
if (!is_dir($mu_dir)) {
    mkdir($mu_dir, 0755, true);
}
$mu_plugin_code = '<?php
/*
Plugin Name: DigitalScout Custom Layout Fixes
Description: Dynamic layout fixes for Elementor and custom logos.
Version: 1.1
*/
add_action("wp_head", function() {
    ?>
    <style>
    /* Injected layout fixes */
    html, body { overflow-x: hidden !important; max-width: 100vw !important; }
    .elementor-section, .e-container, .elementor-column { max-width: 100% !important; }
    .elementor-widget-theme-site-logo img { mix-blend-mode: multiply !important; height: auto !important; max-height: 85px !important; width: auto !important; }
    .elementor-element-1b226200, .elementor-element-1b226200 .elementor-widget-text-editor, .elementor-element-1b226200 .elementor-widget-text-editor p { color: #E9E8E6 !important; }
    .elementor-element-1b226200 .elementor-widget-text-editor strong { color: #FFFFFF !important; }
    .elementor-element-51305b21 .elementor-background-overlay { background-color: rgba(12, 40, 53, 0.6) !important; opacity: 1 !important; }
    .elementor-element-51305b21::before { content: ""; position: absolute; top: 0; left: 0; right: 0; bottom: 0; background: rgba(12, 40, 53, 0.6) !important; z-index: 0; pointer-events: none; }
    .elementor-element-51305b21 > * { position: relative; z-index: 1; }
    .elementor-element-39f1fa01 .elementor-background-overlay { background-color: rgba(12, 40, 53, 0.45) !important; opacity: 1 !important; }
    .elementor-element-39f1fa01::before { content: ""; position: absolute; top: 0; left: 0; right: 0; bottom: 0; background: rgba(12, 40, 53, 0.45) !important; z-index: 0; pointer-events: none; }
    .elementor-element-39f1fa01 > * { position: relative; z-index: 1; }
    [data-elementor-type="footer"] *, .elementor-element-29c6e791 *, footer *, .site-footer *, .elementor-location-footer * { color: #ffffff !important; }
    [data-elementor-type="footer"] svg, [data-elementor-type="footer"] path, .elementor-element-29c6e791 svg, .elementor-element-29c6e791 path, footer svg, footer path, .site-footer svg, .site-footer path { fill: #ffffff !important; }
    [data-elementor-type="footer"] a:hover, [data-elementor-type="footer"] a:hover *, .elementor-element-29c6e791 a:hover, .elementor-element-29c6e791 a:hover *, footer a:hover, footer a:hover *, .site-footer a:hover, .site-footer a:hover * { color: #ffffff !important; opacity: 0.8 !important; }
    [data-elementor-type="footer"] ::placeholder, .elementor-element-29c6e791 ::placeholder, footer ::placeholder, .site-footer ::placeholder { color: rgba(255, 255, 255, 0.6) !important; }
    
    /* Call to Action Centering & Desktop/Tablet Breakout overrides */
    .elementor-widget-call-to-action .elementor-cta__content { display: flex !important; flex-direction: column !important; align-items: center !important; justify-content: center !important; text-align: center !important; }
    .elementor-widget-call-to-action .elementor-cta__title, .elementor-widget-call-to-action .elementor-cta__description, .elementor-widget-call-to-action .elementor-cta__content * { text-align: center !important; }
    .elementor-widget-call-to-action .elementor-cta__button-wrapper { display: flex !important; justify-content: center !important; width: 100% !important; }
    .elementor-widget-call-to-action .elementor-cta__button { margin: 0 auto !important; display: inline-block !important; }
    
    @media (min-width: 768px) {
        .elementor-widget-call-to-action {
            width: 100vw !important;
            max-width: 100vw !important;
            position: relative !important;
            left: -50vw !important;
            margin-left: 0 !important;
            margin-right: 0 !important;
        }
    }
    
    /* Logo Background Transparency */
    .elementor-element-3b58bec7, .elementor-element-69be47e, .elementor-element-5a62107a, .elementor-element-44b1aa0b, .elementor-element-3b58bec7 .elementor-widget-container, .elementor-element-69be47e .elementor-widget-container, .elementor-element-5a62107a .elementor-widget-container, .elementor-element-44b1aa0b .elementor-widget-container { background-color: transparent !important; background: transparent !important; }
    .elementor-element-3b58bec7 img, .elementor-element-69be47e img, .elementor-widget-theme-site-logo img, .elementor-widget-image img[src*="gen_logo"], header img[src*="gen_logo"], .site-header img[src*="gen_logo"] { mix-blend-mode: multiply !important; background-color: transparent !important; }
    .elementor-element-5a62107a img, .elementor-element-44b1aa0b img, [data-elementor-type="footer"] img[src*="gen_logo"], footer img[src*="gen_logo"], .site-footer img[src*="gen_logo"] { filter: invert(1) !important; mix-blend-mode: screen !important; background-color: transparent !important; }
    
    /* KIT 1 Hero overrides */
    @media (min-width: 768px) {
        .elementor-element-40a06f6 { height: auto !important; min-height: auto !important; }
        .elementor-element-580cc436 { min-height: calc(100vh - 120px) !important; display: flex !important; flex-direction: column !important; justify-content: center !important; padding-top: 8% !important; padding-bottom: 5% !important; }
        .elementor-element-4fc28b13 { aspect-ratio: 1 / 1 !important; height: auto !important; min-height: auto !important; max-height: calc(100vh - 120px) !important; }
    }
    @media (max-width: 767px) {
        .elementor-element-40a06f6 { height: auto !important; min-height: auto !important; }
        .elementor-element-580cc436 { padding: 50px 20px 30px 20px !important; height: auto !important; min-height: auto !important; }
        .elementor-element-4fc28b13 { aspect-ratio: 1 / 1 !important; height: auto !important; min-height: auto !important; width: 100% !important; }
        .elementor-element-1bc75a32 { display: none !important; }
    }
    .elementor-element-41484f27 { object-fit: cover !important; border-radius: 50% !important; }
    @media (min-width: 768px) { .elementor-element-41484f27 { left: -15% !important; } }
    
    /* KIT 1 About & Services overrides */
    .elementor-element-6f812967 img { aspect-ratio: 4 / 3 !important; width: 100% !important; height: auto !important; min-height: auto !important; object-fit: cover !important; }
    .elementor-element-6f812967 { height: auto !important; min-height: auto !important; }
    @media (max-width: 767px) { .elementor-element-6f812967 { margin-top: 0 !important; margin-bottom: 20px !important; } }
    @media (min-width: 768px) {
        .elementor-element-59b6e6d5 { height: auto !important; min-height: auto !important; }
        .elementor-element-42abf8aa { aspect-ratio: 16 / 9 !important; height: auto !important; min-height: auto !important; }
    }
    @media (max-width: 767px) {
        .elementor-element-42abf8aa { aspect-ratio: 16 / 9 !important; height: auto !important; min-height: auto !important; width: 100% !important; }
        .elementor-element-63950d29 { display: none !important; }
    }
    
    /* KIT 1 Testimonials Stretch */
    @media (min-width: 768px) {
        .elementor-element-331d0ffb { display: flex !important; align-items: stretch !important; }
        .elementor-element-6e5c11f9, .elementor-element-75ba3d29 { height: auto !important; align-self: stretch !important; display: flex !important; flex-direction: column !important; }
        .elementor-element-6e5c11f9 .elementor-widget-wrap, .elementor-element-75ba3d29 .elementor-widget-wrap { height: 100% !important; display: flex !important; flex-direction: column !important; justify-content: center !important; }
    }
    
    /* KIT 2 Viewport & Aspect overrides */
    @media (min-width: 768px) {
        .elementor-element-49f8bd39 { height: auto !important; min-height: auto !important; }
        .elementor-element-35a4f6fb, .elementor-element-39f1fa01 { aspect-ratio: 1 / 1 !important; height: auto !important; min-height: auto !important; max-height: calc(100vh - 120px) !important; }
    }
    @media (max-width: 767px) {
        .elementor-element-49f8bd39 { height: auto !important; min-height: auto !important; flex-direction: column !important; }
        .elementor-element-35a4f6fb { display: none !important; }
        .elementor-element-39f1fa01 { aspect-ratio: 1 / 1 !important; height: auto !important; min-height: auto !important; width: 100% !important; }
    }
    .elementor-element-4d1645d0 { aspect-ratio: 4 / 3 !important; height: auto !important; min-height: auto !important; }
    @media (max-width: 767px) { .elementor-element-4d1645d0 { aspect-ratio: auto !important; min-height: 380px !important; padding-top: 40px !important; padding-bottom: 40px !important; } }
    
    .elementor-element-51305b21 { aspect-ratio: 16 / 9 !important; height: auto !important; min-height: auto !important; }
    @media (max-width: 767px) { .elementor-element-51305b21 { aspect-ratio: auto !important; min-height: 380px !important; padding-top: 40px !important; padding-bottom: 40px !important; } }
    
    /* KIT 2 CTA Card Stretch */
    .elementor-element-1b226200 { display: flex !important; flex-direction: row !important; justify-content: flex-end !important; align-items: stretch !important; padding-top: 0 !important; padding-bottom: 0 !important; aspect-ratio: 16 / 9 !important; height: auto !important; min-height: auto !important; }
    .elementor-element-56a3deab { height: 100% !important; min-height: 100% !important; align-self: stretch !important; margin-top: 0 !important; margin-bottom: 0 !important; }
    @media (max-width: 767px) { .elementor-element-1b226200 { flex-direction: column !important; aspect-ratio: auto !important; min-height: 450px !important; } .elementor-element-7c6a7a2 { position: relative !important; margin: 30px auto 0 auto !important; left: auto !important; transform: none !important; display: block !important; clear: both !important; } }
    </style>
    <?php
});';
file_put_contents($mu_dir . '/ds-custom-styles.php', $mu_plugin_code);
echo "MU_PLUGIN_CREATED
";
`;
      const phpB64 = Buffer.from(phpCode).toString("base64");
      await runRemoteShellCommand(
        `echo "${phpB64}" | base64 -d > '${phpScriptTmp}'`,
        logCallback
      );
      await logCallback("Executing remote PHP metadata script...");
      const evalOut = await runWpCommand(
        `eval-file '${phpScriptTmp}' "${homePageId2}" "${homepageJsonTmp}" "${activeKitId}" "${kitJsonTmp}" "${logoAttachmentId}"`,
        docRoot,
        logCallback
      );
      await logCallback(`PHP script output: ${evalOut.stdout}`);
      try {
        await logCallback("Regenerating Elementor CSS files...");
        await runWpCommand(`elementor force-regenerate-css`, docRoot, logCallback);
      } catch (cssErr) {
        await logCallback(`Warning: Failed to regenerate Elementor CSS: ${cssErr.message}`);
      }
      await runRemoteShellCommand(`rm -f '${homepageJsonTmp}' '${kitJsonTmp}' '${phpScriptTmp}'`, logCallback).catch(() => {
      });
      await logCallback("Elementor site injection complete \u2713");
      const contentHash2 = crypto.createHash("sha1").update(mergedJson).digest("hex");
      return {
        renderSource: "elementor-template",
        length: mergedJson.length,
        sha1: contentHash2
      };
    }
    let content = "";
    const requireOpenRouterHtml = (process.env.REQUIRE_OPENROUTER_HTML || "").toLowerCase() === "true";
    const renderSource = schema?._renderSource || (schema?._wordpressHtml ? "openrouter-html" : "local-builder");
    if (typeof schema?._wordpressHtml === "string" && schema._wordpressHtml.trim()) {
      await logCallback(
        "Using OpenRouter-generated WordPress homepage HTML..."
      );
      content = ensureWordPressHtmlBlock(schema._wordpressHtml);
    } else {
      if (requireOpenRouterHtml) {
        throw new Error(
          "OpenRouter HTML is required but was not generated. Check OpenRouter config/quota."
        );
      }
      await logCallback(
        "OpenRouter HTML unavailable. Building homepage with local premium-site-builder..."
      );
      const { buildPremiumPageContent: buildPremiumPageContent2 } = await Promise.resolve().then(() => (init_premium_site_builder(), premium_site_builder_exports));
      content = buildPremiumPageContent2(schema);
    }
    const contentHash = crypto.createHash("sha1").update(content).digest("hex");
    await logCallback(
      `Content source=${renderSource} length=${content.length} sha1=${contentHash}`
    );
    await logCallback(
      `[Provisioning] WordPress Homepage HTML Content:
${content}
`
    );
    const traceId = schema?.meta?.traceId || schema?._validation?.traceId;
    if (traceId) {
      try {
        const traceDir = path4.join(DEBUG_ROOT_DIR, traceId);
        fs5.mkdirSync(traceDir, { recursive: true });
        fs5.writeFileSync(
          path4.join(traceDir, "11-wp-injected.html"),
          content,
          "utf8"
        );
        fs5.writeFileSync(
          path4.join(traceDir, "11-wp-injected-meta.json"),
          JSON.stringify(
            {
              renderSource,
              length: content.length,
              sha1: contentHash,
              injectedAt: (/* @__PURE__ */ new Date()).toISOString()
            },
            null,
            2
          ),
          "utf8"
        );
      } catch (e) {
        await logCallback(
          `Warning: failed to write debug injection artifacts: ${e instanceof Error ? e.message : String(e)}`
        );
      }
    }
    const tmpFile = `/tmp/ds_home_${Date.now()}.html`;
    await logCallback(`Writing to remote temp file: ${tmpFile}`);
    const base64Content = Buffer.from(content).toString("base64");
    await runRemoteShellCommand(
      `echo "${base64Content}" | base64 -d > '${tmpFile}'`,
      logCallback
    );
    await logCallback("Creating Home page in WordPress...");
    const homePageIdOut = await runWpCommand(
      `post create --post_type=page --post_title="Home" --post_content="$(cat '${tmpFile}')" --post_status=publish --format=ids --user="${adminUser}"`,
      docRoot,
      logCallback
    );
    const homePageId = homePageIdOut.stdout.replace(/[^0-9]/g, "").trim();
    await runRemoteShellCommand(`rm -f '${tmpFile}'`, logCallback).catch(
      () => {
      }
    );
    if (!homePageId || homePageId === "0") {
      throw new Error("Home page creation failed \u2014 invalid ID returned");
    }
    await logCallback(
      `Home page created with ID: ${homePageId}. Setting as front page...`
    );
    await runWpCommand(
      `option update show_on_front page`,
      docRoot,
      logCallback
    );
    await runWpCommand(
      `option update page_on_front ${homePageId}`,
      docRoot,
      logCallback
    );
    if (schema.brand?.businessName) {
      await runWpCommand(
        `option update blogname "${esc2(schema.brand.businessName)}"`,
        docRoot,
        logCallback
      );
    }
    await runWpCommand(
      `rewrite structure "/%postname%/"`,
      docRoot,
      logCallback
    );
    await runWpCommand(`rewrite flush`, docRoot, logCallback);
    if (schema.brand?.logo) {
      try {
        await logCallback(`Attempting to import logo: ${schema.brand.logo}`);
        let mediaId = "";
        let imported = false;
        if (schema.brand.logo.includes("/public/generated-images/")) {
          const parts = schema.brand.logo.split("/public/generated-images/");
          const filename = parts[parts.length - 1];
          const localPath = path4.join(process.cwd(), "public", "generated-images", filename);
          if (fs5.existsSync(localPath)) {
            await logCallback(`Detected local generated logo: ${filename}. Copying to remote server...`);
            const ext = filename.toLowerCase().endsWith(".png") ? "png" : "jpg";
            const remoteTmpMedia = `/tmp/ds_logo_${Date.now()}.${ext}`;
            try {
              await copyFileToRemote(localPath, remoteTmpMedia, logCallback);
              const mediaOut = await runWpCommand(
                `media import "${remoteTmpMedia}" --porcelain`,
                docRoot,
                logCallback
              );
              mediaId = mediaOut.stdout.trim();
              if (/^\d+$/.test(mediaId)) {
                imported = true;
              }
            } catch (uploadErr) {
              await logCallback(`Failed to copy/import local logo ${filename}: ${uploadErr.message}. Trying direct fallback...`);
            } finally {
              await runRemoteShellCommand(`rm -f "${remoteTmpMedia}"`, logCallback).catch(() => {
              });
            }
          }
        }
        if (!imported) {
          try {
            const mediaOut = await runWpCommand(
              `media import "${schema.brand.logo}" --porcelain`,
              docRoot,
              logCallback
            );
            mediaId = mediaOut.stdout.trim();
          } catch (e) {
            await logCallback(
              "Direct import failed. Retrying with local temp file..."
            );
            const ext = schema.brand.logo.toLowerCase().includes(".png") ? "png" : "jpg";
            const remoteTmpMedia = `/tmp/ds_logo_${Date.now()}.${ext}`;
            await runRemoteShellCommand(
              `curl -sL -A "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36" "${schema.brand.logo}" -o "${remoteTmpMedia}"`,
              logCallback
            );
            const mediaOut = await runWpCommand(
              `media import "${remoteTmpMedia}" --porcelain`,
              docRoot,
              logCallback
            );
            mediaId = mediaOut.stdout.trim();
            await runRemoteShellCommand(
              `rm -f "${remoteTmpMedia}"`,
              logCallback
            ).catch(() => {
            });
          }
        }
        if (/^\d+$/.test(mediaId)) {
          await logCallback(
            `Logo imported successfully (ID: ${mediaId}). Setting as site icon.`
          );
          await runWpCommand(
            `option update site_icon ${mediaId}`,
            docRoot,
            logCallback
          );
        }
      } catch (e) {
        await logCallback(`Warning: logo import failed: ${e.message}`);
      }
    }
    await logCallback("Premium WordPress site injection complete \u2713");
    try {
      const subdomain = path4.basename(docRoot);
      const rootDomain = process.env.WP_ROOT_DOMAIN || "digiscoutwp.online";
      const siteUrl = `http://${subdomain}.${rootDomain}`;
      if (siteUrl) {
        await logCallback(
          `Fetching final rendered site at ${siteUrl} for debug capture...`
        );
        const resp = await crossFetch2(siteUrl);
        const finalDom = await resp.text().catch(() => "");
        const traceId2 = schema?.meta?.traceId || schema?._validation?.traceId;
        if (traceId2 && finalDom) {
          const traceDir = path4.join(DEBUG_ROOT_DIR, traceId2);
          fs5.mkdirSync(traceDir, { recursive: true });
          fs5.writeFileSync(
            path4.join(traceDir, "12-wp-final-dom.html"),
            finalDom,
            "utf8"
          );
          const stripped = finalDom.replace(/<script[\s\S]*?<\/script>/gi, "").replace(/\sstyle="[^"]*"/gi, "");
          fs5.writeFileSync(
            path4.join(traceDir, "12-wp-final-dom-stripped.html"),
            stripped,
            "utf8"
          );
          const wpMutations = {
            contains_elementor: /elementor/i.test(finalDom),
            contains_wp_blocks: /wp-block/i.test(finalDom),
            theme_injection_detected: /theme|header|footer|site-title/i.test(
              finalDom
            ),
            length: finalDom.length
          };
          fs5.writeFileSync(
            path4.join(traceDir, "12-wp-final-mutations.json"),
            JSON.stringify(wpMutations, null, 2),
            "utf8"
          );
        }
      }
    } catch (e) {
      await logCallback(
        `Warning: failed to fetch/persist final WP DOM: ${e instanceof Error ? e.message : String(e)}`
      );
    }
    return { renderSource, length: content.length, sha1: contentHash };
  } catch (error) {
    await logCallback(
      `CRITICAL ERROR during content injection: ${error.message}`
    );
    throw error;
  }
}
async function rollbackJob(job) {
  await appendLog(job.id, "[ROLLBACK] Starting remote cleanup...");
  const docRootBase = process.env.WP_DOCROOT_BASE || "/home/digigesf/public_html/sites";
  if (job.subdomain) {
    try {
      const rootDomain = process.env.WP_ROOT_DOMAIN || "digiscoutwp.online";
      await deleteSubdomain(job.subdomain, rootDomain);
      await appendLog(
        job.id,
        `[ROLLBACK] Deleted subdomain ${job.subdomain}.${rootDomain}`
      );
    } catch (e) {
      await appendLog(
        job.id,
        `[ROLLBACK] Failed to delete subdomain: ${e.message}`
      );
      await appendLog(
        job.id,
        "[ROLLBACK] Tip: configure CPANEL_DELETE_SUBDOMAIN_CMD if UAPI delete is unavailable."
      );
    }
    const fullDocRoot = `${docRootBase}/${job.subdomain}`;
    try {
      await runRemoteShellCommand(
        `rm -rf "${fullDocRoot}"`,
        (log) => appendLog(job.id, log)
      );
      await appendLog(
        job.id,
        `[ROLLBACK] Deleted remote directory: ${fullDocRoot}`
      );
    } catch (e) {
      await appendLog(
        job.id,
        `[ROLLBACK] Failed to delete remote directory: ${e.message}`
      );
    }
  }
  if (job.db_name) {
    try {
      await deleteDatabase(job.db_name);
      await appendLog(
        job.id,
        `[ROLLBACK] Deleted remote database: ${job.db_name}`
      );
    } catch (e) {
      await appendLog(
        job.id,
        `[ROLLBACK] Failed to delete database: ${e.message}`
      );
    }
  }
  if (job.db_user) {
    try {
      await deleteDatabaseUser(job.db_user);
      await appendLog(
        job.id,
        `[ROLLBACK] Deleted remote DB user: ${job.db_user}`
      );
    } catch (e) {
      await appendLog(
        job.id,
        `[ROLLBACK] Failed to delete DB user: ${e.message}`
      );
    }
  }
  await appendLog(job.id, "[ROLLBACK] Remote cleanup finished.");
}
function extractSubdomainFromUrl(subdomainUrl) {
  if (!subdomainUrl) return null;
  try {
    let hostname = subdomainUrl;
    if (hostname.includes("://")) {
      hostname = hostname.split("://")[1];
    }
    hostname = hostname.split("/")[0];
    const parts = hostname.split(".");
    if (parts.length >= 3) {
      return parts[0];
    }
    return null;
  } catch (e) {
    return null;
  }
}
async function deleteProvisionedWordPressSite(projectId) {
  console.log(
    `[Cleanup] Starting comprehensive remote deletion for project ${projectId}`
  );
  let subdomainFromDeployment = null;
  try {
    const [deployments] = await pool.query(
      `SELECT subdomain_url FROM isolated_deployments WHERE project_id = ?`,
      [projectId]
    );
    if (deployments && deployments.length > 0 && deployments[0].subdomain_url) {
      subdomainFromDeployment = extractSubdomainFromUrl(deployments[0].subdomain_url);
    }
  } catch (err) {
    console.error(`[Cleanup] Error querying isolated_deployments: ${err.message}`);
  }
  const [rows] = await pool.query(
    `SELECT * FROM provisioning_jobs WHERE project_id = ?`,
    [projectId]
  );
  if (!rows || rows.length === 0) {
    console.warn(
      `[Cleanup] No provisioning job found in DB for project ${projectId}. Attempting database-only purge.`
    );
    if (subdomainFromDeployment) {
      console.log(`[Cleanup] Found subdomain "${subdomainFromDeployment}" from deployment. Attempting file rollback without job record.`);
      try {
        await rollbackJob({ subdomain: subdomainFromDeployment });
      } catch (e) {
        console.error(`[Cleanup] Remote directory cleanup failed: ${e.message}`);
      }
    }
    await pool.query(`DELETE FROM isolated_deployments WHERE project_id = ?`, [projectId]);
    await pool.query(`DELETE FROM provisioning_jobs WHERE project_id = ?`, [projectId]);
    await pool.query(`DELETE FROM lead_ai_messages WHERE lead_id = ?`, [projectId]);
    return;
  }
  for (const job of rows) {
    try {
      if (!job.subdomain && subdomainFromDeployment) {
        job.subdomain = subdomainFromDeployment;
      }
      if (job.trace_id) {
        await pool.query(`DELETE FROM generation_audit_logs WHERE trace_id = ?`, [
          job.trace_id
        ]).catch(() => {
        });
      }
      await rollbackJob(job);
    } catch (e) {
      console.error(
        `[Cleanup] Rollback failed for job ${job.id}: ${e.message}`
      );
    }
  }
  try {
    await pool.query(
      `DELETE FROM isolated_deployments WHERE project_id = ?`,
      [projectId]
    );
    await pool.query(
      `DELETE FROM provisioning_jobs WHERE project_id = ?`,
      [projectId]
    );
    await pool.query(
      `DELETE FROM lead_ai_messages WHERE lead_id = ?`,
      [projectId]
    );
    console.log(`[Cleanup] Project ${projectId} and associated rows purged from local DB.`);
  } catch (e) {
    console.error(
      `[Cleanup] Failed to purge project ${projectId} from local DB: ${e.message}`
    );
    throw e;
  }
  console.log(
    `[Cleanup] Project ${projectId} remote resources and local records fully processed.`
  );
}

// src/lib/provisioning-worker.ts
var POLL_INTERVAL_MS = 5e3;
var isWorkerRunning = false;
async function startProvisioningWorker() {
  if (isWorkerRunning) return;
  isWorkerRunning = true;
  console.log("[Worker] Provisioning worker started.");
  setInterval(async () => {
    try {
      await pollQueue();
    } catch (error) {
      console.error("[Worker] Error in poll loop:", error);
    }
  }, POLL_INTERVAL_MS);
}
async function pollQueue() {
  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();
    const [rows] = await connection.query(`
			SELECT id FROM provisioning_jobs 
			WHERE status NOT IN ('completed', 'failed', 'lead') 
			  AND (locked_at IS NULL OR locked_at < DATE_SUB(NOW(), INTERVAL 10 MINUTE))
			ORDER BY created_at ASC 
			LIMIT 1
			FOR UPDATE SKIP LOCKED
		`);
    if (!rows || rows.length === 0) {
      await connection.commit();
      return;
    }
    const jobId = rows[0].id;
    await connection.query(`UPDATE provisioning_jobs SET locked_at = NOW() WHERE id = ?`, [jobId]);
    await connection.commit();
    console.log(`[Worker] Picked up job ${jobId}`);
    await processJob(jobId);
  } catch (error) {
    await connection.rollback();
    console.error("[Worker] Transaction error:", error);
  } finally {
    connection.release();
  }
}

// server.ts
init_direct_vertex_homepage_generation();

// src/lib/search-keyword-expander.ts
var MODEL_ID = "gemini-3.1-flash-lite";
var VERTEX_API_ENDPOINT = "aiplatform.googleapis.com";
var CACHE_TTL_MS = 6 * 60 * 60 * 1e3;
var REQUEST_TIMEOUT_MS = 15e3;
var MAX_KEYWORDS = 15;
var keywordCache = /* @__PURE__ */ new Map();
var inflightRequests = /* @__PURE__ */ new Map();
var GEO_TERMS = /* @__PURE__ */ new Set([
  "near",
  "nearby",
  "city",
  "county",
  "metro",
  "metropolitan",
  "suburb",
  "suburban",
  "downtown",
  "uptown",
  "houston",
  "austin",
  "dallas",
  "san antonio",
  "texas",
  "tx",
  "tx."
]);
function normalize(text) {
  return text.toLowerCase().replace(/[^a-z0-9\s-]/g, " ").replace(/\s+/g, " ").trim();
}
function stripCodeFences(text) {
  return text.trim().replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/i, "");
}
function extractJsonArray(text) {
  const cleaned = stripCodeFences(text);
  try {
    const parsed = JSON.parse(cleaned);
    if (Array.isArray(parsed)) return parsed;
    if (parsed && Array.isArray(parsed.keywords)) {
      return parsed.keywords;
    }
  } catch {
  }
  const arrayMatch = cleaned.match(/\[[\s\S]*\]/);
  if (!arrayMatch) return [];
  try {
    const parsed = JSON.parse(arrayMatch[0]);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}
function sanitizeKeywords(rawKeywords, category, city) {
  const normalizedCategory = normalize(category);
  const normalizedCity = normalize(city);
  const cityTokens = normalizedCity.split(" ").filter(Boolean);
  const filtered = /* @__PURE__ */ new Set();
  for (const rawKeyword of rawKeywords) {
    if (typeof rawKeyword !== "string") continue;
    const keyword = rawKeyword.replace(/[\r\n\t]+/g, " ").replace(/^[-•*\d.\s]+/, "").trim();
    if (!keyword) continue;
    const normalizedKeyword = normalize(keyword);
    if (!normalizedKeyword) continue;
    if (normalizedKeyword.length < 3) continue;
    if (normalizedKeyword.length > 80) continue;
    if (normalizedKeyword === normalizedCategory) continue;
    if (normalizedKeyword.includes(normalizedCity)) continue;
    if (cityTokens.some((token) => token && normalizedKeyword.includes(token))) {
      continue;
    }
    if ([...GEO_TERMS].some((term) => normalizedKeyword.includes(term))) {
      continue;
    }
    filtered.add(keyword);
  }
  const deduped = Array.from(filtered.values());
  if (!deduped.includes(category)) {
    deduped.unshift(category);
  }
  return deduped.slice(0, MAX_KEYWORDS);
}
async function fetchVertexKeywords(category, city, attempt) {
  const apiKey = process.env.GOOGLE_CLOUD_API_KEY;
  if (!apiKey) {
    throw new Error("GOOGLE_CLOUD_API_KEY is not configured");
  }
  const prompt = [
    "You generate Google Places Text Search keyword expansions for local business discovery.",
    "Return JSON only as an array of strings.",
    "Generate 10 to 15 high-quality search phrases that are semantically related to the business category.",
    "Include industry aliases, service synonyms, contractor variations, and closely related service phrases.",
    "Do not include city names, suburbs, metro areas, neighborhoods, or geographic terms.",
    "Do not include duplicates, numbering, bullets, explanations, or markdown.",
    "Keep each phrase concise, natural, and suitable for Google Places Text Search.",
    `Category: ${category}`,
    `City context: ${city}`,
    "Output only the JSON array."
  ].join("\n");
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);
  try {
    const url = `https://${VERTEX_API_ENDPOINT}/v1/publishers/google/models/${MODEL_ID}:streamGenerateContent?key=${encodeURIComponent(apiKey)}`;
    const response = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      signal: controller.signal,
      body: JSON.stringify({
        contents: [
          {
            role: "user",
            parts: [{ text: prompt }]
          }
        ],
        generationConfig: {
          temperature: 0.2,
          maxOutputTokens: 256,
          responseMimeType: "application/json"
        },
        safetySettings: [
          { category: "HARM_CATEGORY_HATE_SPEECH", threshold: "OFF" },
          { category: "HARM_CATEGORY_DANGEROUS_CONTENT", threshold: "OFF" },
          { category: "HARM_CATEGORY_SEXUALLY_EXPLICIT", threshold: "OFF" },
          { category: "HARM_CATEGORY_HARASSMENT", threshold: "OFF" }
        ]
      })
    });
    if (!response.ok) {
      const errorText = await response.text().catch(() => "");
      throw new Error(
        `Vertex keyword generation failed (${response.status}): ${errorText}`
      );
    }
    const data = await response.json();
    const text = Array.isArray(data) ? data.map(
      (chunk) => chunk?.candidates?.[0]?.content?.parts?.[0]?.text || ""
    ).join("") : data?.candidates?.[0]?.content?.parts?.[0]?.text || "";
    console.log(`

=== [Vertex] RAW TEXT RESPONSE ===
${text}
==================================

`);
    if (!text) {
      throw new Error("Vertex returned an empty keyword payload");
    }
    const parsed = extractJsonArray(text);
    const keywords = sanitizeKeywords(parsed, category, city);
    if (keywords.length === 0) {
      throw new Error("Vertex returned no valid keywords");
    }
    return { keywords, rawKeywords: parsed, rawText: text };
  } finally {
    clearTimeout(timeoutId);
  }
}
async function generateSearchKeywords(category, city) {
  const normalizedCategory = normalize(category);
  const cacheKey = normalizedCategory;
  const cached = keywordCache.get(cacheKey);
  if (cached && cached.expiresAt > Date.now()) {
    return { keywords: cached.keywords, rawKeywords: cached.keywords, rawText: "" };
  }
  const existing = inflightRequests.get(cacheKey);
  if (existing) {
    return await existing;
  }
  const request = (async () => {
    let lastError;
    for (let attempt = 0; attempt < 3; attempt += 1) {
      try {
        const result = await fetchVertexKeywords(category, city, attempt);
        const keywords = result.keywords;
        keywordCache.set(cacheKey, {
          keywords,
          expiresAt: Date.now() + CACHE_TTL_MS
        });
        return result;
      } catch (error) {
        lastError = error;
        if (attempt < 2) {
          await new Promise(
            (resolve) => setTimeout(resolve, 400 * (attempt + 1))
          );
        }
      }
    }
    const fallback = [category].filter(Boolean);
    if (fallback.length > 0) {
      const errorMsg = lastError instanceof Error ? lastError.message : String(lastError);
      return { keywords: fallback, rawKeywords: fallback, rawText: `ERROR TRIGGERED FALLBACK: ${errorMsg}` };
    }
    throw lastError instanceof Error ? lastError : new Error("Failed to generate search keywords");
  })();
  inflightRequests.set(cacheKey, request);
  try {
    return await request;
  } finally {
    inflightRequests.delete(cacheKey);
  }
}

// src/lib/mailer.ts
import nodemailer from "nodemailer";
import fs6 from "fs";
import path5 from "path";
function logEmailLocally(to, subject, body) {
  const logDir = path5.join(process.cwd(), ".debug-generation");
  if (!fs6.existsSync(logDir)) {
    fs6.mkdirSync(logDir, { recursive: true });
  }
  const logPath = path5.join(logDir, "sent_emails.log");
  const entry = `[${(/* @__PURE__ */ new Date()).toISOString()}] To: ${to}
Subject: ${subject}
Body:
${body}
==================================================

`;
  fs6.appendFileSync(logPath, entry, "utf8");
  console.log(`[Mailer] Simulated email saved to ${logPath}`);
  console.log(`[Mailer] --- simulated email to ${to} ---`);
  console.log(`Subject: ${subject}`);
  console.log(body);
  console.log(`[Mailer] ---------------------------------`);
}
async function sendEmail({
  to,
  subject,
  text,
  html
}) {
  const host = process.env.SMTP_HOST;
  const port = parseInt(process.env.SMTP_PORT || "587", 10);
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;
  const from = process.env.SMTP_FROM || `"DigitalScout" <noreply@digiscout.online>`;
  if (!host || !user || !pass) {
    console.warn(`[Mailer] SMTP credentials missing in env. Simulating email send.`);
    logEmailLocally(to, subject, text || html || "");
    return { success: true, simulated: true };
  }
  try {
    const transporter = nodemailer.createTransport({
      host,
      port,
      secure: port === 465,
      // true for 465, false for other ports
      auth: {
        user,
        pass
      }
    });
    const info = await transporter.sendMail({
      from,
      to,
      subject,
      text,
      html: html || text
    });
    console.log(`[Mailer] Email sent: ${info.messageId}`);
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error(`[Mailer] Failed to send email via SMTP:`, error);
    logEmailLocally(to, subject, text || html || "");
    return { success: false, error: error instanceof Error ? error.message : String(error) };
  }
}
async function sendOTPEmail(email, otp) {
  const subject = `Your DigitalScout Verification Code: ${otp}`;
  const text = `Hello,

Your verification code is: ${otp}

Please enter this code on the verification screen to complete your registration. This code will expire in 15 minutes.

Best regards,
The DigitalScout Team`;
  const html = `
<div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e2e8f0; border-radius: 12px; background-color: #ffffff;">
	<h2 style="color: #6366f1; margin-bottom: 24px;">Verify Your Email Address</h2>
	<p>Hello,</p>
	<p>Thank you for signing up with DigitalScout! To complete your registration, please use the following verification code:</p>
	<div style="font-size: 32px; font-weight: bold; letter-spacing: 4px; color: #1e1b4b; background-color: #f1f5f9; padding: 16px; border-radius: 8px; text-align: center; margin: 24px 0;">
		${otp}
	</div>
	<p style="color: #64748b; font-size: 14px;">This code will expire in 15 minutes. If you did not request this email, you can safely ignore it.</p>
	<hr style="border: 0; border-top: 1px solid #e2e8f0; margin: 24px 0;" />
	<p style="color: #94a3b8; font-size: 12px;">\xA9 ${(/* @__PURE__ */ new Date()).getFullYear()} DigitalScout. All rights reserved.</p>
</div>
	`;
  return sendEmail({ to: email, subject, text, html });
}
async function sendResetPasswordEmail(email, resetLink) {
  const subject = `Reset Your DigitalScout Password`;
  const text = `Hello,

We received a request to reset your password. You can reset it using the following link:

${resetLink}

This link will expire in 1 hour. If you did not request this, please ignore this email.

Best regards,
The DigitalScout Team`;
  const html = `
<div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e2e8f0; border-radius: 12px; background-color: #ffffff;">
	<h2 style="color: #6366f1; margin-bottom: 24px;">Reset Your Password</h2>
	<p>Hello,</p>
	<p>We received a request to reset your password for your DigitalScout account. Click the button below to reset it:</p>
	<div style="text-align: center; margin: 32px 0;">
		<a href="${resetLink}" style="background-color: #6366f1; color: #ffffff; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold; display: inline-block;">Reset Password</a>
	</div>
	<p>Or copy and paste this URL into your browser:</p>
	<p style="word-break: break-all; color: #6366f1; font-size: 14px;">${resetLink}</p>
	<p style="color: #64748b; font-size: 14px; margin-top: 24px;">This link will expire in 1 hour. If you did not request this, you can safely ignore this email.</p>
	<hr style="border: 0; border-top: 1px solid #e2e8f0; margin: 24px 0;" />
	<p style="color: #94a3b8; font-size: 12px;">\xA9 ${(/* @__PURE__ */ new Date()).getFullYear()} DigitalScout. All rights reserved.</p>
</div>
	`;
  return sendEmail({ to: email, subject, text, html });
}

// server.ts
fs7.writeSync(
  2,
  `[BOOT] Server process starting at ${(/* @__PURE__ */ new Date()).toISOString()}
`
);
fs7.writeSync(2, `[BOOT] CWD: ${process.cwd()}
`);
fs7.writeSync(2, `[BOOT] DB_USER: ${process.env.DB_USER || "NOT SET"}
`);
var __filename2 = fileURLToPath2(import.meta.url);
var __dirname2 = dirname(__filename2);
var GoogleGenerativeAI = null;
var app = express();
var PORT = process.env.PORT || 5001;
var logStderr = (message) => {
  fs7.writeSync(2, `${message}
`);
};
var lastGeminiCallTime = 0;
var geminiQueueChain = Promise.resolve();
async function throttleGemini() {
  const currentQueue = geminiQueueChain;
  let resolveLock;
  const lockPromise = new Promise((resolve) => {
    resolveLock = resolve;
  });
  geminiQueueChain = lockPromise;
  await currentQueue;
  const now = Date.now();
  const elapsed = now - lastGeminiCallTime;
  if (elapsed < 1e3) {
    const waitTime = 1e3 - elapsed;
    logStderr(
      `[Gemini Throttle] Queue waiting ${waitTime}ms to maintain 1s gap...`
    );
    await new Promise((resolve) => setTimeout(resolve, waitTime));
  }
  lastGeminiCallTime = Date.now();
  resolveLock();
}
app.use(
  cors({
    origin: true,
    // reflect request origin — allows any origin with credentials
    credentials: true,
    allowedHeaders: [
      "Content-Type",
      "Authorization",
      "x-debug-generation-id",
      "x-debug-generation-fallback"
    ],
    exposedHeaders: ["x-debug-generation-id", "x-debug-generation-fallback"],
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"]
  })
);
app.use(express.json({ limit: "50mb" }));
var publicDir = path6.join(process.cwd(), "public");
var imagesDir = path6.join(publicDir, "generated-images");
if (!fs7.existsSync(publicDir)) {
  fs7.mkdirSync(publicDir, { recursive: true });
}
if (!fs7.existsSync(imagesDir)) {
  fs7.mkdirSync(imagesDir, { recursive: true });
}
app.use("/public", express.static(publicDir));
var JWT_SECRET = process.env.ENCRYPTION_KEY || "default-secret-key-12345";
function hashPassword(password) {
  const salt = crypto2.randomBytes(16).toString("hex");
  const hash = crypto2.scryptSync(password, salt, 64).toString("hex");
  return `${salt}:${hash}`;
}
function verifyPassword(password, storedHash) {
  try {
    const [salt, hash] = storedHash.split(":");
    if (!salt || !hash) return false;
    const verifyHash = crypto2.scryptSync(password, salt, 64).toString("hex");
    return crypto2.timingSafeEqual(
      Buffer.from(hash, "hex"),
      Buffer.from(verifyHash, "hex")
    );
  } catch {
    return false;
  }
}
function generateToken(payload) {
  const header = Buffer.from(
    JSON.stringify({ alg: "HS256", typ: "JWT" })
  ).toString("base64url");
  const body = Buffer.from(
    JSON.stringify({
      ...payload,
      exp: Math.floor(Date.now() / 1e3) + 7 * 24 * 60 * 60
    })
  ).toString("base64url");
  const signature = crypto2.createHmac("sha256", JWT_SECRET).update(`${header}.${body}`).digest("base64url");
  return `${header}.${body}.${signature}`;
}
function verifyToken(token) {
  try {
    const [header, body, signature] = token.split(".");
    if (!header || !body || !signature) return null;
    const expectedSignature = crypto2.createHmac("sha256", JWT_SECRET).update(`${header}.${body}`).digest("base64url");
    if (signature !== expectedSignature) return null;
    const payload = JSON.parse(Buffer.from(body, "base64url").toString("utf8"));
    if (payload.exp && Date.now() / 1e3 > payload.exp) return null;
    return payload;
  } catch {
    return null;
  }
}
async function authenticateToken(req, res, next) {
  const authHeader = req.headers["authorization"];
  const token = authHeader && authHeader.split(" ")[1];
  if (!token) {
    return res.status(401).json({ error: "Access token required" });
  }
  const decoded = verifyToken(token);
  if (!decoded) {
    return res.status(403).json({ error: "Invalid or expired token" });
  }
  try {
    const [users] = await pool.query(
      "SELECT id, name, email, is_verified FROM users WHERE id = ? LIMIT 1",
      [decoded.userId]
    );
    if (!users || users.length === 0) {
      return res.status(403).json({ error: "User not found" });
    }
    if (!users[0].is_verified) {
      return res.status(403).json({ error: "User email not verified" });
    }
    req.user = {
      id: users[0].id,
      name: users[0].name,
      email: users[0].email
    };
    next();
  } catch (error) {
    return res.status(500).json({ error: "Authentication failed" });
  }
}
app.get("/", (req, res) => {
  res.send("DigitalScout API Running");
});
app.get("/api/debug-logs", async (req, res) => {
  try {
    const results = {};
    const pathsToTry = [
      path6.join(process.cwd(), "stderr.log"),
      path6.join(process.cwd(), "passenger.log"),
      path6.join(process.cwd(), "error.log"),
      path6.join(process.cwd(), "..", "stderr.log"),
      path6.join(process.cwd(), "..", "passenger.log"),
      "/home/digimvyc/public_html/stderr.log",
      "/home/digimvyc/stderr.log",
      "/home/digimvyc/api.digiscout.online/stderr.log",
      "/home/digigesf/public_html/stderr.log",
      "/home/digigesf/stderr.log"
    ];
    try {
      results.cwd = process.cwd();
      results.files = fs7.readdirSync(process.cwd());
      const parent = path6.join(process.cwd(), "..");
      results.parent = parent;
      results.parentFiles = fs7.readdirSync(parent);
    } catch (dirErr) {
      results.dirError = dirErr.message;
    }
    for (const p of pathsToTry) {
      if (fs7.existsSync(p)) {
        try {
          const content = fs7.readFileSync(p, "utf8");
          results[p] = content.substring(Math.max(0, content.length - 15e3));
        } catch (fileErr) {
          results[p] = `Error reading: ${fileErr.message}`;
        }
      } else {
        results[p] = "Not found";
      }
    }
    return res.json(results);
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});
app.post("/api/auth/register", async (req, res) => {
  try {
    const { name, email, password } = req.body;
    if (!name || !email || !password) {
      return res.status(400).json({ error: "Missing required fields: name, email, password" });
    }
    const [existing] = await pool.query(
      "SELECT id, is_verified FROM users WHERE email = ? LIMIT 1",
      [email]
    );
    let userId = crypto2.randomUUID();
    const passwordHash = hashPassword(password);
    if (existing && existing.length > 0) {
      if (existing[0].is_verified) {
        return res.status(400).json({ error: "Email already registered" });
      }
      userId = existing[0].id;
      await pool.query(
        "UPDATE users SET name = ?, password_hash = ? WHERE id = ?",
        [name, passwordHash, userId]
      );
    } else {
      await pool.query(
        "INSERT INTO users (id, name, email, password_hash, is_verified) VALUES (?, ?, ?, ?, 0)",
        [userId, name, email, passwordHash]
      );
    }
    const otp = Math.floor(1e5 + Math.random() * 9e5).toString();
    const expiresAt = new Date(Date.now() + 15 * 60 * 1e3);
    await pool.query("DELETE FROM otp_verifications WHERE email = ?", [email]);
    await pool.query(
      "INSERT INTO otp_verifications (email, otp_code, expires_at) VALUES (?, ?, ?)",
      [email, otp, expiresAt]
    );
    await sendOTPEmail(email, otp);
    return res.json({ success: true, message: "OTP sent to email" });
  } catch (error) {
    console.error("[Register] Error:", error);
    return res.status(500).json({ error: "Failed to register user" });
  }
});
app.post("/api/auth/verify-otp", async (req, res) => {
  try {
    const { email, otp } = req.body;
    if (!email || !otp) {
      return res.status(400).json({ error: "Missing email or otp" });
    }
    const [verifications] = await pool.query(
      "SELECT id FROM otp_verifications WHERE email = ? AND otp_code = ? AND expires_at > NOW() LIMIT 1",
      [email, otp]
    );
    if (!verifications || verifications.length === 0) {
      return res.status(400).json({ error: "Invalid or expired verification code" });
    }
    await pool.query("UPDATE users SET is_verified = 1 WHERE email = ?", [
      email
    ]);
    await pool.query("DELETE FROM otp_verifications WHERE email = ?", [email]);
    const [users] = await pool.query(
      "SELECT id, name, email FROM users WHERE email = ? LIMIT 1",
      [email]
    );
    const user = users[0];
    const token = generateToken({ userId: user.id });
    return res.json({
      success: true,
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email
      }
    });
  } catch (error) {
    console.error("[Verify OTP] Error:", error);
    return res.status(500).json({ error: "Failed to verify code" });
  }
});
app.post("/api/auth/resend-otp", async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) {
      return res.status(400).json({ error: "Missing email" });
    }
    const [users] = await pool.query(
      "SELECT id, is_verified FROM users WHERE email = ? LIMIT 1",
      [email]
    );
    if (!users || users.length === 0) {
      return res.status(404).json({ error: "User not found" });
    }
    if (users[0].is_verified) {
      return res.status(400).json({ error: "Email is already verified" });
    }
    const otp = Math.floor(1e5 + Math.random() * 9e5).toString();
    const expiresAt = new Date(Date.now() + 15 * 60 * 1e3);
    await pool.query("DELETE FROM otp_verifications WHERE email = ?", [email]);
    await pool.query(
      "INSERT INTO otp_verifications (email, otp_code, expires_at) VALUES (?, ?, ?)",
      [email, otp, expiresAt]
    );
    await sendOTPEmail(email, otp);
    return res.json({ success: true, message: "OTP resent successfully" });
  } catch (error) {
    console.error("[Resend OTP] Error:", error);
    return res.status(500).json({ error: "Failed to resend code" });
  }
});
app.post("/api/auth/login", async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ error: "Missing email or password" });
    }
    const [users] = await pool.query(
      "SELECT id, name, email, password_hash, is_verified FROM users WHERE email = ? LIMIT 1",
      [email]
    );
    if (!users || users.length === 0) {
      return res.status(400).json({ error: "Invalid email or password" });
    }
    const user = users[0];
    if (!user.is_verified) {
      return res.status(403).json({
        status: "unverified",
        error: "Please verify your email address to log in.",
        email: user.email
      });
    }
    const isMatch = verifyPassword(password, user.password_hash);
    if (!isMatch) {
      return res.status(400).json({ error: "Invalid email or password" });
    }
    const token = generateToken({ userId: user.id });
    return res.json({
      success: true,
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email
      }
    });
  } catch (error) {
    console.error("[Login] Error:", error);
    return res.status(500).json({ error: "Failed to log in" });
  }
});
app.post("/api/auth/forgot-password", async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) {
      return res.status(400).json({ error: "Missing email" });
    }
    const [users] = await pool.query(
      "SELECT id, name FROM users WHERE email = ? LIMIT 1",
      [email]
    );
    if (!users || users.length === 0) {
      return res.json({
        success: true,
        message: "If this email is registered, a password reset link has been sent"
      });
    }
    const token = crypto2.randomBytes(32).toString("hex");
    const expiresAt = new Date(Date.now() + 60 * 60 * 1e3);
    await pool.query("DELETE FROM password_resets WHERE email = ?", [email]);
    await pool.query(
      "INSERT INTO password_resets (email, token, expires_at) VALUES (?, ?, ?)",
      [email, token, expiresAt]
    );
    const origin = req.headers.origin || "http://localhost:3000";
    const resetLink = `${origin}/?reset_token=${token}`;
    await sendResetPasswordEmail(email, resetLink);
    return res.json({
      success: true,
      message: "If this email is registered, a password reset link has been sent"
    });
  } catch (error) {
    console.error("[Forgot Password] Error:", error);
    return res.status(500).json({ error: "Failed to generate password reset request" });
  }
});
app.post("/api/auth/reset-password", async (req, res) => {
  try {
    const { token, password } = req.body;
    if (!token || !password) {
      return res.status(400).json({ error: "Missing token or password" });
    }
    const [resets] = await pool.query(
      "SELECT email FROM password_resets WHERE token = ? AND expires_at > NOW() LIMIT 1",
      [token]
    );
    if (!resets || resets.length === 0) {
      return res.status(400).json({ error: "Invalid or expired password reset token" });
    }
    const email = resets[0].email;
    const passwordHash = hashPassword(password);
    await pool.query("UPDATE users SET password_hash = ? WHERE email = ?", [
      passwordHash,
      email
    ]);
    await pool.query("DELETE FROM password_resets WHERE token = ?", [token]);
    return res.json({
      success: true,
      message: "Password updated successfully"
    });
  } catch (error) {
    console.error("[Reset Password] Error:", error);
    return res.status(500).json({ error: "Failed to reset password" });
  }
});
app.get("/api/auth/me", async (req, res) => {
  const authHeader = req.headers["authorization"];
  const token = authHeader && authHeader.split(" ")[1];
  if (!token) {
    return res.status(401).json({ error: "Access token required" });
  }
  const decoded = verifyToken(token);
  if (!decoded) {
    return res.status(403).json({ error: "Invalid or expired token" });
  }
  try {
    const [users] = await pool.query(
      "SELECT id, name, email, is_verified FROM users WHERE id = ? LIMIT 1",
      [decoded.userId]
    );
    if (!users || users.length === 0 || !users[0].is_verified) {
      return res.status(403).json({ error: "User not found or unverified" });
    }
    return res.json({
      success: true,
      user: {
        id: users[0].id,
        name: users[0].name,
        email: users[0].email
      }
    });
  } catch (error) {
    return res.status(500).json({ error: "Database query failed" });
  }
});
var DEBUG_ROOT_DIR2 = path6.join(process.cwd(), ".debug-generation");
var generationDebugSessions = /* @__PURE__ */ new Map();
function slugifyDebugSegment(value) {
  return (value || "generation").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
}
function createGenerationTraceId(business) {
  const timestamp = (/* @__PURE__ */ new Date()).toISOString().slice(0, 19).replace(/:/g, "-");
  const businessSlug = slugifyDebugSegment(
    business?.name || business?.businessName || business?.id || "site"
  );
  return `${timestamp}-${businessSlug}`;
}
function createGenerationDebugSession(business) {
  const traceId = createGenerationTraceId(business);
  let folderName = traceId;
  let folderPath = path6.join(DEBUG_ROOT_DIR2, folderName);
  let suffix = 2;
  while (fs7.existsSync(folderPath)) {
    folderName = `${traceId}-${suffix}`;
    folderPath = path6.join(DEBUG_ROOT_DIR2, folderName);
    suffix += 1;
  }
  fs7.mkdirSync(folderPath, { recursive: true });
  const session = {
    traceId,
    folderName,
    folderPath,
    createdAt: (/* @__PURE__ */ new Date()).toISOString(),
    businessName: business?.name || "Unknown Business",
    businessCategory: business?.category || "Unknown Category",
    parseRepairs: [],
    malformedSections: [],
    warnings: [],
    errors: [],
    rendererWarnings: [],
    sectionTypes: []
  };
  generationDebugSessions.set(traceId, session);
  return session;
}
function getGenerationDebugSession(traceId) {
  return generationDebugSessions.get(traceId);
}
function formatDebugPayload(content) {
  if (typeof content === "string") return content;
  return JSON.stringify(content, null, 2);
}
function persistGenerationDebugFile(session, fileName, content, append = false) {
  fs7.mkdirSync(session.folderPath, { recursive: true });
  const targetPath = path6.join(session.folderPath, fileName);
  const payload = formatDebugPayload(content);
  if (append && fs7.existsSync(targetPath)) {
    fs7.appendFileSync(targetPath, `${payload}
`, "utf8");
    return;
  }
  fs7.writeFileSync(targetPath, payload, "utf8");
}
function getLatestApiKeyFromDisk(keyName = "GEMINI_API_KEY") {
  const key = process.env.GEMINI_API_KEY || process.env.GOOGLE_CLOUD_API_KEY;
  if (!key) {
    throw new Error(
      `Missing Gemini API Key. Please provide GEMINI_API_KEY or GOOGLE_CLOUD_API_KEY in your environment.`
    );
  }
  return key;
}
async function getSDKGenAI() {
  const key = getLatestApiKeyFromDisk();
  console.log(
    `[AI Chat] getSDKGenAI runtime lookup key:`,
    key ? `${key.substring(0, 10)}...` : "NOT FOUND"
  );
  if (!key) return null;
  if (!GoogleGenerativeAI) {
    try {
      const mod = await import("@google/generative-ai");
      GoogleGenerativeAI = mod.GoogleGenerativeAI;
    } catch (e) {
      console.error("[Gemini] SDK package @google/generative-ai not found.");
      return null;
    }
  }
  return new GoogleGenerativeAI(key);
}
var GENAI_KEY2 = process.env.GEMINI_API_KEY || process.env.GENAI_KEY;
var CALLHIPPO_API_KEY = process.env.CALLHIPPO_API_KEY;
var NETLIFY_TOKEN = process.env.VITE_NETLIFY_TOKEN || process.env.NETLIFY_TOKEN;
var WEBSITE_GENERATION_MODE = process.env.WEBSITE_GENERATION_MODE || "gemini";
function extractEmails(html) {
  const emailPattern = /[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/gi;
  return Array.from(new Set(html.match(emailPattern) || [])).slice(0, 3);
}
function extractPhones(html) {
  const phonePattern = /(?:\+?\d{1,3}[\s.-]?)?(?:\(?\d{3}\)?[\s.-]?)?\d{3}[\s.-]?\d{4}/g;
  return Array.from(new Set(html.match(phonePattern) || [])).slice(0, 3);
}
function extractImages(html) {
  const imagePattern = /<meta[^>]+property=["']og:image["'][^>]+content=["']([^"']+)["']/gi;
  const matches = [];
  let match;
  while ((match = imagePattern.exec(html)) !== null) {
    matches.push(match[1]);
  }
  return Array.from(new Set(matches)).slice(0, 3);
}
function extractJsonObject(text) {
  if (!text) return null;
  const trimmed = text.trim();
  if (trimmed.startsWith("{") && trimmed.endsWith("}")) {
    return trimmed;
  }
  const fencedMatch = trimmed.match(/```(?:json)?\s*([\s\S]*?)\s*```/i);
  if (fencedMatch?.[1]) {
    const candidate = fencedMatch[1].trim();
    if (candidate.startsWith("{") && candidate.endsWith("}")) {
      return candidate;
    }
  }
  const firstBrace = trimmed.indexOf("{");
  const lastBrace = trimmed.lastIndexOf("}");
  if (firstBrace >= 0 && lastBrace > firstBrace) {
    return trimmed.slice(firstBrace, lastBrace + 1);
  }
  return null;
}
function parseLeadQualificationOutput(rawText) {
  const candidateJson = extractJsonObject(rawText);
  if (!candidateJson) return null;
  try {
    const parsed = JSON.parse(candidateJson);
    if (!parsed || typeof parsed !== "object") {
      return null;
    }
    return {
      hasWebsite: Boolean(parsed.hasWebsite),
      websiteUri: typeof parsed.websiteUri === "string" ? parsed.websiteUri : void 0,
      email: typeof parsed.email === "string" ? parsed.email : void 0,
      phoneNumber: typeof parsed.phoneNumber === "string" ? parsed.phoneNumber : void 0,
      confidence: parsed.confidence === "high" || parsed.confidence === "medium" || parsed.confidence === "low" ? parsed.confidence : void 0,
      notes: typeof parsed.notes === "string" ? parsed.notes : void 0
    };
  } catch {
    return null;
  }
}
async function runWithConcurrency(items, limit, task) {
  const results = new Array(items.length);
  let cursor = 0;
  const workers = Array.from(
    { length: Math.min(limit, items.length) },
    async () => {
      while (true) {
        const index = cursor++;
        if (index >= items.length) {
          return;
        }
        results[index] = await task(items[index], index);
      }
    }
  );
  await Promise.all(workers);
  return results;
}
async function qualifyLeadCandidate(business, city) {
  if (business.websiteUri) {
    return {
      hasWebsite: true,
      websiteUri: business.websiteUri,
      email: business.email,
      phoneNumber: business.phoneNumber,
      confidence: "high",
      notes: "Google Places returned an official website URL."
    };
  }
  const genAI = await getSDKGenAI();
  if (!genAI) {
    return {
      hasWebsite: false,
      email: business.email,
      phoneNumber: business.phoneNumber,
      confidence: "low",
      notes: "Gemini API key is not configured or SDK missing."
    };
  }
  const prompt = `You are qualifying a local business lead using live grounded data.

Business:
- Name: ${business.name}
- Category: ${business.category || "Unknown"}
- Address: ${business.address || "Unknown"}
- City/Area: ${city || "Unknown"}
- Existing website from app: ${business.websiteUri || "None found"}
- Existing phone from app: ${business.phoneNumber || "Unknown"}

Task:
1. Determine whether this business appears to have an official website right now.
2. Find the best public contact email for the business, if one exists.
3. Find the best public phone number for the business, if one exists.

Rules:
- Use grounded live sources only.
- If an official business website exists, set hasWebsite to true.
- Only return an email if it is a business contact email that is publicly available.
- Do not guess.
- Prefer high confidence only; otherwise leave fields blank.

Return only valid JSON in this exact shape:
{
  "hasWebsite": true,
  "websiteUri": "https://example.com",
  "email": "info@example.com",
  "phoneNumber": "(555) 555-5555",
  "confidence": "high",
  "notes": "short explanation"
}`;
  const configsToTry = [
    {
      tools: [{ googleMaps: {} }, { googleSearch: {} }],
      toolConfig: business.location ? {
        retrievalConfig: {
          latLng: {
            latitude: business.location.lat,
            longitude: business.location.lng
          }
        }
      } : void 0
    },
    {
      tools: [{ googleSearch: {} }],
      toolConfig: void 0
    }
  ];
  let lastError = null;
  for (const configVariant of configsToTry) {
    try {
      await throttleGemini();
      const modelInstance = genAI.getGenerativeModel({
        model: "gemini-1.5-pro",
        tools: configVariant.tools,
        toolConfig: configVariant.toolConfig
      });
      const result = await modelInstance.generateContent({
        contents: [{ role: "user", parts: [{ text: prompt }] }],
        generationConfig: { temperature: 0.1 }
      });
      const response = await result.response;
      const parsed = parseLeadQualificationOutput(
        (response.text() || "").trim()
      );
      if (parsed) {
        return parsed;
      }
    } catch (error) {
      lastError = error;
    }
  }
  return {
    hasWebsite: false,
    email: business.email,
    phoneNumber: business.phoneNumber,
    confidence: "low",
    notes: lastError instanceof Error ? lastError.message : "Lead qualification failed."
  };
}
app.post(
  "/api/generate",
  authenticateToken,
  async (req, res) => {
    try {
      const business = req.body;
      if (!business || !business.name) {
        return res.status(400).json({ error: "Missing business payload" });
      }
      const debugSession = createGenerationDebugSession(business);
      logStderr(
        `[Generate] start traceId=${debugSession.traceId} business=${business.name}`
      );
      res.setHeader("x-debug-generation-id", debugSession.traceId);
      res.setHeader("x-debug-generation-fallback", "false");
      if (WEBSITE_GENERATION_MODE === "template") {
        logStderr(`[Generate] Template mode enabled - skipping generation`);
        return res.status(422).json({
          error: "Website creation failed: template mode is enabled."
        });
      }
      if (!GENAI_KEY2 && !process.env.GEMINI_REST_URL) {
        logStderr(`[Generate] Missing Gemini API configuration`);
        return res.status(422).json({
          error: "Website creation failed: AI configuration missing."
        });
      }
      const schema = await generateHomepageViaDirectVertexPrompt(business, {
        debugLog: (msg) => logStderr(msg),
        debugSession,
        persistFile: (filename, content) => {
          persistGenerationDebugFile(debugSession, filename, content);
        },
        throttleGemini: () => throttleGemini()
      });
      logStderr(
        `[Generate] complete traceId=${debugSession.traceId} renderSource=direct-vertex-prompt`
      );
      return res.json(schema);
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : String(error);
      logStderr(`[Generate] Error: ${errorMsg}`);
      return res.status(500).json({
        error: `Website generation failed: ${errorMsg}`
      });
    }
  }
);
app.post(
  "/api/generate-search-keywords",
  async (req, res) => {
    try {
      const category = String(req.body?.category || "").trim();
      const city = String(req.body?.city || "").trim();
      if (!category || !city) {
        return res.status(400).json({ error: "Missing category or city" });
      }
      const { keywords, rawKeywords, rawText } = await generateSearchKeywords(
        category,
        city
      );
      return res.json({ keywords, rawKeywords, rawText });
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : String(error);
      return res.status(500).json({ error: `Keyword expansion failed: ${errorMsg}` });
    }
  }
);
app.post(
  "/api/debug-generation/:traceId/file",
  (req, res) => {
    const { traceId } = req.params;
    const session = getGenerationDebugSession(traceId);
    if (!session) {
      return res.status(404).json({ error: "Unknown debug generation trace" });
    }
    const { fileName, content, append } = req.body || {};
    if (!fileName) {
      return res.status(400).json({ error: "Missing fileName" });
    }
    persistGenerationDebugFile(
      session,
      fileName,
      content ?? "",
      Boolean(append)
    );
    return res.json({ success: true, traceId, fileName });
  }
);
app.get(
  "/api/debug-generation/:traceId/summary",
  (req, res) => {
    const { traceId } = req.params;
    const session = getGenerationDebugSession(traceId);
    if (!session) {
      return res.status(404).json({ error: "Unknown debug generation trace" });
    }
    return res.json(session);
  }
);
app.post(
  "/api/generate-v2",
  authenticateToken,
  async (req, res) => {
    try {
      const business = req.body;
      if (!business || !business.name) {
        return res.status(400).json({ error: "Missing business payload" });
      }
      const debugSession = createGenerationDebugSession(business);
      logStderr(
        `[GenerateV2] start traceId=${debugSession.traceId} business=${business.name}`
      );
      res.setHeader("x-debug-generation-id", debugSession.traceId);
      res.setHeader("x-debug-generation-fallback", "false");
      if (WEBSITE_GENERATION_MODE === "template") {
        logStderr(`[GenerateV2] Template mode enabled - skipping generation`);
        return res.status(422).json({
          error: "Website creation failed: template mode is enabled."
        });
      }
      if (!GENAI_KEY2 && !process.env.GEMINI_REST_URL) {
        logStderr(`[GenerateV2] Missing Gemini API configuration`);
        return res.status(422).json({
          error: "Website creation failed: AI configuration missing."
        });
      }
      const schema = await generateHomepageViaDirectVertexPrompt(business, {
        debugLog: (msg) => logStderr(msg),
        debugSession,
        persistFile: (filename, content) => {
          persistGenerationDebugFile(debugSession, filename, content);
        },
        throttleGemini: () => throttleGemini()
      });
      logStderr(
        `[GenerateV2] complete traceId=${debugSession.traceId} renderSource=direct-vertex-prompt`
      );
      return res.json(schema);
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : String(error);
      logStderr(`[GenerateV2] Error: ${errorMsg}`);
      return res.status(500).json({
        error: `Website generation failed: ${errorMsg}`
      });
    }
  }
);
app.post(
  "/api/deploy",
  async (req, res) => {
    try {
      if (!NETLIFY_TOKEN) {
        return res.status(500).json({ error: "Netlify token not configured on server" });
      }
      const { websiteContent, businessName } = req.body;
      if (!websiteContent || !businessName) {
        return res.status(400).json({ error: "Missing websiteContent or businessName" });
      }
      const siteName = `${businessName.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "") || "digital-scout"}-${Date.now()}`;
      const siteResponse = await crossFetch3("https://api.netlify.com/api/v1/sites", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${NETLIFY_TOKEN}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ name: siteName })
      });
      if (!siteResponse.ok) {
        const errorDetails = await siteResponse.text();
        return res.status(siteResponse.status).json({
          error: `Netlify site creation failed: ${siteResponse.statusText}`,
          details: errorDetails
        });
      }
      const siteData = await siteResponse.json();
      const siteId = siteData.id;
      const deployedUrl = siteData.ssl_url || siteData.url || siteData.deploy_url;
      const sha1 = crypto2.createHash("sha1").update(websiteContent).digest("hex");
      const deployResponse = await crossFetch3(
        `https://api.netlify.com/api/v1/sites/${siteId}/deploys`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${NETLIFY_TOKEN}`,
            "Content-Type": "application/json"
          },
          body: JSON.stringify({
            files: {
              "/index.html": sha1
            }
          })
        }
      );
      if (!deployResponse.ok) {
        const errorDetails = await deployResponse.text();
        return res.status(deployResponse.status).json({
          error: `Netlify deploy creation failed: ${deployResponse.statusText}`,
          details: errorDetails
        });
      }
      const deployData = await deployResponse.json();
      const deployId = deployData.id;
      const uploadResponse = await crossFetch3(
        `https://api.netlify.com/api/v1/deploys/${deployId}/files/index.html`,
        {
          method: "PUT",
          headers: {
            Authorization: `Bearer ${NETLIFY_TOKEN}`,
            "Content-Type": "application/octet-stream"
          },
          body: websiteContent
        }
      );
      if (!uploadResponse.ok) {
        const errorDetails = await uploadResponse.text();
        return res.status(uploadResponse.status).json({
          error: `Netlify file upload failed: ${uploadResponse.statusText}`,
          details: errorDetails
        });
      }
      return res.json({
        success: true,
        deployedUrl,
        siteId,
        deployId,
        deployedAt: (/* @__PURE__ */ new Date()).toISOString()
      });
    } catch (error) {
      return res.status(500).json({
        error: error instanceof Error ? error.message : "Deployment failed"
      });
    }
  }
);
app.post(
  "/api/enrich-business",
  async (req, res) => {
    try {
      let categoryImageSuggestions = function(cat, name) {
        const c = (cat || "").toLowerCase();
        if (c.includes("restaurant") || c.includes("cafe")) {
          return [
            "https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&w=1200&q=80",
            "https://images.unsplash.com/photo-1504754524776-8f4f37790ca0?auto=format&fit=crop&w=1200&q=80",
            "https://images.unsplash.com/photo-1541542684-18f77c1f6b5a?auto=format&fit=crop&w=1200&q=80"
          ];
        }
        if (c.includes("salon") || c.includes("spa")) {
          return [
            "https://images.unsplash.com/photo-1560066984-138dadb4c035?auto=format&fit=crop&w=1200&q=80",
            "https://images.unsplash.com/photo-1524758631624-e2822e304c36?auto=format&fit=crop&w=1200&q=80",
            "https://images.unsplash.com/photo-1526045612212-70caf35c14df?auto=format&fit=crop&w=1200&q=80"
          ];
        }
        if (c.includes("gym") || c.includes("fitness")) {
          return [
            "https://images.unsplash.com/photo-1517836357463-d25dfeac3438?auto=format&fit=crop&w=1200&q=80",
            "https://images.unsplash.com/photo-1517960413843-0aee4a3d5a0c?auto=format&fit=crop&w=1200&q=80",
            "https://images.unsplash.com/photo-1558611848-73f7eb4001d6?auto=format&fit=crop&w=1200&q=80"
          ];
        }
        return [
          "https://images.unsplash.com/photo-1497366754035-f200968a6e72?auto=format&fit=crop&w=1200&q=80",
          "https://images.unsplash.com/photo-1500306365237-7b4b9d7d0f0b?auto=format&fit=crop&w=1200&q=80",
          "https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?auto=format&fit=crop&w=1200&q=80"
        ];
      };
      const { websiteUri, businessName, category, photos } = req.body;
      if (!businessName) {
        return res.status(400).json({ error: "Missing businessName" });
      }
      let detectedLogo = photos && photos.length > 0 ? photos[0] : void 0;
      if (detectedLogo && detectedLogo.includes("googleusercontent.com")) {
        detectedLogo = detectedLogo.split("=")[0] + "=s400-c";
      }
      if (!websiteUri) {
        return res.json({
          email: void 0,
          phones: [],
          imageSuggestions: categoryImageSuggestions(category, businessName)
        });
      }
      const response = await crossFetch3(websiteUri, {
        headers: {
          "User-Agent": "Mozilla/5.0 (compatible; DigitalScout/1.0)"
        }
      });
      if (!response.ok) {
        return res.json({
          email: void 0,
          phones: [],
          imageSuggestions: []
        });
      }
      const html = await response.text();
      const email = extractEmails(html)[0];
      const phones = extractPhones(html);
      const imageSuggestions = extractImages(html);
      const websiteLogo = extractLogo(html, websiteUri);
      if (websiteLogo) {
        detectedLogo = websiteLogo;
      }
      return res.json({
        email,
        phones,
        imageSuggestions,
        logo: detectedLogo,
        businessName,
        category
      });
    } catch (error) {
      console.error("Enrich business error:", error);
      return res.json({
        email: void 0,
        phones: [],
        imageSuggestions: [],
        logo: req.body.photos?.[0]
      });
    }
  }
);
function extractLogo(html, baseUrl) {
  try {
    const iconRegex = /<link[^>]+rel=["'](?:shortcut )?icon["'][^>]+href=["']([^"']+)["']/i;
    const appleIconRegex = /<link[^>]+rel=["']apple-touch-icon["'][^>]+href=["']([^"']+)["']/i;
    const ogImageRegex = /<meta[^>]+property=["']og:logo["'][^>]+content=["']([^"']+)["']/i;
    const schemaLogoRegex = /["']logo["']\s*:\s*["']([^"']+)["']/i;
    const match = html.match(ogImageRegex) || html.match(appleIconRegex) || html.match(iconRegex) || html.match(schemaLogoRegex);
    if (match && match[1]) {
      let logoUrl = match[1];
      if (logoUrl.startsWith("//")) {
        logoUrl = "https:" + logoUrl;
      } else if (logoUrl.startsWith("/")) {
        const origin = new URL(baseUrl).origin;
        logoUrl = origin + logoUrl;
      } else if (!logoUrl.startsWith("http")) {
        const origin = new URL(baseUrl).origin;
        logoUrl = origin + "/" + logoUrl;
      }
      return logoUrl;
    }
    try {
      const origin = new URL(baseUrl).origin;
      return `${origin}/favicon.ico`;
    } catch {
      return void 0;
    }
  } catch {
    return void 0;
  }
}
app.post(
  "/api/qualify-leads",
  async (req, res) => {
    try {
      const { businesses, city } = req.body;
      if (!Array.isArray(businesses)) {
        return res.status(400).json({ error: "Missing businesses array" });
      }
      const candidates = businesses.filter(
        (business) => business && typeof business.name === "string"
      );
      const qualifications = await runWithConcurrency(
        candidates,
        3,
        async (business) => {
          const qualification = await qualifyLeadCandidate(business, city);
          return { business, qualification };
        }
      );
      const qualifiedBusinesses = qualifications.filter(
        ({ qualification }) => !qualification.hasWebsite && Boolean(qualification.email || qualification.phoneNumber)
      ).map(({ business, qualification }) => ({
        ...business,
        websiteUri: qualification.websiteUri,
        email: qualification.email || business.email,
        phoneNumber: qualification.phoneNumber || business.phoneNumber,
        notes: qualification.notes || void 0,
        confidence: qualification.confidence || void 0
      }));
      return res.json({
        businesses: qualifiedBusinesses,
        totalCandidates: candidates.length,
        totalQualified: qualifiedBusinesses.length
      });
    } catch (error) {
      return res.status(500).json({
        error: error instanceof Error ? error.message : "Lead qualification failed"
      });
    }
  }
);
app.post(
  "/api/wordpress/provision-site",
  authenticateToken,
  async (req, res) => {
    try {
      const { projectId, business, websiteSchema, provisioningPlan, status } = req.body;
      if (!projectId || !business || !websiteSchema) {
        return res.status(400).json({
          error: "Missing projectId, business, or websiteSchema."
        });
      }
      const renderSource = websiteSchema._renderSource || "unknown";
      const wpHtml = websiteSchema._wordpressHtml;
      logStderr(
        `[Provisioning] queue request projectId=${projectId} business=${business.name} traceId=${websiteSchema.meta?.traceId || "n/a"} renderSource=${renderSource} wpHtml=${wpHtml ? `yes(${wpHtml.length})` : "no"}`
      );
      const jobId = crypto2.randomUUID();
      const traceId = websiteSchema.meta?.traceId || websiteSchema._validation?.traceId || null;
      const isPreview = String(projectId).includes("preview-");
      const previewExpiresAt = isPreview ? new Date(Date.now() + 24 * 60 * 60 * 1e3) : null;
      const [existing] = await pool.query(
        `SELECT id FROM provisioning_jobs WHERE project_id = ? LIMIT 1`,
        [projectId]
      );
      const targetStatus = status || "pending";
      let activeJobId = jobId;
      if (existing && existing.length > 0) {
        activeJobId = existing[0].id;
        await pool.query(
          `UPDATE provisioning_jobs SET website_schema = ?, status = ?, trace_id = ?, updated_at = NOW(), user_id = ? WHERE project_id = ?`,
          [
            JSON.stringify(websiteSchema),
            targetStatus,
            traceId,
            req.user.id,
            projectId
          ]
        );
      } else {
        await pool.query(
          `INSERT INTO provisioning_jobs (id, project_id, business_name, website_schema, status, trace_id, is_preview, preview_expires_at, user_id) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          [
            jobId,
            projectId,
            business.name,
            JSON.stringify(websiteSchema),
            targetStatus,
            traceId,
            isPreview,
            previewExpiresAt,
            req.user.id
          ]
        );
      }
      return res.json({
        success: true,
        jobId: activeJobId,
        message: isPreview ? "Preview provisioning queued" : "Provisioning job queued successfully",
        previewExpiresAt
      });
    } catch (error) {
      return res.status(500).json({
        error: error instanceof Error ? error.message : "Failed to queue provisioning job"
      });
    }
  }
);
app.get(
  "/api/wordpress/site-status/:projectId",
  authenticateToken,
  async (req, res) => {
    const { projectId } = req.params;
    try {
      const [rows] = await pool.query(
        `SELECT status, logs, subdomain, subdomain_url, wp_admin_url, ssl_status, wp_admin_user, wp_admin_pass_encrypted 
			 FROM provisioning_jobs 
			 LEFT JOIN isolated_deployments ON provisioning_jobs.project_id = isolated_deployments.project_id
			 WHERE provisioning_jobs.project_id = ? AND provisioning_jobs.user_id = ? ORDER BY provisioning_jobs.created_at DESC LIMIT 1`,
        [projectId, req.user.id]
      );
      if (!rows || rows.length === 0) {
        return res.status(404).json({ error: "Job not found" });
      }
      const rootDomain = process.env.WP_ROOT_DOMAIN || "digiscout.online";
      const liveUrl = rows[0].subdomain_url || null;
      const adminUrl = rows[0].wp_admin_url || null;
      const effectiveStatus = rows[0].status;
      let rawPassword = null;
      if (effectiveStatus === "completed" && rows[0].wp_admin_pass_encrypted) {
        try {
          const [ivHex, encryptedHex] = rows[0].wp_admin_pass_encrypted.split(":");
          const key = process.env.ENCRYPTION_KEY || "0123456789abcdef0123456789abcdef";
          const decipher = crypto2.createDecipheriv(
            "aes-256-cbc",
            Buffer.from(key),
            Buffer.from(ivHex, "hex")
          );
          let decrypted = decipher.update(Buffer.from(encryptedHex, "hex"));
          decrypted = Buffer.concat([decrypted, decipher.final()]);
          rawPassword = decrypted.toString();
        } catch (e) {
          console.error("Decryption failed:", e);
        }
      }
      return res.json({
        success: true,
        status: effectiveStatus,
        logs: rows[0].logs || [],
        deployment: liveUrl ? {
          liveUrl,
          adminUrl,
          username: rows[0].wp_admin_user || "admin",
          password: rawPassword,
          sslStatus: rows[0].ssl_status || "pending"
        } : null
      });
    } catch (error) {
      return res.status(500).json({
        error: error instanceof Error ? error.message : "Failed to fetch status"
      });
    }
  }
);
app.get("/api/generate/replay/:traceId", async (req, res) => {
  const { traceId } = req.params;
  try {
    const inputPath = path6.join(
      DEBUG_ROOT_DIR2,
      traceId,
      "06-renderer-input.json"
    );
    if (!fs7.existsSync(inputPath)) {
      return res.status(404).json({ error: "Trace not found or missing renderer input" });
    }
    const schemaContent = fs7.readFileSync(inputPath, "utf-8");
    const rawSchema = JSON.parse(schemaContent);
    const { validateWebsiteSchema: validateWebsiteSchema2 } = await Promise.resolve().then(() => (init_website_schema_validator(), website_schema_validator_exports));
    const { schemaToGutenbergBlocks: schemaToGutenbergBlocks2 } = await Promise.resolve().then(() => (init_wordpress(), wordpress_exports));
    const validatedSchema = validateWebsiteSchema2(rawSchema);
    const blocks = schemaToGutenbergBlocks2(validatedSchema);
    return res.json({
      success: true,
      schema: validatedSchema,
      blocks
    });
  } catch (error) {
    return res.status(500).json({
      error: error instanceof Error ? error.message : "Failed to replay trace"
    });
  }
});
app.delete(
  "/api/wordpress/site/:projectId",
  authenticateToken,
  async (req, res) => {
    try {
      const { projectId } = req.params;
      if (!projectId) {
        return res.status(400).json({ error: "Missing projectId" });
      }
      const [rows] = await pool.query(
        `SELECT id, user_id FROM provisioning_jobs WHERE project_id = ? LIMIT 1`,
        [projectId]
      );
      if (!rows || rows.length === 0) {
        return res.status(404).json({ error: "Project not found" });
      }
      if (rows[0].user_id && rows[0].user_id !== req.user.id) {
        return res.status(403).json({ error: "Unauthorized to delete this project" });
      }
      await deleteProvisionedWordPressSite(projectId);
      return res.json({
        success: true,
        message: `WordPress site for project ${projectId} deleted successfully`
      });
    } catch (error) {
      return res.status(500).json({
        error: error instanceof Error ? error.message : "Failed to delete WordPress site"
      });
    }
  }
);
app.get("/api/leads", authenticateToken, async (req, res) => {
  try {
    const [rows] = await pool.query(
      `SELECT 
				pj.project_id as id,
				pj.business_name as businessName,
				pj.website_schema as websiteSchema,
				pj.status as provisioningStatus,
				pj.created_at as lastProvisionedAt,
				pj.wp_admin_user as wordpressOwnerUsername,
				pj.wp_admin_pass_encrypted,
				idp.subdomain_url as wordpressSiteUrl,
				idp.wp_admin_url as wordpressAdminUrl,
				idp.ssl_status as sslStatus
			 FROM provisioning_jobs pj
			 LEFT JOIN isolated_deployments idp ON pj.project_id = idp.project_id
			 WHERE pj.user_id = ?
			 ORDER BY pj.created_at DESC`,
      [req.user.id]
    );
    const leads = rows.map((row) => {
      let rawPassword = null;
      if (row.wp_admin_pass_encrypted) {
        try {
          const [ivHex, encryptedHex] = row.wp_admin_pass_encrypted.split(":");
          const key = process.env.ENCRYPTION_KEY || "0123456789abcdef0123456789abcdef";
          const decipher = crypto2.createDecipheriv(
            "aes-256-cbc",
            Buffer.from(key),
            Buffer.from(ivHex, "hex")
          );
          let decrypted = decipher.update(Buffer.from(encryptedHex, "hex"));
          decrypted = Buffer.concat([decrypted, decipher.final()]);
          rawPassword = decrypted.toString();
        } catch (e) {
        }
      }
      let schema = {};
      try {
        schema = typeof row.websiteSchema === "string" ? JSON.parse(row.websiteSchema) : row.websiteSchema || {};
      } catch {
        schema = {};
      }
      return {
        ...row,
        businessId: schema.meta?.businessId || row.id,
        businessAddress: schema.brand?.address || "",
        businessCategory: schema.brand?.category || "General",
        rating: schema._validation?.rating || 0,
        reviewCount: schema._validation?.reviewCount || 0,
        email: schema.brand?.email || "",
        phoneNumber: schema.brand?.phone || "",
        logo: schema.brand?.logo || schema._validation?.logo || "",
        photos: schema._validation?.photos || [],
        imageSuggestions: schema._validation?.imageSuggestions || [],
        wordpressPassword: rawPassword,
        websiteContent: "",
        isDeployed: row.provisioningStatus === "completed" || row.provisioningStatus === "ready" || !!row.wordpressSiteUrl
      };
    });
    return res.json(leads);
  } catch (error) {
    console.error("[Leads] Failed to fetch leads:", error);
    return res.status(500).json({ error: "Failed to fetch leads history" });
  }
});
app.post(
  "/api/outreach/send",
  async (req, res) => {
    try {
      const { businessName, phoneNumber, message, preferredChannel } = req.body;
      if (!businessName || !phoneNumber || !message) {
        return res.status(400).json({
          error: "Missing required fields: businessName, phoneNumber, message"
        });
      }
      if (!CALLHIPPO_API_KEY) {
        console.error("[CallHippo] API key is not configured");
        return res.status(500).json({
          error: "CallHippo API key is not configured on the server. Please check .env.local."
        });
      }
      const result = await sendOutreachViaCallHippo(
        {
          businessName,
          phoneNumber,
          message,
          preferredChannel: preferredChannel || "whatsapp"
        },
        CALLHIPPO_API_KEY
      );
      if (result.success) {
        console.log(
          `[Outreach] Successfully sent via ${result.channel} to ${phoneNumber}`
        );
        return res.json({
          success: true,
          channel: result.channel,
          messageId: result.messageId,
          status: result.status
        });
      } else {
        console.warn(
          `[Outreach] Failed to send to ${phoneNumber}: ${result.error}`
        );
        return res.status(500).json({
          success: false,
          error: result.error || "Failed to send outreach message"
        });
      }
    } catch (error) {
      console.error("[Outreach] Unexpected error:", error);
      return res.status(500).json({
        error: error instanceof Error ? error.message : "Outreach sending failed"
      });
    }
  }
);
app.get(
  "/api/business-ai-chat/:leadId",
  async (req, res) => {
    try {
      const { leadId } = req.params;
      if (!leadId) {
        return res.status(400).json({ error: "Missing leadId" });
      }
      const [messages] = await pool.query(
        "SELECT role, content, created_at FROM lead_ai_messages WHERE lead_id = ? ORDER BY id ASC",
        [leadId]
      );
      return res.json({ messages: messages || [] });
    } catch (error) {
      console.error("[AI Chat] Failed to fetch chat history:", error);
      return res.status(500).json({ error: "Failed to fetch chat history" });
    }
  }
);
app.post("/api/business-ai-chat", async (req, res) => {
  try {
    const { leadId, businessContext, messages, conversationId } = req.body;
    if (!leadId || !businessContext || !Array.isArray(messages)) {
      return res.status(400).json({
        error: "Missing required fields: leadId, businessContext, messages"
      });
    }
    const latestMessage = messages[messages.length - 1];
    let chatContents = [];
    try {
      if (latestMessage && latestMessage.role === "user") {
        await pool.query(
          "INSERT INTO lead_ai_messages (lead_id, conversation_id, role, content) VALUES (?, ?, ?, ?)",
          [leadId, conversationId || leadId, "user", latestMessage.content]
        );
      }
      const [dbHistory] = await pool.query(
        "SELECT role, content FROM lead_ai_messages WHERE lead_id = ? ORDER BY id ASC",
        [leadId]
      );
      chatContents = dbHistory.map((m) => ({
        role: m.role === "user" ? "user" : "model",
        parts: [{ text: m.content }]
      }));
    } catch (dbError) {
      console.warn(
        "[AI Chat] Database offline. Using stateless array fallback:",
        dbError
      );
      chatContents = messages.map((m) => ({
        role: m.role === "user" ? "user" : "model",
        parts: [{ text: m.content }]
      }));
    }
    if (chatContents.length === 0) {
      chatContents.push({
        role: "user",
        parts: [{ text: latestMessage?.content || "Hello" }]
      });
    }
    const restUrl = process.env.GEMINI_REST_URL || "https://generativelanguage.googleapis.com/v1beta/models/gemini-flash-latest:generateContent";
    const key = getLatestApiKeyFromDisk() || process.env.GEMINI_API_KEY || process.env.GENAI_KEY || GENAI_KEY2;
    if (!key) {
      return res.status(500).json({
        error: "Gemini API key is not configured on the server. Please check your .env.production."
      });
    }
    const businessName = businessContext.name || "Local Business";
    const businessCategory = businessContext.category || "Local Service";
    const businessAddress = businessContext.address || "N/A";
    const rating = businessContext.rating || "N/A";
    const reviewCount = businessContext.reviewCount || 0;
    const reviewsText = Array.isArray(businessContext.reviews) && businessContext.reviews.length ? businessContext.reviews.map(
      (r, i) => `${i + 1}. [Rating: ${r.rating || "N/A"}] "${r.text || r.comment || ""}"`
    ).join("\n") : "No reviews or rating insights available.";
    let websiteText = "";
    if (businessContext.websiteSchema) {
      const ws = businessContext.websiteSchema;
      websiteText = `
Generated Website Details:
- Theme: ${ws.theme?.name || "N/A"} (Style: ${ws.theme?.style || "N/A"})
- Palette Background: ${ws.theme?.palette?.background || "N/A"}, Primary: ${ws.theme?.palette?.primary || "N/A"}, Accent: ${ws.theme?.palette?.accent || "N/A"}
- Typography: Heading: ${ws.theme?.typography?.heading || "N/A"}, Body: ${ws.theme?.typography?.body || "N/A"}
- SEO Title: ${ws.seo?.title || "N/A"}
- SEO Description: ${ws.seo?.description || "N/A"}
- Sections Configured: ${Array.isArray(ws.sections) ? ws.sections.map((s) => `${s.type} (${s.layout || "default"})`).join(", ") : "None"}
`;
    }
    const systemPrompt = `You are an elite, production-grade AI Business Intelligence Assistant, local market analyst, SEO consultant, and branding strategist.
You are deeply grounded in the following business context for ${businessName}:
- Name: ${businessName}
- Category: ${businessCategory}
- Address: ${businessAddress}
- Rating: ${rating} (${reviewCount} reviews)

Reviews & Sentiment:
${reviewsText}
${websiteText}

Rules for your responses:
1. Act as a high-value growth strategist and consultant, NOT a generic chatbot. Provide action items, local SEO opportunities, conversion enhancements, and competitor analysis.
2. Utilize native Google Search grounding to query real-world competitors, neighboring prices, local SEO rankings, and local citations for this exact neighborhood and business type.
3. Be highly structured and readable. Format your answers in professional Markdown with bullet points, bold opportunities, and clean comparison tables. Keep paragraphs strategic and concise.`;
    res.writeHead(200, {
      "Content-Type": "text/plain; charset=utf-8",
      "Cache-Control": "no-cache",
      Connection: "keep-alive"
    });
    let fullResponseText = "";
    let fallbackUsed = false;
    const googleCloudApiKey = process.env.GOOGLE_CLOUD_API_KEY;
    if (googleCloudApiKey) {
      try {
        console.log("[AI Chat] Attempting primary Vertex AI generation...");
        const apiEndpoint = process.env.VERTEX_API_ENDPOINT || "aiplatform.googleapis.com";
        const modelId = "gemini-3.1-pro-preview";
        const generateContentApi = "generateContent";
        const vertexUrl = `https://${apiEndpoint}/v1/publishers/google/models/${modelId}:${generateContentApi}?key=${googleCloudApiKey}`;
        await throttleGemini();
        const vertexPayload = {
          contents: chatContents,
          systemInstruction: {
            parts: [{ text: systemPrompt }]
          },
          generationConfig: {
            temperature: 0.2
          },
          tools: [{ googleSearch: {} }]
        };
        const res2 = await fetch(vertexUrl, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(vertexPayload)
        });
        if (res2.ok) {
          const data = await res2.json();
          const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
          if (text) {
            fullResponseText = text;
            console.log("[AI Chat] Vertex AI generation succeeded!");
          } else {
            throw new Error("Vertex response contents parts were empty");
          }
        } else {
          const errText = await res2.text().catch(() => "");
          throw new Error(
            `Vertex REST failed with status ${res2.status}: ${errText}`
          );
        }
      } catch (vertexError) {
        console.warn(
          "[AI Chat] Vertex AI generation failed, falling back to Public Gemini SDK:",
          vertexError
        );
        fallbackUsed = true;
      }
    } else {
      fallbackUsed = true;
    }
    if (fallbackUsed || !fullResponseText) {
      const genAI = await getSDKGenAI();
      if (genAI) {
        try {
          console.log(
            "[AI Chat] Attempting SDK generation with gemini-3.1-pro-preview..."
          );
          await throttleGemini();
          const result = await genAI.models.generateContent({
            model: "gemini-3.1-pro-preview",
            contents: chatContents,
            config: {
              systemInstruction: systemPrompt,
              tools: [{ googleSearch: {} }]
            }
          });
          fullResponseText = result.text || "";
        } catch (sdkError) {
          console.warn(
            "[AI Chat] SDK generation failed, falling back to REST:",
            sdkError
          );
          fallbackUsed = true;
        }
      } else {
        console.log("[AI Chat] SDK not available, falling back to REST");
        fallbackUsed = true;
      }
    }
    if (!fullResponseText) {
      console.log(
        "[AI Chat] Attempting REST generation with gemini-flash-latest..."
      );
      const modelRestUrl = restUrl.includes("{model}") ? restUrl.replace("{model}", "gemini-flash-latest") : restUrl;
      const url = `${modelRestUrl}${modelRestUrl.includes("?") ? "&" : "?"}key=${key}`;
      const requestBody = {
        contents: chatContents,
        systemInstruction: {
          parts: [{ text: systemPrompt }]
        },
        tools: [{ googleSearch: {} }]
      };
      await throttleGemini();
      const fetchResponse = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(requestBody)
      });
      if (!fetchResponse.ok) {
        const errorText = await fetchResponse.text().catch(() => "");
        throw new Error(
          `Gemini REST API returned status ${fetchResponse.status}: ${errorText}`
        );
      }
      const responseJson = await fetchResponse.json();
      fullResponseText = responseJson.candidates?.[0]?.content?.parts?.[0]?.text || "";
    }
    res.write(fullResponseText);
    if (fullResponseText.trim()) {
      try {
        await pool.query(
          "INSERT INTO lead_ai_messages (lead_id, conversation_id, role, content) VALUES (?, ?, ?, ?)",
          [leadId, conversationId || leadId, "model", fullResponseText]
        );
      } catch (dbError) {
        console.warn(
          "[AI Chat] Failed to save AI response text to database:",
          dbError
        );
      }
    }
    res.end();
  } catch (error) {
    console.error("[AI Chat] Error during chat session:", error);
    if (!res.headersSent) {
      return res.status(500).json({
        error: error instanceof Error ? error.message : "Chat session generation failed"
      });
    } else {
      const errMessage = error instanceof Error ? error.message : String(error);
      res.write(
        `

*Error: Connection to Gemini failed. Details: ${errMessage}*`
      );
      res.end();
    }
  }
});
app.get("/health", (req, res) => {
  res.json({ status: "ok" });
});
app.delete("/api/sites/:siteId", async (req, res) => {
  try {
    if (!NETLIFY_TOKEN) {
      return res.status(500).json({ error: "Netlify token not configured on server" });
    }
    const { siteId } = req.params;
    if (!siteId) {
      return res.status(400).json({ error: "Missing siteId" });
    }
    const response = await crossFetch3(
      `https://api.netlify.com/api/v1/sites/${siteId}`,
      {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${NETLIFY_TOKEN}`
        }
      }
    );
    if (!response.ok) {
      const errorDetails = await response.text();
      return res.status(response.status).json({
        error: `Failed to delete Netlify site: ${response.statusText}`,
        details: errorDetails
      });
    }
    return res.json({ success: true, siteId });
  } catch (error) {
    return res.status(500).json({
      error: error instanceof Error ? error.message : "Delete failed"
    });
  }
});
async function pollSslStatus() {
  try {
    const [deployments] = await pool.query(
      `SELECT * FROM isolated_deployments 
			 WHERE ssl_status = 'pending' 
			 ORDER BY last_ssl_check IS NULL DESC, last_ssl_check ASC 
			 LIMIT 5`
    );
    for (const dep of deployments) {
      const httpsUrl = dep.subdomain_url.replace("http://", "https://");
      const host = httpsUrl.replace("https://", "").split("/")[0];
      console.log(`[SSL Worker] Checking SSL for ${host}`);
      try {
        const https = await import("https");
        await new Promise((resolve, reject) => {
          const req = https.get(
            {
              hostname: host,
              port: 443,
              path: "/",
              timeout: 5e3,
              rejectUnauthorized: true
              // We want to know if the cert is valid
            },
            (res) => {
              resolve(true);
            }
          );
          req.on("error", (e) => reject(e));
          req.on("timeout", () => {
            req.destroy();
            reject(new Error("Timeout"));
          });
        });
        console.log(`[SSL Worker] SSL is VALID for ${httpsUrl}. Upgrading...`);
        await pool.query(
          `UPDATE isolated_deployments SET ssl_status = 'valid', subdomain_url = ?, wp_admin_url = ? WHERE id = ?`,
          [httpsUrl, `${httpsUrl}/wp-admin`, dep.id]
        );
      } catch (error) {
        console.log(`[SSL Worker] SSL not ready for ${host}`);
        await pool.query(
          `UPDATE isolated_deployments SET last_ssl_check = NOW() WHERE id = ?`,
          [dep.id]
        ).catch(() => {
        });
      }
    }
  } catch (error) {
    console.error("[SSL Worker] Error:", error);
  }
}
async function pollCleanupPreviewSites() {
  try {
    const [deployments] = await pool.query(
      `SELECT project_id, preview_expires_at, status FROM provisioning_jobs WHERE preview_expires_at < NOW() AND status != 'cleaned' LIMIT 10`
    );
    for (const dep of deployments) {
      console.log(
        `[Cleanup Worker] Cleaning up expired preview for project ${dep.project_id}`
      );
      try {
        await deleteProvisionedWordPressSite(dep.project_id);
        await pool.query(
          `UPDATE provisioning_jobs SET status = 'cleaned' WHERE project_id = ?`,
          [dep.project_id]
        );
        console.log(
          `[Cleanup Worker] Cleanup successful for project ${dep.project_id}`
        );
      } catch (error) {
        console.error(
          `[Cleanup Worker] Failed to clean up ${dep.project_id}:`,
          error
        );
      }
    }
  } catch (error) {
    console.error("[Cleanup Worker] Error:", error);
  }
}
setInterval(pollSslStatus, 12e4);
setInterval(pollCleanupPreviewSites, 3e5);
app.listen(PORT, async () => {
  console.log(`Server is running on http://localhost:${PORT}`);
  await initializeDatabase();
  startProvisioningWorker();
});
var server_default = app;
export {
  server_default as default
};
