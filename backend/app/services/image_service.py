import os
import base64
import re
import time
import random
from io import BytesIO
from typing import List
from PIL import Image, ImageDraw, ImageFont
import requests



class ImageService:
    def __init__(self):
        # Local mock CDN path
        self.static_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "static"))
        self.memes_dir = os.path.join(self.static_dir, "generated_memes")
        self.templates_dir = os.path.join(self.static_dir, "templates")
        
        # Ensure directories exist
        os.makedirs(self.memes_dir, exist_ok=True)
        os.makedirs(self.templates_dir, exist_ok=True)
        
        # Load system fonts
        self.font_paths = [
            "C:\\Windows\\Fonts\\impact.ttf",
            "C:\\Windows\\Fonts\\arial.ttf",
            "/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf",
            "/usr/share/fonts/truetype/liberation/LiberationSans-Bold.ttf",
            "arial.ttf",
            "impact.ttf"
        ]

    def _get_font(self, font_size: int) -> ImageFont.ImageFont:
        for path in self.font_paths:
            if os.path.exists(path):
                try:
                    return ImageFont.truetype(path, font_size)
                except Exception:
                    pass
        try:
            return ImageFont.truetype("arial.ttf", font_size)
        except Exception:
            return ImageFont.load_default()

    def decode_base64_image(self, base64_str: str) -> Image.Image:
        """
        Decodes a base64 encoded image string (data:image/png;base64,...) into a PIL Image.
        """
        # Strip header if present
        if "base64," in base64_str:
            base64_str = base64_str.split("base64,")[1]
        
        img_data = base64.b64decode(base64_str)
        return Image.open(BytesIO(img_data)).convert("RGB")

    def download_url_image(self, url: str) -> Image.Image:
        """
        Downloads an image from a URL and returns a PIL Image.
        """
        res = requests.get(url, timeout=10)
        res.raise_for_status()
        return Image.open(BytesIO(res.content)).convert("RGB")

    def draw_text_with_outline(self, draw: ImageDraw.ImageDraw, text: str, x: int, y: int, font: ImageFont.ImageFont, position: str = "top"):
        """
        Draws text with a thick black border for high legibility (classic meme style).
        """
        # Draw outline (offset in 8 directions)
        outline_color = (0, 0, 0)
        fill_color = (255, 255, 255)
        
        # Simple text drawing with outline offset
        for offset_x in [-2, -1, 0, 1, 2]:
            for offset_y in [-2, -1, 0, 1, 2]:
                if offset_x != 0 or offset_y != 0:
                    draw.text((x + offset_x, y + offset_y), text, font=font, fill=outline_color)
        
        draw.text((x, y), text, font=font, fill=fill_color)

    def wrap_text(self, text: str, font: ImageFont.ImageFont, max_width: int) -> List[str]:
        """
        Splits text into multiple lines that fit within max_width.
        """
        words = text.split()
        lines = []
        current_line = []
        
        for word in words:
            # Check length of current line + new word
            test_line = " ".join(current_line + [word])
            # getbbox returns (left, top, right, bottom)
            bbox = font.getbbox(test_line)
            w = bbox[2] - bbox[0]
            if w <= max_width:
                current_line.append(word)
            else:
                if current_line:
                    lines.append(" ".join(current_line))
                    current_line = [word]
                else:
                    lines.append(word)
                    current_line = []
                    
        if current_line:
            lines.append(" ".join(current_line))
        return lines

    def generate_meme(self, base_image: Image.Image, top_text: str, bottom_text: str, template_name: Optional[str] = None) -> str:
        """
        Overlays top_text and bottom_text on the base image, saves it, and returns the file path/URL.
        Supports layout overlays for templates like 'Distracted Boyfriend' and 'Two Buttons'.
        """
        # Create a copy to avoid mutating source image
        img = base_image.copy()
        width, height = img.size
        
        # Draw context
        draw = ImageDraw.Draw(img)
        
        # Setup helper text drawing with black outline
        def draw_centered_text(text: str, cx: int, cy: int, font: ImageFont.ImageFont, max_w: int):
            lines = self.wrap_text(text.upper(), font, max_w)
            line_height = font.getbbox("A")[3] - font.getbbox("A")[1]
            current_y = cy
            for line in lines:
                bbox = font.getbbox(line)
                line_w = bbox[2] - bbox[0]
                x = cx - (line_w // 2)
                self.draw_text_with_outline(draw, line, x, current_y, font)
                current_y += line_height + 4

        # Check template configurations
        is_distracted = template_name and "distracted" in template_name.lower()
        is_two_buttons = template_name and "two buttons" in template_name.lower()

        if is_distracted:
            # Distracted Boyfriend roles layout:
            # top_text = Other Woman (left concept)
            # bottom_text = Boyfriend (center concept) | Girlfriend (right concept)
            parts = bottom_text.split("|")
            boy_txt = parts[0].strip() if len(parts) > 0 else ""
            girl_txt = parts[1].strip() if len(parts) > 1 else ""
            other_txt = top_text.strip()
            
            label_font_size = int(height * 0.05)
            font = self._get_font(label_font_size)
            max_label_w = int(width * 0.25)
            
            if other_txt:
                draw_centered_text(other_txt, int(width * 0.18), int(height * 0.68), font, max_label_w)
            if boy_txt:
                draw_centered_text(boy_txt, int(width * 0.50), int(height * 0.58), font, max_label_w)
            if girl_txt:
                draw_centered_text(girl_txt, int(width * 0.80), int(height * 0.70), font, max_label_w)
                
        elif is_two_buttons:
            # Two Buttons layout:
            # top_text = Button 1 | Button 2
            # bottom_text = Decision Maker
            parts = top_text.split("|")
            btn1_txt = parts[0].strip() if len(parts) > 0 else ""
            btn2_txt = parts[1].strip() if len(parts) > 1 else ""
            user_txt = bottom_text.strip()
            
            label_font_size = int(height * 0.045)
            font = self._get_font(label_font_size)
            max_btn_w = int(width * 0.22)
            
            if btn1_txt:
                draw_centered_text(btn1_txt, int(width * 0.25), int(height * 0.18), font, max_btn_w)
            if btn2_txt:
                draw_centered_text(btn2_txt, int(width * 0.45), int(height * 0.15), font, max_btn_w)
            if user_txt:
                user_font = self._get_font(int(height * 0.06))
                draw_centered_text(user_txt, int(width * 0.50), int(height * 0.82), user_font, int(width * 0.5))
                
        else:
            # Find template box count (Drake = 2, Distracted = 3, Two Buttons = 3)
            box_count_map = {
                "Clown Applying Makeup": 4,
                "Brain Expansion": 4,
                "American Chopper Argument": 5,
                "Buff Doge vs Cheems": 4,
                "Grus Plan": 4
            }
            count = box_count_map.get(template_name, 2) if template_name else 2
            
            if count > 2:
                # Multi-box layout: distribute text panels vertically down standard templates!
                parts_top = [p.strip() for p in top_text.split("|")]
                parts_bottom = [p.strip() for p in bottom_text.split("|")]
                top_count = (count + 1) // 2
                
                values = []
                for i in range(count):
                    if i < top_count:
                        values.append(parts_top[i] if i < len(parts_top) else "")
                    else:
                        values.append(parts_bottom[i - top_count] if (i - top_count) < len(parts_bottom) else "")
                        
                panel_font_size = int(height * 0.045)
                font = self._get_font(panel_font_size)
                max_w = int(width * 0.85)
                
                for idx, val in enumerate(values):
                    if not val:
                        continue
                    cy = int(((idx + 0.5) / count) * height)
                    draw_centered_text(val, width // 2, cy - (panel_font_size // 2), font, max_w)
            else:
                # Standard Top/Bottom layout: dynamically scale font size to fit text and prevent overlap
                text_len = max(len(top_text), len(bottom_text))
                if text_len > 40:
                    font_size = int(height * 0.055)
                elif text_len > 25:
                    font_size = int(height * 0.07)
                else:
                    font_size = int(height * 0.08)
                    
                font = self._get_font(font_size)
                max_text_width = int(width * 0.9)
                
                # Format and draw top text (pinned to top edge)
                if top_text:
                    top_lines = self.wrap_text(top_text.upper(), font, max_text_width)
                    line_height = font.getbbox("A")[3] - font.getbbox("A")[1]
                    y_offset = int(height * 0.03)
                    for line in top_lines:
                        bbox = font.getbbox(line)
                        line_w = bbox[2] - bbox[0]
                        x = (width - line_w) // 2
                        self.draw_text_with_outline(draw, line, x, y_offset, font)
                        y_offset += line_height + 4

                # Format and draw bottom text (pinned to bottom edge)
                if bottom_text:
                    bottom_lines = self.wrap_text(bottom_text.upper(), font, max_text_width)
                    line_height = font.getbbox("A")[3] - font.getbbox("A")[1]
                    y_offset = height - int(height * 0.04) - (len(bottom_lines) * (line_height + 4))
                    for line in bottom_lines:
                        bbox = font.getbbox(line)
                        line_w = bbox[2] - bbox[0]
                        x = (width - line_w) // 2
                        self.draw_text_with_outline(draw, line, x, y_offset, font)
                        y_offset += line_height + 4

        # Save to static memes directory
        filename = f"meme_{int(time.time())}_{random.randint(1000, 9999)}.png"
        filepath = os.path.join(self.memes_dir, filename)
        img.save(filepath, "PNG")
        
        # Return local path that can be served via static endpoint
        return f"/static/generated_memes/{filename}"

    def create_initial_templates(self):
        """
        Pre-populates basic meme templates with placeholders to ensure a working library immediately.
        """
        # Let's seed real image templates from standard resources (matching our 30 templates json)
        templates = [
            {"name": "Distracted Boyfriend", "color": (255, 100, 100), "url": "https://imgflip.com/s/meme/Distracted-Boyfriend.jpg", "filename": "distracted_boyfriend.png"},
            {"name": "Drake Hotline Bling", "color": (255, 200, 100), "url": "https://imgflip.com/s/meme/Drake-Hotline-Bling.jpg", "filename": "drake_hotline_bling.png"},
            {"name": "Two Buttons", "color": (100, 200, 255), "url": "https://imgflip.com/s/meme/Two-Buttons.jpg", "filename": "two_buttons.png"},
            {"name": "Doge", "color": (250, 220, 150), "url": "https://imgflip.com/s/meme/Doge.jpg", "filename": "doge.png"},
            {"name": "Clown Applying Makeup", "color": (200, 100, 250), "url": "https://imgflip.com/s/meme/Clown-Applying-Makeup.jpg", "filename": "clown_applying_makeup.png"},
            {"name": "Brain Expansion", "color": (100, 250, 200), "url": "https://imgflip.com/s/meme/Expanding-Brain.jpg", "filename": "brain_expansion.png"},
            {"name": "Change My Mind", "color": (255, 255, 255), "url": "https://imgflip.com/s/meme/Change-My-Mind.jpg", "filename": "change_my_mind.png"},
            {"name": "Batman Slapping Robin", "color": (255, 255, 255), "url": "https://imgflip.com/s/meme/Batman-Slapping-Robin.jpg", "filename": "batman_slapping_robin.png"},
            {"name": "Is This a Pigeon", "color": (255, 255, 255), "url": "https://imgflip.com/s/meme/Is-This-A-Pigeon.jpg", "filename": "is_this_a_pigeon.png"},
            {"name": "Monkey Puppet", "color": (255, 255, 255), "url": "https://imgflip.com/s/meme/Monkey-Puppet.jpg", "filename": "monkey_puppet.png"},
            {"name": "Disaster Girl", "color": (255, 255, 255), "url": "https://imgflip.com/s/meme/Disaster-Girl.jpg", "filename": "disaster_girl.png"},
            {"name": "Left Exit 12 Off Ramp", "color": (255, 255, 255), "url": "https://imgflip.com/s/meme/Left-Exit-12-Off-Ramp.jpg", "filename": "left_exit_12_off_ramp.png"},
            {"name": "Mocking Spongebob", "color": (255, 255, 255), "url": "https://imgflip.com/s/meme/Mocking-Spongebob.jpg", "filename": "mocking_spongebob.png"},
            {"name": "Spider Man Double Point", "color": (255, 255, 255), "url": "https://imgflip.com/s/meme/Spiderman-Double-Point.jpg", "filename": "spiderman_double_point.png"},
            {"name": "Roll Safe Think About It", "color": (255, 255, 255), "url": "https://imgflip.com/s/meme/Roll-Safe-Think-About-It.jpg", "filename": "roll_safe.png"},
            {"name": "Once Again Asking For Support", "color": (255, 255, 255), "url": "https://imgflip.com/s/meme/Bernie-I-Am-Once-Again-Asking-For-Your-Financial-Support.jpg", "filename": "once_again_asking.png"},
            {"name": "Woman Yelling At Cat", "color": (255, 255, 255), "url": "https://imgflip.com/s/meme/Woman-Yelling-At-Cat.jpg", "filename": "woman_yelling_at_cat.png"},
            {"name": "Finding Neverland", "color": (255, 255, 255), "url": "https://imgflip.com/s/meme/Finding-Neverland.jpg", "filename": "finding_neverland.png"},
            {"name": "Evil Kermit", "color": (255, 255, 255), "url": "https://imgflip.com/s/meme/Evil-Kermit.jpg", "filename": "evil_kermit.png"},
            {"name": "Success Kid", "color": (255, 255, 255), "url": "https://imgflip.com/s/meme/Success-Kid.jpg", "filename": "success_kid.png"},
            {"name": "Boardroom Meeting Suggestion", "color": (255, 255, 255), "url": "https://imgflip.com/s/meme/Boardroom-Meeting-Suggestion.jpg", "filename": "boardroom_meeting.png"},
            {"name": "One Does Not Simply", "color": (255, 255, 255), "url": "https://imgflip.com/s/meme/One-Does-Not-Simply.jpg", "filename": "one_does_not_simply.png"},
            {"name": "The Rock Driving", "color": (255, 255, 255), "url": "https://imgflip.com/s/meme/The-Rock-Driving.jpg", "filename": "the_rock_driving.png"},
            {"name": "Sleeping Shaq", "color": (255, 255, 255), "url": "https://imgflip.com/s/meme/Sleeping-Shaq.jpg", "filename": "sleeping_shaq.png"},
            {"name": "Hard To Swallow Pills", "color": (255, 255, 255), "url": "https://imgflip.com/s/meme/Hard-To-Swallow-Pills.jpg", "filename": "hard_to_swallow_pills.png"},
            {"name": "American Chopper Argument", "color": (255, 255, 255), "url": "https://imgflip.com/s/meme/American-Chopper-Argument.jpg", "filename": "american_chopper.png"},
            {"name": "Hide the Pain Harold", "color": (255, 255, 255), "url": "https://imgflip.com/s/meme/Hide-the-Pain-Harold.jpg", "filename": "hide_the_pain_harold.png"},
            {"name": "Tuxedo Winnie The Pooh", "color": (255, 255, 255), "url": "https://imgflip.com/s/meme/Tuxedo-Winnie-The-Pooh.jpg", "filename": "tuxedo_pooh.png"},
            {"name": "Grus Plan", "color": (255, 255, 255), "url": "https://imgflip.com/s/meme/Grus-Plan.jpg", "filename": "grus_plan.png"},
            {"name": "Buff Doge vs Cheems", "color": (255, 255, 255), "url": "https://imgflip.com/s/meme/Buff-Doge-vs-Cheems.jpg", "filename": "buff_doge_vs_cheems.png"}
        ]
        
        saved_templates = []
        for temp in templates:
            filename = f"temp_{temp['name'].lower().replace(' ', '_')}.png"
            filepath = os.path.join(self.templates_dir, filename)
            
            # Download real image template if not present
            if not os.path.exists(filepath):
                download_success = False
                try:
                    res = requests.get(temp["url"], timeout=15)
                    if res.status_code == 200:
                        img = Image.open(BytesIO(res.content)).convert("RGB")
                        img.save(filepath, "PNG")
                        download_success = True
                except Exception:
                    pass
                
                # Fallback to high-res colored grid placeholder
                if not download_success:
                    img = Image.new("RGB", (600, 600), color=temp["color"])
                    draw = ImageDraw.Draw(img)
                    for i in range(0, 600, 40):
                        draw.line([(i, 0), (i, 600)], fill=(0, 0, 0, 50), width=1)
                        draw.line([(0, i), (600, i)], fill=(0, 0, 0, 50), width=1)
                    
                    font = self._get_font(28)
                    txt = f"[{temp['name']} Template]"
                    bbox = font.getbbox(txt)
                    w = bbox[2] - bbox[0]
                    h = bbox[3] - bbox[1]
                    draw.text(((600 - w) // 2, (600 - h) // 2), txt, font=font, fill=(0, 0, 0))
                    img.save(filepath, "PNG")
                
            saved_templates.append({
                "name": temp["name"],
                "url": f"/static/templates/{filename}"
            })
        return saved_templates


image_service = ImageService()
