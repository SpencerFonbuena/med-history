import { describe, it, expect } from 'vitest';
import {
  isImage,
  isAllowedMime,
  extFromMime,
  extFromName,
  extOf,
  inferMime,
  buildRelativePath,
} from './attachmentPaths.provider';

describe('attachmentPaths provider', () => {
  it('detects image mimes', () => {
    expect(isImage('image/jpeg')).toBe(true);
    expect(isImage('application/pdf')).toBe(false);
  });

  it('allows images and pdf only', () => {
    expect(isAllowedMime('image/png')).toBe(true);
    expect(isAllowedMime('application/pdf')).toBe(true);
    expect(isAllowedMime('text/plain')).toBe(false);
  });

  it('maps mime to extension', () => {
    expect(extFromMime('image/jpeg')).toBe('jpg');
    expect(extFromMime('application/pdf')).toBe('pdf');
    expect(extFromMime('image/unknown')).toBe('bin');
  });

  it('reads extension from a filename', () => {
    expect(extFromName('scan.JPG')).toBe('jpg');
    expect(extFromName('no-extension')).toBe('');
  });

  it('prefers the filename extension, falls back to mime', () => {
    expect(extOf('lab.pdf', 'application/pdf')).toBe('pdf');
    expect(extOf(null, 'image/png')).toBe('png');
  });

  it('infers mime from a name when none is given', () => {
    expect(inferMime('photo.jpg', undefined)).toBe('image/jpeg');
    expect(inferMime('report.pdf', undefined)).toBe('application/pdf');
    expect(inferMime('x', 'image/heic')).toBe('image/heic');
  });

  it('builds a profile-scoped relative path', () => {
    expect(buildRelativePath('p1', 'e1', 'f1', 'jpg')).toBe('attachments/p1/e1/f1.jpg');
  });
});
