// src/lib/turso.ts
import type { RequestEventBase } from '@builder.io/qwik-city';
import { createClient, type Client } from '@libsql/client';

// Define EnvGetter interface
interface EnvGetter {
  get: (key: string) => string | undefined;
}

// Update tursoClient to handle both RequestEventBase and EnvGetter
export async function tursoClient(event: RequestEventBase | { env: EnvGetter }): Promise<Client> {
  // Type guard to check if event is RequestEventBase
  const env = 'env' in event && 'get' in event.env ? event.env : event.env;

  const url = env.get('PRIVATE_TURSO_DATABASE_URL');
  const authToken = env.get('PRIVATE_TURSO_AUTH_TOKEN');

  console.log('tursoClient environment variables:', {
    dbUrl: !!url,
    authToken: !!authToken,
  });

  if (!url) throw new Error('PRIVATE_TURSO_DATABASE_URL is not defined');
  if (!authToken && !url.includes('file:')) throw new Error('PRIVATE_TURSO_AUTH_TOKEN is not defined');

  const client = createClient({ url, authToken });
  await initializeDatabase(client); // Initialize tables
  return client;
}

// Export interfaces (ensure Banner is exported)
export interface Faq {
  id?: number;
  question: string;
  answer: string;
  isHtml?: boolean;
  position?: number;
}

export interface Banner {
  id?: number;
  title: string;
  subtitle: string;
  message: string;
  isHtml?: boolean;
  gif?: string | null; // Base64-encoded GIF or null
}

export interface Review {
  id?: number;
  name: string;
  review: string;
  rating: number;
  date: string;
  position?: number;
}

export interface Class {
  id?: number;
  name: string;
  description: string;
  url: string;
  image: string; // Base64-encoded image
  isActive: number;
  position?: number;
}

export interface GalleryImage {
  id?: number;
  image: string; // Base64-encoded image
  filename: string;
  position?: number;
}

export interface User {
  id?: number;
  email: string;
  name?: string;
}

// ... rest of the file remains unchanged ...

// ... rest of the file remains unchanged ...

