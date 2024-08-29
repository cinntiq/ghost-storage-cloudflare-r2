const GhostStorageBase = require('ghost-storage-base')
const fs = require('fs').promises
const {
    S3Client,
    HeadObjectCommand,
    GetObjectCommand,
    DeleteObjectCommand,
} = require('@aws-sdk/client-s3')
const { Upload } = require('@aws-sdk/lib-storage')
const sharp = require('sharp')
const { v4: uuidv4 } = require('uuid')
const { format } = require('date-fns')

class GhostStorageCloudflareR2 extends GhostStorageBase {
    /**
     * Initializes the Cloudflare R2 storage adapter.
     * @param {Object} config - Configuration object
     * @param {string} config.bucket - The name of the R2 bucket
     * @param {string} config.endpoint - The R2 API endpoint URL
     * @param {string} config.accessKeyId - The access key ID for R2
     * @param {string} config.secretAccessKey - The secret access key for R2
     * @param {string} config.publicDomain - The public domain for serving files
     */
    constructor(config = {}) {
        super(config)

        const { bucket, endpoint, accessKeyId, secretAccessKey, publicDomain } =
            config

        this.bucket = bucket
        this.domain = publicDomain
        this.s3 = new S3Client({
            endpoint,
            region: 'auto',
            credentials: { accessKeyId, secretAccessKey },
            signatureVersion: 'v4',
        })
    }

    /**
     * Checks if a file exists in the R2 bucket.
     * @param {string} filename - The name of the file to check
     * @returns {Promise<boolean>} True if the file exists, false otherwise
     *
     * This method sends a HeadObjectCommand to R2. If the command succeeds,
     * the file exists. If it fails with a 'NotFound' error, the file doesn't exist.
     * Any other error is treated as if the file exists, to err on the side of caution.
     */
    async exists(filename) {
        try {
            await this.s3.send(
                new HeadObjectCommand({
                    Bucket: this.bucket,
                    Key: filename,
                }),
            )
            return true
        } catch (error) {
            return error.name !== 'NotFound'
        }
    }

    /**
     * Saves an image to the R2 bucket.
     * @param {Object} image - The image object to save
     * @param {string} image.path - The local path of the image file
     * @returns {Promise<string>} The URL of the saved image
     *
     * This method performs the following steps:
     * 1. Generates a unique file key with the current date and a UUID
     * 2. Reads the image file from the local path
     * 3. Processes the image: resizes to 1280px width and converts to WebP format
     * 4. Uploads the processed image to R2 using the Upload utility
     * 5. Returns the public URL of the uploaded image
     */
    async save(image) {
        const fileKey = `content/uploads/${format(
            new Date(),
            'yyyy/MM/dd',
        )}/${uuidv4()}.webp`

        const processedBuffer = await sharp(await fs.readFile(image.path))
            .resize({ width: 1280 })
            .webp({ quality: 80 })
            .toBuffer()

        await new Upload({
            client: this.s3,
            params: {
                Bucket: this.bucket,
                Key: fileKey,
                Body: processedBuffer,
                ContentType: 'image/webp',
                CacheControl: 'max-age=31536000',
            },
        }).done()

        return `${this.domain}/${fileKey}`
    }

    /**
     * Returns a middleware function for serving files from R2.
     * @returns {Function} An Express middleware function
     *
     * This middleware function:
     * 1. Extracts the file path from the request
     * 2. Sends a GetObjectCommand to R2 to retrieve the file
     * 3. If successful, pipes the file data directly to the response
     * 4. If the file is not found, sends a 404 response
     * 5. For any other error, passes it to the next middleware
     */
    serve() {
        return (req, res, next) => {
            this.s3
                .send(
                    new GetObjectCommand({
                        Bucket: this.bucket,
                        Key: req.path.replace(/^\//, ''),
                    }),
                )
                .then((data) => data.Body.pipe(res))
                .catch((error) => {
                    if (error.name === 'NoSuchKey') {
                        res.status(404).send('File not found')
                    } else {
                        next(error)
                    }
                })
        }
    }

    /**
     * Deletes a file from the R2 bucket.
     * @param {string} fileName - The name of the file to delete
     * @returns {Promise<boolean>} True if deletion was successful, false otherwise
     *
     * This method sends a DeleteObjectCommand to R2. It returns true if the
     * deletion was successful, and false if any error occurred during the process.
     */
    async delete(fileName) {
        try {
            await this.s3.send(
                new DeleteObjectCommand({
                    Bucket: this.bucket,
                    Key: fileName,
                }),
            )
            return true
        } catch {
            return false
        }
    }

    /**
     * Reads a file from the R2 bucket.
     * @param {string} fileName - The name of the file to read
     * @returns {Promise<ReadableStream|null>} A readable stream of the file content, or null if an error occurred
     *
     * This method sends a GetObjectCommand to R2 and returns the Body of the
     * response, which is a readable stream of the file's content. If any error
     * occurs during the process, it returns null.
     */
    async read(fileName) {
        try {
            const { Body } = await this.s3.send(
                new GetObjectCommand({
                    Bucket: this.bucket,
                    Key: fileName,
                }),
            )
            return Body
        } catch {
            return null
        }
    }
}

module.exports = GhostStorageCloudflareR2
