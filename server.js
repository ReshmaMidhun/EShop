const express = require('express');
const dotenv = require('dotenv');
const session = require("express-session");
const stripe = require("stripe");
const path = require("path");

const upload = require("./multerConfig");

const nodemailer = require("nodemailer");




const bcrypt = require("bcrypt");
const saltRounds = 10; //cost factor for hashing

const db = require("./db");

// Make it promise-compatible
const dbPromise = db.promise();

const app = express();

dotenv.config();
app.use(express.static(path.join(__dirname, "public")));

app.use(express.json());

app.use('/img', express.static('public/img'));


//Session SetUp
const isProduction = process.env.NODE_ENV === "production";

app.use(session({
    secret: process.env.SESSION_SECRET, 
    resave: false,
    saveUninitialized: false,           
    cookie: {
        secure: isProduction,       // true in production, false locally
        maxAge: 1000 * 60 * 60      // 1 hour
    }
}));
app.get("/", (req, res) => {
    res.sendFile("index.html", { root : "public"});
})
//Success
app.get("/success", (req, res) => {
    res.sendFile("success.html", { root: "public"});
});

//Cancel
app.get("/cancel", (req, res) => {
    res.sendFile("cancel.html", { root: "public"});
});


//Stripe
let stripeGateway = stripe(process.env.stripe_api);
const DOMAIN = process.env.DOMAIN;

//Add product route
app.post("/addProduct", upload.fields([
    { name: 'images', maxCount: 1 },
    { name: 'images', maxCount: 4 }
]), (req, res) => {
    const { name, price, category, subcategory, stock, description } = req.body;
    const image_url = `/img/${req.files['images'][0].filename}`;
    const category_id = parseInt(category);
    const subcategory_id = parseInt(subcategory);

    
   const sql = `INSERT INTO products(name, price, image_url, category_id, subcategory_id, description) VALUES (?, ?, ?, ?, ?, ?)`;
    db.query(sql, [name, price, image_url, category_id, subcategory_id, description], (err, result) => {
       console.log("SQL:", sql, [name, price, image_url, category_id, subcategory_id, description]);

        if (err) return res.status(500).json({ message: "Database Error in products table" });

       const productId = result.insertId;
  
        const sizes = ['S','M','L','XL'];
        const sizeInserts = [];
        sizes.forEach(size => {
            const stock = req.body[`stock_${size}`];
            if (stock && parseInt(stock) > 0) {
                sizeInserts.push([productId, size, parseInt(stock)]);
            }
            
        });console.log(sizeInserts);

        if (sizeInserts.length > 0) {
            const sql1 = `INSERT INTO product_sizes (product_id, size, stock) VALUES ?`;
            console.log(sql1);
            db.query(sql1, [sizeInserts], (err2) => {
                if (err2) return res.status(500).json({ message: "Database Error in product_sizes" });

                
            });
        }
          // Insert additional images
             if (req.files['images'] && req.files['images'].length > 0) {
                const imagesData = req.files['images'].map(file => [productId, `/img/${file.filename}`, new Date()]);
                db.query(`INSERT INTO product_images (product_id, image_url, created_at) VALUES ?`, [imagesData], (err3) => {
                    if (err3) return res.status(500).json({ message: "Database Error in product_images" });

                    // Send response once after all inserts
                });
            } else {
                // Send response once if no additional images
                
            }
           return res.json({ message: "Product added successfully with main image only." });
    
    });
});


app.post("/register", (req, res) => {
     console.log("Request body:", req.body);
    const {name, email, password } = req.body;


     if (!name || !email || !password) {
        return res.status(400).json({ success: false, message: "All fields are required" });
    }

    // Check if email already exists
    const checkQuery = "SELECT * FROM users WHERE email = ?";
    db.query(checkQuery, [email], (err, result) => {
        if (err) {
            console.error(err);
            return res.status(500).json({ success: false, message: "Database error" });
        }

        if (result.length > 0) {
            return res.status(400).json({ success: false, message: "Email already registered" });
        }
    

    //has password
    bcrypt.hash(password, saltRounds, (err, hash) => {
        if(err) {
            console.error(err);
            return res.status(500).json({ message : "Error hashing Password"});
        }
        const query = "INSERT INTO users(name, email, password_hash) VALUES (?, ?, ?)";
        console.log(query);
        console.log(name);
        console.log(email);
        console.log(password);
        db.query(query, [name, email, hash], (err, result) => {
            if(err) {
                console.error(err);
                return res.status(500).json({ message : "Database error" });
            }
            res.json({ message : "User Registered Successfully "});
        }); 
    });

});
});