// Initialize database tables
async function initializeDatabase(client: Client) {
  try {
    // Create faqs table if it doesn't exist
    await client.execute(`
      CREATE TABLE IF NOT EXISTS faqs (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        question TEXT NOT NULL,
        answer TEXT NOT NULL,
        position INTEGER DEFAULT 0
      )
    `);

    // Create banners table if it doesn't exist
    await client.execute(`
      CREATE TABLE IF NOT EXISTS banners (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        title TEXT NOT NULL,
        subtitle TEXT NOT NULL,
        message TEXT NOT NULL,
        gif TEXT
      )
    `);

    // Create reviews table if it doesn't exist
    await client.execute(`
      CREATE TABLE IF NOT EXISTS reviews (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        review TEXT NOT NULL,
        rating INTEGER NOT NULL,
        date TEXT NOT NULL,
        position INTEGER DEFAULT 0
      )
    `);

    // Create classes table if it doesn't exist
    await client.execute(`
      CREATE TABLE IF NOT EXISTS classes (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        description TEXT NOT NULL,
        url TEXT NOT NULL,
        image TEXT NOT NULL,
        isActive INTEGER NOT NULL,
        position INTEGER DEFAULT 0
      )
    `);

    // Create gallery_images table if it doesn't exist
    await client.execute(`
      CREATE TABLE IF NOT EXISTS gallery_images (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        image TEXT NOT NULL, -- Base64-encoded image
        filename TEXT NOT NULL,
        position INTEGER DEFAULT 0
      )
    `);

    // Migrate existing tables to add position column if it doesn't exist
    try {
      // Check if position column exists in faqs table
      const faqsInfo = await client.execute('PRAGMA table_info(faqs)');
      const hasFaqsPosition = faqsInfo.rows.some((row: any) => row.name === 'position');

      if (!hasFaqsPosition) {
        console.log('Adding position column to faqs table');
        await client.execute('ALTER TABLE faqs ADD COLUMN position INTEGER DEFAULT 0');
        // Set position based on current id order
        const faqs = await client.execute('SELECT id FROM faqs ORDER BY id ASC');
        for (let i = 0; i < faqs.rows.length; i++) {
          await client.execute({
            sql: 'UPDATE faqs SET position = ? WHERE id = ?',
            args: [i, faqs.rows[i].id],
          });
        }
      }
    } catch (error) {
      console.log('FAQs table migration skipped or failed:', error);
    }

    try {
      // Check if position column exists in reviews table
      const reviewsInfo = await client.execute('PRAGMA table_info(reviews)');
      const hasReviewsPosition = reviewsInfo.rows.some((row: any) => row.name === 'position');

      if (!hasReviewsPosition) {
        console.log('Adding position column to reviews table');
        await client.execute('ALTER TABLE reviews ADD COLUMN position INTEGER DEFAULT 0');
        // Set position based on current id order
        const reviews = await client.execute('SELECT id FROM reviews ORDER BY id ASC');
        for (let i = 0; i < reviews.rows.length; i++) {
          await client.execute({
            sql: 'UPDATE reviews SET position = ? WHERE id = ?',
            args: [i, reviews.rows[i].id],
          });
        }
      }
    } catch (error) {
      console.log('Reviews table migration skipped or failed:', error);
    }

    try {
      // Check if position column exists in classes table
      const classesInfo = await client.execute('PRAGMA table_info(classes)');
      const hasClassesPosition = classesInfo.rows.some((row: any) => row.name === 'position');

      if (!hasClassesPosition) {
        console.log('Adding position column to classes table');
        await client.execute('ALTER TABLE classes ADD COLUMN position INTEGER DEFAULT 0');
        // Set position based on current id order
        const classes = await client.execute('SELECT id FROM classes ORDER BY id ASC');
        for (let i = 0; i < classes.rows.length; i++) {
          await client.execute({
            sql: 'UPDATE classes SET position = ? WHERE id = ?',
            args: [i, classes.rows[i].id],
          });
        }
      }
    } catch (error) {
      console.log('Classes table migration skipped or failed:', error);
    }

    try {
      // Check if position column exists in gallery_images table
      const galleryInfo = await client.execute('PRAGMA table_info(gallery_images)');
      const hasGalleryPosition = galleryInfo.rows.some((row: any) => row.name === 'position');

      if (!hasGalleryPosition) {
        console.log('Adding position column to gallery_images table');
        await client.execute('ALTER TABLE gallery_images ADD COLUMN position INTEGER DEFAULT 0');
        // Set position based on current id order
        const images = await client.execute('SELECT id FROM gallery_images ORDER BY id ASC');
        for (let i = 0; i < images.rows.length; i++) {
          await client.execute({
            sql: 'UPDATE gallery_images SET position = ? WHERE id = ?',
            args: [i, images.rows[i].id],
          });
        }
      }
    } catch (error) {
      console.log('Gallery images table migration skipped or failed:', error);
    }

    try {
      // Check if gif column exists in banners table
      const bannersInfo = await client.execute('PRAGMA table_info(banners)');
      const hasBannersGif = bannersInfo.rows.some((row: any) => row.name === 'gif');

      if (!hasBannersGif) {
        console.log('Adding gif column to banners table');
        await client.execute('ALTER TABLE banners ADD COLUMN gif TEXT');
      }
    } catch (error) {
      console.log('Banners table migration skipped or failed:', error);
    }

    // Create users table if it doesn't exist
    await client.execute(`
      CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        email TEXT NOT NULL UNIQUE,
        name TEXT
      )
    `);

    console.log('Database tables initialized successfully');
  } catch (error) {
    console.error('Failed to initialize database:', error);
    throw new Error(`Database initialization failed: ${error}`);
  }
}

// User CRUD functions
export async function createUser(client: Client, email: string, name?: string): Promise<number> {
  if (!email) throw new Error('Email must not be empty');
  try {
    const res = await client.execute({
      sql: 'INSERT INTO users (email, name) VALUES (?, ?)',
      args: [email, name || null],
    });
    if (res.lastInsertRowid === undefined) throw new Error('Failed to get last insert row ID');
    const rowIdNum = Number(res.lastInsertRowid);
    if (!Number.isSafeInteger(rowIdNum)) throw new Error('lastInsertRowid is too large to convert safely to number');
    console.log(`Created user with ID: ${rowIdNum}, email: ${email}`);
    return rowIdNum;
  } catch (error) {
    console.error('Error creating user:', error);
    throw new Error(`Failed to create user: ${error}`);
  }
}

