const { BlobServiceClient } = require('@azure/storage-blob');
const AZURE_STORAGE_CONNECTION_STRING = process.env.AZURE_STORAGE_CONNECTION_STRING;
const { v4: uuidv4 } = require('uuid');

const blobServiceClient = BlobServiceClient.fromConnectionString(AZURE_STORAGE_CONNECTION_STRING);
const containerClient = blobServiceClient.getContainerClient('test');

exports.uploadImage = async (file) => {
  const uniqueFileName = uuidv4() + '-' + file.originalname;
  const blobClient = containerClient.getBlockBlobClient(uniqueFileName);
  await blobClient.uploadFile(file.path);
  return blobClient.url;
};
exports.uploadDoc = async (file) => {
  const uniqueFileName = uuidv4() + '-' + file.originalname;
  const blobClient = containerClient.getBlockBlobClient(uniqueFileName);
  await blobClient.uploadFile(file.path);
  return blobClient.url;
};

exports.isImageFile = (file) => {
  const imageMimeTypes = ['image/jpeg', 'image/png', 'image/gif'];
  return imageMimeTypes.includes(file.mimetype);
};

exports.isDocumentFile = (file) => {
  const documentMimeTypes = ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];
  return documentMimeTypes.includes(file.mimetype);
};

// exports.getFile = async (blobUrl) => {
//   // Logic to get the file from Azure Blob Storage using the URL
//   // Can involve generating a SAS token for direct client download or streaming the file
// };
exports.getFile = async (blobUrl) => {
    // Returning the direct URL of the file
    return { url: blobUrl };
}