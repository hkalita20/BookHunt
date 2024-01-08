const express=require("express");
const Author = require("../models/author");
const router=express.Router()


router.get('/',async(req,res)=>{
    let searchOptions={};
    if(req.query.name !=null && req.name!=''){
        searchOptions.name=new RegExp(req.query.name,'i')
    }
    try{
        const authors=await Author.find(searchOptions);
        res.render('authors/index',{authors:authors,
            searchOptions:req.query})
    }
    catch{
        res.redirect('/');
    }
})


//new Author Route
router.get('/new',(req,res)=>{
    res.render('authors/new',{author:new Author()})
})


//Create Author Route
router.post('/',async(req,res)=>{
    const author=new Author({
        name:req.body.name
    })

    try{

        const newAuthor=await author.save();
        redirect('authors');

        // author.save((err,newAuthor)=>{
            //     if(err){
            //         res.render('authors/new',{
            //             author:author,
            //             errorMessage: "Error creating Author"
            //         })
            //     }
    }catch{
     res.render('authors/new',{author:author,
    errorMessage:'Error creating Author'})   
    }
    



    //
    //     else{
    //         // res.redirect('authors/${newAuthor.id}')
    //         res.redirect('authors')
    //     }
    // })
    // res.send(req.body.name)
})



module.exports = router;