export async function getUserByEmail(client: Client, email: string): Promise<User | null> {
  if (!email) throw new Error('Email must not be empty');
  try {
    const res = await client.execute({
      sql: 'SELECT * FROM users WHERE email = ?',
      args: [email],
    });
    if (res.rows.length === 0) return null;
    return {
      id: Number(res.rows[0].id),
      email: String(res.rows[0].email),
      name: res.rows[0].name ? String(res.rows[0].name) : undefined,
    };
  } catch (error) {
    console.error('Error fetching user:', error);
    throw new Error(`Failed to fetch user: ${error}`);
  }
}

// FAQ CRUD functions
export async function getFaqs(client: Client): Promise<Faq[]> {
  try {
    const res = await client.execute('SELECT * FROM faqs ORDER BY position ASC, id ASC');
    return res.rows.map((r: any) => ({
      id: Number(r.id),
      question: String(r.question ?? ''),
      answer: String(r.answer ?? ''),
      isHtml: String(r.answer ?? '').includes('<'),
      position: Number(r.position ?? 0),
    }));
  } catch (error) {
    console.error('Error fetching FAQs:', error);
    throw new Error(`Failed to fetch FAQs: ${error}`);
  }
}

export async function createFaq(client: Client, question: string, answer: string): Promise<number> {
  if (!question || !answer) throw new Error('Question and answer must not be empty');
  try {
    // Get the max position and add 1
    const maxPosRes = await client.execute('SELECT COALESCE(MAX(position), -1) as maxPos FROM faqs');
    const maxPos = Number(maxPosRes.rows[0].maxPos);
    const newPosition = maxPos + 1;

    const res = await client.execute({
      sql: 'INSERT INTO faqs (question, answer, position) VALUES (?, ?, ?)',
      args: [question, answer, newPosition],
    });
    if (res.lastInsertRowid === undefined) throw new Error('Failed to get last insert row ID');
    const rowIdNum = Number(res.lastInsertRowid);
    if (!Number.isSafeInteger(rowIdNum)) throw new Error('lastInsertRowid is too large to convert safely to number');
    console.log(`Created FAQ with ID: ${rowIdNum}`);
    return rowIdNum;
  } catch (error) {
    console.error('Error creating FAQ:', error);
    throw new Error(`Failed to create FAQ: ${error}`);
  }
}

export async function updateFaq(client: Client, id: number, question: string, answer: string) {
  if (!question || !answer) throw new Error('Question and answer must not be empty');
  try {
    const res = await client.execute({
      sql: 'UPDATE faqs SET question = ?, answer = ? WHERE id = ?',
      args: [question, answer, id],
    });
    if (res.rowsAffected === 0) throw new Error(`No FAQ found with ID: ${id}`);
    console.log(`Updated FAQ with ID: ${id}`);
  } catch (error) {
    console.error('Error updating FAQ:', error);
    throw new Error(`Failed to update FAQ: ${error}`);
  }
}

export async function deleteFaq(client: Client, id: number) {
  try {
    const res = await client.execute({
      sql: 'DELETE FROM faqs WHERE id = ?',
      args: [id],
    });
    if (res.rowsAffected === 0) throw new Error(`No FAQ found with ID: ${id}`);
    console.log(`Deleted FAQ with ID: ${id}`);
  } catch (error) {
    console.error('Error deleting FAQ:', error);
    throw new Error(`Failed to delete FAQ: ${error}`);
  }
}

// Banner CRUD functions
export async function getBanners(client: Client): Promise<Banner[]> {
  try {
    const res = await client.execute('SELECT * FROM banners ORDER BY id ASC');
    return res.rows.map((r: any) => ({
      id: Number(r.id),
      title: String(r.title ?? ''),
      subtitle: String(r.subtitle ?? ''),
      message: String(r.message ?? ''),
      isHtml: [r.title, r.subtitle, r.message].some(field => String(field ?? '').includes('<')),
      gif: r.gif ? String(r.gif) : null,
    }));
  } catch (error) {
    console.error('Error fetching banners:', error);
    throw new Error(`Failed to fetch banners: ${error}`);
  }
}

