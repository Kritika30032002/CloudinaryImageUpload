const express = require('express');
const mongoose = require('mongoose');
const dotenv = require('dotenv');
const multer = require('multer');
const cloudinary = require('cloudinary').v2;
const { CloudinaryStorage } = require('multer-storage-cloudinary');

const app = express();
dotenv.config();

//connect to mongodb
mongoose
  .connect('mongodb://127.0.0.1:27017/imageUpload')
  .then(() => console.log('MongoDB connected successfully'))
  .catch((error) => console.error('MongoDB connection error:', error));

//image schema
const imageSchema = mongoose.Schema({
  url: String,
  public_id: String,
});

//Model
const image = mongoose.model('Image', imageSchema);

//configure cloudinary
cloudinary.config({
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
});

//configure multer storage cloudinary
const storage = new CloudinaryStorage({
  cloudinary,
  params: {
    folder: 'images-folder',
    allowedFormats: ['jpeg', 'png', 'jpg'],
    public_id: async (req, file) => file.fieldname + '_' + Date.now(),
    transformation: [{ width: 100, height: 100, crop: 'fill' }],
  },
});

//configure Multer
const upload = multer({
  storage,
  limits: 1024 * 1024 * 5, //5MB limit
  fileFilter: function (req, file, cb) {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('"Not an image! Please upload an image'), false);
    }
  },
});

// Upload route
app.post(
  '/upload',
  upload.single('file'), // Use upload.single middleware to handle file upload
  async (req, res) => {
    // This function is executed only after the file upload is complete
    if (!req.file) {
      // If req.file is not available, it means file upload failed
      return res.status(400).json({ message: 'File upload error' });
    }

    console.log(req.file);

    try {
      // Assuming image.create is an asynchronous function that returns a promise
      const uploaded = await image.create({
        url: req.file.path,
        public_id: req.file.filename,
      });
      res.json({ message: 'File uploaded successfully', uploaded });
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: 'Internal server error' });
    }
  }
);

//get all images
app.get('/images', async (req, res) => {
  try {
    const images = await image.find();
    res
      .status(200)
      .json({ message: 'Images fetched successfully', data: images });
  } catch (error) {
    res.status(500).json({ message: 'Internal server error' });
  }
});

const PORT = 3000;

app.listen(PORT, console.log(`Server is running on port ${PORT}`));
