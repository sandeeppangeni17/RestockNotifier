import User from '../models/userModel.js'

export default class UserController{
    //create user
    async addUser(req,res,next){
        try{ 
            const data=await User.create({
                firstName:req.body.firstName,
                lastName:req.body.lastName,
                email:req.body.email,
             });
            if(data){
                res.json(data);
                // console.log(data)
            }else{
                res.json({success: false, message: "could not create user"})
            }
        }catch(err){
            res.json(err);
        }
    }

    //get single user details
    async getSingleUser(req,res,next){
        const {id}=req.params;
        try{
            const user = await User.findById(id)
            if(user){
                res.json(user)
            }else{
                res.json({success:false,message:"No data found"})
            }
        }catch(err){
            res.json({success:false,message:"Id not provided"})
                }
    }
}