import { chromium } from "playwright";
import fs from "fs";

(async () => {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    viewport: { width: 430, height: 932 }, // iPhone 14 Pro Max
    deviceScaleFactor: 3,
  });
  const page = await context.newPage();

  // Collect console errors
  const consoleErrors = [];
  page.on("console", (msg) => {
    if (msg.type() === "error") consoleErrors.push(msg.text());
  });

  // 1. Load page
  console.log("Step 1: Loading page...");
  await page.goto("http://localhost:3311/", { waitUntil: "networkidle", timeout: 15000 });
  await page.waitForTimeout(1000);

  // Screenshot: initial state
  await page.screenshot({ path: "/tmp/v1-initial.png", fullPage: false });
  console.log("  Screenshot: /tmp/v1-initial.png");

  // Check for license errors in console
  const licenseErrors = consoleErrors.filter((e) => e.includes("license") || e.includes("License"));
  if (licenseErrors.length > 0) {
    console.log("  ❌ LICENSE ERRORS FOUND:");
    licenseErrors.forEach((e) => console.log("    " + e));
  } else {
    console.log("  ✅ No license errors in console");
  }

  // 2. Check the city select renders
  console.log("Step 2: Check city select...");
  const citySelect = page.locator(".MuiSelect-select, .MuiOutlinedInput-root").first();
  const cityVisible = await citySelect.isVisible().catch(() => false);
  console.log(cityVisible ? "  ✅ City select visible" : "  ❌ City select NOT visible");

  // 3. Check the date field renders with label "出行日期"
  console.log("Step 3: Check date range field...");
  const dateLabel = page.locator("label").filter({ hasText: "出行日期" });
  const dateLabelVisible = await dateLabel.isVisible().catch(() => false);
  console.log(dateLabelVisible ? "  ✅ '出行日期' label visible" : "  ❌ '出行日期' label NOT visible");

  const dateField = page.locator("input").filter({ hasText: "" }).nth(1);
  const dateFieldValue = await page.locator('input[value*="2026"], input[readonly]').first().evaluate((el) => el.value || el.getAttribute("value") || "").catch(() => "");
  console.log("  Date field value:", dateFieldValue || "(empty — may be rendered via React state)");

  // 4. Click the date field to open the popover
  console.log("Step 4: Click date field to open popover...");
  const dateInputArea = page.locator(".MuiOutlinedInput-root").nth(1);
  await dateInputArea.click();
  await page.waitForTimeout(800);

  await page.screenshot({ path: "/tmp/v2-popover-open.png", fullPage: false });
  console.log("  Screenshot: /tmp/v2-popover-open.png");

  // Check if popover/calendar appeared
  const calendar = page.locator(".MuiDateCalendar-root, .MuiPickersCalendarHeader-label, [class*='Calendar']");
  const calendarVisible = await calendar.first().isVisible().catch(() => false);
  console.log(calendarVisible ? "  ✅ Calendar popover visible" : "  ❌ Calendar popover NOT visible");

  // 5. Check for range hint text
  const hintText = await page.locator(".MuiTypography-caption, [class*='caption']").first().textContent().catch(() => "");
  console.log("  Hint text:", hintText);

  // 6. Select a start date (click a day cell)
  console.log("Step 5: Select dates in calendar...");
  const dayButtons = page.locator("button").filter({ hasText: /^\d+$/ });
  const dayCount = await dayButtons.count();
  console.log(`  Found ${dayCount} day buttons`);

  if (dayCount > 5) {
    // Click day 10 (start)
    await dayButtons.nth(4).click();
    await page.waitForTimeout(300);
    await page.screenshot({ path: "/tmp/v3-start-selected.png", fullPage: false });
    console.log("  Screenshot: /tmp/v3-start-selected.png (start selected)");

    // Click day 15 (end)
    await dayButtons.nth(9).click();
    await page.waitForTimeout(300);
    await page.screenshot({ path: "/tmp/v4-end-selected.png", fullPage: false });
    console.log("  Screenshot: /tmp/v4-end-selected.png (end selected)");

    // Click confirm button
    const confirmBtn = page.locator("button").filter({ hasText: "确定" });
    const confirmVisible = await confirmBtn.isVisible().catch(() => false);
    if (confirmVisible) {
      await confirmBtn.click();
      await page.waitForTimeout(500);
      await page.screenshot({ path: "/tmp/v5-committed.png", fullPage: false });
      console.log("  Screenshot: /tmp/v5-committed.png (range committed)");
    } else {
      console.log("  ⚠️ Confirm button not found");
    }
  }

  // 7. Final state
  console.log("\nStep 6: Final state...");
  await page.screenshot({ path: "/tmp/v6-final.png", fullPage: false });
  console.log("  Screenshot: /tmp/v6-final.png");

  // Final console error check
  console.log("\n--- Console Errors (all) ---");
  if (consoleErrors.length === 0) {
    console.log("  ✅ No console errors");
  } else {
    consoleErrors.forEach((e) => console.log("  ⚠️ " + e.substring(0, 200)));
  }

  await browser.close();
})();
