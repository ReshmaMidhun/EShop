# 🛒 E-Commerce Website  

A simple e-commerce web application where users can browse products, view details, and add items to the cart.  

## 📌 Features  
- Product listing with images and details  
- Add to Cart functionality  
- View cart with selected products and total price  
- Responsive design for mobile and desktop  
- Backend API integration for product data, cart, orders.

## 🛠️ Tech Stack  

| Layer        | Technology         |
|--------------|--------------------|
| Backend      | Node.js, Express.js |
| Database     | MySQL              |
| Payment      | Stripe             |
| Deployment   | AWS EC2, Nginx     |


## 📦 Installation and Set up
```bash
1. Clone the repository:
git clone https://github.com/your-username/your-repo-name.git
cd your-repo-name

2.Install backend dependencies:
npm install

3. Set up the database:
Update db.js with your DB credentials.

4. Create a .env file with your credentials:
# Database Configuration
DB_HOST=localhost
DB_USER=root
DB_PASS=yourpassword

# Stripe Payment
STRIPE_SECRET_KEY=sk_test_XXXXXXXXXXXXXXXX

# Application URL
DOMAIN=https://shopwitheshop.com      # or http://localhost:3000 for local

# Session Secret
SESSION_SECRET=8f9d7e5b1c2a3f4d6e7b8c9d0a1b2c3d


5.Start the server:
node server.js

6.Open index.html in your browser to view the site.

7.📸 Screenshots
[![Homepage](assets/screenshot1.png)]
[![Products Page](assets/screenshot2.png)] 
[![Single Product Details Page](assets/screenshot3.png)]
[![Cart Page](assets/screenshot4.png)] 
[![Users My Orders Page](assets/screenshot6.png)] 
[![Customer Orders Page-Admin Dashboard](assets/screenshot5.png)] 

8. 🌐 Live Demo
[View Live Project](https://shopwitheshop.com)

9.🙌 Contributing
Contributions are welcome! Please fork the repo and submit a pull request.
