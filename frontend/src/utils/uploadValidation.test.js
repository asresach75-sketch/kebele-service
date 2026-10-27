import { isSupportedUpload, MAX_UPLOAD_SIZE } from './uploadValidation';

describe('isSupportedUpload', () => {
  it('accepts supported files when extension and MIME type match', () => {
    expect(isSupportedUpload({ name: 'photo.JPG', type: 'image/jpeg', size: 1 })).toBe(true);
    expect(isSupportedUpload({ name: 'document.pdf', type: 'application/pdf', size: 1 })).toBe(true);
  });

  it('rejects unsupported, mismatched, empty, and oversized files', () => {
    expect(isSupportedUpload({ name: 'photo.jpg', type: 'application/pdf', size: 1 })).toBe(false);
    expect(isSupportedUpload({ name: 'photo.gif', type: 'image/gif', size: 1 })).toBe(false);
    expect(isSupportedUpload({ name: 'empty.png', type: 'image/png', size: 0 })).toBe(false);
    expect(isSupportedUpload({ name: 'large.pdf', type: 'application/pdf', size: MAX_UPLOAD_SIZE + 1 })).toBe(false);
  });
});
