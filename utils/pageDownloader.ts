/**
 * Utility functions for downloading and saving web pages
 */

/**
 * Triggers a download of content as a file
 * @param content The content to download
 * @param filename The name of the file to save as
 * @param contentType The MIME type of the content
 */
export const downloadContent = (content: string, filename: string, contentType: string = 'text/html') => {
  const blob = new Blob([content], { type: contentType });
  const url = URL.createObjectURL(blob);
  
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  
  // Append to the document temporarily to trigger download
  document.body.appendChild(a);
  a.click();
  
  // Clean up
  setTimeout(() => {
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }, 100);
};

/**
 * Converts a URL to a valid filename
 * @param url The URL to convert
 * @returns A valid filename based on the URL
 */
export const urlToFilename = (url: string): string => {
  try {
    const urlObj = new URL(url);
    const hostname = urlObj.hostname.replace(/^www\./, '');
    const pathParts = urlObj.pathname.split('/').filter(Boolean);
    const lastPath = pathParts[pathParts.length - 1] || 'index';
    
    // Create a clean filename
    let filename = `${hostname}_${lastPath}`;
    
    // Remove invalid characters
    filename = filename.replace(/[^a-zA-Z0-9\-_]/g, '_');
    
    // Ensure it's not too long
    if (filename.length > 50) {
      filename = filename.substring(0, 50);
    }
    
    return `${filename}.html`;
  } catch (error) {
    // Fallback if URL parsing fails
    return 'downloaded_page.html';
  }
};

/**
 * Saves page content with a descriptive filename
 * @param htmlContent The HTML content to save
 * @param sourceUrl The original URL of the page
 */
export const savePageBackup = (htmlContent: string, sourceUrl: string) => {
  const filename = urlToFilename(sourceUrl);
  downloadContent(htmlContent, filename, 'text/html');
  console.log(`Page saved as ${filename}`);
};