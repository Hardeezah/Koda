import os

import instructor
from groq import AsyncGroq
from tenacity import retry, stop_after_attempt, wait_exponential

from app.domain.models.vision import ProductAttributes
from app.infrastructure.ai.prompts import VISION_PIPELINE_SYSTEM_PROMPT


class VisionPipeline:
    def __init__(self):
        self.client = instructor.from_groq(AsyncGroq(api_key=os.environ.get("GROQ_API_KEY")), mode=instructor.Mode.JSON)
        self.vision_model = os.environ.get("GROQ_VISION_MODEL", "qwen/qwen3.6-27b")

    def _strip_data_prefix(self, base64_image: str) -> str:
        if "," in base64_image:
            return base64_image.split(",", 1)[1]
        return base64_image

    @retry(wait=wait_exponential(min=1, max=10), stop=stop_after_attempt(3))
    async def identify_product(self, base64_image: str) -> ProductAttributes:
        image_data = self._strip_data_prefix(base64_image)

        return await self.client.chat.completions.create(
            messages=[
                {
                    "role": "user",
                    "content": [
                        {
                            "type": "image_url",
                            "image_url": {"url": f"data:image/jpeg;base64,{image_data}"},
                        },
                        {
                            "type": "text",
                            "text": VISION_PIPELINE_SYSTEM_PROMPT,
                        },
                    ],
                }
            ],
            response_model=ProductAttributes,
            model=self.vision_model,
            temperature=0.1,
            max_tokens=2048,
        )


vision_pipeline = VisionPipeline()
