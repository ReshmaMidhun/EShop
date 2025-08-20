const multer = require("multer");
const path = require("path");

// Set Storage Engine
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, 'public/img'); // Folder to store uploaded images (public/img)
    },
    filename: (req, file, cb) => {
        cb(null, Date.now() + path.extname(file.originalname)); // unique filename
    }
});

// Init Upload
const upload = multer({
    storage: storage,
    limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
    fileFilter: (req, file, cb) => {
        const filetypes = /jpeg|jpg|png/;
        const extname = filetypes.test(path.extname(file.originalname).toLowerCase());
        const mimetype = filetypes.test(file.mimetype);

        if (extname && mimetype) {
            return cb(null, true);
        } else {
            cb('Error: Only images are allowed (JPEG, JPG, PNG)');
        }
    }
});

module.exports = upload;
