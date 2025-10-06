import { PrismaClient, User } from "@prisma/client";
import bcrypt from 'bcrypt';

const prisma = new PrismaClient();

export class UserRepository {


    async createUser(userData: Omit<User, 'id'>): Promise<User> {
        const hashedPassword = await bcrypt.hash(userData.password, 10);
        const newUser = await prisma.user.create({
            data: {
                ...userData
            },
        });
        return newUser;
    }

    async findByEmail(email: string): Promise<User | null> {
        return prisma.user.findUnique({ where: { email } });
    }
}