export async function createBanner(client: Client, title: string, subtitle: string, message: string, gif?: string | null): Promise<number> {
  if (!title || !subtitle || !message) throw new Error('Title, subtitle, and message must not be empty');
  try {
    const res = await client.execute({
      sql: 'INSERT INTO banners (title, subtitle, message, gif) VALUES (?, ?, ?, ?)',
      args: [title, subtitle, message, gif || null],
    });
    if (res.lastInsertRowid === undefined) throw new Error('Failed to get last insert row ID');
    const rowIdNum = Number(res.lastInsertRowid);
    if (!Number.isSafeInteger(rowIdNum)) throw new Error('lastInsertRowid is too large to convert safely to number');
    console.log(`Created banner with ID: ${rowIdNum}`);
    return rowIdNum;
  } catch (error) {
    console.error('Error creating banner:', error);
    throw new Error(`Failed to create banner: ${error}`);
  }
}

export async function updateBanner(client: Client, id: number, title: string, subtitle: string, message: string, gif?: string | null) {
  if (!title || !subtitle || !message) throw new Error('Title, subtitle, and message must not be empty');
  try {
    const res = await client.execute({
      sql: 'UPDATE banners SET title = ?, subtitle = ?, message = ?, gif = ? WHERE id = ?',
      args: [title, subtitle, message, gif !== undefined ? gif : null, id],
    });
    if (res.rowsAffected === 0) throw new Error(`No banner found with ID: ${id}`);
    console.log(`Updated banner with ID: ${id}`);
  } catch (error) {
    console.error('Error updating banner:', error);
    throw new Error(`Failed to update banner: ${error}`);
  }
}

export async function deleteBanner(client: Client, id: number) {
  try {
    const res = await client.execute({
      sql: 'DELETE FROM banners WHERE id = ?',
      args: [id],
    });
    if (res.rowsAffected === 0) throw new Error(`No banner found with ID: ${id}`);
    console.log(`Deleted banner with ID: ${id}`);
  } catch (error) {
    console.error('Error deleting banner:', error);
    throw new Error(`Failed to delete banner: ${error}`);
  }
}

// Review CRUD functions
export async function getReviews(client: Client): Promise<Review[]> {
  try {
    const res = await client.execute('SELECT * FROM reviews ORDER BY position ASC, id ASC');
    const reviews = res.rows.map((r: any) => {
      const review = String(r.review ?? '');
      console.log(`Fetched review ID ${r.id}: review = ${review}`);
      return {
        id: Number(r.id),
        name: String(r.name ?? ''),
        review,
        rating: Number(r.rating ?? 0),
        date: String(r.date ?? ''),
        position: Number(r.position ?? 0),
      };
    });
    console.log(`Fetched ${reviews.length} reviews`);
    return reviews;
  } catch (error) {
    console.error('Error fetching reviews:', error);
    throw new Error(`Failed to fetch reviews: ${error}`);
  }
}

export async function createReview(
  client: Client,
  name: string,
  review: string,
  rating: number,
  date: string
): Promise<number> {
  if (!name || !review || !date) throw new Error('All review fields must not be empty');
  if (!Number.isInteger(rating) || rating < 1 || rating > 5) throw new Error('Rating must be an integer between 1 and 5');
  try {
    // Get the max position and add 1
    const maxPosRes = await client.execute('SELECT COALESCE(MAX(position), -1) as maxPos FROM reviews');
    const maxPos = Number(maxPosRes.rows[0].maxPos);
    const newPosition = maxPos + 1;

    console.log(`Creating review with review: ${review}`);
    const res = await client.execute({
      sql: 'INSERT INTO reviews (name, review, rating, date, position) VALUES (?, ?, ?, ?, ?)',
      args: [name, review, rating, date, newPosition],
    });
    if (res.lastInsertRowid === undefined) throw new Error('Failed to get last insert row ID');
    const rowIdNum = Number(res.lastInsertRowid);
    if (!Number.isSafeInteger(rowIdNum)) throw new Error('lastInsertRowid is too large to convert safely to number');
    console.log(`Created review with ID: ${rowIdNum}`);
    return rowIdNum;
  } catch (error) {
    console.error('Error creating review:', error);
    throw new Error(`Failed to create review: ${error}`);
  }
}

