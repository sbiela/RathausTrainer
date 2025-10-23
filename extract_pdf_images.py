#!/usr/bin/env python3
"""
Extract images from PDF and save as JPG files
"""

import fitz  # PyMuPDF
import os
from PIL import Image
import io

def extract_images_from_pdf(pdf_path, output_dir="extracted_images"):
    """Extract all images from PDF and save as JPG files"""
    
    # Create output directory
    os.makedirs(output_dir, exist_ok=True)
    
    # Open PDF
    doc = fitz.open(pdf_path)
    
    print(f"PDF has {len(doc)} pages")
    
    image_count = 0
    
    for page_num in range(len(doc)):
        page = doc[page_num]
        
        # Get images from page
        image_list = page.get_images()
        
        print(f"Page {page_num + 1}: Found {len(image_list)} images")
        
        for img_index, img in enumerate(image_list):
            # Get image data
            xref = img[0]
            pix = fitz.Pixmap(doc, xref)
            
            # Skip if image is too small (likely not a Rathaus)
            if pix.width < 200 or pix.height < 200:
                pix = None
                continue
                
            # Convert to PIL Image
            if pix.n - pix.alpha < 4:  # GRAY or RGB
                img_data = pix.tobytes("png")
                pil_image = Image.open(io.BytesIO(img_data))
                
                # Convert to RGB if necessary
                if pil_image.mode != 'RGB':
                    pil_image = pil_image.convert('RGB')
                
                # Save as JPG
                image_count += 1
                filename = f"{image_count:03d}_Rathaus_Seite_{image_count}.jpg"
                filepath = os.path.join(output_dir, filename)
                
                # Resize if too large (max 1920px width)
                if pil_image.width > 1920:
                    ratio = 1920 / pil_image.width
                    new_height = int(pil_image.height * ratio)
                    pil_image = pil_image.resize((1920, new_height), Image.Resampling.LANCZOS)
                
                pil_image.save(filepath, "JPEG", quality=85, optimize=True)
                print(f"Saved: {filename} ({pil_image.width}x{pil_image.height})")
                
            pix = None
    
    doc.close()
    print(f"\nExtracted {image_count} images to {output_dir}/")
    return image_count

if __name__ == "__main__":
    # You need to provide the PDF path
    pdf_path = input("Enter path to PDF file: ").strip()
    
    if not os.path.exists(pdf_path):
        print(f"Error: PDF file not found: {pdf_path}")
        exit(1)
    
    print(f"Extracting images from: {pdf_path}")
    count = extract_images_from_pdf(pdf_path)
    print(f"Done! Extracted {count} images.")