app.get("/adminViewProducts",  (req, res) => {
    const sql = `SELECT p.id, p.name,p.price, p.image_url, 
        c.name AS category, 
        s.name AS subcategory, 
        ps.size AS size, ps.stock AS stock FROM products p 
        LEFT JOIN categories c ON p.category_id = c.id 
        LEFT JOIN subcategories s ON p.subcategory_id = s.id 
        LEFT JOIN product_sizes ps ON p.id = ps.product_id 
        ORDER BY id DESC`;
    db.query(sql, (err, result) => {
        if(err) {
            console.error(err);
            return res.status(500).json({ message : "Error in Fetching Data" });   
        }
        res.json(result);
    });
});

app.post("/updateStock", (req, res) => {
    const {product_id, size, stock } = req.body;
    const sql ="UPDATE product_sizes SET stock =? WHERE product_id = ? AND size = ?";
    console.log(sql);
    console.log(product_id, size, stock);

    db.query(sql, [stock, product_id, size], (err, result) => {
        if(err){ console.error(err);
            return res.status(500).json({ message : "Error in Updation" });
        }
        res.json({ message : "Updated Successfully "});
    });
})

app.post("/deleteItem", (req, res) => {
    const { product_id, size } = req.body;
    const sql ="DELETE FROM product_sizes WHERE product_id = ? AND size = ?";
    console.log(sql);
    console.log(product_id, size);

    db.query(sql, [product_id , size], (err, result) => {
        if(err){ console.error(err);
            return res.status(500).json({ message : "Error in Updation" });
        }
        res.json({ message : "Deleted Successfully "});
    });
})

app.post("/submitContact", (req, res) => {
    const { name, email, subject, message } = req.body;

    //save to database
    const sql ="INSERT INTO contact_messages(name, email, subject, message, created_at) VALUES(?, ?, ?, ?, NOW())";
    db.query(sql, [name, email, subject, message], (err, result) => {
        if(err) {
            console.error(err);
            return res.status(500).json({ message: "Failed to Send Message" });
        }
        res.json({ message: "Message Sent Successfully "});
    });
});

app.get("/loadMessages", (req, res) => {
    const sql = "SELECT * FROM contact_messages ORDER BY created_at DESC";
    db.query(sql, (err, result) => {
        if(err) {
            console.error(err);
            return res.status(500).json({ message : "Error Fetching Messages" });
        }
        res.json(result);
    });
});

app.post("/markAsRead" ,(req, res) => {
    const { id } = req.body;
    const sql ="UPDATE contact_messages set status ='Read' WHERE id = ?";
    db.query(sql, [id], (err, result) => {
        if(err) { 
            console.error(err);
            res.status(500).json({ message: "Error Updatig status" });
        }
        res.json({ message: "Message marked as Read" });
    });
});

app.get("/countUnreadMessages", (req, res) => {
    const sql = "SELECT COUNT(*) AS count FROM contact_messages WHERE status='unread'";
    db.query(sql, (err, result) => {
        if (err) return res.status(500).json({ count: 0 });
        res.json({ count: result[0].count });
    });
});




app.post("/login", (req, res) => {
    const {email, password} = req.body;
   // console.log(req.body);
    const query ="SELECT * FROM users WHERE email=?";
    
        db.query(query, [email], (err, result) => {
     //       console.log(result);
        if(err) {
            console.error(err);
            return;
        } 
        if (result.length === 0) {
            return res.status(401).json({ message: "Invalid email or password" });
        }

        const user = result[0];
         // Compare hashed password
        bcrypt.compare(password, user.password_hash, (err, isMatch) => {
        if (err) {
            console.error(err);
            return res.status(500).json({ message: "Error checking password" });
            }

        if (isMatch) {
        // Passwords match, create session
        req.session.user = { id: user.id, email: user.email, username: user.name};
        return res.json({ message: "Login successful" });
        } else {
            return res.status(401).json({ message: "Invalid email or password" });
        }

    });
});
});

app.get("/api/current_user", (req, res) => {
  if (!req.session.user) {
    return res.status(401).json({ message: "Not logged in" });
  }
  res.json(req.session.user);
//  console.log(req.session.user);
});

app.post("/logout", (req, res) => {
    req.session.destroy(err => {
        if(err) {
            console.error("Logout Error :",err);
            return res.status(500).json({ message : "LogOut Failed"});
        };
        res.clearCookie("connect.sid");
        res.json({ message : "Logged Out Succesfully"});
    });
});

app.get("/products", (req, res) => {
    db.query("SELECT * FROM PRODUCTS", (err, result) => {
        if(err) {
            console.log("Error in Fetching");
            res.status(500).send("Error Fetching products");
            return;
        }
        res.json(result);
    })
})