export async function updateReview(
  client: Client,
  id: number,
  name: string,
  review: string,
  rating: number,
  date: string
): Promise<void> {
  if (!id || !Number.isInteger(id)) throw new Error('Invalid review ID');
  if (!name || !review || !date) throw new Error('All review fields must not be empty');
  if (!Number.isInteger(rating) || rating < 1 || rating > 5) throw new Error('Rating must be an integer between 1 and 5');
  try {
    console.log(`Attempting to update review ID ${id} with:`, { name, review, rating, date });
    const res = await client.execute({
      sql: 'UPDATE reviews SET name = ?, review = ?, rating = ?, date = ? WHERE id = ?',
      args: [name, review, rating, date, id],
    });
    if (res.rowsAffected === 0) {
      console.warn(`No review found with ID: ${id}`);
      throw new Error(`No review found with ID: ${id}`);
    }
    console.log(`Successfully updated review with ID: ${id}`);
    // Verify update
    const verify = await client.execute({
      sql: 'SELECT * FROM reviews WHERE id = ?',
      args: [id],
    });
    if (verify.rows.length > 0) {
      console.log(`Verified updated review ID ${id}:`, verify.rows[0]);
    } else {
      console.warn(`Verification failed: No review found after update for ID: ${id}`);
    }
  } catch (error) {
    console.error('Error updating review:', error);
    throw new Error(`Failed to update review: ${error}`);
  }
}

export async function deleteReview(client: Client, id: number) {
  try {
    const res = await client.execute({
      sql: 'DELETE FROM reviews WHERE id = ?',
      args: [id],
    });
    if (res.rowsAffected === 0) throw new Error(`No review found with ID: ${id}`);
    console.log(`Deleted review with ID: ${id}`);
  } catch (error) {
    console.error('Error deleting review:', error);
    throw new Error(`Failed to delete review: ${error}`);
  }
}

// Class CRUD functions
export async function getClasses(client: Client): Promise<Class[]> {
  try {
    const res = await client.execute('SELECT * FROM classes ORDER BY position ASC, id ASC');
    const classes = res.rows.map((r: any) => ({
      id: Number(r.id),
      name: String(r.name ?? ''),
      description: String(r.description ?? ''),
      url: String(r.url ?? ''),
      image: String(r.image ?? ''),
      isActive: Number(r.isActive ?? 0),
      position: Number(r.position ?? 0),
    }));
    console.log(`Fetched ${classes.length} classes`);
    return classes;
  } catch (error) {
    console.error('Error fetching classes:', error);
    throw new Error(`Failed to fetch classes: ${error}`);
  }
}

export async function createClass(
  client: Client,
  name: string,
  description: string,
  url: string,
  image: string,
  isActive: number
): Promise<number> {
  if (!name || !description || !url || !image || isActive === undefined) {
    throw new Error('All class fields must not be empty');
  }
  if (!Number.isInteger(isActive) || isActive < 0 || isActive > 1) {
    throw new Error('isActive must be 0 or 1');
  }
  if (!image.startsWith('data:image/')) {
    throw new Error('Image must be a valid base64-encoded image (data:image/*;base64,...)');
  }
  try {
    // Get the max position and add 1
    const maxPosRes = await client.execute('SELECT COALESCE(MAX(position), -1) as maxPos FROM classes');
    const maxPos = Number(maxPosRes.rows[0].maxPos);
    const newPosition = maxPos + 1;

    console.log(`Creating class with name: ${name}, image length: ${image.length}, position: ${newPosition}`);
    const res = await client.execute({
      sql: 'INSERT INTO classes (name, description, url, image, isActive, position) VALUES (?, ?, ?, ?, ?, ?)',
      args: [name, description, url, image, isActive, newPosition],
    });
    if (res.lastInsertRowid === undefined) throw new Error('Failed to get last insert row ID');
    const rowIdNum = Number(res.lastInsertRowid);
    if (!Number.isSafeInteger(rowIdNum)) throw new Error('lastInsertRowid is too large to convert safely to number');
    console.log(`Created class with ID: ${rowIdNum}`);
    return rowIdNum;
  } catch (error) {
    console.error('Error creating class:', error);
    throw new Error(`Failed to create class: ${error}`);
  }
}

