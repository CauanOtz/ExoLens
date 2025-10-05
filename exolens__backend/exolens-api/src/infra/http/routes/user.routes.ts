import express, { Request, Response, NextFunction } from 'express';
import { UserController } from '../../../app/controllers/UserController';
import { UserService } from '../../../app/services/UserService';
import { UserRepository } from '../../../app/repositories/UserRepository';
const userRoutes = express.Router();

const userRepository = new UserRepository();
const userController = new UserController(new UserService(userRepository));

/**
 * @swagger
 * components:
 *   schemas:
 *     RegisterUserInput:
 *       type: object
 *       required:
 *         - name
 *         - email
 *         - password
 *       properties:
 *         name:
 *           type: string
 *           description: The user's name.
 *           example: John Doe
 *         email:
 *           type: string
 *           format: email
 *           description: The user's email for login.
 *           example: johndoe@example.com
 *         password:
 *           type: string
 *           format: password
 *           description: Password with at least 6 characters.
 *           example: "123456"
 *     UserResponse:
 *       type: object
 *       properties:
 *         id:
 *           type: string
 *           format: uuid
 *           example: "a1b2c3d4-e5f6-7890-1234-567890abcdef"
 *         name:
 *           type: string
 *           example: John Doe
 *         email:
 *           type: string
 *           format: email
 *           example: johndoe@example.com
 *     LoginResponse:
 *       type: object
 *       properties:
 *         user:
 *           $ref: '#/components/schemas/UserResponse'
 *         token:
 *           type: string
 *           description: JWT token for authentication.
 *           example: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
 */

/**
 * @swagger
 * /api/users/register:
 *   post:
 *     summary: Register a new user
 *     tags: [Users]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/RegisterUserInput'
 *     responses:
 *       201:
 *         description: User created successfully.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/UserResponse'
 *       409:
 *         description: Email is already in use.
 */
userRoutes.post('/register', (req: Request, res: Response, next: NextFunction) => userController.register(req, res, next));



/**
 * @swagger
 * /api/users/login:
 *   post:
 *     summary: Authenticates a user and returns a JWT token
 *     tags: [Users]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *               - password
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *                 example: johndoe@example.com
 *               password:
 *                 type: string
 *                 format: password
 *                 example: "123456"
 *     responses:
 *       200:
 *         description: Login successful.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/LoginResponse'
 *       401:
 *         description: Invalid email or password.
 */
userRoutes.post('/login', (req: Request, res: Response, next: NextFunction) => userController.login(req, res, next));

export { userRoutes };