/**
 * File Tools for Claude Agents
 * Handles file operations for uploaded files
 */

import { PrismaClient } from '@prisma/client';
import { createLogger } from '../../config/logger';
import * as fs from 'fs/promises';
import * as path from 'path';
import mammoth from 'mammoth';
import pdf from 'pdf-parse';
import { ToolResult } from './database-tools';

const prisma = new PrismaClient();
const logger = createLogger();

/**
 * Extract text from DOCX file
 */
export async function extractTextFromDOCX(filePath: string): Promise<string> {
  const buffer = await fs.readFile(filePath);
  const result = await mammoth.extractRawText({ buffer });
  return result.value;
}

/**
 * Extract text from PDF file
 */
export async function extractTextFromPDF(filePath: string): Promise<string> {
  const buffer = await fs.readFile(filePath);
  const data = await pdf(buffer);
  return data.text;
}

/**
 * Extract text from plain text file
 */
export async function extractTextFromTXT(filePath: string): Promise<string> {
  return await fs.readFile(filePath, 'utf-8');
}

/**
 * Read file with automatic format detection
 */
export async function readFileWithAutoDetect(filePath: string, fileName: string): Promise<string> {
  const ext = path.extname(fileName).toLowerCase();

  if (ext === '.docx') {
    return await extractTextFromDOCX(filePath);
  } else if (ext === '.pdf') {
    return await extractTextFromPDF(filePath);
  } else {
    // Plain text files (.txt, .md, .json, .xml, etc.)
    return await extractTextFromTXT(filePath);
  }
}

/**
 * Get all file contents for a session
 */
export async function getAllFileContents(sessionId: string): Promise<ToolResult<Array<{
  fileId: string;
  fileName: string;
  content: string;
  fileType: string;
}>>> {
  try {
    logger.info('Getting all file contents', { sessionId });

    const files = await prisma.uploadedFile.findMany({
      where: { sessionId },
      orderBy: { createdAt: 'asc' },
    });

    const contents = [];

    for (const file of files) {
      try {
        const content = await readFileWithAutoDetect(file.filePath, file.fileName);
        contents.push({
          fileId: file.id,
          fileName: file.fileName,
          content: content,
          fileType: file.fileType,
        });
      } catch (error: any) {
        logger.warn('Failed to read file, skipping', {
          fileId: file.id,
          fileName: file.fileName,
          error: error.message,
        });
      }
    }

    return {
      success: true,
      data: contents,
    };
  } catch (error: any) {
    logger.error('Failed to get all file contents', {
      error: error.message,
      sessionId,
    });
    return {
      success: false,
      error: error.message,
    };
  }
}
