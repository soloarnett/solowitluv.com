/**
 * Extracts dominant colors from an image using canvas.
 * Returns an array of RGB color strings suitable for gradients.
 */
export class ColorExtractor {
  /**
   * Extracts dominant colors from an image URL
   * @param imageUrl The URL of the image to extract colors from
   * @param colorCount Number of dominant colors to extract (default: 5)
   * @returns Promise<string[]> Array of RGB color strings like 'rgb(255, 0, 0)'
   */
  static async extractColors(imageUrl: string, colorCount: number = 5): Promise<string[]> {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.crossOrigin = 'Anonymous';
      
      img.onload = () => {
        try {
          const canvas = document.createElement('canvas');
          const ctx = canvas.getContext('2d');
          
          if (!ctx) {
            reject(new Error('Could not get canvas context'));
            return;
          }
          
          // Use a smaller canvas for faster processing
          const maxSize = 100;
          const scale = Math.min(maxSize / img.width, maxSize / img.height);
          canvas.width = img.width * scale;
          canvas.height = img.height * scale;
          
          ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
          const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
          const pixels = imageData.data;
          
          // Sample pixels (skip some for performance)
          const colorMap = new Map<string, number>();
          const step = 4; // Sample every 4th pixel
          
          for (let i = 0; i < pixels.length; i += step * 4) {
            const r = pixels[i];
            const g = pixels[i + 1];
            const b = pixels[i + 2];
            const a = pixels[i + 3];
            
            // Skip transparent pixels and very bright/dark colors
            if (a < 128) continue;
            if (r > 240 && g > 240 && b > 240) continue; // Skip near-white
            if (r < 15 && g < 15 && b < 15) continue; // Skip near-black
            
            // Quantize colors to reduce variations
            const qr = Math.round(r / 32) * 32;
            const qg = Math.round(g / 32) * 32;
            const qb = Math.round(b / 32) * 32;
            
            const key = `${qr},${qg},${qb}`;
            colorMap.set(key, (colorMap.get(key) || 0) + 1);
          }
          
          // Sort colors by frequency and get top N
          const sortedColors = Array.from(colorMap.entries())
            .sort((a, b) => b[1] - a[1])
            .slice(0, colorCount)
            .map(([color]) => {
              const [r, g, b] = color.split(',').map(Number);
              // Darken colors slightly for better background aesthetics
              const darkenFactor = 0.7;
              return `rgb(${Math.round(r * darkenFactor)}, ${Math.round(g * darkenFactor)}, ${Math.round(b * darkenFactor)})`;
            });
          
          // Ensure we always have at least some colors
          if (sortedColors.length === 0) {
            resolve(['#1f0e04', '#030b23', '#000']);
          } else {
            // Add black to the palette for better gradient transitions
            sortedColors.push('#000');
            resolve(sortedColors);
          }
        } catch (error) {
          reject(error);
        }
      };
      
      img.onerror = () => {
        reject(new Error(`Failed to load image: ${imageUrl}`));
      };
      
      img.src = imageUrl;
    });
  }
  
  /**
   * Creates a CSS gradient string from an array of colors
   * @param colors Array of color strings
   * @returns CSS radial gradient string
   */
  static createGradientString(colors: string[]): string {
    return `radial-gradient(circle, ${colors.join(', ')})`;
  }
}
