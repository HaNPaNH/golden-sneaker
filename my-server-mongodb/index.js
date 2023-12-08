const express = require('express');
const app = express();
const port = 3000;

const morgan = require("morgan")
app.use(morgan("combined"))

const bodyParser = require("body-parser")
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

const cors = require("cors");
app.use(cors())

app.listen(port, () => {
  console.log(`My Server listening on port ${port}`)
})

app.get("/", (req, res) => {
  res.send("This Web server is processed for MongoDB")
})

const { MongoClient, ObjectId } = require('mongodb');
client = new MongoClient("mongodb://127.0.0.1:27017");
client.connect();
database = client.db("CartData");
productCollection = database.collection("Product");
cartCollection = database.collection("Cart");

// Lấy danh sách sản phẩm
app.get("/products", async (req, res) => {
  try {
    const products = await productCollection.find().toArray();
    res.json(products);
  } catch (error) {
    res.status(500).json({ error: "Internal server error" });
  }
});

// Thêm sản phẩm vào giỏ hàng
app.post("/cart", async (req, res) => {
  try {
    const productId = req.body.productId;
    const product = await productCollection.findOne({ _id: ObjectId(productId) });

    if (!product) {
      res.status(404).json({ error: "Product not found" });
      return;
    }

    const existingProduct = await cartCollection.findOne({ productId: ObjectId(productId) });

    if (existingProduct) {
      res.status(400).json({ error: "Product already in cart" });
      return;
    }

    const cartProduct = {
      productId: ObjectId(productId),
      name: product.name,
      price: product.price,
      image: product.image,
      amount: 1
    };

    await cartCollection.insertOne(cartProduct);
    res.json(cartProduct);
  } catch (error) {
    res.status(500).json({ error: "Internal server error" });
  }
});

// Lấy danh sách sản phẩm trong giỏ hàng
app.get("/cart", async (req, res) => {
  try {
    const cartProducts = await cartCollection.find().toArray();
    res.json(cartProducts);
  } catch (error) {
    res.status(500).json({ error: "Internal server error" });
  }
});

// Thay đổi số lượng sản phẩm trong giỏ hàng
app.patch("/cart/:id", async (req, res) => {
  try {
    const productId = req.params.id;
    const action = req.body.action;

    const product = await cartCollection.findOne({ _id: ObjectId(productId) });

    if (!product) {
      res.status(404).json({ error: "Product not found in cart" });
      return;
    }

    let newAmount = product.amount;

    if (action === "increase") {
      newAmount++;
    } else if (action === "decrease") {
      newAmount--;
      if (newAmount <= 0) {
        await cartCollection.deleteOne({ _id: ObjectId(productId) });
        res.json({ message: "Product removed from cart" });
        return;
      }
    }

    await cartCollection.updateOne({ _id: ObjectId(productId) }, { $set: { amount: newAmount } });
    res.json({ amount: newAmount });
  } catch (error) {
    res.status(500).json({ error: "Internal server error" });
  }
});

// Xóa sản phẩm khỏi giỏ hàng
app.delete("/cart/:id", async (req, res) => {
  try {
    const productId = req.params.id;

    const product = await cartCollection.findOne({ _id: ObjectId(productId) });

    if (!product) {
      res.status(404).json({ error: "Product not found in cart" });
      return;
    }

    await cartCollection.deleteOne({ _id: ObjectId(productId) });
    res.json({ message: "Product removed from cart" });
  } catch (error) {
    res.status(500).json({ error: "Internal server error" });
  }
});