app.get("/sproduct", (req, res) => {
    db.query("SELECT * FROM products", (err, result) => {
        if(err) {
            console.log("Error in Fetching", err);
            res.status(500).send("Error in Fetching Products");
            return;
        }
        res.json(result);
    })
})

app.get("/product_sizes/:id", (req, res) => {
    const id = req.params.id;
    const query = "SELECT size,stock FROM product_sizes where product_id =? ORDER BY FIELD(size, 'S', 'M', 'L', 'XL', 'XXL')";
    db.query(query, [id], (err, result) => {
        if(err) {
            return res.status(500).json({ error :err});
        }
        res.json(result);
        console.log(result);
    })
})
app.get('/sproduct/:id', (req, res) => {
    const id = req.params.id;
    const sql = "SELECT * FROM products WHERE id = ?";
    
    db.query(sql, [id], (err, results) => {
        if (err) return res.status(500).json({ error: err });
        if (results.length === 0) return res.status(404).json({ error: "Product not found" });
        res.json(results[0]);
    });
});


app.get('/sproduct/:id/images', (req, res) => {
    const productId = req.params.id;
    db.query('SELECT p.id, pi.image_url AS additional_image FROM products p LEFT JOIN product_images pi ON p.id= pi.product_id WHERE product_id = ?', [productId], (err, results) => {
        if (err) return res.status(500).json({ error: 'Database error' });
        res.json(results); // returns [{ image_url: "..." }, ...]
    });
});

app.post("/cart", (req, res) => {
    
    const { product_id,quantity, size} = req.body;
    const user_id = req.session.user.id;
    const query = "INSERT INTO cart (user_id, product_id,size, quantity) VALUES(?, ?,?, ?) ON DUPLICATE KEY UPDATE quantity = quantity +?";
    db.query(query, [user_id, product_id,size , quantity, quantity], (err) => {
        if(err) return res.status(500).json({ error:err });
        res.json({ message : "Insertion Successful" });
    });
    /*const stock_query ="UPDATE products SET stock = stock - ? WHERE id =? AND stock =?";
    db.query(stock_query, [quantity, product_id, quantity], (err, result1) => {
        if(err) return res.status(500).json({ error: err });

        res.json({ message : "stock updated" });
    })*/
})

app.get("/cartCount", (req, res) => {
    if (!req.session || !req.session.user) {
        return res.json({ count: 0 });
    }
    const user_id = req.session.user.id;
    const query = "SELECT SUM(quantity) AS count FROM cart WHERE user_id = ?";
    db.query(query, [user_id], (err, result) => {
        if(err) {
            console.error("DB Error", err);
            return res.status(500).json({ count: 0 });
        }
      //  console.log(result);
        const count = result[0].count;
        res.json({ count });
    });
})

app.get("/cartView", (req, res) => {
    const user_id = req.session.user.id;
    const query ="SELECT c.id as cart_id, c.quantity,c.size, p.id as product_id, p.name, p.price, p.image_url,ps.stock AS size_stock FROM cart c JOIN products p ON c.product_id = p.id LEFT JOIN product_sizes ps ON ps.product_id = c.product_id AND ps.size = c.size WHERE c.user_id = ?";
    db.query(query, [user_id], (err, result) => {
        if(err) {
            console.log("DB Error Fetching Cart", err);
            res.status(500).res.json( { error : "Database Error" });
        }
        res.json(result);
      //  console.log(result);
    })
})

app.post("/cartUpdate", (req, res) => {
    const {product_id, quantity, size } =req.body;
    const user_id = req.session.user.id;
    const query ="UPDATE cart SET quantity =? WHERE user_id =? AND product_id =? AND size =?";
    db.query(query, [quantity, user_id,product_id, size], (err, result) => {
        if(err) {
            console.error("DB Update Error", err);
            return res.status(500).res.json({ error : " Database Update Failed "});
        }
        res.json( { message: " Quantity Updated"});
    })

})


app.post("/cartDelete", (req, res) => {
    const {product_id, size} =req.body;
    const user_id = req.session.user.id;
    const query = "DELETE FROM cart WHERE product_id =? AND user_id =? AND size =?";
    db.query(query, [product_id, user_id, size], (err, result) => {
        if(err) {
            console.error("Error in Delete Query", err);
            return res.status(500).json({ error : "Database Delete Failed" });
        }
        res.json({ success : true});
    })
})


