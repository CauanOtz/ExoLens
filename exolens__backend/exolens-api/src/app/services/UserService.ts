import { UserRepository } from '../repositories/UserRepository';
import { RegisterUserDto } from '../validators/userValidator';
import { EmailInUseError, InvalidCredentialsError } from '../../core/errors/AppError';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';

export class UserService {
    constructor(private userRepository: UserRepository) {}


    async registerUser(userData: RegisterUserDto) {
        const existingUser = await this.userRepository.findByEmail(userData.email);

        if (existingUser) {
            throw new EmailInUseError();
        }

        const hashedPassword = await bcrypt.hash(userData.password, 10);
        
        return this.userRepository.createUser({
            name: userData.name,
            email: userData.email,
            password: hashedPassword,
        });
    }

    async loginUser(email: string, password: string) {
        const user = await this.userRepository.findByEmail(email);

        if (!user || !(await bcrypt.compare(password, user.password))) {
            throw new InvalidCredentialsError();
        }

        const jwtSecret = process.env.JWT_SECRET;

        if (!jwtSecret) {
            throw new Error('JWT_SECRET is not defined in environment variables.');
        }

        const token = jwt.sign({ id: user.id }, jwtSecret, { expiresIn: '1d' });

        const { password: _, ...userWithoutPassword } = user;
        return { user: userWithoutPassword, token };
    }
    async logoutUser(userId: string) {
        
        return;
    }
}