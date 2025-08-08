import os
from playwright.sync_api import sync_playwright, expect

def run_verification(page):
    # Get the absolute path to the index.html file
    # The working directory for the script is the root of the repo
    file_path = "file://" + os.path.abspath("index.html")

    # Navigate to the local HTML file
    page.goto(file_path)

    # Wait for the CVE section to load by looking for a specific CVE card element
    # We'll wait for the first card to be visible. Using a generous timeout.
    print("Waiting for CVE container to be populated...")
    expect(page.locator('#cve-container div[class*="bg-darkgray"] h4 a').first).to_be_visible(timeout=45000)
    print("CVE container populated.")

    # Hover over the first skill card to trigger the flip animation
    print("Hovering over skill card...")
    page.hover('.skill-card-container')
    print("Hovered.")

    # Wait for the animation to complete and for particles to render
    print("Waiting for animations...")
    page.wait_for_timeout(5000) # 5 seconds for animations
    print("Waited.")

    # Take a screenshot of the page
    print("Taking screenshot...")
    page.screenshot(path="jules-scratch/verification/verification.png", full_page=True)
    print("Screenshot taken.")

with sync_playwright() as p:
    browser = p.chromium.launch(headless=True)
    page = browser.new_page()
    run_verification(page)
    browser.close()

print("Verification script executed and screenshot taken.")
