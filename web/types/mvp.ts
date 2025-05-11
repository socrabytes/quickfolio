/**
 * Type definitions for MVP content data
 * Used for theme rendering and configuration generation
 */

/**
 * Profile information for the link-in-bio page
 */
export interface ProfileData {
  name: string;        // Full name of the person
  headline: string;    // Short professional headline
  avatar: string;      // Avatar filename (e.g., "avatar.jpg")
}

/**
 * Link data for the link-in-bio page
 */
export interface LinkData {
  text: string;             // Display text for the link
  url: string;              // URL for the link
  icon?: string;            // Optional icon name (e.g., "linkedin", "github")
  type?: string;            // Optional link type (e.g., "social", "project")
}

/**
 * Complete MVP content data structure
 */
export interface MVPContentData {
  profile: ProfileData;     // Profile information
  links: LinkData[];        // Array of link data
}

/**
 * Response from the backend API for MVP content generation
 */
export interface MVPContentGenerationResponse {
  mvp_content?: MVPContentData;   // Generated content if successful
  error?: string;                // Error message if generation failed
  raw_ai_response?: string;      // Raw response from AI for debugging
  debug_info?: Record<string, any>; // Additional debug information
}

/**
 * Request to the backend API for MVP content generation
 */
export interface MVPContentGenerationRequest {
  resume_text: string;      // Raw resume text for content extraction
}