export async function updateClass(
  client: Client,
  id: number,
  name: string,
  description: string,
  url: string,
  image: string,
  isActive: number
): Promise<void> {
  if (!id || !Number.isInteger(id)) throw new Error('Invalid class ID');
  if (!name || !description || !url || !image || isActive === undefined) {
    throw new Error('All class fields must not be empty');
  }
  if (!Number.isInteger(isActive) || isActive < 0 || isActive > 1) {
    throw new Error('isActive must be 0 or 1');
  }
  if (!image.startsWith('data:image/')) {
    throw new Error('Image must be a valid base64-encoded image (data:image/*;base64,...)');
  }
  try {
    console.log(`Attempting to update class ID ${id} with:`, { name, description, url, image: `base64(...${image.slice(-20)})`, isActive });
    
    const res = await client.execute({
      sql: 'UPDATE classes SET name = ?, description = ?, url = ?, image = ?, isActive = ? WHERE id = ?',
      args: [name, description, url, image, isActive, id],
    });
    
    if (res.rowsAffected === 0) {
      console.warn(`No class found with ID: ${id}`);
      throw new Error(`No class found with ID: ${id}`);
    }
    
    console.log(`Successfully updated class with ID: ${id}`);
    
    // Verify update
    const verify = await client.execute({
      sql: 'SELECT * FROM classes WHERE id = ?',
      args: [id],
    });
    if (verify.rows.length > 0) {
      console.log(`Verified updated class ID ${id}:`, { ...verify.rows[0], image: `base64(...${String(verify.rows[0].image).slice(-20)})` });
    } else {
      console.warn(`Verification failed: No class found after update for ID: ${id}`);
    }
  } catch (error) {
    console.error('Error updating class:', error);
    throw new Error(`Failed to update class: ${error}`);
  }
}

export async function deleteClass(client: Client, id: number) {
  try {
    const res = await client.execute({
      sql: 'DELETE FROM classes WHERE id = ?',
      args: [id],
    });
    if (res.rowsAffected === 0) throw new Error(`No class found with ID: ${id}`);
    console.log(`Deleted class with ID: ${id}`);
  } catch (error) {
    console.error('Error deleting class:', error);
    throw new Error(`Failed to delete class: ${error}`);
  }
}

// Gallery Image CRUD functions
export async function getGalleryImages(client: Client): Promise<GalleryImage[]> {
  try {
    const res = await client.execute('SELECT * FROM gallery_images ORDER BY position ASC, id ASC');
    const images = res.rows.map((r: any) => ({
      id: Number(r.id),
      image: String(r.image ?? ''),
      filename: String(r.filename ?? ''),
      position: Number(r.position ?? 0),
    }));
    console.log(`Fetched ${images.length} gallery images`);
    return images;
  } catch (error) {
    console.error('Error fetching gallery images:', error);
    throw new Error(`Failed to fetch gallery images: ${error}`);
  }
}

export async function createGalleryImage(client: Client, image: string, filename: string): Promise<number> {
  if (!image || !filename) {
    throw new Error('Image and filename must not be empty');
  }
  if (!image.startsWith('data:image/')) {
    throw new Error('Image must be a valid base64-encoded image (data:image/*;base64,...)');
  }
  try {
    // Get the max position and add 1
    const maxPosRes = await client.execute('SELECT COALESCE(MAX(position), -1) as maxPos FROM gallery_images');
    const maxPos = Number(maxPosRes.rows[0].maxPos);
    const newPosition = maxPos + 1;

    console.log(`Creating gallery image with filename: ${filename}, image length: ${image.length}, position: ${newPosition}`);
    const res = await client.execute({
      sql: 'INSERT INTO gallery_images (image, filename, position) VALUES (?, ?, ?)',
      args: [image, filename, newPosition],
    });
    if (res.lastInsertRowid === undefined) throw new Error('Failed to get last insert row ID');
    const rowIdNum = Number(res.lastInsertRowid);
    if (!Number.isSafeInteger(rowIdNum)) throw new Error('lastInsertRowid is too large to convert safely to number');
    console.log(`Created gallery image with ID: ${rowIdNum}`);
    return rowIdNum;
  } catch (error) {
    console.error('Error creating gallery image:', error);
    throw new Error(`Failed to create gallery image: ${error}`);
  }
}

