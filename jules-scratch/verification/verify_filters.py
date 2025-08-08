import os
from playwright.sync_api import sync_playwright, expect

def run_verification(page):
    # Get the absolute path to the index.html file
    file_path = "file://" + os.path.abspath("index.html")

    # Navigate to the local HTML file
    page.goto(file_path)

    # Wait for the initial CVE list to load
    expect(page.locator('#cve-container > div').first).to_be_visible(timeout=30000)

    # Apply filters
    page.select_option('#cve-severity', 'CRITICAL')
    page.fill('#cve-keyword', 'Linux')
    page.select_option('#cve-period', '90')
    page.click('#cve-filter-btn')

    # Wait for the new CVE list to load
    expect(page.locator('#cve-container > div').first).to_be_visible(timeout=30000)

    # Wait for a moment for animations to settle
    page.wait_for_timeout(2000)

    # Take a screenshot of the page
    page.screenshot(path="jules-scratch/verification/filters_verification.png", full_page=True)

with sync_playwright() as p:
    browser = p.chromium.launch(headless=True)
    page = browser.new_page()
    run_verification(page)
    browser.close()

print("Verification script for filters executed and screenshot taken.")
