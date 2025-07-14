# YouTube Clone Backend

This repository contains the backend infrastructure for a video-sharing platform, similar to YouTube. It provides RESTful APIs for essential features such as user authentication, video management, channel creation, commenting, likes/dislikes, and subscriptions.

---

## Features

* **User Authentication**: Secure registration, login, and session management using JWT.
* **Channel Management**: Users can create, view, update, and delete their own channels.
* **Video Management**: Upload, view, and manage video content with associated metadata.
* **User Interactions**: Built-in systems for liking, disliking, commenting on videos, and tracking views.
* **Subscription System**: Subscribe to and unsubscribe from channels.
* **Search & Filtering**: Retrieve videos based on search terms and categories.
* **Robust Error Handling**: Centralized error handling with custom classes and appropriate HTTP status codes for a consistent API experience.

--- 

## Technologies

* **Node.js**: The JavaScript runtime environment.
* **Express.js**: The web application framework for building the APIs.
* **MongoDB**: The NoSQL database for data persistence.
* **Mongoose**: The elegant MongoDB object modeling for Node.js.
* **JSON Web Tokens (JWT)**: For secure, stateless authentication.
* **Environment Variables (`.env`)**: To manage configuration settings securely.

---

## Getting Started Locally

Follow these steps to get a local copy of the project up and running.

### Prerequisites

* Node.js (LTS version recommended)
* MongoDB installed and running, or a connection string to a remote instance.

### Installation

1.  Clone the repository:
    ```bash
    git clone [`https://github.com/Harianki7412/youtube-backend.git`]
    cd youtube-clone-backend
    ```

2.  Install the dependencies:
    ```bash
    npm install
    ```

3.  Create a `.env` file in the root directory and add your environment variables:
    ```env
    PORT=5000
    NODE_ENV=development
    MONGO_URI=mongodb://localhost:27017/youtubeclone
    JWT_SECRET=your_jwt_secret_key_here
    JWT_EXPIRES_IN=1d

    # Optional: For file uploads (e.g., Cloudinary)
    CLOUD_NAME=your_cloud_name
    API_KEY=your_api_key
    API_SECRET=your_api_secret
    ```
    > **Security Advice:** For production, `JWT_SECRET` should be a strong, randomly generated string kept strictly confidential.

4.  Start the development server:
    ```bash
    npm run dev
    ```
    The server will be running at `http://localhost:5000`.

---

## API Endpoints

All endpoints are prefixed with `/api/v1`.

### Authentication

* `POST /auth/register`: Facilitates the registration of a new user.
* `POST /auth/login`: Enables user authentication and issues a JWT.
* `GET /auth/me`: Retrieves the profile data of the authenticated user (requires token).

### Channels

* `POST /channels`: Creates a new channel (authenticated users only).
* `GET /channels/:channelId`: Provides detailed information about a specific channel.
* `GET /channels/:channelId/videos`: Lists all videos uploaded by a channel.
* `PUT /channels/:channelId`: Updates channel attributes (restricted to the owner).
* `DELETE /channels/:channelId`: Deletes a channel (restricted to the owner).

### Comments

* `POST /comments/:videoId`: Adds a new comment to a video (authenticated users only).
* `GET /comments/:videoId`: Retrieves all comments for a video.
* `PUT /comments/:commentId`: Edits an existing comment (restricted to the author).
* `DELETE /comments/:commentId`: Deletes a comment (restricted to the author or video owner).

### Subscriptions

* `POST /subscriptions/:channelId/subscribe`: Subscribes to a channel (authenticated users only).
* `DELETE /subscriptions/:channelId/unsubscribe`: Unsubscribes from a channel (authenticated users only).
* `GET /subscriptions/:channelId/status`: Checks the subscription status for a channel.
* `GET /subscriptions/my-subscriptions`: Lists channels the authenticated user is subscribed to.

### Users

* `GET /users/:userId`: Retrieves the public profile of a user.
* `PUT /users/:userId`: Updates a user's profile (restricted to the user).

### Videos

* `POST /videos/upload`: Uploads new video content (authenticated users only).
* `GET /videos`: Retrieves all videos (supports search and category filtering).
* `GET /videos/:videoId`: Provides detailed information for a specific video.
* `PUT /videos/:videoId/view`: Increments the view count for a video.
* `PUT /videos/:videoId/like`: Registers a like for a video (authenticated users only).
* `PUT /videos/:videoId/dislike`: Registers a dislike for a video (authenticated users only).
* `PUT /videos/:videoId`: Updates video details (restricted to the uploader or channel owner).
* `DELETE /videos/:videoId`: Deletes a video (restricted to the uploader or channel owner).

---

## Authentication

This backend uses **JSON Web Tokens (JWT)** for user authentication. After a successful login, a JWT is issued and must be included in the `Authorization` header of subsequent requests:

`Authorization: Bearer <your_jwt_token_here>`

Middleware is used to protect routes and ensure access is limited to authenticated and authorized users.

---

## Contribution

Contributions are welcome! If you'd like to contribute, please follow these steps:

1.  Fork the repository.
2.  Create a feature branch: `git checkout -b feature/my-new-feature`
3.  Commit your changes: `git commit -m 'feat: Add new feature'`
4.  Push your branch to your fork: `git push origin feature/my-new-feature`
5.  Open a Pull Request.

---

## Deployment

To deploy this application, ensure all production environment variables are correctly set. It is recommended to use a process manager like **PM2** to keep the server running.

1.  Install dependencies: `npm install --production`
2.  Build the project (if necessary for TypeScript or other transpilation).
3.  Start the server with `npm start` or a process manager.

Recommended platforms: Heroku, Vercel, AWS EC2, Google Cloud Run, etc.