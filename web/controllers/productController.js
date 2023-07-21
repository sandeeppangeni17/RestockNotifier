// import User from '../models/userModel.js'
import Product from '../models/productModel.js'

export default class ProductController{
    //create product
    async addProduct(req,res,next){
        try{ 
            const data=await Product.create({
                firstName:req.body.firstName,
                lastName:req.body.lastName,
                email:req.body.email,
             });
            if(data){
                res.json(data);
                // console.log(data)
            }else{
                res.json({success: false, message: "could not create product"})
            }
        }catch(err){
            res.json(err);
        }
    }

    //get single product details
    async getSingleProduct(req,res,next){
        const {id}=req.params;
        try{
            const product = await Product.findById(id)
            if(product){
                res.json(product)
            }else{
                res.json({success:false,message:"No data found"})
            }
        }catch(err){
            res.json({success:false,message:"Id not provided"})
                }
    }

    //update single product details
    async updateProduct(req,res,next){
        const {id}=req.params;
        try{
            const product = await Product.findByIdAndUpdate(id, req.body, {
                new: true,
              });
            if(product){
                res.json(product)
            }else{
                res.json({success:false,message:"No data found"})
            }
        }catch(err){
            res.json({success:false,message:"Id not provided"})
                }
    }
}