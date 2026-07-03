// Third-party module type declarations for packages without native .d.ts files.
// These provide minimal type coverage sufficient for the API codebase under nodenext.

declare module 'class-validator' {
    type ValidationOptions = Record<string, unknown>;
    export function IsString(options?: ValidationOptions): PropertyDecorator;
    export function IsNotEmpty(options?: ValidationOptions): PropertyDecorator;
    export function IsOptional(options?: ValidationOptions): PropertyDecorator;
    export function IsEnum(entity: object, options?: ValidationOptions): PropertyDecorator;
    export function IsBoolean(options?: ValidationOptions): PropertyDecorator;
    export function IsNumber(options?: ValidationOptions): PropertyDecorator;
    export function IsDateString(options?: ValidationOptions): PropertyDecorator;
    export function IsArray(options?: ValidationOptions): PropertyDecorator;
    export function MaxLength(max: number, options?: ValidationOptions): PropertyDecorator;
    export function ValidateNested(options?: ValidationOptions): PropertyDecorator;
    export function IsPositive(options?: ValidationOptions): PropertyDecorator;
    export function IsInt(options?: ValidationOptions): PropertyDecorator;
    export function Max(max: number, options?: ValidationOptions): PropertyDecorator;
    export function Min(min: number, options?: ValidationOptions): PropertyDecorator;
    export function ArrayMinSize(min: number, options?: ValidationOptions): PropertyDecorator;
    export function ArrayMaxSize(max: number, options?: ValidationOptions): PropertyDecorator;
    export function IsObject(options?: ValidationOptions): PropertyDecorator;
    export function Matches(pattern: RegExp, options?: ValidationOptions): PropertyDecorator;
}

declare module 'bullmq' {
    export class Queue {
        add(name: string, data: unknown, opts?: unknown): Promise<unknown>;
        getJob(id: string): Promise<Job | null>;
    }
    export class Job<T = unknown> {
        data: T;
        remove(): Promise<void>;
    }
    export class QueueEvents {}
}
