import express from 'express'
import ProductController from '../controllers/productController.js'

const router = express.Router()
const productController= new ProductController();

router.get('/addproduct',productController.addProduct);
router.get('/:id',productController.getSingleProduct);
router.put("/update/:id", productController.updateProduct);

export default router;