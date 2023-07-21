// @ts-check
import dotenv from 'dotenv';
import { join } from "path";
import { readFileSync } from "fs";
import express from "express";
import serveStatic from "serve-static";
import mongoose, { Document, Schema, Model, Types } from "mongoose";
import shopify from "./shopify.js";
import productCreator from "./product-creator.js";
import webhookHandlers from "./webhook-handlers.js";
import validator from 'validator';
import { connectToDB } from './utils/database.js';
import User from "./models/userModel.js";
import Product from "./models/productModel.js";
import sendEmailNotification  from "./utils/notificationUtils.js";
const url = "mongodb+srv::kGZ795KTBGKAGNZO@cluster0.ak7hwka.mongodb.net/share_prompt?retryWrites=true&w=majority";
const { Types: { ObjectId } } = mongoose;
const PORT = parseInt(
  process.env.BACKEND_PORT || process.env.PORT || "3000",
  10
);

const STATIC_PATH =
  process.env.NODE_ENV === "production"
    ? `${process.cwd()}/frontend/dist`
    : `${process.cwd()}/frontend/`;

console.log("Log env file ",process.env.MONGODB_URI);
dotenv.config();
const app = express();
// Set up Shopify authentication and webhook handling
app.get(shopify.config.auth.path, shopify.auth.begin());
app.get(
  shopify.config.auth.callbackPath,
  shopify.auth.callback(),
  shopify.redirectToShopifyOrAppRoot()
);
app.post( shopify.config.webhooks.path, shopify.processWebhooks({
  webhookHandlers
}) );

// If you are adding routes outside of the /api path, remember to
// also add a proxy rule for them in web/frontend/vite.config.js

app.use('/api/sendnotification', async (req, res) => {
  const productId = req.query.productId ? String(req.query.productId) : null;
  const variantIds = req.query.variantIds ? JSON.parse(req.query.variantIds.toString()) : [];
  console.log("variantIds ", variantIds);

  try {
    if (!productId || isNaN(Number(productId))) {
      return res.status(400).send('Please provide a valid productId.');
    }

    if (!Array.isArray(variantIds) || variantIds.some(isNaN)) {
      return res.status(400).json({ error: 'Please provide valid variantIds as an array of numbers.' });
    }

    const productIdNumber = Number(productId);
    const product = await Product.findOne({ productId: productIdNumber });

    if (!product) {
      return res.status(404).send('Product not found.');
    }

    const variantsToUpdate = product.variants.filter(variant => variantIds.includes(variant.name));

    if (variantsToUpdate.length === 0) {
      return res.status(400).send('No valid variants found for the given variantIds.');
    }

    const uniqueUserEmails = [
      ...new Set(
        variantsToUpdate
          .map(variant => variant.user && variant?.user[0]?.email)
          .filter(email => email)
      ),
    ];

    console.log("uniqueUserEmails :", uniqueUserEmails);
    for (const userEmail of uniqueUserEmails) {
      const variantsForUser = variantsToUpdate.filter(variant => {
        return variant.user && variant.user[0]?.email === userEmail;
      });

      const variantNames = variantsForUser.map(variant => variant.name);
      console.log(userEmail, product.productId, variantNames);

      // Send email notification to the user
      await sendEmailNotification(userEmail, product.productId, variantNames);

      // Update the isNotified status for the variants
      for (const variant of variantsForUser) {
        variant.isNotified = true;
      }

      // Save the subdocuments after setting the isNotified field
      await Promise.all(variantsForUser.map(variant => variant.save()));
    }

    // Save the parent document (Product) after updating all subdocuments
    product.markModified('variants');
    await product.save();

    const response = "Notification sent to users and variants updated.";
    res.status(200).send(response);

  } catch (error) {
    console.log("Error:", error.message);
    res.status(500).send('An error occurred while processing your request.');
  }
});


