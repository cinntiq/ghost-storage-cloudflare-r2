# Ghost Storage Cloudflare R2

This project provides a Cloudflare R2 storage adapter for Ghost CMS. It allows you to store Ghost media files in Cloudflare's R2 object storage service, leveraging R2's S3 API compatibility for seamless integration.

## Features

-   Seamless integration with Cloudflare R2 for Ghost CMS
-   Automatic image optimization: WebP conversion and resizing
-   Unique file name generation to prevent conflicts
-   Efficient file serving via Cloudflare's global network
-   Easy setup and configuration

## Prerequisites

-   Ghost CMS installation (version 3.0 or higher)
-   Cloudflare account with R2 enabled
-   Basic knowledge of Ghost configuration and server management

## Cloudflare R2 Setup

Before installation, set up Cloudflare R2:

1. Log in to your Cloudflare dashboard.
2. Navigate to 'R2' from the left sidebar.
3. Click 'Create bucket' and choose a unique name for your Ghost media.
4. Go to 'R2' > 'Manage API Tokens'.
5. Click 'Create API Token' and name it (e.g., 'Ghost R2 Access').
6. Set 'Edit' permissions for your new bucket.
7. Save the Access Key ID and Secret Access Key securely.
8. In the R2 dashboard, click on your new bucket.
9. Copy the S3 API endpoint URL from the 'Settings' tab.

Keep this information for the Ghost configuration step.

## Installation

Install the adapter in your Ghost installation directory:

1. Navigate to your Ghost installation:

    ```bash
    cd /var/lib/ghost
    ```

2. Go to the storage adapters directory:

    ```bash
    cd content/adapters/storage
    ```

3. Clone this repository:

    ```bash
    git clone https://github.com/cinntiq/ghost-storage-cloudflare-r2.git
    ```

4. Enter the cloned directory and install dependencies:
    ```bash
    cd ghost-storage-cloudflare-r2
    npm install
    ```

## Configuration

Configure Ghost to use the R2 storage adapter:

1. Open your Ghost configuration file at `/var/lib/ghost/config.production.json`.

2. Add or modify the `storage` section as follows:

    ```json
    {
        "storage": {
            "active": "ghost-storage-cloudflare-r2",
            "ghost-storage-cloudflare-r2": {
                "bucket": "YOUR_R2_BUCKET_NAME",
                "endpoint": "https://YOUR_ACCOUNT_ID.r2.cloudflarestorage.com",
                "accessKeyId": "YOUR_R2_ACCESS_KEY_ID",
                "secretAccessKey": "YOUR_R2_SECRET_ACCESS_KEY",
                "publicDomain": "https://your-custom-domain.com"
            }
        }
    }
    ```

3. Replace the placeholders with your actual R2 information:

    - `YOUR_R2_BUCKET_NAME`: The name of your R2 bucket

        - Example: `"my-ghost-media"`

    - `YOUR_ACCOUNT_ID`: Your Cloudflare account ID

        - Found in the R2 dashboard
        - Example: `"1a2b3c4d5e6f7g8h9i0j"`

    - `YOUR_R2_ACCESS_KEY_ID`: The Access Key ID from your R2 API token

        - Example: `"ABCDEFGHIJKLMNOPQRST"`

    - `YOUR_R2_SECRET_ACCESS_KEY`: The Secret Access Key from your R2 API token

        - Example: `"abcdefghijklmnopqrstuvwxyz0123456789ABCD"`

    - `https://your-custom-domain.com`: (Optional) Your custom domain for serving media files
        - If not provided, R2's URL will be used
        - Example: `"https://media.yourblog.com"`

4. Image Optimization:

    Set `imageOptimization.resize` to `false`. This disables Ghost's built-in resizing as the adapter handles image optimization.

    ```json
    "imageOptimization": {
      "resize": false
    }
    ```

5. Save the configuration file after making these changes.

Note: Ensure that all JSON syntax is correct to avoid configuration errors. Use a JSON validator if you're unsure.

## Usage

After completing the configuration:

1. Save the `config.production.json` file.

2. Restart your Ghost instance to apply the changes:

    ```bash
    ghost restart
    ```

Ghost will now store all new media uploads in your Cloudflare R2 bucket. Existing media files will remain in their current location unless manually migrated.

## License

This project is licensed under the MIT License.