export async function updateGalleryImage(client: Client, id: number, image: string, filename: string): Promise<void> {
  if (!id || !Number.isInteger(id)) throw new Error('Invalid gallery image ID');
  if (!image || !filename) {
    throw new Error('Image and filename must not be empty');
  }
  if (!image.startsWith('data:image/')) {
    throw new Error('Image must be a valid base64-encoded image (data:image/*;base64,...)');
  }
  try {
    console.log(`Attempting to update gallery image ID ${id} with:`, { filename, image: `base64(...${image.slice(-20)})` });
    
    const res = await client.execute({
      sql: 'UPDATE gallery_images SET image = ?, filename = ? WHERE id = ?',
      args: [image, filename, id],
    });
    
    if (res.rowsAffected === 0) {
      console.warn(`No gallery image found with ID: ${id}`);
      throw new Error(`No gallery image found with ID: ${id}`);
    }
    
    console.log(`Successfully updated gallery image with ID: ${id}`);
    
    // Verify update
    const verify = await client.execute({
      sql: 'SELECT * FROM gallery_images WHERE id = ?',
      args: [id],
    });
    if (verify.rows.length > 0) {
      console.log(`Verified updated gallery image ID ${id}:`, { ...verify.rows[0], image: `base64(...${String(verify.rows[0].image).slice(-20)})` });
    } else {
      console.warn(`Verification failed: No gallery image found after update for ID: ${id}`);
    }
  } catch (error) {
    console.error('Error updating gallery image:', error);
    throw new Error(`Failed to update gallery image: ${error}`);
  }
}

export async function deleteGalleryImage(client: Client, id: number) {
  try {
    const res = await client.execute({
      sql: 'DELETE FROM gallery_images WHERE id = ?',
      args: [id],
    });
    if (res.rowsAffected === 0) throw new Error(`No gallery image found with ID: ${id}`);
    console.log(`Deleted gallery image with ID: ${id}`);
  } catch (error) {
    console.error('Error deleting gallery image:', error);
    throw new Error(`Failed to delete gallery image: ${error}`);
  }
}

// Reorder functions - Move up/down one position
export async function moveClassPosition(client: Client, id: number, direction: 'up' | 'down'): Promise<void> {
  try {
    console.log(`Moving class ${id} ${direction}`);

    // Get the current class
    const currentRes = await client.execute({
      sql: 'SELECT id, position FROM classes WHERE id = ?',
      args: [id],
    });

    if (currentRes.rows.length === 0) {
      throw new Error(`Class with ID ${id} not found`);
    }

    const currentPosition = Number(currentRes.rows[0].position);
    const newPosition = direction === 'up' ? currentPosition - 1 : currentPosition + 1;

    // Find the class at the target position
    const targetRes = await client.execute({
      sql: 'SELECT id, position FROM classes WHERE position = ?',
      args: [newPosition],
    });

    if (targetRes.rows.length === 0) {
      console.log(`No class at position ${newPosition}, cannot move ${direction}`);
      return; // Can't move further in this direction
    }

    const targetId = Number(targetRes.rows[0].id);

    // Swap positions
    await client.execute({
      sql: 'UPDATE classes SET position = ? WHERE id = ?',
      args: [newPosition, id],
    });

    await client.execute({
      sql: 'UPDATE classes SET position = ? WHERE id = ?',
      args: [currentPosition, targetId],
    });

    console.log(`Swapped positions: class ${id} (${currentPosition} -> ${newPosition}), class ${targetId} (${newPosition} -> ${currentPosition})`);
  } catch (error) {
    console.error('Error moving class position:', error);
    throw new Error(`Failed to move class position: ${error}`);
  }
}

