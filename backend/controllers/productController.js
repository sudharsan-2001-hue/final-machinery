const Product = require("../models/Product");
const Category = require("../models/Category");
const Stock = require("../models/Stock");
const User = require("../models/User");

function mapProduct(product) {
  let categoryNameVal = "";
  if (product.categoryId) {
    if (typeof product.categoryId === "object" && product.categoryId.categoryName) {
      categoryNameVal = product.categoryId.categoryName;
    } else {
      categoryNameVal = String(product.categoryId);
    }
  }

  let shopName = "";
  let shopDetails = null;
  if (product.shopId && product.shopDetails) {
    shopName = product.shopDetails.name || "";
    shopDetails = {
      id: product.shopDetails._id,
      name: product.shopDetails.name,
      email: product.shopDetails.email,
      mobile: product.shopDetails.mobile,
      address: product.shopDetails.address,
      district: product.shopDetails.district,
      state: product.shopDetails.state,
      pincode: product.shopDetails.pincode
    };
  }

  return {
    id: product._id,
    name: product.productName,
    productName: product.productName,
    description: product.description,
    originalPrice: product.price,
    price: product.price,
    offerPrice: product.offerPrice,
    stock: product.stock,
    category: categoryNameVal,
    categoryId: product.categoryId,
    image: product.image,
    galleryImages: product.galleryImages,
    shopId: product.shopId,
    shopName: shopName,
    shopDetails: shopDetails,
    status: product.status,
    createdAt: product.createdAt,
    updatedAt: product.updatedAt
  };
}

async function getAllProducts(req, res) {
  try {
    let shopId = req.query.shopId;
    const categoryId = req.query.categoryId;
    const search = req.query.search;

    let query = { status: { $ne: "inactive" } };

    // If user is shop admin, filter by their shopId unless explicitly querying another shop
    if (req.user && (req.user.role === 'shopadmin' || req.user.role === 'seller') && req.user.shopId) {
      shopId = shopId || req.user.shopId;
    }

    if (shopId) {
      query.shopId = shopId;
    }

    if (categoryId) {
      query.categoryId = categoryId;
    }

    if (search) {
      query.$or = [
        { productName: { $regex: search, $options: "i" } },
        { description: { $regex: search, $options: "i" } }
      ];
    }

    const products = await Product.find(query)
      .populate('categoryId', 'categoryName categoryImage')
      .sort({ createdAt: -1 });

    // Fetch shop details for all products
    const shopIds = [...new Set(products.map(p => p.shopId).filter(Boolean))];
    const shops = await User.find({ shopId: { $in: shopIds }, role: { $in: ['seller', 'shopadmin'] } });

    const shopMap = {};
    shops.forEach(shop => {
      shopMap[shop.shopId] = shop;
    });

    // Attach shop details to products
    const productsWithShop = products.map(product => {
      const productObj = product.toObject();
      productObj.shopDetails = shopMap[product.shopId] || null;
      return productObj;
    });

    res.json(productsWithShop.map(mapProduct));
  } catch (err) {
    console.error("Get products error:", err.message);
    res.status(500).json({ message: "Failed to fetch products." });
  }
}

async function getProductById(req, res) {
  try {
    const product = await Product.findById(req.params.id)
      .populate('categoryId', 'categoryName categoryImage');

    if (!product) {
      return res.status(404).json({ message: "Product not found." });
    }

    // Fetch shop details
    let productObj = product.toObject();
    if (product.shopId) {
      const shop = await User.findOne({ shopId: product.shopId, role: { $in: ['seller', 'shopadmin'] } });
      productObj.shopDetails = shop;
    }

    res.json(mapProduct(productObj));
  } catch (err) {
    console.error("Get product error:", err.message);
    res.status(500).json({ message: "Failed to fetch product." });
  }
}

async function createProduct(req, res) {
  const name = req.body.name || req.body.productName;
  const description = req.body.description;
  const originalPrice = req.body.originalPrice !== undefined ? req.body.originalPrice : req.body.price;
  const offerPrice = req.body.offerPrice !== undefined ? req.body.offerPrice : (req.body.price !== undefined ? req.body.price : req.body.offerPrice);
  const stock = req.body.stock;
  const category = req.body.category || req.body.categoryId;
  const image = req.body.image;
  const { shopId, weight, brand, model, specifications, galleryImages } = req.body;

  if (!name || !description || originalPrice == null || offerPrice == null || stock == null || !category) {
    return res.status(400).json({ message: "All product fields are required." });
  }

  try {
    let categoryDoc = await Category.findOne({ categoryName: category });
    
    if (!categoryDoc) {
      categoryDoc = await Category.create({ 
        categoryName: category,
        categoryImage: null
      });
    }

    const status = Number(stock) > 0 ? "active" : "out_of_stock";

    const product = await Product.create({
      shopId: shopId || "SHOP001",
      categoryId: categoryDoc._id,
      productName: name.trim(),
      description: description.trim(),
      price: Number(originalPrice),
      offerPrice: Number(offerPrice),
      stock: Number(stock),
      weight: weight || "",
      brand: brand || "",
      model: model || "",
      specifications: specifications || "",
      image: image || "",
      galleryImages: galleryImages || [],
      status: status
    });

    // Create stock entry
    await Stock.create({
      productId: product._id,
      shopId: shopId || "SHOP001",
      availableStock: Number(stock),
      reservedStock: 0,
      minimumStock: 0,
      updatedBy: req.user?.id?.toString() || "system"
    });

    const savedProduct = await Product.findById(product._id)
      .populate('categoryId', 'categoryName categoryImage');

    res.status(201).json(mapProduct(savedProduct));
  } catch (err) {
    console.error("Add product error:", err.message);
    res.status(500).json({ message: "Failed to register product." });
  }
}