app.post("/stripe-checkout", async(req, res) => {
    const  items = req.body.items;
    const user_id = req.session.user.id;
    const lineItems = req.body.items.map((item) => {
        
        const unitAmount = Math.round(parseFloat(item.price) * 100);
        
       // console.log("item-price:", item.price);
        //console.log("unitAmount:", unitAmount);
        return {
            price_data : {
                currency : 'usd',
                product_data: {
                    name: item.name,
                    images: [`http://localhost:3006${item.image_url.trim()}`],
                },
                unit_amount:unitAmount,
            },
            quantity: item.quantity,
        };
    });
        console.log("lineItems", lineItems);
         console.log("Domain:", DOMAIN);
      //Create checkout Session
        const session = await stripeGateway.checkout.sessions.create({
            payment_method_types: ["card"],
            mode: "payment",
            success_url: `${DOMAIN}/success?session_id={CHECKOUT_SESSION_ID}`,
            cancel_url: `${DOMAIN}/cancel`,
            line_items: lineItems,
            metadata: { user_id: req.session.user.id },
            //Asking address In Stripe Checkout Page
            billing_address_collection: "required",
        });
        res.json({ url: session.url });
        console.log("Domain:", user_id);
         console.log("id:", DOMAIN);
    });

    app.get("/success", async (req, res) => {
    const session_id = req.query.session_id;
   console.log("/success");

    try {
        const session = await stripeGateway.checkout.sessions.retrieve(session_id);
        console.log("/success");
        if (session.payment_status === 'paid') {
            const userId = session.metadata.user_id;
            const totalAmount = session.amount_total / 100;
            console.log("paid");
            // Fetch cart items that are still in stock
const [cartItems] = await dbPromise.query(`SELECT c.product_id,c.size,c.quantity, p.price FROM cart c JOIN products p ON c.product_id = p.id JOIN product_sizes ps ON ps.product_id = c.product_id AND ps.size = c.size WHERE c.user_id = ? AND ps.stock > 0`, [userId]);
            console.log(cartItems);
            
            if (cartItems.length > 0) {
                // Insert order
                const [orderResult] = await dbPromise.query('INSERT INTO orders (user_id, total, payment_status) VALUES (?, ?, ?)',[userId, totalAmount, 'paid']);
                const orderId = orderResult.insertId;

                // Insert order items
                for (const item of cartItems) {
                    await dbPromise.query('INSERT INTO order_items (order_id, product_id, quantity, price) VALUES (?, ?, ?, ?)', [orderId, item.product_id, item.quantity, item.price] );
                }

                // Remove only the in-stock purchased items from cart
                const ids = cartItems.map(i => i.product_id);
                //const product_size = item.size;
                if (ids.length > 0) {
    const placeholders = ids.map(() => '?').join(',');
    await dbPromise.query(`DELETE C FROM cart c JOIN product_sizes ps ON ps.product_id = c.product_id AND ps.size = c.size WHERE c.user_id =? AND ps.stock > 0`, [userId]);
    for (const item of cartItems) {
        await dbPromise.query(`UPDATE product_sizes SET stock = stock - ? WHERE product_id = ? AND size = ? AND stock >= ?`, [item.quantity, item.product_id, item.size, item.quantity]);
    }
    }
            }
        }

        res.sendFile( "success.html", { root: "public"}); 
        
    } catch (err) {
        console.error("Error processing order:", err);
        res.status(500).send("Error creating order");
    }
});


app.get("/getProducts", (req, res) => {
    const { categoryId, subCategoryId, sort, maxPrice} = req.query;
    let sql ="SELECT * FROM products WHERE price <=?";
    let params =[maxPrice];

    //console.log(categoryId);
    
    
    if(categoryId && categoryId !== "1") {
        sql += " AND category_id =?";
        params.push(categoryId);
    }
    if (subCategoryId) {
        params =[]
        console.log("params" +params);
        console.log("cate id :"+categoryId);
        console.log("subcat id:" +subCategoryId);
            sql = `SELECT p.* FROM products p LEFT JOIN subcategories s ON p.subcategory_id = s.id WHERE p.category_id = ? AND p.subcategory_id = ?`;
            params.push(categoryId,subCategoryId);
            console.log("params" +params);
        }

    console.log(sql);
    // Sorting logic
    if (sort === "low-to-high") {
        sql += " ORDER BY price ASC";
    } else if (sort === "high-to-low") {
        sql += " ORDER BY price DESC";
    }console.log(sql);
    console.log(params);
    db.query(sql, params, (err, result) => {
        if(err) return res.status(500).send(err);
        res.json(result);
        //console.log(result);
    })

})
const PORT = 80; 
app.listen(PORT, '0.0.0.0', () => {
  console.log(`Server is running on port ${PORT} hai reshma`);
});




