import asyncio
from playwright.async_api import async_playwright
import pathlib

async def main():
    async with async_playwright() as p:
        browser = await p.chromium.launch()
        page = await browser.new_page()

        # Get the absolute path to the index.html file
        index_path = pathlib.Path("index.html").resolve()

        # Go to the local HTML file
        await page.goto(f"file://{index_path}")

        # Wait for the page to load
        await page.wait_for_load_state("networkidle")

        # 1. Take a screenshot of the default language (Portuguese)
        await page.wait_for_timeout(2000) # Wait for typewriter
        await page.screenshot(path="jules-scratch/verification/screenshot-pt.png", full_page=True)

        # 2. Change the language to English and take a screenshot
        await page.select_option("#language-switcher", "en")
        await page.wait_for_timeout(2000) # Wait for the translation and typewriter
        await page.screenshot(path="jules-scratch/verification/screenshot-en.png", full_page=True)

        # 3. Change the language to Spanish and take a screenshot
        await page.select_option("#language-switcher", "es")
        await page.wait_for_timeout(2000) # Wait for the translation and typewriter
        await page.screenshot(path="jules-scratch/verification/screenshot-es.png", full_page=True)

        # 4. Change the language to Russian and take a screenshot
        await page.select_option("#language-switcher", "ru")
        await page.wait_for_timeout(2000) # Wait for the translation and typewriter
        await page.screenshot(path="jules-scratch/verification/screenshot-ru.png", full_page=True)

        await browser.close()

if __name__ == "__main__":
    asyncio.run(main())
