const mongoose = require('mongoose');
const { GridFSBucket, ObjectId } = require('mongodb');

const DEFAULT_BUCKET = 'transaction_files';

const getBucket = (bucketName = DEFAULT_BUCKET) =>
  new GridFSBucket(mongoose.connection.db, { bucketName });

const uploadFile = (buffer, filename, metadata = {}, bucketName = DEFAULT_BUCKET) =>
  new Promise((resolve, reject) => {
    const uploadStream = getBucket(bucketName).openUploadStream(filename, { metadata });
    uploadStream.end(buffer);
    uploadStream.on('finish', () => resolve(uploadStream.id));
    uploadStream.on('error', reject);
  });

const openDownloadStream = (fileId, bucketName = DEFAULT_BUCKET) =>
  getBucket(bucketName).openDownloadStream(new ObjectId(fileId));

const deleteFile = (fileId, bucketName = DEFAULT_BUCKET) =>
  getBucket(bucketName).delete(new ObjectId(fileId));

const getFileInfo = async (fileId, bucketName = DEFAULT_BUCKET) => {
  const files = await getBucket(bucketName).find({ _id: new ObjectId(fileId) }).limit(1).toArray();
  return files[0] || null;
};

module.exports = {
  DEFAULT_BUCKET,
  getBucket,
  uploadFile,
  openDownloadStream,
  deleteFile,
  getFileInfo,
};