export async function moveGalleryImagePosition(client: Client, id: number, direction: 'up' | 'down'): Promise<void> {
  try {
    console.log(`Moving gallery image ${id} ${direction}`);

    // Get the current image
    const currentRes = await client.execute({
      sql: 'SELECT id, position FROM gallery_images WHERE id = ?',
      args: [id],
    });

    if (currentRes.rows.length === 0) {
      throw new Error(`Gallery image with ID ${id} not found`);
    }

    const currentPosition = Number(currentRes.rows[0].position);
    const newPosition = direction === 'up' ? currentPosition - 1 : currentPosition + 1;

    // Find the image at the target position
    const targetRes = await client.execute({
      sql: 'SELECT id, position FROM gallery_images WHERE position = ?',
      args: [newPosition],
    });

    if (targetRes.rows.length === 0) {
      console.log(`No image at position ${newPosition}, cannot move ${direction}`);
      return; // Can't move further in this direction
    }

    const targetId = Number(targetRes.rows[0].id);

    // Swap positions
    await client.execute({
      sql: 'UPDATE gallery_images SET position = ? WHERE id = ?',
      args: [newPosition, id],
    });

    await client.execute({
      sql: 'UPDATE gallery_images SET position = ? WHERE id = ?',
      args: [currentPosition, targetId],
    });

    console.log(`Swapped positions: image ${id} (${currentPosition} -> ${newPosition}), image ${targetId} (${newPosition} -> ${currentPosition})`);
  } catch (error) {
    console.error('Error moving gallery image position:', error);
    throw new Error(`Failed to move gallery image position: ${error}`);
  }
}

export async function moveFaqPosition(client: Client, id: number, direction: 'up' | 'down'): Promise<void> {
  try {
    console.log(`Moving FAQ ${id} ${direction}`);

    // Get the current FAQ
    const currentRes = await client.execute({
      sql: 'SELECT id, position FROM faqs WHERE id = ?',
      args: [id],
    });

    if (currentRes.rows.length === 0) {
      throw new Error(`FAQ with ID ${id} not found`);
    }

    const currentPosition = Number(currentRes.rows[0].position);
    const newPosition = direction === 'up' ? currentPosition - 1 : currentPosition + 1;

    // Find the FAQ at the target position
    const targetRes = await client.execute({
      sql: 'SELECT id, position FROM faqs WHERE position = ?',
      args: [newPosition],
    });

    if (targetRes.rows.length === 0) {
      console.log(`No FAQ at position ${newPosition}, cannot move ${direction}`);
      return; // Can't move further in this direction
    }

    const targetId = Number(targetRes.rows[0].id);

    // Swap positions
    await client.execute({
      sql: 'UPDATE faqs SET position = ? WHERE id = ?',
      args: [newPosition, id],
    });

    await client.execute({
      sql: 'UPDATE faqs SET position = ? WHERE id = ?',
      args: [currentPosition, targetId],
    });

    console.log(`Swapped positions: FAQ ${id} (${currentPosition} -> ${newPosition}), FAQ ${targetId} (${newPosition} -> ${currentPosition})`);
  } catch (error) {
    console.error('Error moving FAQ position:', error);
    throw new Error(`Failed to move FAQ position: ${error}`);
  }
}

export async function moveReviewPosition(client: Client, id: number, direction: 'up' | 'down'): Promise<void> {
  try {
    console.log(`Moving review ${id} ${direction}`);

    // Get the current review
    const currentRes = await client.execute({
      sql: 'SELECT id, position FROM reviews WHERE id = ?',
      args: [id],
    });

    if (currentRes.rows.length === 0) {
      throw new Error(`Review with ID ${id} not found`);
    }

    const currentPosition = Number(currentRes.rows[0].position);
    const newPosition = direction === 'up' ? currentPosition - 1 : currentPosition + 1;

    // Find the review at the target position
    const targetRes = await client.execute({
      sql: 'SELECT id, position FROM reviews WHERE position = ?',
      args: [newPosition],
    });

    if (targetRes.rows.length === 0) {
      console.log(`No review at position ${newPosition}, cannot move ${direction}`);
      return; // Can't move further in this direction
    }

    const targetId = Number(targetRes.rows[0].id);

    // Swap positions
    await client.execute({
      sql: 'UPDATE reviews SET position = ? WHERE id = ?',
      args: [newPosition, id],
    });

    await client.execute({
      sql: 'UPDATE reviews SET position = ? WHERE id = ?',
      args: [currentPosition, targetId],
    });

    console.log(`Swapped positions: review ${id} (${currentPosition} -> ${newPosition}), review ${targetId} (${newPosition} -> ${currentPosition})`);
  } catch (error) {
    console.error('Error moving review position:', error);
    throw new Error(`Failed to move review position: ${error}`);
  }
}