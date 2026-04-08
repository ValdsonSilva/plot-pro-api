export { };

declare global {
    namespace Express {
        interface Request {
            auth?: {
                userId: string,
                farmId: string,
                role?: string | null,
            },
            validated?: any,
        }
    }
}