app.get('/api/get-restock-notified', async (req, res) => {
  const email = req.query.email?.toString();
  const productId = req.query.productId ? String(req.query.productId) : null;
  const variantIds = req.query.variantIds ? JSON.parse(req.query.variantIds.toString()) : [];
  const shopId = req.query.shopId ? Number(req.query.shopId) : null;

  try {
    if (!email || !validator.isEmail(email)) {
      return res.status(400).send('Please provide a valid email.');
    }

    if (!productId || isNaN(Number(productId))) {
      return res.status(400).send('Please provide a valid productId.');
    }

    if (!Array.isArray(variantIds) || variantIds.some(isNaN)) {
      return res.status(400).json({ error: 'Please provide valid variantIds as an array of numbers.' });
    }

    if (!shopId || isNaN(shopId)) {
      return res.status(400).send('Please provide a valid shopId.');
    }

    const productIdNumber = Number(productId);
    const user = await User.findOne({ email: email });

    // Check if the product exists, if not, create a new product
    let product = await Product.findOne({ productId: productIdNumber, shopId: shopId });
    if (!product) {
      const newVariants = variantIds.map(variantId => ({
        name: variantId,
        isNotified: false,
        user: [{ email: email }], // Make sure user is an array with a single object containing email
      }));
      product = new Product({ productId: productIdNumber, shopId: shopId, variants: newVariants });
      await product.save();
    } else {
      // If the product exists, update the variant users to avoid duplicates
      for (const variantId of variantIds) {
        const variantIndex = product.variants.findIndex(v => v.name === variantId);
        if (variantIndex !== -1) {
          const variant = product.variants[variantIndex];
          if (!variant.user.some(u => u.email === email)) {
            variant.user.push({ email: email });
          }
        } else {
          const newVariant = {
            name: variantId,
            isNotified: false,
            user: [{ email: email }], // Make sure user is an array with a single object containing email
          };
          product.variants.push(newVariant);
        }
      }
      await product.save();
    }

    if (!user) {
      const newUser = new User({ email: email, products: [productIdNumber] });
      await newUser.save();
    } else {
      const userVariantIds = new Set(user.products.map(productId => productId));
      for (const variantId of variantIds) {
        userVariantIds.add(variantId);
      }
      user.products = Array.from(userVariantIds);
      await user.save();
    }

    const response = "You will be notified once the product is restocked.";
    res.status(200).send(response);

  } catch (error) {
    console.log("Error:", error.message);
    res.status(500).send('An error occurred while processing your request.');
  }
});


// app.use("/api/get-restock-notified",shopify.ensureInstalledOnShop());
app.use("/api/*", shopify.validateAuthenticatedSession());

app.use(express.json());

// for shop detail
app.get("/api/shopdetail", async (req, res) => {
  const shopData = await shopify.api.rest.Shop.all({
    session: res.locals.shopify.session,
  });
  const shopMetaData = await shopify.api.rest.Metafield.all({
    session: res.locals.shopify.session,
  });
  const data = {shopdata: shopData.data, metadata: shopMetaData.data};
  res.status(200).send(data);
});



// save activation status to metafield 
app.post("/api/updateshopdetail", async (req, res) => {
  console.log(req);
  const session = res.locals.shopify.session;
  const metafield = new shopify.api.rest.Metafield({session: session});
    metafield.namespace = "restock_alert";
    metafield.key = "status";
    metafield.type = "single_line_text_field";
    metafield.value = req.body.enable_disable_status;
    await metafield.save({
      update: true,
    });
  res.status(200).send(metafield);
});

app.get("/get-restock-notified", async (_req, res) => {
  console.log(_req);
  const response = "got notified";
  res.status(200).send(response);
});

app.get("/api/products/count", async (_req, res) => {
  const countData = await shopify.api.rest.Product.count({
    session: res.locals.shopify.session,
  });
  res.status(200).send(countData);
});

app.get("/api/products/create", async (_req, res) => {
  let status = 200;
  let error = null;

  try {
    await productCreator(res.locals.shopify.session);
  } catch (e) {
    console.log(`Failed to process products/create: ${e.message}`);
    status = 500;
    error = e.message;
  }
  res.status(status).send({ success: status === 200, error });
});


app.use(shopify.cspHeaders());
app.use(serveStatic(STATIC_PATH, { index: false }));

app.use("/*", shopify.ensureInstalledOnShop(), async (_req, res, _next) => {
  return res
    .status(200)
    .set("Content-Type", "text/html")
    .send(readFileSync(join(STATIC_PATH, "index.html")));
});

// app.listen(PORT);

app.listen(PORT, async () => {
  console.log("Server has started");
  try {
    await connectToDB();
    console.log("Successfully Connected to db 🚀🚀");
  } catch (err) {
    console.log("❌❌Error during connection to database❌❌:", err);
  }
});
