import { db } from './index.js';
import { products, categories, tags, productCategories, productTags, ingredients, users } from './schema.js';
import { generateSlug } from '../utils/slug.js';
import { eq } from 'drizzle-orm';

export async function seedProducts() {
  console.log('Seeding products (10 per category)...');

  // Get all categories
  const allCategories = await db.query.categories.findMany();
  if (allCategories.length === 0) {
    console.log('No categories found. Run category seed first.');
    return;
  }

  // Get or create owner
  const owner = await db.query.users.findFirst({
    where: eq(users.role, 'owner'),
  });

  // Get all tags
  const allTags = await db.query.tags.findMany();
  const tagMap = new Map(allTags.map(t => [t.name.toLowerCase(), t]));

  const productsByCategory: Record<string, Array<{
    name: string;
    price: string;
    description: string;
    cover: string;
    tags: string[];
    ingredients: Array<{ name: string; quantity: string; unit: string }>;
  }>> = {
    Pizza: [
      { name: 'Margherita', price: '12.99', description: 'Classic tomato sauce, mozzarella, and basil', cover: 'https://images.unsplash.com/photo-1574071318508-1cdbab80d002?w=500', tags: ['Vegetarian', 'Popular'], ingredients: [{ name: 'Tomato Sauce', quantity: '150', unit: 'ml' }, { name: 'Mozzarella', quantity: '200', unit: 'g' }, { name: 'Basil', quantity: '10', unit: 'g' }] },
      { name: 'Pepperoni', price: '14.99', description: 'Tomato sauce, mozzarella, and pepperoni', cover: 'https://images.unsplash.com/photo-1628840042765-356cda07504e?w=500', tags: ['Spicy', 'Popular'], ingredients: [{ name: 'Tomato Sauce', quantity: '150', unit: 'ml' }, { name: 'Mozzarella', quantity: '200', unit: 'g' }, { name: 'Pepperoni', quantity: '100', unit: 'g' }] },
      { name: 'Quattro Formaggi', price: '15.99', description: 'Four cheese pizza with mozzarella, gorgonzola, parmesan, and fontina', cover: 'https://images.unsplash.com/photo-1513104890138-7c749659a591?w=500', tags: ['Vegetarian', 'Chef Special'], ingredients: [{ name: 'Mozzarella', quantity: '100', unit: 'g' }, { name: 'Gorgonzola', quantity: '80', unit: 'g' }, { name: 'Parmesan', quantity: '50', unit: 'g' }] },
      { name: 'Diavola', price: '14.49', description: 'Spicy salami, tomato sauce, mozzarella, and chili peppers', cover: 'https://images.unsplash.com/photo-1534308983496-4fabb1a015ee?w=500', tags: ['Spicy', 'Hot'], ingredients: [{ name: 'Tomato Sauce', quantity: '150', unit: 'ml' }, { name: 'Salami', quantity: '100', unit: 'g' }, { name: 'Chili Peppers', quantity: '20', unit: 'g' }] },
      { name: 'Vegetariana', price: '13.49', description: 'Grilled vegetables, tomato sauce, and mozzarella', cover: 'https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?w=500', tags: ['Vegetarian', 'Vegan'], ingredients: [{ name: 'Zucchini', quantity: '80', unit: 'g' }, { name: 'Eggplant', quantity: '80', unit: 'g' }, { name: 'Bell Peppers', quantity: '60', unit: 'g' }] },
      { name: 'Prosciutto e Funghi', price: '14.99', description: 'Ham, mushrooms, tomato sauce, and mozzarella', cover: 'https://images.unsplash.com/photo-1555939594-58d7cb561ad1?w=500', tags: ['Popular'], ingredients: [{ name: 'Prosciutto', quantity: '80', unit: 'g' }, { name: 'Mushrooms', quantity: '100', unit: 'g' }, { name: 'Mozzarella', quantity: '150', unit: 'g' }] },
      { name: 'Capricciosa', price: '15.49', description: 'Ham, mushrooms, artichokes, olives, and mozzarella', cover: 'https://images.unsplash.com/photo-1593560708920-6316e4e6d55e?w=500', tags: ['Chef Special'], ingredients: [{ name: 'Prosciutto', quantity: '60', unit: 'g' }, { name: 'Artichokes', quantity: '80', unit: 'g' }, { name: 'Olives', quantity: '40', unit: 'g' }] },
      { name: 'Marinara', price: '9.99', description: 'Tomato sauce, garlic, oregano, and olive oil (no cheese)', cover: 'https://images.unsplash.com/photo-1571407970349-9c66b2e7f13d?w=500', tags: ['Vegan', 'Gluten-Free'], ingredients: [{ name: 'Tomato Sauce', quantity: '200', unit: 'ml' }, { name: 'Garlic', quantity: '15', unit: 'g' }, { name: 'Oregano', quantity: '5', unit: 'g' }] },
      { name: 'Parma', price: '16.99', description: 'Parma ham, arugula, parmesan, and mozzarella', cover: 'https://images.unsplash.com/photo-1590947132387-155cc02f309a?w=500', tags: ['Chef Special', 'Popular'], ingredients: [{ name: 'Parma Ham', quantity: '80', unit: 'g' }, { name: 'Arugula', quantity: '40', unit: 'g' }, { name: 'Parmesan', quantity: '60', unit: 'g' }] },
      { name: 'Calzone', price: '14.99', description: 'Folded pizza with ricotta, mozzarella, and ham', cover: 'https://images.unsplash.com/photo-1585238342024-78d387f4a707?w=500', tags: ['Popular'], ingredients: [{ name: 'Ricotta', quantity: '100', unit: 'g' }, { name: 'Mozzarella', quantity: '100', unit: 'g' }, { name: 'Prosciutto', quantity: '60', unit: 'g' }] },
    ],
    Burgers: [
      { name: 'Classic Burger', price: '10.99', description: 'Beef patty, lettuce, tomato, cheese, and special sauce', cover: 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=500', tags: ['Popular'], ingredients: [{ name: 'Beef Patty', quantity: '200', unit: 'g' }, { name: 'Bun', quantity: '1', unit: 'pc' }, { name: 'Cheese', quantity: '50', unit: 'g' }] },
      { name: 'Cheeseburger', price: '11.49', description: 'Double beef patty with double cheese', cover: 'https://images.unsplash.com/photo-1550547660-d9450f859349?w=500', tags: ['Popular', 'Hot'], ingredients: [{ name: 'Beef Patty', quantity: '300', unit: 'g' }, { name: 'Cheddar', quantity: '100', unit: 'g' }, { name: 'Bun', quantity: '1', unit: 'pc' }] },
      { name: 'Bacon Burger', price: '12.99', description: 'Beef patty with crispy bacon and BBQ sauce', cover: 'https://images.unsplash.com/photo-1594212699903-ec8a3eca50f5?w=500', tags: ['Chef Special'], ingredients: [{ name: 'Beef Patty', quantity: '200', unit: 'g' }, { name: 'Bacon', quantity: '60', unit: 'g' }, { name: 'BBQ Sauce', quantity: '30', unit: 'ml' }] },
      { name: 'Mushroom Swiss', price: '11.99', description: 'Beef patty with sautéed mushrooms and Swiss cheese', cover: 'https://images.unsplash.com/photo-1553979459-d2229ba7433b?w=500', tags: [], ingredients: [{ name: 'Beef Patty', quantity: '200', unit: 'g' }, { name: 'Mushrooms', quantity: '80', unit: 'g' }, { name: 'Swiss Cheese', quantity: '50', unit: 'g' }] },
      { name: 'Spicy Jalapeño', price: '11.99', description: 'Beef patty with jalapeños and spicy mayo', cover: 'https://images.unsplash.com/photo-1607013251379-e1eecff38266?w=500', tags: ['Spicy', 'Hot'], ingredients: [{ name: 'Beef Patty', quantity: '200', unit: 'g' }, { name: 'Jalapeños', quantity: '40', unit: 'g' }, { name: 'Spicy Mayo', quantity: '30', unit: 'ml' }] },
      { name: 'Chicken Burger', price: '10.49', description: 'Crispy chicken breast with lettuce and mayo', cover: 'https://images.unsplash.com/photo-1615297928064-24977384d0f9?w=500', tags: ['Popular'], ingredients: [{ name: 'Chicken Breast', quantity: '180', unit: 'g' }, { name: 'Bun', quantity: '1', unit: 'pc' }, { name: 'Lettuce', quantity: '30', unit: 'g' }] },
      { name: 'Veggie Burger', price: '9.99', description: 'Plant-based patty with avocado and sprouts', cover: 'https://images.unsplash.com/photo-1520072959219-c595dc870360?w=500', tags: ['Vegetarian', 'Vegan'], ingredients: [{ name: 'Plant Patty', quantity: '180', unit: 'g' }, { name: 'Avocado', quantity: '60', unit: 'g' }, { name: 'Sprouts', quantity: '20', unit: 'g' }] },
      { name: 'BBQ Burger', price: '12.49', description: 'Beef patty with onion rings and BBQ sauce', cover: 'https://images.unsplash.com/photo-1550950158-d0d960dff51b?w=500', tags: ['Chef Special'], ingredients: [{ name: 'Beef Patty', quantity: '200', unit: 'g' }, { name: 'Onion Rings', quantity: '60', unit: 'g' }, { name: 'BBQ Sauce', quantity: '40', unit: 'ml' }] },
      { name: 'Double Stack', price: '14.99', description: 'Two beef patties with all the fixings', cover: 'https://images.unsplash.com/photo-1586190848861-99c9f3c1887d?w=500', tags: ['Popular', 'Hot'], ingredients: [{ name: 'Beef Patty', quantity: '400', unit: 'g' }, { name: 'Cheese', quantity: '80', unit: 'g' }, { name: 'Bun', quantity: '1', unit: 'pc' }] },
      { name: 'Turkey Burger', price: '10.99', description: 'Lean turkey patty with cranberry sauce', cover: 'https://images.unsplash.com/photo-1561651823-34febf5a91aa?w=500', tags: ['Gluten-Free'], ingredients: [{ name: 'Turkey Patty', quantity: '180', unit: 'g' }, { name: 'Cranberry Sauce', quantity: '30', unit: 'ml' }, { name: 'Lettuce', quantity: '30', unit: 'g' }] },
    ],
    Sushi: [
      { name: 'California Roll', price: '8.99', description: 'Crab, avocado, and cucumber roll', cover: 'https://images.unsplash.com/photo-1579584425555-c3ce17fd4351?w=500', tags: ['Popular'], ingredients: [{ name: 'Rice', quantity: '150', unit: 'g' }, { name: 'Crab', quantity: '80', unit: 'g' }, { name: 'Avocado', quantity: '50', unit: 'g' }] },
      { name: 'Salmon Nigiri', price: '6.99', description: 'Fresh salmon over pressed rice (2 pieces)', cover: 'https://images.unsplash.com/photo-1553621042-f6e147245754?w=500', tags: ['Popular', 'Gluten-Free'], ingredients: [{ name: 'Salmon', quantity: '60', unit: 'g' }, { name: 'Rice', quantity: '40', unit: 'g' }, { name: 'Wasabi', quantity: '5', unit: 'g' }] },
      { name: 'Tuna Sashimi', price: '12.99', description: 'Fresh tuna slices (5 pieces)', cover: 'https://images.unsplash.com/photo-1534482421-64566f976cfa?w=500', tags: ['Chef Special', 'Gluten-Free'], ingredients: [{ name: 'Tuna', quantity: '120', unit: 'g' }, { name: 'Wasabi', quantity: '5', unit: 'g' }, { name: 'Soy Sauce', quantity: '30', unit: 'ml' }] },
      { name: 'Spicy Tuna Roll', price: '9.49', description: 'Tuna with spicy mayo and cucumber', cover: 'https://images.unsplash.com/photo-1617196034796-73dfa7b1fd56?w=500', tags: ['Spicy', 'Hot'], ingredients: [{ name: 'Tuna', quantity: '80', unit: 'g' }, { name: 'Spicy Mayo', quantity: '30', unit: 'ml' }, { name: 'Cucumber', quantity: '40', unit: 'g' }] },
      { name: 'Dragon Roll', price: '14.99', description: 'Eel and cucumber topped with avocado', cover: 'https://images.unsplash.com/photo-1611143669185-af224c5e3252?w=500', tags: ['Chef Special'], ingredients: [{ name: 'Eel', quantity: '80', unit: 'g' }, { name: 'Avocado', quantity: '60', unit: 'g' }, { name: 'Rice', quantity: '150', unit: 'g' }] },
      { name: 'Philadelphia Roll', price: '10.49', description: 'Salmon, cream cheese, and cucumber', cover: 'https://images.unsplash.com/photo-1583623025817-d180a2221d0a?w=500', tags: ['Popular'], ingredients: [{ name: 'Salmon', quantity: '60', unit: 'g' }, { name: 'Cream Cheese', quantity: '50', unit: 'g' }, { name: 'Cucumber', quantity: '40', unit: 'g' }] },
      { name: 'Vegetable Roll', price: '6.99', description: 'Cucumber, avocado, carrot, and asparagus', cover: 'https://images.unsplash.com/photo-1552611052-33e04de081de?w=500', tags: ['Vegetarian', 'Vegan'], ingredients: [{ name: 'Cucumber', quantity: '50', unit: 'g' }, { name: 'Avocado', quantity: '50', unit: 'g' }, { name: 'Carrot', quantity: '40', unit: 'g' }] },
      { name: 'Rainbow Roll', price: '15.99', description: 'California roll topped with assorted fish', cover: 'https://images.unsplash.com/photo-1559339352-11d035aa65de?w=500', tags: ['Chef Special', 'Popular'], ingredients: [{ name: 'Salmon', quantity: '40', unit: 'g' }, { name: 'Tuna', quantity: '40', unit: 'g' }, { name: 'Yellowtail', quantity: '40', unit: 'g' }] },
      { name: 'Tempura Roll', price: '10.99', description: 'Shrimp tempura with eel sauce', cover: 'https://images.unsplash.com/photo-1615887023516-9b6bcd559e43?w=500', tags: ['Hot'], ingredients: [{ name: 'Shrimp Tempura', quantity: '100', unit: 'g' }, { name: 'Rice', quantity: '150', unit: 'g' }, { name: 'Eel Sauce', quantity: '30', unit: 'ml' }] },
      { name: 'Chirashi Bowl', price: '18.99', description: 'Assorted sashimi over sushi rice', cover: 'https://images.unsplash.com/photo-1580476262798-bddd9dd90e3e?w=500', tags: ['Chef Special'], ingredients: [{ name: 'Salmon', quantity: '50', unit: 'g' }, { name: 'Tuna', quantity: '50', unit: 'g' }, { name: 'Rice', quantity: '200', unit: 'g' }] },
    ],
    Salads: [
      { name: 'Caesar Salad', price: '9.99', description: 'Romaine lettuce, croutons, parmesan, and Caesar dressing', cover: 'https://images.unsplash.com/photo-1550304943-4f24f54ddde9?w=500', tags: ['Vegetarian', 'Popular'], ingredients: [{ name: 'Romaine Lettuce', quantity: '200', unit: 'g' }, { name: 'Croutons', quantity: '50', unit: 'g' }, { name: 'Parmesan', quantity: '30', unit: 'g' }] },
      { name: 'Greek Salad', price: '10.49', description: 'Tomatoes, cucumber, olives, feta, and olive oil', cover: 'https://images.unsplash.com/photo-1540189549336-e6e99c3679fe?w=500', tags: ['Vegetarian', 'Gluten-Free'], ingredients: [{ name: 'Tomatoes', quantity: '150', unit: 'g' }, { name: 'Feta Cheese', quantity: '80', unit: 'g' }, { name: 'Olives', quantity: '50', unit: 'g' }] },
      { name: 'Caprese Salad', price: '11.99', description: 'Fresh mozzarella, tomatoes, and basil', cover: 'https://images.unsplash.com/photo-1529312266912-b33cf6227e24?w=500', tags: ['Vegetarian', 'Gluten-Free'], ingredients: [{ name: 'Mozzarella', quantity: '150', unit: 'g' }, { name: 'Tomatoes', quantity: '200', unit: 'g' }, { name: 'Basil', quantity: '15', unit: 'g' }] },
      { name: 'Cobb Salad', price: '12.99', description: 'Chicken, bacon, egg, avocado, and blue cheese', cover: 'https://images.unsplash.com/photo-1512621776951-a57141f2eefd?w=500', tags: ['Chef Special'], ingredients: [{ name: 'Chicken', quantity: '100', unit: 'g' }, { name: 'Bacon', quantity: '50', unit: 'g' }, { name: 'Avocado', quantity: '60', unit: 'g' }] },
      { name: 'Waldorf Salad', price: '9.49', description: 'Apple, celery, walnuts, and grapes', cover: 'https://images.unsplash.com/photo-1505253758473-96b701d8fe52?w=500', tags: ['Vegetarian'], ingredients: [{ name: 'Apple', quantity: '100', unit: 'g' }, { name: 'Celery', quantity: '60', unit: 'g' }, { name: 'Walnuts', quantity: '40', unit: 'g' }] },
      { name: 'Quinoa Salad', price: '10.99', description: 'Quinoa with roasted vegetables and lemon dressing', cover: 'https://images.unsplash.com/photo-1512621776951-a57141f2eefd?w=500', tags: ['Vegan', 'Gluten-Free'], ingredients: [{ name: 'Quinoa', quantity: '150', unit: 'g' }, { name: 'Bell Peppers', quantity: '80', unit: 'g' }, { name: 'Zucchini', quantity: '80', unit: 'g' }] },
      { name: 'Nicoise Salad', price: '13.49', description: 'Tuna, green beans, potatoes, and olives', cover: 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=500', tags: ['Gluten-Free'], ingredients: [{ name: 'Tuna', quantity: '100', unit: 'g' }, { name: 'Green Beans', quantity: '100', unit: 'g' }, { name: 'Potatoes', quantity: '150', unit: 'g' }] },
      { name: 'Arugula Salad', price: '9.99', description: 'Arugula with cherry tomatoes and balsamic', cover: 'https://images.unsplash.com/photo-1540420773420-3366772f4999?w=500', tags: ['Vegetarian', 'Vegan'], ingredients: [{ name: 'Arugula', quantity: '150', unit: 'g' }, { name: 'Cherry Tomatoes', quantity: '100', unit: 'g' }, { name: 'Balsamic', quantity: '30', unit: 'ml' }] },
      { name: 'Asian Sesame Salad', price: '10.49', description: 'Mixed greens with sesame ginger dressing', cover: 'https://images.unsplash.com/photo-1512621776951-a57141f2eefd?w=500', tags: ['Vegan'], ingredients: [{ name: 'Mixed Greens', quantity: '150', unit: 'g' }, { name: 'Sesame Seeds', quantity: '20', unit: 'g' }, { name: 'Ginger Dressing', quantity: '40', unit: 'ml' }] },
      { name: 'Spinach Strawberry', price: '11.49', description: 'Baby spinach with strawberries and pecans', cover: 'https://images.unsplash.com/photo-1505253716362-afaea1d3d1af?w=500', tags: ['Vegetarian'], ingredients: [{ name: 'Baby Spinach', quantity: '150', unit: 'g' }, { name: 'Strawberries', quantity: '100', unit: 'g' }, { name: 'Pecans', quantity: '40', unit: 'g' }] },
    ],
    Pasta: [
      { name: 'Spaghetti Carbonara', price: '13.99', description: 'Egg, pecorino cheese, guanciale, and black pepper', cover: 'https://images.unsplash.com/photo-1612874742237-6526221588e3?w=500', tags: ['Popular'], ingredients: [{ name: 'Spaghetti', quantity: '200', unit: 'g' }, { name: 'Guanciale', quantity: '80', unit: 'g' }, { name: 'Pecorino', quantity: '60', unit: 'g' }] },
      { name: 'Penne Arrabbiata', price: '11.99', description: 'Spicy tomato sauce with garlic and red chili', cover: 'https://images.unsplash.com/photo-1563379926898-05f4575a45d8?w=500', tags: ['Spicy', 'Vegan'], ingredients: [{ name: 'Penne', quantity: '200', unit: 'g' }, { name: 'Tomato Sauce', quantity: '200', unit: 'ml' }, { name: 'Red Chili', quantity: '10', unit: 'g' }] },
      { name: 'Fettuccine Alfredo', price: '12.99', description: 'Creamy parmesan sauce with butter', cover: 'https://images.unsplash.com/photo-1645112411341-6c4fd023714a?w=500', tags: ['Vegetarian', 'Popular'], ingredients: [{ name: 'Fettuccine', quantity: '200', unit: 'g' }, { name: 'Parmesan', quantity: '100', unit: 'g' }, { name: 'Butter', quantity: '60', unit: 'g' }] },
      { name: 'Lasagna Bolognese', price: '15.99', description: 'Layered pasta with meat sauce and béchamel', cover: 'https://images.unsplash.com/photo-1574868233972-1e0ae83950c9?w=500', tags: ['Chef Special', 'Popular'], ingredients: [{ name: 'Lasagna Sheets', quantity: '200', unit: 'g' }, { name: 'Ground Beef', quantity: '150', unit: 'g' }, { name: 'Béchamel', quantity: '150', unit: 'ml' }] },
      { name: 'Linguine alle Vongole', price: '16.99', description: 'Clams with white wine and garlic', cover: 'https://images.unsplash.com/photo-1563379091339-03b21ab4a4f8?w=500', tags: ['Chef Special'], ingredients: [{ name: 'Linguine', quantity: '200', unit: 'g' }, { name: 'Clams', quantity: '300', unit: 'g' }, { name: 'White Wine', quantity: '100', unit: 'ml' }] },
      { name: 'Pesto Genovese', price: '12.49', description: 'Fresh basil pesto with pine nuts and parmesan', cover: 'https://images.unsplash.com/photo-1551183053-bf91a1d81141?w=500', tags: ['Vegetarian'], ingredients: [{ name: 'Basil', quantity: '50', unit: 'g' }, { name: 'Pine Nuts', quantity: '40', unit: 'g' }, { name: 'Parmesan', quantity: '60', unit: 'g' }] },
      { name: 'Ravioli Ricotta', price: '13.49', description: 'Ricotta-filled ravioli with sage butter', cover: 'https://images.unsplash.com/photo-1551183053-bf91a1d81141?w=500', tags: ['Vegetarian'], ingredients: [{ name: 'Ravioli', quantity: '250', unit: 'g' }, { name: 'Ricotta', quantity: '100', unit: 'g' }, { name: 'Sage', quantity: '10', unit: 'g' }] },
      { name: 'Cacio e Pepe', price: '11.99', description: 'Pecorino cheese and black pepper', cover: 'https://images.unsplash.com/photo-1612874742237-6526221588e3?w=500', tags: ['Vegetarian', 'Popular'], ingredients: [{ name: 'Tonnarelli', quantity: '200', unit: 'g' }, { name: 'Pecorino', quantity: '100', unit: 'g' }, { name: 'Black Pepper', quantity: '5', unit: 'g' }] },
      { name: 'Aglio e Olio', price: '10.99', description: 'Garlic, olive oil, and chili flakes', cover: 'https://images.unsplash.com/photo-1595295333158-4742f28fbd85?w=500', tags: ['Vegan'], ingredients: [{ name: 'Spaghetti', quantity: '200', unit: 'g' }, { name: 'Garlic', quantity: '20', unit: 'g' }, { name: 'Olive Oil', quantity: '50', unit: 'ml' }] },
      { name: 'Gnocchi Sorrentina', price: '13.99', description: 'Potato gnocchi with tomato and mozzarella', cover: 'https://images.unsplash.com/photo-1551183053-bf91a1d81141?w=500', tags: ['Vegetarian'], ingredients: [{ name: 'Gnocchi', quantity: '300', unit: 'g' }, { name: 'Tomato Sauce', quantity: '200', unit: 'ml' }, { name: 'Mozzarella', quantity: '100', unit: 'g' }] },
    ],
    Desserts: [
      { name: 'Tiramisu', price: '7.99', description: 'Classic Italian dessert with mascarpone and coffee', cover: 'https://images.unsplash.com/photo-1571877227200-a0d98ea607e9?w=500', tags: ['Popular', 'Chef Special'], ingredients: [{ name: 'Mascarpone', quantity: '100', unit: 'g' }, { name: 'Ladyfingers', quantity: '80', unit: 'g' }, { name: 'Espresso', quantity: '100', unit: 'ml' }] },
      { name: 'Panna Cotta', price: '6.99', description: 'Vanilla cream with berry coulis', cover: 'https://images.unsplash.com/photo-1571877227200-a0d98ea607e9?w=500', tags: ['Gluten-Free'], ingredients: [{ name: 'Cream', quantity: '150', unit: 'ml' }, { name: 'Vanilla', quantity: '10', unit: 'g' }, { name: 'Berry Coulis', quantity: '50', unit: 'ml' }] },
      { name: 'Cannoli', price: '5.99', description: 'Sicilian pastry tubes with sweet ricotta', cover: 'https://images.unsplash.com/photo-1551024601-bec78aea704b?w=500', tags: ['Popular'], ingredients: [{ name: 'Ricotta', quantity: '100', unit: 'g' }, { name: 'Pastry Shell', quantity: '2', unit: 'pc' }, { name: 'Chocolate Chips', quantity: '20', unit: 'g' }] },
      { name: 'Gelato', price: '4.99', description: 'Italian ice cream - choice of flavor', cover: 'https://images.unsplash.com/photo-1563805042-7684c019e1cb?w=500', tags: ['Vegetarian'], ingredients: [{ name: 'Milk', quantity: '200', unit: 'ml' }, { name: 'Sugar', quantity: '50', unit: 'g' }, { name: 'Flavor', quantity: '30', unit: 'g' }] },
      { name: 'Affogato', price: '6.49', description: 'Vanilla gelato with hot espresso', cover: 'https://images.unsplash.com/photo-1571877227200-a0d98ea607e9?w=500', tags: [], ingredients: [{ name: 'Vanilla Gelato', quantity: '100', unit: 'g' }, { name: 'Espresso', quantity: '60', unit: 'ml' }] },
      { name: 'Chocolate Lava Cake', price: '8.99', description: 'Warm chocolate cake with molten center', cover: 'https://images.unsplash.com/photo-1624353365286-3f8d62daad51?w=500', tags: ['Popular', 'Chef Special'], ingredients: [{ name: 'Dark Chocolate', quantity: '100', unit: 'g' }, { name: 'Butter', quantity: '80', unit: 'g' }, { name: 'Eggs', quantity: '2', unit: 'pc' }] },
      { name: 'Cheesecake', price: '7.49', description: 'New York style cheesecake', cover: 'https://images.unsplash.com/photo-1533134242116-79c5e60818a7?w=500', tags: ['Vegetarian'], ingredients: [{ name: 'Cream Cheese', quantity: '200', unit: 'g' }, { name: 'Graham Cracker', quantity: '80', unit: 'g' }, { name: 'Sugar', quantity: '60', unit: 'g' }] },
      { name: 'Gelato Trio', price: '8.99', description: 'Three scoops of artisan gelato', cover: 'https://images.unsplash.com/photo-1563805042-7684c019e1cb?w=500', tags: ['Popular'], ingredients: [{ name: 'Pistachio Gelato', quantity: '60', unit: 'g' }, { name: 'Stracciatella', quantity: '60', unit: 'g' }, { name: 'Lemon Sorbet', quantity: '60', unit: 'g' }] },
      { name: 'Sfogliatelle', price: '5.49', description: 'Shell-shaped filled pastry', cover: 'https://images.unsplash.com/photo-1551024601-bec78aea704b?w=500', tags: [], ingredients: [{ name: 'Phyllo Dough', quantity: '100', unit: 'g' }, { name: 'Ricotta', quantity: '80', unit: 'g' }, { name: 'Semolina', quantity: '40', unit: 'g' }] },
      { name: 'Zuppa Inglese', price: '6.99', description: 'Italian trifle with custard and liqueur', cover: 'https://images.unsplash.com/photo-1571877227200-a0d98ea607e9?w=500', tags: ['Chef Special'], ingredients: [{ name: 'Sponge Cake', quantity: '100', unit: 'g' }, { name: 'Custard', quantity: '150', unit: 'ml' }, { name: 'Alchermes', quantity: '30', unit: 'ml' }] },
    ],
    Drinks: [
      { name: 'Espresso', price: '2.99', description: 'Strong Italian coffee', cover: 'https://images.unsplash.com/photo-1510591509098-f4fdc6d0ff04?w=500', tags: ['Popular'], ingredients: [{ name: 'Coffee Beans', quantity: '18', unit: 'g' }, { name: 'Water', quantity: '30', unit: 'ml' }] },
      { name: 'Cappuccino', price: '4.49', description: 'Espresso with steamed milk foam', cover: 'https://images.unsplash.com/photo-1572442388796-11668a67e53d?w=500', tags: ['Popular'], ingredients: [{ name: 'Espresso', quantity: '30', unit: 'ml' }, { name: 'Steamed Milk', quantity: '150', unit: 'ml' }, { name: 'Milk Foam', quantity: '30', unit: 'ml' }] },
      { name: 'Latte', price: '4.99', description: 'Espresso with steamed milk', cover: 'https://images.unsplash.com/photo-1570968992193-6e5c922c4463?w=500', tags: [], ingredients: [{ name: 'Espresso', quantity: '30', unit: 'ml' }, { name: 'Steamed Milk', quantity: '200', unit: 'ml' }] },
      { name: 'Iced Tea', price: '3.49', description: 'Refreshing cold brewed tea', cover: 'https://images.unsplash.com/photo-1556679343-c7306c1976bc?w=500', tags: ['Vegan'], ingredients: [{ name: 'Black Tea', quantity: '5', unit: 'g' }, { name: 'Water', quantity: '300', unit: 'ml' }, { name: 'Lemon', quantity: '20', unit: 'g' }] },
      { name: 'Fresh Orange Juice', price: '4.99', description: 'Freshly squeezed orange juice', cover: 'https://images.unsplash.com/photo-1613478223719-2ab802602423?w=500', tags: ['Vegan', 'Gluten-Free'], ingredients: [{ name: 'Oranges', quantity: '3', unit: 'pc' }] },
      { name: 'Smoothie', price: '5.99', description: 'Mixed berry smoothie', cover: 'https://images.unsplash.com/photo-1505252585461-04db1eb84625?w=500', tags: ['Vegan', 'Popular'], ingredients: [{ name: 'Mixed Berries', quantity: '150', unit: 'g' }, { name: 'Banana', quantity: '1', unit: 'pc' }, { name: 'Yogurt', quantity: '100', unit: 'ml' }] },
      { name: 'Lemonade', price: '3.99', description: 'Homemade lemonade', cover: 'https://images.unsplash.com/photo-1523677011781-c91d1bbe2f66?w=500', tags: ['Vegan'], ingredients: [{ name: 'Lemon Juice', quantity: '60', unit: 'ml' }, { name: 'Sugar', quantity: '40', unit: 'g' }, { name: 'Water', quantity: '300', unit: 'ml' }] },
      { name: 'Hot Chocolate', price: '4.49', description: 'Rich hot chocolate with whipped cream', cover: 'https://images.unsplash.com/photo-1542990253-0d0f5be5f0ed?w=500', tags: ['Vegetarian'], ingredients: [{ name: 'Dark Chocolate', quantity: '50', unit: 'g' }, { name: 'Milk', quantity: '200', unit: 'ml' }, { name: 'Whipped Cream', quantity: '30', unit: 'ml' }] },
      { name: 'Mojito', price: '6.99', description: 'Non-alcoholic mint mojito', cover: 'https://images.unsplash.com/photo-1513558161293-cdaf765ed2fd?w=500', tags: ['Vegan'], ingredients: [{ name: 'Mint', quantity: '15', unit: 'g' }, { name: 'Lime', quantity: '1', unit: 'pc' }, { name: 'Soda Water', quantity: '200', unit: 'ml' }] },
      { name: 'Frappuccino', price: '5.49', description: 'Blended iced coffee drink', cover: 'https://images.unsplash.com/photo-1572442388796-11668a67e53d?w=500', tags: ['Popular'], ingredients: [{ name: 'Espresso', quantity: '60', unit: 'ml' }, { name: 'Ice', quantity: '150', unit: 'g' }, { name: 'Milk', quantity: '100', unit: 'ml' }] },
    ],
    Asian: [
      { name: 'Pad Thai', price: '12.99', description: 'Stir-fried rice noodles with shrimp and peanuts', cover: 'https://images.unsplash.com/photo-1559314809-0d155014e29e?w=500', tags: ['Popular', 'Gluten-Free'], ingredients: [{ name: 'Rice Noodles', quantity: '200', unit: 'g' }, { name: 'Shrimp', quantity: '100', unit: 'g' }, { name: 'Peanuts', quantity: '40', unit: 'g' }] },
      { name: 'Green Curry', price: '13.49', description: 'Thai green curry with chicken and vegetables', cover: 'https://images.unsplash.com/photo-1565557623262-b51c2513a641?w=500', tags: ['Spicy', 'Hot'], ingredients: [{ name: 'Chicken', quantity: '150', unit: 'g' }, { name: 'Green Curry Paste', quantity: '50', unit: 'g' }, { name: 'Coconut Milk', quantity: '200', unit: 'ml' }] },
      { name: 'Kung Pao Chicken', price: '11.99', description: 'Spicy Sichuan chicken with peanuts', cover: 'https://images.unsplash.com/photo-1525755662778-989d0524087e?w=500', tags: ['Spicy', 'Popular'], ingredients: [{ name: 'Chicken', quantity: '200', unit: 'g' }, { name: 'Peanuts', quantity: '50', unit: 'g' }, { name: 'Dried Chili', quantity: '20', unit: 'g' }] },
      { name: 'Teriyaki Salmon', price: '15.99', description: 'Grilled salmon with teriyaki glaze', cover: 'https://images.unsplash.com/photo-1467003909585-2f8a7270028d?w=500', tags: ['Chef Special'], ingredients: [{ name: 'Salmon', quantity: '200', unit: 'g' }, { name: 'Teriyaki Sauce', quantity: '60', unit: 'ml' }, { name: 'Sesame Seeds', quantity: '10', unit: 'g' }] },
      { name: 'Pho Bo', price: '12.49', description: 'Vietnamese beef noodle soup', cover: 'https://images.unsplash.com/photo-1503596476-1c12a8ab96ea?w=500', tags: ['Popular'], ingredients: [{ name: 'Rice Noodles', quantity: '200', unit: 'g' }, { name: 'Beef', quantity: '100', unit: 'g' }, { name: 'Beef Broth', quantity: '400', unit: 'ml' }] },
      { name: 'Bibimbap', price: '13.99', description: 'Korean mixed rice with vegetables and egg', cover: 'https://images.unsplash.com/photo-1553621042-f6e147245754?w=500', tags: ['Popular'], ingredients: [{ name: 'Rice', quantity: '200', unit: 'g' }, { name: 'Mixed Vegetables', quantity: '150', unit: 'g' }, { name: 'Egg', quantity: '1', unit: 'pc' }] },
      { name: 'Dim Sum Platter', price: '16.99', description: 'Assorted Chinese dumplings', cover: 'https://images.unsplash.com/photo-1496116218417-1a781b1c423c?w=500', tags: ['Chef Special'], ingredients: [{ name: 'Pork Dumplings', quantity: '4', unit: 'pc' }, { name: 'Shrimp Dumplings', quantity: '4', unit: 'pc' }, { name: 'Vegetable Dumplings', quantity: '4', unit: 'pc' }] },
      { name: 'Ramen', price: '11.99', description: 'Japanese noodle soup with pork', cover: 'https://images.unsplash.com/photo-1569718212165-3a8278d5f624?w=500', tags: ['Popular', 'Hot'], ingredients: [{ name: 'Ramen Noodles', quantity: '200', unit: 'g' }, { name: 'Pork Belly', quantity: '100', unit: 'g' }, { name: 'Pork Broth', quantity: '400', unit: 'ml' }] },
      { name: 'Spring Rolls', price: '7.99', description: 'Fresh Vietnamese spring rolls', cover: 'https://images.unsplash.com/photo-1544025151-63f31773045b?w=500', tags: ['Vegan'], ingredients: [{ name: 'Rice Paper', quantity: '4', unit: 'pc' }, { name: 'Shrimp', quantity: '80', unit: 'g' }, { name: 'Vegetables', quantity: '100', unit: 'g' }] },
      { name: 'Fried Rice', price: '10.49', description: 'Wok-fried rice with egg and vegetables', cover: 'https://images.unsplash.com/photo-1603133872878-684f208fb84b?w=500', tags: ['Vegetarian'], ingredients: [{ name: 'Rice', quantity: '200', unit: 'g' }, { name: 'Egg', quantity: '2', unit: 'pc' }, { name: 'Mixed Vegetables', quantity: '100', unit: 'g' }] },
    ],
    Mexican: [
      { name: 'Tacos al Pastor', price: '10.99', description: 'Marinated pork tacos with pineapple', cover: 'https://images.unsplash.com/photo-1551504734-5ee1c4a1479b?w=500', tags: ['Popular', 'Spicy'], ingredients: [{ name: 'Pork', quantity: '150', unit: 'g' }, { name: 'Corn Tortillas', quantity: '4', unit: 'pc' }, { name: 'Pineapple', quantity: '50', unit: 'g' }] },
      { name: 'Burrito Bowl', price: '11.49', description: 'Rice bowl with beans, meat, and salsa', cover: 'https://images.unsplash.com/photo-1566740933430-b5e70b06d2d5?w=500', tags: ['Popular'], ingredients: [{ name: 'Rice', quantity: '150', unit: 'g' }, { name: 'Black Beans', quantity: '100', unit: 'g' }, { name: 'Chicken', quantity: '120', unit: 'g' }] },
      { name: 'Quesadilla', price: '9.99', description: 'Grilled tortilla with melted cheese', cover: 'https://images.unsplash.com/photo-1565299585323-38d6b0865b47?w=500', tags: ['Vegetarian'], ingredients: [{ name: 'Flour Tortilla', quantity: '2', unit: 'pc' }, { name: 'Cheese', quantity: '100', unit: 'g' }, { name: 'Sour Cream', quantity: '30', unit: 'ml' }] },
      { name: 'Enchiladas', price: '12.99', description: 'Rolled tortillas with chicken and mole sauce', cover: 'https://images.unsplash.com/photo-1565299585323-38d6b0865b47?w=500', tags: ['Chef Special'], ingredients: [{ name: 'Corn Tortillas', quantity: '4', unit: 'pc' }, { name: 'Chicken', quantity: '150', unit: 'g' }, { name: 'Mole Sauce', quantity: '150', unit: 'ml' }] },
      { name: 'Guacamole & Chips', price: '8.49', description: 'Fresh avocado dip with tortilla chips', cover: 'https://images.unsplash.com/photo-1576618148400-f54bed99fcf8?w=500', tags: ['Vegan', 'Popular'], ingredients: [{ name: 'Avocado', quantity: '200', unit: 'g' }, { name: 'Tortilla Chips', quantity: '100', unit: 'g' }, { name: 'Lime', quantity: '1', unit: 'pc' }] },
      { name: 'Fajitas', price: '14.99', description: 'Sizzling beef with peppers and onions', cover: 'https://images.unsplash.com/photo-1565299585323-38d6b0865b47?w=500', tags: ['Hot'], ingredients: [{ name: 'Beef', quantity: '200', unit: 'g' }, { name: 'Bell Peppers', quantity: '100', unit: 'g' }, { name: 'Onions', quantity: '80', unit: 'g' }] },
      { name: 'Churros', price: '6.99', description: 'Fried dough pastry with cinnamon sugar', cover: 'https://images.unsplash.com/photo-1599487488170-d11ec9c172f0?w=500', tags: ['Vegetarian'], ingredients: [{ name: 'Flour', quantity: '150', unit: 'g' }, { name: 'Sugar', quantity: '50', unit: 'g' }, { name: 'Cinnamon', quantity: '10', unit: 'g' }] },
      { name: 'Tamales', price: '8.99', description: 'Steamed corn dough with meat filling', cover: 'https://images.unsplash.com/photo-1565299585323-38d6b0865b47?w=500', tags: [], ingredients: [{ name: 'Corn Dough', quantity: '200', unit: 'g' }, { name: 'Pork', quantity: '100', unit: 'g' }, { name: 'Corn Husk', quantity: '4', unit: 'pc' }] },
      { name: 'Nachos Supreme', price: '11.99', description: 'Tortilla chips with all the toppings', cover: 'https://images.unsplash.com/photo-1513456852971-30c0b8199d4d?w=500', tags: ['Popular'], ingredients: [{ name: 'Tortilla Chips', quantity: '150', unit: 'g' }, { name: 'Cheese', quantity: '100', unit: 'g' }, { name: 'Jalapeños', quantity: '40', unit: 'g' }] },
      { name: 'Ceviche', price: '13.49', description: 'Citrus-cured fish with vegetables', cover: 'https://images.unsplash.com/photo-1535400255456-1846e18937f4?w=500', tags: ['Gluten-Free', 'Chef Special'], ingredients: [{ name: 'White Fish', quantity: '200', unit: 'g' }, { name: 'Lime Juice', quantity: '100', unit: 'ml' }, { name: 'Tomatoes', quantity: '80', unit: 'g' }] },
    ],
    Breakfast: [
      { name: 'Pancakes', price: '8.99', description: 'Fluffy buttermilk pancakes with maple syrup', cover: 'https://images.unsplash.com/photo-1567620905732-2d1ec7ab7445?w=500', tags: ['Vegetarian', 'Popular'], ingredients: [{ name: 'Flour', quantity: '150', unit: 'g' }, { name: 'Buttermilk', quantity: '200', unit: 'ml' }, { name: 'Maple Syrup', quantity: '60', unit: 'ml' }] },
      { name: 'Eggs Benedict', price: '11.99', description: 'Poached eggs on English muffin with hollandaise', cover: 'https://images.unsplash.com/photo-1608039829572-78524f79c4c7?w=500', tags: ['Chef Special'], ingredients: [{ name: 'Eggs', quantity: '2', unit: 'pc' }, { name: 'English Muffin', quantity: '1', unit: 'pc' }, { name: 'Hollandaise', quantity: '80', unit: 'ml' }] },
      { name: 'Avocado Toast', price: '9.49', description: 'Sourdough toast with smashed avocado', cover: 'https://images.unsplash.com/photo-1588137372308-15f75323ca8d?w=500', tags: ['Vegan', 'Popular'], ingredients: [{ name: 'Sourdough', quantity: '2', unit: 'slice' }, { name: 'Avocado', quantity: '150', unit: 'g' }, { name: 'Cherry Tomatoes', quantity: '50', unit: 'g' }] },
      { name: 'French Toast', price: '8.49', description: 'Brioche toast with cinnamon and berries', cover: 'https://images.unsplash.com/photo-1588137372308-15f75323ca8d?w=500', tags: ['Vegetarian'], ingredients: [{ name: 'Brioche', quantity: '3', unit: 'slice' }, { name: 'Eggs', quantity: '2', unit: 'pc' }, { name: 'Berries', quantity: '80', unit: 'g' }] },
      { name: 'Full English', price: '13.99', description: 'Complete English breakfast', cover: 'https://images.unsplash.com/photo-1533089862017-5614ec45e25a?w=500', tags: ['Popular'], ingredients: [{ name: 'Eggs', quantity: '2', unit: 'pc' }, { name: 'Bacon', quantity: '60', unit: 'g' }, { name: 'Sausages', quantity: '100', unit: 'g' }] },
      { name: 'Acai Bowl', price: '10.99', description: 'Acai smoothie bowl with granola', cover: 'https://images.unsplash.com/photo-1590422749830-d2f29f64e845?w=500', tags: ['Vegan', 'Gluten-Free'], ingredients: [{ name: 'Acai', quantity: '150', unit: 'g' }, { name: 'Granola', quantity: '60', unit: 'g' }, { name: 'Banana', quantity: '1', unit: 'pc' }] },
      { name: 'Omelette', price: '9.99', description: 'Three-egg omelette with choice of filling', cover: 'https://images.unsplash.com/photo-1510693206972-df098062cb71?w=500', tags: ['Vegetarian', 'Gluten-Free'], ingredients: [{ name: 'Eggs', quantity: '3', unit: 'pc' }, { name: 'Cheese', quantity: '50', unit: 'g' }, { name: 'Vegetables', quantity: '80', unit: 'g' }] },
      { name: 'Bagel & Lox', price: '11.49', description: 'Toasted bagel with smoked salmon', cover: 'https://images.unsplash.com/photo-1588137372308-15f75323ca8d?w=500', tags: [], ingredients: [{ name: 'Bagel', quantity: '1', unit: 'pc' }, { name: 'Smoked Salmon', quantity: '80', unit: 'g' }, { name: 'Cream Cheese', quantity: '50', unit: 'g' }] },
      { name: 'Huevos Rancheros', price: '10.99', description: 'Fried eggs on tortillas with ranchero sauce', cover: 'https://images.unsplash.com/photo-1533089862017-5614ec45e25a?w=500', tags: ['Spicy', 'Gluten-Free'], ingredients: [{ name: 'Eggs', quantity: '2', unit: 'pc' }, { name: 'Corn Tortillas', quantity: '2', unit: 'pc' }, { name: 'Ranchero Sauce', quantity: '100', unit: 'ml' }] },
      { name: 'Waffles', price: '9.49', description: 'Belgian waffles with whipped cream', cover: 'https://images.unsplash.com/photo-1562376552-0d160a2f238d?w=500', tags: ['Vegetarian', 'Popular'], ingredients: [{ name: 'Waffle Batter', quantity: '200', unit: 'ml' }, { name: 'Whipped Cream', quantity: '60', unit: 'ml' }, { name: 'Strawberries', quantity: '80', unit: 'g' }] },
    ],
  };

  let totalProducts = 0;

  for (const category of allCategories) {
    const categoryProducts = productsByCategory[category.name];
    if (!categoryProducts) {
      console.log(`  ⚠️  No products defined for category: ${category.name}`);
      continue;
    }

    console.log(`\n📦 Seeding ${categoryProducts.length} products for ${category.name}...`);

    for (const prod of categoryProducts) {
      const [product] = await db.insert(products).values({
        name: prod.name,
        slug: generateSlug(prod.name),
        price: prod.price,
        description: prod.description,
        cover: prod.cover,
        createdBy: owner?.id || null,
      }).onConflictDoNothing().returning();

      if (product) {
        totalProducts++;

        // Link to category
        await db.insert(productCategories).values({
          productId: product.id,
          categoryId: category.id,
        });

        // Link tags
        if (prod.tags && prod.tags.length > 0) {
          for (const tagName of prod.tags) {
            const tag = tagMap.get(tagName.toLowerCase());
            if (tag) {
              await db.insert(productTags).values({
                productId: product.id,
                tagId: tag.id,
              });
            }
          }
        }

        // Add ingredients
        for (const ing of prod.ingredients) {
          await db.insert(ingredients).values({
            productId: product.id,
            name: ing.name,
            quantity: ing.quantity,
            unit: ing.unit,
          });
        }

        console.log(`  ✓ ${prod.name}`);
      }
    }
  }

  console.log(`\n✨ Total products seeded: ${totalProducts}`);
  return totalProducts;
}

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  seedProducts().catch((err) => {
    console.error('❌ Seeding failed:', err);
    process.exit(1);
  });
}
