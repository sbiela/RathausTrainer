#!/usr/bin/env python3
import os
import re
import math
from typing import List, Tuple, Dict, Any

try:
    import fitz  # PyMuPDF
except Exception as e:
    raise SystemExit("PyMuPDF (fitz) ist nicht installiert. Installiere mit: pip install pymupdf")

# Optional OCR
try:
    from PIL import Image
    import pytesseract
    OCR_AVAILABLE = True
except Exception:
    OCR_AVAILABLE = False


def normalize_city_name(text: str) -> str:
    text = text.strip()
    text = re.sub(r"\s+", " ", text)
    return text


def rect_center(rect: fitz.Rect) -> Tuple[float, float]:
    return ((rect.x0 + rect.x1) / 2.0, (rect.y0 + rect.y1) / 2.0)


def distance(a: Tuple[float, float], b: Tuple[float, float]) -> float:
    return math.hypot(a[0] - b[0], a[1] - b[1])


def find_nearest_label(img_rect: fitz.Rect, text_spans: List[Dict[str, Any]]) -> str:
    c = rect_center(img_rect)
    best = (1e18, "")
    
    print(f"  Looking for label for image at {img_rect}")
    
    for span in text_spans:
        srect = fitz.Rect(span["bbox"])  # bbox: (x0,y0,x1,y1)
        sc = rect_center(srect)
        text = span["text"]
        
        print(f"    Text: '{text}' at {srect}")
        
        # Städtename steht links neben dem Bild (x-Koordinate kleiner)
        if sc[0] < c[0]:
            d = distance(c, sc)
            # Favor labels that are horizontally aligned (similar y-coordinate)
            y_diff = abs(sc[1] - c[1])
            if y_diff < 50:  # Within 50 pixels vertically
                d *= 0.3  # Strongly favor horizontally aligned labels
            if d < best[0]:
                best = (d, text)
                print(f"      -> New best: '{text}' (distance: {d:.1f})")
    
    result = normalize_city_name(best[1]) if best[1] else "Unbenannt"
    print(f"  -> Final result: '{result}'")
    return result


def extract_page_items(page: fitz.Page, page_index: int) -> Tuple[List[Tuple[fitz.Rect, int]], List[Dict[str, Any]]]:
    raw = page.get_text("rawdict")
    blocks = raw.get("blocks", [])
    images: List[Tuple[fitz.Rect, int]] = []
    text_spans: List[Dict[str, Any]] = []

    for b in blocks:
        if b.get("type") == 1:  # image block
            bbox = b.get("bbox")
            xref = b.get("number", -1)
            rect = fitz.Rect(bbox)
            
            # Filter out small images (likely logos) and very large images
            width = rect.x1 - rect.x0
            height = rect.y1 - rect.y0
            
            # Filter out small logos (around 55x45) and keep only large Rathaus images
            if width > 200 and height > 200:
                images.append((rect, xref))
                print(f"Page {page_index+1}: Added Rathaus image {width:.1f}x{height:.1f}")
        elif b.get("type") == 0:  # text block
            for line in b.get("lines", []):
                for span in line.get("spans", []):
                    text = span.get("text", "").strip()
                    if not text:
                        continue
                    # Debug: Print all text found
                    print(f"    Found text: '{text}' (size: {span.get('size', 0)}, bbox: {span.get('bbox')})")
                    
                    # Heuristik: Kandidaten für Städtenamen (meist kurze, größere Schrift)
                    # Erweitert: Auch kleinere Schriften berücksichtigen, aber längere Texte ausschließen
                    if len(text) <= 30 and span.get("size", 0) >= 6:
                        text_spans.append({
                            "text": text,
                            "bbox": span.get("bbox")
                        })
                        print(f"    -> Added as candidate")

    return images, text_spans


def ocr_text_from_left_of_image(page: fitz.Page, img_rect: fitz.Rect) -> str:
    if not OCR_AVAILABLE:
        return ""
    # Definiere einen linken Bereich für die OCR: von linkem Seitenrand bis kurz vor das Bild,
    # vertikal etwas größer als das Bild, um die Tabellenzeile zu erwischen
    pad_x = 10
    pad_y = 6
    left = max(0, img_rect.x0 - 360)  # breiterer Bereich: 360pt links vom Bild
    right = max(0, img_rect.x0 - 8)   # kleiner Abstand zum Bild
    top = max(0, img_rect.y0 - pad_y)
    bottom = img_rect.y1 + pad_y
    if right <= left or bottom <= top:
        return ""
    clip_rect = fitz.Rect(left, top, right, bottom)
    # Rendern mit höherem Zoom für bessere OCR
    zoom = 4.0  # Noch höherer Zoom
    mat = fitz.Matrix(zoom, zoom)
    pix = page.get_pixmap(matrix=mat, clip=clip_rect, alpha=False)
    img = Image.frombytes("RGB", [pix.width, pix.height], pix.samples)
    
    # Verbesserte Preprocessing
    img = img.convert("L")
    import numpy as np
    img_array = np.array(img)
    
    # Mehrere OCR-Versuche mit verschiedenen Einstellungen
    results = []
    
    # 1. Original
    try:
        text1 = pytesseract.image_to_string(img, lang="deu", config='--psm 6 -c tessedit_char_whitelist=ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyzÄÖÜäöüß0123456789.- ')
        if text1.strip():
            results.append(text1.strip())
    except:
        pass
    
    # 2. Mit Thresholding
    threshold = np.mean(img_array) * 0.7
    img_thresh = np.where(img_array > threshold, 255, 0).astype(np.uint8)
    img_processed = Image.fromarray(img_thresh)
    try:
        text2 = pytesseract.image_to_string(img_processed, lang="deu", config='--psm 6 -c tessedit_char_whitelist=ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyzÄÖÜäöüß0123456789.- ')
        if text2.strip():
            results.append(text2.strip())
    except:
        pass
    
    # 3. Mit invertiertem Thresholding
    img_inv = np.where(img_array < threshold, 255, 0).astype(np.uint8)
    img_inv_processed = Image.fromarray(img_inv)
    try:
        text3 = pytesseract.image_to_string(img_inv_processed, lang="deu", config='--psm 6 -c tessedit_char_whitelist=ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyzÄÖÜäöüß0123456789.- ')
        if text3.strip():
            results.append(text3.strip())
    except:
        pass
    
    # Beste Ergebnis auswählen (kürzeste sinnvolle Zeile)
    best_result = ""
    for result in results:
        lines = [line.strip() for line in result.splitlines() if line.strip()]
        for line in lines:
            # Filtere sinnvolle Städtenamen (mindestens 3 Zeichen, keine reinen Zahlen)
            if len(line) >= 3 and not line.isdigit() and not line.startswith(('0', '1', '2', '3', '4', '5', '6', '7', '8', '9')):
                if not best_result or len(line) < len(best_result):
                    best_result = line
    
    return best_result


