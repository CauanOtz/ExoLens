export class AppError extends Error {
    public readonly statusCode: number;

    constructor(message: string, statusCode: number = 400) {
        super(message);
        this.statusCode = statusCode;
    }
}

export class InvalidCredentialsError extends AppError {
    constructor() {
        super('Invalid email or password.', 401);
    }
}

export class EmailInUseError extends AppError {
    constructor() {
        super('This email is already in use.', 409);
    }
}

export class NotFoundError extends AppError {
    constructor(resourceName: string = 'Resource') {
        super(`${resourceName} not found.`, 404);
    }
}
export class UnauthorizedError extends AppError {
    constructor(message: string = 'Unauthorized') {
        super(message, 401);
    }
}
export class BadRequestError extends AppError {
    constructor(message: string = 'Bad Request') {
        super(message, 400);
    }
}