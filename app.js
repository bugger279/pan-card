const express = require("express");
const multer = require("multer");
const path = require("path");
const ejs = require("ejs");
const app = express();
const fs = require("fs");
const Tesseract = require('tesseract.js');

// multer configuration
const storage = multer.diskStorage({
  destination: "./public/uploads/",
  filename: (req, file, cb) => {
    cb(
      null,
      file.fieldname + "-" + Date.now() + path.extname(file.originalname)
    );
  },
});

// Initialize Upload
const upload = multer({
  storage: storage,
  limits: { fileSize: 1000000 },
  fileFilter: (req, file, cb) => {
    checkFileType(file, cb);
  },
}).single("myImage");

// Custom Functions
function checkFileType(file, cb) {
  const filetypes = /jpeg|jpg|png/;
  const extname = filetypes.test(path.extname(file.originalname).toLowerCase());
  const mimetype = filetypes.test(file.mimetype);
  if (extname && mimetype) {
    return cb(null, true);
  } else {
    cb("Error: Images Only");
  }
}

function save(item, path = './scannedData.json'){
  if (!fs.existsSync(path)) {
      fs.writeFile(path, JSON.stringify([item]));
  } else {
      var data = fs.readFileSync(path, 'utf8');  
      var list = (data.length) ? JSON.parse(data): [];
      if (list instanceof Array) list.push(item)
      else list = [item]  
      fs.writeFileSync(path, JSON.stringify(list));
  }
}

// public folder
app.use(express.static("./public"));
app.set("view engine", "ejs");
// Routes
app.get("/", (req, res) => {
  res.render("index");
});

app.post("/upload", (req, res) => {
  upload(req, res, (error) => {
    if (error) {
      res.render("index", {
        msg: error.message,
      });
    } else {
      if (req.file === undefined) {
        res.render("index", {
          msg: "Error: No File selected",
        });
      } else {
        fs.readFile(`./public/uploads/${req.file.filename}`, (err, data) => {
          if (err) {
            console.log(err.message);
          } else {
            try {
              Tesseract.recognize(`./public/uploads/${req.file.filename}`, 'eng', {
                logger: m => console.log(m),
              }).then(({data: {text}}) => {
                const jsonData = {
                  "index": text[0],
                  "new-data": text
                }
                save(jsonData);
                res.render("index", {
                  msg: "File Uploaded.",
                  file: `uploads/${req.file.filename}`,
                  text: text
                });
              })
            } catch (error) {
              console.log('error: ', error)
            }

          }
        });
      }
    }
  });
});

app.listen(5000, (err) => {
  if (err) {
    console.log(err.message);
  } else {
    // console.log("Server running on port 5000");
  }
});
