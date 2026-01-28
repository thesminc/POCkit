/**
 * PDF Converter Service
 * POCkit Service
 *
 * Converts Markdown POC documents to PDF format using:
 * - marked: Markdown to HTML conversion
 * - puppeteer: Headless browser for PDF generation
 */

import { marked } from 'marked';
import puppeteer from 'puppeteer';
import fs from 'fs/promises';
import { createLogger } from '../config/logger';

const logger = createLogger();

export interface PDFOptions {
  format?: 'A4' | 'Letter';
  margin?: {
    top?: string;
    right?: string;
    bottom?: string;
    left?: string;
  };
  displayHeaderFooter?: boolean;
  headerTemplate?: string;
  footerTemplate?: string;
}

export class PDFConverter {
  /**
   * Convert Markdown content to PDF
   */
  async convertMarkdownToPDF(
    markdown: string,
    outputPath: string,
    options: PDFOptions = {}
  ): Promise<void> {
    let browser;

    try {
      logger.info('Starting PDF conversion', {
        markdownLength: markdown.length,
        outputPath,
      });

      // Convert markdown to HTML
      const html = await this.markdownToHTML(markdown);

      // Launch headless browser
      browser = await puppeteer.launch({
        headless: true,
        args: ['--no-sandbox', '--disable-setuid-sandbox'],
      });

      const page = await browser.newPage();

      // Set content with styled HTML
      await page.setContent(html, {
        waitUntil: 'networkidle0',
      });

      // Generate PDF
      await page.pdf({
        path: outputPath,
        format: options.format || 'A4',
        margin: options.margin || {
          top: '1in',
          right: '1in',
          bottom: '1in',
          left: '1in',
        },
        displayHeaderFooter: options.displayHeaderFooter ?? true,
        headerTemplate: options.headerTemplate || `
          <div style="font-size: 10px; text-align: center; width: 100%; margin: 0 auto; color: #666;">
            <span class="title"></span>
          </div>
        `,
        footerTemplate: options.footerTemplate || `
          <div style="font-size: 10px; text-align: center; width: 100%; margin: 0 auto; color: #666;">
            <span>Page <span class="pageNumber"></span> of <span class="totalPages"></span></span>
          </div>
        `,
        printBackground: true,
      });

      logger.info('PDF conversion completed', { outputPath });
    } catch (error: any) {
      logger.error('PDF conversion failed', {
        error: error.message,
        outputPath,
      });
      throw new Error(`PDF conversion failed: ${error.message}`);
    } finally {
      if (browser) {
        await browser.close();
      }
    }
  }

  /**
   * Convert Markdown to styled HTML
   */
  private async markdownToHTML(markdown: string): Promise<string> {
    // Configure marked options
    marked.setOptions({
      gfm: true, // GitHub Flavored Markdown
      breaks: true,
    });

    // Convert markdown to HTML
    const htmlContent = await marked.parse(markdown);

    // Wrap in styled HTML document
    const styledHTML = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <style>
    /* Base styles */
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }

    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Helvetica', 'Arial', sans-serif;
      font-size: 11pt;
      line-height: 1.6;
      color: #24292e;
      max-width: 100%;
      padding: 20px;
    }

    /* Headings */
    h1, h2, h3, h4, h5, h6 {
      margin-top: 24px;
      margin-bottom: 16px;
      font-weight: 600;
      line-height: 1.25;
      page-break-after: avoid;
    }

    h1 {
      font-size: 24pt;
      border-bottom: 2px solid #eaecef;
      padding-bottom: 0.3em;
    }

    h2 {
      font-size: 18pt;
      border-bottom: 1px solid #eaecef;
      padding-bottom: 0.3em;
    }

    h3 { font-size: 14pt; }
    h4 { font-size: 12pt; }
    h5 { font-size: 11pt; }
    h6 { font-size: 10pt; color: #6a737d; }

    /* Paragraphs and lists */
    p {
      margin-bottom: 16px;
    }

    ul, ol {
      margin-bottom: 16px;
      padding-left: 2em;
    }

    li {
      margin-bottom: 4px;
    }

    /* Code blocks */
    code {
      padding: 0.2em 0.4em;
      background-color: rgba(27, 31, 35, 0.05);
      border-radius: 3px;
      font-family: 'SF Mono', 'Monaco', 'Inconsolata', 'Courier New', monospace;
      font-size: 85%;
    }

    pre {
      padding: 16px;
      overflow: auto;
      font-size: 85%;
      line-height: 1.45;
      background-color: #f6f8fa;
      border-radius: 6px;
      margin-bottom: 16px;
      page-break-inside: avoid;
    }

    pre code {
      display: block;
      padding: 0;
      background: transparent;
      border: 0;
    }

    /* Tables */
    table {
      border-collapse: collapse;
      width: 100%;
      margin-bottom: 16px;
      page-break-inside: avoid;
    }

    table th,
    table td {
      padding: 8px 12px;
      border: 1px solid #dfe2e5;
    }

    table th {
      background-color: #f6f8fa;
      font-weight: 600;
    }

    table tr:nth-child(2n) {
      background-color: #f6f8fa;
    }

    /* Blockquotes */
    blockquote {
      padding: 0 1em;
      color: #6a737d;
      border-left: 4px solid #dfe2e5;
      margin-bottom: 16px;
    }

    /* Links */
    a {
      color: #0366d6;
      text-decoration: none;
    }

    a:hover {
      text-decoration: underline;
    }

    /* Horizontal rules */
    hr {
      height: 0.25em;
      padding: 0;
      margin: 24px 0;
      background-color: #e1e4e8;
      border: 0;
    }

    /* Images */
    img {
      max-width: 100%;
      box-sizing: content-box;
      background-color: #fff;
    }

    /* Page breaks */
    .page-break {
      page-break-after: always;
    }

    /* Print-specific styles */
    @media print {
      body {
        font-size: 10pt;
      }

      h1 { font-size: 22pt; }
      h2 { font-size: 16pt; }
      h3 { font-size: 13pt; }

      a {
        color: #000;
      }

      pre, blockquote {
        page-break-inside: avoid;
      }
    }
  </style>
</head>
<body>
  ${htmlContent}
</body>
</html>
    `;

    return styledHTML;
  }

  /**
   * Get file size in human-readable format
   */
  async getFileSize(filePath: string): Promise<string> {
    try {
      const stats = await fs.stat(filePath);
      const bytes = stats.size;

      if (bytes === 0) return '0 Bytes';

      const k = 1024;
      const sizes = ['Bytes', 'KB', 'MB', 'GB'];
      const i = Math.floor(Math.log(bytes) / Math.log(k));

      return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    } catch (error: any) {
      logger.error('Failed to get file size', { error: error.message });
      return 'Unknown';
    }
  }
}

// Export singleton instance
export const pdfConverter = new PDFConverter();