async function updateProduct(req, res) {
  const name = req.body.name || req.body.productName;
  const description = req.body.description;
  const originalPrice = req.body.originalPrice !== undefined ? req.body.originalPrice : req.body.price;
  const offerPrice = req.body.offerPrice !== undefined ? req.body.offerPrice : req.body.price;
  const stock = req.body.stock;
  const category = req.body.category || req.body.categoryId;
  const image = req.body.image;
  const { weight, brand, model, specifications, galleryImages } = req.body;

  try {
    const updateData = {};
    
    if (category) {
      let categoryDoc = await Category.findOne({ categoryName: category });
      if (!categoryDoc) {
        categoryDoc = await Category.create({ 
          categoryName: category,
          categoryImage: null
        });
      }
      updateData.categoryId = categoryDoc._id;
    }
    
    if (name) updateData.productName = name.trim();
    if (description) updateData.description = description.trim();
    if (originalPrice != null) updateData.price = Number(originalPrice);
    if (offerPrice != null) updateData.offerPrice = Number(offerPrice);
    if (stock != null) {
      updateData.stock = Number(stock);
      updateData.status = Number(stock) > 0 ? "active" : "out_of_stock";
    }
    if (weight !== undefined) updateData.weight = weight;
    if (brand !== undefined) updateData.brand = brand;
    if (model !== undefined) updateData.model = model;
    if (specifications !== undefined) updateData.specifications = specifications;
    if (image !== undefined) updateData.image = image;
    if (galleryImages !== undefined) updateData.galleryImages = galleryImages;

    const product = await Product.findByIdAndUpdate(req.params.id, updateData, { new: true });

    if (!product) {
      return res.status(404).json({ message: "Product not found." });
    }

    // Update stock if stock changed
    if (stock != null) {
      await Stock.findOneAndUpdate(
        { productId: req.params.id },
        { 
          availableStock: Number(stock),
          updatedBy: req.user?.id?.toString() || "system"
        }
      );
    }

    const updatedProduct = await Product.findById(req.params.id)
      .populate('categoryId', 'categoryName categoryImage');

    res.json(mapProduct(updatedProduct));
  } catch (err) {
    console.error("Update product error:", err.message);
    res.status(500).json({ message: "Failed to update product." });
  }
}

async function deleteProduct(req, res) {
  try {
    const id = req.params.id;

    await Stock.deleteOne({ productId: id });
    const product = await Product.findByIdAndDelete(id);

    if (!product) {
      return res.status(404).json({ message: "Product not found." });
    }

    res.json({ message: "Product deleted successfully." });
  } catch (err) {
    console.error("Delete product error:", err.message);
    res.status(500).json({ message: "Failed to delete product." });
  }
}

async function updateStock(req, res) {
  const { stock, remarks } = req.body;

  if (stock == null) {
    return res.status(400).json({ message: "Stock value is required." });
  }

  try {
    const product = await Product.findById(req.params.id);

    if (!product) {
      return res.status(404).json({ message: "Product not found." });
    }

    const previousStock = product.stock;
    const newStock = Number(stock);
    const status = newStock > 0 ? "active" : "out_of_stock";

    const updatedProduct = await Product.findByIdAndUpdate(
      req.params.id,
      { 
        stock: newStock,
        status: status
      },
      { new: true }
    );

    await Stock.findOneAndUpdate(
      { productId: req.params.id },
      { 
        availableStock: newStock,
        updatedBy: req.user?.id?.toString() || "system"
      }
    );

    const savedProduct = await Product.findById(req.params.id)
      .populate('categoryId', 'categoryName categoryImage');

    res.json(mapProduct(savedProduct));
  } catch (err) {
    console.error("Update stock error:", err.message);
    res.status(500).json({ message: "Failed to update stock." });
  }
}

module.exports = {
  getAllProducts,
  getProductById,
  createProduct,
  updateProduct,
  deleteProduct,
  updateStock
};
