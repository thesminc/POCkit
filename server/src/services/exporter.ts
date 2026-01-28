/**
 * Exporter Service
 *
 * Export POC documents to various formats:
 * - Markdown (.md)
 * - PDF (.pdf) - Professional styled document
 */

import { PrismaClient } from "@prisma/client";
import { createLogger } from "../config/logger";
import { pdfConverter } from "./pdf-converter";
import fs from "fs/promises";
import path from "path";

const prisma = new PrismaClient();
const logger = createLogger();

export interface ExportRequest {
  pocId: string;
  format: "markdown" | "pdf";
}

export interface ExportResult {
  filePath: string;
  fileName: string;
  mimeType: string;
  fileSize?: string;
}

/**
 * Exporter - Export POC documents to various formats
 */
export class Exporter {
  private readonly exportDir = path.join(__dirname, "../../exports");

  constructor() {
    // Ensure export directory exists
    this.ensureExportDir();
  }

  private async ensureExportDir() {
    try {
      await fs.mkdir(this.exportDir, { recursive: true });
    } catch (error: any) {
      logger.error("Failed to create export directory", {
        error: error.message,
      });
    }
  }

  /**
   * Export POC to specified format
   */
  async exportPOC(request: ExportRequest): Promise<ExportResult> {
    try {
      logger.info("Starting POC export", {
        pocId: request.pocId,
        format: request.format,
      });

      // Get POC
      const poc = await prisma.generatedPoc.findUnique({
        where: { id: request.pocId },
        include: {
          session: true,
        },
      });

      if (!poc) {
        throw new Error(`POC not found: ${request.pocId}`);
      }

      let result: ExportResult;

      switch (request.format) {
        case "markdown":
          result = await this.exportMarkdown(poc);
          break;
        case "pdf":
          result = await this.exportPDF(poc);
          break;
        default:
          throw new Error(`Unsupported format: ${request.format}`);
      }

      logger.info("POC export completed", {
        pocId: request.pocId,
        format: request.format,
        fileName: result.fileName,
      });

      return result;
    } catch (error: any) {
      logger.error("POC export failed", {
        pocId: request.pocId,
        format: request.format,
        error: error.message,
      });
      throw error;
    }
  }

  /**
   * Export to Markdown
   */
  private async exportMarkdown(poc: any): Promise<ExportResult> {
    const fileName = `POC-${poc.sessionId.substring(0, 8)}-${new Date().toISOString().split("T")[0]}.md`;
    const filePath = path.join(this.exportDir, fileName);

    await fs.writeFile(filePath, poc.content, "utf-8");

    return {
      filePath,
      fileName,
      mimeType: "text/markdown",
    };
  }

  /**
   * Export to PDF
   */
  private async exportPDF(poc: any): Promise<ExportResult> {
    const fileName = `POC-${poc.sessionId.substring(0, 8)}-${new Date().toISOString().split("T")[0]}.pdf`;
    const filePath = path.join(this.exportDir, fileName);

    // Add cover page metadata to markdown
    const enhancedMarkdown = this.addPDFCoverPage(poc);

    // Convert to PDF using pdf-converter service
    await pdfConverter.convertMarkdownToPDF(enhancedMarkdown, filePath, {
      format: "A4",
      margin: {
        top: "1in",
        right: "1in",
        bottom: "1in",
        left: "1in",
      },
      displayHeaderFooter: true,
      headerTemplate: `
        <div style="font-size: 9px; text-align: right; width: 100%; padding-right: 1in; color: #666;">
          <span>POCkit</span>
        </div>
      `,
      footerTemplate: `
        <div style="font-size: 9px; text-align: center; width: 100%; color: #666;">
          <span>Page <span class="pageNumber"></span> of <span class="totalPages"></span></span>
          <span style="margin-left: 20px;">Generated: ${new Date().toLocaleDateString()}</span>
        </div>
      `,
    });

    const fileSize = await pdfConverter.getFileSize(filePath);

    return {
      filePath,
      fileName,
      mimeType: "application/pdf",
      fileSize,
    };
  }

  /**
   * Add cover page and metadata to markdown for PDF export
   */
  private addPDFCoverPage(poc: any): string {
    const date = new Date().toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });

    const coverPage = `
<div style="text-align: center; margin-top: 200px;">
  <h1 style="font-size: 36pt; margin-bottom: 20px;">Proof of Concept</h1>
  <h2 style="font-size: 24pt; color: #0066CC; margin-bottom: 40px;">POC Document</h2>
  <p style="font-size: 14pt; color: #666;">${date}</p>
  <div style="margin-top: 60px; padding: 20px; background: #f6f8fa; border-radius: 8px; display: inline-block;">
    <p style="font-size: 10pt; color: #666;">Generated with AI assistance</p>
    <p style="font-size: 10pt; color: #666;">All findings include source citations</p>
  </div>
</div>

<div class="page-break"></div>

`;

    return coverPage + poc.content;
  }

  /**
   * Clean up old export files
   */
  async cleanupExports(olderThanDays: number = 7): Promise<number> {
    try {
      const files = await fs.readdir(this.exportDir);
      const now = Date.now();
      const maxAge = olderThanDays * 24 * 60 * 60 * 1000;
      let deletedCount = 0;

      for (const file of files) {
        const filePath = path.join(this.exportDir, file);
        const stats = await fs.stat(filePath);

        if (now - stats.mtimeMs > maxAge) {
          await fs.unlink(filePath);
          deletedCount++;
          logger.info("Deleted old export file", { file });
        }
      }

      return deletedCount;
    } catch (error: any) {
      logger.error("Failed to cleanup exports", { error: error.message });
      throw error;
    }
  }

  /**
   * Get export directory path
   */
  getExportDir(): string {
    return this.exportDir;
  }
}

// Export singleton instance
export const exporter = new Exporter();
