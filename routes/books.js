const express=require("express");
// const fs=require("fs");
const AWS = require("aws-sdk");
const s3 = new AWS.S3();
const { v4: uuidv4 } = require('uuid');
const multer=require("multer");
const multerS3 = require('multer-s3');
const Author=require("../models/author");
const Book = require("../models/book");
const path=require('path')
const router=express.Router()
const uploadPath=path.join('public',Book.coverImageBasePath)
const imageMimeTypes=['image/jpeg' ,'image/jpg','image/png','image/gif']
// const upload=multer({
//     dest:uploadPath,
//     fileFilter: (req, file, callback) => {
//         if (imageMimeTypes.includes(file.mimetype)) {
//             callback(null, true);
//         } else {
//             callback(new Error('Invalid file type. Only image files are allowed.'));
//         }
//     }

// })

const s3s = new AWS.S3({
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
    region: process.env.AWS_REGION, 
  });


  const upload = multer({
    storage: multerS3({
      s3: s3s,
      bucket: process.env.BUCKET_NAME,
      contentType: multerS3.AUTO_CONTENT_TYPE, // Automatically set content type (MIME)
      acl: 'public-read', // Access Control List - set it to public or private as needed
      key: function (req, file, cb) {
        cb(null,'books-covers/'+ Date.now().toString() + '-' + file.originalname); // Generating unique key for each file
      },
    }),
  });
  



//All Books route
router.get('/',async(req,res)=>{
    let query=Book.find();
    if(req.query.title !=null && req.query.title!=''){
        query=query.regex('title',new RegExp(req.query.title,'i'));
    }
    if (req.query.publishedBefore != null && req.query.publishedBefore != '') {
        query = query.lte('publishDate', req.query.publishedBefore)
      }
      if (req.query.publishedAfter != null && req.query.publishedAfter != '') {
        query = query.gte('publishDate', req.query.publishedAfter)
      }
    try {
        const books=await query.exec()
        const modifiedBooks =await Promise.all(
            books.map(async book => {
              try {
                const myFile = await s3.getObject({
                  Bucket: process.env.BUCKET_NAME,
                  Key: book.coverImagePath,
                }).promise();
                const fileContent = JSON.parse(myFile.Body.toString());
                return {
                  ...book.toObject(), // Using toObject() to get a plain JavaScript object
                  coverImagePath: fileContent, // Modify the coverImagePath property
                };
              } catch (error) {
                console.error('Error fetching file from S3:', error);
                return {
                  ...book.toObject(), // Return the book object as is
                };
              }
            })
            );

        res.render('books/index',{
            books:modifiedBooks,
            searchOptions:req.query
        })
        
    } catch{
        res.redirect('/');
    }
})


//new Author Route
router.get('/new',async(req,res)=>{
    renderNewPage(res,new Book())
})


//Create Author Route
router.post('/',upload.single('cover'),async(req,res)=>{
    let fileName=null;
    if (req.file) {
        fileName = req.file.key; 
    }

    //  fileName = req.file != null ? req.file.filename : null
    const book=new Book({
        title:req.body.title,
        author:req.body.author,
        publishDate:new Date(req.body.publishDate),
        pageCount:req.body.pageCount,
        coverImageName:fileName,
        description:req.body.description
    })
    try {
        const newBook=await book.save();
        res.redirect('books')
} catch(error) {
    if(book.coverImageName!=null)
    removeBookCover(book.coverImageName)
    renderNewPage(res,new Book(),true)
}
})



// function removeBookCover(fileName){
//     fs.unlink(path.join(uploadPath,fileName),err=>{
//         if(err) console.log(err.message);
//     });
// }

async function removeBookCover(fileName) {
    try {
      const deleteParams = {
        Bucket: process.env.BUCKET_NAME,
        Key: fileName // Adjust the path if needed
      };
      
      await s3.deleteObject(deleteParams).promise();
      console.log(`Deleted cover image: ${fileName} from AWS S3`);
    } catch (error) {
      console.error(`Error deleting cover image ${fileName} from S3:`, error);
    }
  }


    async function renderNewPage(res,book,hashError=false){
        try{
            const authors=await Author.find({});
            const params={
                authors:authors,
                book:book
            }
            if(hashError){
                params.errorMessage='Error Creating Book'
            } 
            res.render('books/new',params)
        }
        catch{
             res.redirect('books');
        }
    }



module.exports = router;