def clean_city_from_text(text: str) -> str:
    if not text:
        return ""
    
    # Entferne führende Nummern und Punkte
    text = re.sub(r"^\d+\.?\s*", "", text)
    
    # Entferne typische Präfixe/Artefakte
    text = re.sub(r"^(Stadt|Gemeinde|Rathaus|Gemeinde|Stadt)\s+", "", text, flags=re.IGNORECASE)
    
    # Entferne überflüssige Zeichen und Artefakte
    text = re.sub(r"[\u200b\u00ad\u00a0]", "", text)  # zero-width, soft hyphen, non-breaking space
    text = re.sub(r"[^\w\s\-\.]", "", text)  # Nur Buchstaben, Zahlen, Leerzeichen, Bindestriche, Punkte
    text = re.sub(r"\s+", " ", text).strip()
    
    # Entferne führende/trailing Bindestriche und Punkte
    text = re.sub(r"^[\-\.]+|[\-\.]+$", "", text)
    
    # Korrigiere häufige OCR-Fehler
    corrections = {
        'K6ln': 'Köln',
        'Dusseldorf': 'Düsseldorf', 
        'Ménchengladba': 'Mönchengladbach',
        'Lubeck': 'Lübeck',
        'Ubermausen': 'Übermausen',
        'Mainz': 'Mainz',
        'Osnabriick': 'Osnabrück',
        'Gottingen': 'Göttingen',
        'Wurzburg': 'Würzburg',
        'Zurich': 'Zürich',
        'Genéve': 'Genève',
        'Klagenfurt_am': 'Klagenfurt am',
        'Freiburg_im': 'Freiburg im',
        'Bergisch': 'Bergisch Gladbach',
        'Acme': 'Aachen',
        'Varmstadt': 'Darmstadt',
        'vadIDIUCKell': 'Ludwigshafen',
        'nNae_RN_TN_a_TE': 'München',
        'Mt_wi_LOCALS_CEE_INS': 'München',
        'we_e': 'Weimar',
        'vena': 'Wien',
        'VV_VIAL': 'Wien'
    }
    
    for wrong, correct in corrections.items():
        if wrong in text:
            text = text.replace(wrong, correct)
    
    # Kürze auf sinnvolle Länge
    if len(text) > 40:
        text = text[:40].strip()
    
    return text


def export_crops(pdf_path: str, out_dir: str) -> None:
    os.makedirs(out_dir, exist_ok=True)
    doc = fitz.open(pdf_path)
    counter = 0
    max_images = 90  # Limit to 90 Rathäuser

    for page_index in range(len(doc)):
        if counter >= max_images:
            break
            
        page = doc[page_index]
        images, text_spans = extract_page_items(page, page_index)
        if not images:
            continue

        for img_rect, xref in images:
            if counter >= max_images:
                break
                
            # Expand rect a tiny bit to avoid tight cuts
            pad = 2
            rect = fitz.Rect(
                img_rect.x0 - pad,
                img_rect.y0 - pad,
                img_rect.x1 + pad,
                img_rect.y1 + pad,
            )

            # Render only that rect to a pixmap (higher zoom for clarity)
            zoom = 2.0
            mat = fitz.Matrix(zoom, zoom)
            clip = rect
            pix = page.get_pixmap(matrix=mat, clip=clip, alpha=False)

            # 1) Versuche OCR links neben dem Bild
            ocr_city = clean_city_from_text(ocr_text_from_left_of_image(page, img_rect))
            # 2) Falls leer, versuche die Vektor-Texte (falls vorhanden)
            city = ocr_city or find_nearest_label(img_rect, text_spans)
            # 3) Fallback: Seitenbasiert
            if not city or city == "Unbenannt":
                city = f"Rathaus_Seite_{page_index+1}"
            safe_city = re.sub(r"[^\w\- ]+", "", city).strip()
            safe_city = re.sub(r"\s+", "_", safe_city) or f"Rathaus_{counter}"
            filename = f"{counter+1:03d}_{safe_city}.png"
            out_path = os.path.join(out_dir, filename)
            pix.save(out_path)
            counter += 1

    print(f"Fertig. {counter} Bildausschnitte in '{out_dir}' gespeichert.")


if __name__ == "__main__":
    PDF = os.path.join(os.path.dirname(__file__), "Material.pdf")
    OUT = os.path.join(os.path.dirname(__file__), "export_rathaeuser")
    if not os.path.exists(PDF):
        raise SystemExit(f"PDF nicht gefunden: {PDF}")
    export_crops(PDF, OUT)


