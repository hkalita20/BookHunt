const express=require("express");
const fs=require("fs");
const multer=require("multer");
const Author=require("../models/author");
const Book = require("../models/book");
const path=require('path')
const router=express.Router()
const uploadPath=path.join('public',Book.coverImageBasePath)
const imageMimeTypes=['image/jpeg' ,'image/jpg','image/png','image/gif']
const upload=multer({
    dest:uploadPath,
    fileFilter: (req, file, callback) => {
        if (imageMimeTypes.includes(file.mimetype)) {
            callback(null, true);
        } else {
            callback(new Error('Invalid file type. Only image files are allowed.'));
        }
    }

})



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
        res.render('books/index',{
            books:books,
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
    const fileName = req.file != null ? req.file.filename : null
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



function removeBookCover(fileName){
    fs.unlink(path.join(uploadPath,fileName),err=>{
        if(err) console.log(err.message);
    });
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