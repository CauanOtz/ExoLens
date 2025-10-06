import { Request, Response, NextFunction } from 'express';
import { UserService } from '../services/UserService';

export class UserController {
  
  constructor(private userService: UserService) {}

  async register(req: Request, res: Response, next: NextFunction) {
    try {
      const newUser = await this.userService.registerUser(req.body);
      
      const { password, ...userWithoutPassword } = newUser;

      return res.status(201).json(userWithoutPassword);
    } catch (error) {
      next(error);
    }
  }

  async login(req: Request, res: Response, next: NextFunction) {
    try {
      const { email, password } = req.body;
      const result = await this.userService.loginUser(email, password);
      
      return res.status(200).json(result);
    } catch (error) {
      next(error);
    }
  }
}