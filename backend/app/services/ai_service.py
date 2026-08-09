import time
import random
from typing import List, Dict, Optional
import requests
from app.core.config import settings

class AIService:
    def __init__(self):
        self.openai_key = settings.OPENAI_API_KEY
        self.active_model = "gpt-4o-mini"
        
        # Local keyword mapping dictionaries for realistic mock generation
        self.meme_templates_pool = {
            "wholesome": [
                {"top": "Me finding a small detail", "bottom": "To appreciate about you", "base_score": 88.0},
                {"top": "My dog watching me", "bottom": "Do literally anything at all", "base_score": 92.5},
                {"top": "Supportive friends", "bottom": "Celebrating my tiny achievements", "base_score": 95.0},
                {"top": "When you think you failed", "bottom": "But everyone was super proud of you", "base_score": 89.0}
            ],
            "sarcastic": [
                {"top": "Oh, you code on weekends?", "bottom": "Please tell me more about your rich social life", "base_score": 94.0},
                {"top": "My code works on the first try", "bottom": "And other hilarious jokes I tell myself", "base_score": 96.0},
                {"top": "Me pretending to listen", "bottom": "While estimating how many coffees I need to survive", "base_score": 91.5},
                {"top": "Telling the customer it is a feature", "bottom": "When it clearly crashed the database", "base_score": 93.0}
            ],
            "dark": [
                {"top": "Production servers crashing at 4:59 PM", "bottom": "On a Friday before my 2-week vacation", "base_score": 87.5},
                {"top": "Checking stack overflow for answers", "bottom": "Question marked as duplicate by a deleted user in 2012", "base_score": 90.0},
                {"top": "Me checking my bank account", "bottom": "To see if I can afford basic breathing rights", "base_score": 85.0},
                {"top": "Staring into the void", "bottom": "Hoping the void has documentation for legacy code", "base_score": 89.0}
            ],
            "corporate": [
                {"top": "Per my last email", "bottom": "Which clearly went directly into your trash bin", "base_score": 91.0},
                {"top": "Let us take this offline", "bottom": "Because I cannot explain this to you without weeping", "base_score": 93.5},
                {"top": "Synergizing resources for the deliverables", "bottom": "Meaning we are all working late on Zoom", "base_score": 88.0},
                {"top": "We are like a family here", "bottom": "If your family is a corporate hunger games sequel", "base_score": 95.0}
            ]
        }

    def set_model_version(self, version: str):
        self.active_model = version

    def analyze_sentiment(self, text: str) -> float:
        """
        Returns sentiment score between -1.0 (very negative/dark) and 1.0 (very wholesome/positive).
        Uses a quick rule-based keyword scan in mock mode, or calls HuggingFace/OpenAI in API mode.
        """
        if self.openai_key:
            try:
                # Real OpenAI call simulation or direct endpoint
                return self._call_openai_sentiment(text)
            except Exception:
                pass # fall back to local rule-based engine
        
        # Rule-based fallback
        positive_words = ["love", "happy", "wholesome", "cute", "friend", "dog", "nice", "great", "good", "beautiful"]
        negative_words = ["sad", "dark", "die", "crash", "dead", "hate", "bad", "worst", "fail", "empty", "void"]
        text_lower = text.lower()
        
        pos_count = sum(1 for w in positive_words if w in text_lower)
        neg_count = sum(1 for w in negative_words if w in text_lower)
        
        if pos_count == 0 and neg_count == 0:
            return 0.1  # slightly positive/neutral
        
        total = pos_count + neg_count
        return (pos_count - neg_count) / total

    def generate_caption_variants(self, prompt: str, tone: str = "sarcastic", language: str = "en", template_name: Optional[str] = None) -> List[Dict]:
        """
        Generates 4 caption variants, returns a list of dictionaries with top/bottom text, scores, explanation.
        """
        start_time = time.time()
        
        if self.openai_key:
            # Let API errors bubble up so they are shown to the user
            return self._call_openai_captions(prompt, tone, language, template_name)
        
        # NLP simulation: Generate responses based on prompt, tone, and template name
        time.sleep(0.4) # simulate network latency (400ms)
        tone = tone.lower()
        
        # Check template-specific layout mock pools
        if template_name and "distracted" in template_name.lower():
            # Distracted Boyfriend roles: Other Woman (left), Boyfriend (center), Girlfriend (right)
            topics = [
                {"other": "NEW COMPILING TOOL", "boy": "WEB DEVELOPER", "girl": "STABLE OLD CONFIGS"},
                {"other": "ANOTHER CUP OF COFFEE", "boy": "ME", "girl": "MY ESTIMATION LIMITS"},
                {"other": "DIRECT PRODUCTION PUSH", "boy": "JUNIOR DEV", "girl": "PULL REQUEST REVIEW"},
                {"other": "STARE AT THE VOID", "boy": "DEVELOPER", "girl": "LEGACY CODE DOCS"}
            ]
            
            prompt_lower = prompt.lower()
            if "coffee" in prompt_lower or "estimate" in prompt_lower or "estimating" in prompt_lower:
                topics.insert(0, {"other": "ANOTHER CUP OF COFFEE", "boy": "ME", "girl": "MY ESTIMATION LIMITS"})
            elif "code" in prompt_lower or "prod" in prompt_lower:
                topics.insert(0, {"other": "DIRECT PRODUCTION PUSH", "boy": "JUNIOR DEV", "girl": "PULL REQUEST REVIEW"})

            variants = []
            for i, t_data in enumerate(topics[:4]):
                top = t_data["other"]
                bottom = f"{t_data['boy']} | {t_data['girl']}"
                humor = 96.0 - (i * 2.0)
                variants.append({
                    "top_text": top.upper(),
                    "bottom_text": bottom.upper(),
                    "sentiment_score": -0.2,
                    "humor_score": humor,
                    "virality_score": humor + random.uniform(-4, 4),
                    "explanation": f"Distracted Boyfriend role mapping: Other Woman = '{t_data['other']}', Boyfriend = '{t_data['boy']}', Girlfriend = '{t_data['girl']}'."
                })
            return variants

        elif template_name and "two buttons" in template_name.lower():
            # Two Buttons layout: Button 1 (left button), Button 2 (right button), Decision Maker (bottom)
            topics = [
                {"btn1": "FIX THE BUG", "btn2": "REWRITE EVERYTHING", "user": "TIRED PROGRAMMER"},
                {"btn1": "DRINK COFFEE", "btn2": "GO TO SLEEP", "user": "DEVELOPER AT 2 AM"},
                {"btn1": "DEPLOY FRIDAY", "btn2": "WAIT FOR MONDAY", "user": "PROJECT MANAGER"},
                {"btn1": "WRITE TESTS", "btn2": "YOLO RUN", "user": "JUNIOR DEV"}
            ]
            
            prompt_lower = prompt.lower()
            if "coffee" in prompt_lower or "sleep" in prompt_lower:
                topics.insert(0, {"btn1": "DRINK COFFEE", "btn2": "GO TO SLEEP", "user": "DEVELOPER AT 2 AM"})
            elif "estimate" in prompt_lower:
                topics.insert(0, {"btn1": "OVERESTIMATE BY 3X", "btn2": "TELL THE TRUTH", "user": "JUNIOR DEVELOPER"})

            variants = []
            for i, t_data in enumerate(topics[:4]):
                top = f"{t_data['btn1']} | {t_data['btn2']}"
                bottom = t_data["user"]
                humor = 95.0 - (i * 2.5)
                variants.append({
                    "top_text": top.upper(),
                    "bottom_text": bottom.upper(),
                    "sentiment_score": -0.1,
                    "humor_score": humor,
                    "virality_score": humor + random.uniform(-3, 3),
                    "explanation": f"Two Buttons layout: Button 1 = '{t_data['btn1']}', Button 2 = '{t_data['btn2']}', Selector = '{t_data['user']}'."
                })
            return variants

        # Fallback to standard top/bottom text pools
        if tone not in self.meme_templates_pool:
            tone = "sarcastic"
            
        pool = self.meme_templates_pool[tone]
        variants = []
        
        # We will dynamically adapt the templates using words from the prompt
        words = [w.strip(",.?!") for w in prompt.split() if len(w) > 3]
        keyword = words[0] if words else "coding"
        if len(keyword) > 15:
            keyword = keyword[:15]
            
        for i, template in enumerate(pool):
            top_text = template["top"]
            bottom_text = template["bottom"]
            
            # Smart replacement: swap some text if appropriate keywords exist
            if "code" in top_text.lower() or "finding" in top_text.lower() or "checking" in top_text.lower():
                if words:
                    # Inject prompt word
                    top_text = top_text.replace("code", keyword).replace("detail", keyword).replace("Stack Overflow", keyword)
            
            # Simple translation mapping for demo/languages
            if language.lower() == "es":
                top_text = f"¿{top_text}?"
                bottom_text = f"Y así terminamos..." if i % 2 == 0 else f"{bottom_text} (en Español)"
            elif language.lower() == "fr":
                top_text = f"Le {top_text}"
                bottom_text = f"C'est la vie: {bottom_text}"
            
            sentiment = self.analyze_sentiment(prompt)
            sentiment_adjust = (sentiment * 10.0) if tone == "wholesome" else (sentiment * -10.0)
            
            # Calculate Scores
            humor = min(100.0, max(50.0, template["base_score"] + random.uniform(-5.0, 5.0)))
            virality = min(100.0, max(50.0, humor + sentiment_adjust + random.uniform(-8.0, 8.0)))
            
            variants.append({
                "top_text": top_text.upper(),
                "bottom_text": bottom_text.upper(),
                "sentiment_score": round(sentiment, 2),
                "humor_score": round(humor, 1),
                "virality_score": round(virality, 1),
                "explanation": f"Humor matched with prompt keyword '{keyword}' in a {tone} context."
            })
            
        return sorted(variants, key=lambda x: x["humor_score"], reverse=True)


    def suggest_vision_captions(self, image_data_url: str) -> Dict:
        """
        Suggest context-aware captions based on uploaded image (represented as base64 URL).
        """
        time.sleep(0.6) # simulate vision model execution
        
        # Analyze the base64 URL for demo contexts, or just return realistic generic meme templates
        # We simulate visual detection e.g. "We detected a person holding a laptop..."
        detections = [
            "A developer typing frantically on a keyboard",
            "An adorable kitten looking at a computer screen",
            "Two buttons with conflicting choices",
            "A person looking back at another person while their partner looks angry"
        ]
        chosen_detection = random.choice(detections)
        
        # Generate associated meme options
        suggested = [
            {
                "top_text": "ME TRYING TO FIX A PRODUCTION BUG",
                "bottom_text": "WITHOUT RESTARTING THE SERVER",
                "sentiment_score": -0.3,
                "humor_score": 92.0,
                "virality_score": 88.5,
                "explanation": "Matches frantic keyboard typing visual description."
            },
            {
                "top_text": "WHEN I START A NEW TUTORIAL",
                "bottom_text": "AND I ALREADY FORGOT WHAT STEP 1 WAS",
                "sentiment_score": -0.1,
                "humor_score": 89.0,
                "virality_score": 91.0,
                "explanation": "Relatable educational struggle theme."
            },
            {
                "top_text": "IT COMPILING",
                "bottom_text": "VS IT ACTUALLY WORKING",
                "sentiment_score": 0.2,
                "humor_score": 95.0,
                "virality_score": 97.0,
                "explanation": "Classic double-sided programming humor."
            }
        ]
        
        return {
            "description": chosen_detection,
            "suggested_captions": suggested
        }

    def _call_openai_sentiment(self, text: str) -> float:
        # Mock request to OpenAI API
        headers = {"Authorization": f"Bearer {self.openai_key}"}
        payload = {
            "model": "gpt-4o-mini",
            "messages": [
                {"role": "system", "content": "You are a sentiment analyzer. Return ONLY a single float between -1.0 and 1.0 representation of the text sentiment. No other text."},
                {"role": "user", "content": text}
            ]
        }
        res = requests.post("https://api.openai.com/v1/chat/completions", json=payload, headers=headers, timeout=5)
        if res.status_code == 200:
            val = res.json()["choices"][0]["message"]["content"].strip()
            return float(val)
        raise Exception("API error")

    def _call_openai_captions(self, prompt: str, tone: str, language: str, template_name: Optional[str] = None) -> List[Dict]:
        headers = {"Authorization": f"Bearer {self.openai_key}"}
        system_content = f"You are a master meme caption generator. Return a JSON array containing 4 items. Each item must have 'top_text', 'bottom_text', 'sentiment_score' (float -1 to 1), 'humor_score' (0-100), 'virality_score' (0-100), and 'explanation'. Translate and generate captions in language: {language}. Tone must be {tone}."
        if template_name:
            system_content += f" The user selected the template: '{template_name}'."
            if "distracted" in template_name.lower():
                system_content += " For the 'Distracted Boyfriend' template, pack the three roles into the fields: top_text is the label for the 'Other Woman' (left), and bottom_text is formatted exactly as 'Boyfriend Label | Girlfriend Label' (divided by a pipe character '|')."
            elif "two buttons" in template_name.lower():
                system_content += " For the 'Two Buttons' template, pack the three roles into the fields: top_text is formatted exactly as 'Button 1 Label | Button 2 Label' (divided by a pipe character '|'), and bottom_text is the label for the 'Decision Maker' at the bottom."

        payload = {
            "model": "gpt-4o-mini",
            "messages": [
                {"role": "system", "content": system_content},
                {"role": "user", "content": prompt}
            ],
            "response_format": {"type": "json_object"}
        }
        res = requests.post("https://api.openai.com/v1/chat/completions", json=payload, headers=headers, timeout=10)
        if res.status_code == 200:
            import json
            data = json.loads(res.json()["choices"][0]["message"]["content"])
            # data can be like {"variants": [...]} or list
            if "variants" in data:
                return data["variants"]
            elif isinstance(data, list):
                return data
        raise Exception("API error")


ai_service = AIService()
