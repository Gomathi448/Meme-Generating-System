import { test, expect } from "@playwright/test";

const BASE_URL = "http://localhost:5173";

test.describe("AI Meme Generating System - E2E Core Flow", () => {
  test("User signup, meme creation, gallery visibility, and dashboard validation", async ({ page }) => {
    // 1. Visit signup and create a sandbox account
    await page.goto(`${BASE_URL}/signup`);
    await expect(page.locator("h2")).toContainText("Create Account");

    const testUser = `test_creator_${Math.floor(Math.random() * 1000)}`;
    
    await page.fill('input[placeholder="e.g. template@gmail.com"]', `${testUser}@gmail.com`);
    await page.fill('input[placeholder="e.g. MemeCreator99"]', testUser);
    await page.fill('input[placeholder="••••••••"]', "password123");
    
    // Choose Administrator role so we can check administrative telemetry dashboards
    await page.selectOption('select', 'ADMIN');
    await page.click('button[type="submit"]');

    // Auto redirection to Landing Home Page
    await page.waitForURL(`${BASE_URL}/`);
    await expect(page.locator("h1")).toContainText("Generate Premium Memes Instantly");

    // 2. Navigate to AI Meme Generator page
    await page.click('text=Launch AI Generator');
    await page.waitForURL(`${BASE_URL}/generator`);
    await expect(page.locator("h2").first()).toContainText("AI meme editor");

    // Type a prompt topic and generate caption variants
    await page.fill('textarea[placeholder*="junior developer pushes code"]', "When compiler error fixes itself on Saturday");
    await page.click('text=Generate AI Caption variants');

    // Verify caption variants returned from NLP engine
    const variantItem = page.locator('button:has-text("Score:")').first();
    await expect(variantItem).toBeVisible();
    await variantItem.click();

    // Verify caption fills top and bottom text fields
    const topTextVal = await page.inputValue('input[className*="border-2 border-black p-2"]:nth-of-type(1)');
    expect(topTextVal.length).toBeGreaterThan(0);

    // Save Meme to the server
    await page.click('text=Save Meme');
    
    // Check if direct download button gets populated
    const downloadBtn = page.locator('a[title="Download PNG directly"]');
    await expect(downloadBtn).toBeVisible();

    // 3. Browse published creations in Trending Gallery
    await page.click('text=Trending Gallery');
    await page.waitForURL(`${BASE_URL}/gallery`);
    await expect(page.locator("h2")).toContainText("Trending Gallery");

    // Verify our new meme is visible in feed
    const memeCard = page.locator('h3:has-text("My Awesome Meme")').first();
    await expect(memeCard).toBeVisible();

    // Toggle a like on the card
    const likeBtn = page.locator('button[aria-label="Like meme"]').first();
    await likeBtn.click();
    await expect(likeBtn).toHaveClass(/text-brand-pink/); // should animate to pink color

    // Open and leave comment
    await page.locator('button[aria-label="Open comments panel"]').first().click();
    await page.fill('input[placeholder*="caption review"]', "This is a genius NLP translation choice!");
    await page.click('button[type="submit"]');
    await expect(page.locator('p:has-text("genius NLP translation")')).toBeVisible();

    // 4. Access Creator Cockpit
    await page.click('text=User Dashboard');
    await page.waitForURL(`${BASE_URL}/dashboard/user`);
    await expect(page.locator("h2")).toContainText("Creator Dashboard");
    
    // Quota should show at least 1 usage
    await expect(page.locator("text=/Quota Used/")).toBeVisible();

    // 5. Access Admin Configuration Dashboards
    await page.click('text=System Admin');
    await page.waitForURL(`${BASE_URL}/dashboard/admin`);
    await expect(page.locator("h2")).toContainText("System Administration");

    // Toggle vision setting toggle
    const toggleBtn = page.locator('button:has-text("Vision Analysis")');
    await expect(toggleBtn).toBeVisible();

    // 6. Access AI telemetry dashboard
    await page.click('text=AI Pipeline Monitor');
    await page.waitForURL(`${BASE_URL}/dashboard/ai-model`);
    await expect(page.locator("h2")).toContainText("AI Pipeline Monitor");

    // Vote on a prompt log to tune models
    const thumbsUpBtn = page.locator('button[title*="Good generation"]').first();
    await thumbsUpBtn.click();
    await expect(thumbsUpBtn).toHaveClass(/bg-brand-green/); // color turns green on feedback save
  });
});
