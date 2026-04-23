const path = require('path');
const express = require('express');
const mongoose = require('mongoose');
const dotenv = require('dotenv');

dotenv.config();

const app = express();
const port = process.env.PORT || 3000;
const mongoUri = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/blogApp';
let connectionPromise;
const publicDirectory = path.join(__dirname, 'public');

const postSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true,
    },
    content: {
      type: String,
      required: true,
      trim: true,
    },
  },
  {
    timestamps: true,
  }
);

const Post = mongoose.model('Post', postSchema);

app.use(express.static(publicDirectory));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.get('/', (req, res) => {
  res.sendFile(path.join(publicDirectory, 'index.html'));
});

app.get('/about', (req, res) => {
  res.send('This is the about page of the MongoDB blog assignment.');
});

app.get('/contact', (req, res) => {
  res.send('Contact page: you can reach the blog admin at admin@example.com');
});

async function connectToDatabase() {
  if (mongoose.connection.readyState === 1) {
    return mongoose.connection;
  }

  if (mongoose.connection.readyState === 2 && connectionPromise) {
    return connectionPromise;
  }

  connectionPromise = mongoose.connect(mongoUri);
  await connectionPromise;
  return mongoose.connection;
}

app.get('/api/posts', async (req, res) => {
  try {
    await connectToDatabase();
    const posts = await Post.find().sort({ createdAt: -1 });
    res.json(posts);
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch posts.' });
  }
});

app.get('/api/posts/:id', async (req, res) => {
  try {
    await connectToDatabase();
    const post = await Post.findById(req.params.id);

    if (!post) {
      return res.status(404).json({ message: 'Post not found.' });
    }

    return res.json(post);
  } catch (error) {
    return res.status(400).json({ message: 'Invalid post id.' });
  }
});

app.post('/api/posts', async (req, res) => {
  const { title, content } = req.body;

  if (!title || !content) {
    return res.status(400).json({
      message: 'Both title and content are required.',
    });
  }

  try {
    await connectToDatabase();
    const newPost = await Post.create({ title, content });
    return res.status(201).json({
      message: 'Post created successfully.',
      post: newPost,
    });
  } catch (error) {
    return res.status(500).json({ message: 'Failed to create post.' });
  }
});

app.put('/api/posts/:id', async (req, res) => {
  const { title, content } = req.body;

  if (!title || !content) {
    return res.status(400).json({
      message: 'Both title and content are required.',
    });
  }

  try {
    await connectToDatabase();
    const updatedPost = await Post.findByIdAndUpdate(
      req.params.id,
      { title, content },
      { new: true, runValidators: true }
    );

    if (!updatedPost) {
      return res.status(404).json({ message: 'Post not found.' });
    }

    return res.json({
      message: 'Post updated successfully.',
      post: updatedPost,
    });
  } catch (error) {
    return res.status(400).json({ message: 'Invalid post id.' });
  }
});

app.delete('/api/posts/:id', async (req, res) => {
  try {
    await connectToDatabase();
    const deletedPost = await Post.findByIdAndDelete(req.params.id);

    if (!deletedPost) {
      return res.status(404).json({ message: 'Post not found.' });
    }

    return res.json({ message: 'Post deleted successfully.' });
  } catch (error) {
    return res.status(400).json({ message: 'Invalid post id.' });
  }
});

async function startServer() {
  try {
    await connectToDatabase();
    console.log('MongoDB connected successfully.');

    app.listen(port, () => {
      console.log(`Server is running on http://localhost:${port}`);
    });
  } catch (error) {
    console.error('MongoDB connection failed:', error.message);
    process.exit(1);
  }
}

if (!process.env.VERCEL) {
  startServer();
}

module.exports = app;
