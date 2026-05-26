export const VERTEX_HOMEPAGE_GENERATION_PROMPT = `You are a professional agency web design engine specializing in modern local business websites.

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
   - Avoid generic AI fluff or overused clichés (e.g., 'elevate your space', 'cutting-edge solutions', 'transform your business').
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

export interface ElementorHomepageContent {
	hero: {
		heading: string;
		description: string;
		button_text: string;
		hero_image: string;
		masked_image: string;
	};
	about: {
		heading: string;
		description: string;
		image: string;
		button_text: string;
	};
	services: {
		heading: string;
		description: string;
		list: string[]; // exactly 8 items
		image: string;
	};
	features: {
		heading: string;
		items: Array<{
			title: string;
			description: string;
		}>; // exactly 3 items
	};
	projects: {
		heading: string;
		description: string;
	};
	process: {
		heading: string;
		steps: Array<{
			title: string;
			description: string;
		}>; // exactly 4 items
	};
	testimonials: {
		heading: string;
		items: Array<{
			content: string;
			name: string;
		}>; // exactly 3 items
		slideshow: string[]; // exactly 3 items
	};
}

export interface HomepageGenerationRequest {
	business_name: string;
	business_category: string;
	short_tagline: string;
	one_sentence_summary: string;
	primary_cta_text: string;
	primary_cta_url: string;
	secondary_cta_text?: string;
	secondary_cta_url?: string;
	phone: string;
	address: string;
	maps_url: string;
	hours?: string | string[];
	services: Array<{
		title: string;
		short_description: string;
		image_url?: string;
	}>;
	categories: string[];
	reviews: Array<{
		author: string;
		rating: number;
		text: string;
		date?: string;
	}>;
	images: {
		hero?: string;
		service1?: string;
		service2?: string;
		gallery?: string[];
	};
	colors?: {
		primary?: string;
		accent?: string;
		neutral?: string;
	};
	logo_url?: string;
	local_context?: string;
	competitors?: Array<{
		name: string;
		url?: string;
	}>;
	trust_logos?: Array<{
		name: string;
		url: string;
	}>;
}

export interface HomepageGenerationResponse {
	elementorContent: ElementorHomepageContent;
	notes: string;
}
