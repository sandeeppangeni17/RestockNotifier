import express from 'express'
import UserController from '../controllers/userController.js'

const router = express.Router()
const userController= new UserController();

router.get('/adduser',userController.addUser);
router.get('/:id',userController.getSingleUser);

export default router;