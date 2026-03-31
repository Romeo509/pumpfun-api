import fetch from 'node-fetch';
import { FormData } from 'formdata-node';
import { fileFromPath } from 'formdata-node/file-from-path';
import fs from 'fs/promises';
import { PUMP_FUN_IPFS_API } from '../config/index.js';
import { IPFSError } from '../lib/errors.js';
import { logger } from '../lib/logger.js';

export async function uploadTokenMetadata(params) {
  const {
    imagePath,
    name,
    symbol,
    description = 'Token created via API',
    twitter = null,
    telegram = null,
    website = null
  } = params;

  try {
    logger.debug('Uploading to IPFS', { name, symbol });

    const file = await fileFromPath(imagePath);
    const formData = new FormData();
    
    formData.append('file', file, 'token-image.jpeg');
    formData.append('name', name);
    formData.append('symbol', symbol);
    formData.append('description', description);
    formData.append('showName', 'true');

    if (twitter) formData.append('twitter', twitter);
    if (telegram) formData.append('telegram', telegram);
    if (website) formData.append('website', website);

    const response = await fetch(PUMP_FUN_IPFS_API, {
      method: 'POST',
      body: formData
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`HTTP ${response.status}: ${errorText}`);
    }

    const metadata = await response.json();
    logger.debug('IPFS upload successful', { metadataUri: metadata.metadataUri });

    return {
      name: metadata.metadata.name,
      symbol: metadata.metadata.symbol,
      uri: metadata.metadataUri,
      raw: metadata
    };
  } catch (error) {
    logger.error('IPFS upload failed', error);
    throw new IPFSError('Failed to upload token metadata', error);
  }
}

export async function prepareImageBuffer(image) {
  let imageBuffer;
  
  if (image.startsWith('data:')) {
    const base64Data = image.replace(/^data:image\/\w+;base64,/, '');
    imageBuffer = Buffer.from(base64Data, 'base64');
  } else if (image.startsWith('/') || image.startsWith('./') || image.startsWith('../')) {
    imageBuffer = await fs.readFile(image);
  } else {
    imageBuffer = Buffer.from(image, 'base64');
  }

  return imageBuffer;
}

export async function writeTempImage(imageBuffer, tempPath = './temp-token-image.jpeg') {
  await fs.writeFile(tempPath, imageBuffer);
  return tempPath;
}

export async function cleanupTempFile(tempPath) {
  try {
    await fs.unlink(tempPath);
    logger.debug('Cleaned up temp file', { path: tempPath });
  } catch (error) {
    logger.warn('Failed to cleanup temp file', { path: tempPath, error: error.message });
  }
}
